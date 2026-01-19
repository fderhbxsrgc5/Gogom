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

// Files for persistence without DB
const ratingsFile = path.join(__dirname, 'ratings.json');
if (!fs.existsSync(ratingsFile)) fs.writeFileSync(ratingsFile, JSON.stringify([]));

// Storage for music
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/music';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

// Routes
app.get('/', (req, res) => {
    const musicDir = path.join(__dirname, 'public/music');
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    
    fs.readdir(musicDir, (err, files) => {
        const playlist = (files || []).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
        const ratings = JSON.parse(fs.readFileSync(ratingsFile));
        res.render('index', { playlist, ratings });
    });
});

app.post('/rate', (req, res) => {
    const { rating } = req.body;
    const ratings = JSON.parse(fs.readFileSync(ratingsFile));
    ratings.push({ rating: parseInt(rating), date: new Date() });
    fs.writeFileSync(ratingsFile, JSON.stringify(ratings));
    res.redirect('/');
});

app.post('/upload', upload.array('music'), (req, res) => {
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    const { filename } = req.body;
    const filePath = path.join(__dirname, 'public/music', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`STARTCOPE MEGA FM running on port ${port}`);
});