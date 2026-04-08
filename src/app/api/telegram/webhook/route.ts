import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { answerCallbackQuery, updateTelegramMessage, sendTelegramMessage } from '@/lib/telegram';
import { markAsPosted, updateContent, getContent } from '@/lib/content';
import { getSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('--- TELEGRAM WEBHOOK INCOMING ---');
    console.log('Body:', JSON.stringify(body, null, 2));

    const settings = await getSettings();
    const token = settings.telegramToken;
    const adminChatId = settings.telegramChatId;
    
    if (body.callback_query) {
      const callbackQueryId = body.callback_query.id;
      const callbackData = body.callback_query.data;
      const message = body.callback_query.message;
      const chatId = message.chat.id.toString();
      const messageId = message.message_id;

      if (callbackData.startsWith('confirm_posted:')) {
        const itemId = callbackData.split(':')[1];
        console.log(`Processing confirmation for item: ${itemId}`);
        
        try {
          const result = await markAsPosted(itemId);
          if (result) {
            await answerCallbackQuery(callbackQueryId, "✅ Đã xác nhận bài đăng thành công!", token);
            
            // 1. Edit current message to show status
            await updateTelegramMessage(chatId, messageId, 
              `${message.text}\n\n✅ <b>TRẠNG THÁI: ĐÃ ĐĂNG BÀI</b>`,
              token
            );

            // 2. Send a NEW notification message as requested
            await sendTelegramMessage(chatId, `🎉 <b>Thông báo:</b> Bài viết "${result.title}" đã được xác nhận đăng thành công vào hệ thống!`, undefined, token);
            
            console.log(`Successfully confirmed and notified for ${itemId}`);
          }
        } catch (dbErr: any) {
          console.error('Database error in confirm_posted:', dbErr);
          await answerCallbackQuery(callbackQueryId, "❌ Lỗi: " + dbErr.message, token);
          await sendTelegramMessage(chatId, `❌ <b>Lỗi hệ thống:</b> Không thể cập nhật trạng thái đã đăng cho bài viết này.`, undefined, token);
        }
      }

      if (callbackData.startsWith('remind_later:')) {
        const itemId = callbackData.split(':')[1];
        const newTime = Date.now() + 5 * 60 * 1000;
        console.log(`Processing delay for item: ${itemId} to ${new Date(newTime).toLocaleTimeString()}`);

        try {
          const updated = await updateContent(itemId, { scheduledAt: newTime });
          if (updated) {
            await answerCallbackQuery(callbackQueryId, "⏰ Sẽ nhắc lại sau 5 phút!", token);
            
            // 1. Edit current message
            await updateTelegramMessage(chatId, messageId, 
              `${message.text}\n\n⏰ <b>TRẠNG THÁI: ĐÃ DỜI LỊCH NHẮC SAU 5 PHÚT</b>`,
              token
            );

            // 2. Send a NEW confirmation message
            await sendTelegramMessage(chatId, `⏰ <b>Đã đặt lại lịch:</b> Hệ thống sẽ nhắc lại bạn vào lúc ${new Date(newTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`, undefined, token);
            
            console.log(`Successfully rescheduled for ${itemId}`);
          }
        } catch (dbErr: any) {
          console.error('Database error in remind_later:', dbErr);
          await answerCallbackQuery(callbackQueryId, "❌ Lỗi: " + dbErr.message, token);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook critical error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
