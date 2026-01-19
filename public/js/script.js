const audio = document.getElementById('audio-player');
const playlist = document.getElementById('playlist');
const songs = playlist.getElementsByTagName('li');
let currentSongIndex = 0;

function playSong(index) {
    if (index >= songs.length) index = 0;
    if (index < 0) return;
    
    currentSongIndex = index;
    const src = songs[index].getAttribute('data-src');
    audio.src = src;
    audio.play();
    
    // Highlight current song
    for (let i = 0; i < songs.length; i++) {
        songs[i].style.fontWeight = i === index ? 'bold' : 'normal';
    }
}

document.getElementById('play-btn').addEventListener('click', () => {
    if (songs.length > 0) {
        if (audio.paused) audio.play();
        else audio.pause();
    }
});

for (let i = 0; i < songs.length; i++) {
    songs[i].addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            playSong(i);
        }
    });
}

audio.addEventListener('ended', () => {
    playSong(currentSongIndex + 1);
});

function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.className = savedTheme;
}

async function deleteSong(filename) {
    if (confirm('Delete this song?')) {
        const res = await fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        if (res.ok) window.location.reload();
    }
}

// KMPS Signal Simulator
setInterval(() => {
    const signal = Math.floor(Math.random() * 100) + 50;
    document.getElementById('signal').innerText = signal;
}, 2000);
