const storageKeys = {
  links: "minimal-new-tab-links",
  theme: "minimal-new-tab-theme",
  density: "minimal-new-tab-density",
  weatherEnabled: "minimal-new-tab-weather-enabled",
  weatherCache: "minimal-new-tab-weather-cache"
};

const defaultLinks = [
  { name: "GitHub", url: "https://github.com" },
  { name: "MDN", url: "https://developer.mozilla.org" },
  { name: "Stack", url: "https://stackoverflow.com" },
  { name: "News", url: "https://news.ycombinator.com" }
];

const themes = ["aurora", "graphite", "daylight"];
const densities = ["compact", "comfortable"];
let editingLinkIndex = null;

const fallbackNews = [
  { title: "Hacker News", url: "https://news.ycombinator.com", score: "Top stories" },
  { title: "GitHub Trending", url: "https://github.com/trending", score: "Popular repos" },
  { title: "DEV Community", url: "https://dev.to", score: "Developer posts" }
];

const weatherCodes = {
  0: ["Clear", "SUN"],
  1: ["Mainly clear", "SUN"],
  2: ["Partly cloudy", "CLD"],
  3: ["Overcast", "CLD"],
  45: ["Fog", "FOG"],
  48: ["Rime fog", "FOG"],
  51: ["Light drizzle", "DRZ"],
  53: ["Drizzle", "DRZ"],
  55: ["Heavy drizzle", "DRZ"],
  61: ["Light rain", "RAN"],
  63: ["Rain", "RAN"],
  65: ["Heavy rain", "RAN"],
  71: ["Light snow", "SNW"],
  73: ["Snow", "SNW"],
  75: ["Heavy snow", "SNW"],
  80: ["Rain showers", "RAN"],
  81: ["Showers", "RAN"],
  82: ["Heavy showers", "RAN"],
  95: ["Thunderstorm", "STM"]
};

const elements = {
  greeting: document.querySelector("#greeting"),
  time: document.querySelector("#time-label"),
  date: document.querySelector("#date-label"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  quickLinks: document.querySelector("#quick-links"),
  addLinkButton: document.querySelector("#add-link-button"),
  linkDialog: document.querySelector("#link-dialog"),
  linkForm: document.querySelector("#link-form"),
  linkDialogTitle: document.querySelector("#dialog-title"),
  linkDialogClose: document.querySelector("#link-dialog-close"),
  linkDialogCancel: document.querySelector("#link-dialog-cancel"),
  linkName: document.querySelector("#link-name"),
  linkUrl: document.querySelector("#link-url"),
  weatherState: document.querySelector("#weather-state"),
  weatherRefresh: document.querySelector("#weather-refresh"),
  newsList: document.querySelector("#news-list"),
  newsRefresh: document.querySelector("#news-refresh"),
  themeButtons: document.querySelectorAll(".theme-card[data-theme-option]"),
  settingsOpen: document.querySelector("#settings-open"),
  settingsClose: document.querySelector("#settings-close"),
  settingsScrim: document.querySelector("#settings-scrim"),
  settingsLayer: document.querySelector("#settings-layer"),
  densitySelect: document.querySelector("#density-select"),
  weatherToggle: document.querySelector("#weather-toggle"),
  settingsAddLink: document.querySelector("#settings-add-link"),
  settingsLinks: document.querySelector("#settings-links")
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  elements.greeting.textContent = greeting;
  elements.time.textContent = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);
  elements.date.textContent = new Intl.DateTimeFormat([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now);
}

function getLinks() {
  return readJson(storageKeys.links, defaultLinks);
}

function saveLinks(links) {
  localStorage.setItem(storageKeys.links, JSON.stringify(links));
}

function getDomain(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function faviconUrl(url) {
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(normalizeUrl(url))}&sz=64`;
}

function applyTheme(theme) {
  const nextTheme = themes.includes(theme) ? theme : "aurora";
  document.body.dataset.theme = nextTheme;
  localStorage.setItem(storageKeys.theme, nextTheme);

  elements.themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeOption === nextTheme));
  });
}

function applyDensity(density) {
  const nextDensity = densities.includes(density) ? density : "compact";
  document.body.dataset.density = nextDensity;
  elements.densitySelect.value = nextDensity;
  localStorage.setItem(storageKeys.density, nextDensity);
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function renderLinks() {
  const links = getLinks();
  elements.quickLinks.innerHTML = "";

  links.forEach((link, index) => {
    const item = document.createElement("article");
    item.className = "quick-link";
    item.dataset.initial = link.name.trim().slice(0, 1).toUpperCase() || "*";

    const anchor = document.createElement("a");
    anchor.className = "quick-link-main";
    anchor.href = normalizeUrl(link.url);
    anchor.title = link.name;
    anchor.setAttribute("aria-label", `Open ${link.name}`);

    const iconWrap = document.createElement("span");
    iconWrap.className = "link-icon";
    iconWrap.dataset.initial = item.dataset.initial;

    const icon = document.createElement("img");
    icon.src = faviconUrl(link.url);
    icon.alt = "";
    icon.loading = "lazy";
    icon.addEventListener("load", () => iconWrap.classList.add("has-icon"));
    icon.addEventListener("error", () => icon.remove());

    const text = document.createElement("span");
    text.className = "link-text";

    const label = document.createElement("strong");
    label.textContent = link.name;

    const domain = document.createElement("small");
    domain.textContent = getDomain(link.url);

    const actions = document.createElement("span");
    actions.className = "link-actions";

    const edit = document.createElement("button");
    edit.className = "mini-button";
    edit.type = "button";
    edit.title = "Edit link";
    edit.setAttribute("aria-label", `Edit ${link.name}`);
    edit.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 20h9"></path><path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z"></path></svg>';
    edit.addEventListener("click", () => openLinkDialog(index));

    const remove = document.createElement("button");
    remove.className = "mini-button danger";
    remove.type = "button";
    remove.title = "Remove link";
    remove.setAttribute("aria-label", `Remove ${link.name}`);
    remove.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M18 6 6 18M6 6l12 12"></path></svg>';
    remove.addEventListener("click", () => {
      const nextLinks = getLinks().filter((_, itemIndex) => itemIndex !== index);
      saveLinks(nextLinks.length ? nextLinks : defaultLinks);
      renderLinks();
      renderSettingsLinks();
    });

    iconWrap.append(icon);
    text.append(label, domain);
    anchor.append(iconWrap, text);
    actions.append(edit, remove);
    item.append(anchor, actions);
    elements.quickLinks.append(item);
  });
}

function handleSearch(event) {
  event.preventDefault();
  const value = elements.searchInput.value.trim();
  if (!value) {
    return;
  }

  const looksLikeUrl = /^https?:\/\//i.test(value) || /^[\w-]+(\.[\w-]+)+/.test(value);
  if (looksLikeUrl) {
    window.location.href = normalizeUrl(value);
    return;
  }

  if (globalThis.chrome?.search?.query) {
    globalThis.chrome.search.query({ text: value, disposition: "CURRENT_TAB" });
    return;
  }

  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

function openLinkDialog(index = null) {
  editingLinkIndex = index;
  elements.linkForm.reset();
  elements.linkDialogTitle.textContent = index === null ? "Add website" : "Edit website";

  if (index !== null) {
    const link = getLinks()[index];
    elements.linkName.value = link.name;
    elements.linkUrl.value = link.url;
  }

  elements.linkDialog.showModal();
  requestAnimationFrame(() => elements.linkName.focus());
}

function closeLinkDialog() {
  editingLinkIndex = null;
  elements.linkDialog.close();
}

function handleLinkSubmit(event) {
  event.preventDefault();
  const name = elements.linkName.value.trim();
  const url = normalizeUrl(elements.linkUrl.value);
  if (!name || !url) {
    return;
  }

  const links = getLinks();
  if (editingLinkIndex === null) {
    links.unshift({ name, url });
  } else {
    links[editingLinkIndex] = { name, url };
  }

  saveLinks(links.slice(0, 12));
  renderLinks();
  renderSettingsLinks();
  closeLinkDialog();
}

function renderWeatherLoading(message = "Getting the latest local weather...") {
  elements.weatherState.innerHTML = `<p class="muted">${message}</p>`;
}

function renderWeatherPrompt(message = "Allow location access to show local weather.") {
  elements.weatherState.innerHTML = `
    <p class="muted">${message}</p>
    <button class="text-button" id="weather-enable" type="button">Enable weather</button>
  `;
  document.querySelector("#weather-enable").addEventListener("click", () => requestWeather({ remember: true }));
}

function renderWeather(data, options = {}) {
  const current = data.current;
  const code = weatherCodes[current.weather_code] || ["Current weather", "NOW"];
  const temp = Math.round(current.temperature_2m);
  const wind = Math.round(current.wind_speed_10m);
  const updated = options.cached
    ? `Updated ${new Date(data.cachedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Updated now";

  elements.weatherState.innerHTML = `
    <div class="weather-main">
      <div class="weather-icon" aria-hidden="true">${code[1]}</div>
      <div>
        <div class="temperature">${temp}&deg;</div>
        <div class="weather-meta">${code[0]}</div>
      </div>
    </div>
    <p class="weather-meta">Wind ${wind} km/h &middot; ${updated}</p>
  `;
}

async function fetchWeather(position) {
  const { latitude, longitude } = position.coords;
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.search = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: "temperature_2m,weather_code,wind_speed_10m",
    timezone: "auto"
  });

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Weather request failed");
  }

  return response.json();
}

function cacheWeather(data) {
  localStorage.setItem(storageKeys.weatherCache, JSON.stringify({
    ...data,
    cachedAt: Date.now()
  }));
}

function renderCachedWeather() {
  const cache = readJson(storageKeys.weatherCache, null);
  if (!cache?.current) {
    return false;
  }

  renderWeather(cache, { cached: true });
  return true;
}

function requestWeather(options = {}) {
  const { remember = false, quiet = false } = options;

  if (!navigator.geolocation) {
    localStorage.setItem(storageKeys.weatherEnabled, "false");
    elements.weatherToggle.checked = false;
    renderWeatherPrompt("Weather is not available in this browser.");
    return;
  }

  if (remember) {
    localStorage.setItem(storageKeys.weatherEnabled, "true");
    elements.weatherToggle.checked = true;
  }

  if (!quiet) {
    renderWeatherLoading();
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const weather = await fetchWeather(position);
        cacheWeather(weather);
        localStorage.setItem(storageKeys.weatherEnabled, "true");
        elements.weatherToggle.checked = true;
        renderWeather(weather);
      } catch {
        if (!renderCachedWeather()) {
          renderWeatherPrompt("Weather could not be loaded right now.");
        }
      }
    },
    () => {
      localStorage.setItem(storageKeys.weatherEnabled, "false");
      elements.weatherToggle.checked = false;
      renderWeatherPrompt("Location access is needed for local weather.");
    },
    { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
  );
}

async function initWeather() {
  elements.weatherToggle.checked = localStorage.getItem(storageKeys.weatherEnabled) === "true";
  if (elements.weatherToggle.checked) {
    const hasCache = renderCachedWeather();
    requestWeather({ quiet: hasCache });
    return;
  }

  if (navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "granted") {
        requestWeather({ remember: true });
        return;
      }
    } catch {
      // Some browsers do not expose geolocation permission checks on extension pages.
    }
  }

  renderWeatherPrompt();
}

function renderNews(items) {
  elements.newsList.innerHTML = "";

  items.slice(0, 3).forEach((item) => {
    const article = document.createElement("article");
    article.className = "news-item";

    const link = document.createElement("a");
    link.href = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
    link.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "news-meta";
    meta.textContent = typeof item.score === "number" ? `${item.score} points` : item.score;

    article.append(link, meta);
    elements.newsList.append(article);
  });
}

async function fetchNews() {
  elements.newsList.innerHTML = `<p class="muted">Loading developer news...</p>`;

  try {
    const topResponse = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!topResponse.ok) {
      throw new Error("News list failed");
    }

    const ids = (await topResponse.json()).slice(0, 12);
    const stories = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
    );

    const usableStories = stories.filter((story) => story?.title && story?.url).slice(0, 3);
    renderNews(usableStories.length ? usableStories : fallbackNews);
  } catch {
    renderNews(fallbackNews);
  }
}

function openSettings() {
  elements.settingsLayer.hidden = false;
  document.body.classList.add("settings-open");
  requestAnimationFrame(() => elements.settingsClose.focus());
}

function closeSettings() {
  elements.settingsLayer.hidden = true;
  document.body.classList.remove("settings-open");
}

function renderSettingsLinks() {
  const links = getLinks();
  elements.settingsLinks.innerHTML = "";

  links.forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "settings-link-row";

    const icon = document.createElement("img");
    icon.src = faviconUrl(link.url);
    icon.alt = "";
    icon.addEventListener("error", () => icon.remove());

    const copy = document.createElement("span");
    const label = document.createElement("strong");
    label.textContent = link.name;
    const domain = document.createElement("small");
    domain.textContent = getDomain(link.url);
    copy.append(label, domain);

    const edit = document.createElement("button");
    edit.className = "mini-button";
    edit.type = "button";
    edit.title = "Edit link";
    edit.setAttribute("aria-label", `Edit ${link.name}`);
    edit.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 20h9"></path><path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z"></path></svg>';
    edit.addEventListener("click", () => openLinkDialog(index));

    row.append(icon, copy, edit);
    elements.settingsLinks.append(row);
  });
}

function init() {
  applyTheme(localStorage.getItem(storageKeys.theme));
  applyDensity(localStorage.getItem(storageKeys.density));
  updateClock();
  setInterval(updateClock, 1000);
  renderLinks();
  renderSettingsLinks();
  initWeather();
  fetchNews();

  elements.searchForm.addEventListener("submit", handleSearch);
  elements.addLinkButton.addEventListener("click", () => openLinkDialog());
  elements.settingsAddLink.addEventListener("click", () => openLinkDialog());
  elements.linkForm.addEventListener("submit", handleLinkSubmit);
  elements.linkDialogClose.addEventListener("click", closeLinkDialog);
  elements.linkDialogCancel.addEventListener("click", closeLinkDialog);
  elements.linkDialog.addEventListener("cancel", () => {
    editingLinkIndex = null;
  });
  elements.weatherRefresh.addEventListener("click", () => requestWeather({ remember: true }));
  elements.newsRefresh.addEventListener("click", fetchNews);
  elements.settingsOpen.addEventListener("click", openSettings);
  elements.settingsClose.addEventListener("click", closeSettings);
  elements.settingsScrim.addEventListener("click", closeSettings);
  elements.densitySelect.addEventListener("change", () => applyDensity(elements.densitySelect.value));
  elements.weatherToggle.addEventListener("change", () => {
    if (elements.weatherToggle.checked) {
      requestWeather({ remember: true });
      return;
    }

    localStorage.setItem(storageKeys.weatherEnabled, "false");
    renderWeatherPrompt();
  });
  elements.themeButtons.forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeOption));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.settingsLayer.hidden) {
      closeSettings();
    }
  });
}

init();
