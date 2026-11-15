# EPMS Production Deployment Guide

This guide details steps for deploying the **Education Progress Monitoring System** to production hosting platforms.

---

## 1. Containerized Deployment (Docker & Docker Compose)

The easiest and most reliable method to deploy the entire stack is with Docker Compose.

### Pre-requisites
- A VPS or dedicated Linux server (Ubuntu 22.04 LTS recommended, 2 vCPUs, 4GB+ RAM)
- Docker Engine 24.0+ and Docker Compose v2+ installed

### Step-by-Step
1. **Clone the repository onto the server**:
   ```bash
   git clone https://github.com/your-org/epms.git
   cd epms
   ```

2. **Configure Production Environment**:
   Edit `docker-compose.yml` or set environment variables:
   ```bash
   export MYSQL_ROOT_PASSWORD="StrongProductionDbPassword2026!"
   export JWT_SECRET="AStrongProductionSecretKeyAtLeast256BitsLong2026SecureEncryption"
   ```

3. **Deploy with Compose**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify Container Health**:
   ```bash
   docker-compose ps
   docker logs epms-backend
   ```

---

## 2. Cloud Platform Deployment (Frontend on Vercel + Backend on Render)

For serverless/managed cloud hosting:

### A. Database (Managed MySQL)
- Use **Aiven**, **PlanetScale**, **Amazon RDS**, or **Railway MySQL**.
- Create a database called `epms_db`.
- Obtain the JDBC URL, username, and password.

### B. Backend on Render / Railway
1. Create a **New Web Service** pointing to the repository subdirectory: `epms-backend`.
2. Environment: **Java** or **Docker**.
   - If Docker: Specify `./Dockerfile`.
   - If Native: Build command: `mvn clean package -DskipTests`, Start command: `java -jar target/*.jar`.
3. Set Environment Variables:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DB_HOST`: `<your-db-host>`
   - `DB_PORT`: `3306`
   - `DB_NAME`: `epms_db`
   - `DB_USERNAME`: `<your-db-username>`
   - `DB_PASSWORD`: `<your-db-password>`
   - `JWT_SECRET`: `<your-production-jwt-secret>`
   - `FILE_UPLOAD_DIR`: `/app/uploads`
4. Deploy the service. Your backend URL will be e.g. `https://epms-api.onrender.com`.

### C. Frontend on Vercel
1. In Vercel, import your Git repository.
2. Set **Root Directory** to `epms-frontend`.
3. Framework Preset: **Vite**.
4. Set Environment Variables:
   - `VITE_API_URL`: `https://epms-api.onrender.com/api/v1`
5. Click **Deploy**.

---

## 3. Database Migration & Initial Seed Data
When starting in `dev` or containerized mode, Spring Boot will automatically initialize database tables using Hibernate DDL and insert seed data from `data.sql`.

For explicit production database initialization, run:
```bash
mysql -h <DB_HOST> -u <DB_USER> -p epms_db < epms-backend/src/main/resources/data.sql
```

---

## 4. Security Checklist for Production
- [ ] Change all default passwords from `Admin@123`.
- [ ] Generate a secure 512-bit JWT secret key.
- [ ] Enable HTTPS / SSL certificates via Let's Encrypt / Certbot.
- [ ] Restrict MySQL port `3306` from public access using a firewall.
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate` in production.
- [ ] Enable periodic automated database backups.
