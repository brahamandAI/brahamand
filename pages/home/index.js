import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Chip, Avatar, Box, Button, DialogActions, DialogContent, DialogTitle, Dialog, Typography } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import LanguageIcon from "@mui/icons-material/Language";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import Context, { useAppContext } from "@/context/Context";
import PageHead from "../Head";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import LeftDashboardSidebar from "@/components/Header/LeftDashboardSidebar";
import RightDashboardSidebar from "@/components/Header/RightDashboardSidebar";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import BackToTop from "../backToTop";
import Modal from "@/components/Common/Modal";
import Logo from "@/components/Header/Logo";
import LogoCon from "@/components/Header/Logocon";
import styles from "../../styles/HomePage.module.css";
import { formatResponse, typeResponse, extractNewsCategory, formatNewsForResponse, isNewsRelatedQuery } from "../../lib/homeHelpers";
import PDFAnalysisComponent from "../../components/PDFAnalysisComponent";
import { generateResponse } from "../../components/ChatResponseHandler";
import { processPDFFile } from "../../lib/homeHelpers";
import Clipboard from 'clipboard';
import { useAuth } from "@/context/AuthContext";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import TranslateIcon from "@mui/icons-material/Translate";
import ClearIcon from "@mui/icons-material/Clear";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Link from 'next/link';
import { motion } from 'framer-motion'; // Import motion
import { 
  DocumentMagnifyingGlassIcon as DocumentIcon, 
  SunIcon, 
  MegaphoneIcon, 
  CurrencyDollarIcon, 
  VideoCameraIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// HomePage Component
const HomePage = () => {
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [shouldStopGeneration, setShouldStopGeneration] = useState(false);
  const [isBrainstormMode, setIsBrainstormMode] = useState(false);
  const [lastBrainstormNotificationTime, setLastBrainstormNotificationTime] = useState(0);
  const messagesEndRef = useRef(null);
  const { isDarkMode } = useAppContext();
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const { user, isLoggedIn } = useAuth();
  const [anchorElLanguage, setAnchorElLanguage] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  // Comment out YouTube state variables
  // const [youtubeUrl, setYoutubeUrl] = useState("");
  // const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  
  // 22 Indian languages
  const indianLanguages = [
    { name: "English", code: "en" },
    { name: "Hindi", code: "hi" },
    { name: "Bengali", code: "bn" },
    { name: "Telugu", code: "te" },
    { name: "Marathi", code: "mr" },
    { name: "Tamil", code: "ta" },
    { name: "Urdu", code: "ur" },
    { name: "Gujarati", code: "gu" },
    { name: "Kannada", code: "kn" },
    { name: "Odia", code: "or" },
    { name: "Malayalam", code: "ml" },
    { name: "Punjabi", code: "pa" },
    { name: "Assamese", code: "as" },
    { name: "Maithili", code: "mai" },
    { name: "Sanskrit", code: "sa" },
    { name: "Santali", code: "sat" },
    { name: "Kashmiri", code: "ks" },
    { name: "Nepali", code: "ne" },
    { name: "Konkani", code: "kok" },
    { name: "Dogri", code: "doi" },
    { name: "Sindhi", code: "sd" },
    { name: "Bodo", code: "brx" }
  ];
  
  const handleLanguageClick = (event) => {
    setAnchorElLanguage(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorElLanguage(null);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.name);
    handleLanguageClose();
    
    // Store the selected language in localStorage for persistence
    localStorage.setItem('selectedLanguage', language.name);
    localStorage.setItem('languageCode', language.code);
    
    // IMPORTANT: Do NOT set dir attribute to keep layout stable
    // Only set the language code
    document.documentElement.setAttribute('lang', language.code);
    
    // Create a style element to apply language-specific fonts
    let styleElement = document.getElementById('language-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'language-style';
      document.head.appendChild(styleElement);
    }
    
    // Set appropriate font families based on script
    const fontStyleMapping = {
      default: "'Segoe UI', 'Roboto', sans-serif",
      devanagari: "'Nirmala UI', 'Mangal', sans-serif", 
      bengali: "'Nirmala UI', 'Shonar Bangla', sans-serif",
      telugu: "'Nirmala UI', 'Gautami', sans-serif",
      tamil: "'Nirmala UI', 'Latha', sans-serif",
      urdu: "'Aldhabi', 'Urdu Typesetting', sans-serif",
      gujarati: "'Nirmala UI', 'Shruti', sans-serif"
    };
    
    // Map languages to their script families
    const scriptFamily = (() => {
      if (['hi', 'mr', 'sa', 'ne', 'mai', 'doi'].includes(language.code)) return 'devanagari';
      if (['bn', 'as'].includes(language.code)) return 'bengali';
      if (language.code === 'te') return 'telugu';
      if (language.code === 'ta') return 'tamil';
      if (['ur', 'ks', 'sd'].includes(language.code)) return 'urdu';
      if (language.code === 'gu') return 'gujarati';
      return 'default';
    })();
    
    // Apply ONLY the font style to prevent layout changes
    const fontFamily = fontStyleMapping[scriptFamily];
    styleElement.textContent = `
      :root {
        --selected-language-font: ${fontFamily};
      }
      .language-content {
        font-family: var(--selected-language-font);
      }
    `;
    
    // No changes to textarea alignment or direction to keep layout stable
    
    // Actually translate the existing messages if we have any
    if (messages.length > 0 && language.code !== 'en') {
      setLoading(true);
      
      // Create a copy of the current messages array
      const messagesToTranslate = [...messages];
      
      // Process each message that needs translation (AI responses)
      const translatePromises = messagesToTranslate.map(async (msg, index) => {
        // Only translate AI responses (not user messages)
        if (msg.role === 'assistant') {
          try {
            // Create a translation request
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: msg.content,
                targetLanguage: language.code
              }),
            });
            
            const data = await response.json();
            
            if (data && data.translatedText) {
              // Update this specific message with translated content
              messagesToTranslate[index] = {
                ...msg,
                content: data.translatedText,
                originalContent: msg.originalContent || msg.content // Save original for switching back
              };
            }
          } catch (error) {
            console.error("Translation error:", error);
            // Keep original content on error
          }
        }
        return msg;
      });
      
      // Wait for all translations to complete
      Promise.all(translatePromises)
        .then(() => {
          // Update the messages state with translated content
          setMessages(messagesToTranslate);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error translating messages:", error);
          setLoading(false);
        });
    }
    
    // Create a language-specific message
    const message = `${language.name} language selected`;
    
    // Show a toast notification when language is changed
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
      <div style="
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(49, 130, 206, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 80%;
        text-align: center;
        font-weight: 500;
        line-height: 1.5;
      ">
        ${message}
      </div>
    `;
    document.body.appendChild(messageElement);
    setTimeout(() => document.body.removeChild(messageElement), 2000);
  };
  
  // Add a function to strip HTML tags but preserve formatting
  const stripHtml = (html) => {
    if (!html) return '';
    
    // Create a temporary div to work with the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process markdown-style headings and formatting elements
    const processNode = (node) => {
      let result = '';
      
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Special handling for different element types to preserve formatting
        switch (node.tagName.toLowerCase()) {
          case 'br':
            result += '\n';
            break;
          case 'p':
            // Process children then add double newline after paragraphs
            for (const child of node.childNodes) {
              result += processNode(child);
            }
            result += '\n\n';
            break;
          case 'div':
            // Process children then add newline
            for (const child of node.childNodes) {
              result += processNode(child);
            }
            result += '\n';
            break;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            // Make headings stand out with newlines before and after
            result += '\n' + node.textContent + '\n\n';
            break;
          case 'ul':
          case 'ol':
            // Process list items
            result += '\n';
            for (const child of node.childNodes) {
              result += processNode(child);
            }
            result += '\n';
            break;
          case 'li':
            // Add bullet points or numbers for list items
            result += '• ' + node.textContent + '\n';
            break;
          case 'pre':
            // For preformatted text (like code blocks), maintain all whitespace
            result += '\n' + node.textContent + '\n\n';
            break;
          case 'hr':
            // Horizontal rules become visible separators
            result += '\n---\n\n';
            break;
          case 'blockquote':
            // Format blockquotes with > prefix
            const lines = node.textContent.split('\n');
            result += '\n' + lines.map(line => '> ' + line).join('\n') + '\n\n';
            break;
          default:
            // Default behavior for other elements: just process children
            for (const child of node.childNodes) {
              result += processNode(child);
            }
        }
      }
      
      return result;
    };
    
    // Process the entire content
    let text = processNode(tempDiv);
    
    // Handle special content patterns
    text = text
      .replace(/---/g, '---\n')  // Make sure separators have newlines
      .replace(/\n{3,}/g, '\n\n'); // Replace multiple consecutive newlines with just two
    
    // Look for list patterns and format them properly
    text = text.replace(/^(\d+)\.\s(.+)/gm, '$1. $2');
    
    return text.trim();
  };
  
  // Initialize clipboard functionality
  useEffect(() => {
    // Custom copy function that strips HTML
    const clipboard = new Clipboard('.copy-button', {
      text: function(trigger) {
        const messageId = trigger.getAttribute('data-message-id');
        const htmlContent = trigger.getAttribute('data-clipboard-text');
        return stripHtml(htmlContent);
      }
    });
    
    clipboard.on('success', (e) => {
      const messageId = e.trigger.getAttribute('data-message-id');
      
      // Check if it's a user message (format: user-123456) or AI message (format: 123456)
      if (messageId && messageId.startsWith('user-')) {
        // For user messages, store the ID with the "user-" prefix
        setCopiedMessageId(messageId);
      } else {
        // For AI messages, convert to number as before
        setCopiedMessageId(parseInt(messageId));
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      
      e.clearSelection();
    });
    
    return () => {
      clipboard.destroy();
    };
  }, []);
  
  // Set up chat container scrolling behavior
  useEffect(() => {
    // Reset any overflow restrictions but keep proper scrolling for messages
    document.documentElement.style.height = "";
    document.body.style.height = "";
    document.body.style.margin = "";
    document.body.style.padding = "";
    document.body.style.overflow = "auto"; // Allow normal scrolling

    // Only apply fixed layout if messages exist
    if (messages.length > 0) {
      const chatContainer = document.querySelector(".rbt-daynamic-page-content");
      if (chatContainer) {
        chatContainer.style.overflow = "auto"; // Enable scrolling
        chatContainer.style.height = "calc(100vh - 160px)"; // Set height but leave room for input
        chatContainer.style.scrollBehavior = "smooth"; // Smooth scrolling
        chatContainer.style.paddingBottom = "80px"; // Space for input
      }
      
      // Fix the main content wrapper
      const mainContent = document.querySelector(".rbt-main-content");
      if (mainContent) {
        mainContent.style.height = "100%"; 
        mainContent.style.overflow = "visible"; // Ensure content is visible
      }
    } else {
      // Keep original behavior for welcome screen
      const chatContainer = document.querySelector(".rbt-daynamic-page-content");
      if (chatContainer) {
        chatContainer.style.overflow = ""; 
        chatContainer.style.height = "";
        chatContainer.style.scrollBehavior = "";
      }
      
      // Original main content behavior for welcome screen
      const mainContent = document.querySelector(".rbt-main-content");
      if (mainContent) {
        mainContent.style.display = "block";
        mainContent.style.height = "";
        mainContent.style.overflow = "visible";
      }
    }
  }, [messages]);
  
  // Scroll to bottom when messages change but with fewer jumps
  useEffect(() => {
    if (messagesEndRef.current && !isTyping) {
      // Only do smooth scrolling when not typing
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);
  
  // Improve scrolling behavior without jumping
  useEffect(() => {
    // Only scroll if there are messages
    if (messages.length > 0) {
      // Set up smooth scrolling with proper behavior
      const mainContent = document.querySelector(".rbt-main-content");
      if (mainContent) {
        mainContent.style.scrollBehavior = "smooth";
      }
      
      // Ensure proper scrolling for content area
      const dynamicContent = document.querySelector(".rbt-daynamic-page-content");
      if (dynamicContent) {
        // Add overflow properties for better scrolling
        dynamicContent.style.overflowY = "auto";
        dynamicContent.style.overflowX = "hidden";
        dynamicContent.style.scrollBehavior = "smooth"; // Smooth scrolling
        
        // Only scroll on new messages, not during typing
        if (!isTyping) {
          // Use a small timeout to ensure content is rendered before scrolling
          setTimeout(() => {
            // Scroll without animation to avoid jumps
            dynamicContent.scrollTo({
              top: dynamicContent.scrollHeight,
              behavior: "auto"
            });
          }, 100);
        }
      }
    }
  }, [messages, isTyping]);
  
  // Handle key down events (e.g., Enter key)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Helper function to scroll chat to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        // Scroll to the bottom of messages with smooth behavior
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
        
        // In case the smooth scroll doesn't work, force scroll after a short delay
        setTimeout(() => {
          const chatContainer = document.querySelector('.chat-box-section');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 200);
      } catch (e) {
        console.error("Error scrolling to bottom:", e);
      }
    }
  };
  
  // Helper function to check if a message is brainstorming-related
  const isBrainstormingQuery = (text) => {
    const brainstormTerms = ['brainstorm', 'creative ideas', 'generate ideas', 'think of', 'generate options', 'suggest alternatives'];
    const textLower = text.toLowerCase();
    return brainstormTerms.some(term => textLower.includes(term));
  };
  
  // Helper function to format current date and time as a timestamp
  const getFormattedTimestamp = () => {
    const now = new Date();
    
    // Format: DD MMM YYYY, HH:MM AM/PM
    const options = { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return now.toLocaleString('en-US', options);
  };
  
  // Submit the message and get a response
  const handleSendMessage = async () => {
    // Re-enable login check to show the popup when user is not logged in
   // if (!isLoggedIn) {
    //   setShowLoginModal(true);
    //   return;
    // }

    if (!newMessage.trim() || loading || isTyping) return;
    
    const userMessage = newMessage.trim();
    setNewMessage("");
    
    // Add user message to chat
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(),
        title: "You",
        desc: userMessage,
        response: {
          role: "assistant",
          content: "<span style='color: #6b7280;'>Thinking...</span>",
        },
      },
    ]);
    
    // Check if this is a brainstorming query
    const messageIsBrainstorming = isBrainstormingQuery(userMessage);
    
    // Only maintain brainstorming mode if the current message is related to brainstorming
    // Otherwise, exit brainstorming mode if the message is not related
    const currentTime = Date.now();
    const timeSinceLastNotification = currentTime - lastBrainstormNotificationTime;
    const showNotification = timeSinceLastNotification > 5000; // Only show notification if it's been more than 5 seconds
    
    if (isBrainstormMode && !messageIsBrainstorming && messages.length > 0) {
      setIsBrainstormMode(false);
      if (showNotification) {
        toast.info("Exiting brainstorming mode");
        setLastBrainstormNotificationTime(currentTime);
      }
    } else if (!isBrainstormMode && messageIsBrainstorming) {
      setIsBrainstormMode(true);
      if (showNotification) {
        toast.info("Entering brainstorming mode");
        setLastBrainstormNotificationTime(currentTime);
      }
    }
    
    // Check if it's a news-related query and not in brainstorm mode
    if (!isBrainstormMode && !messageIsBrainstorming && isNewsRelatedQuery(userMessage)) {
      handleNewsQuery(userMessage);
      return;
    }
    
    setLoading(true);
    
    try {
      let responseText;
      
      // Check if the query is asking for real-time data
      const isRealTimeQuery = /^(what is|show me|tell me|current|latest|today|now|cm of|chief minister of|weather|news|update|status)/i.test(userMessage);
      
      if (isRealTimeQuery) {
        // Get real-time data response
        const response = await fetch('/api/tavily-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: userMessage }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch real-time data');
        }

        const data = await response.json();
        console.log('Received data from tavily:', data);
        
        // Create a clean HTML response
        let responseHtml = `<div>
          <p>${data.answer || 'Here\'s what I found:'}</p>`;
        
        // Add results section if available
        if (data.results && data.results.length > 0) {
          responseHtml += `<div style="margin-top: 16px;">`;
          data.results.slice(0, 3).forEach(result => {
            responseHtml += `<div style="margin-bottom: 12px;">
              <a href="${result.url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                ${result.title}
              </a>
              <p style="margin-top: 4px; color: #4b5563; font-size: 14px;">
                ${result.content}
              </p>
            </div>`;
          });
          responseHtml += `</div>`;
        }
        
        // Add images section if available
        if (data.images && data.images.length > 0) {
          responseHtml += `<div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px;">`;
          data.images.slice(0, 3).forEach(img => {
            responseHtml += `<div style="width: 200px; margin-bottom: 8px;">
              <img src="${img.url}" alt="${img.title || 'Related image'}" style="width: 100%; max-height: 150px; border-radius: 4px; object-fit: cover;" />
            </div>`;
          });
          responseHtml += `</div>`;
        }
        
        responseHtml += `</div>`;
        responseText = responseHtml;
      } else if (isBrainstormMode || isBrainstormingQuery(userMessage)) {
        // Use reasoning model for all questions in brainstorming mode
        responseText = await handleBrainstormResponse(userMessage);
      } else {
        // Regular chat response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: messages.map(msg => ({
              role: msg.title.toLowerCase() === 'you' ? 'user' : 'assistant',
              content: msg.desc
            }))
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get response from AI');
        }
        
        const data = await response.json();
        responseText = data.response;
      }
      
      // Get the current language code from localStorage
      const currentLanguageCode = localStorage.getItem('languageCode') || 'en';
      
      // Translate the response if not in English
      if (currentLanguageCode !== 'en') {
        try {
          // Use the translate API
          const translationResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: responseText,
              targetLanguage: currentLanguageCode
            }),
          });
          
          if (translationResponse.ok) {
            const translationData = await translationResponse.json();
            if (translationData && translationData.translatedText) {
              // Store both original and translated text
              responseText = {
                translated: translationData.translatedText,
                original: responseText
              };
            }
          }
        } catch (translationError) {
          console.error("Translation error:", translationError);
          // Continue with original text if translation fails
        }
      }
      
      // Format and animate typing - handle both string and object response formats
      const textToDisplay = typeof responseText === 'object' && responseText.translated 
        ? responseText.translated 
        : responseText;
      
      const formattedResponse = formatResponse(textToDisplay);
      
      // Store the original response if available
      if (typeof responseText === 'object' && responseText.original) {
        // Update the messages array with the original content
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0) {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              originalResponse: responseText.original
            };
          }
          return newMessages;
        });
      }
      
      typeResponseWithState(formattedResponse);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Fallback to the local generateResponse function if API fails
      try {
        console.log("Falling back to local response generation");
        const fallbackResponse = generateResponse(userMessage);
        const formattedResponse = formatResponse(fallbackResponse);
        typeResponseWithState(formattedResponse);
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
        
        // Update with error message - with better visibility
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = { ...newMessages[newMessages.length - 1] };
          lastMessage.response.content = "<span style='color: #ef4444; font-weight: 500;'>Sorry, there was an error processing your request. Please try again.</span>";
          newMessages[newMessages.length - 1] = lastMessage;
          return newMessages;
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Wrapper for typeResponse that includes state management
  const typeResponseWithState = (content) => {
    // Pass the shouldStopGeneration state and its setter
    typeResponse(content, setMessages, setIsTyping, shouldStopGeneration, setShouldStopGeneration);
    
    // Clear the spinner after a short delay to ensure typing has started
    setTimeout(() => {
      setLoading(false);
      setShowSpinner(false);
    }, 1000);
  };
  
  // Handle news related queries
  const handleNewsQuery = async (query) => {
    // Show loading message
    for (let i = 3; i >= 1; i--) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.response.content = `<span style='color: #3b82f6; font-weight: 500;'>Searching for today's news ${i}...</span>`;
        newMessages[newMessages.length - 1] = lastMessage;
        return newMessages;
      });
      scrollToBottom();
    }
    
    // Extract category and prepare the query
    const category = extractNewsCategory(query);
    
    // Add explicit terms to improve search
    let enhancedQuery = query;
    
    // Add today's date terms to ensure fresh news
    if (!query.toLowerCase().includes('today') && !query.toLowerCase().includes('latest')) {
      const today = new Date();
      enhancedQuery = `${query} today latest`;
    }
    
    // Add current year and month if not already in query
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    if (!query.includes(String(currentYear))) {
      enhancedQuery = `${enhancedQuery} ${currentYear}`;
    }
    
    try {
      // Make API call to news endpoint with explicit parameters
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category,
          query: enhancedQuery,
        }),
      });
      
      // Show an intermediate progress message
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.response.content = `<span style='color: #3b82f6; font-weight: 500;'>Found news results. Formatting articles...</span>`;
        newMessages[newMessages.length - 1] = lastMessage;
        return newMessages;
      });
      
      if (!response.ok) {
        throw new Error(`News API responded with status: ${response.status}`);
      }
      
      const newsData = await response.json();
      
      // Check for valid news data
      if (newsData.isPlaceholder) {
        throw new Error('News API is currently unavailable. Using fallback data.');
      }
      
      if (!newsData.articles || newsData.articles.length === 0) {
        throw new Error('No news found for the given query. Try a different topic.');
      }
      
      // Format and display the news data
      const formattedNews = formatNewsForResponse(newsData.articles);
      
      // Update message with news data
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.response.content = formattedNews;
        newMessages[newMessages.length - 1] = lastMessage;
        return newMessages;
      });
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching news:", error);
      
      // Try to call a different news source as backup
      try {
        // Create a more informative error message
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = { ...newMessages[newMessages.length - 1] };
          lastMessage.response.content = `<span style='color: #f59e0b; font-weight: 500;'>Primary news source unavailable. Trying alternative source...</span>`;
          newMessages[newMessages.length - 1] = lastMessage;
          return newMessages;
        });
        
        // Try a different news API (like Bing News or GNews)
        // For this example, we'll use the News API's top headlines as fallback
        const fallbackResponse = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: category,
            // Don't use the query, just get top headlines in the category
          }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error('Fallback news source also failed');
        }
        
        const fallbackData = await fallbackResponse.json();
        
        if (!fallbackData.articles || fallbackData.articles.length === 0) {
          throw new Error('No news found in the fallback source');
        }
        
        // Format the fallback news data
        const formattedFallbackNews = formatNewsForResponse(fallbackData.articles);
        
        // Update with a note about using fallback source
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = { ...newMessages[newMessages.length - 1] };
          lastMessage.response.content = `
            <div style="padding: 10px; background-color: #fffbeb; border-left: 3px solid #f59e0b; margin-bottom: 16px; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Note:</strong> Specific news matching "${query}" couldn't be found. Showing top headlines in the ${category} category instead.
              </p>
            </div>
            ${formattedFallbackNews}
          `;
          newMessages[newMessages.length - 1] = lastMessage;
          return newMessages;
        });
        scrollToBottom();
      } catch (fallbackError) {
        console.error("Even fallback news source failed:", fallbackError);
        
        // Update with a comprehensive error message
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = { ...newMessages[newMessages.length - 1] };
          lastMessage.response.content = `
            <div style="padding: 16px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 16px;">
              <h4 style="color: #b91c1c; margin-top: 0; margin-bottom: 8px; font-size: 16px;">News Service Temporarily Unavailable</h4>
              <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                I'm sorry, but I couldn't retrieve the latest news at this time. This could be due to API rate limits or network issues.
              </p>
              <p style="color: #7f1d1d; margin: 8px 0 0 0; font-size: 14px;">
                Please try again later or try a different query.
              </p>
            </div>
          `;
          newMessages[newMessages.length - 1] = lastMessage;
          return newMessages;
        });
      }
    }
    scrollToBottom();
  };
  
  // Handle PDF file upload
  const handlePDFUpload = async (file) => {
    try {
      setLoading(true);
      setShowSpinner(true);
      
      // Check if the file is an image
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        console.log('Image uploaded for analysis:', file.name);
        
        // Create form data for the file upload
        const imageFormData = new FormData();
        imageFormData.append('image', file);
        
        // Call the API to extract text from the image
        const imageResponse = await fetch('/api/extract-image-text', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!imageResponse.ok) {
          const imageErrorData = await imageResponse.json();
          console.error('Error extracting image text:', imageErrorData);
          showToast('Failed to extract text from image');
          setLoading(false);
          setShowSpinner(false);
          return;
        }
        
        const imageData = await imageResponse.json();
        console.log('Image extracted:', imageData);
        
        if (!imageData.success || !imageData.text) {
          console.error('No text found in image');
          showToast('No readable text found in the image');
          setLoading(false);
          setShowSpinner(false);
          return;
        }
        
        // Add a message from the user
        const imageUserMessage = {
          id: Date.now(),
          title: 'You',
          desc: 'Here is an image I would like you to analyze and describe.',
          response: {
            role: 'assistant',
            content: '<span style="color: #6b7280;">Analyzing image...</span>',
          },
        };
        
        setMessages(prev => [...prev, imageUserMessage]);
        setNewMessage('');
        
        // Send the image content for analysis with specific system message for image analysis
        let analysisPrompt = '';
        let systemPrompt = '';
        
        if (imageData.isChildLetter) {
          analysisPrompt = `This appears to be a child's letter or note. Please analyze it carefully and provide a detailed breakdown.
          
Extracted Text: ${imageData.text}

Confidence Score: ${imageData.confidence}%

Note: This is likely handwritten text by a child, so there may be spelling errors and OCR misinterpretations.`;

          systemPrompt = `You are an expert at analyzing children's handwritten letters and notes. Follow this exact structure in your response:

1) Interpretation and Empathy:
[Provide a warm, empathetic interpretation of what the child is trying to communicate, focusing on the emotional content and underlying meaning]

2) Spelling Mistakes and Corrections:
[Provide a detailed list of all possible OCR or spelling mistakes in the format "- 'original text' likely intended to be 'correction'"]

3) Description of the Letter/Note:
[Describe what kind of letter this is (e.g., letter to Santa, note to parents) and its main purpose]

4) Warm, Understanding Tone:
[Provide a warm concluding message that shows understanding of the child's intent, speaking directly to them in a supportive voice]

Your analysis must follow this exact four-section structure with the numbered headings exactly as shown above.`;
        } else if (imageData.isTechnicalDocument) {
          // For technical documents
          analysisPrompt = `This appears to be a technical document. Please analyze it carefully and provide corrections.
          
Extracted Text: ${imageData.text}

Confidence Score: ${imageData.confidence}%

Note: This text comes from a technical document that may contain specialized terminology.`;

          systemPrompt = `You are an expert at analyzing technical documents with OCR errors. Follow this exact structure in your response:

### Text Content Summary
[Provide a brief summary of the main content extracted from the image, focusing on the primary subject matter and purpose]

### Corrected Text
[Provide the fully corrected text with all OCR errors fixed, maintaining the original formatting but with proper spelling and technical terms. This section should read as a perfect, error-free version of the document.]

### Key Technical Terms
[List and briefly define any specialized technical terms found in the document]

### Document Purpose
[Explain what this document appears to be (e.g., assignment, technical specification, research description) and what it's intended to communicate]

Your analysis must follow this exact four-section structure with the headings exactly as shown above, with no spelling errors or OCR artifacts in your response.`;
        } else if (imageData.isHandwriting) {
          // For other handwritten text (not children's letters)
          analysisPrompt = `This appears to be handwritten text. Please analyze it carefully.
          
Extracted Text: ${imageData.text}

Confidence Score: ${imageData.confidence}%

Note: This is handwritten text, so there may be OCR misinterpretations.`;

          systemPrompt = `You are an expert at analyzing handwritten text with OCR errors. Follow this exact structure in your response:

### Text Content Extracted
[Describe the main text content that was extracted from the image]

### Potential Errors in Text Extraction
[Provide a detailed bulleted list of all possible OCR mistakes in the format "- 'original text' should likely be 'correction'"]

### Image Description Based on Text
[Describe what the image likely shows based on the text content]

### Analysis Summary
[Provide a brief summary of what this text represents and its likely purpose]

Your analysis must follow this exact four-section structure with the headings exactly as shown above.`;
        } else {
          // For printed text
          analysisPrompt = `Please analyze this image and the extracted text content.

Extracted Text: ${imageData.text}

Confidence Score: ${imageData.confidence}%`;

          systemPrompt = `You are an expert at analyzing text extracted from images. Follow this exact structure in your response:

### Text Content Summary
[Summarize the main text content extracted from the image]

### Potential OCR Errors
[List any potential OCR errors that may have occurred]

### Content Analysis
[Analyze what this text is about and its purpose]

### Formatted Text
[Present the text in a properly formatted way, correcting any obvious errors]

Your analysis must follow this exact four-section structure with the headings exactly as shown above.`;
        }
        
        try {
          const imageAnalysisResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: analysisPrompt,
              system: systemPrompt,
            })
          });
          
          if (!imageAnalysisResponse.ok) {
            throw new Error('Failed to get image analysis');
          }
          
          const analysisData = await imageAnalysisResponse.json();
          
          // Format and animate typing the response
          let formattedResponse = formatResponse(analysisData.response);
          
          // Add a small note about the text type
          let noteStyle, noteText;
          
          if (imageData.isChildLetter) {
            noteStyle = `padding: 12px; background-color: #fdf5e6; border-left: 3px solid #f59e0b; margin-bottom: 16px; border-radius: 6px;`;
            noteText = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background-color: #f59e0b; border-radius: 50%;">
                  <span style="color: white; font-weight: bold; font-size: 14px;">i</span>
                </div>
                <div>
                  <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">This appears to be a child's handwritten text</p>
                  <p style="margin: 4px 0 0 0; color: #92400e; font-size: 13px;">The AI provides both text extraction and thoughtful interpretation</p>
                </div>
              </div>
            `;
            
            // Add the original extracted text in a code block for reference (optional)
            const extractedTextBlock = `
              <div style="margin-top: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #4b5563;">Extracted Text:</p>
                <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; font-size: 14px; color: #374151; line-height: 1.5; overflow-x: auto; max-height: 200px; overflow-y: auto;">
                  ${imageData.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
              </div>
            `;
            
            // Only show extracted text if confidence is low
            formattedResponse = `<div style="${noteStyle}">${noteText}</div>${imageData.confidence < 80 ? extractedTextBlock : ''}${formattedResponse}`;
          } else if (imageData.isTechnicalDocument) {
            // Special formatting for technical documents
            noteStyle = `padding: 12px; background-color: #f0f7ff; border-left: 3px solid #2563eb; margin-bottom: 16px; border-radius: 6px;`;
            noteText = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background-color: #2563eb; border-radius: 50%;">
                  <span style="color: white; font-weight: bold; font-size: 14px;">i</span>
                </div>
                <div>
                  <p style="margin: 0; color: #1e3a8a; font-size: 14px; font-weight: 500;">Technical Document Analysis</p>
                  <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 13px;">OCR has processed technical content with ${imageData.confidence.toFixed(1)}% confidence</p>
                </div>
              </div>
            `;
            
            // Add corrections if available
            let correctionsBlock = '';
            if (imageData.corrections && imageData.corrections.length > 0) {
              correctionsBlock = `
                <div style="margin-top: 12px; margin-bottom: 12px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #4b5563;">Corrections Applied:</p>
                  <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
                    ${imageData.corrections.map(c => `<li>"${c.original}" → "${c.correction}"</li>`).join('')}
                  </ul>
                </div>
              `;
            }
            
            formattedResponse = `<div style="${noteStyle}">${noteText}${correctionsBlock}</div>${formattedResponse}`;
          } else if (imageData.isHandwriting) {
            // For other handwritten text
            noteStyle = `padding: 12px; background-color: #f0f9ff; border-left: 3px solid #3b82f6; margin-bottom: 16px; border-radius: 6px;`;
            noteText = `
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background-color: #3b82f6; border-radius: 50%;">
                  <span style="color: white; font-weight: bold; font-size: 14px;">i</span>
                </div>
                <div>
                  <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 500;">Handwritten text detected</p>
                  <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 13px;">OCR accuracy may vary. Extracted with ${imageData.confidence.toFixed(1)}% confidence</p>
                </div>
              </div>
            `;
            
            // Add the original extracted text in a code block for reference
            const extractedTextBlock = `
              <div style="margin-top: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #4b5563;">Extracted Text:</p>
                <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; font-size: 14px; color: #374151; line-height: 1.5; overflow-x: auto; max-height: 200px; overflow-y: auto;">
                  ${imageData.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
              </div>
            `;
            
            formattedResponse = `<div style="${noteStyle}">${noteText}</div>${imageData.confidence < 80 ? extractedTextBlock : ''}${formattedResponse}`;
          }
          
          typeResponseWithState(formattedResponse);
        } catch (error) {
          console.error('Error during image analysis:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = { ...newMessages[newMessages.length - 1] };
            lastMessage.response.content = "<span style='color: #ef4444;'>I'm sorry, there was an error analyzing the image. Please try again or upload a different image.</span>";
            newMessages[newMessages.length - 1] = lastMessage;
            return newMessages;
          });
          
          setLoading(false);
          setShowSpinner(false);
        }
      } else {
        // Original PDF handling code
        console.log('PDF uploaded, extracting text...');
        
        // Create form data for the file upload
        const formData = new FormData();
        formData.append('pdf', file);
        
        // Call the API to extract text from the PDF
        const response = await fetch('/api/extract-pdf-text', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error extracting PDF text:', errorData);
          showToast('Failed to extract text from PDF');
          setLoading(false);
          setShowSpinner(false);
          return;
        }
        
        const data = await response.json();
        console.log('PDF extracted:', data);
        
        if (!data.success || !data.text) {
          console.error('No text found in PDF');
          showToast('No readable text found in the PDF');
          setLoading(false);
          setShowSpinner(false);
          return;
        }
        
        // Extract a reasonable amount of text from the PDF
        // Take more text to ensure a good summary
        const maxLength = 12000; // Increased from 8000
        let extractedText = data.text.substring(0, maxLength);
        if (data.text.length > maxLength) {
          extractedText += '... (content truncated)';
        }
        
        // Generate a prompt for the PDF summary
        const prompt = `Please provide a comprehensive summary of this document: \n\n${extractedText}`;
        console.log('Sending PDF text for summary, length:', prompt.length);
        
        // Add a message from the user
        const userMessage = {
          id: Date.now(),
          title: 'You',
          desc: 'Here is a PDF document I would like you to analyze and summarize for me.',
          response: {
            role: 'assistant',
            content: '<span style="color: #6b7280;">Thinking...</span>',
          },
        };
        
        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        
        // Send the PDF content for analysis
        try {
          // Using the same API endpoint as regular messages
          const summaryResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: prompt,
              system: "You are an expert document analyst specializing in creating detailed, structured summaries. When summarizing documents: 1) Identify and highlight the main topics and key points, 2) Organize information into clear sections with headers where appropriate, 3) Extract important facts, figures, and conclusions, 4) Maintain the original document's core meaning and intent, 5) Format your summary with bullet points for key information, 6) Include a brief overview at the beginning. Be thorough but concise. Use markdown formatting for headers and sections."
            })
          });
          
          if (!summaryResponse.ok) {
            const errorData = await summaryResponse.json();
            console.error('Error getting PDF summary:', errorData);
            const errorMessage = errorData.error || 'Failed to get summary';
            
            // Update the message with the error
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = { ...newMessages[newMessages.length - 1] };
              lastMessage.response.content = `<span style="color: #ef4444;">I'm sorry, I encountered an error analyzing this PDF: ${errorMessage}</span>`;
              newMessages[newMessages.length - 1] = lastMessage;
              return newMessages;
            });
            
            setLoading(false);
            setShowSpinner(false);
            return;
          }
          
          const summaryData = await summaryResponse.json();
          console.log('Summary response:', summaryData);
          
          // Get the summary text
          const summaryText = summaryData.response;
          
          if (!summaryText) {
            console.error('No summary returned');
            // Update the message with the error
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = { ...newMessages[newMessages.length - 1] };
              lastMessage.response.content = "<span style='color: #ef4444;'>I'm sorry, I couldn't generate a summary for this document. The document may be too complex or in a format I cannot process effectively.</span>";
              newMessages[newMessages.length - 1] = lastMessage;
              return newMessages;
            });
            
            setLoading(false);
            setShowSpinner(false);
            return;
          }
          
          // Format the summary text
          const formattedSummary = formatResponse(summaryText);
          
          // Type the response with animation
          typeResponseWithState(formattedSummary);
          
          // Update the last message with the formatted summary
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const lastMessageIndex = newMessages.length - 1;
            if (lastMessageIndex >= 0) {
              newMessages[lastMessageIndex] = {
                ...newMessages[lastMessageIndex],
                response: {
                  ...newMessages[lastMessageIndex].response,
                  content: formattedSummary,
                },
              };
            }
            return newMessages;
          });
          
          // Scroll to the bottom after a short delay to ensure content is rendered
          setTimeout(scrollToBottom, 300);
        } catch (error) {
          console.error('Error during PDF analysis:', error);
          // Update the message with the error
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = { ...newMessages[newMessages.length - 1] };
            lastMessage.response.content = "<span style='color: #ef4444;'>I'm sorry, there was an error analyzing the PDF. Please try again or upload a different document.</span>";
            newMessages[newMessages.length - 1] = lastMessage;
            return newMessages;
          });
          
          setLoading(false);
          setShowSpinner(false);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      showToast('Error processing file');
      setLoading(false);
      setShowSpinner(false);
    }
  };
  
  // Handle speech to text conversion
  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    if (isListening) {
      // Stop listening
      recognition.stop();
      setIsListening(false);
      return;
    }
    
    // Start listening
    setIsListening(true);
    recognition.start();
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewMessage(transcript);
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error("Error in speech recognition. Please try again.");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
  };
  
  // Handle brainstorm button click
  const handleBrainstormClick = () => {
    const currentTime = Date.now();
    setLastBrainstormNotificationTime(currentTime);
    
    if (isBrainstormMode) {
      // If already in brainstorm mode, turn it off
      setIsBrainstormMode(false);
      toast.info("Brainstorming mode disabled");
      return;
    }
    
    // Set brainstorm mode to true without clearing messages
    setIsBrainstormMode(true);
    
    // Show notification
    toast.info("Brainstorming mode enabled");
  };
  
  // Handle brainstorm response with reasoning model
  const handleBrainstormResponse = async (prompt) => {
    try {
      // Create a timestamp for response tracking
      const responseTimestamp = Date.now();
      
      // Function to ensure proper scrolling during generation
      const ensureScrollVisible = () => {
        // Scroll all possible containers to bottom
        const containers = [
          document.querySelector(".rbt-daynamic-page-content"),
          document.querySelector(".chat-list"),
          document.querySelector(".rbt-main-content")
        ];
        
        containers.forEach(container => {
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth"
            });
          }
        });
        
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      };
      
      // Set up an interval to keep scrolling during generation
      const scrollInterval = setInterval(ensureScrollVisible, 800);
      
      // Add thinking indicator with improved styling
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.response.content = `<div style="color: #3b82f6; font-weight: 500;">
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 10px;">Thinking creatively</span>
            <div class="typing-dots">
              <span style="animation-delay: 0s;">.</span>
              <span style="animation-delay: 0.2s;">.</span>
              <span style="animation-delay: 0.4s;">.</span>
            </div>
          </div>
        </div>`;
        newMessages[newMessages.length - 1] = lastMessage;
        return newMessages;
      });
      
      // Make API call to OpenAI with specific instructions for creative reasoning
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          system: `You are a creative brainstorming assistant that uses systematic reasoning to generate innovative ideas.
            - Focus on the exact question or topic the user has provided
            - Use step-by-step thinking to explore concepts thoroughly
            - Consider multiple perspectives and diverse angles
            - Provide structured, detailed explanations for each idea
            - Present a variety of creative solutions with reasoning for why each could work
            - If appropriate, organize ideas into categories or themes
            - Always remain focused on the specific brainstorming request`,
          history: messages.map(msg => ({
            role: msg.title.toLowerCase() === 'you' ? 'user' : 'assistant',
            content: msg.desc
          }))
        }),
      });
      
      // Clear the scroll interval
      clearInterval(scrollInterval);
      
      if (!response.ok) {
        throw new Error('Failed to get brainstorm response');
      }
      
      const data = await response.json();
      
      // Final scroll to ensure visibility
      setTimeout(ensureScrollVisible, 100);
      setTimeout(ensureScrollVisible, 500); // Second scroll after content settles
      
      return data.response;
    } catch (error) {
      console.error("Error in brainstorming:", error);
      return `<div style="color: #ef4444; font-weight: 500; padding: 10px; border-left: 3px solid #ef4444; background-color: #fef2f2;">
        I'm having trouble generating creative ideas right now. Please try again with a different approach or topic.
      </div>`;
    }
  };
  
  // Make sure message content is properly formatted
  useEffect(() => {
    if (messages.length > 0) {
      // Style message content specifically
      const messageContents = document.querySelectorAll(".editable");
      if (messageContents && messageContents.length > 0) {
        messageContents.forEach(content => {
          content.style.maxWidth = "100%";
          content.style.overflowWrap = "break-word";
          content.style.wordWrap = "break-word";
          content.style.wordBreak = "break-word";
          content.style.whiteSpace = "pre-wrap"; // Preserve line breaks
        });
      }
      
      // Fix any pre-formatted code blocks for proper display
      const codeBlocks = document.querySelectorAll("pre, code");
      if (codeBlocks && codeBlocks.length > 0) {
        codeBlocks.forEach(block => {
          block.style.maxWidth = "100%";
          block.style.overflow = "auto";
          block.style.backgroundColor = "#f5f5f5";
          block.style.padding = "8px";
          block.style.borderRadius = "4px";
          block.style.fontFamily = "monospace";
          block.style.fontSize = "14px";
          block.style.whiteSpace = "pre"; // Keep pre formatting
          block.style.tabSize = "2";
          block.style.overflowX = "auto"; // Horizontal scrolling
        });
      }
    }
  }, [messages]);
  
  // Add styling for typing animation
  useEffect(() => {
    // Create and inject the CSS animation for typing dots
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes typingDot {
        0% { opacity: 0.3; transform: translateY(0px); }
        50% { opacity: 1; transform: translateY(-2px); }
        100% { opacity: 0.3; transform: translateY(0px); }
      }
      
      .typing-dots span {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: currentColor;
        margin: 0 2px;
        animation: typingDot 1s infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
    
    // Clean up
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Handle stop button click
  const handleStopGeneration = () => {
    // Set the flag to stop generation
    setShouldStopGeneration(true);
    
    // Also force isTyping to false immediately for faster UI response
    setIsTyping(false);
    
    // Clear the loading spinner
    setShowSpinner(false);
    setLoading(false);
    
    // Apply a direct check to stop any typeResponse instances that might be running
    const stopSignalEvent = new CustomEvent('stopGeneration');
    document.dispatchEvent(stopSignalEvent);
  };
  
  // Setup PDF.js for PDF processing
  useEffect(() => {
    // Add PDF.js script if not already loaded
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        console.log('PDF.js library loaded successfully');
      };
      
      script.onerror = () => {
        console.error('Failed to load PDF.js library');
      };
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);
  
  // Add an effect to show a notification when brainstorming mode changes
  useEffect(() => {
    if (isBrainstormMode) {
      // Make sure notification is visible to the user
      scrollToBottom();
    }
  }, [isBrainstormMode]);
  
  // Process brainstorm click and update messages
  const processBrainstormClick = (content) => {
    // Add message showing we're processing
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(),
        title: "Assistant",
        desc: content,
        response: {
          role: "assistant",
          content: content,
        },
      },
    ]);
    scrollToBottom();
  };
  
  // Add this function near the other utility functions
  const showToast = (message, type = 'error') => {
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'success') {
      toast.success(message);
    } else if (type === 'info') {
      toast.info(message);
    } else {
      toast.info(message);
    }
  };
  
  // Load selected language from localStorage on page load
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const savedLanguageCode = localStorage.getItem('languageCode');
    
    if (savedLanguage && savedLanguageCode) {
      setSelectedLanguage(savedLanguage);
      
      // Define language direction (RTL or LTR)
      const rtlLanguages = ['ur', 'ks', 'sd'];
      const direction = rtlLanguages.includes(savedLanguageCode) ? 'rtl' : 'ltr';
      
      // Set language attributes on document root
      document.documentElement.setAttribute('lang', savedLanguageCode);
      document.documentElement.setAttribute('dir', direction);
      
      // Set appropriate font families based on script
      const fontStyleMapping = {
        default: "'Segoe UI', 'Roboto', sans-serif",
        devanagari: "'Nirmala UI', 'Mangal', sans-serif", 
        bengali: "'Nirmala UI', 'Shonar Bangla', sans-serif",
        telugu: "'Nirmala UI', 'Gautami', sans-serif",
        tamil: "'Nirmala UI', 'Latha', sans-serif",
        urdu: "'Aldhabi', 'Urdu Typesetting', sans-serif",
        gujarati: "'Nirmala UI', 'Shruti', sans-serif"
      };
      
      // Map languages to their script families
      const scriptFamily = (() => {
        if (['hi', 'mr', 'sa', 'ne', 'mai', 'doi'].includes(savedLanguageCode)) return 'devanagari';
        if (['bn', 'as'].includes(savedLanguageCode)) return 'bengali';
        if (savedLanguageCode === 'te') return 'telugu';
        if (savedLanguageCode === 'ta') return 'tamil';
        if (['ur', 'ks', 'sd'].includes(savedLanguageCode)) return 'urdu';
        if (savedLanguageCode === 'gu') return 'gujarati';
        return 'default';
      })();
      
      // Apply the font style
      let styleElement = document.getElementById('language-style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'language-style';
        document.head.appendChild(styleElement);
      }
      
      const fontFamily = fontStyleMapping[scriptFamily];
      styleElement.textContent = `
        :root {
          --selected-language-font: ${fontFamily};
        }
        .language-content {
          font-family: var(--selected-language-font);
        }
      `;
    }
  }, []);
  
  // Track language changes and translate messages when language changes
  useEffect(() => {
    // Get the language code from localStorage
    const currentLanguageCode = localStorage.getItem('languageCode');
    
    // Skip if no language is set or it's English
    if (!currentLanguageCode || currentLanguageCode === 'en') {
      return;
    }
    
    // Skip if no messages to translate
    if (messages.length === 0) {
      return;
    }
    
    // Set loading state
    setLoading(true);
    
    // Create a copy of the messages array
    const messagesToTranslate = [...messages];
    
    // Process each message that needs translation (only AI responses)
    const translatePromises = messagesToTranslate.map(async (msg, index) => {
      // Only translate AI responses (not user messages)
      if (msg.title.toLowerCase() !== 'you' && !msg.originalResponse) {
        try {
          // Create a translation request
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: msg.desc,
              targetLanguage: currentLanguageCode
            }),
          });
          
          const data = await response.json();
          
          if (data && data.translatedText) {
            // Update this specific message with translated content
            messagesToTranslate[index] = {
              ...msg,
              desc: data.translatedText,
              originalResponse: msg.desc // Save original for switching back
            };
          }
        } catch (error) {
          console.error("Translation error:", error);
          // Keep original content on error
        }
      }
      return msg;
    });
    
    // Wait for all translations to complete
    Promise.all(translatePromises)
      .then(() => {
        // Update the messages state with translated content
        setMessages(messagesToTranslate);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error translating messages:", error);
        setLoading(false);
      });
  }, [selectedLanguage]); // Only run when selected language changes
  
  // Comment out YouTube handlers
  // const handleYoutubeClick = () => {
  //   setShowYoutubeModal(true);
  // };
  
  // const handleYoutubeClose = () => {
  //   setShowYoutubeModal(false);
  // };
  
  // const handleYoutubeSubmit = () => {
  //   if (!youtubeUrl.trim()) {
  //     showToast("Please enter a YouTube URL", "warning");
  //     return;
  //   }
  
  //   const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  //   if (!youtubeRegex.test(youtubeUrl)) {
  //     showToast("Please enter a valid YouTube URL", "warning");
  //     return;
  //   }
  
  //   const userMessageId = Date.now();
  //   const assistantMessageId = userMessageId + 1;
  
  //   setMessages((prevMessages) => [
  //     ...prevMessages,
  //     {
  //       id: userMessageId,
  //       title: "You",
  //       desc: `Summarize this YouTube video: ${youtubeUrl}`,
  //       response: null
  //     },
  //     {
  //       id: assistantMessageId,
  //       title: "ब्रह्मांड AI",
  //       desc: "",
  //       response: {
  //         role: "assistant",
  //         content: "<span style='color: #6b7280;'>Analyzing YouTube video...</span>",
  //       },
  //     }
  //   ]);
  
  //   const videoUrlToProcess = youtubeUrl;
  //   setYoutubeUrl("");
  //   setShowYoutubeModal(false);
  
  //   setTimeout(scrollToBottom, 100);
  
  //   fetch('/api/get_summary', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ videoUrl: videoUrlToProcess }),
  //   })
  //     .then(response => {
  //       if (!response.ok) {
  //         return response.json().then(errorData => {
  //           throw new Error(errorData.error || `Server responded with status ${response.status}`);
  //         });
  //       }
  //       return response.json();
  //     })
  //     .then(data => {
  //       if (data.success && data.summary) {
  //         const formattedSummary = data.summary
  //           .replace(/\*\*(.*?)\*\*/g, '<strong style="display: block; margin-bottom: 10px; margin-top: 10px; font-size: 17px; color: #111827;">$1</strong>')
  //           .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
  //           .replace(/\n/g, '<br>')
  //           .replace(/(\d+)\.\s(.*?)(?=<br>|<\/p>|$)/g, 
  //             '<div style="display: flex; margin: 8px 0;"><span style="min-width: 24px; margin-right: 8px; font-weight: 500;">$1.</span><span>$2</span></div>')
  //           .replace(/\-\s(.*?)(?=<br>|<\/p>|$)/g, 
  //             '<div style="display: flex; margin: 8px 0;"><span style="min-width: 24px; margin-right: 8px;">•</span><span>$1</span></div>');
          
  //         const wrappedSummary = formattedSummary.startsWith('<p') 
  //           ? formattedSummary 
  //           : `<p style="margin: 12px 0;">${formattedSummary}</p>`;
          
  //         setMessages(prevMessages => {
  //           const newMessages = [...prevMessages];
  //           const assistantMessageIndex = newMessages.findIndex(msg => msg.id === assistantMessageId);
          
  //           if (assistantMessageIndex >= 0) {
  //             newMessages[assistantMessageIndex] = {
  //               ...newMessages[assistantMessageIndex],
  //               response: {
  //                 ...newMessages[assistantMessageIndex].response,
  //                 content: wrappedSummary,
  //               },
  //             };
  //           }
  //           return newMessages;
  //         });
  //       } else {
  //         const errorMessage = data.error || "Failed to analyze video";
  //         setMessages(prevMessages => {
  //           const newMessages = [...prevMessages];
  //           const assistantMessageIndex = newMessages.findIndex(msg => msg.id === assistantMessageId);
          
  //           if (assistantMessageIndex >= 0) {
  //             newMessages[assistantMessageIndex] = {
  //               ...newMessages[assistantMessageIndex],
  //               response: {
  //                 ...newMessages[assistantMessageIndex].response,
  //                 content: `<span style='color: #ef4444;'>Error: ${errorMessage}</span>`,
  //               },
  //             };
  //           }
  //           return newMessages;
  //         });
  //         showToast(errorMessage, "error");
  //       }
      
  //       setTimeout(scrollToBottom, 300);
  //     })
  //     .catch(error => {
  //       console.error('Error processing YouTube video:', error);
      
  //       let errorMessage = "Error processing YouTube video";
      
  //       if (error.message.includes("captions")) {
  //         errorMessage = "This video does not have captions available. Please try a different video.";
  //       } else if (error.message.includes("Could not extract")) {
  //         errorMessage = "Could not extract video information. Please check the URL and try again.";
  //       } else if (error.message) {
  //         errorMessage = error.message;
  //       }
      
  //       setMessages(prevMessages => {
  //         const newMessages = [...prevMessages];
  //         const assistantMessageIndex = newMessages.findIndex(msg => msg.id === assistantMessageId);
        
  //         if (assistantMessageIndex >= 0) {
  //           newMessages[assistantMessageIndex] = {
  //             ...newMessages[assistantMessageIndex],
  //             response: {
  //               ...newMessages[assistantMessageIndex].response,
  //               content: `<span style='color: #ef4444;'>Error: ${errorMessage}</span>`,
  //             },
  //           };
  //         }
  //         return newMessages;
  //       });
  //       showToast(errorMessage, "error");
      
  //       setTimeout(scrollToBottom, 300);
  //     });
  // };
  
  // Clear any existing timestamp intervals that might be lingering
  useEffect(() => {
    if (window.timestampIntervals && window.timestampIntervals.length > 0) {
      window.timestampIntervals.forEach(interval => clearInterval(interval));
      window.timestampIntervals = [];
    }
  }, []);
  
  // Main component render
  return (
    <>
      <ToastContainer />
      <PageHead title="ब्रह्मांड AI" description="AI-powered chatbot for personalized assistance" keywords="AI, chatbot, personalized assistance, machine learning">
        {/* No custom CSS here */}
      </PageHead>
      <main className="page-wrapper">
        <div className="rbt-panel-wrapper">
          <Context>
            <LeftDashboardSidebar />
            <HeaderDashboard display="" />
            
            <div className={`rbt-main-content ${styles.mainContent}`}>
              {/* Powered by section - premium text-based design */}
              <div style={{
                textAlign: 'center',
                padding: '45px 0 15px', /* Increased top padding to move down */
                margin: '10px 0 20px', /* Added margin to create space */
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{
                  display: 'inline-block',
                  borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                  paddingBottom: '6px',
                  marginBottom: '8px'
                }}>
                  <a 
                    href="/about" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textDecoration: 'none',
                      letterSpacing: '0.3px'
                    }}
                  >
                    Brahamand.ai
                  </a>
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '500',
                  letterSpacing: '0.2px'
                }}>
                Powered by ROBUSTRIX IT SOLUTIONS
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '500',
                  letterSpacing: '0.2px',
                  marginTop: '5px'
                }}>
                  <a 
                    href="https://vividhotsava.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none'
                    }}
                  >
                    Vividhotsava
                  </a> 2025 CSJMU 14 April to 16 Apr&apos;25
                </div>
              </div>
              
              <div className={`rbt-daynamic-page-content ${styles.pageContent}`}>
                <div className="rbt-dashboard-content">
                  <div className="content-page">
                    <div className={`chat-box-section ${styles.chatBoxSection}`}>
                      {messages.length === 0 ? (
                        <div
                          className={`slider-area slider-style-1 variation-default slider-bg-image bg-banner1 slider-bg-shape ${styles.welcomeScreen}`}
                          data-black-overlay="1"
                          style={{ margin: 0, padding: 0 }}
                        >
                          <div className="container">
                            <div className="row justify-content-center">
                              <div className="col-lg-12">
                                <div className="inner text-center mt--20">
                                  <Logo />
                                  <h1
                                    className={styles.welcomeTitle}
                                    style={{ color: "#000000 !important" }}
                                  >
                                    How can I help you? <br /> मैं आपकी क्या मदद
                                    कर सकता हूं ?
                                  </h1>

                                  <div
                                    className={`form-group ${styles.chatInputForm}`}
                                  >
                                    {/* Tool Grid Start */}
                                    <div className={styles.toolGrid} style={{ width: '100%', maxWidth: '100%' }}>
                                      {[
                                        { 
                                          title: 'PDF Analysis', 
                                          link: '/pdf-analysis', 
                                          icon: DocumentIcon,
                                          color: '#2196F3',
                                          hoverColor: '#1976D2'
                                        },
                                        { 
                                          title: 'Weather Forecast', 
                                          link: '/weather-forecast', 
                                          icon: SunIcon,
                                          color: '#9C27B0',
                                          hoverColor: '#7B1FA2'
                                        },
                                        { 
                                          title: 'News Updates', 
                                          link: '/news-updates', 
                                          icon: MegaphoneIcon,
                                          color: '#FF9800',
                                          hoverColor: '#F57C00'
                                        },
                                        { 
                                          title: 'Stock Market', 
                                          link: '/stock-market', 
                                          icon: CurrencyDollarIcon,
                                          color: '#00BCD4',
                                          hoverColor: '#0097A7'
                                        },
                                        { 
                                          title: 'Image Generator', 
                                          link: '/image-generator', 
                                          icon: SparklesIcon,
                                          color: '#4CAF50',
                                          hoverColor: '#388E3C'
                                        },
                                        { 
                                          title: 'Kundli', 
                                          link: '/kundli', 
                                          icon: SparklesIcon,
                                          color: '#673AB7',
                                          hoverColor: '#512DA8'
                                        }
                                      ].map((tool) => {
                                        const ToolIcon = tool.icon;
                                        return (
                                          <Link href={tool.link} key={tool.title} passHref style={{ width: '100%' }}>
                                            <motion.div className={styles.toolItem}
                                              style={{
                                                width: '100%',
                                                maxWidth: '100%'
                                              }}
                                              whileHover={{ 
                                                y: -4,
                                                boxShadow: `0 8px 16px ${tool.color}20`,
                                                backgroundColor: `${tool.color}05`
                                              }}
                                              transition={{ 
                                                duration: 0.2,
                                                ease: 'easeOut'
                                              }}
                                            >
                                              <motion.div className={styles.toolIcon}
                                                style={{
                                                  backgroundColor: `${tool.color}10`
                                                }}
                                              >
                                                <ToolIcon 
                                                  className={styles.toolIconSvg}
                                                  style={{ 
                                                    color: tool.color,
                                                    width: '20px',
                                                    height: '20px'
                                                  }} 
                                                />
                                              </motion.div>
                                              <span className={styles.toolTitle}>
                                                {tool.title}
                                              </span>
                                            </motion.div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                    {/* Tool Grid End */}

                                    <div className={styles.inputWithChips}>
                                      <textarea
                                        name="text"
                                        className={styles.chatTextarea}
                                        cols="30"
                                        rows="2"
                                        placeholder="नमस्ते..."
                                        value={newMessage}
                                        onChange={(e) =>
                                          setNewMessage(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                      />

                                      <div className={styles.chipContainer}>
                                        <button
                                          className={styles.uploadButton}
                                          onClick={() => {
                                            document.getElementById("file-upload-input").click();
                                          }}
                                          title="Upload PDF or image for analysis"
                                          onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "#3b82f6"; 
                                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                          }}
                                          onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = ""; 
                                            e.currentTarget.style.boxShadow = "";
                                          }}
                                        >
                                          <i className={`fa-sharp fa-regular fa-plus ${styles.uploadIcon}`}></i>
                                        </button>
                                        <input
                                          id="file-upload-input"
                                          type="file"
                                          accept="application/pdf,image/*"
                                          onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                              // Use the updated handlePDFUpload function
                                              handlePDFUpload(file);
                                              // Reset the file input
                                              e.target.value = null;
                                            }
                                          }}
                                          style={{ display: "none" }}
                                        />
                                        <Chip
                                          avatar={
                                            <Avatar
                                              alt="icon"
                                              src="/images/icons/ai.png"
                                            />
                                          }
                                          label="Brain storm"
                                          variant="contained"
                                          style={{
                                            fontSize: "15px",
                                            backgroundColor: isBrainstormMode ? "#3b82f6" : "#f8f8f8",
                                            padding: "8px 4px",
                                            height: "36px",
                                            borderRadius: "18px",
                                            boxShadow: isBrainstormMode ? "0 4px 8px rgba(59, 130, 246, 0.3)" : "0 2px 4px rgba(0,0,0,0.05)",
                                            border: isBrainstormMode ? "none" : "1px solid #e0e0e0",
                                            transition: "all 0.2s ease",
                                            color: isBrainstormMode ? "white" : "#000000",
                                            fontWeight: "400"
                                          }}
                                          onClick={handleBrainstormClick}
                                          onMouseOver={(e) => {
                                            if (!isBrainstormMode) {
                                              e.currentTarget.style.backgroundColor = "#3b82f6";
                                              e.currentTarget.style.color = "white";
                                              e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                            }
                                          }}
                                          onMouseOut={(e) => {
                                            if (!isBrainstormMode) {
                                              e.currentTarget.style.backgroundColor = "#f8f8f8";
                                              e.currentTarget.style.color = "#000000";
                                              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                            }
                                          }}
                                        />
                                        <Chip
                                          icon={<MicIcon style={{ color: isListening ? '#fff' : 'inherit' }} />}
                                          label={isListening ? "Listening..." : "Speech to Text"}
                                          variant="contained"
                                          className={isListening ? "pulse-animation" : ""}
                                          sx={{
                                            '& .MuiChip-label': {
                                              paddingLeft: '8px',
                                              paddingRight: '8px',
                                              fontSize: '14px'
                                            },
                                            height: '36px'
                                          }}
                                          style={{
                                            fontSize: "14px",
                                            backgroundColor: isListening ? "#ff4d4f" : "#f8f8f8",
                                            height: "36px",
                                            borderRadius: "18px",
                                            color: isListening ? '#ffffff' : '#000000',
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                            border: isListening ? "none" : "1px solid #f0f0f0",
                                            padding: "0px 4px"
                                          }}
                                          onClick={handleSpeechToText}
                                          onMouseOver={(e) => {
                                            if (!isListening) {
                                              e.currentTarget.style.backgroundColor = "#3b82f6";
                                              e.currentTarget.style.color = "white";
                                              e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                            }
                                          }}
                                          onMouseOut={(e) => {
                                            if (!isListening) {
                                              e.currentTarget.style.backgroundColor = "#f8f8f8";
                                              e.currentTarget.style.color = "#000000";
                                              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                            }
                                          }}
                                        />
                                        <Chip
                                          color="primary"
                                          icon={<LanguageIcon />}
                                          label="Search News"
                                          onClick={() => {
                                            // Redirect to news-updates page
                                            window.location.href = '/news-updates';
                                          }}
                                          clickable
                                          style={{
                                            fontSize: "15px",
                                            backgroundColor: "#f8f8f8",
                                            height: "36px",
                                            borderRadius: "18px",
                                            color: "#000000",
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                            border: "1px solid #f0f0f0",
                                            padding: "8px 4px"
                                          }}
                                          onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "#3b82f6";
                                            e.currentTarget.style.color = "white";
                                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                          }}
                                          onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "#f8f8f8";
                                            e.currentTarget.style.color = "#000000";
                                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                          }}
                                        />
                                        <Chip
                                          color="primary"
                                          icon={<TranslateIcon />}
                                          label={selectedLanguage}
                                          onClick={handleLanguageClick}
                                          clickable
                                          style={{
                                            fontSize: "15px",
                                            backgroundColor: "#f8f8f8",
                                            height: "36px",
                                            borderRadius: "18px",
                                            color: "#000000",
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                            border: "1px solid #f0f0f0",
                                            padding: "8px 4px"
                                          }}
                                          onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "#3b82f6";
                                            e.currentTarget.style.color = "white";
                                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                          }}
                                          onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "#f8f8f8";
                                            e.currentTarget.style.color = "#000000";
                                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                          }}
                                        />
                                        <Menu
                                          anchorEl={anchorElLanguage}
                                          open={Boolean(anchorElLanguage)}
                                          onClose={handleLanguageClose}
                                          PaperProps={{
                                            style: {
                                              maxHeight: 300,
                                              width: 200,
                                              borderRadius: "12px",
                                              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                                            }
                                          }}
                                        >
                                          {indianLanguages.map((language) => (
                                            <MenuItem 
                                              key={language.code} 
                                              onClick={() => handleLanguageSelect(language)}
                                              selected={selectedLanguage === language.name}
                                              sx={{
                                                "&.Mui-selected": {
                                                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                                                },
                                                "&:hover": {
                                                  backgroundColor: "rgba(59, 130, 246, 0.05)",
                                                }
                                              }}
                                            >
                                              <ListItemText primary={language.name} />
                                            </MenuItem>
                                          ))}
                                        </Menu>
                                      </div>
                                      <div className="d-flex" style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        width: "100%",
                                        marginBottom: "0",
                                        paddingBottom: "0"
                                      }}>
                                        <div style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          width: "100%",
                                          maxHeight: "fit-content",
                                          overflow: "hidden"
                                        }}>
                                          <button
                                            type="button"
                                            className="btn-default"
                                            onClick={() => {
                                              // Check if user is already logged in
                                              if (isLoggedIn || localStorage.getItem("isLoggedIn") === "1") {
                                                // If logged in, proceed directly to chat
                                                const initialTextarea = document.querySelector('#slider-text-area');
                                                if (initialTextarea && initialTextarea.value.trim()) {
                                                  // We're in the initial landing view
                                                  const value = initialTextarea.value.trim();
                                                  setNewMessage(value);
                                                  
                                                  console.log("Setting message from initial view:", value);
                                                  
                                                  // Trigger handleSendMessage after a short delay to ensure state update
                                                  setTimeout(() => {
                                                    handleSendMessage();
                                                    initialTextarea.value = '';
                                                  }, 100);
                                                } else {
                                                  // Try the alternate approach - just use the newMessage state directly
                                                  console.log("Using direct approach with newMessage state");
                                                  if (newMessage.trim()) {
                                                    handleSendMessage();
                                                  } else {
                                                    console.log("No message to send");
                                                  }
                                                }
                                              } else {
                                                // If not logged in, show login modal
                                                setShowLoginModal(true);
                                              }
                                            }}
                                            style={{
                                              padding: "16px 30px",
                                              fontSize: "18px",
                                              fontWeight: "600",
                                              borderRadius: "12px",
                                              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                                              color: "white",
                                              boxShadow: "0 4px 8px rgba(37, 99, 235, 0.4)",
                                              border: "none",
                                              cursor: "pointer",
                                              opacity: "1",
                                              transition: "all 0.3s ease",
                                              textAlign: "center",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center"
                                            }}
                                            onMouseOver={(e) => {
                                              e.currentTarget.style.background = 'linear-gradient(90deg, #1d4ed8, #2563eb)';
                                              e.currentTarget.style.boxShadow = "0 6px 12px rgba(37, 99, 235, 0.5)";
                                              e.currentTarget.style.transform = "translateY(-2px)";
                                            }}
                                            onMouseOut={(e) => {
                                              e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb, #3b82f6)';
                                              e.currentTarget.style.boxShadow = "0 4px 8px rgba(37, 99, 235, 0.4)";
                                              e.currentTarget.style.transform = "translateY(0)";
                                            }}
                                          >
                                            Start with ब्रह्मांड AI
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        messages.map((data, index) => (
                          <div key={`message-${data.id}`}>
                            <div className="chat-box-list pb-0" style={{ marginBottom: "0", paddingBottom: "0" }}>
                              <div className="chat-box author-speech" style={{ marginBottom: "0" }}>
                                <div className="inner" style={{ paddingBottom: "0" }}>
                                  <div className="chat-section" style={{ marginBottom: "0" }}>
                                    <div className="author">
                                    </div>
                                    <div className="chat-content text-end">
                                      <h6 className="title me-4">
                                        {data.title}
                                      </h6>
                                      <div className="position-relative">
                                        <div 
                                          className="editable me-4"
                                          style={{ 
                                            color: "#111827", 
                                            fontSize: "16px", 
                                            lineHeight: "1.5",
                                            maxWidth: "100%",
                                            overflowWrap: "break-word",
                                            wordWrap: "break-word",
                                            fontWeight: "500"
                                          }}
                                          dangerouslySetInnerHTML={{ __html: data.desc }}
                                        />
                                        <button 
                                          className="copy-button form-icon" 
                                          data-clipboard-text={data.desc}
                                          data-message-id={`user-${data.id}`}
                                          title="Copy to clipboard"
                                          style={{
                                            position: 'absolute',
                                            top: '24px',
                                            right: '-5px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '5px',
                                            color: isDarkMode ? '#fff' : '#333',
                                            zIndex: 1
                                          }}
                                        >
                                          {copiedMessageId === `user-${data.id}` ? (
                                            <i className="fa-solid fa-check" style={{ color: '#4CAF50' }}></i>
                                          ) : (
                                            <i className="fa-regular fa-copy"></i>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {data.response && (
                                <div
                                  className="chat-box ai-speech"
                                  style={{ marginBottom: "20px" }}
                                >
                                  <div className="inner">
                                    <div className="chat-section">
                                      <div className="author">
                                        <LogoCon />
                                      </div>
                                      <div className="chat-content">
                                        <h6 className="title">ब्रह्मांड AI</h6>
                                        <div className="position-relative">
                                          <div
                                            style={{ 
                                              color: "#111827", 
                                              fontSize: "16px", 
                                              lineHeight: "1.5",
                                              maxWidth: "100%",
                                              overflowWrap: "break-word",
                                              wordWrap: "break-word",
                                              whiteSpace: "normal",
                                              overflow: "hidden"
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html: data.response.content,
                                            }}
                                          />
                                          <button 
                                            className="copy-button form-icon" 
                                            data-clipboard-text={data.response.content}
                                            data-message-id={data.id}
                                            title="Copy to clipboard"
                                            style={{
                                              position: 'absolute',
                                              top: '24px',
                                              right: '-5px',
                                              background: 'transparent',
                                              border: 'none',
                                              cursor: 'pointer',
                                              padding: '5px',
                                              color: isDarkMode ? '#fff' : '#333',
                                              zIndex: 1
                                            }}
                                          >
                                            {copiedMessageId === data.id ? (
                                              <i className="fa-solid fa-check" style={{ color: '#4CAF50' }}></i>
                                            ) : (
                                              <i className="fa-regular fa-copy"></i>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {index === messages.length - 1 && (
                              <div 
                                className="rbt-static-bar" 
                                data-theme={isDarkMode ? "dark" : "light"}
                                style={{
                                  backgroundColor: isDarkMode ? "#1a1b26" : "#ffffff",
                                  boxShadow: "0px -10px 25px -5px rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <form
                                  className="new-chat-form border-gradient"
                                  onSubmit={(e) => e.preventDefault()}
                                >
                                  {isBrainstormMode && (
                                    <div style={{
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      borderLeft: '3px solid #3b82f6',
                                      padding: '8px 12px',
                                      marginBottom: '12px',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar
                                          alt="icon"
                                          src="/images/icons/ai.png"
                                          style={{ width: 20, height: 20, marginRight: 8 }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 500 }}>
                                          Brainstorming Mode Active
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setIsBrainstormMode(false);
                                          toast.info("Brainstorming mode disabled");
                                        }}
                                        style={{
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          color: '#3b82f6',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          padding: '4px 8px',
                                          borderRadius: '4px'
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        Disable
                                      </button>
                                    </div>
                                  )}
                                  <div style={{ 
                                    display: "flex",
                                    flexDirection: "column", 
                                    margin: "10px auto 0",
                                    padding: "0 15px",
                                    width: "100%",
                                    maxWidth: "650px"
                                  }}>
                                    <div style={{
                                      width: "100%",
                                      marginBottom: "12px"
                                    }}>
                                      <textarea
                                        rows="1"
                                        placeholder="Send a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        style={{
                                          width: "100%",
                                          resize: "none",
                                          border: "none",
                                          outline: "none",
                                          fontSize: "16px",
                                          padding: "10px 0"
                                        }}
                                      />
                                    </div>
                                    
                                    {/* Combined row of buttons */}
                                    <div style={{ 
                                      display: "flex", 
                                      justifyContent: "flex-start", 
                                      alignItems: "center",
                                      width: "100%",
                                      marginBottom: "12px",
                                      gap: "10px",
                                      position: "relative",
                                      paddingRight: "50px",
                                      flexWrap: "wrap"
                                    }}>
                                      <input
                                        id="file-upload-input-chat"
                                        type="file"
                                        accept="application/pdf,image/*"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            handlePDFUpload(file);
                                            e.target.value = null;
                                          }
                                        }}
                                        style={{ display: "none" }}
                                      />
                                      <button
                                        style={{
                                          width: "36px",
                                          height: "36px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          backgroundColor: "#2a2b32",
                                          borderRadius: "50%",
                                          cursor: "pointer",
                                          border: "none",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                          transition: "all 0.2s ease"
                                        }}
                                        onClick={() => {
                                          document.getElementById("file-upload-input-chat").click();
                                        }}
                                        title="Upload PDF or image for analysis"
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.backgroundColor = "#3b82f6"; 
                                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.backgroundColor = "#2a2b32"; 
                                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                                        }}
                                      >
                                        <i className="fa-sharp fa-regular fa-plus" style={{ fontSize: "14px", color: "#fff" }}></i>
                                      </button>
                                      
                                      <Chip
                                        avatar={<Avatar alt="icon" src="/images/icons/ai.png" sx={{ width: 24, height: 24 }} />}
                                        label="Brain storm"
                                        variant="contained"
                                        sx={{
                                          '& .MuiChip-label': {
                                            paddingLeft: '8px',
                                            paddingRight: '8px',
                                            fontSize: '14px'
                                          },
                                          height: '36px'
                                        }}
                                        style={{
                                          fontSize: "14px",
                                          backgroundColor: isBrainstormMode ? "#3b82f6" : "#f8f8f8",
                                          padding: "0px 4px",
                                          height: "36px",
                                          borderRadius: "18px",
                                          boxShadow: isBrainstormMode ? "0 4px 8px rgba(59, 130, 246, 0.3)" : "0 2px 4px rgba(0,0,0,0.05)",
                                          border: isBrainstormMode ? "none" : "1px solid #e0e0e0",
                                          transition: "all 0.2s ease",
                                          color: isBrainstormMode ? "white" : "#000000",
                                          fontWeight: "400"
                                        }}
                                        onClick={handleBrainstormClick}
                                        onMouseOver={(e) => {
                                          if (!isBrainstormMode) {
                                            e.currentTarget.style.backgroundColor = "#3b82f6";
                                            e.currentTarget.style.color = "white";
                                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                          }
                                        }}
                                        onMouseOut={(e) => {
                                          if (!isBrainstormMode) {
                                            e.currentTarget.style.backgroundColor = "#f8f8f8";
                                            e.currentTarget.style.color = "#000000";
                                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                          }
                                        }}
                                      />
                                        
                                      <Chip
                                        icon={<MicIcon style={{ color: isListening ? '#fff' : 'inherit' }} />}
                                        label={isListening ? "Listening..." : "Speech to Text"}
                                        variant="contained"
                                        className={isListening ? "pulse-animation" : ""}
                                        sx={{
                                          '& .MuiChip-label': {
                                            paddingLeft: '8px',
                                            paddingRight: '8px'
                                          }
                                        }}
                                        style={{
                                          fontSize: "15px",
                                          backgroundColor: isListening ? "#ff4d4f" : "#f8f8f8",
                                          height: "36px",
                                          borderRadius: "18px",
                                          color: isListening ? '#ffffff' : '#000000',
                                          transition: "all 0.3s ease",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                          border: isListening ? "none" : "1px solid #f0f0f0",
                                          padding: "0px 4px"
                                        }}
                                        onClick={handleSpeechToText}
                                        onMouseOver={(e) => {
                                          if (!isListening) {
                                            e.currentTarget.style.backgroundColor = "#3b82f6";
                                            e.currentTarget.style.color = "white";
                                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                          }
                                        }}
                                        onMouseOut={(e) => {
                                          if (!isListening) {
                                            e.currentTarget.style.backgroundColor = "#f8f8f8";
                                            e.currentTarget.style.color = "#000000";
                                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                          }
                                        }}
                                      />

                                      <Chip
                                        icon={<LanguageIcon />}
                                        label="Search News"
                                        onClick={() => {
                                          setNewMessage("Show me news about technology");
                                          setTimeout(() => {
                                            handleSendMessage();
                                            const messageElement = document.createElement('div');
                                            messageElement.innerHTML = `<div style="position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: rgba(49, 130, 206, 0.9); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">Try \"Show me news about [any topic]\" for customized updates!</div>`;
                                              document.body.appendChild(messageElement);
                                              setTimeout(() => document.body.removeChild(messageElement), 5000);
                                          }, 100);
                                        }}
                                        clickable
                                        sx={{
                                          '& .MuiChip-label': {
                                            paddingLeft: '8px',
                                            paddingRight: '8px',
                                            fontSize: '14px'
                                          },
                                          height: '36px'
                                        }}
                                        style={{
                                          fontSize: "14px",
                                          backgroundColor: "#f8f8f8",
                                          height: "36px",
                                          borderRadius: "18px",
                                          color: "#000000",
                                          transition: "all 0.3s ease",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                          border: "1px solid #f0f0f0",
                                          padding: "0px 4px"
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.backgroundColor = "#3b82f6";
                                          e.currentTarget.style.color = "white";
                                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.backgroundColor = "#f8f8f8";
                                          e.currentTarget.style.color = "#000000";
                                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                        }}
                                      />
                                      
                                      <Chip
                                        icon={<TranslateIcon />}
                                        label={selectedLanguage}
                                        onClick={handleLanguageClick}
                                        clickable
                                        sx={{
                                          '& .MuiChip-label': {
                                            paddingLeft: '8px',
                                            paddingRight: '8px',
                                            fontSize: '14px'
                                          },
                                          height: '36px'
                                        }}
                                        style={{
                                          fontSize: "14px",
                                          backgroundColor: "#f8f8f8",
                                          height: "36px",
                                          borderRadius: "18px",
                                          color: "#000000",
                                          transition: "all 0.3s ease",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                          border: "1px solid #f0f0f0",
                                          padding: "0px 4px"
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.backgroundColor = "#3b82f6";
                                          e.currentTarget.style.color = "white";
                                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.3)";
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.backgroundColor = "#f8f8f8";
                                          e.currentTarget.style.color = "#000000";
                                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                        }}
                                      />
                                      
                                      <button
                                        className={`form-icon ${isTyping ? "icon-stop" : "icon-send"}`}
                                        onClick={isTyping ? handleStopGeneration : handleSendMessage}
                                        disabled={loading}
                                        style={{
                                          width: "44px",
                                          height: "44px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderRadius: "50%",
                                          border: "none",
                                          background: isTyping ? "linear-gradient(135deg, #ef4444, #f87171)" : "linear-gradient(135deg, #2563eb, #3b82f6)",
                                          boxShadow: isTyping ? "0 2px 5px rgba(239, 68, 68, 0.3)" : "0 2px 5px rgba(37, 99, 235, 0.3)",
                                          cursor: loading ? "not-allowed" : "pointer",
                                          opacity: loading ? "0.7" : "1",
                                          transition: "all 0.2s ease",
                                          position: "absolute",
                                          right: "10px",
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          willChange: "background, box-shadow"
                                        }}
                                        onMouseOver={(e) => {
                                          if (!loading) {
                                            if (isTyping) {
                                              e.currentTarget.style.background = "linear-gradient(135deg, #dc2626, #ef4444)";
                                              e.currentTarget.style.boxShadow = "0 4px 10px rgba(239, 68, 68, 0.4)";
                                            } else {
                                              e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8, #2563eb)";
                                              e.currentTarget.style.boxShadow = "0 4px 10px rgba(37, 99, 235, 0.4)";
                                            }
                                          }
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.background = isTyping ? "linear-gradient(135deg, #ef4444, #f87171)" : "linear-gradient(135deg, #2563eb, #3b82f6)";
                                          e.currentTarget.style.boxShadow = isTyping ? "0 2px 5px rgba(239, 68, 68, 0.3)" : "0 2px 5px rgba(37, 99, 235, 0.3)";
                                        }}
                                      >
                                        <i 
                                          className={`fa-sharp fa-solid ${isTyping ? "fa-stop" : "fa-paper-plane-top"}`}
                                          style={{ color: "#ffffff", fontSize: "18px" }}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                  
                                      <Menu
                                        anchorEl={anchorElLanguage}
                                        open={Boolean(anchorElLanguage)}
                                        onClose={handleLanguageClose}
                                        PaperProps={{
                                          style: {
                                            maxHeight: 300,
                                            width: 200,
                                            borderRadius: "12px",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                                          }
                                        }}
                                      >
                                        {indianLanguages.map((language) => (
                                          <MenuItem 
                                            key={language.code} 
                                            onClick={() => handleLanguageSelect(language)}
                                            selected={selectedLanguage === language.name}
                                            sx={{
                                              "&.Mui-selected": {
                                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                              },
                                              "&:hover": {
                                                backgroundColor: "rgba(59, 130, 246, 0.05)",
                                              }
                                            }}
                                          >
                                            <ListItemText primary={language.name} />
                                          </MenuItem>
                                        ))}
                                      </Menu>
                                </form>
                                <small className={styles.disclaimer}>ब्रह्मांड AI can be Imperfect. Check important info.</small>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Context>
        </div>
      </main>
      <BackToTop />
      
      {/* Login Modal */}
      <Dialog
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease-in-out'
          }
        }}
      >
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            p: 3,
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Box 
            sx={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <LockOpenIcon fontSize="large" sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color:'white !important' }}>
            Welcome to ब्रह्मांड AI
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, color:'white !important' }}>
            Sign in to unlock the full potential of AI
          </Typography>
        </Box>

        <DialogContent sx={{ p: 4, pt: 3 }}>
          <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Join thousands of users who are already exploring the power of AI with ब्रह्मांड
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => (window.location.href = "/signin")}
              sx={{ 
                py: 1.5, 
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                }
              }}
              fullWidth
            >
              Sign In with Email
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={() => (window.location.href = "/signup")}
              sx={{ 
                py: 1.5, 
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                }
              }}
              fullWidth
            >
              Create New Account
            </Button>
          </Box>
          
          {/* Removing the social login section */}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Typography variant="body2" color="textSecondary">
            By signing in, you agree to our{' '}
            <a href="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>Privacy Policy</a>
          </Typography>
        </DialogActions>
      </Dialog>
      
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes typing {
          0% { width: 0 }
          100% { width: 100% }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .loading-spinner {
          display: ${showSpinner ? 'flex' : 'none'};
          position: fixed;
          top: 20%;  /* Changed from 50% to 20% to be less intrusive */
          right: 20px; /* Position at the top right instead of center */
          left: auto; /* Remove left positioning */
          transform: translateY(-50%); /* Only translate in Y direction */
          z-index: 1000;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 10px;
          padding: 12px 16px;
          flex-direction: row;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-size: 14px;
          border: 1px solid #e5e7eb;
          gap: 8px;
          max-width: 180px;
        }
        
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
      `}</style>
      
      {/* Comment out YouTube Modal */}
      {/* <Dialog
        open={showYoutubeModal}
        onClose={handleYoutubeClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #FF0000 0%, #FF5252 100%)',
            p: 3,
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Box 
            sx={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <i className="fa-brands fa-youtube" style={{ color: "white", fontSize: "28px" }}></i>
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: 'white !important' }}>
            Analyze YouTube Video
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, color: 'white !important' }}>
            Enter a YouTube URL to analyze and summarize
          </Typography>
        </Box>

        <DialogContent sx={{ p: 4, pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            id="youtube-url"
            label="YouTube URL"
            type="url"
            fullWidth
            variant="outlined"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: youtubeUrl && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setYoutubeUrl("")} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleYoutubeSubmit();
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              onClick={handleYoutubeClose}
              sx={{ 
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: 'rgba(107, 114, 128, 0.08)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleYoutubeSubmit}
              sx={{ 
                backgroundColor: '#FF0000',
                '&:hover': {
                  backgroundColor: '#D32F2F'
                }
              }}
            >
              Analyze
            </Button>
          </Box>
        </DialogContent>
      </Dialog> */}
    </>
  );
};

export default HomePage;