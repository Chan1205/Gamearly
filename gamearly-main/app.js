
// Storage & helpers
const storageKey = "gamearly.bookmarks";
const filterKey = "gamearly.filters.genres";
const $ = s => document.querySelector(s);
const byId = id => document.getElementById(id);

function getBookmarks(){ try{ return new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")); }catch{ return new Set(); } }
function saveBookmarks(set){ localStorage.setItem(storageKey, JSON.stringify([...set])); }
function toggleBookmark(id){ const s=getBookmarks(); if(s.has(id)) s.delete(id); else s.add(id); saveBookmarks(s); return s.has(id); }
function isBookmarked(id){ return getBookmarks().has(id); }

function getGenreFilters(){ try{ return new Set(JSON.parse(localStorage.getItem(filterKey) || "[]")); }catch{ return new Set(); } }
function setGenreFilters(arr){ localStorage.setItem(filterKey, JSON.stringify(arr)); }

function formatPrice(p){ return p===0 ? "Free" : `$${p.toFixed(2)}`; }
function param(name){ return new URLSearchParams(location.search).get(name); }

// Home
(function initHome(){
  if (!byId("popularNow")) return;
  const pick = ids => ids.map(id => GAMES.find(g=>g.id===id)).filter(Boolean);
  const mk = g => `<a class="tile" href="game.html?id=${encodeURIComponent(g.id)}">${g.title}</a>`;
  byId("flashSale").innerHTML = pick(["hades","balatro"]).map(mk).join("");
  // 4 items now, so it looks balanced
  byId("popularNow").innerHTML = pick(["elden-ring","gow","botw","minecraft"]).map(mk).join("");
  byId("recs").innerHTML = pick(["stardew","hollow-knight"]).map(mk).join("");
  byId("recentReleases").innerHTML = pick(["balatro","elden-ring"]).map(mk).join("");
})();

// Search
(function initSearch(){
  const qEl = byId("q");
  const resEl = byId("results");
  if (!qEl || !resEl) return;

  const activeFiltersEl = byId("activeFilters");
  function renderActiveFilters(){
    const genres = [...getGenreFilters()];
    activeFiltersEl.innerHTML = genres.map(g=>`<span class="chip">${g}</span>`).join("") || '<span class="chip" style="opacity:.7">No genre filter</span>';
  }

  function search(){
    const tokens = qEl.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const minRating = parseFloat(byId("minRating").value) || 0;
    const maxPrice = parseFloat(byId("maxPrice").value) || Infinity;
    const filters = getGenreFilters();

    const results = GAMES.filter(g => {
      const hay = (g.title + " " + g.genres.join(" ")).toLowerCase();
      const matchesTokens = tokens.every(t => hay.includes(t));
      const matchesGenres = !filters.size || g.genres.some(gn => filters.has(gn));
      const matchesRating = (g.rating||0) >= minRating;
      const matchesPrice = (g.price||0) <= maxPrice;
      return (tokens.length?matchesTokens:true) && matchesGenres && matchesRating && matchesPrice;
    }).sort((a,b)=>b.rating - a.rating);

    resEl.innerHTML = results.map(g => `
      <div class="row">
        <div class="cover" aria-hidden="true"></div>
        <div>
          <a class="title" href="game.html?id=${encodeURIComponent(g.id)}">${g.title}</a>
          <div class="meta">${g.genres.join(" • ")} • ⭐ ${g.rating} • ${formatPrice(g.price)}</div>
        </div>
        <button class="icon-btn bm" data-id="${g.id}" title="Bookmark">${isBookmarked(g.id) ? "✅" : "🔖"}</button>
      </div>
    `).join("") || `<div class="meta">No matches. Try a different search.</div>`;
  }

  byId("doSearch").addEventListener("click", search);
  qEl.addEventListener("keydown", e => { if (e.key==="Enter") search(); });
  byId("minRating").addEventListener("change", search);
  byId("maxPrice").addEventListener("change", search);
  document.addEventListener("click", e => {
    if (e.target.classList.contains("bm")) {
      const id = e.target.dataset.id;
      e.target.textContent = toggleBookmark(id) ? "✅" : "🔖";
    }
  });

  renderActiveFilters();
  search();
})();

// Filter page
(function initFilter(){
  const grid = byId("genreGrid");
  if (!grid) return;
  const all = [...new Set(GAMES.flatMap(g=>g.genres))].sort();
  const selected = getGenreFilters();
  grid.innerHTML = all.map(gn => `<label><input type="checkbox" value="${gn}" ${selected.has(gn)?'checked':''}/> ${gn}</label>`).join("");

  byId("saveFilters").addEventListener("click", () => {
    const chosen = [...grid.querySelectorAll('input[type="checkbox"]:checked')].map(i=>i.value);
    setGenreFilters(chosen);
    location.href = "search.html";
  });
  byId("clearFilters").addEventListener("click", () => {
    setGenreFilters([]);
    location.href = "search.html";
  });
})();

// Bookmarks
(function initBookmarks(){
  const listEl = byId("bmList");
  if (!listEl) return;

  const compareSection = byId("compareSection");
  const compareBtn = byId("compareBtn");
  let selectedGames = new Set();

  function render(){
    const ids = [...getBookmarks()];
    byId("bmEmpty").style.display = ids.length ? "none" : "block";

    // Show compare section only if there are 2+ bookmarks
    if (compareSection) {
      compareSection.style.display = ids.length >= 2 ? "block" : "none";
    }

    const items = ids.map(id => GAMES.find(g=>g.id===id)).filter(Boolean);
    listEl.innerHTML = items.map(g => `
      <div class="tile-bookmark" data-game-id="${g.id}">
        <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
          <input type="checkbox" class="compare-checkbox" data-game-id="${g.id}" style="margin-top:4px;" />
          <div style="flex:1;">
            <h3 style="margin:0 0 6px;"><a href="game.html?id=${encodeURIComponent(g.id)}">${g.title}</a></h3>
            <div class="meta">${g.genres.join(" • ")} • ⭐ ${g.rating} • ${formatPrice(g.price)}</div>
          </div>
        </div>
        <div style="margin-top:8px; display:flex; gap:8px">
          <a class="btn secondary" href="game.html?id=${encodeURIComponent(g.id)}">Open</a>
          <button class="btn primary" data-remove="${g.id}">Remove</button>
        </div>
      </div>
    `).join("");

    // Reset selection
    selectedGames.clear();
    updateCompareButton();
  }

  function updateCompareButton() {
    if (!compareBtn) return;
    const count = selectedGames.size;
    compareBtn.disabled = count !== 2;
    compareBtn.textContent = count === 0 ? "Compare Selected Games" :
                             count === 1 ? "Select 1 more game" :
                             "Compare Selected Games";
  }

  // Handle checkbox selection
  document.addEventListener("change", e => {
    if (e.target.classList.contains("compare-checkbox")) {
      const gameId = e.target.getAttribute("data-game-id");
      if (e.target.checked) {
        selectedGames.add(gameId);
      } else {
        selectedGames.delete(gameId);
      }
      updateCompareButton();
    }
  });

  // Handle compare button click
  if (compareBtn) {
    compareBtn.addEventListener("click", () => {
      if (selectedGames.size === 2) {
        const gameIds = [...selectedGames];
        const game1 = GAMES.find(g => g.id === gameIds[0]);
        const game2 = GAMES.find(g => g.id === gameIds[1]);

        if (game1 && game2) {
          // Store comparison data and navigate to AI chat
          sessionStorage.setItem("compareGames", JSON.stringify({
            game1: { id: game1.id, title: game1.title, genres: game1.genres, rating: game1.rating, price: game1.price, year: game1.year },
            game2: { id: game2.id, title: game2.title, genres: game2.genres, rating: game2.rating, price: game2.price, year: game2.year }
          }));
          window.location.href = "explore.html?compare=true";
        }
      }
    });
  }

  document.addEventListener("click", e => {
    const id = e.target.getAttribute("data-remove");
    if (id) { const b=getBookmarks(); b.delete(id); saveBookmarks(b); render(); }
  });

  render();
})();

// Game page
(function initGame(){
  const el = byId("gameContainer");
  if (!el) return;
  const id = param("id");
  const g = GAMES.find(x=>x.id===id);
  if (!g){ el.innerHTML = '<p class="meta">Game not found.</p>'; return; }
  el.innerHTML = `
    <div class="game-header">
      <div class="cover" style="width:120px;height:120px;border-radius:12px;background:var(--card)" aria-hidden="true"></div>
      <div>
        <h1 style="margin:0 0 6px">${g.title}</h1>
        <div class="meta">${g.genres.join(" • ")} • ⭐ ${g.rating} • ${formatPrice(g.price)} • ${g.year}</div>
      </div>
      <button id="bmToggle" class="btn ${isBookmarked(g.id)?'primary':'secondary'}">${isBookmarked(g.id) ? "✅ Bookmarked" : "🔖 Bookmark"}</button>
    </div>

    <h2 style="margin-top:14px">About</h2>
    <p>Short description placeholder for <strong>${g.title}</strong>. Replace with your own copy.</p>

    <div class="kv">
      <div class="row"><strong>Release Date:</strong> <span>${g.year}</span></div>
      <div class="row"><strong>Developer:</strong> <span>Studio TBD</span></div>
      <div class="row"><strong>Genre:</strong> <span>${g.genres.join(", ")}</span></div>
      <div class="row"><strong>Rating:</strong> <span>${g.rating}</span></div>
    </div>

    <h2 style="margin-top:14px">Minimum Specs</h2>
    <p class="meta">CPU: TBD • GPU: TBD • RAM: 8GB • Disk: 20GB</p>

    <h2 style="margin-top:14px">Reviews</h2>
    <p class="meta">“Great game!” — Placeholder Review</p>
  `;
  byId("bmToggle").addEventListener("click", () => {
    const now = toggleBookmark(g.id);
    const btn = byId("bmToggle");
    btn.textContent = now ? "✅ Bookmarked" : "🔖 Bookmark";
    btn.className = "btn " + (now ? "primary" : "secondary");
  });
})();

// Account avatar upload/preview
(function initAccount(){
  const fileInput = document.getElementById("avatarInput");
  const btn = document.getElementById("changePhotoBtn");
  const img = document.getElementById("avatarImg");
  if (!fileInput || !btn || !img) return;

  const AVATAR_KEY = "gamearly.avatar.dataurl";
  try{
    const saved = localStorage.getItem(AVATAR_KEY);
    if (saved) img.src = saved;
    else img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"110\" height=\"110\"><rect width=\"100%\" height=\"100%\" fill=\"#CCF2FF\"/><circle cx=\"55\" cy=\"42\" r=\"22\" fill=\"#e6f9ff\"/><circle cx=\"55\" cy=\"95\" r=\"36\" fill=\"#e6f9ff\"/></svg>');
  }catch(e){}

  btn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      img.src = dataUrl;
      try{ localStorage.setItem(AVATAR_KEY, dataUrl); }catch(e){}
    };
    reader.readAsDataURL(file);
  });

  // Logout button functionality
  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear any session data
      const confirmed = confirm("Are you sure you want to log out?");
      if (confirmed) {
        // You can clear any user-specific data here if needed
        // localStorage.removeItem('userSession'); // example

        // Redirect to login page
        window.location.href = 'login.html';
      }
    });
  }
})();

// AI Chat
(function initChat(){
  const chatbox = byId("chatbox");
  const userInput = byId("userInput");
  const sendBtn = byId("sendBtn");
  if (!chatbox || !userInput || !sendBtn) return;

  // Parse comparison data from AI response
  function parseComparison(text) {
    const match = text.match(/\[COMPARE\]([\s\S]*?)\[\/COMPARE\]/);
    if (!match) return null;

    const content = match[1];
    const games = content.split('---').map(g => g.trim());

    if (games.length !== 2) return null;

    return games.map(gameText => {
      const lines = gameText.split('\n').filter(l => l.trim());
      const gameData = {};

      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (key && value) {
          gameData[key.trim().toLowerCase()] = value;
        }
      });

      return gameData;
    });
  }

  // Create side-by-side comparison view
  function createComparisonView(games) {
    const container = document.createElement("div");
    container.className = "comparison-container";

    games.forEach(game => {
      const card = document.createElement("div");
      card.className = "comparison-card";

      const title = document.createElement("h4");
      title.textContent = game.title || game.game1 || game.game2 || "Game";
      card.appendChild(title);

      // Add game details
      const details = ['genres', 'rating', 'price', 'year'];
      details.forEach(key => {
        if (game[key]) {
          const row = document.createElement("div");
          row.className = "detail-row";

          const label = document.createElement("strong");
          label.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ":";

          const value = document.createElement("span");
          value.textContent = game[key];

          row.appendChild(label);
          row.appendChild(value);
          card.appendChild(row);
        }
      });

      // Add summary if available
      if (game.summary) {
        const summary = document.createElement("div");
        summary.className = "summary";
        summary.textContent = game.summary;
        card.appendChild(summary);
      }

      container.appendChild(card);
    });

    return container;
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Hide canned questions after first message
    const cannedQuestions = chatbox.querySelector(".canned-questions");
    if (cannedQuestions) cannedQuestions.style.display = "none";

    // Add user message to chatbox
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message user";
    userMsg.textContent = message;
    chatbox.appendChild(userMsg);

    userInput.value = "";
    chatbox.scrollTop = chatbox.scrollHeight;

    // Add typing indicator
    const typingMsg = document.createElement("div");
    typingMsg.className = "chat-message bot";
    typingMsg.textContent = "...";
    chatbox.appendChild(typingMsg);
    chatbox.scrollTop = chatbox.scrollHeight;

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message + " (Please keep your response under 200 words)" }),
      });

      const data = await res.json();

      // Remove typing indicator
      chatbox.removeChild(typingMsg);

      // Check if this is a comparison response
      if (data.isComparison && data.reply.includes('[COMPARE]')) {
        const comparisonData = parseComparison(data.reply);
        if (comparisonData) {
          const comparisonContainer = createComparisonView(comparisonData);
          chatbox.appendChild(comparisonContainer);
        } else {
          // Fallback to regular message if parsing fails
          const botMsg = document.createElement("div");
          botMsg.className = "chat-message bot";
          botMsg.textContent = data.reply.replace(/\[COMPARE\]|\[\/COMPARE\]/g, '');
          chatbox.appendChild(botMsg);
        }
      } else {
        // Add regular bot response
        const botMsg = document.createElement("div");
        botMsg.className = "chat-message bot";
        botMsg.textContent = data.reply;
        chatbox.appendChild(botMsg);
      }
      chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
      chatbox.removeChild(typingMsg);
      const errorMsg = document.createElement("div");
      errorMsg.className = "chat-message bot";
      errorMsg.textContent = "Sorry, I'm having trouble connecting. Make sure the server is running.";
      chatbox.appendChild(errorMsg);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // Handle canned question clicks
  document.addEventListener("click", e => {
    if (e.target.classList.contains("canned-btn")) {
      const question = e.target.getAttribute("data-question");
      userInput.value = question;
      sendMessage();
    }
  });

  // Add welcome message
  const welcomeMsg = document.createElement("div");
  welcomeMsg.className = "chat-message bot";
  welcomeMsg.textContent = "Hi! I'm your game assistant. Ask me anything about games!";
  chatbox.appendChild(welcomeMsg);

  // Move canned questions after welcome message
  const cannedQuestions = chatbox.querySelector(".canned-questions");
  if (cannedQuestions) {
    chatbox.appendChild(cannedQuestions);
  }

  // Check if we're coming from bookmarks with a comparison request
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('compare') === 'true') {
    const compareData = sessionStorage.getItem('compareGames');
    if (compareData) {
      try {
        const { game1, game2 } = JSON.parse(compareData);

        // Hide canned questions
        if (cannedQuestions) cannedQuestions.style.display = "none";

        // Auto-trigger comparison
        const question = `Compare ${game1.title} and ${game2.title}`;
        userInput.value = question;

        // Clear the session storage
        sessionStorage.removeItem('compareGames');

        // Automatically send the comparison request
        setTimeout(() => {
          sendMessage();
        }, 500);
      } catch (e) {
        console.error("Error parsing comparison data:", e);
      }
    }
  }
})();
