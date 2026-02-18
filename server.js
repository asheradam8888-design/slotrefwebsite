// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // load .env

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize links.json
if (!fs.existsSync('links.json')) {
  fs.writeFileSync('links.json', '[]');
}

// Utility functions
function getLinks() {
  return JSON.parse(fs.readFileSync('links.json'));
}

function saveLinks(data) {
  fs.writeFileSync('links.json', JSON.stringify(data, null, 2));
}

// ===== HOME PAGE =====
app.get('/', (req, res) => {
  const links = getLinks();
  res.render('index', { links });
});

// ===== ADMIN LOGIN PAGE =====
app.get('/admin', (req, res) => {
  res.render('admin-login', { error: null });
});

// ===== HANDLE ADMIN LOGIN =====
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const links = getLinks();
    res.render('admin', { links, success: null, error: null });
  } else {
    res.render('admin-login', { error: "Wrong password" });
  }
});

// ===== ADD NEW CASINO =====
app.post('/admin/add', (req, res) => {
  const links = getLinks();

  links.push({
    name: req.body.name,
    logo: req.body.logo,
    description: req.body.description,
    playerUrl: req.body.playerUrl,
    agentUrl: req.body.agentUrl
  });

  saveLinks(links);
  res.render('admin', { links, success: "Casino added successfully!", error: null });
});



// DELETE CASINO
app.post('/admin/delete', (req, res) => {
  const { index } = req.body; // index of casino to delete
  let links = getLinks();
  links.splice(index, 1); // remove the casino
  saveLinks(links);
  res.render('admin', { links, success: "Casino deleted!", error: null });
});

// EDIT CASINO
app.post('/admin/edit', (req, res) => {
  const { index, name, logo, description, playerUrl, agentUrl } = req.body;
  let links = getLinks();

  if (links[index]) {
    links[index] = { name, logo, description, playerUrl, agentUrl };
    saveLinks(links);
    res.render('admin', { links, success: "Casino updated!", error: null });
  } else {
    res.render('admin', { links, success: null, error: "Invalid casino index" });
  }
});


// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
