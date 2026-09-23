import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBe8XYLLixwLpHveID4NPckD1oQEnUL_j8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studyassistant-26fb6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studyassistant-26fb6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studyassistant-26fb6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1047865212331",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1047865212331:web:37cd51aa786bc05cee66ee",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QF9RTVB2K5",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable local persistence so session survives refreshes
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Firebase persistence error:", err);
});

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
