// Background Service Worker for FB Job Scraper (Safe Mode)
try {
  importScripts("utils.js");
} catch (e) {
  console.log(e);
}

// State Management
let currentState = {
  isScraping: false,
  currentGroupIndex: 0,
  groups: [],
  currentTabId: null,
  totalGroups: 0,
  currentGroupUrl: "",
};

// Safe defaults
const CONFIG = {
  dailyGroupLimit: 6,
  perGroupCooldownHours: 12,
  minInterGroupDelay: 10000,
  longBreakEvery: 3,
  globalBackoffOnDetect: 24, // hours
};

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SCRAPING") {
    startSafeOrchestration(sendResponse);
    return true;
  }
  if (request.action === "STOP_SCRAPING") {
    stopScraping();
    sendResponse({ status: "stopped" });
  }
  if (request.action === "GET_STATUS") {
    sendResponse(currentState);
  }
  if (request.action === "UPDATE_STATUS") {
    currentState.statusMessage = request.message;
    broadcastStatus();
    return;
  }
  if (request.action === "SCRAPE_ERROR") {
    console.error("Error in content script:", request.error);
    if (currentState.currentTabId) {
      setTimeout(() => {
        chrome.tabs.remove(currentState.currentTabId).catch(() => {});
      }, 5000);
    }
  }
});

// --- Quota & Backoff Logic ---

function setGlobalBackoff(hours) {
  const until = Date.now() + (hours || 12) * 3600 * 1000;
  chrome.storage.local.set({ globalBackoffUntil: until });
  console.warn("Global backoff set until", new Date(until).toISOString());
}

function canRunNow(groups, callback) {
  chrome.storage.local.get(
    ["dailyRunCount", "dailyRunDate", "groupLastRun", "globalBackoffUntil"],
    function (res) {
      const today = new Date().toISOString().slice(0, 10);
      let dailyRunDate = res.dailyRunDate || null;
      let dailyRunCount = res.dailyRunCount || 0;

      if (dailyRunDate !== today) {
        dailyRunCount = 0;
      }

      // Daily Limit
      if (dailyRunCount >= CONFIG.dailyGroupLimit)
        return callback(false, "daily_quota_reached");

      // Global Backoff
      const backoff = res.globalBackoffUntil || 0;
      if (Date.now() < backoff)
        return callback(false, "global_backoff_active", backoff);

      // Filter groups by cooldown
      const groupLast = res.groupLastRun || {};
      const validGroups = groups.filter((g) => {
        const last = groupLast[g] || 0;
        return Date.now() - last > CONFIG.perGroupCooldownHours * 3600 * 1000;
      });

      if (validGroups.length === 0 && groups.length > 0)
        return callback(false, "all_groups_cooldown");

      callback(true, null, validGroups);
    }
  );
}

function recordRun(groupUrls) {
  chrome.storage.local.get(
    ["dailyRunCount", "dailyRunDate", "groupLastRun"],
    function (res) {
      const today = new Date().toISOString().slice(0, 10);
      let dailyRunDate = res.dailyRunDate || null;
      let dailyRunCount = res.dailyRunCount || 0;

      if (dailyRunDate !== today) {
        dailyRunCount = 0;
        dailyRunDate = today;
      }
      dailyRunCount += groupUrls.length; // Count groups processed

      const gl = res.groupLastRun || {};
      const now = Date.now();
      groupUrls.forEach((u) => {
        gl[u] = now;
      });

      chrome.storage.local.set({
        dailyRunCount,
        dailyRunDate,
        groupLastRun: gl,
      });
    }
  );
}

// --- Main Safe Orchestration ---

async function startSafeOrchestration(sendResponse) {
  if (currentState.isScraping) {
    sendResponse({ error: "Already scraping" });
    return;
  }

  const data = await chrome.storage.sync.get({ groupLinks: [] });
  console.log("=== GROUP DEBUG ===");
  console.log("All configured groups:", data.groupLinks);
  console.log("Total configured:", data.groupLinks?.length || 0);

  if (!data.groupLinks || data.groupLinks.length === 0) {
    sendResponse({ error: "No groups configured" });
    return;
  }

  // Check availability
  canRunNow(data.groupLinks, (canRun, reason, validGroups) => {
    console.log("After cooldown filter:", validGroups);
    console.log("Valid groups count:", validGroups?.length || 0);
    console.log("Reason if blocked:", reason);

    if (!canRun) {
      sendResponse({ error: `Start failed: ${reason}` });
      return;
    }

    // Shuffle & Pick max 4 groups per session (increased from 3)
    let toRun = shuffleArray(validGroups);
    toRun = toRun.slice(0, 4); // Max 4 groups per run session

    console.log("Groups to scrape this session:", toRun);
    console.log("Count to scrape:", toRun.length);

    currentState = {
      isScraping: true,
      currentGroupIndex: 0,
      groups: toRun,
      totalGroups: toRun.length,
      currentTabId: null,
      currentGroupUrl: "",
      statusMessage: "Starting...",
    };

    sendResponse({ started: true });
    broadcastStatus();

    sendNotification(
      "Scraper Started",
      `Starting safe scrape of ${toRun.length} groups.`
    );

    runSequence(toRun);
  });
}

async function runSequence(groups) {
  try {
    for (let i = 0; i < groups.length; i++) {
      if (!currentState.isScraping) break;

      const url = groups[i];
      currentState.currentGroupIndex = i;
      currentState.currentGroupUrl = url;
      currentState.statusMessage = `Scraping Group ${i + 1}/${
        groups.length
      }...`;
      broadcastStatus();

      // 1. No Initial Wait (Immediate Start for UX)
      // await waitWithCountdown(3000);

      try {
        // 2. Open Tab
        console.log(`Opening tab for ${url}`);
        const tab = await chrome.tabs.create({ url: url, active: true });
        currentState.currentTabId = tab.id;

        // 3. Wait for load (safe 7-10s)
        await randomDelayMs(7000, 10000);

        // 4. Inject script (if not auto-injected manifest) & PING
        // Manifest injects, so we try pinging
        const ready = await pingTab(tab.id);
        if (ready) {
          // 5. Start Extraction
          const result = await scrapeGroup(tab.id);

          // 6. Handle Security Check
          if (result._detection) {
            console.warn("Security Detected:", result._detection);
            setGlobalBackoff(CONFIG.globalBackoffOnDetect);
            // We stop here, the finally block will handle cleanup
            return;
          }

          // 7. Store Data
          console.log("=== SAVE CHECKPOINT ===");
          console.log("Result object:", result);
          console.log("Result.posts exists?", !!result.posts);
          console.log(
            "Result.posts length:",
            result.posts ? result.posts.length : 0
          );

          if (result.posts) {
            try {
              console.log(
                "Calling storePosts with",
                result.posts.length,
                "posts..."
              );
              await storePosts(result.posts);
              console.log("✓ storePosts completed successfully");
            } catch (storageError) {
              console.error("❌ STORAGE FAILED:", storageError);
              sendNotification(
                "Storage Error",
                `Failed to save posts: ${storageError.message}`
              );
            }
          } else {
            console.warn("⚠️ result.posts is empty or undefined!");
          }

          // Record success for this group
          recordRun([url]);

          sendNotification(
            "Group Finished",
            `Scraped Group ${i + 1}/${groups.length}. Found ${
              result.posts ? result.posts.length : 0
            } posts.`
          );
        } else {
          console.error("Tab ping failed");
          sendNotification(
            "Connection Error",
            "Could not connect to Facebook tab."
          );
        }
      } catch (e) {
        console.error("Scrape failed for group", url, e);
        sendNotification(
          "Group Error",
          `Failed to scrape group ${i + 1}: ${e.message}`
        );
      }

      // 8. Close Tab
      if (currentState.currentTabId) {
        chrome.tabs.remove(currentState.currentTabId).catch(() => {});
        currentState.currentTabId = null;
      }

      // 9. Inter-group Delay
      if (i < groups.length - 1) {
        // MVP Rule: 12-25 seconds delay
        const delay = rand(12000, 25000);
        await waitWithCountdown(delay);

        // Long break every 3 (though we cap at 3, useful if cap increases)
        if ((i + 1) % CONFIG.longBreakEvery === 0) {
          sendNotification("Long Break", "Taking a safety break...");
          await waitWithCountdown(rand(90000, 180000));
        }
      }
    }
  } catch (err) {
    console.error("Critical Sequence Error", err);
    sendNotification(
      "System Error",
      "The scraper sequence crashed: " + err.message
    );
  } finally {
    currentState.statusMessage = "✅ Session Complete! Data Saved.";
    broadcastStatus();

    // 1. Notify
    sendNotification(
      "Session Complete",
      "All groups processed. Opening Dashboard..."
    );

    // 2. Open Dashboard automatically (use proper Chrome extension URL)
    setTimeout(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("dashboard/index.html"),
      });
    }, 500);

    // 3. Stop
    stopScraping();
  }
}

function pingTab(tabId) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      chrome.tabs.sendMessage(tabId, { action: "PING" }, (r) => {
        if (chrome.runtime.lastError) return;
        if (r && r.status === "READY") {
          clearInterval(interval);
          resolve(true);
        }
      });
      attempts++;
      if (attempts > 15) {
        // 15s timeout
        clearInterval(interval);
        resolve(false);
      }
    }, 1000);
  });
}

function scrapeGroup(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { action: "START_EXTRACTION" });

    // Listener for result
    const listener = (msg) => {
      if (msg.action === "SCRAPE_COMPLETE" || msg.type === "SCRAPED_POSTS") {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(msg.payload || {});
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    // Safety timeout 3 mins (Deep Scroll takes time)
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      resolve({ error: "TIMEOUT" });
    }, 180000);
  });
}

async function storePosts(newPosts) {
  console.log(`=== STORAGE DEBUG ===`);
  console.log(`Attempting to store ${newPosts.length} posts`);

  const local = await chrome.storage.local.get({ posts: [], postIDs: [] });
  let storedPosts = local.posts;
  let storedIDs = new Set(local.postIDs);

  console.log(
    `Current storage: ${storedPosts.length} posts, ${storedIDs.size} IDs`
  );

  let added = 0;
  newPosts.forEach((p) => {
    if (!storedIDs.has(p.id)) {
      storedIDs.add(p.id);
      storedPosts.push(p);
      added++;
    }
  });

  if (storedPosts.length > 2000) storedPosts = storedPosts.slice(-2000); // Storage cap

  await chrome.storage.local.set({
    posts: storedPosts,
    postIDs: Array.from(storedIDs),
  });

  console.log(`✓ Stored ${added} new posts. Total now: ${storedPosts.length}`);
}

function sendNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: title,
    message: message,
    priority: 2,
  });
}

function stopScraping() {
  currentState.isScraping = false;

  if (currentState.currentTabId) {
    console.log("Force closing tab on stop:", currentState.currentTabId);
    chrome.tabs.remove(currentState.currentTabId).catch(() => {});
    currentState.currentTabId = null;
  }

  broadcastStatus();
  sendNotification(
    "Scraper Stopped",
    "The scraping session has explicitly stopped."
  );
}

async function waitWithCountdown(ms) {
  const seconds = Math.ceil(ms / 1000);
  for (let i = seconds; i > 0; i--) {
    if (!currentState.isScraping) break; // Check stop flag
    currentState.statusMessage = `Waiting ${i}s for next group...`;
    broadcastStatus();
    await new Promise((r) => setTimeout(r, 1000));
  }
  currentState.statusMessage = "Resuming...";
  broadcastStatus();
}

function broadcastStatus() {
  chrome.runtime
    .sendMessage({ type: "STATUS_UPDATE", payload: currentState })
    .catch(() => {});
}
