# 📚 EduLib — Smart Age-Matched Digital Library

A production-ready school e-library platform. Learners register with their
date of birth and are automatically routed to the correct category on every login.
Admins upload books and monitor all activity.

---

## Age → Category Routing

| Age | Category  | Emoji |
|-----|-----------|-------|
| 5–11  | Primary   | 🌱 |
| 12–16 | Secondary | 🚀 |
| 17+   | Tertiary  | 🎓 |

Category re-calculates on **every login** — learners advance automatically
on their birthday without any manual intervention.

---

## Project Structure

```
edulib/
├── backend/                   Node.js + Express API
│   ├── src/
│   │   ├── index.js           Server entry + security middleware
│   │   ├── seed.js            Populate 15 sample books (run once)
│   │   ├── lib/supabase.js    Supabase client
│   │   ├── middleware/
│   │   │   ├── auth.js        JWT verification + admin guard
│   │   │   ├── logger.js      Colour-coded request logger
│   │   │   └── validate.js    express-validator rule sets
│   │   └── routes/
│   │       ├── auth.js        Register, login, /me
│   │       ├── books.js       List (paginated+search), signed URL
│   │       ├── admin.js       Stats, CRUD books, users, CSV export
│   │       ├── adminAuth.js   Admin password change
│   │       ├── activity.js    Per-learner reading history
│   │       └── users.js       Learner profile + password change
│   └── src/__tests__/
│       └── api.test.js        19 integration tests (all passing)
│
├── frontend/                  React app
│   ├── src/
│   │   ├── lib/api.js         Axios client, auto JWT, all endpoints
│   │   ├── hooks/
│   │   │   ├── useAuth.js     Global auth context (JWT + localStorage)
│   │   │   └── useBooks.js    Debounced search, pagination, subjects
│   │   ├── components/
│   │   │   ├── BookCard.js    Grid card with hover animation
│   │   │   ├── BookModal.js   Detail modal → launches PDF viewer
│   │   │   ├── PDFViewer.js   Full-screen in-browser PDF reader
│   │   │   ├── ProfileModal.js  Update school/class + change password
│   │   │   ├── ErrorBoundary.js  Catches unhandled React errors
│   │   │   └── LoadingScreen.js
│   │   └── pages/
│   │       ├── LandingPage.js
│   │       ├── LoginPage.js
│   │       ├── SignupPage.js  Live category preview as DOB is entered
│   │       ├── LibraryPage.js  Search, filter, paginate, read history
│   │       ├── AdminPage.js   Full dashboard: overview, books (edit),
│   │       │                  upload, users, activity log, settings
│   │       └── NotFoundPage.js
│   └── Dockerfile             Production nginx build
│
├── supabase/
│   ├── schema.sql             Full DB schema + RLS policies + indexes
│   └── storage-policies.sql   Ebooks bucket access policies
│
├── docker-compose.yml         Local dev (backend + frontend)
├── render.yaml                One-click Render backend deploy
├── setup.sh                   Local setup script
└── README.md                  This file
```

---

## ⚡ Deploy in 4 Steps

### Step 1 — Supabase (~15 min)

1. Create a free project at **https://supabase.com**
2. **SQL Editor → New Query** → paste `supabase/schema.sql` → **Run**
3. **SQL Editor → New Query** → paste `supabase/storage-policies.sql` → **Run**
4. **Storage → New Bucket**
   - Name: `ebooks` | Public: **OFF** | File size limit: `52428800` (50 MB)
   - Allowed MIME types: `application/pdf, application/epub+zip`
5. **Project Settings → API** → copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 2 — Backend on Render (~10 min)

1. Push this repo to GitHub
2. **https://render.com → New Web Service → Connect repo**
3. Settings:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
4. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `JWT_SECRET` | 64+ char random string (see tip below) |
| `ADMIN_USERNAME` | Your chosen admin username |
| `ADMIN_PASSWORD` | A strong admin password |
| `FRONTEND_URL` | Your Vercel URL (add after Step 3) |
| `NODE_ENV` | `production` |

> **Generate JWT_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

5. Deploy → note your URL e.g. `https://edulib-api.onrender.com`

---

### Step 3 — Frontend on Vercel (~5 min)

1. **https://vercel.com → New Project → Import repo**
2. Root directory: `frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` = your Render URL (e.g. `https://edulib-api.onrender.com`)
4. Deploy → note your URL e.g. `https://edulib.vercel.app`
5. Go back to **Render → Environment** and set `FRONTEND_URL` = your Vercel URL
6. Trigger a Render redeploy so CORS updates

---

### Step 4 — First Login & Seed (~2 min)

1. Open your Vercel URL
2. Log in with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`
3. (Optional) Seed 15 sample books:
   ```bash
   cd backend
   cp .env.example .env   # fill in your Supabase keys
   npm install
   npm run seed
   ```

---

## 🖥️ Local Development

**Option A — Simple (two terminals):**
```bash
bash setup.sh          # installs deps + creates .env files

# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

**Option B — Docker:**
```bash
cp backend/.env.example backend/.env   # fill in Supabase keys
docker compose up --build
```

App runs at http://localhost:3000 | API at http://localhost:4000

---

## 🧪 Tests

```bash
cd backend
npm test               # run 19 integration tests
npm test -- --coverage # with coverage report
```

All 19 tests pass. Coverage includes: auth (register/login/me),
book fetching, category enforcement (403 on wrong-category access),
admin route protection (401/403), and input validation edge cases.

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt, cost factor 12 |
| Auth tokens | JWT, 7-day expiry |
| Input validation | express-validator on all write endpoints |
| Rate limiting | 200 req/15min global; 20 req/15min on auth |
| HTTP security headers | Helmet.js |
| CORS | Restricted to `FRONTEND_URL` only |
| File access | Private Supabase Storage + 1-hour signed URLs |
| DB access control | Supabase Row Level Security on all tables |
| Category enforcement | Server-side check on every book open |

---

## 👨‍💼 Admin Features

- **Overview** — live stats: total books, users, per-category counts, activity count
- **Manage Books** — search, inline edit (title/author/subject/category/emoji), delete
- **Upload Book** — drag-and-drop PDF/EPUB → stored in Supabase Storage
- **Users** — search, view all registrations, remove accounts, **⬇️ Export CSV**
- **Activity Log** — full log of all logins, signups, book opens, **⬇️ Export CSV**
- **Settings** — admin password change

---

## 🎓 Learner Features

- Register with name, DOB, class, school, username, password
- Auto-routed to correct library category on login
- **Live category preview** on signup form as DOB is typed
- Search books by title, author, or subject (server-side, debounced)
- Filter by subject
- Paginated results (24 per page)
- **In-browser PDF reader** — PDF.js, zoom 60–300%, keyboard navigation
- Reading history tab
- Profile modal — update school/class, change password

---

## 🚀 Future Enhancements

- Reading progress tracker (% of book completed)
- Bookmarks and notes per learner
- Post-reading quiz/assessment
- Teacher accounts (between learner and admin)
- School-level sub-libraries (multi-tenancy)
- PWA / offline reading support
- Push notifications for new books
- Parent monitoring portal
- Completion certificates
