// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyZzX5A5QYm3rAVx5XvDoiPduqyvgOFrg",
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
const provider = new GoogleAuthProvider();

// Enable offline persistence (so it works on your phone in the subway!)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.log("Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.log("Persistence failed: Not supported");
    }
});

export { db, auth, provider, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot, signInWithPopup, signOut, onAuthStateChanged };
