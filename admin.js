const supabaseUrl = "https://ctmdtuzbdzqqmfrfqrnv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bWR0dXpiZHpxcW1mcmZxcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTk2MDAsImV4cCI6MjA4Njk5NTYwMH0.pJhh80drq8mqdDhRWACcGPOKExugrRyb3admLJDlMkc";

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const loginForm = document.getElementById("loginForm");
const casinoForm = document.getElementById("casinoForm");
const categoryForm = document.getElementById("categoryForm");
const contactForm = document.getElementById("contactForm");

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");

const logoutBtn = document.getElementById("logoutBtn");
const refreshCategoriesBtn = document.getElementById("refreshCategoriesBtn");
const refreshCasinosBtn = document.getElementById("refreshCasinosBtn");

const categoryList = document.getElementById("categoryList");
const adminCasinoList = document.getElementById("adminCasinoList");
const categorySelect = document.getElementById("categoryId");
const logoFileInput = document.getElementById("logoFile");
const contactUrlInput = document.getElementById("contactUrl");

const loginMessage = document.getElementById("loginMessage");
const categoryMessage = document.getElementById("categoryMessage");
const casinoMessage = document.getElementById("casinoMessage");
const contactMessage = document.getElementById("contactMessage");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setMessage(target, text, isError = false) {
  target.textContent = text;
  target.classList.toggle("error", isError);
}

function clearMessages() {
  setMessage(loginMessage, "");
  setMessage(categoryMessage, "");
  setMessage(casinoMessage, "");
  setMessage(contactMessage, "");
}

function showAdmin() {
  loginSection.style.display = "none";
  adminSection.style.display = "block";
}

function showLogin() {
  loginSection.style.display = "block";
  adminSection.style.display = "none";
}

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    setMessage(categoryMessage, `Under by load failed: ${error.message}`, true);
    categoryList.innerHTML = '<p class="empty-box">No under by available.</p>';
    categorySelect.innerHTML = '<option value="">No under by</option>';
    return;
  }

  categorySelect.innerHTML = '<option value="">No under by</option>' +
    data.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("");

  if (!data.length) {
    categoryList.innerHTML = '<p class="empty-box">No under by yet.</p>';
    return;
  }

  categoryList.innerHTML = data
    .map((category) => `
      <div class="list-item">
        <span>${escapeHtml(category.name)}</span>
        <button type="button" class="danger-btn" data-delete-category="${escapeHtml(category.id)}">Delete</button>
      </div>
    `)
    .join("");
}

async function loadCasinos() {
  const { data, error } = await supabaseClient
    .from("casinos")
    .select("id, name, logo, description, category_id, category:categories(name)")
    .order("created_at", { ascending: false });

  if (error) {
    adminCasinoList.innerHTML = '<p class="empty-box">Could not load casinos.</p>';
    return;
  }

  if (!data.length) {
    adminCasinoList.innerHTML = '<p class="empty-box">No casinos yet.</p>';
    return;
  }

  adminCasinoList.innerHTML = data
    .map((casino) => `
      <article class="admin-casino-card">
        <img src="${escapeHtml(casino.logo)}" alt="${escapeHtml(casino.name)} logo" class="casino-logo">
        <h4>${escapeHtml(casino.name)}</h4>
        <p>${escapeHtml(casino.description)}</p>
        <p class="muted">Category: ${escapeHtml(casino.category?.name || "Uncategorized")}</p>
        <button type="button" class="danger-btn" data-delete-casino="${escapeHtml(casino.id)}">Delete</button>
      </article>
    `)
    .join("");
}

async function loadContactLink() {
  const { data, error } = await supabaseClient
    .from("settings")
    .select("key, value")
    .eq("key", "contact_url")
    .maybeSingle();

  if (error) {
    setMessage(contactMessage, `Contact load failed: ${error.message}`, true);
    return;
  }

  if (data && contactUrlInput) {
    contactUrlInput.value = data.value || "";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage(loginMessage, "Login failed. Check your credentials.", true);
    return;
  }

  showAdmin();
  await loadCategories();
  await loadCasinos();
  await loadContactLink();
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const name = document.getElementById("categoryName").value.trim();
  if (!name) {
    setMessage(categoryMessage, "Category name is required.", true);
    return;
  }

  const { error } = await supabaseClient.from("categories").insert([{ name }]);

  if (error) {
    const isDuplicate = error.code === "23505";
    const message = isDuplicate
      ? "Under by already exists."
      : `Could not create under by: ${error.message}`;
    setMessage(categoryMessage, message, true);
    return;
  }

  categoryForm.reset();
  setMessage(categoryMessage, "Under by added.");
  await loadCategories();
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const url = contactUrlInput?.value.trim();
  if (!url) {
    setMessage(contactMessage, "Contact URL is required.", true);
    return;
  }

  const { error } = await supabaseClient
    .from("settings")
    .upsert([{ key: "contact_url", value: url }], { onConflict: "key" });

  if (error) {
    setMessage(contactMessage, `Could not save contact link: ${error.message}`, true);
    return;
  }

  setMessage(contactMessage, "Contact link saved.");
});

casinoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) {
    setMessage(casinoMessage, "You must be logged in.", true);
    return;
  }

  const file = logoFileInput?.files?.[0];
  if (!file) {
    setMessage(casinoMessage, "Please select a logo image.", true);
    return;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${Date.now()}_${safeName}`;

  const upload = await supabaseClient
    .storage
    .from("casino-logos")
    .upload(storagePath, file, { upsert: true });

  if (upload.error) {
    setMessage(casinoMessage, `Logo upload failed: ${upload.error.message}`, true);
    return;
  }

  const publicResult = supabaseClient
    .storage
    .from("casino-logos")
    .getPublicUrl(storagePath);

  const publicUrl = publicResult?.data?.publicUrl;
  if (!publicUrl) {
    setMessage(casinoMessage, "Logo uploaded but public URL is missing. Make the bucket public.", true);
    return;
  }

  const newCasino = {
    name: document.getElementById("name").value.trim(),
    logo: publicUrl,
    description: document.getElementById("description").value.trim(),
    playerUrl: document.getElementById("playerUrl").value.trim() || null,
    agentUrl: document.getElementById("agentUrl").value.trim() || null,
    category_id: document.getElementById("categoryId").value || null,
    user_id: user.id
  };

  const { error } = await supabaseClient.from("casinos").insert([newCasino]);

  if (error) {
    setMessage(casinoMessage, "Error adding casino. Check category/table columns.", true);
    return;
  }

  casinoForm.reset();
  setMessage(casinoMessage, "Casino added.");
  await loadCasinos();
});

categoryList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-category]");
  if (!button) return;

  clearMessages();
  const id = button.dataset.deleteCategory;

  const { error } = await supabaseClient.from("categories").delete().eq("id", id);

  if (error) {
    setMessage(categoryMessage, "Cannot delete under by in use by casinos.", true);
    return;
  }

  setMessage(categoryMessage, "Under by deleted.");
  await loadCategories();
  await loadCasinos();
});

adminCasinoList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-casino]");
  if (!button) return;

  clearMessages();
  const id = button.dataset.deleteCasino;

  const { error } = await supabaseClient.from("casinos").delete().eq("id", id);

  if (error) {
    setMessage(casinoMessage, "Failed to delete casino.", true);
    return;
  }

  setMessage(casinoMessage, "Casino deleted.");
  await loadCasinos();
});

refreshCategoriesBtn.addEventListener("click", loadCategories);
refreshCasinosBtn.addEventListener("click", loadCasinos);

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    showAdmin();
    await loadCategories();
    await loadCasinos();
    await loadContactLink();
  } else {
    showLogin();
  }
});
