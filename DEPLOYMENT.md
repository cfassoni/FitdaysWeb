# 🚢 Portainer.io Production Deployment Guide

This document describes how to deploy and configure the **FitdaysWeb** application on an internal Docker server using **Portainer.io**.

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. A running **Portainer.io** instance (Community or Business Edition).
2. Docker and Docker Compose installed on the host machine.
3. Network access to download base images (`python:3.11-slim`, `node:20-alpine`, `nginx:stable-alpine`).

---

## 🛠️ Deployment Steps

Portainer organizes multi-container applications using **Stacks** (which use Docker Compose files). You can deploy FitdaysWeb either by **pasting the Compose file** or **connecting directly to your Git repository**.

### Method A: Web Editor (Pasting Compose File) - Recommended for quick setups

> [!NOTE]
> Since this method uses pre-built images from the GitHub Container Registry, you do not need to download or clone the source repository on the host server; only the Docker Compose definition is required.

1. Log in to your **Portainer** dashboard.
2. Select the **Environment** where you want to deploy (e.g., `local`).
3. Click on **Stacks** in the left sidebar, then click **Add stack** in the top right.
4. Name your stack: `fitdays-web`.
5. Under **Build method**, select **Web editor**.
6. Paste the following production-ready Compose definition:

```yaml
services:
  backend:
    image: ghcr.io/cfassoni/fitdaysweb/backend:latest
    container_name: fitdays-backend
    environment:
      - DATABASE_URL=sqlite:////app/data/fitdays.db
      - UPLOAD_DIR=/app/data/uploads/profile_pics
      - REPORTS_DIR=/app/data/uploads/reports
      - SECRET_KEY=${SECRET_KEY}
      - ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-1440}
      - MAILGUN_API_KEY=${MAILGUN_API_KEY:-}
      - MAILGUN_DOMAIN=${MAILGUN_DOMAIN:-}
      - MAILGUN_API_BASE_URL=${MAILGUN_API_BASE_URL:-https://api.mailgun.net/v3}
      - MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-FitdaysWeb <noreply@fitdays.local>}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost}
    volumes:
      - fitdays-db-data:/app/data
    restart: unless-stopped

  frontend:
    image: ghcr.io/cfassoni/fitdaysweb/frontend:latest
    container_name: fitdays-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  fitdays-db-data:
    driver: local
```

---

### Method B: Repository (Direct Git Integration) - Recommended for CI/CD

If your code is hosted on an internal Git server (e.g., GitLab, Gitea, GitHub Enterprise) or GitHub:

1. Click on **Stacks** -> **Add stack**.
2. Name your stack: `fitdays-web`.
3. Under **Build method**, select **Repository**.
4. Fill in your Git repository details:
   - **Repository URL**: `https://github.com/YOUR_USERNAME/FitdaysWeb.git` (or your internal URL)
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.prod.yml` *(Note: We use `docker-compose.prod.yml` here as it points to the pre-built GHCR images, avoiding compilation/build overhead on the host server)*
5. Enable **Authentication** if your repository is private, and input your credentials / Personal Access Token (PAT).
6. Enable **Automatic updates** (Webhook or Polling) if you want Portainer to redeploy the stack whenever new code is pushed to your git branch.

---

## 📌 Pinning Image Versions

By default, the production Compose configurations pull the `latest` image tags:
- `ghcr.io/cfassoni/fitdaysweb/backend:latest`
- `ghcr.io/cfassoni/fitdaysweb/frontend:latest`

While `latest` is useful for automatic updates, it is highly recommended to pin your deployment to specific tagged releases in production (e.g., `v0.1.0`) to avoid unexpected changes.

To pin a specific version:
1. Identify the version tag you want to deploy from the repository's releases or GitHub Packages page.
2. Edit your Compose configuration (either in the Portainer Web Editor for Method A, or by committing changes to your repository if using Method B).
3. Replace `:latest` with your specific version tag:
   ```yaml
   services:
     backend:
       image: ghcr.io/cfassoni/fitdaysweb/backend:v0.1.0
       # ...
     frontend:
       image: ghcr.io/cfassoni/fitdaysweb/frontend:v0.1.0
       # ...
   ```
4. Redeploy or update the stack in Portainer.

---

## 🔒 Environment Variables Configuration

Regardless of the method chosen, you must configure the environment variables under the **Environment variables** section at the bottom of the Portainer stack creation page:

| Variable Name | Default Value | Description |
|---|---|---|
| `SECRET_KEY` | *(None)* | **[CRITICAL]** A strong, unique secret key used to sign JWT session tokens. Change this to a secure random string (e.g. `openssl rand -hex 32`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | The duration (in minutes) for which user sessions remain valid (default: 24 hours). |
| `DATABASE_URL` | `sqlite:////app/data/fitdays.db` | The connection string. By default, it points to the SQLite database file inside the persistent volume. |
| `UPLOAD_DIR` | `/app/data/uploads/profile_pics` | The directory where uploaded profile pictures are stored. Point this inside the persistent volume. |
| `REPORTS_DIR` | `/app/data/uploads/reports` | The directory where uploaded mobile app reports are stored. Point this inside the persistent volume to prevent data loss on reload. |
| `MAILGUN_API_KEY` | *(None)* | **[OPTIONAL]** Mailgun API key (e.g. `key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` or `api:key-...`). If omitted, emails are logged to the container console in development mode. |
| `MAILGUN_DOMAIN` | *(None)* | **[OPTIONAL]** Mailgun sending domain (e.g. `mg.yourdomain.com` or `sandboxXXXXXXXX.mailgun.org`). |
| `MAILGUN_API_BASE_URL` | `https://api.mailgun.net/v3` | Mailgun API base URL. Use `https://api.mailgun.net/v3` for US region or `https://api.eu.mailgun.net/v3` for EU region. |
| `MAIL_FROM_ADDRESS` | `FitdaysWeb <noreply@fitdays.app>` | The `From` header address for outgoing verification emails. |
| `ENVIRONMENT` | `production` | Application runtime environment (`development` or `production`). Setting to `production` disables Swagger/OpenAPI interactive documentation endpoints (`/docs`, `/redoc`, `/openapi.json`) for enhanced security. |
| `FRONTEND_URL` | `http://localhost` | **[CRITICAL IN PRODUCTION]** The public URL of the frontend (e.g. `https://fitdays.yourdomain.com`). Used to construct 1-click email confirmation links. |

---

## 📧 Email Service (Mailgun) Production Configuration

FitdaysWeb sends account activation emails and profile email change confirmations using **Mailgun**.

### Production Setup Steps

1. **Add & Verify Domain in Mailgun**:
   - In your [Mailgun Dashboard](https://app.mailgun.com/), navigate to **Sending > Domains > Add New Domain**.
   - Use a dedicated subdomain (e.g., `mg.yourdomain.com` or `mail.yourdomain.com`).
   - Configure the required DNS records (TXT for SPF and DKIM, CNAME for tracking, MX if receiving bounces) with your DNS registrar.
2. **Obtain API Key**:
   - Navigate to **Settings > API Keys** (or **Domain Settings > Sending API keys**) and copy your sending API key.
3. **Configure Stack Environment Variables**:
   In your Portainer stack or `.env` file, set:
   ```env
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_API_BASE_URL=https://api.mailgun.net/v3
   MAIL_FROM_ADDRESS=FitdaysWeb <noreply@yourdomain.com>
   FRONTEND_URL=https://fitdays.yourdomain.com
   ```
4. **Test Delivery**:
   Trigger a test email directly from inside the backend container:
   ```bash
   docker exec -it fitdays-backend python -c "
   from app.email import send_verification_email
   success = send_verification_email('your-email@yourdomain.com', '123456', language='en')
   print('Delivered!' if success else 'Delivery failed')
   "
   ```

---

## 💾 Data Persistence & Backups

The SQLite database file `fitdays.db` is stored inside the named Docker volume `fitdays-db-data`. 

### Locating the Volume on the Host
On your Docker host machine, Docker stores named volumes under:
```bash
/var/lib/docker/volumes/fitdays-web_fitdays-db-data/_data/fitdays.db
```
*(Note: The stack name is prefixed to the volume name, e.g., `fitdays-web_fitdays-db-data`)*.

### Backup Strategy
To back up your user accounts and measurement data, schedule a cron job on the Docker host to copy the SQLite file safely:
```bash
# Example backup command
sqlite3 /var/lib/docker/volumes/fitdays-web_fitdays-db-data/_data/fitdays.db ".backup '/backups/fitdays_$(date +%F).db'"
```

---

## 🚀 Migrating to PostgreSQL/MySQL (Optional)

If your internal production environment scales and requires a robust relational database rather than SQLite:

1. Deploy a PostgreSQL container in Portainer (either in the same stack or as a standalone service).
2. Change the `DATABASE_URL` environment variable in the `fitdays-web` stack:
   ```env
   DATABASE_URL=postgresql://db_user:db_password@postgres-service:5432/fitdays_db
   ```
3. Restart the backend service. SQLAlchemy will automatically connect to PostgreSQL and initialize all database tables.

