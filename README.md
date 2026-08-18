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

### 📧 Email Verification & Mailgun Testing

FitdaysWeb includes email-based account activation and profile verification.

#### Development / Testing Fallback (No Setup Required)
If no Mailgun credentials are provided, FitdaysWeb automatically logs the **6-digit verification code** and **1-click direct link** to the backend console logs. You can view them with:
```bash
docker compose logs -f backend
```

#### Sending Live Emails via Mailgun
To send real emails to your inbox during local testing:
1. Create a `.env` file in the project root:
   ```env
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org  # or your custom domain
   MAILGUN_API_BASE_URL=https://api.mailgun.net/v3
   MAIL_FROM_ADDRESS=FitdaysWeb <noreply@yourdomain.com>
   FRONTEND_URL=http://localhost
   ```
   *(Note: If using a Mailgun Sandbox domain, remember to add your personal email to **Authorized Recipients** in the Mailgun Dashboard).*
2. Restart the containers:
   ```bash
   docker compose up -d --build
   ```
3. Test delivery directly via CLI:
   ```bash
   docker compose exec backend python -c "
   from app.email import send_verification_email
   send_verification_email('your-email@example.com', '123456', language='en')
   "
   ```

---

### Option B: Production Deployment (Portainer.io)

For deploying this application in a production environment via Portainer.io stacks, check out the step-by-step **[Portainer.io Production Deployment Guide](DEPLOYMENT.md)**.

---

### Option C: Running Locally (Development Mode)

If you prefer to run the components separately without Docker:

#### 1. Setup Backend

This project uses `uv` for Python environment and dependency management.

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Sync the dependencies and initialize the virtual environment:
   ```bash
   uv sync
   ```
3. Launch the dev server:
   ```bash
   uv run uvicorn app.main:app --reload
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
