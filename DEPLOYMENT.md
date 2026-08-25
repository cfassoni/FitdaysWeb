# Deployment Guide

Recomp Pro is optimized for self-hosting via Docker and Portainer.

---

## 1. Fresh Installation (Docker Compose)

1. Ensure you have Docker and Docker Compose (or Portainer) installed.
2. Review the production Compose definition and configure your environment variables:
   ```yaml
   services:
     app:
       image: ghcr.io/cfassoni/fitdaysweb/app:latest
       container_name: recomp-pro-app
       ports:
         - "80:3000"
       environment:
         - NODE_ENV=production
         - DOCKER_MODE=true
         - DATABASE_URL=file:/app/data/fitdays.db
         - UPLOAD_DIR=/app/data/uploads/profile_pics
         - REPORTS_DIR=/app/data/uploads/reports
         - JWT_SECRET=${SECRET_KEY:-default_secret_key_change_in_production}
         - ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-1440}
         - MAILGUN_API_KEY=${MAILGUN_API_KEY:-}
         - MAILGUN_DOMAIN=${MAILGUN_DOMAIN:-}
         - MAILGUN_API_BASE_URL=${MAILGUN_API_BASE_URL:-https://api.mailgun.net/v3}
         - MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-Recomp Pro <noreply@recomppro.local>}
         - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost}
       volumes:
         - recomp_pro_data:/app/data
       restart: unless-stopped

   volumes:
     recomp_pro_data:
       name: recomp_pro_data
   ```
3. Run the stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
4. Access the web interface at `http://<your-server-ip>` or `http://localhost`.

---

## 2. Upgrading from v0.3.0 to v0.4.0 (Volume Migration Procedure)

Upgrading from the legacy Python/FastAPI multi-container architecture (v0.3.0) to the single-container Next.js monolith (v0.4.0) involves moving your existing SQLite database (`fitdays.db`) and uploaded media from the legacy volume to the new `recomp_pro_data` volume.

Follow this 3-step transition procedure:

### Step 1: Initial Transitional Deployment

Update your Compose file or Portainer stack with the transitional configuration below. This attaches your existing legacy volume as an external volume and uses a temporary `data-migrator` init container to copy the files to `recomp_pro_data`:

```yaml
services:
  data-migrator:
    image: alpine
    restart: "no"
    volumes:
      - fitdays-db-data-legacy:/from
      - recomp_pro_data:/to
    command: sh -c "if [ ! -f /to/fitdays.db ] && [ -f /from/fitdays.db ]; then echo '[Migration] Migrating legacy data to new volume...'; cp -av /from/. /to/; echo '[Migration] Migration complete.'; else echo '[Migration] No migration needed.'; fi"

  app:
    depends_on:
      - data-migrator
    image: ghcr.io/cfassoni/fitdaysweb/app:latest
    container_name: recomp-pro-app
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - DOCKER_MODE=true
      - DATABASE_URL=file:/app/data/fitdays.db
      - UPLOAD_DIR=/app/data/uploads/profile_pics
      - REPORTS_DIR=/app/data/uploads/reports
      - JWT_SECRET=${SECRET_KEY:-default_secret_key_change_in_production}
      - ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-1440}
      - MAILGUN_API_KEY=${MAILGUN_API_KEY:-}
      - MAILGUN_DOMAIN=${MAILGUN_DOMAIN:-}
      - MAILGUN_API_BASE_URL=${MAILGUN_API_BASE_URL:-https://api.mailgun.net/v3}
      - MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-Recomp Pro <noreply@recomppro.local>}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost}
    volumes:
      - recomp_pro_data:/app/data
    restart: unless-stopped

volumes:
  fitdays-db-data-legacy:
    external: true
    name: fitdays-web_fitdays-db-data  # Adjust if your legacy volume name differs (e.g., fitdaysweb_fitdays-db-data)
  recomp_pro_data:
    name: recomp_pro_data
```

> **Note for Portainer Users:** If your legacy stack was named `fitdaysweb` instead of `fitdays-web`, check the volume name in Portainer (**Volumes** tab) and update the `name:` property under `fitdays-db-data-legacy` accordingly.

Deploy/update the stack. The `data-migrator` will execute automatically once, copy the files to `recomp_pro_data`, and exit cleanly.

### Step 2: Verification

1. Inspect the container logs:
   - Verify that `data-migrator` logged: `[Migration] Migration complete.`
   - Verify that `recomp-pro-app` logged: `Drizzle migrations verified successfully.`
2. Open the web UI, log in with your existing account credentials, and verify that all historical records and profile photos are present.

### Step 3: Cleanup to Permanent Stack

Once your data is verified:
1. Update your Compose file or Portainer stack to the clean permanent definition from **Section 1 (Fresh Installation)** (removing the `data-migrator` service and `fitdays-db-data-legacy` volume).
2. Redeploy the stack.
3. *(Optional)* The legacy volume (`fitdays-web_fitdays-db-data`) can now be kept as an offline backup or safely removed.

---

## 3. Future Deployments: Cloudflare Pages

Cloudflare Pages deployment (with D1 SQLite database and R2 object storage) is scheduled for Phase 5.

