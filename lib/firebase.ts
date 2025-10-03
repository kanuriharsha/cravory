import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyDR1J7E-JJiH8EOwz946-vT7ProkpFSk_k",
  authDomain: "cravory-42a4d.firebaseapp.com",
  projectId: "cravory-42a4d",
  storageBucket: "cravory-42a4d.appspot.com",
  messagingSenderId: "1018421183077",
  appId: "1:1018421183077:web:38dfd9f15884f9df157c8c",
  measurementId: "G-T9MB857GP4"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };

