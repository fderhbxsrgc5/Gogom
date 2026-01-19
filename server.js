const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const port = 5000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'startcope-mega-fm-secret',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');

// Storage for music
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/music');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
    const musicDir = path.join(__dirname, 'public/music');
    fs.readdir(musicDir, (err, files) => {
        const playlist = (files || []).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
        res.render('index', { playlist });
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.send('Invalid credentials');
    }
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const musicDir = path.join(__dirname, 'public/music');
    fs.readdir(musicDir, (err, files) => {
        const playlist = (files || []).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
        res.render('admin', { playlist });
    });
});

app.post('/upload', (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send('Unauthorized');
    upload.array('music', 10)(req, res, (err) => {
        if (err) return res.send('Error uploading files');
        res.redirect('/admin');
    });
});

app.post('/delete', (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send('Unauthorized');
    const { filename } = req.body;
    const filePath = path.join(__dirname, 'public/music', filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    res.redirect('/admin');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`STARTCOPE MEGA FM running on port ${port}`);
});