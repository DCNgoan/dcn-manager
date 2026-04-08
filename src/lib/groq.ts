import { getSettings } from './settings';

export const generateGroqContent = async (prompt: string, platform: string): Promise<string> => {
  const { groqKey } = await getSettings();
  if (!groqKey) {
    throw new Error('Groq API Key không tìm thấy. Vui lòng thêm trong phần Cài đặt.');
  }

  // Sử dụng endpoint tương thích OpenAI của Groq
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      // Llama 3.3 70B là model mạnh nhất hiện tại trên Groq
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Bạn là một chuyên gia sáng tạo nội dung MMO cho nền tảng ${platform}. 
          Hãy tạo một bài viết thu hút bằng TIẾNG VIỆT.
          Yêu cầu:
          1. Sử dụng câu tiêu đề (hook) gây tò mò ở ngay đầu bài.
          2. Sử dụng các emoji phù hợp.
          3. Thêm 3-5 hashtag đang hot.
          4. Đảm bảo độ dài phù hợp với giới hạn của ${platform}.
          CHỈ TRẢ VỀ nội dung bài viết, không thêm lời dẫn giải.`
        },
        {
          role: "user",
          content: `Viết bài về chủ đề: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Không thể tạo nội dung từ Groq AI');
  }

  return data.choices?.[0]?.message?.content || '';
};
