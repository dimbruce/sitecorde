
import firebase from 'firebase/compat/app';
import { getAuth } from "./firebaseService";

// sign in with Google
export async function signIn() {
  const auth = await getAuth();
  // Instantiate provider just-in-time to avoid premature auth initialization
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  // Persistence is now handled in getAuth().
  // Using signInWithPopup to be compatible with iframe environments.
  await auth.signInWithPopup(googleProvider);
}

// sign out
export async function logOut() {
  const auth = await getAuth();
  await auth.signOut();
}
