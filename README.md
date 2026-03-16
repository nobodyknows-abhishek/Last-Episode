# LastEpisode

LastEpisode is a full-stack anime discovery and co-watching web app. It lets friends explore trending anime, build watchlists, and host synchronized watch parties with chat and dual-stream support.



## Live Demo https://the-last-episode.onrender.com/

## Features
- 🔎 **Discover & search** anime titles with rich details.
- 📚 **Personal library & watchlist** management.
- 🎥 **Watch parties** with synchronized playback controls and host handoff.
- 💬 **Real-time chat** inside rooms.
- 🔔 **Notifications** and user-specific rooms.
- 🌓 **Theming & smooth scrolling** for a polished UX.

## Tech Stack
**Frontend**
- React 19, Vite, React Router v7
- Tailwind CSS 4, Framer Motion, GSAP, Lenis, Lucide
- Socket.io Client, React Player

**Backend**
- Node.js, Express 5, MongoDB (Mongoose)
- Socket.io server for real-time rooms
- JWT auth, bcrypt, CORS, dotenv
- node-cron for scheduled jobs
- Logging with morgan

## Project Structure
- `frontend/` — React/Vite SPA (routing, theming, watch party UI)
- `backend/` — Express API, Socket.io server, cron jobs, MongoDB models

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### 1) Backend setup
```bash
cd backend
npm install
cp .env.example .env   # create your env file (see variables below)
npm run dev             # or: npm start
```

### 2) Frontend setup
```bash
cd frontend
npm install
npm run dev             # Vite dev server (defaults to http://localhost:5173)
```

Run backend and frontend in separate terminals.

## Environment Variables (backend)
Create `backend/.env` with at least:
- `PORT=5000` (optional)
- `MONGODB_URI=<your-mongodb-connection-string>`
- `FRONTEND_URL=http://localhost:5173` (add your deployed URL to allow CORS)
- `JWT_SECRET=<your-secret>` (if JWT is used elsewhere in the codebase)

## Scripts
- Backend: `npm run dev` / `npm start`
- Frontend: `npm run dev` / `npm run build` / `npm run preview`

## Credits
Built by **Abhishek Verma**. Contributions are welcome—open an issue or PR!
