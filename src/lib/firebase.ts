import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDO_burLeKljJ1KImQyfycC_541o407yiE",
  authDomain: "dcn-manager-fa719.firebaseapp.com",
  projectId: "dcn-manager-fa719",
  storageBucket: "dcn-manager-fa719.firebasestorage.app",
  messagingSenderId: "31786525733",
  appId: "1:31786525733:web:900781d8623b7f51208bcc",
  measurementId: "G-9SF0SEPDZ2"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
