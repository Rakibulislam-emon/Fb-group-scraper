# Facebook Job Scraper - User Manual & Safety Guide

## 🚨 CRITICAL WARNINGS & SAFETY

This tool simulates human behavior to safely extract data. However, Facebook's anti-bot systems are advanced. **You must follow these rules to avoid account restriction.**

### 1. The "Daily Limit" Rule

- **Limit**: Do not scrape more than **6 groups per day**.
- **Why**: Consistently scraping 20+ groups is obvious bot behavior.
- **Enforcement**: The extension has a built-in counter. If you try to run more, it will warn you or stop.

### 2. The "Cooldown" Rule

- **Limit**: Do not scrape the _same group_ twice within **12 hours**.
- **Why**: Humans don't refresh the same job board every 10 minutes.
- **Enforcement**: The extension remembers when you last scraped a group and will skip it if it's too soon.

### 3. The "Security Check" Trigger

- **What Happens**: If Facebook shows a CAPTCHA, "Confirm it's you", or "Security Check" screen.
- **Automatic Response**: The scraper will **immediately detect this**, stop scraping, close the tab, and **lock itself for 24 hours**.
- **Action**: If this happens, **DO NOT** try to scrape again immediately. Log into Facebook normally and solve the challenge.

---

## 🚀 How It Works (The "Safe Mode" Workflow)

### 1. The Orchestrator (Background Process)

When you click "Start Scraping", the extension generally does NOT run all your links at once.

1.  **Selection**: It looks at your list and picks a **random batch of up to 3 groups**.
2.  **Shuffling**: It randomizes the order (e.g., Group C first, then Group A).
3.  **Scheduling**: It schedules them with delays in between.

### 2. The Human Simulation (The Scraper)

For each group, the scraper acts like a careful user:

1.  **Hesitation**: Waits 1-4 seconds before opening the tab.
2.  **Loading**: Waits 7-10 seconds for the timeline to load.
3.  **Micro-Scrolling**:
    - It doesn't scroll instantly to the bottom.
    - It scrolls down a bit, pauses (to "read"), maybe scrolls up, then continues.
    - This usually takes 20-40 seconds per group.
4.  **Extraction**: It reads the text, author, and date from the visible posts.
5.  **Cleanup**: It closes the tab and waits 10-50 seconds before starting the next group.

---

## 📖 User Guide

### Installation

1.  Go to `chrome://extensions`.
2.  Enable **Developer Mode**.
3.  Click **Load Unpacked** and select this `z:\fb_scraper` folder.

### Configuration

1.  Open the Extension Popup (click the icon in your toolbar).
2.  Click **Settings**.
3.  Paste your Facebook Group URLs (one per line).
    - _Example_: `https://www.facebook.com/groups/123456789/`
4.  Click **Save**.

### Using the Dashboard

1.  Click **Dashboard ↗** in the Popup.
2.  **Search**: Type keywords to filter posts.
3.  **Tech Filter**: Click the **"🔍 Tech Jobs"** button to instantly see React/Next.js/Node jobs.
4.  **Links**: Click **"View ->"** in the table to go to the actual Facebook post.
5.  **Export**: Click **Export CSV** to save your data to Excel.

---

## ⚙️ Technical Details

- **Privacy**: All data is stored **locally** on your computer (`chrome.storage.local`). Nothing is sent to any external server.
- **Storage Limit**: The extension keeps the last **2000 posts**. Older posts are automatically removed to keep your browser fast.
- **Deduplication**: If it sees a post ID it has already scraped, it updates the data but doesn't create a duplicate entry.
