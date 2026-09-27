# Speakify: Speak. Practice. Improve.

An AI-powered English speaking practice app: read stories aloud and get feedback on
pronunciation, fluency, speed, pauses and reading accuracy.

React + Vite + JavaScript frontend for the existing Express/MongoDB backend (internally still named BoloBuddy;
API routes, collections and localStorage keys are unchanged).

## Brand assets

`src/assets/brand/`: `speakify-logo-light.svg`, `speakify-logo-dark.svg`, `speakify-mark.svg` (icon only),
`speakify-app-icon.svg`; `public/`: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`.
It uses **only** the 11 endpoints that exist in the backend. The backend is not modified.

## 1. Install

```bash
cd bolobuddy-frontend
npm install
```

## 2. Run

Terminal 1, the backend (your existing project):

```bash
cd backend
npm install
node app.js            # or: npx nodemon app.js
# → "Server running on port 3000" and "MongoDB connected successfully"
```

Terminal 2, the frontend:

```bash
cd bolobuddy-frontend
npm run dev
# → open http://localhost:5173
```

## 3. Environment variables

Frontend (optional; these are the defaults). Copy `.env.example` to `.env` if you want to change them:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:3000` | Where the Vite dev proxy forwards `/api/*` |
| `VITE_API_BASE_URL` | `/api` | Base URL axios uses |

Backend (`backend/.env`, required and not included in the zip you shared):

```
MONGO_URI=mongodb://127.0.0.1:27017/bolobuddy
JWT_SECRET=any-long-random-string
```

## 4. How it connects to the backend

```
Browser ──> http://localhost:5173/api/...  (Vite dev server)
                     │  proxy (vite.config.js)
                     ▼
            http://localhost:3000/api/...  (Express backend)
```

* The backend does not enable CORS. The Vite proxy gets around that in development,
  because the browser only talks to port 5173.
* `src/api/axiosClient.js` adds `Authorization: Bearer <token>` to every request.
* When the backend answers **401**, the app clears the session and returns to `/login`.
* The token and user are stored in localStorage under `bolobuddy_token` and `bolobuddy_user`.

> For a production build (`npm run build`) served from another domain, the backend
> would need CORS enabled or a reverse proxy. That's out of scope for now.

## 5. Endpoint usage

| Page | Endpoint(s) |
|---|---|
| Landing | `GET /api/stories?limit=3` |
| Register | `POST /api/auth/register` → then `POST /api/auth/login` (register returns no token) |
| Login | `POST /api/auth/login` |
| Dashboard | `GET /api/progress/dashboard`, `GET /api/progress`, `GET /api/stories?limit=6` |
| Stories | `GET /api/stories?search&difficulty&page&limit=9`, `GET /api/progress` (card badges) |
| Story reader | `GET /api/stories/:id`, `GET /api/progress`, `POST /api/progress`, `PUT /api/progress/:progressId` |
| Reading progress | `GET /api/progress`, `GET /api/stories?limit=1` (library size for the % meter) |
| Story speaking (AI) | `POST /api/ai/analyze-speaking` (`/stories/:id/speak`) |
| AI result | `GET /api/ai/speaking-analyses/:id` (`/results/:id`) |
| Dashboard / Progress / Practice words | `GET /api/progress`, `GET /api/ai/speaking-analyses`, `GET /api/speaking/attempts` |
| Speaking Practice | `GET /api/speaking/status`, `GET /api/speaking/passages/:storyId`, `POST /api/speaking/analyze`, `GET /api/speaking/attempts` |
| Speaking attempt | `GET /api/speaking/attempts/:id` |
| Profile | `GET /api/progress/dashboard` (+ user info from localStorage) |
| Manage stories | `GET /api/stories`, `DELETE /api/stories/:id` |
| Add / Edit story | `POST /api/stories`, `GET /api/stories/:id`, `PUT /api/stories/:id`, `DELETE /api/stories/:id` |

## 6. Things to know about the current backend

* Any logged-in user can add, edit or delete stories (there is no admin role yet).
* One user + one story = one progress record (enforced by the backend and a unique MongoDB index).
  The Progress page also merges any old duplicates, and `npm run fix:progress` in the backend
  removes them from the database.
* There is no "get profile" or "update profile" endpoint, so the Profile page shows the
  user object returned by login.
* Day Streak and Average Score are intentionally not shown; the backend doesn't provide them.

## 7. Folder structure

```
src/
├── api/axiosClient.js          axios instance, token header, 401 handling
├── services/                   one function per backend endpoint
├── context/                    AuthContext (session), ToastContext (notifications)
├── hooks/                      useAuth, useToast, useDebounce, useDocumentTitle
├── utils/                      storage, jwt, errors, difficulty, format, validators
├── components/
│   ├── layout/                 AppLayout, Sidebar, Topbar, PublicNavbar, AuthLayout
│   ├── routing/                ProtectedRoute, GuestRoute, ScrollToTop
│   ├── ui/                     Button, FormField, Badge, Spinner, EmptyState, ErrorState,
│   │                           Modal, Pagination, StatCard, PageHeader, Logo
│   └── stories/                StoryCard, StoryFilters, StoryForm
├── pages/                      Landing, Login, Register, Dashboard, Stories, StoryReader,
│   │                           Progress, Profile, NotFound
│   └── admin/                  AdminStories, StoryEditor
└── styles/                     tokens, base, components, layout, pages
```

## 8. Speaking Practice (`/speaking`)

* The browser records the microphone with the **Web Audio API** and encodes a
  **16 kHz mono WAV** (`src/hooks/useWavRecorder.js`, `src/utils/wavEncoder.js`).
  Nothing is uploaded until the user presses **Analyze**.
* The WAV is sent as `multipart/form-data` to `POST /api/speaking/analyze`.
* The backend transcribes it locally with the open-source **Whisper** model and scores it.
  No paid APIs and no API keys. See `backend/README.md`.
* The microphone needs `http://localhost` or `https://`.
