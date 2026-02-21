# HorizonX

**HorizonX** is a modern movie streaming platform prototype built using **React, TypeScript, Vite, and Express.js**.
It provides a luxury-style streaming interface powered by **TMDB movie data** and a secure backend API proxy.

This project demonstrates how a real streaming platform architecture works, including frontend UI, backend API handling, and secure environment configuration.

---

## Features

* Modern Netflix-style UI
* Movie and TV show browsing
* TMDB API integration
* Express.js backend proxy
* Secure API key handling
* Video player support
* Fast React + Vite development
* Single server deployment
* Environment variable security
* Rate-limited API protection

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* HTML5 Video Player
* CSS

### Backend

* Node.js
* Express.js
* Helmet Security
* Express Rate Limit

### API

* TMDB API (Movie Metadata)

---

## Project Structure

```
HorizonX/
│
├── public/            # Static frontend files
│
├── server.js          # Express server
│
├── .env.example       # Environment template
│
├── package.json
│
└── README.md
```

---

## Installation

Clone the repository:

```
git clone https://github.com/yourusername/cinevault.git
```

Move into the project folder:

```
cd cinevault
```

Install dependencies:

```
npm install
```

Create environment file:

```
cp .env.example .env
```

Edit `.env` and add your TMDB API key:

```
TMDB_API_KEY=your_api_key_here
```

Get your API key from:

https://www.themoviedb.org/settings/api

Start the server:

```
npm start
```

Open in browser:

```
http://localhost:3001
```

---

## Environment Variables

Required variables:

```
TMDB_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
```

Never upload `.env` to GitHub.

---

## Security

This project includes basic security features:

* Helmet for secure HTTP headers
* Express rate limiting
* API request validation
* Environment variable protection
* Hidden server files

Only the **public/** folder is accessible to users.

Private files like:

* `.env`
* `server.js`
* `node_modules`

are never exposed.

---

## Deployment

This project can be deployed on:

* Render
* Railway
* VPS
* Node.js hosting services

Set the following environment variables on your host:

```
TMDB_API_KEY
PORT
NODE_ENV=production
```

Start command:

```
npm start
```

---

## Educational Purpose

This project was built as a **learning project** to understand:

* Full-stack development
* API integration
* Backend proxies
* Secure environment configuration
* Video streaming basics

This project uses **TMDB API for movie information**.

No copyrighted content is included in this repository.

---

## Future Improvements

Planned features:

* User login system
* Watchlist feature
* Search improvements
* Streaming quality selector
* Recommendation system
* Mobile optimization

---

## License

This project is for educational purposes only.
