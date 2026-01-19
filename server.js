const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ratingsFile = path.join(__dirname, 'ratings.json');
const listenersFile = path.join(__dirname, 'listeners.json');
const postsFile = path.join(__dirname, 'posts.json');
const usersFile = path.join(__dirname, 'users.json');

[ratingsFile, listenersFile, postsFile, usersFile].forEach(file => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, file.includes('listeners') ? JSON.stringify({ count: 0 }) : JSON.stringify([]));
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = req.query.type === 'ad' ? 'public/ads' : (req.query.type === 'post' ? 'public/posts' : 'public/music');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.get('/', (req, res) => {
    const musicDir = path.join(__dirname, 'public/music');
    const adsDir = path.join(__dirname, 'public/ads');
    [musicDir, adsDir].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
    
    const musicFiles = fs.readdirSync(musicDir).filter(f => f.match(/\.(mp3|m4a|wav)$/));
    const adsFiles = fs.readdirSync(adsDir).filter(f => f.match(/\.(mp3|m4a|wav)$/));
    
    const ratings = JSON.parse(fs.readFileSync(ratingsFile, 'utf8') || '[]');
    const listenerData = JSON.parse(fs.readFileSync(listenersFile, 'utf8') || '{"count":0}');
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8') || '[]');

    let html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
    html = html.replace('const playlist = [];', `const playlist = ${JSON.stringify(musicFiles)};`);
    html = html.replace('const adsList = [];', `const adsList = ${JSON.stringify(adsFiles)};`);
    html = html.replace('const initialPosts = [];', `const initialPosts = ${JSON.stringify(posts)};`);
    html = html.replace('Total Ratings: 0', `Total Ratings: ${ratings.length}`);
    html = html.replace('Listeners: 0', `Listeners: ${listenerData.count}`);
    
    res.send(html);
});

app.post('/register', (req, res) => {
    const { name } = req.body;
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]');
    if (!users.find(u => u.name === name)) {
        users.push({ name, joined: new Date() });
        fs.writeFileSync(usersFile, JSON.stringify(users));
    }
    res.json({ success: true, name });
});

app.post('/post', upload.single('image'), (req, res) => {
    const { content, author } = req.body;
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8') || '[]');
    const newPost = {
        id: Date.now(),
        content,
        author,
        image: req.file ? `/posts/${req.file.filename}` : null,
        likes: 0,
        comments: [],
        date: new Date()
    };
    posts.unshift(newPost);
    fs.writeFileSync(postsFile, JSON.stringify(posts));
    res.redirect('/');
});

app.post('/like', (req, res) => {
    const { postId } = req.body;
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8') || '[]');
    const post = posts.find(p => p.id == postId);
    if (post) post.likes++;
    fs.writeFileSync(postsFile, JSON.stringify(posts));
    res.json({ success: true, likes: post.likes });
});

app.post('/comment', (req, res) => {
    const { postId, comment, author } = req.body;
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8') || '[]');
    const post = posts.find(p => p.id == postId);
    if (post) post.comments.push({ author, text: comment, date: new Date() });
    fs.writeFileSync(postsFile, JSON.stringify(posts));
    res.redirect('/');
});

app.post('/update-listeners', (req, res) => {
    let data = JSON.parse(fs.readFileSync(listenersFile, 'utf8') || '{"count":0}');
    data.count += 1;
    fs.writeFileSync(listenersFile, JSON.stringify(data));
    res.json(data);
});

app.post('/upload', upload.array('files'), (req, res) => res.redirect('/'));
app.post('/delete', (req, res) => {
    const { filename, type } = req.body;
    const dir = type === 'ad' ? 'public/ads' : 'public/music';
    const filePath = path.join(__dirname, dir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/');
});

app.listen(port, '0.0.0.0', () => console.log(`STARTCOPE MEGA FM running on port ${port}`));