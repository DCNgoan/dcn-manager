import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDO_burLeKljJ1KImQyfycC_541o407yiE",
  authDomain: "dcn-manager-fa719.firebaseapp.com",
  projectId: "dcn-manager-fa719",
  storageBucket: "dcn-manager-fa719.firebasestorage.app",
  messagingSenderId: "31786525733",
  appId: "1:31786525733:web:900781d8623b7f51208bcc",
  measurementId: "G-9SF0SEPDZ2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
