/**
 * THE CHRONICLE - Main Application Logic
 * Dynamic Category Stage, In-Modal Table of Contents Scrolling,
 * Rich Inline SVG Artwork Fallbacks, Filter Engine, and Theme Management.
 */

// Application State
const AppState = {
  articles: [...ARTICLES_DATA],
  filteredArticles: [...ARTICLES_DATA],
  authors: [...AUTHORS_DATA],
  activeTag: 'All',
  activeCategory: 'All',
  searchQuery: '',
  sortBy: 'latest',
  savedArticleIds: JSON.parse(localStorage.getItem('chronicle_bookmarks') || '[]'),
  likedArticleIds: JSON.parse(localStorage.getItem('chronicle_likes') || '[]'),
  fontSizeMode: localStorage.getItem('chronicle_font_size') || 'normal', // 'compact', 'normal', 'spacious'
  fontFamilyMode: localStorage.getItem('chronicle_font_family') || 'serif', // 'serif', 'sans', 'mono'
  themeMode: localStorage.getItem('chronicle_theme_mode') || 'day', // 'day', 'night', 'sepia'
  currentArticle: null,
  isAudioPlaying: false,
  audioInterval: null,
  audioProgress: 0,
  articleComments: JSON.parse(localStorage.getItem('chronicle_comments') || '{}')
};

/**
 * Generates an artistic, offline-resilient SVG book/magazine cover
 * when external photos fail or when network requests are restricted.
 */
function generateCategoryArtworkSvg(category, title) {
  const themes = {
    'Design & Typography': { c1: '#881337', c2: '#1c1917', acc: '#f43f5e', sym: '&amp;', label: 'TYPOGRAPHY' },
    'Architecture & Engineering': { c1: '#064e3b', c2: '#09251e', acc: '#10b981', sym: '⊞', label: 'ARCHITECTURE' },
    'Technology & AI': { c1: '#312e81', c2: '#0f172a', acc: '#818cf8', sym: '◈', label: 'COGNITION' },
    'Web Performance': { c1: '#164e63', c2: '#082f49', acc: '#22d3ee', sym: '⚡', label: 'PERFORMANCE' },
    'Culture & Philosophy': { c1: '#78350f', c2: '#291807', acc: '#fbbf24', sym: '§', label: 'PHILOSOPHY' },
    'Science & Future': { c1: '#581c87', c2: '#1e0a38', acc: '#c084fc', sym: '⚛', label: 'FRONTIERS' }
  };
  const t = themes[category] || { c1: '#1c1917', c2: '#0a0a0a', acc: '#e11d48', sym: '✒', label: 'EDITORIAL' };
  const safeTitle = (title || category).replace(/[<>&"']/g, '');
  const shortTitle = safeTitle.length > 40 ? safeTitle.substring(0, 37) + '...' : safeTitle;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="g_${category.replace(/[^a-zA-Z]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.c1}"/>
        <stop offset="100%" stop-color="${t.c2}"/>
      </linearGradient>
      <radialGradient id="r_${category.replace(/[^a-zA-Z]/g, '')}" cx="70%" cy="30%" r="65%">
        <stop offset="0%" stop-color="${t.acc}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${t.acc}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g_${category.replace(/[^a-zA-Z]/g, '')})"/>
    <circle cx="560" cy="180" r="280" fill="url(#r_${category.replace(/[^a-zA-Z]/g, '')})"/>
    <!-- Concentric Technical/Artistic Rings -->
    <circle cx="560" cy="180" r="140" fill="none" stroke="${t.acc}" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="4 6"/>
    <circle cx="560" cy="180" r="220" fill="none" stroke="${t.acc}" stroke-opacity="0.15" stroke-width="1"/>
    <line x1="80" y1="410" x2="720" y2="410" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
    <!-- Giant Minimalist Glyph -->
    <text x="640" y="320" fill="${t.acc}" fill-opacity="0.18" font-family="Georgia, serif" font-size="220" font-weight="bold" text-anchor="middle">${t.sym}</text>
    <!-- Masthead Typography -->
    <text x="80" y="80" fill="${t.acc}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="3" text-transform="uppercase">THE CHRONICLE ARCHIVE • ${t.label}</text>
    <text x="80" y="370" fill="#ffffff" font-family="'Instrument Serif', Georgia, serif" font-size="28" font-weight="normal">${shortTitle}</text>
    <text x="80" y="445" fill="#a1a1aa" font-family="monospace" font-size="11" letter-spacing="1.5">FOLIO VOL. IX • ISSUE CURATED EDITION</text>
  </svg>`;

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

// Default fallback URI
const FALLBACK_IMAGE_DATA_URI = generateCategoryArtworkSvg('Design & Typography', 'The Chronicle Archive');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initThemeSystem();
  renderDateAndIssue();
  renderFeaturedStory();
  renderTrendingList();
  renderCollections();
  renderEditorialQuote();
  renderFilterTags();
  renderArticles();
  renderAuthors();
  updateSectionHeadings();
  setupEventListeners();
  updateBookmarkBadge();
  setupTypographicControls();
  setupScrollListener();
});

/* --------------------------------------------------------------------------
   Header Date & Edition
   -------------------------------------------------------------------------- */
function renderDateAndIssue() {
  const dateEl = document.getElementById('masthead-date');
  if (dateEl) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('en-US', options);
  }
}

/* --------------------------------------------------------------------------
   Theme Switchers (Day, Night & Warm Sepia Modes)
   -------------------------------------------------------------------------- */
function initThemeSystem() {
  applyThemeMode(AppState.themeMode);
}

function applyThemeMode(mode) {
  AppState.themeMode = mode;
  localStorage.setItem('chronicle_theme_mode', mode);

  const root = document.documentElement;
  root.classList.remove('dark', 'sepia');

  const moonIcon = document.getElementById('theme-moon-icon');
  const sunIcon = document.getElementById('theme-sun-icon');

  if (mode === 'night') {
    root.classList.add('dark');
    if (moonIcon) moonIcon.classList.add('hidden');
    if (sunIcon) sunIcon.classList.remove('hidden');
  } else if (mode === 'sepia') {
    root.classList.add('sepia');
    if (moonIcon) moonIcon.classList.remove('hidden');
    if (sunIcon) sunIcon.classList.add('hidden');
  } else {
    // Day
    if (moonIcon) moonIcon.classList.remove('hidden');
    if (sunIcon) sunIcon.classList.add('hidden');
  }
}

function toggleTheme() {
  if (AppState.themeMode === 'day') {
    applyThemeMode('night');
    showToast('Switched to Night Edition (Dark)');
  } else {
    applyThemeMode('day');
    showToast('Switched to Day Edition (Newsprint)');
  }
}

function toggleSepiaTheme() {
  if (AppState.themeMode === 'sepia') {
    applyThemeMode('day');
    showToast('Returned to Standard Newsprint');
  } else {
    applyThemeMode('sepia');
    showToast('Warm Sepia Reading Atmosphere Activated');
  }
}

/* --------------------------------------------------------------------------
   Dynamic Featured Story Banner (Changes Dynamically per Category)
   -------------------------------------------------------------------------- */
function renderFeaturedStory() {
  const bannerContainer = document.getElementById('featured-story-container');
  if (!bannerContainer) return;

  let leadStory;
  let labelText = 'Lead Story • Issue Spotlight';
  let curatorText = 'Curated by Editor-in-Chief';

  if (AppState.activeCategory === 'All') {
    leadStory = AppState.articles.find(a => a.isFeatured) || AppState.articles[0];
  } else if (AppState.activeCategory === 'Saved') {
    const saved = AppState.articles.filter(a => AppState.savedArticleIds.includes(a.id));
    if (saved.length > 0) {
      leadStory = saved[0];
      labelText = 'Saved Dispatches • Personal Queue';
      curatorText = `${saved.length} Saved in Your Collection`;
    } else {
      bannerContainer.innerHTML = `
        <div class="h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-sm min-h-[340px] animate-fade-in">
          <div class="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
          </div>
          <h3 class="font-display-serif text-2xl text-stone-900 dark:text-stone-100 mb-2">Your Saved Reading Queue is Empty</h3>
          <p class="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-5">Click the bookmark icon on any dispatch across our 6 editorial sections to save essays for offline reading.</p>
          <button onclick="filterByCategory('All')" class="px-5 py-2.5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition">
            Explore All 30 Dispatches
          </button>
        </div>
      `;
      const leadLabelEl = document.getElementById('lead-story-label');
      if (leadLabelEl) leadLabelEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-600 mr-2"></span><span>Personal Reading Queue</span>`;
      const leadCuratorEl = document.getElementById('lead-story-curator');
      if (leadCuratorEl) leadCuratorEl.textContent = '0 Dispatches Saved';
      return;
    }
  } else {
    // A specific category (e.g. Culture & Philosophy, Science & Future, etc.)
    const catArticles = AppState.articles.filter(a => a.category === AppState.activeCategory);
    leadStory = catArticles[0] || AppState.articles[0];
    labelText = `Lead Story • ${AppState.activeCategory}`;
    curatorText = `Selected from ${catArticles.length} Dispatches in this section`;
  }

  // Update Section Header labels
  const leadLabelEl = document.getElementById('lead-story-label');
  if (leadLabelEl) {
    leadLabelEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-rose-600 mr-2 animate-ping"></span>
      <span>${labelText}</span>
    `;
  }
  const leadCuratorEl = document.getElementById('lead-story-curator');
  if (leadCuratorEl) {
    leadCuratorEl.textContent = curatorText;
  }

  const catTheme = CATEGORY_COLORS[leadStory.category] || CATEGORY_COLORS['Design & Typography'];
  const isSaved = AppState.savedArticleIds.includes(leadStory.id);
  const fallbackCover = generateCategoryArtworkSvg(leadStory.category, leadStory.title);

  bannerContainer.innerHTML = `
    <article class="featured-story h-full group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between animate-fade-in">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1">
        <!-- Visual Column -->
        <div class="md:col-span-7 relative h-72 sm:h-80 md:h-full min-h-[340px] overflow-hidden card-image-wrap bg-stone-100 dark:bg-stone-800 cursor-pointer" onclick="openArticleReader('${leadStory.id}')">
          <img 
            src="${leadStory.coverImage}" 
            alt="${leadStory.coverImageAlt}" 
            onerror="this.onerror=null; this.src='${fallbackCover}';"
            class="w-full h-full object-cover transform duration-700 group-hover:scale-105"
            loading="eager"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent md:hidden"></div>
          
          <div class="absolute top-4 left-4 z-10 flex items-center space-x-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-rose-600 text-white shadow-md animate-pulse-subtle">
              <span class="w-1.5 h-1.5 rounded-full bg-white mr-2"></span>
              ${AppState.activeCategory === 'All' ? 'Issue Spotlight' : AppState.activeCategory}
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${catTheme.badgeBg} ${catTheme.badgeText} border ${catTheme.badgeBorder} backdrop-blur-md">
              ${leadStory.category}
            </span>
          </div>

          <div class="absolute bottom-4 left-4 z-10 hidden md:flex items-center space-x-2 text-white/90 text-xs font-mono-code bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span>${leadStory.viewsCount} reads</span>
            <span>•</span>
            <span>${leadStory.wordCount.toLocaleString()} words</span>
          </div>
        </div>

        <!-- Editorial Content Column -->
        <div class="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-stone-900">
          <div>
            <div class="flex items-center space-x-2 mb-3">
              <span class="text-xs font-mono-code text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                ${AppState.activeCategory === 'All' ? "Editor's Dispatch" : `${AppState.activeCategory} Lead`}
              </span>
              <span class="text-stone-300 dark:text-stone-700">•</span>
              <span class="text-xs text-stone-400 font-mono-code">${leadStory.readTime}</span>
            </div>

            <h1 class="font-display-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-50 font-normal leading-tight mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              <a href="javascript:void(0)" onclick="openArticleReader('${leadStory.id}')" class="hover:underline decoration-rose-500/40 underline-offset-4">
                ${leadStory.title}
              </a>
            </h1>

            <p class="font-editorial-serif text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed mb-5 line-clamp-3">
              ${leadStory.subtitle}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5 mb-6">
              ${leadStory.tags.slice(0, 3).map(tag => `
                <span class="text-xs px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer" onclick="filterByTag('${tag}')">
                  #${tag}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Author Byline and Call To Action -->
          <div class="pt-5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div class="flex items-center space-x-3 cursor-pointer group/author" onclick="openAuthorModal('${leadStory.author.id}')">
              <img 
                src="${leadStory.author.avatar}" 
                alt="${leadStory.author.name}" 
                onerror="this.onerror=null; this.src='${fallbackCover}';"
                class="w-10 h-10 rounded-full object-cover ring-2 ring-stone-200 dark:ring-stone-700 group-hover/author:ring-rose-500 transition"
              />
              <div>
                <p class="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover/author:text-rose-600 dark:group-hover/author:text-rose-400 transition">
                  ${leadStory.author.name}
                </p>
                <p class="text-xs text-stone-500 dark:text-stone-400">
                  ${leadStory.author.organization}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button 
                onclick="toggleBookmark('${leadStory.id}', event)" 
                class="p-2 rounded-full border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition ${isSaved ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' : ''}"
                title="${isSaved ? 'Remove from Saved' : 'Save for Later'}"
                aria-label="Bookmark article"
              >
                <svg class="w-4 h-4 ${isSaved ? 'fill-current' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </button>

              <button 
                onclick="openArticleReader('${leadStory.id}')"
                class="inline-flex items-center px-4 py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition shadow-sm"
              >
                <span>Read</span>
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

/* --------------------------------------------------------------------------
   Dynamic Trending List (Adapts per Category or Global)
   -------------------------------------------------------------------------- */
function renderTrendingList() {
  const container = document.getElementById('trending-list-container');
  const radarTitleEl = document.getElementById('radar-title');
  const radarBadgeEl = document.getElementById('radar-badge');
  if (!container) return;

  let trendingItems = [];
  if (AppState.activeCategory === 'All') {
    trendingItems = AppState.articles
      .filter(a => a.isTrending && !a.isFeatured)
      .slice(0, 4);
    if (radarTitleEl) radarTitleEl.innerHTML = `<span>The Editorial Radar</span>`;
    if (radarBadgeEl) radarBadgeEl.textContent = 'Trending';
  } else if (AppState.activeCategory === 'Saved') {
    const saved = AppState.articles.filter(a => AppState.savedArticleIds.includes(a.id));
    trendingItems = saved.slice(1, 5);
    if (radarTitleEl) radarTitleEl.innerHTML = `<span>Saved Radar</span>`;
    if (radarBadgeEl) radarBadgeEl.textContent = `${saved.length} Saved`;
  } else {
    // Selected category: show other 4 articles in this category!
    const catArticles = AppState.articles.filter(a => a.category === AppState.activeCategory);
    trendingItems = catArticles.slice(1, 5);
    if (radarTitleEl) radarTitleEl.innerHTML = `<span>${AppState.activeCategory}</span>`;
    if (radarBadgeEl) radarBadgeEl.textContent = `${catArticles.length} In Section`;
  }

  if (trendingItems.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-xs text-stone-400 font-mono-code">
        Explore dispatches in the grid below.
      </div>
    `;
    return;
  }

  container.innerHTML = trendingItems.map((article, index) => {
    const rankStr = `0${index + 2}`;
    const catTheme = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['Design & Typography'];

    return `
      <div class="trending-item group flex items-start space-x-4 pb-4 border-b border-stone-100 dark:border-stone-800 last:border-b-0 last:pb-0 cursor-pointer animate-fade-in" onclick="openArticleReader('${article.id}')">
        <span class="trending-rank-number shrink-0 font-serif w-12 text-right">
          ${rankStr}
        </span>
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-1">
            <span class="text-[10px] font-mono-code uppercase font-semibold ${catTheme.badgeText}">
              ${article.category}
            </span>
            <span class="text-stone-300 dark:text-stone-700">•</span>
            <span class="text-[10px] font-mono-code text-stone-400">${article.readTime}</span>
          </div>
          <h4 class="font-display-serif text-base text-stone-900 dark:text-stone-100 font-normal leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
            ${article.title}
          </h4>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
            By ${article.author.name}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   Curated Editorial Collections
   -------------------------------------------------------------------------- */
function renderCollections() {
  const container = document.getElementById('collections-container');
  if (!container) return;

  container.innerHTML = EDITORIAL_COLLECTIONS.map(col => {
    return `
      <div 
        onclick="selectCollection('${col.tag}')"
        class="group p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl">${col.icon}</span>
          <span class="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
            ${col.count}
          </span>
        </div>
        <h4 class="font-display-serif text-lg text-stone-900 dark:text-stone-100 font-normal group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-1">
          ${col.title}
        </h4>
        <p class="text-xs font-editorial-serif text-stone-500 dark:text-stone-400 line-clamp-2">
          ${col.desc}
        </p>
      </div>
    `;
  }).join('');
}

function selectCollection(tag) {
  AppState.activeCategory = 'All';
  AppState.activeTag = tag;
  updateCategoryPills();
  renderFeaturedStory();
  renderTrendingList();
  renderFilterTags();
  applyFilters();
  updateSectionHeadings();
  scrollToDispatches();
  showToast(`Filtering by collection: #${tag}`);
}

/* --------------------------------------------------------------------------
   Quote of the Day
   -------------------------------------------------------------------------- */
function renderEditorialQuote() {
  const textEl = document.getElementById('quote-text');
  const authEl = document.getElementById('quote-author');
  const titleEl = document.getElementById('quote-title');

  if (textEl && EDITORIAL_QUOTE) {
    textEl.textContent = `"${EDITORIAL_QUOTE.quote}"`;
    if (authEl) authEl.textContent = EDITORIAL_QUOTE.author;
    if (titleEl) titleEl.textContent = EDITORIAL_QUOTE.title;
  }
}

/* --------------------------------------------------------------------------
   Filter Tags Pill Bar (Dynamically Pools From Current Category)
   -------------------------------------------------------------------------- */
function renderFilterTags() {
  const container = document.getElementById('filter-tags-container');
  if (!container) return;

  // Derive relevant articles pool for tags
  let pool = AppState.articles;
  if (AppState.activeCategory === 'Saved') {
    pool = AppState.articles.filter(a => AppState.savedArticleIds.includes(a.id));
  } else if (AppState.activeCategory !== 'All') {
    pool = AppState.articles.filter(a => a.category === AppState.activeCategory);
  }

  const tagsSet = new Set(['All']);
  pool.forEach(art => {
    art.tags.forEach(t => tagsSet.add(t));
  });

  const tags = Array.from(tagsSet);

  // If current activeTag is not in this pool, safely reset to 'All'
  if (!tags.includes(AppState.activeTag)) {
    AppState.activeTag = 'All';
  }

  container.innerHTML = tags.map(tag => {
    const isActive = AppState.activeTag === tag;
    const count = tag === 'All' 
      ? pool.length 
      : pool.filter(a => a.tags.includes(tag)).length;

    return `
      <button 
        onclick="filterByTag('${tag}')"
        class="filter-tag px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border flex items-center space-x-1.5 ${
          isActive 
            ? 'active bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-sm' 
            : 'bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
        }"
      >
        <span>${tag}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 dark:bg-stone-900/20 text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}">
          ${count}
        </span>
      </button>
    `;
  }).join('');
}

function filterByTag(tag) {
  AppState.activeTag = tag;
  applyFilters();
  renderFilterTags();
}

/**
 * Filter by Category:
 * Instantly synchronizes the Hero Lead Story, Trending Radar, Tags Bar,
 * Section Headings, and Articles Grid.
 */
function filterByCategory(category) {
  AppState.activeCategory = category;
  AppState.activeTag = 'All'; // Avoid dead cross-category tag filters
  updateCategoryPills();
  renderFeaturedStory();
  renderTrendingList();
  renderFilterTags();
  applyFilters();
  updateSectionHeadings();
  showToast(category === 'Saved' ? 'Viewing Saved Dispatches' : `Section: ${category}`);
}

function updateCategoryPills() {
  const tabs = document.querySelectorAll('[data-category-tab]');
  tabs.forEach(tab => {
    const cat = tab.getAttribute('data-category-tab');
    if (cat === AppState.activeCategory) {
      tab.classList.add('text-rose-600', 'dark:text-rose-400', 'border-rose-600', 'font-bold');
      tab.classList.remove('text-stone-600', 'dark:text-stone-400', 'border-transparent');
    } else {
      tab.classList.remove('text-rose-600', 'dark:text-rose-400', 'border-rose-600', 'font-bold');
      tab.classList.add('text-stone-600', 'dark:text-stone-400', 'border-transparent');
    }
  });
}

function updateSectionHeadings() {
  const heading = document.getElementById('grid-section-heading');
  const subheading = document.getElementById('grid-section-subheading');
  if (!heading) return;

  if (AppState.activeCategory === 'All') {
    heading.textContent = 'Selected Articles & Essays';
    if (subheading) subheading.textContent = 'Typographic explorations, architectural analyses, and digital critique.';
  } else if (AppState.activeCategory === 'Saved') {
    heading.textContent = 'Your Saved Reading Queue';
    if (subheading) subheading.textContent = `${AppState.savedArticleIds.length} dispatches bookmarked for offline reflection.`;
  } else {
    const count = AppState.articles.filter(a => a.category === AppState.activeCategory).length;
    heading.textContent = `All Dispatches in ${AppState.activeCategory}`;
    if (subheading) subheading.textContent = `Displaying all ${count} curated essays exploring ${AppState.activeCategory}.`;
  }
}

function scrollToDispatches() {
  const section = document.getElementById('articles-grid-section');
  if (section && window.scrollY > 400) {
    const topOffset = section.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: topOffset, behavior: 'smooth' });
  }
}

/* --------------------------------------------------------------------------
   Filter & Search & Sort Engine
   -------------------------------------------------------------------------- */
function applyFilters() {
  let list = [...AppState.articles];

  // Category filter
  if (AppState.activeCategory === 'Saved') {
    list = list.filter(a => AppState.savedArticleIds.includes(a.id));
  } else if (AppState.activeCategory !== 'All') {
    list = list.filter(a => a.category === AppState.activeCategory);
  }

  // Tag filter
  if (AppState.activeTag !== 'All') {
    list = list.filter(a => a.tags.includes(AppState.activeTag));
  }

  // Search query filter
  if (AppState.searchQuery.trim() !== '') {
    const query = AppState.searchQuery.toLowerCase().trim();
    list = list.filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.subtitle.toLowerCase().includes(query) ||
      a.excerpt.toLowerCase().includes(query) ||
      a.author.name.toLowerCase().includes(query) ||
      a.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  // Sorting
  if (AppState.sortBy === 'latest') {
    list.sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
  } else if (AppState.sortBy === 'popular') {
    list.sort((a, b) => (b.likesCount + b.bookmarksCount) - (a.likesCount + a.bookmarksCount));
  } else if (AppState.sortBy === 'shortest') {
    list.sort((a, b) => parseInt(a.readTime) - parseInt(b.readTime));
  } else if (AppState.sortBy === 'longest') {
    list.sort((a, b) => parseInt(b.readTime) - parseInt(a.readTime));
  }

  AppState.filteredArticles = list;
  renderArticles();
  updateArticlesCount();
}

function updateArticlesCount() {
  const countEl = document.getElementById('articles-count-badge');
  if (countEl) {
    countEl.textContent = `${AppState.filteredArticles.length} ${AppState.filteredArticles.length === 1 ? 'dispatch' : 'dispatches'}`;
  }
}

function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  AppState.searchQuery = '';
  applyFilters();
}

/* --------------------------------------------------------------------------
   Articles Grid Rendering (CSS Grid with Varied Card Archetypes)
   -------------------------------------------------------------------------- */
function renderArticles() {
  const gridContainer = document.getElementById('articles-grid');
  if (!gridContainer) return;

  // Empty state handling
  if (AppState.filteredArticles.length === 0) {
    if (AppState.activeCategory === 'Saved') {
      gridContainer.innerHTML = `
        <div class="col-span-full py-16 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-8 bg-white dark:bg-stone-900/50">
          <div class="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-stone-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
          </div>
          <h3 class="font-display-serif text-2xl text-stone-800 dark:text-stone-100 mb-2">Your Saved Reading List is Empty</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-6">Click the bookmark icon on any dispatch to curate your personal offline reading collection.</p>
          <button onclick="filterByCategory('All')" class="px-5 py-2.5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition">
            Explore All 30 Dispatches
          </button>
        </div>
      `;
    } else {
      gridContainer.innerHTML = `
        <div class="col-span-full py-16 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-8 bg-white dark:bg-stone-900/50">
          <div class="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-stone-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
          </div>
          <h3 class="font-display-serif text-2xl text-stone-800 dark:text-stone-100 mb-2">No editorial stories matched your criteria</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-6">We could not find any dispatches matching your current tag, search query, or category selection.</p>
          <button onclick="resetFilters()" class="px-5 py-2.5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition">
            Reset All Filters
          </button>
        </div>
      `;
    }
    return;
  }

  gridContainer.innerHTML = AppState.filteredArticles.map((article, index) => {
    const catTheme = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['Design & Typography'];
    const isSaved = AppState.savedArticleIds.includes(article.id);
    const isLiked = AppState.likedArticleIds.includes(article.id);
    const fallbackCover = generateCategoryArtworkSvg(article.category, article.title);
    
    // Asymmetric panoramic span every 6th card
    const isPanoramic = index % 6 === 0 && index !== 0;

    return `
      <article class="article-card editorial-card-glow group bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-xl overflow-hidden flex flex-col justify-between ${isPanoramic ? 'md:col-span-2' : ''}">
        <div>
          <!-- Article Cover -->
          <div class="relative ${isPanoramic ? 'h-64 sm:h-72' : 'h-52'} overflow-hidden card-image-wrap bg-stone-100 dark:bg-stone-800 cursor-pointer" onclick="openArticleReader('${article.id}')">
            <img 
              src="${article.coverImage}" 
              alt="${article.coverImageAlt}" 
              onerror="this.onerror=null; this.src='${fallbackCover}';"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              loading="lazy"
            />
            <div class="absolute top-3 left-3 z-10 flex items-center space-x-1.5">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${catTheme.badgeBg} ${catTheme.badgeText} border ${catTheme.badgeBorder} backdrop-blur-sm shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full ${catTheme.dotBg} mr-1.5"></span>
                ${article.category}
              </span>
            </div>

            <!-- Bookmark Quick Action -->
            <button 
              onclick="toggleBookmark('${article.id}', event)" 
              class="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 transition shadow-sm ${isSaved ? 'text-rose-600 dark:text-rose-400' : ''}"
              title="${isSaved ? 'Remove Bookmark' : 'Bookmark Story'}"
              aria-label="Bookmark article"
            >
              <svg class="w-4 h-4 ${isSaved ? 'fill-current' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
            </button>
          </div>

          <!-- Body Content -->
          <div class="p-6">
            <div class="flex items-center text-[11px] font-mono-code text-stone-500 dark:text-stone-400 space-x-2.5 mb-2.5">
              <span>${article.publishDate}</span>
              <span>•</span>
              <span class="flex items-center">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ${article.readTime}
              </span>
              <span>•</span>
              <span>${article.viewsCount || '24k'} reads</span>
            </div>

            <h2 class="font-display-serif ${isPanoramic ? 'text-2xl sm:text-3xl' : 'text-xl'} text-stone-900 dark:text-stone-100 font-normal leading-snug mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              <a href="javascript:void(0)" onclick="openArticleReader('${article.id}')" class="hover:underline decoration-rose-500/30 underline-offset-2">
                ${article.title}
              </a>
            </h2>

            <p class="font-editorial-serif text-sm text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-4">
              ${article.excerpt}
            </p>

            <!-- Tag Chips -->
            <div class="flex flex-wrap gap-1 mb-4">
              ${article.tags.slice(0, 3).map(tag => `
                <span 
                  onclick="filterByTag('${tag}')" 
                  class="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                >
                  #${tag}
                </span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer / Author Meta -->
        <div class="px-6 py-4 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between">
          <div class="flex items-center space-x-2.5 cursor-pointer group/auth" onclick="openAuthorModal('${article.author.id}')">
            <img 
              src="${article.author.avatar}" 
              alt="${article.author.name}" 
              onerror="this.onerror=null; this.src='${fallbackCover}';"
              class="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700 group-hover/auth:ring-rose-500 transition"
              loading="lazy"
            />
            <div>
              <p class="text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover/auth:text-rose-600 dark:group-hover/auth:text-rose-400 transition">
                ${article.author.name}
              </p>
              <p class="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[130px]">
                ${article.author.organization}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-1.5 text-xs text-stone-500 dark:text-stone-400">
            <button 
              onclick="toggleLike('${article.id}', event)" 
              class="p-1.5 rounded-full hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition flex items-center space-x-1 ${isLiked ? 'text-rose-600 dark:text-rose-400' : ''}"
              title="Like Story"
            >
              <svg class="w-3.5 h-3.5 ${isLiked ? 'fill-current' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              <span class="text-[11px] font-mono-code">${article.likesCount + (isLiked ? 1 : 0)}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   Authors Showcase Section (Editorial Masthead)
   -------------------------------------------------------------------------- */
function renderAuthors() {
  const container = document.getElementById('authors-container');
  if (!container) return;

  container.innerHTML = AppState.authors.map(author => {
    const authorArticlesCount = AppState.articles.filter(a => a.author.name === author.name).length;
    const fallbackAvatar = generateCategoryArtworkSvg('Design & Typography', author.name);

    return `
      <div class="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-900/60 transition shadow-sm">
        <div>
          <div class="flex items-start space-x-3.5 mb-3.5">
            <img 
              src="${author.avatar}" 
              alt="${author.name}" 
              onerror="this.onerror=null; this.src='${fallbackAvatar}';"
              class="w-12 h-12 rounded-full object-cover ring-2 ring-stone-200 dark:ring-stone-700"
              loading="lazy"
            />
            <div>
              <div class="flex items-center space-x-1.5">
                <h4 class="font-semibold text-stone-900 dark:text-stone-100 text-sm hover:text-rose-600 cursor-pointer" onclick="openAuthorModal('${author.id}')">${author.name}</h4>
              </div>
              <p class="text-xs text-rose-600 dark:text-rose-400 font-medium">${author.featuredBadge}</p>
              <p class="text-[11px] text-stone-400 dark:text-stone-500">${author.organization}</p>
            </div>
          </div>

          <p class="text-xs text-stone-600 dark:text-stone-300 font-editorial-serif line-clamp-3 mb-4 italic">
            "${author.bio}"
          </p>
        </div>

        <div class="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
          <span class="text-stone-500 font-mono-code">${authorArticlesCount} dispatches</span>
          <button 
            onclick="toggleFollowAuthor('${author.id}', this)" 
            class="px-3 py-1 rounded-full text-xs font-semibold border transition ${
              author.isFollowing 
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-200' 
                : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 hover:bg-rose-600 dark:hover:bg-rose-500'
            }"
          >
            ${author.isFollowing ? 'Following' : '+ Follow'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleFollowAuthor(authorId, btnElement) {
  const author = AppState.authors.find(a => a.id === authorId);
  if (!author) return;

  author.isFollowing = !author.isFollowing;
  if (author.isFollowing) {
    btnElement.textContent = 'Following';
    btnElement.className = 'px-3 py-1 rounded-full text-xs font-semibold border bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-200 transition';
    showToast(`You are now following ${author.name}`);
  } else {
    btnElement.textContent = '+ Follow';
    btnElement.className = 'px-3 py-1 rounded-full text-xs font-semibold border bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 hover:bg-rose-600 dark:hover:bg-rose-500 transition';
    showToast(`Unfollowed ${author.name}`);
  }
}

/* --------------------------------------------------------------------------
   Bookmarking System
   -------------------------------------------------------------------------- */
function toggleBookmark(articleId, event) {
  if (event) {
    event.stopPropagation();
  }

  const index = AppState.savedArticleIds.indexOf(articleId);
  const article = AppState.articles.find(a => a.id === articleId);
  const title = article ? article.title : 'Article';

  if (index === -1) {
    AppState.savedArticleIds.push(articleId);
    showToast(`Saved "${truncateText(title, 32)}" to your reading list`);
  } else {
    AppState.savedArticleIds.splice(index, 1);
    showToast(`Removed from your reading list`);
  }

  localStorage.setItem('chronicle_bookmarks', JSON.stringify(AppState.savedArticleIds));
  updateBookmarkBadge();
  
  // Re-render
  renderArticles();
  renderFeaturedStory();
  renderTrendingList();

  if (AppState.activeCategory === 'Saved') {
    applyFilters();
  }
}

function updateBookmarkBadge() {
  const badges = document.querySelectorAll('.bookmark-count-badge');
  badges.forEach(b => {
    b.textContent = AppState.savedArticleIds.length;
    if (AppState.savedArticleIds.length > 0) {
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function toggleLike(articleId, event) {
  if (event) event.stopPropagation();

  const index = AppState.likedArticleIds.indexOf(articleId);
  if (index === -1) {
    AppState.likedArticleIds.push(articleId);
    triggerFloatingClap(event);
    showToast('Appreciation noted. Thank you for reading!');
  } else {
    AppState.likedArticleIds.splice(index, 1);
  }

  localStorage.setItem('chronicle_likes', JSON.stringify(AppState.likedArticleIds));
  renderArticles();
}

function triggerFloatingClap(event) {
  if (!event) return;
  const target = event.currentTarget || event.target;
  const rect = target.getBoundingClientRect();
  
  const particle = document.createElement('div');
  particle.className = 'fixed font-mono-code font-bold text-rose-600 text-sm pointer-events-none floating-clap z-50';
  particle.textContent = '+1 ❤️';
  particle.style.left = `${rect.left + rect.width / 2}px`;
  particle.style.top = `${rect.top}px`;
  
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 850);
}

/* --------------------------------------------------------------------------
   Full Article Reader Modal with Fixed Table of Contents Scrolling
   -------------------------------------------------------------------------- */
function openArticleReader(articleId) {
  const article = AppState.articles.find(a => a.id === articleId);
  if (!article) return;

  AppState.currentArticle = article;
  const modal = document.getElementById('article-reader-modal');
  const catTheme = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['Design & Typography'];
  const fallbackCover = generateCategoryArtworkSvg(article.category, article.title);

  // Cover image
  const coverImg = document.getElementById('modal-cover-img');
  coverImg.src = article.coverImage;
  coverImg.alt = article.coverImageAlt;
  coverImg.onerror = () => { coverImg.src = fallbackCover; };
  
  // Header badges
  const catBadge = document.getElementById('modal-category-badge');
  catBadge.textContent = article.category;
  catBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${catTheme.badgeBg} ${catTheme.badgeText} border ${catTheme.badgeBorder}`;

  document.getElementById('modal-publish-date').textContent = article.publishDate;
  document.getElementById('modal-read-time').textContent = article.readTime;
  document.getElementById('modal-word-count').textContent = `${article.wordCount.toLocaleString()} words`;
  document.getElementById('modal-views-count').textContent = `${article.viewsCount || '32k'} reads`;

  document.getElementById('modal-article-title').textContent = article.title;
  document.getElementById('modal-article-subtitle').textContent = article.subtitle;

  // Author details
  const authorAvatar = document.getElementById('modal-author-avatar');
  authorAvatar.src = article.author.avatar;
  authorAvatar.alt = article.author.name;
  authorAvatar.onerror = () => { authorAvatar.src = fallbackCover; };

  document.getElementById('modal-author-name').textContent = article.author.name;
  document.getElementById('modal-author-role').textContent = `${article.author.role} • ${article.author.organization}`;
  document.getElementById('modal-author-bio').textContent = article.author.bio;

  // Body content
  const bodyEl = document.getElementById('modal-article-body');
  bodyEl.innerHTML = article.content;

  // Generate Table of Contents from h2 tags with in-modal scroll anchors
  generateTableOfContents(bodyEl);

  // Apply typography font & size
  applyFontSize(AppState.fontSizeMode);
  applyFontFamily(AppState.fontFamilyMode);

  // Tags
  const tagsContainer = document.getElementById('modal-article-tags');
  tagsContainer.innerHTML = article.tags.map(tag => `
    <span class="px-3 py-1 rounded-full text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium cursor-pointer hover:bg-rose-100 transition" onclick="closeArticleReader(); filterByTag('${tag}')">
      #${tag}
    </span>
  `).join('');

  // Audio simulator reset
  resetAudioSimulator(article.readTime);

  // Comments & saved author name
  const nameInput = document.getElementById('comment-name-input');
  if (nameInput) {
    nameInput.value = localStorage.getItem('chronicle_commenter_name') || '';
  }
  renderArticleComments(article.id);

  // Modal bookmark & like buttons
  updateModalActionButtons(article.id);

  // Show modal and prevent background scroll
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  // Reset scroll to top
  const modalScrollArea = document.getElementById('modal-scroll-area');
  if (modalScrollArea) {
    modalScrollArea.scrollTop = 0;
    updateReadingProgress(modalScrollArea);
  }
}

function generateTableOfContents(bodyEl) {
  const headings = bodyEl.querySelectorAll('h2');
  const tocContainer = document.getElementById('modal-toc-container');
  const tocList = document.getElementById('modal-toc-list');

  if (headings.length > 0 && tocContainer && tocList) {
    tocList.innerHTML = '';
    headings.forEach((h2, idx) => {
      const anchorId = `toc-heading-${idx}`;
      h2.id = anchorId;
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="javascript:void(0)" onclick="scrollToModalHeading('${anchorId}')" class="hover:text-rose-600 transition flex items-center text-xs text-stone-700 dark:text-stone-300 font-sans-ui py-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shrink-0"></span>
          <span>${h2.textContent}</span>
        </a>
      `;
      tocList.appendChild(li);
    });
    tocContainer.classList.remove('hidden');
  } else if (tocContainer) {
    tocContainer.classList.add('hidden');
  }
}

function scrollToModalHeading(anchorId) {
  const heading = document.getElementById(anchorId);
  const scrollArea = document.getElementById('modal-scroll-area');
  if (heading && scrollArea) {
    const headingTop = heading.offsetTop - 20;
    scrollArea.scrollTo({ top: headingTop, behavior: 'smooth' });
  }
}

function closeArticleReader() {
  const modal = document.getElementById('article-reader-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    stopAudioSimulator();
  }
}

function updateModalActionButtons(articleId) {
  const isSaved = AppState.savedArticleIds.includes(articleId);
  const isLiked = AppState.likedArticleIds.includes(articleId);

  const bookmarkBtn = document.getElementById('modal-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.innerHTML = `
      <svg class="w-5 h-5 ${isSaved ? 'fill-current text-rose-600' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
      <span>${isSaved ? 'Saved to List' : 'Save Story'}</span>
    `;
    bookmarkBtn.onclick = (e) => {
      toggleBookmark(articleId, e);
      updateModalActionButtons(articleId);
    };
  }

  const likeBtn = document.getElementById('modal-like-btn');
  if (likeBtn) {
    const article = AppState.articles.find(a => a.id === articleId);
    const count = article.likesCount + (isLiked ? 1 : 0);
    likeBtn.innerHTML = `
      <svg class="w-5 h-5 ${isLiked ? 'fill-current text-rose-600' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      <span>${count} Appreciations</span>
    `;
    likeBtn.onclick = (e) => {
      toggleLike(articleId, e);
      updateModalActionButtons(articleId);
    };
  }
}

/* --------------------------------------------------------------------------
   Reading Progress Bar & Typographic Controls
   -------------------------------------------------------------------------- */
function setupScrollListener() {
  const modalScrollArea = document.getElementById('modal-scroll-area');
  if (modalScrollArea) {
    modalScrollArea.addEventListener('scroll', () => {
      updateReadingProgress(modalScrollArea);
    });
  }
}

function updateReadingProgress(container) {
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight - container.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  
  const progressBar = document.getElementById('reading-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }
}

function setupTypographicControls() {
  applyFontSize(AppState.fontSizeMode);
  applyFontFamily(AppState.fontFamilyMode);
}

function setFontSize(mode) {
  AppState.fontSizeMode = mode;
  localStorage.setItem('chronicle_font_size', mode);
  applyFontSize(mode);
  showToast(`Typography size: ${mode.toUpperCase()}`);
}

function applyFontSize(mode) {
  const bodyEl = document.getElementById('modal-article-body');
  if (!bodyEl) return;

  if (mode === 'compact') {
    bodyEl.style.fontSize = '1.05rem';
    bodyEl.style.lineHeight = '1.65';
  } else if (mode === 'spacious') {
    bodyEl.style.fontSize = '1.35rem';
    bodyEl.style.lineHeight = '1.95';
  } else {
    bodyEl.style.fontSize = '1.2rem';
    bodyEl.style.lineHeight = '1.8';
  }

  const btns = document.querySelectorAll('[data-font-size-btn]');
  btns.forEach(btn => {
    if (btn.getAttribute('data-font-size-btn') === mode) {
      btn.classList.add('bg-stone-900', 'text-white', 'dark:bg-stone-100', 'dark:text-stone-900');
      btn.classList.remove('bg-stone-100', 'text-stone-700', 'dark:bg-stone-800', 'dark:text-stone-300');
    } else {
      btn.classList.remove('bg-stone-900', 'text-white', 'dark:bg-stone-100', 'dark:text-stone-900');
      btn.classList.add('bg-stone-100', 'text-stone-700', 'dark:bg-stone-800', 'dark:text-stone-300');
    }
  });
}

function setArticleFontFamily(family) {
  AppState.fontFamilyMode = family;
  localStorage.setItem('chronicle_font_family', family);
  applyFontFamily(family);
  showToast(`Typeface switched to: ${family.toUpperCase()}`);
}

function applyFontFamily(family) {
  const bodyEl = document.getElementById('modal-article-body');
  if (!bodyEl) return;

  bodyEl.classList.remove('font-editorial-serif', 'font-sans-ui', 'font-mono-code');

  const btnSerif = document.getElementById('btn-font-serif');
  const btnSans = document.getElementById('btn-font-sans');
  const btnMono = document.getElementById('btn-font-mono');

  [btnSerif, btnSans, btnMono].forEach(b => {
    if (b) {
      b.classList.remove('bg-stone-900', 'text-white', 'dark:bg-stone-100', 'dark:text-stone-900');
      b.classList.add('hover:bg-white', 'dark:hover:bg-stone-700');
    }
  });

  if (family === 'sans') {
    bodyEl.classList.add('font-sans-ui');
    if (btnSans) btnSans.classList.add('bg-stone-900', 'text-white', 'dark:bg-stone-100', 'dark:text-stone-900');
  } else if (family === 'mono') {
    bodyEl.classList.add('font-mono-code');
    if (btnMono) btnMono.classList.add('bg-stone-900', 'text-white', 'dark:bg-stone-100', 'dark:text-stone-900');
  } else {
    bodyEl.classList.add('font-editorial-serif');
    if (btnSerif) btnSerif.classList.add('bg-stone-900', 'text-white', 'dark:bg-stone-100', 'dark:text-stone-900');
  }
}

/* --------------------------------------------------------------------------
   Simulated Audio Reader
   -------------------------------------------------------------------------- */
function resetAudioSimulator(readTime) {
  stopAudioSimulator();
  AppState.audioProgress = 0;
  updateAudioUI(false, readTime, 0);
}

function toggleAudioSimulator() {
  if (AppState.isAudioPlaying) {
    stopAudioSimulator();
    showToast('Audio narration paused');
  } else {
    startAudioSimulator();
    showToast('Simulating synthesized audio narration...');
  }
}

function startAudioSimulator() {
  AppState.isAudioPlaying = true;
  updateAudioUI(true);

  AppState.audioInterval = setInterval(() => {
    AppState.audioProgress += 1;
    if (AppState.audioProgress >= 100) {
      stopAudioSimulator();
      AppState.audioProgress = 0;
      showToast('Audio narration complete');
    }
    updateAudioUI(true);
  }, 400);
}

function stopAudioSimulator() {
  AppState.isAudioPlaying = false;
  if (AppState.audioInterval) {
    clearInterval(AppState.audioInterval);
    AppState.audioInterval = null;
  }
  updateAudioUI(false);
}

function updateAudioUI(isPlaying, customTime, customProgress) {
  const btn = document.getElementById('audio-play-pause-btn');
  const bar = document.getElementById('audio-progress-bar');
  const icon = document.getElementById('audio-play-icon');

  if (btn && icon) {
    if (isPlaying) {
      icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
      btn.classList.add('border-rose-500', 'text-rose-600');
    } else {
      icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
      btn.classList.remove('border-rose-500', 'text-rose-600');
    }
  }

  if (bar) {
    bar.style.width = `${customProgress !== undefined ? customProgress : AppState.audioProgress}%`;
  }
}

/* --------------------------------------------------------------------------
   Article Comments System
   -------------------------------------------------------------------------- */
function renderArticleComments(articleId) {
  const container = document.getElementById('modal-comments-list');
  if (!container) return;

  const defaultComments = [
    {
      author: 'Marcus Vance',
      date: '2 hours ago',
      avatar: generateCategoryArtworkSvg('Architecture & Engineering', 'Marcus Vance'),
      comment: 'The mathematical argument for fluid optical typography with clamp() is brilliant. We just instituted this in our design system.'
    },
    {
      author: 'Clara Oswald',
      date: 'Yesterday',
      avatar: generateCategoryArtworkSvg('Culture & Philosophy', 'Clara Oswald'),
      comment: 'Subgrid row matching completely changes how we compose multi-card editorial grids without awkward white gaps. Inspiring piece!'
    }
  ];

  const customList = AppState.articleComments[articleId] || [];
  const allComments = [...customList, ...defaultComments];

  container.innerHTML = allComments.map(c => `
    <div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 mb-3">
      <div class="flex items-center space-x-3 mb-2">
        <img src="${c.avatar}" alt="${c.author}" class="w-7 h-7 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-600"/>
        <div>
          <h5 class="text-xs font-semibold text-stone-900 dark:text-stone-100">${c.author}</h5>
          <span class="text-[10px] text-stone-400 font-mono-code">${c.date}</span>
        </div>
      </div>
      <p class="text-xs text-stone-600 dark:text-stone-300 font-editorial-serif leading-relaxed">${c.comment}</p>
    </div>
  `).join('');
}

function handleCommentSubmit(event) {
  event.preventDefault();
  if (!AppState.currentArticle) return;

  const nameInput = document.getElementById('comment-name-input');
  const textInput = document.getElementById('comment-text-input');

  const name = nameInput.value.trim() || 'Anonymous Reader';
  const comment = textInput.value.trim();

  if (!comment) {
    showToast('Please write a brief comment before submitting');
    return;
  }

  // Persist commenter's name for convenience
  localStorage.setItem('chronicle_commenter_name', name);

  const newComment = {
    author: name,
    date: 'Just now',
    avatar: generateCategoryArtworkSvg(AppState.currentArticle.category, name),
    comment: comment
  };

  const articleId = AppState.currentArticle.id;
  if (!AppState.articleComments[articleId]) {
    AppState.articleComments[articleId] = [];
  }

  AppState.articleComments[articleId].unshift(newComment);
  localStorage.setItem('chronicle_comments', JSON.stringify(AppState.articleComments));

  renderArticleComments(articleId);
  textInput.value = '';
  showToast('Your perspective has been published.');
}

/* --------------------------------------------------------------------------
   Author Bio Modal
   -------------------------------------------------------------------------- */
function openAuthorModal(authorId) {
  const author = AppState.authors.find(a => a.id === authorId);
  if (!author) return;

  const modal = document.getElementById('author-modal');
  const avatarEl = document.getElementById('author-modal-avatar');
  const fallbackAvatar = generateCategoryArtworkSvg('Design & Typography', author.name);
  avatarEl.src = author.avatar;
  avatarEl.alt = author.name;
  avatarEl.onerror = () => { avatarEl.src = fallbackAvatar; };

  document.getElementById('author-modal-name').textContent = author.name;
  document.getElementById('author-modal-role').textContent = `${author.role} • ${author.organization}`;
  document.getElementById('author-modal-bio').textContent = author.bio;

  const authorArticles = AppState.articles.filter(a => a.author.name === author.name);
  document.getElementById('author-modal-dispatches').textContent = `${authorArticles.length} Published Dispatches`;
  document.getElementById('author-modal-followers').textContent = `${author.followersCount} Followers`;

  const articlesContainer = document.getElementById('author-modal-articles');
  articlesContainer.innerHTML = authorArticles.map(art => `
    <div class="p-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-rose-400 dark:hover:border-rose-700 transition cursor-pointer" onclick="closeAuthorModal(); openArticleReader('${art.id}')">
      <p class="text-xs font-mono-code text-stone-400 mb-1">${art.publishDate} • ${art.readTime}</p>
      <h5 class="text-sm font-display-serif text-stone-900 dark:text-stone-100 font-semibold hover:text-rose-600 transition">${art.title}</h5>
    </div>
  `).join('');

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeAuthorModal() {
  const modal = document.getElementById('author-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

/* --------------------------------------------------------------------------
   Newsletter Form & Subscription
   -------------------------------------------------------------------------- */
function handleNewsletterSubscription(event) {
  event.preventDefault();
  const emailInput = document.getElementById('newsletter-email-input');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !validateEmail(email)) {
    showToast('Please provide a valid email address');
    return;
  }

  // Simulated subscription save
  localStorage.setItem('chronicle_subscriber_email', email);
  
  // Show confirmation modal
  const confirmationModal = document.getElementById('subscription-modal');
  document.getElementById('subscriber-email-display').textContent = email;
  confirmationModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  emailInput.value = '';
}

function closeSubscriptionModal() {
  const modal = document.getElementById('subscription-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --------------------------------------------------------------------------
   Skills Learned Modal (Requirements Showcase)
   -------------------------------------------------------------------------- */
function openSkillsModal() {
  const modal = document.getElementById('skills-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeSkillsModal() {
  const modal = document.getElementById('skills-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

/* --------------------------------------------------------------------------
   Share Article
   -------------------------------------------------------------------------- */
function shareCurrentArticle() {
  if (!AppState.currentArticle) return;
  const dummyUrl = `${window.location.origin}${window.location.pathname}#article-${AppState.currentArticle.id}`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(dummyUrl).then(() => {
      showToast('Article permalink copied to clipboard!');
    }).catch(() => {
      showToast('Link copied: ' + dummyUrl);
    });
  } else {
    showToast('Link copied: ' + dummyUrl);
  }
}

/* --------------------------------------------------------------------------
   Event Listeners Setup
   -------------------------------------------------------------------------- */
function setupEventListeners() {
  // Theme Toggle Button
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Search Input
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (clearBtn) {
        if (AppState.searchQuery.length > 0) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
      }
      applyFilters();
    });
  }

  // Sort Dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      applyFilters();
    });
  }

  // Category navigation tabs
  const categoryTabs = document.querySelectorAll('[data-category-tab]');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = tab.getAttribute('data-category-tab');
      filterByCategory(cat);
    });
  });

  // Newsletter Form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
  }

  // Comment Form
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }

  // Backdrop click listeners to close modals when user clicks outside
  ['article-reader-modal', 'author-modal', 'subscription-modal', 'skills-modal'].forEach(modalId => {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          closeArticleReader();
          closeAuthorModal();
          closeSubscriptionModal();
          closeSkillsModal();
        }
      });
    }
  });

  // Keyboard escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeArticleReader();
      closeAuthorModal();
      closeSubscriptionModal();
      closeSkillsModal();
    }
  });
}

function resetFilters() {
  AppState.activeTag = 'All';
  AppState.activeCategory = 'All';
  AppState.searchQuery = '';
  AppState.sortBy = 'latest';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.add('hidden');

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'latest';

  updateCategoryPills();
  renderFeaturedStory();
  renderTrendingList();
  renderFilterTags();
  applyFilters();
  updateSectionHeadings();
  showToast('Filters cleared');
}

/* --------------------------------------------------------------------------
   Toast Feedback Notification
   -------------------------------------------------------------------------- */
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 3000);
}

function truncateText(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
