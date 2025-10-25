import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import axios from "axios";
import sal from "sal.js";
import { useAppContext } from "@/context/Context";
import Logo from "@/components/Header/Logo";
import LogoCon from "@/components/Header/Logocon";
import Clipboard from 'clipboard';
import BackToTop from "../backToTop";
import PageHead from "../Head";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "https://api.openai.com/v1/chat/completions";

const TextGeneratorPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const isLightTheme = useAppContext();
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  const { isLoggedIn } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication and redirect if needed
  useEffect(() => {
    // Get the login status from localStorage as a backup
    const localStorageLoggedIn = localStorage.getItem("isLoggedIn") === "1";
    
    if (!isLoggedIn && !localStorageLoggedIn) {
      // Store the current path including the initial prompt to return after login
      const returnUrl = router.asPath;
      localStorage.setItem("returnAfterLogin", returnUrl);
      
      // Redirect to signin page
      router.push("/signin");
    } else {
      setAuthChecked(true);
    }
  }, [isLoggedIn, router]);

  // Handle initial prompt from URL only after auth check passes
  useEffect(() => {
    if (!authChecked) return;
    
    const { initialPrompt } = router.query;
    if (initialPrompt && !initialPromptProcessed) {
      const decodedPrompt = decodeURIComponent(initialPrompt);
      handleSendMessage(decodedPrompt);
      setInitialPromptProcessed(true);
    }
  }, [router.query, initialPromptProcessed, authChecked]);

  // Only render the component if authenticated
  if (!authChecked) {
    return <div className="loading-auth">Checking authentication...</div>;
  }

  useEffect(() => {
    sal(); // Initialize animations
  }, []);

  useEffect(() => {
    scrollToLastMessage(); // Scroll to the last message whenever messages state changes
  }, [messages]);

  // Initialize clipboard functionality
  useEffect(() => {
    const clipboard = new Clipboard('.copy-button', {
      text: function(trigger) {
        return trigger.getAttribute('data-clipboard-text');
      }
    });
    
    clipboard.on('success', (e) => {
      const messageId = e.trigger.getAttribute('data-message-id');
      setCopiedMessageId(parseInt(messageId));
      setTimeout(() => setCopiedMessageId(null), 2000);
      e.clearSelection();
    });
    
    return () => clipboard.destroy();
  }, []);

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || newMessage;
    if (!textToSend.trim()) return;
  
    setLoading(true);
    setError("");
    setNewMessage("");
  
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(),
        title: "You",
        desc: textToSend,
        response: {
          role: "assistant",
          content: "Thinking 5...",
        },
      },
    ]);

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  
    try {
      const API_KEY = process.env.OPENAI_API_KEY;
      if (!API_KEY) throw new Error("API key is missing.");
  
      const requestBody = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: textToSend }],
      };

      for (let i = 4; i >= 1; i--) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.response.content = `Thinking ${i}...`;
          return newMessages;
        });
      }
  
      const response = await axios.post(API_BASE_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });
  
      const assistantMessage = response.data?.choices?.[0]?.message?.content || "No response received.";
  
      let index = 0;
      const typingSpeed = 100;
      const totalLength = assistantMessage.length;
  
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.response.content = "";
        return newMessages;
      });
  
      const interval = setInterval(() => {
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
  
          if (index < totalLength) {
            lastMessage.response.content += assistantMessage.charAt(index);
            index++;
          } else {
            clearInterval(interval);
            setTimeout(scrollToLastMessage, 100);
          }
  
          return newMessages;
        });
      }, typingSpeed);
  
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to get response. Please try again.");
      setLoading(false);
      
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.response.content = "Error: Failed to get response. Please try again.";
        return newMessages;
      });
    }
  };

  const scrollToLastMessage = () => {
    if (messages.length > 0) {
      const lastMessageElement = document.getElementById(`message-${messages[messages.length - 1].id}`);
      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({ behavior: "smooth", block: "end" });
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
  };

  const handleInitialPrompt = async () => {
    if (!newMessage.trim()) return;
    await handleSendMessage();
  };

  return (
    <>
      <PageHead title="Text Generator" />
      <main className="page-wrapper">
        <div className="chat-box-section">
          {error && (
            <p className="text-danger text-center">{error}</p>
          )}

          {messages.length === 0 ? (
            <div className="slider-area slider-style-1 variation-default slider-bg-image bg-banner1 slider-bg-shape" data-black-overlay="1">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-lg-12">
                    <div className="inner text-center mt--20">
                      <Logo/>
                      <h1 className="title display-one" style={{ fontSize: "20px", lineHeight: "4rem" }}>
                        How can I help you? <br /> मैं आपकी क्या मदद कर सकता हूं ?
                      </h1>
                      <div className="form-group chat-input-wrapper" style={{ position: 'relative' }}>
                        <textarea
                          name="text"
                          className="input-file"
                          cols="30"
                          rows="2"
                          placeholder="नमस्ते..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleInitialPrompt();
                            }
                          }}
                          style={{ paddingRight: '50px' }}
                        />
                        <button
                          type="button"
                          onClick={handleInitialPrompt}
                          disabled={loading || !newMessage.trim()}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: newMessage.trim() ? 1 : 0.5
                          }}
                        >
                          <i className="fa-solid fa-arrow-right" style={{ fontSize: '20px', color: isLightTheme ? '#333' : '#fff' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((data) => (
                <div className="chat-box-list pb-0" key={data.id} id={`message-${data.id}`}>
                  <div className="chat-box author-speech">
                    <div className="inner">
                      <div className="chat-section">
                        <div className="author">
                          <Image
                            className="w-100"
                            width={40}
                            height={40}
                            src={data.authorImg || "/images/team/team-01sm.jpg"}
                            alt="Author"
                          />
                        </div>
                        <div className="chat-content">
                          <h6 className="title">{data.title}</h6>
                          <p className="editable me-4">{data.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {data.response && (
                    <div className="chat-box ai-speech">
                      <div className="inner">
                        <div className="chat-section">
                          <div className="author">
                            <LogoCon/>
                          </div>
                          <div className="chat-content">
                            <h6 className="title">ब्रह्मांड AI</h6>
                            <div className="position-relative">
                              <p className="mb--20">{data.response.content}</p>
                              <button 
                                className="copy-button form-icon" 
                                data-clipboard-text={data.response.content}
                                data-message-id={data.id}
                                title="Copy to clipboard"
                                style={{
                                  position: 'absolute',
                                  top: '0',
                                  right: '-5px',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '5px',
                                  color: isLightTheme ? '#333' : '#fff'
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
              ))}

              <div className="rbt-static-bar">
                <form className="new-chat-form border-gradient" onSubmit={(e) => e.preventDefault()}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <textarea
                      rows="1"
                      placeholder="Send a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleInitialPrompt();
                        }
                      }}
                      style={{ 
                        width: '100%',
                        paddingRight: '45px',
                        resize: 'none',
                        minHeight: '44px',
                        maxHeight: '200px'
                      }}
                    />
                    <button
                      className="form-icon icon-send"
                      onClick={handleInitialPrompt}
                      disabled={loading || !newMessage.trim()}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: newMessage.trim() ? 1 : 0.5
                      }}
                    >
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '20px', color: isLightTheme ? '#333' : '#fff' }}></i>
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
      <BackToTop />
    </>
  );
};

export default TextGeneratorPage;
