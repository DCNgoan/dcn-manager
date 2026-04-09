import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "./firebase";
import { Platform } from './accounts';

export type ContentStatus = 'draft' | 'scheduled' | 'posted';

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  platform: Platform;
  accountId: string; // Link to Account ID
  mediaUrl?: string; // Drive Link
  scheduledAt?: number;
  status: ContentStatus;
  createdAt: number;
  postedAt?: number;
}

const COLLECTION_NAME = 'content';

export const getContent = async (): Promise<ContentItem[]> => {
  const fetchPromise = (async () => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ContentItem[];
  })();

  const timeoutPromise = new Promise<ContentItem[]>((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi lấy dữ liệu.")), 15000)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message.includes("Timeout")) {
      console.warn("[Firebase] GetContent timed out.");
    } else {
      console.error("Error fetching content from Firebase:", error);
    }
    return [];
  }
};

export const saveContent = async (item: Omit<ContentItem, 'id' | 'createdAt'>): Promise<ContentItem> => {
  const newItemData = {
    ...item,
    createdAt: Date.now(),
  };

  const savePromise = (async () => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newItemData);
    return {
      id: docRef.id,
      ...newItemData
    } as ContentItem;
  })();

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi thêm nội dung.")), 10000)
  );

  try {
    return await Promise.race([savePromise, timeoutPromise]) as ContentItem;
  } catch (error) {
    console.error("Error adding content to Firebase:", error);
    throw error;
  }
};

export const updateContent = async (id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updatePromise = updateDoc(docRef, updates);
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi cập nhật nội dung.")), 10000)
  );

  try {
    await Promise.race([updatePromise, timeoutPromise]);
    return { id, ...updates } as any;
  } catch (error) {
    console.error("Error updating content in Firebase:", error);
    return null;
  }
};

export const deleteContent = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const deletePromise = deleteDoc(docRef);
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi xóa nội dung.")), 10000)
  );

  try {
    await Promise.race([deletePromise, timeoutPromise]);
  } catch (error) {
    console.error("Error deleting content from Firebase:", error);
    throw error;
  }
};

export const markAsPosted = async (id: string): Promise<ContentItem | null> => {
  return updateContent(id, { 
    status: 'posted', 
    postedAt: Date.now() 
  });
};
