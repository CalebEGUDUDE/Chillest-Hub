const categoryButtons = document.querySelectorAll('.category-button');
const hubGrid = document.querySelector('.hub-grid');
const reportedLinksKey = 'chillest-reported-proxy-links';
const lastOpenedLinkKey = 'chillest-last-opened-proxy-link';
const remoteBaseUrl = 'https://raw.githubusercontent.com/CalebEGUDUDE/Chillest-Hub-Links/main';
const remoteCategories = ['links', 'games', 'docs', 'tools'];

const proxyNames = [
  'Arctic',
  'Bull-33',
  'Cherri',
  'DayDreamX',
  'Dogeub',
  'Duckmath',
  'Fern',
  'Interstellar',
  'Kite Browser',
  'Mist',
  'Nikehub',
  'opium.best',
  'Overcloaked',
  'Photon',
  'Quasar',
  'Tung Tung',
  'Utopia',
];

const getHubCards = () => document.querySelectorAll('.hub-card');

const createRemoteCard = (category, name, url, index, iconUrl) => {
  const card = document.createElement('article');
  card.className = `hub-card card-${['coral', 'yellow', 'blue'][index % 3]} is-clickable`;
  card.dataset.category = category;
  card.tabIndex = 0;
  card.setAttribute('role', 'link');

  const subtitle = document.createElement('span');
  subtitle.className = 'card-subtitle';
  subtitle.textContent = category;

  const link = document.createElement('a');
  link.className = 'card-link';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open';
  if (category === 'games' || category === 'tools') link.dataset.htmlUrl = url;

  const title = document.createElement('h3');
  title.textContent = name;

  if (iconUrl) {
    const icon = document.createElement('img');
    icon.className = 'card-icon';
    icon.src = iconUrl;
    icon.alt = '';
    card.append(icon);
  }

  card.append(subtitle, title, link);
  return card;
};

const renderRemoteCategory = (category, entries) => {
  hubGrid.querySelectorAll(`[data-category="${category}"]`).forEach((card) => card.remove());
  entries.forEach(({ name, url, iconUrl }, index) => hubGrid.append(createRemoteCard(category, name, url, index, iconUrl)));
};

const renderRemoteError = (category) => {
  renderRemoteCategory(category, []);
  const card = document.createElement('article');
  card.className = 'hub-card card-coral';
  card.dataset.category = category;
  const message = document.createElement('p');
  message.className = 'loading-card';
  message.textContent = 'Could not load this category.';
  card.append(message);
  hubGrid.append(card);
};

const getRemoteEntries = (category, data) => {
  const categoryData = data[Object.keys(data)[0]];
  if (!categoryData || typeof categoryData !== 'object') return [];
  const icons = data.Icon ?? {};

  return Object.entries(categoryData).flatMap(([name, value]) => {
    if (typeof value !== 'string') return [];
    const remotePath = category === 'games' ? 'games/html' : 'tools/html';
    const url = category === 'links' || category === 'docs'
      ? value
      : `${remoteBaseUrl}/${remotePath}/${value}`;
    const iconUrl = category === 'games' && typeof icons[name] === 'string'
      ? `${remoteBaseUrl}/games/icons/${icons[name]}`
      : null;
    try {
      new URL(url);
      return [{ name, url, iconUrl }];
    } catch {
      return [];
    }
  });
};

const getStoredValue = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable when the page is opened directly from a file.
  }
};

const getReportedLinks = () => {
  try {
    return new Set(JSON.parse(getStoredValue(reportedLinksKey) || '[]'));
  } catch {
    return new Set();
  }
};

const rememberOpenedLink = (url) => {
  setStoredValue(lastOpenedLinkKey, url);
};

const markLastOpenedCard = (card) => {
  hubGrid.querySelectorAll('.last-opened').forEach((label) => label.remove());
  const label = document.createElement('span');
  label.className = 'last-opened';
  label.textContent = 'Last opened';
  card.prepend(label);
};

const showCategory = (selectedCategory) => {
  getHubCards().forEach((card) => {
    card.classList.toggle('is-hidden', card.dataset.category !== selectedCategory);
  });
};

const updateCategorySelector = (button) => {
  const buttonIndex = [...categoryButtons].indexOf(button);
  document.querySelector('.category-bar')?.style.setProperty('--selected-category-index', buttonIndex);
};

const extractProxyLinks = (documentText) => {
  documentText = documentText.replace(/\r\n?/g, '\n');
  const start = documentText.indexOf('❄️ Arctic');
  const end = documentText.indexOf('🎮 G4mes');
  if (start === -1 || end === -1) return [];
  const proxySection = documentText.slice(start, end);
  const entries = [];

  proxyNames.forEach((name, index) => {
    const nameStart = proxySection.indexOf(`\n${name}\n`);
    const nextName = proxyNames[index + 1];
    const nameEnd = nextName ? proxySection.indexOf(`\n${nextName}\n`, nameStart + 1) : proxySection.length;
    if (nameStart === -1 || nameEnd === -1) return;

    const rawEntryText = proxySection.slice(nameStart + name.length + 2, nameEnd);
    const nextHeading = rawEntryText.search(/\n(?:❄️|🐂|🌸|🌙|🐶|🦆|🌿|🌠|🪁|☁️|👟|⚫|🥷|⚛️|🌌|🏏|🌆)/u);
    const entryText = nextHeading === -1 ? rawEntryText : rawEntryText.slice(0, nextHeading);
    const urlStarts = [...entryText.matchAll(/https?:\/\//g)].map((match) => match.index);
    urlStarts.forEach((urlStart, urlIndex) => {
      const urlEnd = urlStarts[urlIndex + 1] ?? entryText.length;
      const url = entryText.slice(urlStart, urlEnd).replace(/\s+/g, '').replace(/[.,]+$/, '');
      if (url.startsWith('http://') || url.startsWith('https://')) {
        entries.push({ name, url });
      }
    });
  });

  return entries;
};

const renderProxyLinks = (proxyLinks) => {
  hubGrid.querySelectorAll('[data-category="proxies"]').forEach((card) => card.remove());
  const reportedLinks = getReportedLinks();
  const lastOpenedLink = getStoredValue(lastOpenedLinkKey);

  proxyLinks.filter(({ url }) => !reportedLinks.has(url)).forEach(({ name, url }) => {
    const card = document.createElement('article');
    card.className = 'hub-card card-blue is-clickable';
    card.dataset.category = 'proxies';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');

    const subtitle = document.createElement('span');
    subtitle.className = 'card-subtitle';
    const link = document.createElement('a');
    link.className = 'card-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = url;
    link.addEventListener('click', () => {
      rememberOpenedLink(url);
      markLastOpenedCard(card);
    });
    subtitle.append(link);

    const proxyName = document.createElement('h3');
    proxyName.textContent = name;

    const reportButton = document.createElement('button');
    reportButton.className = 'report-button';
    reportButton.type = 'button';
    reportButton.textContent = 'Report broken';
    reportButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const nextReportedLinks = getReportedLinks();
      nextReportedLinks.add(url);
      setStoredValue(reportedLinksKey, JSON.stringify([...nextReportedLinks]));
      card.remove();
    });

    if (url === lastOpenedLink) {
      markLastOpenedCard(card);
    }

    card.append(subtitle, proxyName, reportButton);
    hubGrid.append(card);
  });

  showCategory(document.querySelector('.category-button.is-active')?.dataset.category ?? 'links');
};

const activateProxyCard = (card) => {
  const link = card.querySelector('.card-link');
  if (link) link.click();
};

const launchHtmlInNewTab = async (event) => {
  const link = event.target.closest('a[data-html-url]');
  if (!link) return;

  event.preventDefault();
  const newTab = window.open('', '_blank');
  if (!newTab) return;

  newTab.document.write('<p>Loading...</p>');
  try {
    const response = await fetch(link.dataset.htmlUrl);
    if (!response.ok) throw new Error('Could not load the HTML file.');
    const html = await response.text();
    const baseTag = `<base href="${new URL('.', link.dataset.htmlUrl).href}">`;
    newTab.document.open();
    newTab.document.write(html.replace('<head>', `<head>${baseTag}`));
    newTab.document.close();
  } catch {
    newTab.location.href = link.dataset.htmlUrl;
  }
};

hubGrid.addEventListener('click', (event) => {
  launchHtmlInNewTab(event);
  const card = event.target.closest('.is-clickable');
  if (card && !event.target.closest('a, button')) activateProxyCard(card);
});

hubGrid.addEventListener('keydown', (event) => {
  const card = event.target.closest('.is-clickable');
  if (!card || event.target.closest('a, button') || (event.key !== 'Enter' && event.key !== ' ')) return;

  event.preventDefault();
  activateProxyCard(card);
});

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedCategory = button.dataset.category;

    categoryButtons.forEach((categoryButton) => {
      const isSelected = categoryButton === button;
      categoryButton.classList.toggle('is-active', isSelected);
      categoryButton.setAttribute('aria-pressed', String(isSelected));
    });
    updateCategorySelector(button);
    showCategory(selectedCategory);
  });
});

const activeButton = document.querySelector('.category-button.is-active');
if (activeButton) {
  updateCategorySelector(activeButton);
  showCategory(activeButton.dataset.category);
}

const loadRemoteCategory = async (category) => {
  const response = await fetch(`${remoteBaseUrl}/${category}/${category}.json`);
  if (!response.ok) throw new Error(`Could not load ${category}.`);
  const data = await response.json();
  renderRemoteCategory(category, getRemoteEntries(category, data));
};

Promise.allSettled(remoteCategories.map(loadRemoteCategory)).then((results) => {
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      renderRemoteError(remoteCategories[index]);
    }
  });
  showCategory(document.querySelector('.category-button.is-active')?.dataset.category ?? 'links');
});

fetch('https://docs.google.com/document/d/17oNFTBQvEQUOVzwePROLSzQryr7eDL2YsoL5JkGF3J0/export?format=txt')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load the docs list.');
    return response.text();
  })
  .then((documentText) => renderProxyLinks(extractProxyLinks(documentText)))
  .catch(() => {});
