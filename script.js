const supabaseUrl = "https://ctmdtuzbdzqqmfrfqrnv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bWR0dXpiZHpxcW1mcmZxcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTk2MDAsImV4cCI6MjA4Njk5NTYwMH0.pJhh80drq8mqdDhRWACcGPOKExugrRyb3admLJDlMkc";

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const casinoContainer = document.getElementById("casinoContainer");
const categoryFilters = document.getElementById("categoryFilters");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuBackdrop = document.getElementById("menuBackdrop");
const contactLink = document.getElementById("contactLink");

let allCasinos = [];
let allCategories = [];
let selectedCategory = "all";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCategoryFilters() {
  const baseFilter = `
    <button class="category-chip ${selectedCategory === "all" ? "active" : ""}" data-filter="all" type="button">
      All
    </button>
  `;

  const dynamicFilters = allCategories
    .map((category) => {
      const isActive = selectedCategory === String(category.id);
      return `
        <button class="category-chip ${isActive ? "active" : ""}" data-filter="${escapeHtml(category.id)}" type="button">
          ${escapeHtml(category.name)}
        </button>
      `;
    })
    .join("");

  categoryFilters.innerHTML = baseFilter + dynamicFilters;
}

function getCategoryName(casino) {
  if (casino.category && casino.category.name) {
    return casino.category.name;
  }

  const byId = allCategories.find((category) => String(category.id) === String(casino.category_id));
  return byId ? byId.name : "Uncategorized";
}

function renderCasinos() {
  const filteredCasinos = selectedCategory === "all"
    ? allCasinos
    : allCasinos.filter((casino) => String(casino.category_id) === selectedCategory);

  if (!filteredCasinos.length) {
    casinoContainer.innerHTML = '<div class="empty-box">No casinos found for this category yet.</div>';
    return;
  }

  casinoContainer.innerHTML = filteredCasinos
    .map((casino) => {
      const hasPlayer = casino.playerUrl && casino.playerUrl.trim() !== "";
      const hasAgent = casino.agentUrl && casino.agentUrl.trim() !== "";

      const buttons = [];
      if (hasPlayer) {
        const label = hasAgent ? "Register as Player" : "Register";
        buttons.push(`
          <a href="${escapeHtml(casino.playerUrl)}" target="_blank" rel="noopener noreferrer" class="player-btn">
            ${label}
          </a>
        `);
      }
      if (hasAgent) {
        const label = hasPlayer ? "Register as Agent" : "Register";
        buttons.push(`
          <a href="${escapeHtml(casino.agentUrl)}" target="_blank" rel="noopener noreferrer" class="agent-btn">
            ${label}
          </a>
        `);
      }

      return `
        <article class="casino-card">
          <div class="card-header">
            <img src="${escapeHtml(casino.logo)}" class="casino-logo-large" alt="${escapeHtml(casino.name)} logo">
            <div class="casino-info">
              <p class="category-tag">Under by: ${escapeHtml(getCategoryName(casino))}</p>
              <h2>${escapeHtml(casino.name)}</h2>
              <p>${escapeHtml(casino.description)}</p>
            </div>
          </div>
          <div class="divider"></div>
          <div class="btn-group">${buttons.join("")}</div>
        </article>
      `;
    })
    .join("");
}

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (!error && Array.isArray(data)) {
    allCategories = data;
  } else {
    allCategories = [];
  }

  renderCategoryFilters();
}

async function loadCasinos() {
  const { data, error } = await supabaseClient
    .from("casinos")
    .select("id, name, logo, description, playerUrl, agentUrl, category_id, category:categories(id, name)")
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabaseClient
      .from("casinos")
      .select("id, name, logo, description, playerUrl, agentUrl, category_id")
      .order("created_at", { ascending: false });

    if (fallback.error) {
      casinoContainer.innerHTML = '<div class="empty-box">Error loading casinos.</div>';
      return;
    }

    allCasinos = fallback.data || [];
    renderCasinos();
    return;
  }

  allCasinos = data || [];
  renderCasinos();
}

async function loadContactLink() {
  const { data, error } = await supabaseClient
    .from("settings")
    .select("key, value")
    .eq("key", "contact_url")
    .maybeSingle();

  if (error) {
    return;
  }

  if (data?.value && contactLink) {
    contactLink.href = data.value;
    contactLink.target = "_blank";
  }
}

categoryFilters.addEventListener("click", (event) => {
  const chip = event.target.closest(".category-chip");
  if (!chip) return;

  selectedCategory = chip.dataset.filter || "all";
  renderCategoryFilters();
  renderCasinos();
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await loadCasinos();
  await loadContactLink();
});

function openMenu() {
  if (!sideMenu) return;
  sideMenu.classList.add("open");
  sideMenu.setAttribute("aria-hidden", "false");
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
  if (menuBackdrop) menuBackdrop.hidden = false;
}

function closeMenu() {
  if (!sideMenu) return;
  sideMenu.classList.remove("open");
  sideMenu.setAttribute("aria-hidden", "true");
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  if (menuBackdrop) menuBackdrop.hidden = true;
}

if (menuToggle) {
  menuToggle.addEventListener("click", openMenu);
}
if (menuClose) {
  menuClose.addEventListener("click", closeMenu);
}
if (menuBackdrop) {
  menuBackdrop.addEventListener("click", closeMenu);
}
