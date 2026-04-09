import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where 
} from "firebase/firestore";
import { db } from "./firebase";

export type Platform = 'tiktok' | 'facebook' | 'threads' | 'other';

export interface Account {
  id: string;
  userId: string; // Linked to User UID
  name: string;
  platform: Platform;
  status: 'active' | 'warning' | 'banned';
  profileUrl?: string;
  notes?: string;
  createdAt: number;
  followers?: string;
  likes?: string;
  lastSync?: number;
  apiKey?: string;
}

const COLLECTION_NAME = 'accounts';

export const getAccounts = async (userId?: string): Promise<Account[]> => {
  try {
    let q;
    if (userId) {
      // Temporarily removed orderBy to fix missing index error for new users
      q = query(
        collection(db, COLLECTION_NAME), 
        where("userId", "==", userId)
      );
    } else {
      q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    }
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Account[];
    
    // Sort manually in memory for now to avoid index error
    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error; // Throw so UI can alert
  }
};

export const saveAccount = async (account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> => {
  const newAccountData = {
    ...account,
    createdAt: Date.now(),
  };

  const savePromise = (async () => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newAccountData);
    return {
      id: docRef.id,
      ...newAccountData
    } as Account;
  })();

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi thêm tài khoản. Hãy kiểm tra Security Rules.")), 10000)
  );

  try {
    return await Promise.race([savePromise, timeoutPromise]) as Account;
  } catch (error) {
    console.error("Error adding account to Firebase:", error);
    throw error;
  }
};

export const updateAccount = async (id: string, updates: Partial<Account>): Promise<Account | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updatePromise = updateDoc(docRef, updates);
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi cập nhật tài khoản.")), 10000)
  );

  try {
    await Promise.race([updatePromise, timeoutPromise]);
    return { id, ...updates } as any; 
  } catch (error) {
    console.error("Error updating account in Firebase:", error);
    return null;
  }
};

export const deleteAccount = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const deletePromise = deleteDoc(docRef);
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi xóa tài khoản.")), 10000)
  );

  try {
    await Promise.race([deletePromise, timeoutPromise]);
  } catch (error) {
    console.error("Error deleting account from Firebase:", error);
    throw error;
  }
};
