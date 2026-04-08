import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const platform = searchParams.get('platform');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    let followers = '0';
    let likes = '0';

    if (platform === 'tiktok') {
      // Logic for TikTok: Universal Data Rehydration JSON
      const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          const stats = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
          if (stats) {
            followers = formatNumber(stats.followerCount);
            likes = formatNumber(stats.heartCount);
          }
        } catch (e) {
          console.error('Error parsing TikTok JSON', e);
        }
      }
    } else if (platform === 'facebook' || platform === 'threads' || platform === 'other') {
      // Logic for FB/Threads: Open Graph Description
      // Example: "1.2M Followers, 500 Following, 15 Posts - See Instagram photos and videos from..."
      const ogMatch = html.match(/<meta property="og:description" content="([\s\S]*?)"\s?\/?>/i) || 
                      html.match(/<meta name="description" content="([\s\S]*?)"\s?\/?>/i);
      
      if (ogMatch && ogMatch[1]) {
        const desc = ogMatch[1];
        // Regex to extract followers
        const followersMatch = desc.match(/([\d\.,kKmM]+)\s?(Followers|người theo dõi)/i);
        if (followersMatch) followers = followersMatch[1];
        
        const likesMatch = desc.match(/([\d\.,kKmM]+)\s?(Likes|lượt thích)/i);
        if (likesMatch) likes = likesMatch[1];
      }
    }

    return NextResponse.json({ followers, likes, lastSync: Date.now() });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
