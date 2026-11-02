# WeGrow Client Portal 🌟

A complete, enterprise-grade Client Portal & Business Transformation platform for **WeGrow B School**, featuring real-time attendance check-in, WhatsApp feedback dispatch, action plans, performance analytics, and session dossiers.

---

## 🏛️ Project Architecture

```
wegrow-clientportal/
├── wegrow-clientportal-frontend/   # React 18 + Vite + TypeScript (Deploy to Vercel)
│   ├── src/
│   │   ├── components/            # Modals, Pages, Charts, Common widgets
│   │   ├── context/               # PortalContext & state management
│   │   ├── services/              # API client layer (REST endpoints)
│   │   └── types/                 # TypeScript interfaces
│   └── vercel.json                # Single Page Application rewrite rules
│
├── wegrowclientportal/             # NestJS + MongoDB Atlas Backend (Deploy to Render)
│   ├── src/
│   │   ├── attendance/            # QR attendance & feedback submission
│   │   ├── clients/               # Client dossier & profile management
│   │   ├── auth/                  # JWT authentication & guards
│   │   └── schemas/               # Mongoose schemas (MongoDB)
│   └── package.json
│
├── render.yaml                     # Render Cloud Blueprint
├── .env.example                    # Environment variables template
└── README.md
```

---

## 🚀 1. Deploying the Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect:
   `https://github.com/deepakkumars170404-pixel/wegrow-clientportal`
4. Configure the service settings:
   - **Name**: `wegrow-clientportal-backend`
   - **Region**: Choose closest to your users (e.g. `Singapore` or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: `wegrowclientportal`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.86ttxfk.mongodb.net/wegrow_portal?appName=Cluster0`
   - `JWT_SECRET`: `wegrow_transformation_portal_super_secret_jwt_key_2026`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://wegrow-clientportal-backend.onrender.com`).

---

## ⚡ 2. Deploying the Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New…** → **Project**.
3. Import the repository: `deepakkumars170404-pixel/wegrow-clientportal`.
4. In the configuration screen:
   - **Project Name**: `wegrow-clientportal`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `wegrow-clientportal-frontend`.
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<your-render-backend-name>.onrender.com/api`
     *(Replace with your actual Render backend URL from Step 1, with `/api` at the end)*
6. Click **Deploy**.
7. Your WeGrow Client Portal is live with continuous deployment!

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)

### Setup & Run
```bash
# 1. Install dependencies
cd wegrowclientportal && npm install
cd ../wegrow-clientportal-frontend && npm install

# 2. Run Backend
cd wegrowclientportal
npm run dev

# 3. Run Frontend
cd ../wegrow-clientportal-frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:3000/api`.
