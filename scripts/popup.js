let selectedIndex = -1;

async function getTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => resolve(tabs));
  });
}

async function searchTabs(term = "") {
  let filteredTabs = await getTabs();

  if (term) {
    filteredTabs = filteredTabs.filter((tab) =>
      tab.title.toLowerCase().includes(term.toLowerCase()) ||
      tab.url.toLowerCase().includes(term.toLowerCase())
    );
  }

  displayTabs(filteredTabs);
}

async function getTabGroups() {
  const groups = {};
  const tabGroups = await chrome.tabGroups.query({});
  
  tabGroups.forEach(group => {
    groups[group.id] = { color: group.color };
  });

  return groups;
}

function lightenColor(colorName) {
  const colorMap = {
    "grey": "#e0e0e0", "blue": "#cce5ff", "red": "#ffcccc",
    "yellow": "#fff3cd", "green": "#d4edda", "pink": "#f8d7da",
    "purple": "#e6ccff", "cyan": "#d1ecf1", "orange": "#ffe5b4"
  };

  const hex = colorMap[colorName] || "#f1f1f1"; // Default to light gray
  return hex;
}

async function displayTabs(tabs) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  const groups = await getTabGroups();

  tabs.forEach((tab) => {
    const li = document.createElement("li");
    li.textContent = tab.title;
    li.onclick = () => chrome.tabs.update(tab.id, { active: true });

    // Apply light group color if tab is in a group
    if (tab.groupId !== -1 && groups[tab.groupId]) {
      li.style.backgroundColor = lightenColor(groups[tab.groupId].color);
    }

    container.appendChild(li);
  });
}

function moveSelection(direction) {
  const results = document.querySelectorAll("#results li");
  if (results.length === 0) return;

  if (selectedIndex >= 0) {
    results[selectedIndex].classList.remove("selected");
  }

  selectedIndex += direction;
  if (selectedIndex < 0) selectedIndex = results.length - 1;
  if (selectedIndex >= results.length) selectedIndex = 0;

  const selected = results[selectedIndex];
  selected.classList.add("selected");

  selected.scrollIntoView({ behavior: "instant", block: "nearest" });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    moveSelection(1);
  } else if (e.key === "ArrowUp") {
    moveSelection(-1);
  } else if (e.key === "Enter" && selectedIndex >= 0) {
    document.querySelectorAll("#results li")[selectedIndex].click();
  }
});


document.getElementById("search-input").addEventListener("input", (e) => {
  searchTabs(e.target.value);
});

searchTabs();
