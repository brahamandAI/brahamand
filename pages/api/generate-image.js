import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Internal prompt optimizer: rewrites user input into a rich DALL-E 3 prompt
async function optimizePrompt(userPrompt, style) {
  const isNatural = style === 'natural';

  const systemPrompt = isNatural
    ? `You are an expert DALL-E 3 prompt engineer specializing in photorealistic image generation.

Your goal is to transform a user's idea into a prompt that produces images indistinguishable from a real photograph — exactly like ChatGPT's DALL-E output.

Rules for NATURAL / PHOTOREALISTIC mode:
- Always describe it as a PHOTOGRAPH taken with a real camera (e.g., "A photo of...", "Photograph of...")
- Specify camera and lens details: DSLR, Canon EOS R5, 85mm portrait lens, f/1.8 aperture, etc.
- Use real-world lighting: natural daylight, soft window light, warm restaurant ambient light, etc.
- Describe people with realistic physical details (age, build, ethnicity, clothing, expression)
- Describe the scene as it would genuinely look in real life — no surreal or fantasy elements
- Avoid any mention of "digital art", "painting", "illustration", "3D render", "hyper-real", "cinematic"
- Add: "photorealistic, RAW photo, 8K resolution, sharp focus, natural colors, no filters"
- Output ONLY the prompt text, no explanations, no quotes, no preamble.
- Keep under 400 words.`
    : `You are an expert DALL-E 3 prompt engineer specializing in vivid, dramatic AI art.

Rules for VIVID / ARTISTIC mode:
- Describe the main subject with rich visual detail
- Add dramatic lighting (golden hour, neon glow, rim lighting, cinematic)
- Specify artistic style (concept art, digital painting, hyper-detailed illustration, etc.)
- Include mood and atmosphere (epic, mysterious, ethereal, powerful)
- Add composition details (wide shot, close-up, rule of thirds, bokeh background)
- Use: "ultra-detailed, award-winning digital art, vibrant colors, highly detailed"
- Output ONLY the prompt text, no explanations, no quotes, no preamble.
- Keep under 400 words.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Optimize this for DALL-E 3: ${userPrompt}` }
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  return completion.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Default to 'natural' to match ChatGPT-style photorealistic output
    const { prompt, style = 'natural', size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate size option
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    const imageSize = validSizes.includes(size) ? size : '1024x1024';

    // Validate style option
    const imageStyle = style === 'natural' ? 'natural' : 'vivid';

    // Step 1: Internally optimize the prompt using GPT-4o
    const optimizedPrompt = await optimizePrompt(prompt, imageStyle);

    // Step 2: Generate image using DALL-E 3 with optimized settings
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: optimizedPrompt,
      n: 1,
      size: imageSize,
      quality: 'hd',
      style: imageStyle,
    });

    const imageData = response.data[0];

    return res.status(200).json({
      success: true,
      imageUrl: imageData.url,
      optimizedPrompt,
      revisedPrompt: imageData.revised_prompt || optimizedPrompt,
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
    });
  }
} 