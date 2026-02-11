import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBVC3lzmNdnQPGIbZx9Sg2HOa6B9SXN2fs",
  authDomain: "twilight-d25bb.firebaseapp.com",
  projectId: "twilight-d25bb",
  storageBucket: "twilight-d25bb.firebasestorage.app",
  messagingSenderId: "475915477527",
  appId: "1:475915477527:web:fcb08ef15505dd24c33252",
  measurementId: "G-L9L96K1KVC"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
