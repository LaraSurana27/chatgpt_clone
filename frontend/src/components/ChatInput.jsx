import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import styles from './ChatInput.module.css';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const { sendMessage, loadingMessages, activeChat } = useChat();
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loadingMessages) return;
    
    // Check if we need to create a chat implicitly (though layout handles this, input should be safe)
    
    const content = input;
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
    
    await sendMessage(content);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Focus effect/animation could be handled in CSS, or framer motion here. CSS is fine.

  return (
    <div className={styles.inputContainer}>
      <form className={styles.inputBox} onSubmit={handleSubmit}>
        <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className={styles.textarea}
        />
        <button 
            type="submit" 
            className={styles.sendBtn}
            disabled={!input.trim() || loadingMessages}
        >
          <Send size={18} />
        </button>
      </form>
      <div className={styles.disclaimer}>
        NOVA may produce inaccurate information about people, places, or facts.
      </div>
    </div>
  );
}
