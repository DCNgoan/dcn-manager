import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const { chatId, token } = await request.json();
    
    if (!chatId) {
      return NextResponse.json({ success: false, error: 'Missing Chat ID' }, { status: 400 });
    }

    const message = "<b>✅ Kết nối thành công!</b>\n\nĐây là tin nhắn thử nghiệm từ hệ thống <b>DCN Content Manager</b>. Bot của bạn đã sẵn sàng để gửi thông báo nhắc lịch đăng bài.";
    
    const result = await sendTelegramMessage(chatId, message, undefined, token);

    if (result && result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: result?.description || 'Failed to send message' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
