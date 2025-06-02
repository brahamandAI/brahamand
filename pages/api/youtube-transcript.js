const axios = require('axios');
const xml2js = require('xml2js');
const he = require('he');

async function getYouTubeTranscript(videoUrl) {
    try {
        // Extract video ID from URL with more robust regex
        let videoId;
        const urlPatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /(?:youtube\.com\/embed\/)([^&\n?#\/]+)/,
            /(?:youtube\.com\/v\/)([^&\n?#\/]+)/,
            /(?:youtube\.com\/shorts\/)([^&\n?#\/]+)/
        ];
        
        // Try each pattern until we find a match
        for (const pattern of urlPatterns) {
            const match = videoUrl.match(pattern);
            if (match && match[1]) {
                videoId = match[1];
                break;
            }
        }
        
        if (!videoId) {
            throw new Error('Could not extract YouTube video ID from URL');
        }

        // First try to get captions using the YouTube Data API
        try {
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
                const response = await axios.get(
                    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
                );
                
                if (response.data.items && response.data.items.length > 0) {
                    // If we have captions via API, use that
                    const captionId = response.data.items[0].id;
                    const captionResponse = await axios.get(
                        `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${apiKey}`,
                        { responseType: 'text' }
                    );
                    return captionResponse.data;
                }
            }
        } catch (apiError) {
            console.log('YouTube API approach failed, falling back to HTML parsing');
        }
        
        // Fallback to HTML parsing if API fails
        const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
        const html = response.data;

        // Extract the captions URL from the page
        const captionsUrlMatch = html.match(/"captionTracks":\[(.*?)\]/);
        if (!captionsUrlMatch || !captionsUrlMatch[1]) {
            throw new Error('No captions found for this video');
        }

        // Parse the captions data more safely
        let captionsData;
        try {
            captionsData = JSON.parse(`[${captionsUrlMatch[1]}]`);
        } catch (e) {
            throw new Error('Failed to parse captions data');
        }
        
        if (!captionsData || captionsData.length === 0) {
            throw new Error('No captions available for this video');
        }

        // Get the first available caption track
        const captionTrack = captionsData[0];
        if (!captionTrack || !captionTrack.baseUrl) {
            throw new Error('Caption track is invalid');
        }
        
        const captionUrl = captionTrack.baseUrl;
        
        // Fetch the captions
        const captionResponse = await axios.get(captionUrl);
        if (!captionResponse.data) {
            throw new Error('Failed to retrieve captions');
        }
        
        const captions = captionResponse.data;

        // Parse the XML captions
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(captions);
        
        if (!result || !result.transcript || !result.transcript.text) {
            throw new Error('Failed to parse caption data');
        }
        
        // Extract and format the text
        const transcript = result.transcript.text
            .map(text => text._)
            .filter(text => text) // Filter out undefined or null values
            .join(' ');

        // Decode HTML entities
        const decodedTranscript = he.decode(transcript);

        // Clean up the formatting
        const cleanedTranscript = decodedTranscript
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .trim(); // Remove leading/trailing whitespace

        return cleanedTranscript;
    } catch (error) {
        console.error('Error fetching transcript:', error.message);
        console.error('Stack trace:', error.stack);
        throw error; // Re-throw the error instead of returning null
    }
}

// Example usage
// getYouTubeTranscript('https://www.youtube.com/watch?v=YOUR_VIDEO_ID');

module.exports = { getYouTubeTranscript }; 