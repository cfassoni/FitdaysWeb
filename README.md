# FitdaysWeb

A modern, full-stack application designed to import, parse, store, and visualize body composition measurements exported from the **Fitdays** smart scale app.

---

## 🚀 Features

- **User Authentication**: Secure user registration and login powered by FastAPI, JWT tokens, and password hashing (`bcrypt`).
- **Interactive Dashboard**:
  - High-level metric summary cards (Total logs, Weight, Body Fat %, Muscle Mass) with delta badges (weight loss / muscle gain highlights).
  - A responsive **Recharts** line chart showcasing weight history trends, allowing users to interactively toggle metrics on/off.
  - Smart empty-state welcoming users to upload data on first visit.
- **Detailed History logs**:
  - A searchable and sortable historical data table showing scan dates and core metrics.
  - A comprehensive side-drawer view detailing **all 50+ body composition fields** including:
    - Core indicators (BMI, BMR, Obesity Score, Metabolic Age, Fat-Free Mass).
    - Hydration & fat breakdown (Subcutaneous Fat %, Visceral Fat level, Moisture Mass, Body Water %, Protein %).
    - Cardiovascular & Skeletal metrics (Heart Rate, Skeletal Muscle %, Bone Mass).
    - **Segmental Analysis**: High-fidelity right/left arm, trunk, and right/left leg fat and muscle mass/percentage breakdown.
- **CSV Data Import**:
  - Interactive drag-and-drop file dropzone.
  - Success summary detailing new records inserted versus overlapping logs updated.
- **Dockerized Setup**: Seamless full-stack orchestration using Docker Compose with data persistence for SQLite.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT tokens (PyJWT) and password hashing (Passlib + bcrypt)
- **Parsing**: Pandas & xlrd (for parsing Fitdays export sheets)

### Frontend
- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite` compiler)
- **Iconography**: Lucide React
- **Visualization**: Recharts (responsive SVG charting library)

### Orchestration & Routing
- **Containerization**: Docker & Docker Compose
- **Web Server & Reverse Proxy**: Nginx (serving frontend assets and proxying `/api/*` requests to prevent CORS issues)

---

## 📁 Project Structure

```text
FitdaysWeb/
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── routers/          # Users and records API endpoints
│   │   ├── auth.py           # JWT generation and security utilities
│   │   ├── database.py       # SQLAlchemy engine & session setup
│   │   ├── models.py         # SQLAlchemy tables (User, FitdaysRecord)
│   │   ├── parser.py         # Fitdays CSV parser logic
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   └── main.py           # FastAPI entrypoint and CORS setup
│   ├── tests/                # Pytest suite
│   ├── Dockerfile            # Python-slim Docker instructions
│   └── pyproject.toml        # Backend dependencies definition
│
├── frontend/                 # Vite + React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components (Sidebar, ThemeToggle)
│   │   ├── lib/              # API Client helper (api.ts)
│   │   ├── views/            # Screen views (Dashboard, History, Import, Auth)
│   │   ├── App.tsx           # Router and auth orchestrator
│   │   ├── index.css         # Tailwind v4 directives & light/dark mode variables
│   │   └── main.tsx          # React render entrypoint
│   ├── nginx.conf            # Nginx reverse proxy configuration
│   ├── Dockerfile            # Multi-stage Node builder + Nginx image instructions
│   └── package.json          # Node dependencies definition
│
├── test-data/                # Ignored folder housing sample Fitdays exports
├── docker-compose.yml        # Multi-container coordinator
└── README.md                 # Project documentation
```

---

## ⚙️ Getting Started

### Option A: Running with Docker Desktop (Recommended)

1. Launch **Docker Desktop**.
2. Open a terminal in the root directory of the project and run:
   ```bash
   docker compose up --build
   ```
3. Once running, open your browser and navigate to:
   - **Frontend**: [http://localhost](http://localhost) (runs on standard HTTP port 80)
   - **Swagger API Documentation**: [http://localhost/docs](http://localhost/docs)

---

### Option B: Production Deployment (Portainer.io)

For deploying this application in a production environment via Portainer.io stacks, check out the step-by-step **[Portainer.io Production Deployment Guide](DEPLOYMENT.md)**.

---

### Option C: Running Locally (Development Mode)

If you prefer to run the components separately without Docker:

#### 1. Setup Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r pyproject.toml # or use `uv pip sync` / `pip install .`
   ```
4. Launch the dev server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will run on `http://localhost:8000`.*

#### 2. Setup Frontend
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`. Vite is pre-configured to proxy `/api` requests to the local FastAPI backend automatically.*
