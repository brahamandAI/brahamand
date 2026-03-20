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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a world-class DALL-E 3 prompt engineer specializing in photorealistic photography prompts.

Transform the user's idea into a highly detailed prompt that produces a photorealistic image — like a real photograph, exactly as ChatGPT generates images.

Your enhanced prompt must:
- Start with "A photo of..." or "Photograph of..." to anchor DALL-E 3 in photography mode
- Describe subjects with real-world physical detail (age, ethnicity, clothing, expression, posture)
- Specify camera settings: DSLR, 50mm or 85mm lens, shallow depth of field, f/2.8, etc.
- Use natural, real-world lighting (warm restaurant ambient, natural window light, soft diffused daylight)
- Describe environment in realistic detail (what tables look like, background activity, props)
- Include: "photorealistic, RAW photo, high resolution, sharp focus, natural colors"
- Avoid: painting, illustration, 3D render, concept art, digital art, surreal, cinematic grading
- If the user explicitly asks for art/illustration/animation, then use that style instead

Output ONLY the enhanced prompt — no explanations, no quotes, no preamble.`
        },
        {
          role: 'user',
          content: `Enhance this image prompt for DALL-E 3: "${prompt}"`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
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