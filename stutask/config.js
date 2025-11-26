import { initializeApp } from "firebase/app";
import { getAuth,
         signOut,
         onAuthStateChanged,
         GoogleAuthProvider } from "firebase/auth";
import { getFirestore,
         collection,
         addDoc,
         serverTimestamp,
         onSnapshot,
         query,
         where,
         orderBy,
         doc,
         updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAozLg8ROnH5CaiuUWBoOgkxb2hnLCCUyc",
  authDomain: "stutask-binus.firebaseapp.com",
  projectId: "stutask-binus",
  storageBucket: "stutask-binus.firebasestorage.app",
  messagingSenderId: "167704916535",
  appId: "1:167704916535:web:b71a51f7bf4a7b16b1c5b2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

