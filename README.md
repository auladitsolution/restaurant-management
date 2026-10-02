# Aulad IT Solution — Restaurant POS & Management System

> **A Production-Ready, Single-Tenant Restaurant POS & Management System tailored for the Bangladesh Food & Beverage Industry.**
> Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, Firebase Auth, and Cloudinary. Primary UI localized in **Bangla (বাংলা)** with the **Hind Siliguri** typography.

---

## 🌟 Overview

This master codebase is engineered for **Aulad IT Solution** to sell and deploy to restaurants, cafés, and cloud kitchens across Bangladesh. Every restaurant receives an **isolated, single-tenant deployment** with its own:
- Dedicated **MongoDB Atlas** database
- Dedicated **Firebase Project** for user authentication
- Dedicated **Cloudinary** media repository
- Independent branding, invoice rules, tax rates, and feature flags

---

## 🏗 Architecture & Key Features

### 1. Bengali-First Modern Interface
- **Primary Typography**: Hind Siliguri (`next/font/google`), loaded with native font optimization.
- **Bengali Currency & Locale**: Bangladeshi Taka (`৳` / BDT), Asia/Dhaka timezone, `DD/MM/YYYY` timestamps, and localized status badges.

### 2. High-Speed Touch-Optimized POS
- Multi-category navigation with instant real-time search.
- Variants (e.g., Small / Medium / Large) & optional Add-ons.
- Order types: **Dine-in (ডাইন-ইন)**, **Takeaway (টেকঅ্যাওয়ে)**, and **Delivery (ডেলিভারি)**.
- Safe financial calculation engine preventing floating-point rounding errors.
- Server-side price and availability validation against tampering.

### 3. Visual Table & Floor Plan Management
- Multi-floor layout management (Ground Floor, 1st Floor, Rooftop, etc.).
- Visual table cards indicating live states: **খালি (Available)**, **ব্যস্ত (Occupied)**, **রিজার্ভ (Reserved)**, **পরিষ্কার হচ্ছে (Cleaning)**.
- Seamless order transfer between tables.

### 4. Kitchen Display System (KDS)
- Dedicated kitchen interface (`/kitchen`) with 10-second controlled live sync.
- Real-time elapsed preparation timer for each order ticket.
- Built-in Web Audio API chime alerting kitchen staff when new tickets arrive.
- Progressive lifecycle: `NEW` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`.

### 5. Multi-Method & Split Payments
- Support for **Cash**, **bKash**, **Nagad**, **Rocket**, **Card**, and **Due (বাকি)**.
- Mixed / Split payment support (e.g. ৳1,000 Cash + ৳500 bKash).
- Accurate customer due ledger tracking.

### 6. Thermal & A4 Receipt Printing
- Dual-mode browser printing:
  - **Thermal Receipt (58mm / 80mm)** standard for thermal receipt printers.
  - **A4 Formal Tax Invoice** for corporate and banquet catering orders.
- Custom receipt headers, telephone, VAT registration, order QR/barcodes, and Bangla footers.

### 7. Recipe / BOM & Inventory Automation
- Raw ingredient mapping per menu item (e.g., Chicken Burger ➔ 1 Bun, 120g Chicken, 1 Cheese Slice).
- Automated inventory deduction on order completion.
- Reversal stock movement generation on cancelled orders.
- Low-stock warnings (`স্টক কম`) when stock drops below minimum thresholds.
- Complete audit trail of stock movements: `PURCHASE`, `SALE_CONSUMPTION`, `ADJUSTMENT`, `WASTE`, `RETURN`.

### 8. Purchase & Supplier Management
- Supplier records with outstanding payable tracking.
- Purchase order registration with automatic ingredient stock increments.

### 9. Daily Expense & Cash Register Shift
- Categorized daily expense logging (বাজার, বেতন, বিদ্যুৎ, ভাড়া, etc.) with Cloudinary receipt image attachments.
- Cashier shift open/close tracking: Opening Cash, Cash Sales, Cash In, Cash Out, and Cash Discrepancy reconciliation.

### 10. Analytics, Profit & Loss, and Export
- Real-time KPI summaries: Today's Sales, Orders, Average Ticket, Expenses, Estimated Net Profit, and Active Dues.
- Recharts visualizations: Hourly/Weekly Sales Trends, Order Type split, and Payment Method distribution.
- Accurate Profit Summary distinguishing Revenue, Cost of Goods Sold (COGS), Operating Expenses, and Estimated Net Profit.
- 1-Click Excel/CSV exports formatted with UTF-8 BOM for Bangla character compatibility.

### 11. Security & Role-Based Access Control (RBAC)
- 6 predefined roles: `OWNER`, `MANAGER`, `CASHIER`, `WAITER`, `KITCHEN`, `INVENTORY_MANAGER`.
- Server-side verification of Firebase ID tokens using Firebase Admin SDK.
- Non-repudiable audit logging for sensitive actions (price adjustments, cancellations, refunds, settings updates).

---

## 🛠 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16 (App Router)** | Full-stack React framework with Turbopack |
| **TypeScript** | Strict compile-time type safety |
| **Tailwind CSS v4** | Rapid, touch-friendly UI design system |
| **MongoDB Atlas & Mongoose** | Document database with connection pooling and transactions |
| **Firebase Auth & Admin SDK** | Secure authentication and token verification |
| **Cloudinary** | Secure media storage for logos, menu items, and receipts |
| **Zod** | Server and client runtime schema validation |
| **Recharts** | Interactive business analytics dashboards |
| **Lucide React** | Consistent SVG iconography |
| **Vitest** | Automated unit test runner |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 20.x
- **MongoDB Atlas** cluster URI
- **Firebase Project** with Authentication enabled
- **Cloudinary** account

### 2. Installation
```bash
git clone <repository-url> restaurant-pos
cd restaurant-pos
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials (see Configuration section below).

### 4. Database Seeding (Demo Data)
Populate your database with the demo restaurant **"স্বাদ রেস্টুরেন্ট"** (categories, menu items, tables, inventory, recipes, suppliers):
```bash
npm run seed
```

### 5. Running in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Configuration

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | Database name (e.g. `swad_pos`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `FIREBASE_PROJECT_ID` | Firebase Admin Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `FIRST_OWNER_EMAIL` | Email authorized for first-time owner initialization |
| `INITIAL_SETUP_TOKEN` | Secure token required on `/setup` page |
| `NEXT_PUBLIC_APP_NAME` | Restaurant Brand Name (e.g. `স্বাদ রেস্টুরেন্ট`) |

---

## 🧪 Testing & Code Quality

```bash
# Run Vitest unit tests (calculations, permissions, validations)
npm test

# Run ESLint
npm run lint

# Check TypeScript types
npx tsc --noEmit

# Compile production build
npm run build
```

---

## 📦 Deployment to Vercel

1. Push this repository to GitHub/GitLab.
2. Import project into [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add all keys from `.env.example`.
4. Deploy!
5. Visit `https://your-domain.vercel.app/setup` to initialize the first restaurant Owner.

For detailed restaurant onboarding steps, consult [CLIENT_SETUP.md](./CLIENT_SETUP.md).

---

## 📄 License & Ownership
Copyright © 2026 **Aulad IT Solution**. All rights reserved.  
Single-tenant commercial application.
