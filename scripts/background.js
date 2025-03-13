chrome.commands.onCommand.addListener((command) => {
  switch(command) {
    case 'group_tabs':
      organizeTabs()
      break
    case 'search_tabs':
      searchTabs()
      break
    case 'ungroup_tabs': 
      ungroupTabs()
      break
  }
})

const colors = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
let colorMap = new Map();
let colorIndex = 0;

function getColorForDomain(domain) {
  if (!colorMap.has(domain)) {
    colorMap.set(domain, colors[colorIndex]);
    colorIndex = (colorIndex + 1) % colors.length; // Cycle colors if exhausted
  }
  return colorMap.get(domain);
}

function organizeTabs() {
  chrome.tabs.query({}, (tabs) => {
    let groups = {};

    tabs.forEach(tab => {
      let url;

      try {
        url = new URL(tab.url);
      } catch(e) {
        return; // Skip tabs that are not accessible
      }

      let rawDomain = url.hostname.replace('www.', '');
      let domain = rawDomain.substring(0, rawDomain.lastIndexOf('.')).split('.').join(' | ')

      if (!groups[domain]) {
        groups[domain] = [];
      }

      groups[domain].push(tab.id)
    })

    const groupedDomains = {}
    const standaloneDomains = {}

    Object.entries(groups).forEach(([domain, tabIds]) => {
      if (tabIds.length > 1) {
        groupedDomains[domain] = tabIds
      } else {
        standaloneDomains[domain] = tabIds
      }
    })

    const sortedDomains = [
      ...Object.keys(groupedDomains).sort(),
      ...Object.keys(standaloneDomains).sort()
    ]

    let index = 0;

    sortedDomains.forEach(domain => {
      let tabIds = groups[domain].map(id => id);

      tabIds.forEach(tabId => {
        chrome.tabs.move(tabId, { index: index++ })
      })
    })

    Object.entries(groups).forEach(([domain, tabIds]) => {
      if (tabIds.length > 1) {
        chrome.tabs.group({ tabIds }, (groupId) => {
          chrome.tabGroups.update(groupId, { title: domain, color: getColorForDomain(domain) });
        });
      }
    });
  })
}

function ungroupTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.ungroup(tab.id)
    })
  })
}

function searchTabs() {
  chrome.action.openPopup()
}
