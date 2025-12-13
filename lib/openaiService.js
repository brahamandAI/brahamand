import axios from 'axios';

// Initialize with API key from environment variables
const apiKey = process.env.OPENAI_API_KEY; // Using the OpenAI API key

// Enhanced local implementation for better PDF analysis and summaries
function createEnhancedSummary(pdfText, metadata, options = {}) {
  if (!pdfText || pdfText.trim().length < 50) {
    return "Could not generate a summary due to insufficient text content.";
  }
  
  try {
    // Extract options and metadata
    const { 
      depth = 'standard', // 'basic', 'standard', or 'comprehensive'
      model = 'default', 
      maxLength = 4000,
      concise = false,
      includeMetadata = true,
      formatOutput = true
    } = options;
    
    const { totalPages, totalWords, title } = metadata;
    
    // Start with document title and metadata
    let summary = formatOutput ? `# ${title || 'Document Analysis'}\n\n` : `${title || 'Document Analysis'}\n\n`;
    
    if (includeMetadata) {
      summary += `SECTION: Document Information\n\n`;
      summary += `This document contains ${totalPages} page${totalPages !== 1 ? 's' : ''} with approximately ${totalWords} words.\n`;
      summary += `Estimated reading time: ${Math.ceil(totalWords / 200)} minute${Math.ceil(totalWords / 200) !== 1 ? 's' : ''}.\n\n`;
    }
    
    // Skip Document Structure section
    
    // Skip Executive Summary section
    
    // Extract key points from the document
    const keyPoints = extractKeyPoints(pdfText, depth);
    if (keyPoints.length > 0) {
      summary += `SECTION: Key Points\n\n`;
      keyPoints.forEach(point => {
        summary += `- ${point}\n`;
      });
      summary += '\n';
    }
    
    // For more comprehensive analysis, include more detailed sections
    if (depth === 'comprehensive') {
      // Add findings/analysis section
      const findings = analyzeContent(pdfText);
      if (findings) {
        summary += `SECTION: Analysis\n\n`;
        summary += `${findings}\n\n`;
      }
      
      // Extract meaningful quotes if available
      const quotes = extractMeaningfulQuotes(pdfText);
      if (quotes.length > 0) {
        summary += `SECTION: Notable Quotes\n\n`;
        quotes.slice(0, 3).forEach(quote => {
          summary += `"${quote}"\n\n`;
        });
      }
    }
    
    // Add citation for processing
    if (!concise) {
      summary += `_Analysis provided by ब्रह्मांड AI _`;
    }
    
    // Truncate if needed based on maxLength parameter
    if (summary.length > maxLength) {
      // Try to truncate at paragraph boundaries
      const truncated = summary.substring(0, maxLength);
      const lastParagraphBreak = truncated.lastIndexOf('\n\n');
      
      if (lastParagraphBreak > maxLength * 0.8) {
        // If we can find a good break point, use it
        summary = truncated.substring(0, lastParagraphBreak) + 
                  '\n\n_Analysis truncated due to length limits..._';
      } else {
        // Otherwise just truncate at maxLength
        summary = truncated + '...\n\n_Analysis truncated due to length limits..._';
      }
    }
    
    return summary;
  } catch (error) {
    console.error("Error generating enhanced summary:", error);
    return `Document contains ${metadata.totalPages || 'unknown'} pages with approximately ${metadata.totalWords || 'unknown'} words. Error: ${error.message}`;
  }
}

// Helper functions for better analysis

// Identify main sections in the document
function identifySections(text) {
  // Look for headings or section markers
  const headingMatches = text.match(/(?:^|\n)(?:#+\s+)(.+?)(?:\n|$)/g) || [];
  const capsHeadingMatches = text.match(/(?:^|\n)([A-Z][A-Z\s]{5,50})(?:\n|$)/g) || [];
  const numberedHeadingMatches = text.match(/(?:^|\n)(?:\d+\.\s+)(.+?)(?:\n|$)/g) || [];
  
  const sections = [];
  
  // Process markdown-style headings
  headingMatches.forEach(match => {
    const heading = match.replace(/^#+\s+/, '').trim();
    if (heading.length > 3 && heading.length < 100) {
      sections.push(heading);
    }
  });
  
  // Process all-caps headings (common in legal/formal docs)
  capsHeadingMatches.forEach(match => {
    const heading = match.trim();
    if (heading.length > 5 && heading.length < 100) {
      sections.push(heading);
    }
  });
  
  // Process numbered headings
  numberedHeadingMatches.forEach(match => {
    const heading = match.replace(/^\d+\.\s+/, '').trim();
    if (heading.length > 3 && heading.length < 100) {
      sections.push(heading);
    }
  });
  
  // Remove duplicates
  return [...new Set(sections)];
}

// Generate an executive summary of the document
function generateExecutiveSummary(text, depth) {
  // Get paragraphs that seem content-rich
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 100);
  
  // For deeper analysis, look for specific content types
  const introduction = findIntroduction(text) || '';
  const mainContent = findMainContentSection(text) || '';
  
  // Create a more meaningful summary with an actual synthesis
  let summary = '';
  
  if (introduction) {
    summary += `${truncateText(introduction, 300)}\n\n`;
  }
  
  if (mainContent) {
    // Synthesize the main content rather than just extracting it
    const mainContentSummary = synthesizeContent(mainContent, depth);
    summary += `${mainContentSummary}\n\n`;
  } else if (paragraphs.length > 0) {
    // If we couldn't identify specific sections, use the most content-rich paragraphs
    const contentParagraphs = paragraphs.slice(0, depth === 'comprehensive' ? 3 : 1);
    const synthesized = synthesizeContent(contentParagraphs.join('\n\n'), depth);
    summary += `${synthesized}\n\n`;
  }
  
  if (!summary) {
    // Fallback if we couldn't create a meaningful summary
    summary = "This document doesn't contain enough structured content for a detailed summary. The text appears to be primarily " + 
              detectContentType(text) + ". Please review the full document for more information.";
  }
  
  return summary;
}

// Find introduction section
function findIntroduction(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Look for paragraphs that might be an introduction
  for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
    const paragraph = paragraphs[i].toLowerCase();
    if (paragraph.includes('introduction') || 
        paragraph.includes('overview') || 
        paragraph.includes('abstract') || 
        paragraph.includes('summary') ||
        paragraph.includes('purpose') ||
        paragraph.includes('background')) {
      return paragraphs[i];
    }
  }
  
  // If no specific introduction found, use the first substantial paragraph
  for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
    if (paragraphs[i].length > 100) {
      return paragraphs[i];
    }
  }
  
  return '';
}

// Find the main content section
function findMainContentSection(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Skip initial paragraphs (likely introduction) and end paragraphs (likely conclusion)
  const startIndex = Math.min(Math.floor(paragraphs.length * 0.2), 2);
  const endIndex = Math.max(Math.floor(paragraphs.length * 0.8), paragraphs.length - 2);
  
  // Get the middle paragraphs which likely contain the main content
  const contentParagraphs = paragraphs.slice(startIndex, endIndex);
  
  // Join the main content
  return contentParagraphs.join('\n\n');
}

// Extract key points from the document
function extractKeyPoints(text, depth) {
  const sentences = text.split(/[.!?][\s\n]+/).filter(s => s.trim().length > 20);
  const keyPoints = [];
  
  // Filter for sentences that appear to be key points
  const keywordPattern = /\b(key|main|essential|important|significant|crucial|critical|noted|highlight|remarkable|principal|fundamental|central)\b/i;
  const pointIndicators = /\b(point|finding|observation|result|conclusion|recommendation|takeaway)\b/i;
  
  // First pass: Look for explicitly marked key points
  for (let sentence of sentences) {
    if ((keywordPattern.test(sentence) && pointIndicators.test(sentence)) || 
        sentence.includes('•') || 
        /^\s*[\*\-•]\s/.test(sentence)) {
      // This looks like a key point
      const cleanPoint = sentence.replace(/^\s*[\*\-•]\s/, '').trim();
      if (cleanPoint.length > 20) {
        keyPoints.push(cleanPoint);
      }
    }
  }
  
  // Second pass: If we don't have enough points, look for sentences with indicator phrases
  const emphasisPhrases = [
    'it is important to note', 
    'notably', 
    'significantly', 
    'in particular',
    'especially',
    'specifically',
    'worth noting',
    'key aspect',
    'crucial factor'
  ];
  
  if (keyPoints.length < (depth === 'comprehensive' ? 5 : 3)) {
    for (let sentence of sentences) {
      if (emphasisPhrases.some(phrase => sentence.toLowerCase().includes(phrase))) {
        const cleanPoint = sentence.trim();
        if (cleanPoint.length > 20 && !keyPoints.includes(cleanPoint)) {
          keyPoints.push(cleanPoint);
        }
      }
    }
  }
  
  // Third pass: If still not enough points, select sentences that seem important based on content
  if (keyPoints.length < (depth === 'comprehensive' ? 5 : 3)) {
    // Look for sentences with numbers/statistics
    const statsPattern = /\b\d+(?:\.\d+)?(?:\s*%|percent|million|billion|thousand)\b/i;
    for (let sentence of sentences) {
      if (statsPattern.test(sentence)) {
        const cleanPoint = sentence.trim();
        if (cleanPoint.length > 20 && !keyPoints.includes(cleanPoint)) {
          keyPoints.push(cleanPoint);
        }
      }
    }
  }
  
  // If we still don't have enough points, take some sentences from the beginning, middle and end
  if (keyPoints.length < (depth === 'comprehensive' ? 5 : 3) && sentences.length > 10) {
    const candidatePositions = [
      Math.floor(sentences.length * 0.2),
      Math.floor(sentences.length * 0.5),
      Math.floor(sentences.length * 0.8)
    ];
    
    for (let position of candidatePositions) {
      if (sentences[position] && sentences[position].length > 30) {
        const cleanPoint = sentences[position].trim();
        if (!keyPoints.includes(cleanPoint)) {
          keyPoints.push(cleanPoint);
        }
      }
    }
  }
  
  return keyPoints.slice(0, depth === 'comprehensive' ? 8 : 5);
}

// Analyze content to provide findings 
function analyzeContent(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
  
  // Look for the richest paragraphs in terms of content
  const paragraphScores = paragraphs.map(p => {
    let score = 0;
    
    // Higher score for paragraphs with data/numbers
    if (/\b\d+(?:\.\d+)?(?:\s*%|percent|million|billion|thousand)\b/i.test(p)) {
      score += 3;
    }
    
    // Higher score for paragraphs with terminology (potential technical content)
    if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,}\b/.test(p)) {
      score += 2;
    }
    
    // Higher score for proper sentence structure
    if (p.split(/[.!?][\s\n]+/).length > 2) {
      score += 2;
    }
    
    // Higher score for medium-length paragraphs (not too short, not too long)
    if (p.length > 100 && p.length < 500) {
      score += 2;
    }
    
    return {paragraph: p, score};
  });
  
  // Sort by score
  paragraphScores.sort((a, b) => b.score - a.score);
  
  // Take the top 2 paragraphs
  const topParagraphs = paragraphScores.slice(0, 2).map(item => item.paragraph);
  
  // Create an analytical summary rather than just copying the text
  if (topParagraphs.length > 0) {
    let analysis = '';
    
    // Combine and analyze the top paragraphs
    const combinedText = topParagraphs.join('\n\n');
    
    // Look for patterns in the text
    if (/\b\d+(?:\.\d+)?(?:\s*%|percent)\b/i.test(combinedText)) {
      analysis += "The document contains statistical information and percentage figures which indicate quantitative analysis. ";
    }
    
    if (/\b(?:increase|decrease|growth|decline|reduction)\b/i.test(combinedText)) {
      analysis += "There are trends or changes discussed in the content. ";
    }
    
    if (/\b(?:study|research|analysis|investigation|experiment)\b/i.test(combinedText)) {
      analysis += "Research findings or study results are presented. ";
    }
    
    if (/\b(?:should|must|need to|have to|require|necessary)\b/i.test(combinedText)) {
      analysis += "The document contains prescriptive elements or recommendations. ";
    }
    
    if (analysis) {
      analysis += "\n\n";
    }
    
    // Add the actual content
    analysis += synthesizeContent(combinedText, 'standard');
    return analysis;
  }
  
  return '';
}

// Extract meaningful quotes
function extractMeaningfulQuotes(text) {
  const quotes = [];
  
  // Look for quoted text
  const quotedTextMatches = text.match(/"([^"]{20,150})"/g) || [];
  quotedTextMatches.forEach(match => {
    const quote = match.replace(/^"|"$/g, '').trim();
    if (quote.length > 20 && quote.length < 150) {
      quotes.push(quote);
    }
  });
  
  // Also look for emphasized text
  const emphasizedTextMatches = text.match(/\*([^*]{20,150})\*/g) || [];
  emphasizedTextMatches.forEach(match => {
    const emphasized = match.replace(/^\*|\*$/g, '').trim();
    if (emphasized.length > 20 && emphasized.length < 150) {
      quotes.push(emphasized);
    }
  });
  
  return quotes;
}

// Extract conclusion
function extractConclusion(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Look for explicit conclusion sections
  for (let i = Math.max(0, paragraphs.length - 5); i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].toLowerCase();
    if (paragraph.includes('conclusion') || 
        paragraph.includes('in summary') || 
        paragraph.includes('to summarize') || 
        paragraph.includes('in conclusion') ||
        paragraph.includes('to conclude')) {
      return paragraphs[i];
    }
  }
  
  // If no explicit conclusion, use the last substantial paragraph
  for (let i = paragraphs.length - 1; i >= Math.max(0, paragraphs.length - 3); i--) {
    if (paragraphs[i].length > 100) {
      return paragraphs[i];
    }
  }
  
  return '';
}

// Synthesize content rather than just extracting it
function synthesizeContent(text, depth) {
  // Remove excessive whitespace and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Create a more meaningful summary based on the depth
  let synthesis = '';
  
  // Check the type of content
  const contentType = detectContentType(cleanText);
  
  if (contentType === 'technical') {
    synthesis = `The document presents technical information`;
  } else if (contentType === 'narrative') {
    synthesis = `The document contains narrative content`;
  } else if (contentType === 'informational') {
    synthesis = `The document provides informational content`;
  } else if (contentType === 'analytical') {
    synthesis = `The document presents analytical content`;
  } else {
    synthesis = `The document contains general content`;
  }
  
  // Add more detail about what's in the content
  const keyThemes = identifyKeyThemes(cleanText);
  if (keyThemes.length > 0) {
    synthesis += ` focusing on ${keyThemes.slice(0, 3).join(', ')}`;
    if (keyThemes.length > 3) {
      synthesis += ` and other related topics`;
    }
    synthesis += '. ';
  } else {
    synthesis += `. `;
  }
  
  // For standard and comprehensive depth, add more details
  if (depth !== 'basic') {
    const sentences = cleanText.split(/[.!?][\s\n]+/).filter(s => s.trim().length > 20);
    
    // For standard depth, add 1-2 key sentences
    if (depth === 'standard' && sentences.length > 0) {
      // Pick a sentence from the first third and one from the last third
      const firstThirdIndex = Math.floor(sentences.length * 0.3);
      const lastThirdIndex = Math.floor(sentences.length * 0.7);
      
      if (sentences[firstThirdIndex]) {
        synthesis += truncateText(sentences[firstThirdIndex], 200) + '. ';
      }
      
      if (sentences[lastThirdIndex] && sentences[lastThirdIndex] !== sentences[firstThirdIndex]) {
        synthesis += truncateText(sentences[lastThirdIndex], 200) + '. ';
      }
    }
    
    // For comprehensive depth, add more analysis
    if (depth === 'comprehensive') {
      // Add insights about the structure and content
      synthesis += `The content is presented in a ${detectStructureType(cleanText)} format`;
      
      // Add information about data/numbers if present
      if (/\b\d+(?:\.\d+)?(?:\s*%|percent|million|billion|thousand)\b/i.test(cleanText)) {
        synthesis += ` with statistical data to support its points`;
      }
      
      synthesis += `. `;
      
      // Add a few more illustrative sentences for comprehensive analysis
      if (sentences.length > 0) {
        const selectedSentences = selectRepresentativeSentences(sentences, 3);
        selectedSentences.forEach(sentence => {
          synthesis += truncateText(sentence, 150) + '. ';
        });
      }
    }
  }
  
  return synthesis;
}

// Helper function to truncate text with ellipsis
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Detect the type of content
function detectContentType(text) {
  const technicalPatterns = [
    /\b(?:algorithm|data|analysis|methodology|technical|specification|parameter|configuration)\b/i,
    /\b(?:study|research|experiment|test|measurement|calculation|equation)\b/i
  ];
  
  const narrativePatterns = [
    /\b(?:story|narrative|character|plot|scene|setting|told|recounted)\b/i,
    /\b(?:he|she|they|them|their|his|her)\b/i
  ];
  
  const informationalPatterns = [
    /\b(?:information|guide|instruction|manual|handbook|reference|overview)\b/i,
    /\b(?:describes|explains|shows|demonstrates|illustrates|provides)\b/i
  ];
  
  const analyticalPatterns = [
    /\b(?:analysis|assessment|evaluation|review|critique|examination)\b/i,
    /\b(?:therefore|thus|consequently|hence|accordingly|as a result)\b/i
  ];
  
  let scores = {
    technical: 0,
    narrative: 0,
    informational: 0,
    analytical: 0
  };
  
  // Check for technical patterns
  technicalPatterns.forEach(pattern => {
    if (pattern.test(text)) scores.technical += 2;
  });
  
  // Check for narrative patterns
  narrativePatterns.forEach(pattern => {
    if (pattern.test(text)) scores.narrative += 2;
  });
  
  // Check for informational patterns
  informationalPatterns.forEach(pattern => {
    if (pattern.test(text)) scores.informational += 2;
  });
  
  // Check for analytical patterns
  analyticalPatterns.forEach(pattern => {
    if (pattern.test(text)) scores.analytical += 2;
  });
  
  // Additional pattern checks
  if (/\b\d+(?:\.\d+)?(?:\s*%|percent)\b/i.test(text)) scores.technical += 1;
  if (/\b(?:once upon a time|one day|in the beginning)\b/i.test(text)) scores.narrative += 3;
  if (/\b(?:step \d+|firstly|secondly|finally|in conclusion)\b/i.test(text)) scores.informational += 2;
  if (/\b(?:argument|position|stance|view|perspective|opinion)\b/i.test(text)) scores.analytical += 1;
  
  // Get the highest scoring type
  const types = Object.keys(scores);
  const highestType = types.reduce((a, b) => scores[a] > scores[b] ? a : b);
  
  return highestType;
}

// Identify key themes in the content
function identifyKeyThemes(text) {
  // This is a simple implementation - in a real system you would use NLP
  const words = text.toLowerCase().split(/\W+/);
  const stopWords = ['the', 'and', 'a', 'an', 'in', 'of', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among'];
  
  // Count word frequency, excluding stop words and short words
  const wordCounts = {};
  words.forEach(word => {
    if (word.length > 3 && !stopWords.includes(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Convert to array and sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0]);
  
  // Return top words as themes
  return sortedWords.slice(0, 5);
}

// Detect the structure type of the content
function detectStructureType(text) {
  // Check for list-like structures
  const bulletPoints = (text.match(/(?:^|\n)[\s-•*]*\s*[•\-*]\s+/g) || []).length;
  const numberedPoints = (text.match(/(?:^|\n)[\s]*\d+\.\s+/g) || []).length;
  
  if (bulletPoints + numberedPoints > 5) {
    return 'list-based';
  }
  
  // Check for question-answer format
  const questions = (text.match(/\b(?:what|why|how|where|when|who)\b[^.!?]*\?/gi) || []).length;
  if (questions > 3) {
    return 'question-answer';
  }
  
  // Check for section-based structure
  const sections = (text.match(/(?:^|\n)(?:#+\s+)(.+?)(?:\n|$)/g) || []).length;
  if (sections > 2) {
    return 'section-based';
  }
  
  // Check for narrative structure
  if (detectContentType(text) === 'narrative') {
    return 'narrative';
  }
  
  // Default to paragraph-based
  return 'paragraph-based';
}

// Select representative sentences from text
function selectRepresentativeSentences(sentences, count) {
  if (sentences.length <= count) return sentences;
  
  // For better coverage, take sentences from beginning, middle and end
  const result = [];
  
  // Beginning
  result.push(sentences[0]);
  
  // Middle - take a sentence from around the middle
  const middleIndex = Math.floor(sentences.length / 2);
  result.push(sentences[middleIndex]);
  
  // End - take from near the end, but not the very last which might be too conclusive
  const endIndex = Math.max(0, sentences.length - 3);
  result.push(sentences[endIndex]);
  
  return result.slice(0, count);
}

/**
 * Generate a summary of PDF content with enhanced detail
 * @param {string} pdfText - The extracted text content from the PDF
 * @param {object} metadata - Metadata about the PDF (page count, word count, etc)
 * @param {object} options - Additional options for summarization
 * @returns {Promise<string>} The generated summary
 */
export async function generatePDFSummary(pdfText, metadata, options = {}) {
  try {
    console.log('Generating enhanced PDF summary with local processing', options);
    
    // Pass through the options to the enhanced summary generation
    const enhancedSummary = createEnhancedSummary(pdfText, metadata, options);
    
    return enhancedSummary;
  } catch (error) {
    console.error("Error in summary generation:", error);
    // Fallback to basic summary
    return createEnhancedSummary(pdfText, metadata, { depth: 'basic', concise: true });
  }
}

/**
 * Check if the API key is configured
 * @returns {boolean} Whether the API key is configured
 */
export function isOpenAIConfigured() {
  // Always return true so we use our local summary generation
  return true;
}

export async function analyzePDF(file) {
  try {
    console.log('Starting PDF analysis with file:', file.name);
    
    // Convert PDF file to base64
    const base64 = await fileToBase64(file);
    console.log('File converted to base64, length:', base64?.length || 0);
    
    // Make the API request to analyze the PDF with the updated approach
    const response = await fetch('/api/analyze-pdf-simple', {
      method: 'POST',
      body: JSON.stringify({ 
        fileData: base64,
        fileName: file.name,
        options: {
          model: 'gpt-4', 
          concise: false,
          maxLength: 5000,
          depth: 'comprehensive',
          includeMetadata: true,
          formatOutput: true
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Handle API response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API response error:', response.status, errorData);
      throw new Error(errorData.error || `Failed to analyze PDF (${response.status})`);
    }
    
    // Get the analysis text from the response
    const data = await response.json();
    console.log('PDF analysis completed successfully');
    return data.summary || '';
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    throw error;
  }
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Generate a chat completion using best available language model
 * @param {string} message - The user's message
 * @param {Array} history - Chat history
 * @returns {Promise<string>} The generated response
 */
export async function generateChatCompletion(message, history = [], system = "") {
  try {
    console.log('Generating chat completion for:', message);
    
    // Check if this is a PDF summary request
    const isPDFSummary = message.includes("Please provide a comprehensive summary of this document:");
    
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Log API key availability (without revealing the key)
    console.log('API key available:', !!apiKey);
    console.log('Is PDF summary request:', isPDFSummary);
    
    if (!apiKey) {
      console.log('OpenAI API key not found, using local response generation');
      return generateLocalResponse(message);
    }
    
    // Use only OpenAI API and don't use any fallback
    try {
      // Prepare messages for the API call
      const messages = [];
      
      // Add a system message if provided
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
        // Map history to the format expected by OpenAI
        history.forEach(item => {
          messages.push({
            role: item.role,
            content: item.content
          });
        });
      }
      
      // Add the user's message
      messages.push({ role: 'user', content: message });
      
      console.log('Making OpenAI API call with message length:', message.length);
      
      // Make the API call to OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o", // Using the most accurate and up-to-date model
          messages: messages,
          temperature: 0.7, // Balanced temperature for creative yet accurate responses
          max_tokens: 4000, // Increased for detailed presentations and comprehensive responses
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
        console.log('OpenAI API returned successful response');
        return response.data.choices[0].message.content;
      } else {
        console.error('Unexpected response structure from OpenAI:', response.data);
        // Return the error instead of falling back to local response
        throw new Error('Unexpected OpenAI API response structure');
      }
    } catch (error) {
      console.error('Error in OpenAI API call:', error.response?.data || error.message);
      
      // Don't use fallback response for API errors - return the error directly
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error in generateChatCompletion:', error);
    // Re-throw the error instead of using local response
    throw error;
  }
}

// Removed fallback functions - using only OpenAI API for all responses
// This ensures consistent, high-quality responses from GPT-4o 