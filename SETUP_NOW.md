# 🔥 LIVE SETUP GUIDE - Follow These Steps

## ✅ STEP 1: Install Git (Do This First)

1. **Download Git:** Click the download button in the browser (64-bit Git for Windows Setup)
2. **Run the installer** when download completes
3. **Use default settings** - just click "Next" through everything
4. **Finish installation**
5. **Close and reopen PowerShell** (important!)

**Test it worked:**
```powershell
git --version
```
Should show: `git version 2.x.x`

---

## ✅ STEP 2: Sign into Firebase Console

**The browser is open to Firebase Console.**

1. **Sign in with your Google account**
2. **Click "Add project"** (or "Create a project")
3. **Name it:** `finance-tracker`
4. **Disable Google Analytics** (toggle it off - not needed)
5. **Click "Create project"**
6. **Wait 30 seconds** for it to set up
7. **Click "Continue"**

**Keep this browser tab open!**

---

## ✅ STEP 3: Set Up Firestore Database

**In the Firebase Console:**

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select **location:** `us-east1` (or closest to you)
5. Click **"Enable"**
6. Wait for it to provision (30 seconds)

**Leave this tab open!**

---

## ✅ STEP 4: Get Firebase Config

**Still in Firebase Console:**

1. Click the **⚙️ gear icon** (top left) → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **`</>`** icon (Web app)
4. **App nickname:** `Finance Tracker`
5. **Don't check** "Also set up Firebase Hosting"
6. Click **"Register app"**
7. **COPY the firebaseConfig object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "finance-tracker-xxx.firebaseapp.com",
  projectId: "finance-tracker-xxx",
  storageBucket: "finance-tracker-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**PASTE THIS INTO NOTEPAD - YOU'LL NEED IT!**

Click **"Continue to console"**

---

## ✅ STEP 5: Secure Firestore Rules

**In Firebase Console:**

1. Click **"Firestore Database"** (left sidebar)
2. Click **"Rules"** tab (top)
3. **Replace everything** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **"Publish"**

**This ensures only you can access your data.**

---

## ✅ STEP 6: Create GitHub Repository

1. Go to **https://github.com/new**
2. **Repository name:** `finance-tracker`
3. **Make it PRIVATE** ⚠️ (important for your financial data!)
4. **Don't** initialize with README
5. Click **"Create repository"**

**Keep this page open - you'll need the commands!**

---

## ✅ STEP 7: I'll Create the Firebase Code

**I'll create the files for you. Just wait for me to finish...**

---

## 📋 CHECKLIST

- [ ] Git installed and working
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Firebase config copied to notepad
- [ ] Firestore rules updated
- [ ] GitHub repository created (PRIVATE!)
- [ ] Ready for code updates

**Tell me when you've completed steps 1-6, and I'll create all the Firebase integration code!**
