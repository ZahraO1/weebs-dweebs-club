// ════════════════════════════════════════════════════
//  ⚙️  CONFIGURATION — replace this URL with yours!
//
//  Steps:
//  1. Open your Google Sheet
//  2. File → Share → Publish to web
//  3. Choose your sheet tab → select CSV → Publish
//  4. Copy the URL and paste it below
// ════════════════════════════════════════════════════
const SHEET_CSV_URL = "YOUR_GOOGLE_SHEETS_CSV_URL_HERE";

// ── Demo data — shown when no sheet URL is configured ──
const DEMO_BOOKS = [
  {
    Title: "Dune",
    Author: "Frank Herbert",
    Genre: "Sci-Fi",
    Rating: "5",
    "Date Read": "2024-01",
    "Cover URL": "",
    Notes: "An absolute masterpiece of world-building. Paul's journey feels both epic and intimate.",
  },
  {
    Title: "The Great Gatsby",
    Author: "F. Scott Fitzgerald",
    Genre: "Classic",
    Rating: "4",
    "Date Read": "2024-02",
    "Cover URL": "",
    Notes: "Fitzgerald's prose is stunning. The green light metaphor hit differently on this re-read.",
  },
  {
    Title: "Pachinko",
    Author: "Min Jin Lee",
    Genre: "Historical Fiction",
    Rating: "5",
    "Date Read": "2024-03",
    "Cover URL": "",
    Notes: "Four generations of heartbreak and resilience. I couldn't put it down.",
  },
  {
    Title: "Atomic Habits",
    Author: "James Clear",
    Genre: "Non-Fiction",
    Rating: "4",
    "Date Read": "2024-04",
    "Cover URL": "",
    Notes: "Practical, well-researched, and genuinely changed how I approach small changes.",
  },
  {
    Title: "Project Hail Mary",
    Author: "Andy Weir",
    Genre: "Sci-Fi",
    Rating: "5",
    "Date Read": "2024-05",
    "Cover URL": "",
    Notes: "Pure joy. Rocky is one of the best characters in modern sci-fi.",
  },
  {
    Title: "Normal People",
    Author: "Sally Rooney",
    Genre: "Literary Fiction",
    Rating: "3",
    "Date Read": "2024-06",
    "Cover URL": "",
    Notes: "Beautiful prose but I found the characters frustrating in the best and worst ways.",
  },
  {
    Title: "The Midnight Library",
    Author: "Matt Haig",
    Genre: "Fiction",
    Rating: "4",
    "Date Read": "2024-07",
    "Cover URL": "",
    Notes: "Cozy, philosophical, and genuinely moving. Perfect for a rainy afternoon.",
  },
  {
    Title: "Sapiens",
    Author: "Yuval Noah Harari",
    Genre: "Non-Fiction",
    Rating: "4",
    "Date Read": "2024-08",
    "Cover URL": "",
    Notes: "Changed how I think about human history. Controversial but fascinating.",
  },
];

// ════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════
let allBooks    = [];
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
    const values  = [];
    let cur       = "";
    let inQuote   = false;

    for (const ch of line) {
      if (ch === '"')               { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ""; }
      else                          { cur += ch; }
    }
    values.push(cur.trim());

    return Object.fromEntries(
      headers.map((h, i) => [h, (values[i] || "").replace(/^"|"$/g, "")])
    );
  }).filter(b => b.Title); // skip empty rows
}

// ════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════

/** Returns an HTML string of ★/☆ icons for a given rating (1–5). */
function starsHTML(rating) {
  const n = parseInt(rating) || 0;
  return [1, 2, 3, 4, 5]
    .map(i => `<span class="star ${i <= n ? "filled" : ""}">${i <= n ? "★" : "☆"}</span>`)
    .join("");
}

// ════════════════════════════════════════════════════
//  RENDER — STATS BAR
// ════════════════════════════════════════════════════
function renderStats(books) {
  document.getElementById("stat-count").textContent = books.length;

  const avg = books.length
    ? (books.reduce((sum, b) => sum + (parseInt(b.Rating) || 0), 0) / books.length).toFixed(1)
    : "—";
  document.getElementById("stat-avg").textContent = avg;

  const genres = new Set(books.map(b => b.Genre).filter(Boolean));
  document.getElementById("stat-genres").textContent = genres.size;
}

// ════════════════════════════════════════════════════
//  RENDER — GENRE FILTER BUTTONS
// ════════════════════════════════════════════════════
function renderGenreFilters(books) {
  const genres    = [...new Set(books.map(b => b.Genre).filter(Boolean))].sort();
  const container = document.getElementById("genre-filters");

  container.innerHTML = genres
    .map(g => `<button class="filter-btn" data-filter="${g}">${g}</button>`)
    .join("");

  container.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });
}

// ════════════════════════════════════════════════════
//  RENDER — SINGLE BOOK CARD
// ════════════════════════════════════════════════════
function buildCard(book, idx) {
  const card              = document.createElement("div");
  card.className          = "book-card";
  card.style.animationDelay = `${idx * 0.04}s`;
  card.onclick            = () => openModal(book);

  const hasCover = book["Cover URL"] && book["Cover URL"].startsWith("http");
  const coverHTML = hasCover
    ? `<img
         src="${book["Cover URL"]}"
         alt="${book.Title}"
         loading="lazy"
         onerror="this.parentElement.innerHTML='<div class=cover-placeholder><span class=ph-title>${book.Title}</span><span class=ph-author>${book.Author}</span></div>'"
       >`
    : `<div class="cover-placeholder">
         <span class="ph-title">${book.Title}</span>
         <span class="ph-author">${book.Author}</span>
       </div>`;

  card.innerHTML = `
    <div class="cover-wrap">
      ${coverHTML}
      ${book.Genre ? `<span class="genre-tag">${book.Genre}</span>` : ""}
    </div>
    <div class="card-body">
      <div class="card-title">${book.Title}</div>
      <div class="card-author">${book.Author || ""}</div>
      <div class="stars">${starsHTML(book.Rating)}</div>
      ${book["Date Read"] ? `<div class="card-date">${book["Date Read"]}</div>` : ""}
    </div>`;

  return card;
}

// ════════════════════════════════════════════════════
//  RENDER — BOOK GRID
// ════════════════════════════════════════════════════
function renderGrid() {
  const grid = document.getElementById("book-grid");

  const filtered = allBooks.filter(b => {
    const matchFilter = activeFilter === "all" || b.Genre === activeFilter;
    const matchRating = !activeRating || (parseInt(b.Rating) || 0) >= activeRating;
    const term        = searchTerm.toLowerCase();
    const matchSearch = !term
      || (b.Title  || "").toLowerCase().includes(term)
      || (b.Author || "").toLowerCase().includes(term);
    return matchFilter && matchRating && matchSearch;
  });

  grid.innerHTML = "";

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No books match your filters.</p></div>`;
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
  const hasCover = book["Cover URL"] && book["Cover URL"].startsWith("http");

  document.getElementById("modal-cover").innerHTML = hasCover
    ? `<img src="${book["Cover URL"]}" alt="${book.Title}">
       <button class="modal-close" onclick="closeModalBtn()">✕</button>`
    : `<div class="modal-cover-placeholder">📖</div>
       <button class="modal-close" onclick="closeModalBtn()">✕</button>`;

  document.getElementById("modal-genre").textContent  = book.Genre  || "";
  document.getElementById("modal-title").textContent  = book.Title  || "";
  document.getElementById("modal-author").textContent = book.Author ? `by ${book.Author}` : "";
  document.getElementById("modal-stars").innerHTML    = starsHTML(book.Rating);
  document.getElementById("modal-notes").textContent  = book.Notes  || "No notes yet.";
  document.getElementById("modal-date").textContent   = book["Date Read"] ? `Read: ${book["Date Read"]}` : "";

  document.getElementById("modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

/** Close when clicking the backdrop */
function closeModal(e) {
  if (e.target === document.getElementById("modal-overlay")) closeModalBtn();
}

/** Close when clicking the ✕ button or pressing Escape */
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
    // No URL set — show demo data and setup instructions
    books              = DEMO_BOOKS;
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
    try {
      // Use a CORS proxy so the browser can fetch the public CSV
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

  // Rating toggle buttons
  document.querySelectorAll("[data-rating]").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = parseInt(btn.dataset.rating);
      activeRating = activeRating === r ? 0 : r; // toggle off if already selected
      document.querySelectorAll("[data-rating]").forEach(b => b.classList.remove("active"));
      if (activeRating) btn.classList.add("active");
      renderGrid();
    });
  });

  // "All" genre button
  document.querySelector('[data-filter="all"]').addEventListener("click", () => setFilter("all"));

  // Search input
  document.getElementById("search-input").addEventListener("input", e => {
    searchTerm = e.target.value;
    renderGrid();
  });
}

init();