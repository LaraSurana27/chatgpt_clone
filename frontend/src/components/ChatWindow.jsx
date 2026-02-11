import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import Message from './Message';
import ChatInput from './ChatInput';
import styles from './ChatWindow.module.css';

export default function ChatWindow() {
  const { messages, loadingMessages, activeChat } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const firstName = user?.firstName || user?.first_name || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ Only messages that should actually be visible
  const visibleMessages = Array.isArray(messages)
    ? messages.filter(
        m =>
          m &&
          m.content &&
          m.content.trim() !== '' &&
          m.role !== 'system'
      )
    : [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * NO ACTIVE CHAT → Landing state
   */

  console.log('messages:', messages);
console.log('visibleMessages:', visibleMessages);
console.log('loadingMessages:', loadingMessages);
console.log('activeChat:', activeChat);
console.log('firstName:', firstName);

  if (!activeChat) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.logo}>
          <Sparkles size={48} />
        </div>
        <h1>NOVA</h1>

        <div className={styles.features}>
          <div className={styles.featureCol}>
            <h3>Examples</h3>
            <div className={styles.featureCard}>
              “Explain quantum computing in simple terms”
            </div>
          </div>

          <div className={styles.featureCol}>
            <h3>Capabilities</h3>
            <div className={styles.featureCard}>
              Remembers what user said earlier in the conversation
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ACTIVE CHAT
   */
  return (
    <div className={styles.chatWindow}>
      {/* ✅ SINGLE centered greeting */}
      <AnimatePresence>
        {!loadingMessages &&
          firstName &&
          visibleMessages.length === 0 && (
            <motion.div
              className={styles.centerName}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              Good to see you, {firstName}.
            </motion.div>
          )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {loadingMessages ? (
          <div className={styles.loading}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Sparkles size={24} />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg, index) => (
              <motion.div
                key={msg._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Message message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} />
        <div className={styles.spacer} />
      </div>

      <ChatInput />
    </div>
  );
}
