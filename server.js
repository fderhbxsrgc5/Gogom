const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const ratingsFile = path.join(__dirname, 'ratings.json');
if (!fs.existsSync(ratingsFile)) fs.writeFileSync(ratingsFile, JSON.stringify([]));

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

app.get('/', (req, res) => {
    const musicDir = path.join(__dirname, 'public/music');
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    
    fs.readdir(musicDir, (err, files) => {
        let playlist = [];
        if (!err && files) {
            playlist = files.filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
        }
        
        let ratings = [];
        try {
            if (fs.existsSync(ratingsFile)) {
                const content = fs.readFileSync(ratingsFile, 'utf8');
                ratings = JSON.parse(content || '[]');
            }
        } catch (e) {
            console.error("Ratings read error:", e);
        }
        
        let html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
        html = html.replace('const playlist = [];', `const playlist = ${JSON.stringify(playlist)};`);
        html = html.replace('Total Ratings: 0', `Total Ratings: ${ratings.length}`);
        
        let playlistHtml = '';
        playlist.forEach(track => {
            playlistHtml += `
                <li>
                    <div class="track-info">
                        <span>${track}</span>
                        <form action="/delete" method="POST" style="display:inline;">
                            <input type="hidden" name="filename" value="${track}">
                            <button type="submit" class="mini-delete">DELETE</button>
                        </form>
                    </div>
                </li>`;
        });
        html = html.replace('<ul id="playlist-display"></ul>', `<ul id="playlist-display">${playlistHtml}</ul>`);
        
        res.send(html);
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