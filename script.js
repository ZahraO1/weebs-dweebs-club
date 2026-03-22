// ════════════════════════════════════════════════════
//  ⚙️  CONFIGURATION — replace this URL with yours!
//
//  Steps:
//  1. Open your Google Sheet
//  2. File → Share → Publish to web
//  3. Choose your sheet tab → select CSV → Publish
//  4. Copy the URL and paste it below
// ════════════════════════════════════════════════════
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT26op5KMoi5aaeAasyo4AzPp1eCQW37JZUsKONMwo51CPn88tynZOv7Tg577zYKrvf3GxfNXFDTmDL/pub?gid=0&single=true&output=csv";

// ── Demo data — shown when no sheet URL is configured ──
// Columns match your Google Sheet exactly:
// name | status | ch? | type of media | genre | who's recording | rating | pg
const DEMO_BOOKS = [
  {
    name: "My Demon",
    status: "Completed",
    "ch?": "finished",
    "type of media": "K-Drama",
    genre: "Romance",
    "who's recording": "Anaum",
    rating: "9",
    pg: "PG-13",
  },
  {
    name: "Jujutsu Kaisen",
    status: "Ongoing",
    "ch?": "ch 245",
    "type of media": "Manga",
    genre: "Action",
    "who's recording": "Hiba",
    rating: "8",
    pg: "PG-13",
  },
  {
    name: "Oshi no Ko",
    status: "Ongoing",
    "ch?": "ep 9",
    "type of media": "Anime",
    genre: "Mystery",
    "who's recording": "Zahra",
    rating: "10",
    pg: "R",
  },
  {
    name: "Solo Leveling",
    status: "Completed",
    "ch?": "finished",
    "type of media": "Manhwa",
    genre: "Action",
    "who's recording": "Amnah",
    rating: "9",
    pg: "PG-13",
  },
  {
    name: "Dilwale Dulhania Le Jayenge",
    status: "Completed",
    "ch?": "finished",
    "type of media": "Bollywood",
    genre: "Romance",
    "who's recording": "Shanza",
    rating: "8",
    pg: "PG",
  },
  {
    name: "The Story of Yanxi Palace",
    status: "Hiatus",
    "ch?": "ep 32",
    "type of media": "C-Drama",
    genre: "Historical",
    "who's recording": "Shiza",
    rating: "7",
    pg: "PG",
  },
  {
    name: "Spy x Family",
    status: "Ongoing",
    "ch?": "ch 91",
    "type of media": "Manga",
    genre: "Comedy",
    "who's recording": "Fareeha",
    rating: "9",
    pg: "PG",
  },
  {
    name: "Omniscient Reader",
    status: "Ongoing",
    "ch?": "ch 120",
    "type of media": "Manhwa",
    genre: "Fantasy",
    "who's recording": "Default",
    rating: "10",
    pg: "PG-13",
  },
];

// ════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════
let allBooks     = [];
let activeFilter = "all";
let activeRating = 0;
let searchTerm   = "";

// ════════════════════════════════════════════════════
//  CSV PARSER
//  Handles quoted fields that may contain commas.
// ════════════════════════════════════════════════════
function parseCSV(text) {
  const lines   = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map(line => {
    const values = [];
    let cur      = "";
    let inQuote  = false;

    for (const ch of line) {
      if (ch === '"')                  { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ""; }
      else                             { cur += ch; }
    }
    values.push(cur.trim());

    return Object.fromEntries(
      headers.map((h, i) => [h, (values[i] || "").replace(/^"|"$/g, "")])
    );
  }).filter(b => b.name); // skip empty rows
}

// ════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════

/**
 * Returns a row of 10 star icons coloured up to the given rating.
 * Rating is out of 10.
 */
function starsHTML(rating) {
  const n = Math.min(parseInt(rating) || 0, 10);
  return Array.from({ length: 10 }, (_, i) =>
    `<span class="star ${i < n ? "filled" : ""}">★</span>`
  ).join("");
}

/**
 * Returns a colour-coded badge for the status value.
 */
function statusBadge(status) {
  const colours = {
    Completed: "#4caf7d",
    Ongoing:   "#c9973a",
    Hiatus:    "#e07b54",
    Unknown:   "#9e9e9e",
  };
  const colour = colours[status] || "#9e9e9e";
  return `<span style="
    display:inline-block;
    background:${colour};
    color:#fff;
    font-size:0.6rem;
    font-weight:700;
    letter-spacing:0.1em;
    text-transform:uppercase;
    padding:0.15rem 0.5rem;
    border-radius:2px;
    margin-bottom:0.5rem;
  ">${status || "Unknown"}</span>`;
}

// ════════════════════════════════════════════════════
//  RENDER — STATS BAR
// ════════════════════════════════════════════════════
function renderStats(books) {
  document.getElementById("stat-count").textContent = books.length;

  const avg = books.length
    ? (books.reduce((sum, b) => sum + (parseInt(b.rating) || 0), 0) / books.length).toFixed(1)
    : "—";
  document.getElementById("stat-avg").textContent = avg;

  const genres = new Set(books.map(b => b.genre).filter(Boolean));
  document.getElementById("stat-genres").textContent = genres.size;
}

// ════════════════════════════════════════════════════
//  RENDER — GENRE FILTER BUTTONS
// ════════════════════════════════════════════════════
function renderGenreFilters(books) {
  const genres    = [...new Set(books.map(b => b.genre).filter(Boolean))].sort();
  const container = document.getElementById("genre-filters");

  container.innerHTML = genres
    .map(g => `<button class="filter-btn" data-filter="${g}">${g}</button>`)
    .join("");

  container.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });
}

// ════════════════════════════════════════════════════
//  RENDER — SINGLE CARD
// ════════════════════════════════════════════════════
function buildCard(book, idx) {
  const card                = document.createElement("div");
  card.className            = "book-card";
  card.style.animationDelay = `${idx * 0.04}s`;
  card.onclick              = () => openModal(book);

  card.innerHTML = `
    <div class="cover-wrap">
      <div class="cover-placeholder">
        <span class="ph-title">${book.name || ""}</span>
        <span class="ph-author">${book["type of media"] || ""}</span>
      </div>
      ${book.genre ? `<span class="genre-tag">${book.genre}</span>` : ""}
    </div>
    <div class="card-body">
      ${statusBadge(book.status)}
      <div class="card-title">${book.name || ""}</div>
      <div class="card-author">${book["type of media"] || ""}</div>
      <div class="stars">${starsHTML(book.rating)}</div>
      <div class="card-date">
        ${book["ch?"] ? `Progress: ${book["ch?"]}` : ""}
        ${book["ch?"] && book["who's recording"] ? " · " : ""}
        ${book["who's recording"] ? `${book["who's recording"]}` : ""}
      </div>
    </div>`;

  return card;
}

// ════════════════════════════════════════════════════
//  RENDER — BOOK GRID
// ════════════════════════════════════════════════════
function renderGrid() {
  const grid = document.getElementById("book-grid");

  const filtered = allBooks.filter(b => {
    const matchFilter = activeFilter === "all" || b.genre === activeFilter;
    const matchRating = !activeRating || (parseInt(b.rating) || 0) >= activeRating;
    const term        = searchTerm.toLowerCase();
    const matchSearch = !term
      || (b.name             || "").toLowerCase().includes(term)
      || (b["type of media"] || "").toLowerCase().includes(term)
      || (b["who's recording"] || "").toLowerCase().includes(term);
    return matchFilter && matchRating && matchSearch;
  });

  grid.innerHTML = "";

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No entries match your filters.</p></div>`;
    return;
  }

  filtered.forEach((book, i) => grid.appendChild(buildCard(book, i)));
}

// ════════════════════════════════════════════════════
//  FILTER LOGIC
// ════════════════════════════════════════════════════
function setFilter(val) {
  activeFilter = val;
  document.querySelectorAll("[data-filter]").forEach(b =>
    b.classList.toggle("active", b.dataset.filter === val)
  );
  renderGrid();
}

// ════════════════════════════════════════════════════
//  MODAL — OPEN / CLOSE
// ════════════════════════════════════════════════════
function openModal(book) {
  // No cover images in your sheet, so always show the placeholder
  document.getElementById("modal-cover").innerHTML = `
    <div class="modal-cover-placeholder">📖</div>
    <button class="modal-close" onclick="closeModalBtn()">✕</button>`;

  document.getElementById("modal-genre").textContent  = book.genre             || "";
  document.getElementById("modal-title").textContent  = book.name              || "";
  document.getElementById("modal-author").textContent = book["type of media"]  || "";
  document.getElementById("modal-stars").innerHTML    = starsHTML(book.rating);

  // Notes section reused for recorder info
  document.getElementById("modal-notes").textContent =
    book["who's recording"]
      ? `Recorded by: ${book["who's recording"]}`
      : "No recorder listed.";

  // Meta line: status · progress · pg rating
  const parts = [
    book.status              ? `Status: ${book.status}`       : null,
    book["ch?"]              ? `Progress: ${book["ch?"]}`     : null,
    book.pg                  ? `Rated: ${book.pg}`            : null,
  ].filter(Boolean);

  document.getElementById("modal-date").textContent = parts.join("  ·  ");

  document.getElementById("modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

/** Close when clicking the backdrop */
function closeModal(e) {
  if (e.target === document.getElementById("modal-overlay")) closeModalBtn();
}

/** Close when clicking ✕ or pressing Escape */
function closeModalBtn() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModalBtn();
});

// ════════════════════════════════════════════════════
//  INITIALISE
// ════════════════════════════════════════════════════
async function init() {
  const loading = document.getElementById("loading-state");
  const banner  = document.getElementById("config-banner");
  let books;

  if (!SHEET_CSV_URL || SHEET_CSV_URL === "YOUR_GOOGLE_SHEETS_CSV_URL_HERE") {
    // No URL set — show demo data and setup banner
    books                = DEMO_BOOKS;
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
    try {
      // CORS proxy lets the browser fetch a public Google Sheets CSV
      const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(SHEET_CSV_URL)}`;
      const res      = await fetch(proxyURL);
      const text     = await res.text();
      books          = parseCSV(text);
    } catch (err) {
      loading.innerHTML = `<p style="color:#c0392b">⚠️ Could not load sheet. Check the URL and ensure the sheet is published publicly.</p>`;
      console.error(err);
      return;
    }
  }

  allBooks = books;
  loading.style.display = "none";

  renderStats(allBooks);
  renderGenreFilters(allBooks);
  renderGrid();

  // Rating filter buttons (now out of 10)
  document.querySelectorAll("[data-rating]").forEach(btn => {
    btn.addEventListener("click", () => {
      const r      = parseInt(btn.dataset.rating);
      activeRating = activeRating === r ? 0 : r; // toggle off if already active
      document.querySelectorAll("[data-rating]").forEach(b => b.classList.remove("active"));
      if (activeRating) btn.classList.add("active");
      renderGrid();
    });
  });

  // "All" genre button
  document.querySelector('[data-filter="all"]').addEventListener("click", () => setFilter("all"));

  // Search — matches name, media type, or recorder
  document.getElementById("search-input").addEventListener("input", e => {
    searchTerm = e.target.value;
    renderGrid();
  });
}

init();