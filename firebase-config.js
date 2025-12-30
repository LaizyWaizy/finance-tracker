// Firebase Configuration and Integration
// This file handles all Firebase operations for cross-device sync

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ✅ Firebase Configuration - Auto-configured for finance-tracker-269e2
const firebaseConfig = {
    apiKey: "AIzaSyCYzzX5A5QYW3nAVx5XvDoiPduqyvgOFrg",
    authDomain: "finance-tracker-269e2.firebaseapp.com",
    projectId: "finance-tracker-269e2",
    storageBucket: "finance-tracker-269e2.firebasestorage.app",
    messagingSenderId: "1098937077718",
    appId: "1:1098937077718:web:57973897d3b6b859bc9e77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Auto sign-in anonymously (no login required)
let currentUser = null;

signInAnonymously(auth)
    .then(() => {
        console.log('✅ Firebase connected');
    })
    .catch((error) => {
        console.error('Firebase auth error:', error);
    });

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.uid);

        // Trigger initial sync when user is ready
        if (window.tracker) {
            window.tracker.syncFromFirebase();
        }
    }
});

// ============================================
// FIREBASE SYNC FUNCTIONS
// ============================================

// Save data to Firebase
async function saveToFirebase(dataType, data) {
    if (!currentUser) {
        console.log('⏳ Waiting for auth...');
        return;
    }

    try {
        await setDoc(doc(db, 'users', currentUser.uid, 'data', dataType), {
            data: data,
            lastUpdated: new Date().toISOString()
        });
        console.log(`✅ Saved ${dataType} to Firebase`);
    } catch (error) {
        console.error(`❌ Error saving ${dataType}:`, error);
    }
}

// Load data from Firebase
async function loadFromFirebase(dataType) {
    if (!currentUser) {
        console.log('⏳ Waiting for auth...');
        return null;
    }

    try {
        const docRef = doc(db, 'users', currentUser.uid, 'data', dataType);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`✅ Loaded ${dataType} from Firebase`);
            return docSnap.data().data;
        } else {
            console.log(`ℹ️ No ${dataType} found in Firebase`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error loading ${dataType}:`, error);
        return null;
    }
}

// Listen for real-time updates
function listenToFirebase(dataType, callback) {
    if (!currentUser) {
        console.log('⏳ Waiting for auth...');
        return;
    }

    const docRef = doc(db, 'users', currentUser.uid, 'data', dataType);

    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            console.log(`🔄 ${dataType} updated from another device`);
            callback(doc.data().data);
        }
    });
}

// Export functions
export {
    db,
    auth,
    currentUser,
    saveToFirebase,
    loadFromFirebase,
    listenToFirebase
};
