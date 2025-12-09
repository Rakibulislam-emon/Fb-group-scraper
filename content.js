// Safe Content Script with Deep Scroll & Ranking

// Listen for messages from Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PING") {
    sendResponse({ status: "READY" });
  }

  if (request.action === "START_EXTRACTION") {
    startSafeScrape();
  }
});

// Visual On-Page Status Indicator
function showPageStatus(message, type = "info") {
  let banner = document.getElementById("fb-scraper-banner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "fb-scraper-banner";
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      padding: 12px 20px;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(banner);
  }

  const colors = {
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
  };

  banner.style.backgroundColor = colors[type] || colors.info;
  banner.textContent = "🤖 FB Scraper: " + message;
}

async function startSafeScrape() {
  try {
    console.log("FB Scraper v2.0: Starting safe deep scrape...");
    showPageStatus("Starting Scraper...", "info");

    // Load user-configured keywords from Settings
    await loadKeywords();

    chrome.runtime.sendMessage({
      action: "UPDATE_STATUS",
      message: "Waiting for Feed...",
    });

    // 0. Wait for Feed to Load (Max 10s)
    showPageStatus("Waiting for page to load...", "info");
    await waitForFeed();
    showPageStatus("Page loaded! Starting scrape...", "success");

    // 1. Check for Interstitials immediately
    const detection = detectInterstitial();
    if (detection) {
      console.warn("Interstitial detected:", detection);
      showPageStatus(
        "⚠️ Security Check Detected! Stopping for safety.",
        "error"
      );
      reportResult({ _detection: { type: detection } });
      return;
    }

    // 2. Deep Human Scroll Loop (15-25 cycles for production)
    showPageStatus("Scrolling through posts... (Takes ~1-2 mins)", "info");
    chrome.runtime.sendMessage({
      action: "UPDATE_STATUS",
      message: "Deep Scrolling (Safe Mode)...",
    });
    await deepHumanScroll();

    // 3. Extract & Rank posts
    showPageStatus("Analyzing and ranking posts...", "warning");
    chrome.runtime.sendMessage({
      action: "UPDATE_STATUS",
      message: "Analyzing & Ranking Posts...",
    });
    const posts = extractAndRankPosts();
    console.log(`Found ${posts.length} posts.`);

    if (posts.length === 0) {
      console.warn(
        "FB Scraper: ZERO posts found. Check selectors or page load."
      );
      showPageStatus(
        `⚠️ Found 0 posts! Page might not be loaded correctly.`,
        "error"
      );
      // Alert the user via report
      reportResult({ posts: [], error: "ZERO_POSTS_FOUND" });
      return;
    }

    showPageStatus(
      `✅ Success! Found ${posts.length} posts. Saving...`,
      "success"
    );
    reportResult({ posts: posts });

    setTimeout(() => {
      const banner = document.getElementById("fb-scraper-banner");
      if (banner) banner.remove();
    }, 3000);
  } catch (err) {
    console.error("Content Script Crash:", err);
    showPageStatus(`❌ Error: ${err.message}`, "error");
    reportResult({ error: err.message });
    chrome.runtime.sendMessage({
      action: "UPDATE_STATUS",
      message: "Error: " + err.message,
    });
  }
}

function reportResult(payload) {
  console.log("=== REPORT RESULT ===");
  console.log("Payload:", payload);

  // Send message to background (original method)
  chrome.runtime.sendMessage({
    action: "SCRAPE_COMPLETE",
    payload: payload,
  });

  // BACKUP: Also save directly to storage from content script
  if (payload.posts && payload.posts.length > 0) {
    console.log(
      "BACKUP SAVE: Saving",
      payload.posts.length,
      "posts directly to storage..."
    );

    chrome.storage.local.get({ posts: [], postIDs: [] }, (local) => {
      let storedPosts = local.posts || [];
      let storedIDs = new Set(local.postIDs || []);

      let added = 0;
      payload.posts.forEach((p) => {
        if (p.id && !storedIDs.has(p.id)) {
          storedIDs.add(p.id);
          storedPosts.push(p);
          added++;
        }
      });

      if (storedPosts.length > 2000) storedPosts = storedPosts.slice(-2000);

      chrome.storage.local.set(
        {
          posts: storedPosts,
          postIDs: Array.from(storedIDs),
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("❌ BACKUP SAVE FAILED:", chrome.runtime.lastError);
          } else {
            console.log(
              "✅ BACKUP SAVE SUCCESS: Added",
              added,
              "posts. Total now:",
              storedPosts.length
            );
            showPageStatus(`✅ Saved ${added} posts to storage!`, "success");
          }
        }
      );
    });
  }
}

async function waitForFeed() {
  return new Promise((resolve) => {
    const check = () => {
      if (
        document.querySelector('div[role="feed"]') ||
        document.querySelectorAll('div[role="article"]').length > 3
      ) {
        resolve();
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
    setTimeout(resolve, 10000); // 10s max wait, then proceed anyway
  });
}

// --- Deep Human Scroll Engine ---
async function deepHumanScroll() {
  // Scroll Count: 15-25 times (Deep Production Scrape ~1.5 mins)
  const sessions = rand(15, 25);
  console.log(`Deep Scroll: Target ${sessions} cycles.`);

  for (let i = 0; i < sessions; i++) {
    if (detectInterstitial()) break;

    // Random scroll length (varied)
    const distance = rand(400, 1000);
    window.scrollBy({ top: distance, behavior: "smooth" });

    // Random micro-delay (400ms - 1500ms)
    await randomDelayMs(400, 1500);

    // Every 5 scrolls, take a LONG pause (4-7s) to mimic reading/thinking
    if ((i + 1) % 5 === 0) {
      console.log("Taking a long pause...");
      await randomDelayMs(4000, 7000);
    }

    // Occasional small backward scroll (re-reading)
    if (Math.random() < 0.15) {
      window.scrollBy({ top: -rand(100, 300), behavior: "smooth" });
      await randomDelayMs(600, 1200);
    }
  }

  // Final settle before extraction
  await randomDelayMs(2000, 4000);
}

// --- Ranking & Extraction Engine ---

// Default Keywords (optimized for MERN/Frontend Developers)
const DEFAULT_KEYWORDS = {
  tech: "react, reactjs, next, nextjs, node, nodejs, mern, mongodb, express, javascript, typescript, frontend, front-end, full stack, fullstack, web developer, software engineer, ui developer, html, css, tailwind, redux, api, graphql, developer, programmer",
  hiring:
    "hiring, looking for, we need, urgent, immediately, asap, vacancy, opportunity, remote, work from home, wfh, worldwide, apply now, send cv, send resume, dm me, recruiter, join our team, position available, job opening",
  money:
    "$, usd, k/month, per month, monthly, salary, budget, package, hourly, rate, compensation, paid, negotiable, competitive",
};

// Runtime keyword storage (loaded from chrome.storage.sync)
let KEYWORDS_TECH = [];
let KEYWORDS_HIRING = [];
let KEYWORDS_MONEY = [];

// Load keywords from storage
async function loadKeywords() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ keywords: DEFAULT_KEYWORDS }, (items) => {
      const kw = items.keywords || DEFAULT_KEYWORDS;

      KEYWORDS_TECH = (kw.tech || DEFAULT_KEYWORDS.tech)
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      KEYWORDS_HIRING = (kw.hiring || DEFAULT_KEYWORDS.hiring)
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      KEYWORDS_MONEY = (kw.money || DEFAULT_KEYWORDS.money)
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      console.log(
        `Loaded ${KEYWORDS_TECH.length} tech, ${KEYWORDS_HIRING.length} hiring, ${KEYWORDS_MONEY.length} money keywords`
      );
      resolve();
    });
  });
}

function calculateScore(text) {
  let score = 0;
  let matchedKeywords = [];
  const lower = text.toLowerCase();

  // 1. Hiring Intent (+2)
  if (KEYWORDS_HIRING.some((k) => lower.includes(k))) score += 2;

  // 2. Tech Keywords (+2 each match, max +6)
  let techCount = 0;
  KEYWORDS_TECH.forEach((k) => {
    if (lower.includes(k)) {
      techCount++;
      if (!matchedKeywords.includes(k)) matchedKeywords.push(k);
    }
  });
  score += Math.min(techCount, 3) * 2;

  // 3. Salary/Budget (+1)
  if (KEYWORDS_MONEY.some((k) => lower.includes(k))) score += 1;

  // 4. Content Length (+1 if meaningful, >20 words)
  if (text.split(" ").length > 20) score += 1;

  return { score, matchedKeywords };
}

function extractAndRankPosts() {
  let posts = [];
  const seenIds = new Set();

  // Strategy 1: Standard Role Feed
  const feed = document.querySelector('div[role="feed"]');
  let candidates = feed ? Array.from(feed.children) : [];

  // Strategy 2: Role Articles (if feed missing)
  if (candidates.length === 0) {
    candidates = Array.from(document.querySelectorAll('div[role="article"]'));
  }

  // Strategy 3: Common hashed class (fallback)
  if (candidates.length === 0) {
    // x1yztbdb is a common wrapper for feed items in current FB layout
    candidates = Array.from(document.querySelectorAll("div.x1yztbdb"));
  }

  // Strategy 4: Generic "UserContent" wrapper (Legacy/Mobile)
  if (candidates.length === 0) {
    candidates = Array.from(
      document.querySelectorAll('div[data-ad-preview="message"]')
    ).map(
      (el) =>
        el.closest('div[role="article"]') || el.parentElement.parentElement
    );
    // Remove nulls/duplicates
    candidates = candidates.filter((c) => c);
  }

  console.log(`Extraction: Found ${candidates.length} candidate nodes.`);

  candidates.forEach((node) => {
    if (!node.innerText) return;
    const p = parsePost(node);
    if (p && !seenIds.has(p.id)) {
      // Calculate Score & Keywords
      const analysis = calculateScore(p.text);
      p.score = analysis.score;
      p.matchedKeywords = analysis.matchedKeywords;

      seenIds.add(p.id);
      posts.push(p);
    }
  });

  // Zero Posts Diagnostic
  if (posts.length === 0) {
    const debugInfo = {
      url: window.location.href,
      bodyLen: document.body.innerText.length,
      candidates: candidates.length,
      feedFound: !!feed,
      rolesFound: document.querySelectorAll('div[role="article"]').length,
    };
    console.warn("DIAGNOSTIC ZERO POSTS:", debugInfo);

    // Visual Alert for User (Temporary Debug)
    // alert(`FB Scraper Diagnostic: Found 0 Posts. \nFeed Detected: ${!!feed}\nCandidates: ${candidates.length}\n Is page loaded?`);
  }

  // Sort by Score immediately (Descending)
  return posts.sort((a, b) => b.score - a.score);
}

function parsePost(node) {
  try {
    let id = null;
    let postUrl = null;

    // URL Extraction
    const links = node.querySelectorAll("a");
    for (let link of links) {
      const h = link.href;
      if (h.includes("/posts/") || h.includes("/permalink/")) {
        postUrl = h;
        const urlObj = new URL(postUrl);
        postUrl = urlObj.origin + urlObj.pathname;
        break;
      }
    }

    // ID Extraction
    if (postUrl) {
      const m =
        postUrl.match(/\/posts\/(\d+)/) || postUrl.match(/\/permalink\/(\d+)/);
      if (m) id = m[1];
    }

    if (!id) {
      const dataFtNode = node.querySelector("[data-ft]");
      if (dataFtNode) {
        try {
          const json = JSON.parse(dataFtNode.getAttribute("data-ft"));
          if (json.top_level_post_id) id = json.top_level_post_id;
        } catch (e) {}
      }
    }

    // Fallback Link Construction
    if (id && !postUrl) {
      const groupMatch = window.location.href.match(/groups\/([^/]+)/);
      if (groupMatch) {
        postUrl = `https://www.facebook.com/groups/${groupMatch[1]}/posts/${id}/`;
      }
    }

    if (!id) return null;

    // Content
    const contentNode =
      node.querySelector('[data-ad-preview="message"]') ||
      node.querySelector('div[dir="auto"]') ||
      node;
    let text = contentNode.innerText || "";
    text = text.replace(/\s+/g, " ").trim();
    if (text.length < 10) return null;

    // Author
    let author = "Unknown";
    const authorNode = node.querySelector("strong, h2, h3");
    if (authorNode) author = authorNode.innerText.split("\n")[0];

    return {
      id,
      text,
      author,
      url: postUrl || "N/A",
      timestamp: Date.now(),
    };
  } catch (e) {
    return null;
  }
}

// --- Detection ---
function detectInterstitial() {
  try {
    const bodyText = (
      (document.body && document.body.innerText) ||
      ""
    ).toLowerCase();
    if (!bodyText || bodyText.length < 50) return "blank";

    const triggers = [
      "security check",
      "confirm it's you",
      "captcha",
      "challenge",
      "access denied",
      "suspicious activity",
      "checkpoint",
      "log in to continue",
    ];
    for (const t of triggers) {
      if (bodyText.includes(t)) return "interstitial";
    }

    if (
      document.querySelector("form#checkpoint_recovery_form") ||
      document.querySelector("div[role='dialog'] img[alt*='captcha']")
    )
      return "interstitial";

    return null;
  } catch (e) {
    return "unknown";
  }
}
