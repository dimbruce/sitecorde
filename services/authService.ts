import { auth } from "./firebaseService";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// sign in with Google
export async function signIn() {
  // Instantiate provider just-in-time to avoid premature auth initialization
  const googleProvider = new GoogleAuthProvider();
  // Persistence is now handled in getAuth().
  // Using signInWithPopup to be compatible with iframe environments.
  await signInWithPopup(auth, googleProvider);
}

// sign out
export async function logOut() {
  await signOut(auth);
}
