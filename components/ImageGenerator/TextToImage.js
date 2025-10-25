import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TextToImage.module.css';

const suggestions = [
  "A serene Japanese garden with cherry blossoms",
  "Futuristic cityscape at sunset",
  "Abstract digital art with vibrant colors",
  "Mystical forest with glowing mushrooms",
  "Underwater scene with bioluminescent creatures"
];

const TextToImage = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  const enhancePrompt = async () => {
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (err) {
      console.error('Error enhancing prompt:', err);
    }
  };

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedImage(data.imageUrl);
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Heading Section */}
        <div className={styles.headerSection}>
          <h1 className={styles.title}>AI Image Generator</h1>
          <p className={styles.subtitle}>Transform your ideas into stunning visuals with AI</p>
        </div>

        <div className={styles.card}>
          <div className={styles.inputContainer}>
            <div className={styles.textareaWrapper}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                rows="4"
                placeholder="Describe your imagination in detail..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.enhanceButton}
                onClick={enhancePrompt}
                title="Enhance prompt with AI"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </motion.button>
            </div>
            
            <div className={styles.suggestionsWrapper}>
              <div className={styles.suggestionsLabel}>Try these examples:</div>
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={styles.suggestionButton}
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={styles.generateButton}
              onClick={generateImage}
              disabled={!prompt || isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinnerWrapper}>
                    <div className={styles.spinner}></div>
                  </div>
                  <span>Creating Magic...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paintbrush"></i>
                  <span>Generate Image</span>
                </>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.loadingWrapper}
              >
                <div className={styles.loadingAnimation}>
                  <div className={styles.loadingSpinner}></div>
                  <div className={styles.loadingRipple}></div>
                </div>
                <p className={styles.loadingText}>Creating your masterpiece...</p>
                <p className={styles.loadingSubtext}>This may take a few moments</p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.errorMessage}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              <p>{error}</p>
            </motion.div>
          )}

          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.generatedImageWrapper}
            >
              <div className={styles.imageBox}>
                <Image
                  className={styles.generatedImage}
                  src={generatedImage}
                  width={522}
                  height={408}
                  alt="Generated Image"
                  unoptimized={true}
                  onError={(e) => {
                    console.error('Image loading error:', e);
                    setError('Failed to load the generated image. Please try again.');
                  }}
                />
                <div className={styles.buttonGroup}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={styles.actionButton}
                    onClick={generateImage}
                  >
                    <i className="fa-solid fa-arrows-rotate"></i>
                    <span>Regenerate</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`${styles.actionButton} ${styles.downloadButton}`}
                    onClick={() => window.open(generatedImage, '_blank')}
                  >
                    <i className="fa-sharp fa-regular fa-download"></i>
                    <span>Download</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToImage; 