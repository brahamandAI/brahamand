import React, { useState } from 'react';
import { Chip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import LanguageIcon from "@mui/icons-material/Language";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import MenuIcon from '@mui/icons-material/Menu';
import styles from "../styles/Chat.module.css";

export default function ChatPage() {
  const [message, setMessage] = useState("");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="ब्रह्मांड AI" className={styles.logo} />
          <span className={styles.logoText}>ब्रह्मांड AI</span>
        </div>
        <button className={styles.menuButton}>
          <MenuIcon />
        </button>
      </header>

      <div className={styles.chatContainer}>
        <div className={styles.messageArea}>
          <div className={styles.message}>
            <div className={styles.messageAvatar}>
              <img src="/logo.png" alt="AI" className={styles.avatarImage} />
            </div>
            <div className={styles.messageContent}>
              <div className={styles.messageSender}>ब्रह्मांड AI</div>
              <div className={styles.messageText}>Hello! How can I assist you today?</div>
            </div>
          </div>
        </div>
        
        <form className={styles.chatInputForm}>
          <div className={styles.inputWithChips}>
            <div className={styles.chipContainer}>
              <Chip
                icon={<AddIcon />}
                className={styles.standardChip}
                onClick={() => {}}
              />
              <Chip
                icon={<SearchIcon />}
                label="Brain storm"
                className={styles.standardChip}
                onClick={() => {}}
              />
              <Chip
                icon={<MicIcon />}
                label="Speech to Text"
                className={styles.standardChip}
                onClick={() => {}}
              />
              <Chip
                icon={<SearchIcon />}
                label="Search News"
                className={styles.standardChip}
                onClick={() => {}}
              />
              <Chip
                icon={<LanguageIcon />}
                label="English"
                className={styles.standardChip}
                onClick={() => {}}
              />
            </div>
            
            <div className={styles.inputContainer}>
              <textarea
                className={styles.chatTextarea}
                placeholder="Send a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={1}
              />
              <button type="submit" className={styles.sendButton}>
                <SendIcon />
              </button>
            </div>
          </div>
        </form>
        <div className={styles.disclaimer}>
          ब्रह्मांड AI can be Imperfect. Check Important Info.
        </div>
      </div>
    </div>
  );
} 