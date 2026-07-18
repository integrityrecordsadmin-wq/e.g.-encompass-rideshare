// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIKpWTG5J59YVwczLadUWaxP7JBx5k2Xg",
  authDomain: "encompass-3c913.firebaseapp.com",
  projectId: "encompass-3c913",
  storageBucket: "encompass-3c913.firebasestorage.app",
  messagingSenderId: "775675339694",
  appId: "1:775675339694:web:8b9197504f5b517aba5e3f",
  measurementId: "G-DPXD8S8CV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
