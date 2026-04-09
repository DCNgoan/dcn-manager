import { doc, getDoc } from "firebase/firestore/lite";
import { db } from "./firebase-edge";

export interface AppSettings {
  telegramToken?: string;
  telegramChatId?: string;
  // Others omitted for brevity in edge context
}

const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'app_settings';

export const getSettingsEdge = async (): Promise<AppSettings> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
  } catch (error) {
    console.error("Error fetching settings from Firebase (Edge):", error);
  }
  return {};
};
