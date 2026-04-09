import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore/lite";
import { db } from "./firebase-edge";
import { Platform } from './accounts';

export type ContentStatus = 'draft' | 'scheduled' | 'posted';

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  platform: Platform;
  accountId: string;
  mediaUrl?: string;
  scheduledAt?: number;
  status: ContentStatus;
  createdAt: number;
  postedAt?: number;
}

const COLLECTION_NAME = 'content';

export const getContentEdge = async (): Promise<ContentItem[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ContentItem[];
  } catch (error) {
    console.error("Error fetching content from Firebase (Edge):", error);
    return [];
  }
};

export const updateContentEdge = async (id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
    return { id, ...updates } as any;
  } catch (error) {
    console.error("Error updating content in Firebase (Edge):", error);
    return null;
  }
};

export const markAsPostedEdge = async (id: string): Promise<ContentItem | null> => {
  return updateContentEdge(id, { 
    status: 'posted', 
    postedAt: Date.now() 
  });
};
