import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create or update user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || '',
        status: 'Available',
        isOnline: true,
        lastSeen: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const logOut = async () => {
  if (auth.currentUser) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      isOnline: false,
      lastSeen: serverTimestamp()
    });
  }
  await signOut(auth);
};

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };
