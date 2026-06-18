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

1. Log in to your **Portainer** dashboard.
2. Select the **Environment** where you want to deploy (e.g., `local`).
3. Click on **Stacks** in the left sidebar, then click **Add stack** in the top right.
4. Name your stack: `fitdays-web`.
5. Under **Build method**, select **Web editor**.
6. Paste the following production-ready Compose definition:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fitdays-backend
    environment:
      - DATABASE_URL=sqlite:////app/data/fitdays.db
      - SECRET_KEY=${SECRET_KEY}
      - ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-1440}
    volumes:
      - fitdays-db-data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
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
   - **Compose path**: `docker-compose.yml`
5. Enable **Authentication** if your repository is private, and input your credentials / Personal Access Token (PAT).
6. Enable **Automatic updates** (Webhook or Polling) if you want Portainer to redeploy the stack whenever new code is pushed to your git branch.

---

## 🔒 Environment Variables Configuration

Regardless of the method chosen, you must configure the environment variables under the **Environment variables** section at the bottom of the Portainer stack creation page:

| Variable Name | Default Value | Description |
|---|---|---|
| `SECRET_KEY` | *(None)* | **[CRITICAL]** A strong, unique secret key used to sign JWT session tokens. Change this to a secure random string (e.g. `openssl rand -hex 32`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | The duration (in minutes) for which user sessions remain valid (default: 24 hours). |
| `DATABASE_URL` | `sqlite:////app/data/fitdays.db` | The connection string. By default, it points to the SQLite database file inside the persistent volume. |

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
