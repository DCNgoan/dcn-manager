import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { sendPostReminder } from '@/lib/telegram';
import { getSettings } from '@/lib/settings';

export async function POST(request: Request) {
  try {
    const { chatId, item } = await request.json();
    const settings = await getSettings();
    const token = settings.telegramToken;
    
    if (!chatId || !item) {
      return NextResponse.json({ success: false, error: 'Missing data' });
    }

    const result = await sendPostReminder(chatId, item, token);

    if (result && result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: result?.description || 'Failed to send reminder' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
