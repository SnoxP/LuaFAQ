import { initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, updateDoc, query, orderBy, limit, startAfter, endBefore, limitToLast, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

const firestoreDatabaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const storage = getStorage(app);

export { OAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, updateDoc, ref, uploadBytesResumable, getDownloadURL, query, orderBy, limit, startAfter, endBefore, limitToLast, increment };
