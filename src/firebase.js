import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAktv5iiqO2GUiWTje_GGCwijiz4atD0SA",
  authDomain: "habit-ai-tracker-760c1.firebaseapp.com",
  projectId: "habit-ai-tracker-760c1",
  storageBucket: "habit-ai-tracker-760c1.firebasestorage.app",
  messagingSenderId: "409486682597",
  appId: "1:409486682597:web:6841a3df9c08c2b0d6670c",
  measurementId: "G-RMC9TED707",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);