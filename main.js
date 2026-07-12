const PROXY_SERVER = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://back-endv1-2.onrender.com';
let tabs = [];
let activeTabId = null;

async function initProxyWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js', { scope: '/scram/' });
    } catch (err) {
      console.error('Scramjet ServiceWorker initialization failure:', err);
    }
  }
}

function createNewTab(targetUrl = '') {
  const id = 'tab-' + Date.now();
  const tabObj = { id: id, title: 'Homepage', url: targetUrl };
  tabs.push(tabObj);
  
  if (targetUrl) {
    const frame = document.createElement('iframe');
    frame.id = `iframe-${id}`;
    frame.className = "absolute inset-0 w-full h-full border-none hidden z-0";
    frame.src = `${PROXY_SERVER}/gateway?url=${encodeURIComponent(formatInputToUrl(targetUrl))}`;
    document.getElementById('frames-viewport').appendChild(frame);
  }
  
  switchTab(id);
  renderTabs();
}

function renderTabs() {
  const container = document.getElementById('tab-container');
  if (!container) return;
  
  const addBtn = container.lastElementChild;
  container.innerHTML = '';
  
  tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = `flex items-center h-7 px-3 min-w-[110px] max-w-[160px] rounded-t text-[11px] border border-transparent text-zinc-500 cursor-pointer transition select-none ${tab.id === activeTabId ? 'tab-active font-semibold text-zinc-200' : 'hover:bg-zinc-900/20'}`;
    tabEl.setAttribute('onclick', `switchTab('${tab.id}')`);
    
    tabEl.innerHTML = `
      <span class="truncate flex-1 pr-2 font-mono">${tab.title}</span>
      <span onclick="event.stopPropagation(); closeTab('${tab.id}')" class="text-zinc-600 hover:text-zinc-300 font-bold ml-auto text-[10px] p-0.5">×</span>
    `;
    container.appendChild(tabEl);
  });
  if (addBtn) container.appendChild(addBtn);
}

function switchTab(id) {
  activeTabId = id;
  const currentTab = tabs.find(t => t.id === id);
  const homeView = document.getElementById('homepage-view');
  const urlBar = document.getElementById('chrome-url-bar');

  document.querySelectorAll('#frames-viewport iframe').forEach(f => f.classList.add('hidden'));
  
  if (!currentTab || !currentTab.url) {
    if (homeView) homeView.classList.remove('hidden');
    if (urlBar) urlBar.value = '';
  } else {
    if (homeView) homeView.classList.add('hidden');
    if (urlBar) urlBar.value = currentTab.url;
    const targetIframe = document.getElementById(`iframe-${id}`);
    if (targetIframe) targetIframe.classList.remove('hidden');
  }
  renderTabs();
}

function closeTab(id) {
  tabs = tabs.filter(t => t.id !== id);
  const frame = document.getElementById(`iframe-${id}`);
  if (frame) frame.remove();
  
  if (activeTabId === id) {
    activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
  }
  if (tabs.length === 0) createNewTab();
  else switchTab(activeTabId);
}

function formatInputToUrl(input) {
  input = input.trim();
  if (!input) return 'https://duckduckgo.com/?kae=d';

  // Explicit URL check
  if (/^https?:\/\//.test(input)) {
    try {
      const urlObj = new URL(input);
      if (urlObj.hostname.includes('duckduckgo.com')) {
        if (!urlObj.searchParams.has('kae')) {
          urlObj.searchParams.set('kae', 'd');
        }
        return urlObj.toString();
      }
    } catch(e) {}
    return input;
  }

  // TLD syntax evaluation
  if (input.includes('.') && !input.includes(' ')) {
    if (input.includes('duckduckgo.com')) {
      return 'https://' + input + (input.includes('?') ? '&kae=d' : '?kae=d');
    }
    return 'https://' + input;
  }
  
  // Structural search execution with forced layout settings
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(input) + '&kae=d';
}

function launchProxyUrl(val) {
  if (!val) return;
  const parsed = formatInputToUrl(val);
  
  if (!activeTabId || !tabs.find(t => t.id === activeTabId)) {
    createNewTab(parsed);
    return;
  }

  const currentTab = tabs.find(t => t.id === activeTabId);
  currentTab.url = parsed;
  
  try {
    let domain = new URL(parsed).hostname;
    currentTab.title = domain.replace('www.', '');
  } catch(e) {
    currentTab.title = val.substring(0, 12);
  }

  let frame = document.getElementById(`iframe-${activeTabId}`);
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = `iframe-${activeTabId}`;
    frame.className = "absolute inset-0 w-full h-full border-none z-0";
    document.getElementById('frames-viewport').appendChild(frame);
  }
  frame.src = `${PROXY_SERVER}/gateway?url=${encodeURIComponent(parsed)}`;
  switchTab(activeTabId);
}

function handleHomeAction(val) {
  if (!val) return;
  launchProxyUrl(val);
}

function handleNavigation(action) {
  if (!activeTabId) return;
  const frame = document.getElementById(`iframe-${activeTabId}`);
  if (!frame) return;
  try {
    if (action === 'back') frame.contentWindow.history.back();
    if (action === 'forward') frame.contentWindow.history.forward();
    if (action === 'reload') frame.contentWindow.location.reload();
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const urlBar = document.getElementById('chrome-url-bar');
  if (urlBar) {
    urlBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        launchProxyUrl(urlBar.value);
      }
    });
  }
});

initProxyWorker();
createNewTab();
