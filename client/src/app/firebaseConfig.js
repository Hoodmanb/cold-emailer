// firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // ✅ Add this

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYchfC9QgYwf1ST17TSFRma4a9KtDlGn0",
    authDomain: "cold-emailer-fe9d0.firebaseapp.com",
    projectId: "cold-emailer-fe9d0",
    storageBucket: "cold-emailer-fe9d0.firebasestorage.app",
    messagingSenderId: "269089628859",
    appId: "1:269089628859:web:e77d366e3d8a2f12063f9e",
    measurementId: "G-89WWQQHFGW"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null; // only use analytics on client

export { app, auth, analytics };
