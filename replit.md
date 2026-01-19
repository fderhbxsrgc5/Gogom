# STARCOPE DWIZ FM

## Overview

STARCOPE DWIZ FM is a web-based radio station application that allows users to upload, manage, and play audio files through a browser-based music player. The application features a playlist management system, theme customization, and Progressive Web App (PWA) capabilities for offline support and installability.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js (v4.18.2) - Lightweight Node.js web framework
- **Template Engine**: EJS - Server-side rendering for dynamic HTML pages
- **File Upload**: Multer middleware handles music file uploads with disk storage
- **File Storage**: Audio files stored in `./public/music` directory with timestamped filenames to prevent conflicts

### Frontend Architecture
- **Rendering**: Server-side rendering with EJS templates
- **Styling**: Vanilla CSS with theme support (dark theme, blue theme)
- **JavaScript**: Vanilla JS for audio player controls, playlist navigation, and theme persistence
- **PWA Support**: Service worker (`sw.js`) with cache-first strategy for offline functionality

### API Structure
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Renders main page with playlist |
| `/upload` | POST | Handles music file uploads (multipart/form-data) |
| `/delete` | POST | Deletes a song by filename (JSON body) |

### Data Storage
- **File-based storage**: No database - audio files stored directly on filesystem
- **Client-side persistence**: localStorage for theme preferences
- **Supported formats**: MP3, WAV audio files

### Key Design Decisions

1. **No Database**: The application uses the filesystem for storing audio files, simplifying deployment but limiting scalability. Playlist is generated dynamically by reading the music directory.

2. **Server-side Rendering**: EJS templates render the playlist on the server, reducing client-side complexity but requiring page reloads for playlist updates after uploads.

3. **PWA Architecture**: Service worker caches static assets for offline access, though music files are fetched from network on demand.

## External Dependencies

### NPM Packages
- **express** (v4.18.2) - Web server framework
- **multer** (v1.4.5-lts.1) - Multipart form data handling for file uploads
- **ejs** (v3.1.9) - Templating engine

### Runtime Requirements
- Node.js runtime
- Port 5000 for HTTP server
- Write access to `./public/music` directory for file uploads