const express = require('express');
const router = express.Router();
require('dotenv').config();

let links = []; // This should ideally be stored in a database

// Admin login page
router.get('/', (req, res) => {
  res.render('admin-login', { error: null });
});

// Handle login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.render('admin', { links, success: null });
  } else {
    res.render('admin-login', { error: 'Invalid password' });
  }
});

// Add new casino link
router.post('/add', (req, res) => {
  const { name, logo, description, playerUrl, agentUrl } = req.body;
  links.push({ name, logo, description, playerUrl, agentUrl });
  res.render('admin', { links, success: 'Casino added successfully!' });
});

module.exports = router;
