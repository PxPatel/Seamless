import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8I6z9YdH5lmDbGQaFOFaYVQuPYH-6r80",
  authDomain: "seamless-dev-142c7.firebaseapp.com",
  projectId: "seamless-dev-142c7",
  storageBucket: "seamless-dev-142c7.appspot.com",
  messagingSenderId: "597488144209",
  appId: "1:597488144209:web:8db1a996ad0137e8174d70"
};

// Initialize Firebase app and services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


