const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Stats file path
const statsFile = './stats.json';

// Initialize stats
const getStats = () => {
    if (!fs.existsSync(statsFile)) {
        fs.writeFileSync(statsFile, JSON.stringify({ views: 0, likes: 0 }));
    }
    return JSON.parse(fs.readFileSync(statsFile));
};

const saveStats = (stats) => {
    fs.writeFileSync(statsFile, JSON.stringify(stats));
};

// Setup storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/music';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    const stats = getStats();
    stats.views += 1; // Increment views on home page visit
    saveStats(stats);

    const musicDir = './public/music';
    fs.readdir(musicDir, (err, files) => {
        const playlist = files ? files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav')) : [];
        res.render('index', { playlist, stats });
    });
});

app.post('/like', (req, res) => {
    const stats = getStats();
    stats.likes += 1;
    saveStats(stats);
    res.json({ success: true, likes: stats.likes });
});

app.post('/upload', upload.single('music'), (req, res) => {
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    const { filename } = req.body;
    const filePath = path.join(__dirname, 'public/music', filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
