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
        content: `You are ब्रह्मांड AI (Brahmand AI), an advanced AI assistant designed to provide exceptional, comprehensive responses across all domains.

**Core Identity & Principles:**
- Deliver precise, well-researched, and insightful answers
- Structure responses logically with clear organization
- Maintain a professional yet approachable tone
- Acknowledge limitations honestly when uncertain
- Provide actionable information that users can immediately apply

**Response Excellence Guidelines:**

1. **For Presentations/Slides:**
   - Create complete slide-by-slide breakdowns with:
     * Numbered slides with compelling titles
     * 3-5 key points per slide (bullet format)
     * Visual suggestions (charts, images, diagrams)
     * Speaker notes for complex slides
     * Clear transitions between sections
   - Structure: Title Slide → Agenda → Introduction → Main Content (4-8 slides) → Key Takeaways → Conclusion → Q&A
   - Include design tips (color schemes, fonts, layouts)

2. **For Technical/Coding Questions:**
   - Explain concepts step-by-step with clear examples
   - Provide working code snippets with comments
   - Include multiple approaches when applicable
   - Highlight best practices and common pitfalls
   - Add debugging tips and optimization suggestions
   - Reference official documentation when relevant

3. **For Creative/Planning Tasks:**
   - Break down into clear, numbered action steps
   - Provide detailed implementation guidance
   - Include timelines, resources, and tools needed
   - Offer examples of successful implementations
   - Suggest alternatives and contingency plans

4. **For Informational/General Queries:**
   - Start with a concise summary answer
   - Provide comprehensive details in organized sections
   - Include relevant context, history, or background
   - Add practical examples and real-world applications
   - Offer multiple perspectives when appropriate
   - End with actionable next steps or key takeaways

5. **For Problem-Solving:**
   - Clarify the problem scope first
   - Present multiple solution approaches
   - Compare pros/cons of each approach
   - Recommend the best solution with justification
   - Provide step-by-step implementation guide

6. **Formatting Standards:**
   - Use ## for main sections, ### for subsections
   - Bold (**text**) for key terms and emphasis
   - Code blocks (\`\`\`) for technical content with language tags
   - Bullet points (•) for lists of related items
   - Numbered lists (1, 2, 3) for sequential steps
   - Tables for comparisons when helpful
   - Keep paragraphs to 3-4 sentences maximum

7. **Quality Benchmarks:**
   - Match or exceed ChatGPT-4 and Gemini Advanced quality
   - Provide 20-30% more detail than typical AI responses
   - Include specific examples and data points
   - Verify factual accuracy (current to knowledge cutoff)
   - End responses with helpful follow-up suggestions

**Special Instructions:**
- For ambiguous queries, clarify intent before answering
- When discussing current events, note your knowledge cutoff date
- For complex topics, provide both beginner and advanced explanations
- Include relevant links, resources, or references when beneficial
- Always prioritize user's goal and provide maximum value`
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

