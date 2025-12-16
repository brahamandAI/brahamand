// API route for chat completion
import { generateChatCompletion } from '../../lib/openaiService';
import axios from 'axios';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, system = "", history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Received chat request:', message);
    
    // Check if this is a PDF summary request - handle it specially
    const isPDFSummary = message.startsWith("Please provide a comprehensive summary of this document:");
    
    if (isPDFSummary) {
      console.log('Processing PDF summary request with direct OpenAI API call');
      
      // Use the API key directly from environment variables for PDF requests
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }
      
      try {
        // Prepare messages for the API call
        const messages = [];
        
        // Add a system message if provided
        if (system) {
          messages.push({ role: 'system', content: system });
        } else {
          // Default system message specifically for PDF analysis
          messages.push({ 
            role: 'system', 
            content: `You are an expert PDF document analyst with deep expertise in extracting insights from various document types (academic papers, business reports, resumes, technical manuals, legal documents, etc.).

**Your Analysis Framework:**

1. **Document Classification** (Identify type first)
   - Resume/CV: Focus on skills, experience, education, achievements
   - Business Report: Executive summary, findings, recommendations
   - Academic Paper: Research question, methodology, findings, conclusions
   - Technical Manual: Key procedures, specifications, warnings
   - Legal Document: Key clauses, obligations, rights, deadlines

2. **Comprehensive Analysis Structure:**

   **A. Executive Summary** (2-3 sentences)
   - What is this document about?
   - Who is it for and what's its purpose?

   **B. Key Information** (Organized by relevance)
   - Main topics or sections identified
   - Critical facts, data points, and statistics
   - Important names, dates, locations, or figures
   - Essential conclusions or recommendations

   **C. Detailed Breakdown** (Use headers)
   ## [Main Section 1 Title]
   - Point 1 with specific details
   - Point 2 with specific details
   
   ## [Main Section 2 Title]
   - Point 1 with specific details
   - Point 2 with specific details

   **D. Highlights & Insights**
   - Notable quotes or statements
   - Surprising findings or unique aspects
   - Relationships between different sections
   - Implicit messages or themes

   **E. Actionable Takeaways** (if applicable)
   - What actions does this suggest?
   - What decisions need to be made?
   - What are the next steps?

3. **Formatting Guidelines:**
   - Use ## for main sections, ### for subsections
   - Bold important terms, names, or numbers
   - Use bullet points for lists
   - Include specific page references when relevant
   - Maintain factual accuracy - don't infer beyond content

4. **Quality Standards:**
   - Be comprehensive but not redundant
   - Extract 80% more detail than basic summaries
   - Preserve technical terms and specific terminology
   - Maintain context and relationships between concepts
   - Identify what's missing or unclear in the document

**Special Cases:**
- For resumes: Highlight standout achievements, skills, and experience
- For reports: Focus on findings, recommendations, and data
- For academic papers: Emphasize methodology and conclusions
- For technical docs: Prioritize procedures, specifications, safety info

Always deliver professional-grade analysis that captures both the big picture and critical details.`
          });
        }
        
        // Add the user's message
        messages.push({ role: 'user', content: message });
        
        console.log('Making direct OpenAI API call for PDF summary');
        
        // Make the direct API call to OpenAI
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: "gpt-4o", // Using the most accurate model
            messages: messages,
            temperature: 0.2, // Lower temperature for more factual summaries
            max_tokens: 4000, // Increased for comprehensive summaries
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        // Extract the response text
        if (response.data && 
            response.data.choices && 
            response.data.choices.length > 0 && 
            response.data.choices[0].message) {
          
          console.log('OpenAI API returned successful PDF summary response');
          return res.status(200).json({ 
            response: response.data.choices[0].message.content,
            source: 'openai-direct'
          });
        } else {
          console.error('Unexpected response structure from OpenAI:', response.data);
          return res.status(500).json({ error: 'Failed to generate PDF summary' });
        }
      } catch (error) {
        console.error('Error in direct OpenAI API call for PDF:', error.response?.data || error.message);
        return res.status(500).json({ 
          error: 'Failed to generate PDF summary',
          details: error.message 
        });
      }
    } else {
      // For regular non-PDF requests, use the standard service
      try {
        const response = await generateChatCompletion(message, history, system);
        
        // Return the response
        return res.status(200).json({ response });
      } catch (error) {
        console.error('Error in chat completion:', error);
        return res.status(500).json({ 
          error: 'Failed to generate response',
          details: error.message,
          apiKeyConfigured: !!process.env.OPENAI_API_KEY
        });
      }
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
} 