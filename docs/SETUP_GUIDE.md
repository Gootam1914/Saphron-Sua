# Saphron Sua - Setup & Deployment Guide

This guide is written so you can follow it literally, even if you have never written code. Copy and paste each command exactly. After most steps there is a **"You should see"** note so you can confirm it worked before moving on.

There are two ways to run this app:

- **Demo mode (fastest):** run it on your own computer with fake sample data and instant one-click logins. No Google or database accounts needed. Do **Part A** only.
- **Real mode:** connect a real database (MongoDB Atlas) and real Google sign-in (Firebase), then put it on the internet. Do **Parts A → E**.

Words in `this font` are commands or values. `<like this>` means "replace with your own value."

---

## Part A - Run it on your computer (demo mode)

### A1. Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the big green button on the left).
3. Open the downloaded file and click through the installer (Next → Next → Finish). Accept all defaults.
4. Open your terminal:
   - **Mac:** press `Cmd + Space`, type `Terminal`, press Enter.
   - **Windows:** press the Start key, type `PowerShell`, press Enter.
5. Type this and press Enter:
   ```bash
   node -v
   ```
   **You should see** a version number like `v20.x.x` or higher. If you see "command not found," restart your computer and try again.

### A2. Open the project folder
1. In the terminal, move into the project folder. Replace the path with wherever this folder lives on your computer:
   ```bash
   cd "<path to>/Saphron Sua"
   ```
   Tip: you can type `cd ` (with a space) and then drag the folder from Finder/Explorer onto the terminal window, then press Enter.
2. Confirm you are in the right place:
   ```bash
   ls
   ```
   **You should see** `client`, `server`, `README.md`, and `package.json` listed.

### A3. Install the project's building blocks
```bash
npm run install:all
```
This downloads the libraries the app needs. It takes 1–3 minutes.
**You should see** it finish with a line like `added ### packages`. A few yellow `warn` lines are normal and safe to ignore.

### A4. Create the settings files
These commands copy the example settings into real settings files.

**Mac / Linux:**
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**Windows (PowerShell):**
```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```
**You should see** no error (no output means it worked). Demo mode is already switched on by default in these files, so you don't need to edit anything yet.

### A5. Start a local database (demo mode needs somewhere to store data)
The simplest option is a free cloud database - skip ahead and do **Part C (MongoDB Atlas)** now, paste the connection string into `server/.env`, then come back here. Atlas is free and takes about 5 minutes.

> Prefer everything offline instead? Install MongoDB Community Server from https://www.mongodb.com/try/download/community and start it; then leave `MONGODB_URI` in `server/.env` as `mongodb://localhost:27017/saphron_sua`. For most people, Atlas (Part C) is easier.

### A6. Load the sample data
```bash
npm run seed
```
**You should see** a list ending with the four demo accounts (admin/teacher/parent/student @maplewood.edu). If you see a connection error, your `MONGODB_URI` in `server/.env` is wrong or the database isn't running - recheck Part C.

### A7. Start the app
You need **two** terminal windows/tabs, both sitting in the `Saphron Sua` folder.

**Terminal 1 - the backend:**
```bash
npm run dev:server
```
**You should see** `Saphron Sua API listening on http://localhost:5000 (demoMode=true)`. Leave this running.

**Terminal 2 - the frontend:**
```bash
npm run dev:client
```
**You should see** a line like `Local: http://localhost:5173/`.

### A8. Open it
1. Open your web browser and go to **http://localhost:5173**
2. On the sign-in screen, click one of the **demo account** buttons (Admin, Teacher, Parent, or Student).
3. **You should see** that role's dashboard. Try the four different roles to see how each experience differs. Try sending a message as the Student and approving it as the Teacher (Moderation).

To stop the app later, click each terminal and press `Ctrl + C`.

---

## Part B - Set up Google sign-in (Firebase)

Do this when you want real people to log in with their school Google accounts. Turn demo mode off afterward.

### B1. Create the Firebase project
1. Go to https://console.firebase.google.com
2. Click **Add project** (or **Create a project**).
3. Name it `saphron-sua` and click **Continue**.
4. Google Analytics is optional - you can turn it off. Click **Create project**, wait, then **Continue**.

### B2. Turn on Google sign-in
1. In the left menu click **Build → Authentication**, then **Get started**.
2. Open the **Sign-in method** tab.
3. Click **Google** in the list, toggle **Enable** on, pick a support email, and click **Save**.

### B3. Get the frontend (web) keys
1. Click the gear icon (top-left) → **Project settings**.
2. Scroll to **Your apps**, click the **Web** icon `</>`.
3. Nickname it `saphron-sua-web`, click **Register app**.
4. You'll see a `firebaseConfig` block with values like `apiKey`, `authDomain`, etc. Keep this page open.
5. Open `client/.env` in a text editor and fill in each value (no quotes needed):
   ```
   VITE_FIREBASE_API_KEY=<apiKey>
   VITE_FIREBASE_AUTH_DOMAIN=<authDomain>
   VITE_FIREBASE_PROJECT_ID=<projectId>
   VITE_FIREBASE_STORAGE_BUCKET=<storageBucket>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
   VITE_FIREBASE_APP_ID=<appId>
   VITE_DEMO_MODE=false
   ```
   Optionally set `VITE_ALLOWED_EMAIL_DOMAIN=yourschool.org` to only allow that school domain to sign in.

### B4. Get the backend (Admin) key
The backend needs a private "service account" key to verify logins.
1. Still in **Project settings**, open the **Service accounts** tab.
2. Click **Generate new private key** → **Generate key**. A `.json` file downloads.
3. **Easiest path (local):** rename that file to `serviceAccountKey.json` and place it inside the `server/` folder. The app finds it automatically. (It is already in `.gitignore`, so it won't be shared by accident.)
4. **For hosting (Render), instead** open the downloaded JSON and copy three values into `server/.env`:
   ```
   FIREBASE_PROJECT_ID=<project_id from the json>
   FIREBASE_CLIENT_EMAIL=<client_email from the json>
   FIREBASE_PRIVATE_KEY=<private_key from the json>
   ```
   The `private_key` is long and contains `\n` sequences - paste it exactly as it appears, keeping the quotes if your editor added them, and keep it on one line. The app converts the `\n` back into line breaks.

### B5. Turn demo mode off
- In `server/.env` set `DEMO_MODE=false`
- In `client/.env` set `VITE_DEMO_MODE=false`

> **Important:** real users must be *provisioned* before they can log in. An admin adds them (with a role) under **Users** in the app, or you add them to the seed script. This prevents anyone with a Google account from granting themselves access.

---

## Part C - Create the database (MongoDB Atlas)

### C1. Create a free cluster
1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. When asked, choose the **M0 / Free** shared cluster. Pick any nearby cloud region. Click **Create**.

### C2. Create a database user
1. Left menu → **Database Access** → **Add New Database User**.
2. Choose **Password** authentication. Set a username (e.g. `sua_app`) and a password. **Write the password down.**
3. Under privileges choose **Read and write to any database**. Click **Add User**.

### C3. Allow network access
1. Left menu → **Network Access** → **Add IP Address**.
2. For testing click **Allow access from anywhere** (`0.0.0.0/0`). For production, restrict this to your host's IPs later. Click **Confirm**.

### C4. Get the connection string
1. Left menu → **Database** → click **Connect** on your cluster → **Drivers**.
2. Copy the string. It looks like:
   ```
   mongodb+srv://sua_app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with the password from step C2, and add the database name `saphron_sua` right before the `?`:
   ```
   mongodb+srv://sua_app:MyPass123@cluster0.xxxxx.mongodb.net/saphron_sua?retryWrites=true&w=majority
   ```
4. Paste that whole string into `server/.env` as `MONGODB_URI=...`
   **You should see** no error when you next run `npm run seed` (Part A6).

### C5. Generate an encryption key (recommended)
Run this once and paste the output into `server/.env` as `FIELD_ENCRYPTION_KEY=...`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**You should see** a 64-character string. This encrypts message contents in the database.

---

## Part D - Put the backend online (Render)

### D1. Push the code to GitHub
1. Create a free account at https://github.com and make a **new repository** named `saphron-sua`.
2. Follow GitHub's "push an existing folder" instructions, or use GitHub Desktop (https://desktop.github.com) to publish the folder. The end result: your code is visible on github.com.

### D2. Create the web service
1. Go to https://render.com and sign up (you can sign in with GitHub).
2. Click **New +** → **Web Service** → connect your GitHub and pick the `saphron-sua` repo.
3. Fill in the settings:
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
4. Click **Advanced** → **Add Environment Variable** and add each of these (from your `server/.env`):
   - `NODE_ENV` = `production`
   - `DEMO_MODE` = `false`
   - `MONGODB_URI` = your Atlas string (Part C4)
   - `FIELD_ENCRYPTION_KEY` = your key (Part C5)
   - `CLIENT_ORIGIN` = `https://<your-vercel-app>.vercel.app` (you'll get this in Part E; you can paste a placeholder now and update it after E)
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (from Part B4)
5. Click **Create Web Service**. Render builds and starts it.
   **You should see** the log end with `Saphron Sua API listening…` and the status turn green (**Live**).
6. Copy your backend URL (top of the page), e.g. `https://saphron-sua-api.onrender.com`.
7. Test it: open `https://saphron-sua-api.onrender.com/api/health` in a browser.
   **You should see** `{"ok":true,...}`.

### D3. Seed the production database (one time)
From your computer, run the seed against the production database:
```bash
# Mac/Linux
MONGODB_URI="<your Atlas string>" npm run seed
```
```powershell
# Windows PowerShell
$env:MONGODB_URI="<your Atlas string>"; npm run seed
```
**You should see** the demo accounts printed. (For a real school you'd add real users via the Admin → Users screen instead of demo data.)

---

## Part E - Put the frontend online (Vercel)

### E1. Import the project
1. Go to https://vercel.com and sign up (sign in with GitHub).
2. Click **Add New… → Project**, import the `saphron-sua` repo.
3. Set **Root Directory** to `client` (click **Edit** next to Root Directory and choose `client`).
4. Framework preset should auto-detect **Vite**. Leave Build Command `npm run build` and Output Directory `dist`.

### E2. Add environment variables
Under **Environment Variables**, add (from your `client/.env`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_DEMO_MODE` = `false`
- `VITE_API_BASE_URL` = your Render backend URL (Part D2), e.g. `https://saphron-sua-api.onrender.com`
- (optional) `VITE_ALLOWED_EMAIL_DOMAIN` = `yourschool.org`

### E3. Deploy
1. Click **Deploy**. Wait for it to finish.
   **You should see** a "Congratulations" screen with a link like `https://saphron-sua.vercel.app`.
2. Open that link.
   **You should see** the Saphron Sua sign-in page.

### E4. Connect the two ends
1. Copy your Vercel URL.
2. Go back to **Render → your service → Environment**, set `CLIENT_ORIGIN` to that exact URL, and save (Render redeploys).
3. In the **Firebase Console → Authentication → Settings → Authorized domains**, click **Add domain** and add your Vercel domain (e.g. `saphron-sua.vercel.app`).
4. Reload your Vercel site and click **Continue with Google**.
   **You should see** the Google account chooser, and after signing in (with a provisioned account) you land on your dashboard.

---

## Everyday commands (cheat sheet)

| I want to… | Command | Run it in |
|---|---|---|
| Install everything | `npm run install:all` | project root |
| Load sample data | `npm run seed` | project root |
| Start the backend | `npm run dev:server` | project root |
| Start the frontend | `npm run dev:client` | project root |
| Build the frontend for production | `npm run build` | project root |
| Check the code for errors | `npm run lint` | project root |

## Common problems

- **"command not found: npm"** - Node isn't installed or the terminal wasn't restarted. Redo A1.
- **Seed/backend shows a connection error** - `MONGODB_URI` is wrong, or Atlas Network Access doesn't allow your IP (Part C3).
- **Login says "No account provisioned"** - the person's email hasn't been added as a user yet. Add them under **Admin → Users**, or use a demo account.
- **Google button is greyed out** - Firebase keys aren't set in `client/.env` (Part B3), or you're in demo mode.
- **Frontend loads but data calls fail in production** - `VITE_API_BASE_URL` (Vercel) or `CLIENT_ORIGIN` (Render) is wrong; they must point at each other (Part E4).
- **Render free service is slow to first load** - free instances sleep when idle and take ~30s to wake. This is normal on the free plan.
