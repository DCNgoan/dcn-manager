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
    // 1. Try User Specific Settings
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const userSnap = await getDoc(userDocRef);
    
    let settings: AppSettings = {};
    if (userSnap.exists()) {
      settings = userSnap.data() as AppSettings;
    }

    // 2. Fallback to app_settings if critical fields are missing
    if (!settings.telegramToken || !settings.telegramChatId) {
      if (userId !== 'app_settings') {
        const globalDocRef = doc(db, COLLECTION_NAME, 'app_settings');
        const globalSnap = await getDoc(globalDocRef);
        if (globalSnap.exists()) {
          const globalData = globalSnap.data() as AppSettings;
          settings = { ...globalData, ...settings }; // User settings override global, but globals fill the gaps
        }
      }
    }
    
    return settings;
  } catch (error) {
    console.error("Error fetching settings from Firebase (Edge):", error);
    return {};
  }
};
