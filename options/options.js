// Saves options to chrome.storage
const saveOptions = () => {
  const linksText = document.getElementById("groupLinks").value;
  const links = linksText
    .split("\n")
    .map((link) => link.trim())
    .filter((link) => link.length > 0);

  // Basic validation
  const validLinks = links.filter((link) =>
    link.includes("facebook.com/groups/")
  );

  if (validLinks.length !== links.length) {
    showStatus(
      "Warning: Some links do not look like FB groups. Saved valid ones only.",
      "text-red-600"
    );
  }

  chrome.storage.sync.set({ groupLinks: validLinks }, () => {
    document.getElementById("groupLinks").value = validLinks.join("\n");
    showStatus("Options saved.", "text-green-600");
  });
};

const restoreOptions = () => {
  chrome.storage.sync.get({ groupLinks: [] }, (items) => {
    document.getElementById("groupLinks").value = items.groupLinks.join("\n");
  });
};

const showStatus = (msg, className) => {
  const status = document.getElementById("status");
  status.textContent = msg;
  status.className = "h-6 mb-4 text-sm font-medium " + className;
  setTimeout(() => {
    status.textContent = "";
    status.className = "h-6 mb-4 text-sm font-medium";
  }, 3000);
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
