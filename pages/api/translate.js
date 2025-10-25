import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, targetLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }
    
    // Get language name from code for better prompt
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'te': 'Telugu',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'ur': 'Urdu',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'or': 'Odia',
      'ml': 'Malayalam',
      'pa': 'Punjabi',
      'as': 'Assamese',
      'mai': 'Maithili',
      'sa': 'Sanskrit',
      'sat': 'Santali',
      'ks': 'Kashmiri',
      'ne': 'Nepali',
      'kok': 'Konkani',
      'doi': 'Dogri',
      'sd': 'Sindhi',
      'brx': 'Bodo'
    };
    
    const languageName = languageMap[targetLanguage] || targetLanguage;
    
    // Use OpenAI API for translation
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    try {
      // Prepare messages for the API call
      const messages = [
        { 
          role: 'system', 
          content: `You are a professional translator specializing in Indian languages. 
          Translate the following text into ${languageName}. Maintain the original formatting 
          including markdown, line breaks, and paragraph structure. Do not add any explanations
          or notes, just return the translated text.`
        },
        { role: 'user', content: text }
      ];
      
      // Make the API call to OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o", // Using a powerful model for accurate translations
          messages: messages,
          temperature: 0.3, // Lower temperature for more accurate translations
          max_tokens: 4000,
          top_p: 1,
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
        
        return res.status(200).json({ 
          translatedText: response.data.choices[0].message.content,
          originalLanguage: 'en',
          targetLanguage: targetLanguage
        });
      } else {
        console.error('Unexpected response structure from OpenAI:', response.data);
        return res.status(500).json({ error: 'Failed to translate text' });
      }
    } catch (error) {
      console.error('Error in OpenAI API call for translation:', error.response?.data || error.message);
      return res.status(500).json({ 
        error: 'Failed to translate text',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Error in translation API:', error);
    return res.status(500).json({ 
      error: 'Failed to translate text',
      details: error.message 
    });
  }
} 