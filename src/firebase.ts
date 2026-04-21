import { initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, updateDoc, query, orderBy, limit, startAfter, endBefore, limitToLast, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

export { OAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, updateDoc, ref, uploadBytesResumable, getDownloadURL, query, orderBy, limit, startAfter, endBefore, limitToLast, increment };
