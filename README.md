# FB Job Scraper - Chrome Extension

A powerful yet **safe** Chrome extension that scrapes job posts from Facebook Groups with intelligent anti-detection measures. Designed to mimic human behavior while respecting Facebook's terms of service and security systems.

## 🎯 Features

- **Safe Scraping**: Implements human-like behavior patterns to avoid detection
- **Daily Limits**: Enforces safety quotas (max 6 groups/day)
- **Cooldown System**: Prevents re-scraping the same group within 12 hours
- **Security Detection**: Automatically detects CAPTCHAs and security checks, locks itself for 24 hours if triggered
- **Local Storage**: All data stored locally on your computer—nothing sent to external servers
- **Dashboard**: Beautiful UI to search, filter, and export job posts
- **Tech Filter**: Quick-filter for tech jobs (React, Next.js, Node.js, etc.)
- **CSV Export**: Export job data to Excel for further analysis
- **Deduplication**: Automatically handles duplicate posts
- **Smart Scheduling**: Randomizes scraping order and delays between groups

## 📦 What's Included

```
├── background.js           # Main orchestrator & safety logic
├── content.js             # Facebook page scraper
├── utils.js               # Utility functions
├── manifest.json          # Chrome extension configuration
├── MANUAL.md              # Detailed user manual
│
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup controller
│   └── popup.css          # Popup styles
│
├── options/
│   ├── options.html       # Settings page
│   ├── options.js         # Settings controller
│   └── options.css        # Settings styles
│
├── dashboard/
│   ├── index.html         # Dashboard UI
│   ├── dashboard.js       # Dashboard controller
│   ├── dashboard.css      # Dashboard styles
│   ├── export.js          # CSV export functionality
│   └── lib/               # React libraries
│
├── icons/
│   ├── generate_icons.py  # Icon generator script
│   └── ICON_INSTRUCTIONS.txt
│
└── lib/
    ├── tailwind.css       # Styling framework
    └── react*.js          # React libraries
```

## ⚡ Quick Start

### 1. Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load Unpacked**
4. Select the `z:\fb_scraper` folder
5. The extension appears in your toolbar

### 2. Configuration

1. Click the **FB Scraper** icon in your toolbar
2. Click **Settings**
3. Paste Facebook Group URLs (one per line):
   ```
   https://www.facebook.com/groups/123456789/
   https://www.facebook.com/groups/987654321/
   ```
4. Click **Save**

### 3. Start Scraping

1. Click the **FB Scraper** icon
2. Click **Start Scraping**
3. The extension will:
   - Pick a random batch of up to 3 groups
   - Randomize the order
   - Add delays between each group
   - Simulate human-like scrolling and reading
4. Monitor progress in the status indicator

### 4. View Results

1. Click **Dashboard ↗** in the popup
2. Browse, search, and filter job posts
3. Use **🔍 Tech Jobs** button for tech-specific positions
4. Click **View ->** to go to the actual Facebook post
5. Click **Export CSV** to download your data

## 🚨 Safety Guidelines

### The "Daily Limit" Rule
- **Max 6 groups per day**
- Scraping 20+ groups is obvious bot behavior
- The extension enforces this automatically

### The "Cooldown" Rule
- **Don't scrape the same group twice within 12 hours**
- Humans don't refresh job boards every 10 minutes
- The extension skips recently-scraped groups

### The "Security Check" Trigger
If Facebook shows:
- CAPTCHA
- "Confirm it's you" dialog
- Security challenge screen

**The scraper will automatically:**
1. Detect the security check
2. Stop scraping immediately
3. Close the tab
4. Lock itself for 24 hours

**What you should do:**
- Don't try to scrape again immediately
- Log into Facebook normally and solve the challenge
- Wait 24 hours before resuming

## 🔧 Technical Details

### Architecture

| Component | Role |
|-----------|------|
| **background.js** | Orchestrates scraping, enforces safety quotas, manages timers |
| **content.js** | Injects into Facebook pages, performs actual scraping |
| **utils.js** | Shared utilities (delays, logging, timestamp helpers) |
| **popup.js** | Extension popup UI & user controls |
| **options.js** | Settings page for URL management |
| **dashboard.js** | Data visualization and search |
| **export.js** | CSV export functionality |

### Safety Mechanisms

1. **Rate Limiting**: Groups are scheduled with 10-50 second delays
2. **Human Simulation**: 
   - 1-4 second hesitation before opening tabs
   - 7-10 second load times
   - Micro-scrolling with pauses (20-40 seconds per group)
3. **Security Detection**: Monitors for CAPTCHAs and blocks
4. **Quota Management**: Daily and per-group cooldown tracking
5. **Deduplication**: Checks post IDs before inserting

### Data Storage

- **Location**: Browser's local storage (`chrome.storage.local`)
- **Limit**: Keeps last 2,000 posts (auto-removes older entries)
- **Privacy**: 100% local—nothing sent to external servers
- **Persistence**: Data survives browser restarts

### Configuration

```javascript
const CONFIG = {
  dailyGroupLimit: 6,           // Max groups per day
  perGroupCooldownHours: 12,    // Cooldown between same group
  minInterGroupDelay: 10000,    // 10 seconds between groups
  longBreakEvery: 3,            // Take break after 3 groups
  globalBackoffOnDetect: 24,    // 24 hours if security detected
};
```

## 📊 Dashboard Features

### Search
- Filter posts by keywords
- Real-time search across title and description

### Tech Filter
- Quick button to show tech jobs
- Looks for keywords: React, Next.js, Node.js, Express, Vue, Angular, TypeScript, etc.

### Export
- Download all visible posts as CSV
- Compatible with Excel, Google Sheets, etc.

### Navigation
- Click **View ->** to jump to the original Facebook post
- Post links maintained for reference

## 🛑 Troubleshooting

### Issue: Extension won't start scraping
- Check that you've added at least one Facebook Group URL in Settings
- Verify you're logged into Facebook

### Issue: Limited results after scraping
- Facebook may be rate-limiting your account
- Wait 24 hours before scraping again
- Check the status indicator for any security blocks

### Issue: Same posts appearing multiple times
- The deduplication system should prevent this
- Try exporting and checking—duplicates are usually just data refreshes

### Issue: Scraper stopped mid-run
- Facebook likely detected automated activity
- The 24-hour global backoff has been activated
- Log into Facebook normally and complete any security checks
- Wait 24 hours to resume

## 📝 For Developers

### Project Structure
- **Manifest v3**: Uses Chrome's latest extension standard
- **Tailwind CSS**: For styling (includes lib files)
- **React (Included)**: For dashboard components
- **Vanilla JS**: Main logic without external dependencies

### Key Files to Modify

| File | Purpose |
|------|---------|
| `CONFIG` in `background.js` | Adjust safety limits |
| `startSafeOrchestration()` | Modify scraping logic |
| `dashboard/dashboard.js` | Customize dashboard UI |
| `utils.js` | Add helper functions |

### Building Custom Icons
```bash
cd icons/
python generate_icons.py
```

## 📜 Legal & Ethical Notes

- **Terms of Service**: This tool simulates user behavior to comply with human-like usage
- **Data Privacy**: All data is stored locally—no external servers
- **Rate Limits**: Built-in safeguards prevent abuse of Facebook's systems
- **Use Responsibly**: Respect Facebook's terms and use for legitimate job-seeking purposes

## 🚀 Version History

### v1.0.0
- Initial release
- Safe Mode orchestration
- Daily limits & cooldown system
- Dashboard with search & filter
- CSV export functionality

## 📧 Support

For issues or questions, refer to:
- `MANUAL.md` - Detailed user manual & safety guide
- Check browser console (F12) for error logs
- Verify extension permissions in `chrome://extensions`

---

**Built with safety & automation in mind.** Happy job hunting! 🎯
