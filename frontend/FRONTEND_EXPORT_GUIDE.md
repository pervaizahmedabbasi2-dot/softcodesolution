# SoftCode Solutions - Standalone Frontend Package

This directory contains the complete, pure **Angular (Standalone Architecture)** enterprise frontend for **SoftCode Solutions**, extracted cleanly without backend or server dependencies.

---

## 📁 What is in this package?

```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/                # All enterprise modules
│   │   │   ├── school-dashboard/     # School Management, Admissions Dossier (22+ fields), Fee Invoicing, Audit Logs
│   │   │   ├── overview/             # Owner Executive Metrics, Financial KPIs
│   │   │   ├── all-clients/          # Multi-tenant Client Manager
│   │   │   ├── api-gateway/          # Rate Limits, SSL, Gateway Proxy
│   │   │   ├── rbac/                 # Roles, Permissions & Access Matrix
│   │   │   ├── payments/             # Billing, Subscription Invoices, Payment Gateways
│   │   │   ├── retail-pos/           # Barcode, Inventory, Billing
│   │   │   ├── restaurant-hub/       # KDS, Table & Order Management
│   │   │   ├── pharmacy-hub/         # Batch tracking, Drug Inventory, Prescriptions
│   │   │   ├── clinic-hub/           # Patient Electronic Records, Appointments
│   │   │   ├── gym-hub/              # Member check-in, Subscriptions, Fitness
│   │   │   ├── hotel-hub/            # Room booking, Housekeeping, Guest billing
│   │   │   └── travel-hub/           # Ticketing, Umrah & Tourism itineraries
│   │   ├── landing-page/             # Public landing pages, pricing, solutions
│   │   ├── login/ & register/        # Authentication UI
│   │   ├── services/                 # Angular Signals Services & HTTP clients
│   │   └── guards/                   # Route protection guards
│   ├── assets/                       # Fonts, illustrations, and logos
│   ├── styles.css                    # Tailwind CSS v4 design tokens and enterprise theme
│   └── index.html                    # Single Page Application HTML shell
├── angular.json                      # Angular CLI project configuration
├── package.json                      # All frontend dependencies (Angular 21, Tailwind v4, Lucide)
├── proxy.conf.json                   # Reverse proxy for backend API calls
├── tsconfig.json                     # TypeScript strict configuration
└── .postcssrc.json                   # PostCSS Tailwind CSS configuration
```

---

## 🚀 How to Add This to Your Existing GitHub Project

### Option 1: Place inside your existing repo under `/frontend` folder (Recommended)
If your GitHub repo has backend in root or `/backend`:
1. Copy or extract this entire folder into your repository at `./frontend`.
2. Open terminal in `./frontend` and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   # or
   npm run dev
   ```
4. By default, it runs on `http://localhost:4200` (or port 3000) and proxies `/api/*` requests to your backend on `http://127.0.0.1:3001` via `proxy.conf.json`.

---

## 🔌 Connecting to Your Existing Backend

In `proxy.conf.json`, you can point the target to your backend server port (e.g. Express, Django, Laravel, Spring Boot, FastAPI, Go):

```json
{
  "/api": {
    "target": "http://127.0.0.1:5000",   // <-- Change to your backend URL/PORT
    "secure": false,
    "changeOrigin": true
  }
}
```

Or configure environment files in `src/environments/` if using direct API URLs.

---

## 📦 Building for Production

To create optimized production HTML/CSS/JS bundles:
```bash
npm run build
```
Output bundles will be generated in `dist/softcode-ui/browser/`. You can serve these with Nginx, Docker, Node.js Express, AWS S3 / CloudFront, Firebase Hosting, or Vercel.

---

## 🛠️ Git Commands to Push to Your GitHub Repository

If you want to push this frontend directly into your GitHub repository:

### Method A: Commit into your existing repository
```bash
# In your local clone of your GitHub repo:
git status
git add frontend/
git commit -m "feat: integrate SoftCode Solutions enterprise frontend"
git push origin main
```

### Method B: Initialize as its own standalone Git repository
```bash
cd frontend
git init
git add .
git commit -m "feat: initial commit of standalone SoftCode frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_FRONTEND_REPO.git
git push -u origin main
```
