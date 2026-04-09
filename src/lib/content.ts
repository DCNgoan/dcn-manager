import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query, 
  orderBy,
  where 
} from "firebase/firestore";
import { db } from "./firebase";
import { Platform } from './accounts';

export type ContentStatus = 'draft' | 'scheduled' | 'posted';

export interface ContentItem {
  id: string;
  userId: string; // Linked to User UID
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

export const getContent = async (userId?: string): Promise<ContentItem[]> => {
  try {
    let q;
    if (userId) {
      // Temporarily removed orderBy to fix missing index error
      q = query(
        collection(db, COLLECTION_NAME), 
        where("userId", "==", userId)
      );
    } else {
      q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    }
    
    const fetchPromise = getDocs(q);
    const timeoutPromise = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: Firebase không phản hồi khi lấy dữ liệu.")), 15000)
    );

    const querySnapshot = await Promise.race([fetchPromise, timeoutPromise]);
    const results = querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as ContentItem[];

    // Sort manually in memory to avoid needing index for userId + createdAt
    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error: any) {
    console.error("Error fetching content:", error);
    if (error.message.includes("permissions")) {
      throw new Error("Bạn không có quyền truy cập dữ liệu nội dung. Hãy kiểm tra Firestore Rules.");
    }
    throw error;
  }
};

export const getContentItem = async (id: string): Promise<ContentItem | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ContentItem;
    }
  } catch (error) {
    console.error("Error fetching single content item:", error);
  }
  return null;
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
