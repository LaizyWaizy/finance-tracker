// Firebase Integration Layer
// Add this code to your app.js to enable cloud sync

import { saveToFirebase, loadFromFirebase, listenToFirebase } from './firebase-config.js';

// ============================================
// ENHANCED SAVE METHODS (with Firebase sync)
// ============================================

// Replace your existing saveEntries() with this:
function saveEntriesWithSync() {
    // Save to localStorage (instant, offline-first)
    localStorage.setItem('financeEntries', JSON.stringify(this.entries));

    // Also save to Firebase (cloud backup + sync)
    saveToFirebase('entries', this.entries);
}

// Replace your existing saveBills() with this:
function saveBillsWithSync() {
    localStorage.setItem('financeBills', JSON.stringify(this.bills));
    saveToFirebase('bills', this.bills);
}

// Replace your existing saveSpending() with this:
function saveSpendingWithSync() {
    localStorage.setItem('financeSpending', JSON.stringify(this.spending));
    saveToFirebase('spending', this.spending);
}

// Replace your existing saveSettings() with this:
function saveSettingsWithSync() {
    localStorage.setItem('financeSettings', JSON.stringify(this.settings));
    saveToFirebase('settings', this.settings);
}

// ============================================
// ENHANCED LOAD METHODS (with Firebase sync)
// ============================================

// Add this new method to sync from Firebase on startup
async function syncFromFirebase() {
    console.log('🔄 Syncing from Firebase...');

    // Load all data types
    const firebaseEntries = await loadFromFirebase('entries');
    const firebaseBills = await loadFromFirebase('bills');
    const firebaseSpending = await loadFromFirebase('spending');
    const firebaseSettings = await loadFromFirebase('settings');

    // Merge with local data (use whichever is newer/longer)
    if (firebaseEntries && firebaseEntries.length > this.entries.length) {
        this.entries = firebaseEntries;
        localStorage.setItem('financeEntries', JSON.stringify(this.entries));
    }

    if (firebaseBills && firebaseBills.length > this.bills.length) {
        this.bills = firebaseBills;
        localStorage.setItem('financeBills', JSON.stringify(this.bills));
    }

    if (firebaseSpending && firebaseSpending.length > this.spending.length) {
        this.spending = firebaseSpending;
        localStorage.setItem('financeSpending', JSON.stringify(this.spending));
    }

    if (firebaseSettings) {
        this.settings = firebaseSettings;
        localStorage.setItem('financeSettings', JSON.stringify(this.settings));
    }

    // Re-render with synced data
    this.render();
    console.log('✅ Sync complete!');
}

// ============================================
// REAL-TIME LISTENERS (optional but cool)
// ============================================

// Add this to enable real-time updates from other devices
function setupRealtimeSync() {
    // Listen for entries updates
    listenToFirebase('entries', (data) => {
        this.entries = data;
        localStorage.setItem('financeEntries', JSON.stringify(data));
        this.render();
    });

    // Listen for bills updates
    listenToFirebase('bills', (data) => {
        this.bills = data;
        localStorage.setItem('financeBills', JSON.stringify(data));
        this.render();
    });

    // Listen for spending updates
    listenToFirebase('spending', (data) => {
        this.spending = data;
        localStorage.setItem('financeSpending', JSON.stringify(data));
        this.render();
    });

    // Listen for settings updates
    listenToFirebase('settings', (data) => {
        this.settings = data;
        localStorage.setItem('financeSettings', JSON.stringify(data));
        this.render();
    });
}

// ============================================
// INSTRUCTIONS TO INTEGRATE
// ============================================

/*
TO ADD FIREBASE TO YOUR APP.JS:

1. At the TOP of app.js, add:
   import './firebase-sync.js';

2. In your FinanceTracker class, REPLACE these methods:
   - saveEntries() → use saveEntriesWithSync()
   - saveBills() → use saveBillsWithSync()
   - saveSpending() → use saveSpendingWithSync()
   - saveSettings() → use saveSettingsWithSync()

3. ADD this new method to your class:
   syncFromFirebase() { ... } (copy from above)

4. In your constructor or init(), ADD:
   this.syncFromFirebase();
   this.setupRealtimeSync(); // optional

5. In ALL your HTML files, change:
   <script src="app.js"></script>
   TO:
   <script type="module" src="app.js"></script>

THAT'S IT! Your app now syncs to Firebase automatically.
*/

export {
    saveEntriesWithSync,
    saveBillsWithSync,
    saveSpendingWithSync,
    saveSettingsWithSync,
    syncFromFirebase,
    setupRealtimeSync
};
