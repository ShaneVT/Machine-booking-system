import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD_2LgarDjGYHvFFzkg3IhZTfMYZ-ZGabA",
  authDomain: "machine-booking-system.firebaseapp.com",
  projectId: "machine-booking-system",
  storageBucket: "machine-booking-system.firebasestorage.app",
  messagingSenderId: "311087636032",
  appId: "1:311087636032:web:21f9f43c0b9aa0271bc9a5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const machinesCol = collection(db, 'machines');
export const bookingsCol = collection(db, 'bookings');
export const auditCol = collection(db, 'audit');

export const fs = {
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
};
