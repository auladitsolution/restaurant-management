# Aulad IT Solution — Restaurant Client Onboarding Manual

This guide outlines the complete 19-step onboarding process for deploying a new single-tenant instance of the **Restaurant POS & Management System** for a restaurant client in Bangladesh.

---

## 📋 Architecture Overview

Each restaurant client receives their own isolated instance:
- Dedicated **MongoDB Atlas Database** (client owns their data)
- Dedicated **Firebase Project** (secure authentication & employee logins)
- Dedicated **Cloudinary Folder** (logos, menu images, expense attachments)
- Dedicated **Vercel or Cloud Hosting Environment**
- Independent **Branding & VAT / Tax Configuration**

---

## 🛠 Step-by-Step Onboarding Process

### Step 1: Create MongoDB Atlas Project & Database
1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and log in.
2. Click **Create an Organization** or create a new **Project** named after the restaurant (e.g., `Swad-Restaurant-DB`).
3. Deploy a new Cluster (e.g. Free Tier M0 or Production Dedicated M10+ in the `ap-south-1` Mumbai region for lowest latency to Bangladesh).
4. Name the cluster and database (e.g., `swad_pos`).

### Step 2: Configure Database User & Network Access
1. Under **Security > Database Access**, click **Add New Database User**.
2. Select **Built-in Authentication (Password)**:
   - Username: `swad_admin`
   - Secure Password: Generate a strong 24-character password.
   - Database User Privileges: `Read and write to any database`.
3. Under **Security > Network Access**, click **Add IP Address**:
   - For Vercel/Serverless deployment: Allow access from anywhere (`0.0.0.0/0`) or configure MongoDB Atlas Peering.
4. Copy the connection string format:
   ```
   mongodb+srv://swad_admin:<password>@cluster0.xxxxx.mongodb.net/swad_pos?retryWrites=true&w=majority
   ```

### Step 3: Create Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com).
2. Click **Add project** and name it according to the restaurant (e.g., `swad-restaurant-pos`).
3. (Optional) Disable Google Analytics unless requested by the client.
4. Click **Create project** and wait for provisioning.

### Step 4: Enable Required Authentication Providers
1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get started**.
3. Under **Sign-in method**, enable:
   - **Email/Password**: Enable "Email/Password" (keep "Email link" disabled).
   - **Google**: Enable if the restaurant owner or managers prefer one-click Google Sign-in. Configure the support email.

### Step 5: Configure Authorized Domains
1. In Firebase Authentication, click the **Settings** tab.
2. Select **Authorized domains**.
3. Add the domains where the restaurant application will be hosted:
   - `localhost` (already present by default for local testing)
   - `swad-pos.vercel.app` (or custom domain e.g. `pos.swadrestaurant.com.bd`)

### Step 6: Configure Firebase Web & Admin Credentials
1. **Web App Credentials**:
   - Go to **Project Settings > General**.
   - Under *Your apps*, click the **Web icon (`</>`)** to register an app (e.g., `Swad Web POS`).
   - Copy `apiKey`, `authDomain`, and `projectId`.
2. **Admin SDK Service Account Credentials**:
   - Go to **Project Settings > Service accounts**.
   - Ensure `Node.js` is selected, then click **Generate new private key**.
   - Download the JSON file securely.
   - Extract:
     - `project_id`
     - `client_email`
     - `private_key` (be sure newlines `\n` are properly handled in environment variables).

### Step 7: Create Cloudinary Account
1. Visit [Cloudinary](https://cloudinary.com) and create an account for the restaurant (or a dedicated sub-account/folder).
2. Note your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.

### Step 8: Configure Cloudinary Upload Settings
1. Go to **Settings > Upload**.
2. Under **Upload presets**, verify signed uploads are permitted.
3. Assets will automatically be organized under the folder prefix:
   - `restaurant-pos/branding`
   - `restaurant-pos/menu`
   - `restaurant-pos/expenses`

### Step 9: Configure Environment Variables
1. In your local repository, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the variables:
   ```env
   MONGODB_URI=mongodb+srv://swad_admin:your_password@cluster0.xxxxx.mongodb.net/swad_pos?retryWrites=true&w=majority
   MONGODB_DB_NAME=swad_pos

   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=swad-restaurant-pos.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=swad-restaurant-pos

   FIREBASE_PROJECT_ID=swad-restaurant-pos
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@swad-restaurant-pos.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...-----END PRIVATE KEY-----\n"

   CLOUDINARY_CLOUD_NAME=swad-cloud
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz12

   FIRST_OWNER_EMAIL=owner@swadrestaurant.com
   INITIAL_SETUP_TOKEN=generate-a-strong-random-token-here

   NEXT_PUBLIC_APP_NAME="স্বাদ রেস্টুরেন্ট"
   NEXT_PUBLIC_APP_URL=https://swad-pos.vercel.app
   ```

### Step 10: Configure Restaurant Information
1. Open `src/config/features.ts` or complete the `/settings` page after initial login.
2. Set default VAT rate (e.g., 5% or 7.5% as per NBR restaurant rules).
3. Set service charge rate (if applicable) and invoice prefixes (e.g. `SWAD-`).
4. Set Bangla receipt footer text (e.g., *"আমাদের সাথে থাকার জন্য ধন্যবাদ। আবার আসবেন!"*).

### Step 11: Create Initial Owner Account
1. Start the server (`npm run dev`) or access the deployed application.
2. Navigate to `http://localhost:3000/setup` (or `https://your-domain/setup`).
3. Fill in:
   - Setup Token (must match `INITIAL_SETUP_TOKEN`)
   - Owner Full Name (e.g., `স্বত্বাধিকারী`)
   - Owner Email (must match `FIRST_OWNER_EMAIL`)
   - Phone Number (e.g., `01711000000`)
   - Secure Password
4. The system validates the token and email, registers the account in Firebase Auth, creates the user in MongoDB with the `OWNER` role and full permissions, and initializes the restaurant settings document.
5. Once complete, the setup endpoint automatically blocks future bootstrap attempts.

### Step 12: Run Locally & Test Connectivity
Verify local operation:
```bash
npm run dev
```
Sign in at `/login` using the newly created Owner credentials.

### Step 13: Test POS Workflow
1. Navigate to `/pos`.
2. Add menu items to the cart.
3. Select an order type:
   - **ডাইন-ইন (Dine-in)**: Select table and number of guests.
   - **টেকঅ্যাওয়ে (Takeaway)**: Enter customer name and phone.
   - **ডেলিভারি (Delivery)**: Enter customer delivery address and charges.
4. Click **অর্ডার কনফার্ম করুন (Confirm Order)**.
5. Verify order appears immediately in `/orders`.

### Step 14: Test Kitchen Display System (KDS)
1. In another browser tab, open `/kitchen`.
2. Verify the newly placed order ticket displays with audio notification.
3. Advance the order through the pipeline:
   `নতুন (New)` ➔ `প্রস্তুত হচ্ছে (Preparing)` ➔ `প্রস্তুত (Ready)` ➔ `সার্ভ করা হয়েছে (Served)`.

### Step 15: Test Receipt Printing & Payments
1. Open the order in `/orders` or directly in POS.
2. Open the **পেমেন্ট সংগ্রহ করুন (Collect Payment)** modal.
3. Test a split payment (e.g. ৳500 Cash + ৳500 bKash).
4. Verify payment status updates to `PAID`.
5. Click **রসিদ দেখুন / প্রিন্ট (View/Print Receipt)**.
6. Test both **থার্মাল রসিদ (80mm/58mm)** and **A4 চালান (A4 Invoice)** print previews.

### Step 16: Test Recipe & Inventory Deductions
1. Navigate to `/inventory` and inspect raw ingredient quantities.
2. Check that confirming an order automatically deducts the ingredient quantities as defined in `/recipes`.
3. Cancel a test order with a reason and verify an automatic `RETURN` stock movement restores the inventory quantities.

### Step 17: Configure Production Environment Variables in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Connect the Git repository or deploy using Vercel CLI.
3. In **Settings > Environment Variables**, paste all production environment variables from Step 9.
4. Set Node.js version to 20.x or latest stable.

### Step 18: Deploy & Verify Build
1. Trigger a production deployment.
2. Verify that Turbopack completes the build with zero TypeScript or bundling errors.
3. Verify domain routing and SSL certificate provisioning.

### Step 19: Post-Deployment Verification
Conduct a final acceptance check on the production URL:
- [ ] Owner login succeeds.
- [ ] Owner creates employee users (Cashier, Waiter, Kitchen) under `/users`.
- [ ] Restaurant profile and logo upload to Cloudinary succeeds under `/settings`.
- [ ] Cashier can open and close shifts under `/shifts`.
- [ ] Daily expenses can be logged under `/expenses`.
- [ ] Daily and monthly financial reports under `/reports` calculate Revenue, COGS, and Net Profit accurately.
- [ ] Audit logs under `/audit-logs` record employee and sensitive administrative events.
- [ ] The client is handed over the Owner account credentials; Aulad IT Solution does not need to store client passwords.

---

**Aulad IT Solution** — *Empowering Bangladesh F&B businesses with cutting-edge software.*
