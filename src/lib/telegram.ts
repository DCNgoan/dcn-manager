const DEFAULT_TOKEN = '8249291269:AAGnxpauMw8hQf7q9FJXTiZi_kJolLs87HI';

function getApiBase(token?: string) {
  return `https://api.telegram.org/bot${token || DEFAULT_TOKEN}`;
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any, token?: string) {
  try {
    const response = await fetch(`${getApiBase(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return null;
  }
}

export async function sendPostReminder(chatId: string, item: { id: string; title: string; body: string; platform: string; mediaUrl?: string }, token?: string) {
  const message = `
<b>🔔 NHẮC LỊCH ĐĂNG BÀI (Còn 15 phút)</b>

<b>Nền tảng:</b> #${item.platform.toUpperCase()}
<b>Tiêu đề:</b> ${item.title}

<b>Nội dung:</b>
<code>${item.body}</code>

${item.mediaUrl ? `<b>🔗 Media:</b> <a href="${item.mediaUrl}">Mở link Drive</a>` : '<i>(Không có file đính kèm)</i>'}

<i>Hãy chuẩn bị sẵn sàng để đăng bài nhé!</i>
  `;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Xác nhận đã đăng', callback_data: `confirm_posted:${item.id}` },
      ],
      [
        { text: '⏰ Nhắc lại sau 5 phút', callback_data: `remind_later:${item.id}` }
      ]
    ]
  };

  return sendTelegramMessage(chatId, message, replyMarkup, token);
}

export async function answerCallbackQuery(callbackQueryId: string, text: string, token?: string) {
  try {
    await fetch(`${getApiBase(token)}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false
      }),
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

export async function updateTelegramMessage(chatId: string, messageId: number, text: string, token?: string) {
  try {
    const response = await fetch(`${getApiBase(token)}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML'
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating Telegram message:', error);
    return null;
  }
}
