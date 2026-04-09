import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { getSettings } from '@/lib/settings';
import { ADMIN_EMAIL } from '@/lib/users';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { user } = await request.json();
    
    // Find Admin's UID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", ADMIN_EMAIL));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn("Admin user not found in Firestore.");
      return NextResponse.json({ success: false, error: 'Admin not found' });
    }

    const adminUid = querySnapshot.docs[0].id;
    let settings = await getSettings(adminUid);
    
    // Fallback to legacy global settings if admin hasn't set their own yet
    if (!settings.telegramToken || !settings.telegramChatId) {
      const legacyDoc = await getDoc(doc(db, 'settings', 'app_settings'));
      if (legacyDoc.exists()) {
        const legacyData = legacyDoc.data();
        settings = { ...settings, ...legacyData };
      }
    }
    
    const token = settings.telegramToken;
    const chatId = settings.telegramChatId;

    if (!token || !chatId) {
      console.warn("Telegram notification skipped: Token or ChatID missing in settings.");
      return NextResponse.json({ success: false, error: 'Settings missing' });
    }

    const message = `🔔 *Thông báo: Thành viên mới!*\n\n` +
                    `👤 Tên: ${user.displayName}\n` +
                    `📧 Email: ${user.email}\n` +
                    `🆔 UID: \`${user.uid}\`\n\n` +
                    `⚠️ Trạng thái: *Đang chờ duyệt*\n\n` +
                    `👉 Truy cập trang Admin để phê duyệt.`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    return NextResponse.json({ success: result.ok });
  } catch (error: any) {
    console.error("Signup notification error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
