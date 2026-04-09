import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export type UserStatus = 'active' | 'pending' | 'rejected';
export type UserRole = 'admin' | 'user';

export interface UserMetadata {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: UserStatus;
  role: UserRole;
  createdAt: number;
}

const COLLECTION_NAME = 'users';

export const ADMIN_EMAIL = 'duongngoan2646@gmail.com';

export const getUserMetadata = async (uid: string): Promise<UserMetadata | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserMetadata;
    }
  } catch (error) {
    console.error("Error fetching user metadata:", error);
  }
  return null;
};

export const initUserMetadata = async (user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null }): Promise<UserMetadata> => {
  const isAdmin = user.email === ADMIN_EMAIL;
  
  const existing = await getUserMetadata(user.uid);
  if (existing) return existing;

  const newMetadata: UserMetadata = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'User',
    photoURL: user.photoURL || undefined,
    status: isAdmin ? 'active' : 'pending',
    role: isAdmin ? 'admin' : 'user',
    createdAt: Date.now()
  };

  await setDoc(doc(db, COLLECTION_NAME, user.uid), newMetadata);
  
  // Trigger notification if new user is pending
  if (!isAdmin) {
    try {
      console.log("Sending registration notification for new user:", newMetadata.email);
      const res = await fetch('/api/telegram/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newMetadata })
      });
      const resData = await res.json();
      console.log("Notification result:", resData);
    } catch (e) {
      console.error("Notification failed", e);
    }
  }

  return newMetadata;
};

export const getAllUsers = async (): Promise<UserMetadata[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserMetadata);
};

export const updateUserStatus = async (uid: string, status: UserStatus): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(docRef, { status });
};
