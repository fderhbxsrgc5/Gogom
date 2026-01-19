const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const ratingsFile = path.join(__dirname, 'ratings.json');
const listenersFile = path.join(__dirname, 'listeners.json');
if (!fs.existsSync(ratingsFile)) fs.writeFileSync(ratingsFile, JSON.stringify([]));
if (!fs.existsSync(listenersFile)) fs.writeFileSync(listenersFile, JSON.stringify({ count: 0 }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.query.type === 'ad' ? 'public/ads' : 'public/music';
        if (!fs.existsSync(type)) fs.mkdirSync(type, { recursive: true });
        cb(null, type);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

app.get('/', (req, res) => {
    const musicDir = path.join(__dirname, 'public/music');
    const adsDir = path.join(__dirname, 'public/ads');
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    if (!fs.existsSync(adsDir)) fs.mkdirSync(adsDir, { recursive: true });
    
    const musicFiles = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
    const adsFiles = fs.readdirSync(adsDir).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
    
    let ratings = [];
    try {
        ratings = JSON.parse(fs.readFileSync(ratingsFile, 'utf8') || '[]');
    } catch (e) {}

    let listenerData = { count: 0 };
    try {
        listenerData = JSON.parse(fs.readFileSync(listenersFile, 'utf8') || '{"count":0}');
    } catch (e) {}

    let html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
    
    // Inject Data
    html = html.replace('const playlist = [];', `const playlist = ${JSON.stringify(musicFiles)};`);
    html = html.replace('const adsList = [];', `const adsList = ${JSON.stringify(adsFiles)};`);
    html = html.replace('Total Ratings: 0', `Total Ratings: ${ratings.length}`);
    html = html.replace('Listeners: 0', `Listeners: ${listenerData.count}`);
    
    let playlistHtml = '';
    musicFiles.forEach(track => {
        playlistHtml += `<li><div class="track-info"><span>${track}</span><form action="/delete" method="POST" style="display:inline;"><input type="hidden" name="filename" value="${track}"><input type="hidden" name="type" value="music"><button type="submit" class="mini-delete">DELETE</button></form></div></li>`;
    });
    html = html.replace('<ul id="playlist-display"></ul>', `<ul id="playlist-display">${playlistHtml}</ul>`);

    let adsHtml = '';
    adsFiles.forEach(ad => {
        adsHtml += `<li><div class="track-info"><span>${ad}</span><form action="/delete" method="POST" style="display:inline;"><input type="hidden" name="filename" value="${ad}"><input type="hidden" name="type" value="ad"><button type="submit" class="mini-delete">DELETE</button></form></div></li>`;
    });
    html = html.replace('<ul id="ads-display"></ul>', `<ul id="ads-display">${adsHtml}</ul>`);
    
    res.send(html);
});

app.post('/update-listeners', (req, res) => {
    try {
        let data = JSON.parse(fs.readFileSync(listenersFile, 'utf8') || '{"count":0}');
        data.count += 1;
        fs.writeFileSync(listenersFile, JSON.stringify(data));
        res.json(data);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/rate', (req, res) => {
    const { rating } = req.body;
    const ratings = JSON.parse(fs.readFileSync(ratingsFile));
    ratings.push({ rating: parseInt(rating), date: new Date() });
    fs.writeFileSync(ratingsFile, JSON.stringify(ratings));
    res.redirect('/');
});

app.post('/upload', upload.array('files'), (req, res) => {
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    const { filename, type } = req.body;
    const dir = type === 'ad' ? 'public/ads' : 'public/music';
    const filePath = path.join(__dirname, dir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`STARTCOPE MEGA FM running on port ${port}`);
});