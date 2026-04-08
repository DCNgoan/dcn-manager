import { getSettings } from './settings';

export const generateAIContent = async (prompt: string, platform: string): Promise<string> => {
  const { geminiKey } = await getSettings();
  if (!geminiKey) {
    throw new Error('Gemini API Key not found. Please add it in Settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Bạn là một chuyên gia sáng tạo nội dung MMO cho nền tảng ${platform}. 
          Hãy tạo một bài viết thu hút về chủ đề: ${prompt}. 
          Yêu cầu:
          1. Sử dụng câu tiêu đề (hook) gây tò mò ở ngay đầu bài.
          2. Sử dụng các emoji phù hợp để tăng tính sinh động.
          3. Thêm 3-5 hashtag đang hot.
          4. Đảm bảo độ dài phù hợp với giới hạn của ${platform}.
          5. Toàn bộ nội dung phải bằng TIẾNG VIỆT.
          CHỈ TRẢ VỀ nội dung bài viết, không thêm lời dẫn giải.`
        }]
      }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to generate AI content');
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};
