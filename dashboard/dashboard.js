const { useState, useEffect, useMemo, createElement: h } = React;

// Default Keywords (optimized for MERN/Frontend Developers)
const DEFAULT_KEYWORDS = {
  tech: "react, reactjs, next, nextjs, node, nodejs, mern, mongodb, express, javascript, typescript, frontend, front-end, full stack, fullstack, web developer, software engineer, ui developer, html, css, tailwind, redux, api, graphql, developer, programmer",
  hiring:
    "hiring, looking for, we need, urgent, immediately, asap, vacancy, opportunity, remote, work from home, wfh, worldwide, apply now, send cv, send resume, dm me, recruiter, join our team, position available, job opening",
  money:
    "$, usd, k/month, per month, monthly, salary, budget, package, hourly, rate, compensation, paid, negotiable, competitive",
};

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [hideLowQuality, setHideLowQuality] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [groupLinks, setGroupLinks] = useState("");
  const [techKeywords, setTechKeywords] = useState(DEFAULT_KEYWORDS.tech);
  const [hiringKeywords, setHiringKeywords] = useState(DEFAULT_KEYWORDS.hiring);
  const [moneyKeywords, setMoneyKeywords] = useState(DEFAULT_KEYWORDS.money);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    loadData();
    loadSettings();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    if (!chrome.storage) return;
    chrome.storage.local.get({ posts: [] }, (items) => {
      setPosts(items.posts || []);
      setLoading(false);
    });
  };

  const loadSettings = () => {
    if (!chrome.storage) return;
    chrome.storage.sync.get(
      {
        groupLinks: [],
        keywords: DEFAULT_KEYWORDS,
      },
      (items) => {
        setGroupLinks((items.groupLinks || []).join("\n"));
        setTechKeywords(items.keywords?.tech || DEFAULT_KEYWORDS.tech);
        setHiringKeywords(items.keywords?.hiring || DEFAULT_KEYWORDS.hiring);
        setMoneyKeywords(items.keywords?.money || DEFAULT_KEYWORDS.money);
      }
    );
  };

  const saveSettings = () => {
    const links = groupLinks
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes("facebook.com/groups/"));

    chrome.storage.sync.set(
      {
        groupLinks: links,
        keywords: {
          tech: techKeywords,
          hiring: hiringKeywords,
          money: moneyKeywords,
        },
      },
      () => {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    );
  };

  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to delete all scraped posts? This cannot be undone."
      )
    ) {
      chrome.storage.local.set({ posts: [], postIDs: [] }, () => {
        setPosts([]);
      });
    }
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (hideLowQuality && (post.score || 0) < 3) return false;
        if (searchTerm) {
          const terms = searchTerm
            .toLowerCase()
            .split(" ")
            .filter((t) => t.length > 0);
          const content = (post.text + " " + post.author).toLowerCase();
          if (!terms.some((t) => content.includes(t))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          const scoreDiff = (b.score || 0) - (a.score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          return b.timestamp - a.timestamp;
        }
        return b.timestamp - a.timestamp;
      });
  }, [posts, searchTerm, sortBy, hideLowQuality]);

  // Settings Panel
  const renderSettings = () =>
    h(
      "div",
      {
        className: `mb-6 bg-gray-50 rounded-lg border transition-all duration-300 ${
          showSettings ? "p-4" : "p-0"
        }`,
      },

      // Toggle Button
      h(
        "button",
        {
          className:
            "w-full flex justify-between items-center p-3 text-left font-medium text-gray-700 hover:bg-gray-100 rounded",
          onClick: () => setShowSettings(!showSettings),
        },
        h("span", null, "⚙️ Settings & Configuration"),
        h("span", null, showSettings ? "▲" : "▼")
      ),

      // Settings Content (Collapsible)
      showSettings &&
        h(
          "div",
          { className: "mt-4 space-y-4" },

          // Group Links Section
          h(
            "div",
            null,
            h(
              "label",
              { className: "block text-sm font-medium text-gray-700 mb-1" },
              "Facebook Group URLs (one per line)"
            ),
            h("textarea", {
              className:
                "w-full p-2 border border-gray-300 rounded text-sm font-mono",
              rows: 4,
              placeholder:
                "https://www.facebook.com/groups/example1\nhttps://www.facebook.com/groups/example2",
              value: groupLinks,
              onChange: (e) => setGroupLinks(e.target.value),
            })
          ),

          // Keywords Grid
          h(
            "div",
            { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },

            // Tech Keywords
            h(
              "div",
              null,
              h(
                "label",
                { className: "block text-sm font-medium text-blue-700 mb-1" },
                "🔧 Tech Keywords"
              ),
              h("textarea", {
                className:
                  "w-full p-2 border border-blue-200 rounded text-xs bg-blue-50",
                rows: 4,
                value: techKeywords,
                onChange: (e) => setTechKeywords(e.target.value),
              })
            ),

            // Hiring Keywords
            h(
              "div",
              null,
              h(
                "label",
                { className: "block text-sm font-medium text-green-700 mb-1" },
                "💼 Hiring Keywords"
              ),
              h("textarea", {
                className:
                  "w-full p-2 border border-green-200 rounded text-xs bg-green-50",
                rows: 4,
                value: hiringKeywords,
                onChange: (e) => setHiringKeywords(e.target.value),
              })
            ),

            // Money Keywords
            h(
              "div",
              null,
              h(
                "label",
                { className: "block text-sm font-medium text-yellow-700 mb-1" },
                "💰 Money Keywords"
              ),
              h("textarea", {
                className:
                  "w-full p-2 border border-yellow-200 rounded text-xs bg-yellow-50",
                rows: 4,
                value: moneyKeywords,
                onChange: (e) => setMoneyKeywords(e.target.value),
              })
            )
          ),

          // Save Button
          h(
            "div",
            { className: "flex justify-end gap-2" },
            h(
              "button",
              {
                className:
                  "px-4 py-2 text-sm text-gray-600 hover:text-gray-800",
                onClick: () => {
                  setTechKeywords(DEFAULT_KEYWORDS.tech);
                  setHiringKeywords(DEFAULT_KEYWORDS.hiring);
                  setMoneyKeywords(DEFAULT_KEYWORDS.money);
                },
              },
              "Reset to Defaults"
            ),
            h(
              "button",
              {
                className: `px-6 py-2 rounded text-sm font-medium ${
                  settingsSaved
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`,
                onClick: saveSettings,
              },
              settingsSaved ? "✓ Saved!" : "Save Settings"
            )
          )
        )
    );

  const renderHeader = () =>
    h(
      "header",
      { className: "flex justify-between items-center mb-6 border-b pb-4" },
      h(
        "div",
        null,
        h(
          "h1",
          { className: "text-2xl font-bold text-blue-600 m-0" },
          "Job Posts Dashboard"
        ),
        h(
          "span",
          { className: "text-sm text-gray-500" },
          `Total: ${posts.length} | Showing: ${filteredPosts.length}`
        )
      ),
      h(
        "div",
        { className: "text-right" },
        h("span", { className: "text-gray-400 text-xs" }, "v2.0 Production")
      )
    );

  const renderControls = () =>
    h(
      "div",
      { className: "flex flex-col gap-4 mb-6" },
      h(
        "div",
        { className: "flex gap-4 flex-wrap items-center" },
        h("input", {
          type: "text",
          className:
            "flex-grow p-2.5 border border-gray-300 rounded text-base focus:ring-2 focus:ring-blue-500",
          placeholder: "Search keywords...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
        }),
        h(
          "label",
          {
            className:
              "flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded cursor-pointer select-none",
          },
          h("input", {
            type: "checkbox",
            checked: hideLowQuality,
            onChange: () => setHideLowQuality(!hideLowQuality),
          }),
          h(
            "span",
            { className: "text-yellow-800 font-medium" },
            "Hide Low Quality (<3)"
          )
        )
      ),
      h(
        "div",
        { className: "flex gap-4 flex-wrap" },
        h(
          "button",
          {
            className:
              "px-4 py-2 rounded text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
            onClick: () => setSearchTerm("react next mern node full stack"),
          },
          "Tech Only"
        ),
        h(
          "button",
          {
            className: `px-4 py-2 rounded text-sm ${
              sortBy === "score"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`,
            onClick: () => {
              setSortBy("score");
              setSearchTerm("");
            },
          },
          "Sort by Score"
        ),
        h(
          "button",
          {
            className: `px-4 py-2 rounded text-sm ${
              sortBy === "date"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`,
            onClick: () => {
              setSortBy("date");
              setSearchTerm("");
            },
          },
          "Sort by Date"
        ),
        h("div", { className: "flex-grow" }),
        h(
          "button",
          {
            className:
              "px-4 py-2 rounded text-sm bg-green-500 text-white hover:bg-green-600",
            onClick: () => exportToCSV(filteredPosts),
          },
          "Export CSV"
        ),
        h(
          "button",
          {
            className:
              "px-4 py-2 rounded text-sm bg-red-500 text-white hover:bg-red-600",
            onClick: handleClear,
          },
          "Delete All"
        )
      )
    );

  const renderScore = (score) => {
    score = score || 0;
    let color = "bg-gray-200 text-gray-600";
    if (score >= 5) color = "bg-green-100 text-green-800 border-green-200";
    else if (score >= 3) color = "bg-blue-100 text-blue-800 border-blue-200";
    else if (score > 0)
      color = "bg-yellow-100 text-yellow-800 border-yellow-200";
    return h(
      "span",
      { className: `px-2 py-1 rounded text-xs font-bold border ${color}` },
      score
    );
  };

  const renderTable = () =>
    h(
      "div",
      { className: "overflow-x-auto bg-white rounded shadow" },
      h(
        "table",
        { className: "min-w-full text-left text-sm" },
        h(
          "thead",
          { className: "bg-gray-50 text-gray-600 font-semibold" },
          h(
            "tr",
            null,
            h("th", { className: "p-3 border-b", width: "80" }, "Score"),
            h("th", { className: "p-3 border-b", width: "120" }, "Date"),
            h("th", { className: "p-3 border-b", width: "150" }, "Author"),
            h("th", { className: "p-3 border-b" }, "Content"),
            h("th", { className: "p-3 border-b", width: "80" }, "Link")
          )
        ),
        h(
          "tbody",
          null,
          filteredPosts.map((post, i) =>
            h(
              "tr",
              {
                key: post.id || i,
                className: "hover:bg-gray-50 border-b last:border-0",
              },
              h(
                "td",
                { className: "p-3 text-center" },
                renderScore(post.score)
              ),
              h(
                "td",
                { className: "p-3 text-gray-500 whitespace-nowrap" },
                new Date(post.timestamp).toLocaleDateString(),
                h("br"),
                new Date(post.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              ),
              h(
                "td",
                { className: "p-3 font-medium text-gray-800" },
                post.author
              ),
              h(
                "td",
                { className: "p-3 max-w-lg truncate", title: post.text },
                post.text
              ),
              h(
                "td",
                { className: "p-3 text-xs" },
                post.url && post.url !== "N/A"
                  ? h(
                      "a",
                      {
                        href: post.url,
                        target: "_blank",
                        className: "text-blue-600 hover:underline",
                      },
                      "View ->"
                    )
                  : h("span", { className: "text-gray-400" }, "-")
              )
            )
          )
        )
      )
    );

  return h(
    "div",
    { className: "max-w-7xl mx-auto p-5 bg-white rounded-lg shadow mt-5" },
    renderHeader(),
    renderSettings(),
    renderControls(),
    loading
      ? h(
          "div",
          { className: "text-center p-10 text-gray-500" },
          "Loading data..."
        )
      : filteredPosts.length === 0
      ? h(
          "div",
          { className: "text-center p-10 text-gray-500" },
          searchTerm
            ? "No matching posts found."
            : hideLowQuality
            ? `No High Quality posts found. (${posts.length} hidden by filter). Uncheck 'Hide Low Quality'.`
            : "No posts scraped yet. Start the scraper!"
        )
      : renderTable()
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(h(App));
