import { doc, getDoc } from "firebase/firestore/lite";
import { db } from "./firebase-edge";

export interface AppSettings {
  telegramToken?: string;
  telegramChatId?: string;
  // Others omitted for brevity in edge context
}

const COLLECTION_NAME = 'settings';
export const getSettingsEdge = async (userId: string = 'app_settings'): Promise<AppSettings> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
  } catch (error) {
    console.error("Error fetching settings from Firebase (Edge):", error);
  }
  return {};
};
