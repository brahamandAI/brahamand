import OpenAI from 'openai';

// Initialize OpenAI client
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

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3", // Using DALL-E 3 for higher quality images
      prompt: prompt,
      n: 1, // Number of images to generate
      size: "1024x1024", // Image size
      quality: "standard",
    });

    // Return the generated image URL
    return res.status(200).json({
      success: true,
      imageUrl: response.data[0].url,
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
    });
  }
} 