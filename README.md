# Remix Coding Partner 🚀

An ultra-premium social networking and real-time collaboration platform for developers, built with React 19, TypeScript, Tailwind CSS, Express, and WebSockets.

---

## 📋 Features

- **Real-Time Collaboration & Chat**: Instant direct and team project messaging powered by WebSockets.
- **Developer Matchmaking & Discovery**: Explore developer profiles, filter by skills and availability, and connect with teammates.
- **Projects & Workspaces**: Create, manage, and track team progress, milestones, and task boards.
- **Code Viewer & Snippets**: Share, inspect, and discuss code snippets across languages.
- **Interactive Team Progress**: Visual graphs and milestone status cards for collaborative projects.
- **Rich Media & Avatars**: Upload and customize developer profiles and project assets.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Motion (Framer Motion), Lucide Icons, Tailwind CSS v4
- **Backend**: Node.js, Express, WebSocket (`ws`)
- **Containerization**: Docker, Docker Compose
- **Build System**: Vite (client SPA) + esbuild (server CJS bundle)

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **npm**: v10+ (or yarn / pnpm)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bhavana-cp1.git
   cd Bhavana-cp1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

---

## 📦 Production Build & Run

1. **Build the client and bundle the server**:
   ```bash
   npm run build
   ```
   This generates:
   - `dist/`: Optimized static frontend assets built via Vite
   - `dist/server.cjs`: Standalone Node.js server bundle via esbuild

2. **Start the production server**:
   ```bash
   npm start
   ```
   The production server will listen on port `3000` (or the port specified by the `PORT` environment variable).

---

## 🐳 Docker Deployment

A production-ready multi-stage `Dockerfile` and `docker-compose.yml` are included.

### Using Docker

1. **Build the image**:
   ```bash
   docker build -t remix-coding-partner .
   ```

2. **Run the container**:
   ```bash
   docker run -d -p 3000:3000 --name coding-partner remix-coding-partner
   ```

### Using Docker Compose

```bash
docker compose up -d --build
```
This automatically mounts persistent volumes for application data (`/app/data`) and file uploads (`/app/public/uploads`).

---

## ☁️ Live Cloud Deployment Guides

### 1. Render (Recommended)

1. Fork or push this repository to your GitHub account.
2. Sign in to [Render](https://render.com/).
3. Click **New +** → **Blueprint** (or **Web Service**).
4. Connect your GitHub repository.
5. If using **Blueprint**, Render will automatically detect the included `render.yaml`.
6. If creating manually as a **Web Service**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `3000`
7. Click **Deploy**.

### 2. Railway

1. Sign in to [Railway](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically detect the Dockerfile or Node.js settings.
5. In the service settings, ensure `PORT` is set to `3000`.
6. Click **Deploy**.

### 3. Google Cloud Run

1. Make sure you have the [Google Cloud SDK](https://cloud.google.com/sdk) installed.
2. Build and deploy directly using Cloud Build and Cloud Run:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/remix-coding-partner
   gcloud run deploy remix-coding-partner \
     --image gcr.io/YOUR_PROJECT_ID/remix-coding-partner \
     --platform managed \
     --port 3000 \
     --allow-unauthenticated
   ```

### 4. Fly.io

1. Install the `flyctl` CLI.
2. Run `fly launch` in the repository root.
3. Set the internal port to `3000`.
4. Run `fly deploy`.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for the HTTP and WebSocket server |
| `NODE_ENV` | `development` | Set to `production` in live environments |
| `GEMINI_API_KEY` | *(optional)* | Google Gemini API key if AI assistance features are enabled |

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI test and build workflow
├── data/
│   └── .gitkeep                 # Persistent JSON database directory
├── public/
│   ├── uploads/                 # User uploaded images & avatars
│   └── ...                      # Static images and icons
├── server/
│   └── store.ts                 # Backend data store, memory & persistence logic
├── src/
│   ├── assets/                  # App image assets
│   ├── components/              # React screens, modals, and navigation
│   ├── data/                    # Seed developer profiles and projects
│   ├── services/                # Real-time WebSocket and HTTP client API
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils/                   # Avatar storage and upload helpers
│   ├── App.tsx                  # Root application router and state
│   ├── index.css                # Tailwind CSS v4 styling & liquid-glass theme
│   └── main.tsx                 # React DOM mount point
├── Dockerfile                   # Multi-stage optimized production Dockerfile
├── docker-compose.yml           # Docker Compose configuration with persistent volumes
├── package.json                 # Project dependencies and lifecycle scripts
├── package-lock.json            # Deterministic dependency lockfile
├── render.yaml                  # One-click Render cloud blueprint
├── server.ts                    # Express + WebSocket + Vite middleware server
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite bundler configuration
```

---

## 📄 License

MIT License. Feel free to use and customize for your own projects!
