import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface AppSettings {
  geminiKey?: string;
  openaiKey?: string;
  groqKey?: string;
  facebookToken?: string;
  tiktokToken?: string;
  threadsToken?: string;
  telegramToken?: string;
  telegramChatId?: string;
  autoDeleteDays?: number;
}

const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'app_settings';

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
  } catch (error) {
    console.error("Error fetching settings from Firebase:", error);
  }
  return {};
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const savePromise = (async () => {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    await setDoc(docRef, settings, { merge: true });
  })();

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Kết nối Firebase quá hạn (Timeout). Vui lòng kiểm tra lại Rules trong Firebase Console hoặc kết nối mạng.")), 10000)
  );

  try {
    await Promise.race([savePromise, timeoutPromise]);
  } catch (error) {
    console.error("Error saving settings to Firebase:", error);
    throw error;
  }
};
