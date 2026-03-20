import React, { useState, useRef, useEffect } from 'react';
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

const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'Square (1:1)', icon: '⬛' },
  { value: '1792x1024', label: 'Landscape (16:9)', icon: '▬' },
  { value: '1024x1792', label: 'Portrait (9:16)', icon: '▮' },
];

const STYLE_OPTIONS = [
  { value: 'natural', label: 'Natural', desc: 'Photo-realistic (like ChatGPT)' },
  { value: 'vivid', label: 'Vivid', desc: 'Artistic & dramatic' },
];

const TextToImage = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('natural');
  const [size, setSize] = useState('1024x1024');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [revisedPrompt, setRevisedPrompt] = useState(null);
  const [showRevisedPrompt, setShowRevisedPrompt] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const imageResultRef = useRef(null);

  // Auto-scroll to result after generation
  useEffect(() => {
    if (generatedImage && imageResultRef.current) {
      setTimeout(() => {
        imageResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [generatedImage]);

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
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
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    setRevisedPrompt(null);
    setShowRevisedPrompt(false);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedImage(data.imageUrl);
        if (data.revisedPrompt) {
          setRevisedPrompt(data.revisedPrompt);
        }
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const imageDimensions = size === '1792x1024'
    ? { width: 714, height: 408 }
    : size === '1024x1792'
    ? { width: 234, height: 408 }
    : { width: 408, height: 408 };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
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
                placeholder="Describe your imagination in detail... (e.g. 'a tiger in a neon jungle at night')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${styles.enhanceButton} ${isEnhancing ? styles.enhancing : ''}`}
                onClick={enhancePrompt}
                disabled={!prompt.trim() || isEnhancing}
                title="Enhance prompt with AI (GPT-4o)"
              >
                {isEnhancing
                  ? <div className={styles.microSpinner}></div>
                  : <i className="fa-solid fa-wand-magic-sparkles"></i>
                }
              </motion.button>
            </div>

            {/* Style selector */}
            <div className={styles.optionGroup}>
              <div className={styles.optionLabel}>Style</div>
              <div className={styles.optionRow}>
                {STYLE_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    className={`${styles.optionChip} ${style === opt.value ? styles.optionChipActive : ''}`}
                    onClick={() => setStyle(opt.value)}
                  >
                    <span className={styles.chipLabel}>{opt.label}</span>
                    <span className={styles.chipDesc}>{opt.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className={styles.optionGroup}>
              <div className={styles.optionLabel}>Aspect Ratio</div>
              <div className={styles.optionRow}>
                {SIZE_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    className={`${styles.optionChip} ${size === opt.value ? styles.optionChipActive : ''}`}
                    onClick={() => setSize(opt.value)}
                  >
                    <span className={styles.chipIcon}>{opt.icon}</span>
                    <span className={styles.chipLabel}>{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className={styles.suggestionsWrapper}>
              <div className={styles.suggestionsLabel}>Try these examples:</div>
              <div className={styles.suggestionsGrid}>
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
                <p className={styles.loadingText}>Optimizing prompt &amp; creating your masterpiece...</p>
                <p className={styles.loadingSubtext}>Using DALL-E 3 HD with AI prompt optimization</p>
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
              ref={imageResultRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.generatedImageWrapper}
            >
              <div className={styles.imageBox}>
                <Image
                  className={styles.generatedImage}
                  src={generatedImage}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  alt="Generated Image"
                  unoptimized={true}
                  onError={() => {
                    setError('Failed to load the generated image. Please try again.');
                  }}
                />

                {revisedPrompt && (
                  <div className={styles.revisedPromptBox}>
                    <button
                      className={styles.revisedPromptToggle}
                      onClick={() => setShowRevisedPrompt(!showRevisedPrompt)}
                    >
                      <i className="fa-solid fa-sparkles"></i>
                      <span>AI Optimized Prompt</span>
                      <i className={`fa-solid fa-chevron-${showRevisedPrompt ? 'up' : 'down'}`}></i>
                    </button>
                    {showRevisedPrompt && (
                      <p className={styles.revisedPromptText}>{revisedPrompt}</p>
                    )}
                  </div>
                )}

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