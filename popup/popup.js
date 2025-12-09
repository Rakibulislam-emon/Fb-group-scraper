document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startScrape");
  const stopBtn = document.getElementById("stopScrape");
  const dashboardBtn = document.getElementById("openDashboard");
  const optionsBtn = document.getElementById("openOptions");
  const statusText = document.getElementById("statusText");
  const statusIndicator = document.getElementById("statusIndicator");
  const progressInfo = document.getElementById("progressInfo");
  const currentGroupSpan = document.getElementById("currentGroup");
  const totalGroupsSpan = document.getElementById("totalGroups");

  // Check if groups are configured
  chrome.storage.sync.get({ groupLinks: [] }, (items) => {
    if (items.groupLinks.length === 0) {
      statusText.textContent = "No groups configured!";
      startBtn.disabled = true;
      startBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  });

  dashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "dashboard/index.html" });
  });

  optionsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  startBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "START_SCRAPING" }, (response) => {
      if (response && response.started) {
        updateUI("scraping");
      } else if (response && response.error) {
        statusText.textContent = response.error;
      }
    });
  });

  stopBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "STOP_SCRAPING" });
    updateUI("idle");
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "STATUS_UPDATE") {
      updateStatus(msg.payload);
    }
  });

  chrome.runtime.sendMessage({ action: "GET_STATUS" }, (response) => {
    if (response) {
      updateStatus(response);
    }
  });

  function updateStatus(state) {
    if (state.isScraping) {
      updateUI("scraping");
      currentGroupSpan.textContent = state.currentGroupIndex + 1;
      totalGroupsSpan.textContent = state.totalGroups;
      progressInfo.style.display = "block";

      if (state.statusMessage) {
        statusText.textContent = state.statusMessage;
      } else {
        statusText.textContent = `Scraping: ${
          state.currentGroupUrl
            ? "..." + state.currentGroupUrl.slice(-20)
            : "Initializing..."
        }`;
      }
    } else {
      updateUI("idle");
      progressInfo.style.display = "none";

      // Check if just completed (has completion message)
      if (state.statusMessage && state.statusMessage.includes("Complete")) {
        statusText.textContent = "✅ Done! Check Dashboard";
        statusText.className = "text-green-600 font-bold";
        // Auto-reset after 5 seconds
        setTimeout(() => {
          statusText.textContent = "Ready to scrape";
          statusText.className = "";
        }, 5000);
      } else {
        statusText.textContent = "Ready to scrape";
      }
    }
  }

  function updateUI(mode) {
    if (mode === "scraping") {
      startBtn.disabled = true;
      stopBtn.disabled = false;

      statusIndicator.className =
        "w-2.5 h-2.5 rounded-full mr-2.5 bg-green-500 shadow-sm"; // Active

      startBtn.classList.add("hidden");
      stopBtn.classList.remove("hidden");
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;

      statusIndicator.className = "w-2.5 h-2.5 rounded-full mr-2.5 bg-gray-400"; // Disabled/Idle

      startBtn.classList.remove("hidden");
      stopBtn.classList.add("hidden");
    }
  }
});
