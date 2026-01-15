const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup
app.use(session({
  secret: 'your-secret-key', // Change in production
  resave: false,
  saveUninitialized: true
}));

// Data files (in production, use a database)
const usersFile = path.join(__dirname, 'data', 'users.json');
const logsFile = path.join(__dirname, 'data', 'logs.json');

// Ensure data files exist
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));
if (!fs.existsSync(logsFile)) fs.writeFileSync(logsFile, JSON.stringify({}));

const ua_list = [
  "Mozilla/5.0 (Linux; Android 10; Wildfire E Lite) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/298.0.0.10.115;]",
  "Mozilla/5.0 (Linux; Android 11; KINGKONG 5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/320.0.0.12.108;]",
  "Mozilla/5.0 (Linux; Android 11; G91 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.126 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/325.0.1.4.108;]"
];

async function extract_token(cookie, ua) {
  try {
    const res = await axios.get("https://business.facebook.com/business_locations", {
      headers: {
        "user-agent": ua,
        "referer": "https://www.facebook.com/",
        "Cookie": cookie
      }
    });
    const tokenMatch = res.data.match(/(EAAG\w+)/);
    return tokenMatch ? tokenMatch[1] : null;
  } catch (err) {
    console.error('Token extraction error:', err.message);
    return null;
  }
}

// Middleware to check login
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// Routes
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.render("login", { error: "Invalid credentials" });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  if (users.find(u => u.username === username)) {
    return res.render("signup", { error: "User exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword, cookies: [], totalShares: 0 });
  fs.writeFileSync(usersFile, JSON.stringify(users));
  res.redirect('/login');
});

app.get("/dashboard", requireLogin, (req, res) => {
  const logs = JSON.parse(fs.readFileSync(logsFile))[req.session.user.username] || [];
  res.render("dashboard", { user: req.session.user, logs });
});

app.post("/add-cookie", requireLogin, (req, res) => {
  const { cookie } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find(u => u.username === req.session.user.username);
  user.cookies.push(cookie);
  fs.writeFileSync(usersFile, JSON.stringify(users));
  req.session.user = user;
  res.redirect('/dashboard');
});

app.get("/share", requireLogin, (req, res) => {
  res.render("share", { user: req.session.user });
});

let stopFlag = false; // Global flag for stopping

app.post("/api/share", requireLogin, async (req, res) => {
  const { link: post_link, limit } = req.body;
  const limitNum = parseInt(limit, 10);
  const user = req.session.user;
  const users = JSON.parse(fs.readFileSync(usersFile));
  const userData = users.find(u => u.username === user.username);
  const logs = JSON.parse(fs.readFileSync(logsFile));
  if (!logs[user.username]) logs[user.username] = [];

  if (!userData.cookies.length || !post_link || !limitNum) {
    return res.json({ status: false, message: "Missing input or cookies." });
  }

  stopFlag = false;
  let success = 0, restored = 0, currentCookieIndex = 0;

  for (let i = 0; i < limitNum && !stopFlag; i++) {
    const cookie = userData.cookies[currentCookieIndex % userData.cookies.length];
    const ua = ua_list[Math.floor(Math.random() * ua_list.length)];
    const token = await extract_token(cookie, ua);
    if (!token) {
      logs[user.username].push(`Cookie ${currentCookieIndex + 1} suspended, restoring...`);
      restored++;
      currentCookieIndex++;
      continue;
    }

    try {
      const response = await axios.post(
        "https://graph.facebook.com/v18.0/me/feed",
        null,
        {
          params: { link: post_link, access_token: token, published: 0 },
          headers: { "user-agent": ua, "Cookie": cookie }
        }
      );
      if (response.data.id) {
        success++;
        logs[user.username].push(`Share ${i + 1} successful.`);
      } else {
        logs[user.username].push(`Share ${i + 1} failed.`);
        break;
      }
    } catch (err) {
      logs[user.username].push(`Share ${i + 1} error: ${err.message}`);
      break;
    }
    currentCookieIndex++;
  }

  userData.totalShares += success;
  fs.writeFileSync(usersFile, JSON.stringify(users));
  fs.writeFileSync(logsFile, JSON.stringify(logs));
  req.session.user = userData;

  res.json({
    status: true,
    message: `✅ Shared ${success} times. Restored ${restored} cookies.`,
    success_count: success,
    restored_count: restored,
    logs: logs[user.username].slice(-10) // Last 10 logs
  });
});

app.post("/stop-share", (req, res) => {
  stopFlag = true;
  res.json({ status: true, message: "Sharing stopped." });
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});