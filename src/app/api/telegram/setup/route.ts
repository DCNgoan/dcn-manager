import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { getSettings } from '@/lib/settings';

const DEFAULT_TELEGRAM_TOKEN = '8249291269:AAGnxpauMw8hQf7q9FJXTiZi_kJolLs87HI';

export async function POST(request: Request) {
  try {
    const { webhookUrl, token } = await request.json();
    
    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: 'Missing Webhook URL' }, { status: 400 });
    }

    const apiBase = `https://api.telegram.org/bot${token || DEFAULT_TELEGRAM_TOKEN}`;

    // Clean URL (remove trailing slash if any)
    const cleanUrl = webhookUrl.endsWith('/') ? webhookUrl.slice(0, -1) : webhookUrl;
    const fullWebhookUrl = `${cleanUrl}/api/telegram/webhook`;

    console.log(`Setting webhook to: ${fullWebhookUrl}`);

    const response = await fetch(`${apiBase}/setWebhook?url=${encodeURIComponent(fullWebhookUrl)}`);
    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ success: true, description: result.description });
    } else {
      return NextResponse.json({ success: false, error: result.description || 'Failed to set webhook' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const settings = await getSettings();
    const token = settings.telegramToken || DEFAULT_TELEGRAM_TOKEN;
    const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
