# java_with_shiva

A notes/PDF sharing platform:
- Admin uploads notes/PDFs (Java, DSA, Interview Questions, etc.)
- Any logged-in user can search and download **free** notes directly
- **Paid** notes are pay-per-item via **Razorpay** — a user unlocks download only for the item they bought

Project structure:
```
java_with_shiva/
├── backend/     # Node.js + Express + MongoDB + Razorpay API
└── frontend/    # React + Vite website
```

---

## 1. Prerequisites

Install these on your computer first:
- **Node.js** (v18 or newer) — https://nodejs.org
- **MongoDB** — either:
  - A free cloud database at https://www.mongodb.com/cloud/atlas (recommended, easiest), or
  - MongoDB installed locally
- A **Razorpay account** — https://dashboard.razorpay.com/signup (free to create; use **Test Mode** while developing)

---

## 2. Backend Setup (do this first)

```bash
cd backend
npm install
```

Create your real `.env` file from the example:
```bash
cp .env.example .env
```

Open `.env` and fill in the real values:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Database → Connect → "Connect your application" → copy the connection string, replace `<username>`/`<password>` |
| `JWT_SECRET` | Any long random string you make up (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys → Generate Test Key |
| `PORT` | Leave as `5000` unless it conflicts with something |
| `CLIENT_URL` | Leave as `http://localhost:5173` for local dev |

Start the backend:
```bash
npm run dev
```
You should see:
```
MongoDB connected successfully
Server running on port 5000
```

Visit `http://localhost:5000` in your browser — you should see "java_with_shiva backend is running". That confirms the backend is alive.

### Make yourself an admin
By default every new signup is a normal user. To make your own account an admin (so you can upload notes):
1. Sign up normally through the website first (see frontend steps below).
2. Open your MongoDB database (Atlas → Browse Collections, or Compass) → `users` collection.
3. Find your user document and change `isAdmin` from `false` to `true`.
4. Log out and log back in on the site so your session picks up the new admin status.

---

## 3. Frontend Setup — How It Connects to the Backend

```bash
cd frontend
npm install
cp .env.example .env
```

Open `frontend/.env` — by default:
```
VITE_API_URL=http://localhost:5000/api
```
This tells the React app where your backend lives. **This is the actual "connection"** — every page in the frontend calls this URL (via `src/api/axios.js`) to log in, fetch notes, upload files, and process payments. As long as your backend is running on that address, the frontend is connected.

During local development, `vite.config.js` also proxies `/api` and `/uploads` requests to `http://localhost:5000`, so things work smoothly even without CORS issues.

Start the frontend:
```bash
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`).

**Important: run backend and frontend at the same time**, in two separate terminals — the frontend has no data of its own, it only talks to the backend.

---

## 4. Adding Your Logo

Replace the placeholder file:
```
frontend/public/logo.png
```
with your actual logo (keep the filename `logo.png`, or update the path in `frontend/src/components/Navbar.jsx` and `frontend/index.html` if you use a different name/format).

---

## 5. How Razorpay Payment Works Here

1. User clicks **Buy** on a paid note → frontend calls `POST /api/payment/create-order`.
2. Backend creates a Razorpay order and returns the order ID + your public key.
3. Razorpay's checkout popup opens in the browser (script already included in `index.html`) and the user pays with card/UPI/etc.
4. On success, frontend sends the payment details to `POST /api/payment/verify`.
5. Backend re-verifies the payment signature using your **secret key** (never exposed to the frontend) and marks that note as purchased for that user.
6. The note's Download button unlocks immediately.

**Going live:** once you're ready to accept real payments, switch your Razorpay dashboard from Test Mode to Live Mode, generate **Live API Keys**, and update `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in the backend `.env`. Also complete Razorpay's KYC/business verification — they require this before enabling live payments.

---

## 6. Deployment (when you're ready to put this online)

- **Backend**: deploy to a Node host like Render, Railway, or a VPS. Set the same environment variables there.
- **Frontend**: deploy to Vercel or Netlify (`npm run build` produces a `dist/` folder). Set `VITE_API_URL` to your live backend URL.
- **Database**: MongoDB Atlas already works from anywhere, no change needed.
- **File storage**: for production, consider moving uploaded PDFs from local `backend/uploads/` to a cloud storage bucket (e.g. AWS S3 or Cloudinary) since most hosts don't keep local files permanently — I can help wire that up when you get to this step.

---

## 7. Quick Command Reference

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.
