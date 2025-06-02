import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at crafting detailed, vivid image generation prompts. Your task is to enhance user prompts to create more detailed and visually appealing images. Focus on adding artistic style, lighting, mood, and technical details while maintaining the original intent."
        },
        {
          role: "user",
          content: `Please enhance this image generation prompt while maintaining its core idea: "${prompt}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const enhancedPrompt = completion.choices[0].message.content.replace(/^["']|["']$/g, '');

    return res.status(200).json({
      success: true,
      enhancedPrompt,
    });

  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return res.status(500).json({
      error: 'Failed to enhance prompt',
      message: error.message,
    });
  }
} 