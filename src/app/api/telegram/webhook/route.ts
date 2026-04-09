import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { answerCallbackQuery, updateTelegramMessage, sendTelegramMessage } from '@/lib/telegram';
import { markAsPostedEdge, updateContentEdge } from '@/lib/content-edge';
import { getSettingsEdge } from '@/lib/settings-edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('--- TELEGRAM WEBHOOK INCOMING ---');
    console.log('Body:', JSON.stringify(body));

    if (body.callback_query) {
      const callbackQueryId = body.callback_query.id;
      const callbackData = body.callback_query.data;
      const message = body.callback_query.message;
      const chatId = message.chat.id.toString();
      const messageId = message.message_id;

      // 1. NGẮT VÒNG XOAY TRÊN TELEGRAM NGAY LẬP TỨC
      
      const parts = callbackData.split(':');
      const action = parts[0];
      const itemId = parts[1];
      const userIdFromCallback = parts[2] || 'app_settings';
      
      // If the callback provided 'anon', treat it as 'app_settings' for lookup
      const effectiveUserId = userIdFromCallback === 'anon' ? 'app_settings' : userIdFromCallback;

      console.log(`Processing action: ${action} for item: ${itemId} (User: ${effectiveUserId})`);

      const settings = await getSettingsEdge(effectiveUserId);
      const token = settings.telegramToken;

      await answerCallbackQuery(callbackQueryId, "⌛ Đang xử lý...", token);

      if (action === 'confirm_posted') {
        console.log(`Processing confirmation (Edge) for item: ${itemId} by user: ${effectiveUserId}`);
        
        try {
          const result = await markAsPostedEdge(itemId);
          if (result) {
            // 2. Cập nhật tin nhắn để hiện trạng thái
            await updateTelegramMessage(chatId, messageId, 
              `${message.text}\n\n✅ <b>TRẠNG THÁI: ĐÃ ĐĂNG BÀI</b>`,
              token
            );

            // 3. Gửi tin nhắn thông báo thành công mới
            await sendTelegramMessage(chatId, `🎉 <b>Thành công:</b> Bài viết "${result.title}" đã được xác nhận đăng xong!`, undefined, token);
          } else {
            throw new Error("Không tìm thấy bài viết hoặc cập nhật thất bại.");
          }
        } catch (dbErr: any) {
          console.error('Edge DB error in confirm_posted:', dbErr);
          await sendTelegramMessage(chatId, `❌ <b>Lỗi hệ thống (Edge):</b> ${dbErr.message}`, undefined, token);
        }
      }

      if (action === 'remind_later') {
        const newTime = Date.now() + 5 * 60 * 1000;
        console.log(`Processing delay (Edge) for item: ${itemId} by user: ${effectiveUserId}`);

        try {
          const updated = await updateContentEdge(itemId, { scheduledAt: newTime });
          if (updated) {
            // 1. Cập nhật tin nhắn
            await updateTelegramMessage(chatId, messageId, 
              `${message.text}\n\n⏰ <b>TRẠNG THÁI: SẼ NHẮC LẠI SAU 5 PHÚT</b>`,
              token
            );

            // 2. Thông báo thời gian nhắc lại mới
            const timeStr = new Date(newTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            await sendTelegramMessage(chatId, `⏰ <b>Đã dời lịch:</b> Bot sẽ nhắc lại vào lúc ${timeStr}.`, undefined, token);
          }
        } catch (dbErr: any) {
          console.error('Edge DB error in remind_later:', dbErr);
          await sendTelegramMessage(chatId, `❌ <b>Lỗi hệ thống (Edge):</b> ${dbErr.message}`, undefined, token);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook critical error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
