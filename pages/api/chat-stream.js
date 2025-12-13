// API route for streaming chat completion
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, system = "", history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Received streaming chat request:', message.substring(0, 50) + '...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

    // Prepare messages for the API call
    const messages = [];
    
    // Add system message
    if (system) {
      messages.push({ role: 'system', content: system });
    } else {
      // Default system message
      messages.push({ 
        role: 'system', 
        content: `You are ब्रह्मांड AI (Brahmand AI), a highly capable and intelligent assistant designed to provide comprehensive, detailed, and insightful responses.

**Core Principles:**
- Answer queries with precision, clarity, and depth
- Provide structured, well-organized responses
- When uncertain, admit limitations rather than providing inaccurate information
- Use a friendly yet professional tone

**Response Guidelines:**

1. **For Presentation/Slide Requests:**
   - Provide a complete slide-by-slide breakdown
   - For each slide, specify:
     * Slide number and title
     * Main content points (bullet points or key information)
     * Suggested visuals or design elements
     * Speaker notes or additional context where appropriate
   - Include opening slide, content slides, and closing slide
   - Organize content logically with clear progression
   - Typical structure: Title → Introduction → Main Content (3-7 slides) → Conclusion → Q&A

2. **For Creative/Planning Tasks:**
   - Break down into clear, actionable steps or sections
   - Provide detailed explanations for each component
   - Include relevant examples, best practices, or tips
   - Use appropriate formatting (headers, bullet points, numbered lists)

3. **For Informational Queries:**
   - Provide comprehensive yet concise information
   - Use proper structure with sections/paragraphs
   - Include context, examples, and applications
   - When relevant, provide multiple perspectives

4. **For Technical Questions:**
   - Explain concepts clearly with examples
   - Break down complex topics into digestible parts
   - Provide code snippets, formulas, or diagrams when helpful
   - Include practical applications and best practices

5. **Formatting:**
   - Use markdown formatting for better readability
   - Use headers (##, ###) to organize sections
   - Use bullet points for lists
   - Use bold for emphasis on key terms
   - Use code blocks for technical content
   - Keep paragraphs concise but informative

Always strive to match or exceed the quality and detail of leading AI assistants like ChatGPT and Gemini. Be thorough, structured, and helpful in every response.`
      });
    }
    
    // Add conversation history
    if (history && history.length > 0) {
      history.forEach(item => {
        messages.push({
          role: item.role,
          content: item.content
        });
      });
    }
    
    // Add the user's message
    messages.push({ role: 'user', content: message });
    
    console.log('Starting OpenAI streaming...');
    
    try {
      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true, // Enable streaming
      });

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        
        if (content) {
          // Send the chunk as SSE
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }

        // Check if stream is done
        if (chunk.choices[0]?.finish_reason === 'stop') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      }

      console.log('Streaming completed successfully');
      res.end();
      
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.end();
    }
    
  } catch (error) {
    console.error('Error in streaming chat API:', error);
    
    // If headers haven't been sent yet, send JSON error
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to generate response',
        details: error.message 
      });
    } else {
      // If streaming already started, send error through SSE
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}

