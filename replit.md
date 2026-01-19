# Startcope Mega FM

## Overview

This is a web-based radio/music streaming application called "Startcope Mega FM". It provides a live radio experience where users can listen to uploaded music tracks. The application includes a public-facing player interface and an admin panel for managing the music library.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js (v5.2.1) - Node.js web application framework
- **Template Engine**: EJS for server-side HTML rendering
- **Session Management**: express-session for handling admin authentication
- **File Uploads**: Multer for handling music file uploads

### Frontend Architecture
- **Styling**: Custom CSS with a futuristic/neon aesthetic (Orbitron font, cyan glow effects)
- **Static Files**: Served from the `public` directory
- **Views**: EJS templates for dynamic page rendering

### Authentication
- Simple session-based admin authentication
- Hardcoded credentials (admin/admin123) - intended for basic demo/development use
- Admin session stored via express-session middleware

### File Storage
- Music files stored in `public/music` directory
- Supported formats: MP3, M4A, WAV
- Files renamed with timestamp on upload to avoid conflicts

### Route Structure
- `/` - Public homepage with music player and playlist
- `/login` - Admin login page
- `/admin` - Admin panel for music management (requires authentication)

## External Dependencies

### NPM Packages
- **express** (v5.2.1) - Web server framework
- **ejs** (v4.0.1) - Templating engine
- **express-session** (v1.18.2) - Session middleware for authentication
- **multer** (v2.0.2) - Multipart form handling for file uploads

### External Resources
- **Google Fonts**: Orbitron font family (referenced in CSS)

### Storage
- **File System**: Local filesystem for music file storage (no database currently configured)