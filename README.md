# ManageEstate

A MERN stack Society Maintenance Tracker — residents get full transparency into where every rupee of their maintenance fee goes. Admins upload monthly breakdowns, residents explore charts, and an AI assistant answers expense questions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Backend | Node.js + Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| AI | Google Gemini API |

---

## Local Setup

### 1. Prerequisites

- **Node.js** v18 or later — https://nodejs.org
- **MongoDB Atlas** account (free tier works) — https://cloud.mongodb.com
- **Google Gemini API key** — https://aistudio.google.com/app/apikey

### 2. Extract & enter the folder

```bash
cd manageestate
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=any_long_random_string_64_chars_or_more
GEMIN_API_KEY=your_google_gemini_api_key
PORT=5000
API_PORT=8000
```

> **MONGODB_URI** — from MongoDB Atlas → Connect → Drivers → copy the connection string.
>
> **JWT_SECRET** — generate a secure one by running:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 5. Start the backend

Open a terminal and run:

```bash
npm run dev
```

Backend API runs at **http://localhost:8000**

### 6. Start the frontend

Open a **second terminal** and run:

```bash
npm run client
```

Frontend runs at **http://localhost:5000** — open this in your browser.

---

## Project Structure

```
manageestate/
├── client/
│   ├── index.html
│   └── src/
│       ├── pages/          # Landing, Auth, Dashboard, etc.
│       ├── components/     # BrandLogo, Icon, Navbar, ...
│       ├── utils/          # api.js (Axios helpers)
│       ├── context/        # Auth context / state
│       └── index.css       # All styles
├── server/
│   ├── server.js           # Express entry point
│   ├── controllers/        # Route handlers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── middleware/         # Auth middleware
│   └── utils/              # Helpers
├── attached_assets/        # Images used by the UI
├── vite.config.js
├── package.json
├── .env.example            # Copy to .env and fill in your values
└── README.md
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend API (port 8000) |
| `npm run client` | Start Vite dev server (port 5000) |
| `npm run build` | Build frontend for production |

---

## Notes

- Both terminals (backend + frontend) must be running at the same time.
- The Vite dev server proxies `/api/*` to `http://localhost:8000` automatically — no CORS issues in development.
- Images live in `attached_assets/` and are imported via the `@assets` Vite alias defined in `vite.config.js`.
