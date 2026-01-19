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
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit per file
});

// Routes
app.get('/', (req, res) => {
    const musicDir = path.join(__dirname, 'public/music');
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    fs.readdir(musicDir, (err, files) => {
        const playlist = (files || []).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
        res.render('index', { playlist });
    });
});

app.post('/upload', upload.array('music'), (req, res) => {
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    const { filename } = req.body;
    const filePath = path.join(__dirname, 'public/music', filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    res.redirect('/');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`STARTCOPE MEGA FM running on port ${port}`);
});