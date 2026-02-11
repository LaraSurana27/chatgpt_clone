import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ThemeToggle from './ThemeToggle';
import styles from './ChatLayout.module.css';
import { useChat } from '../contexts/ChatContext';

export default function ChatLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { 
    chats, 
    activeChat, 
    selectChat, 
    createChat, 
    loadingChats 
  } = useChat();

  // URL Sync Capability
  useEffect(() => {
    if (loadingChats) return;

    if (chatId === 'new') {
        const initNewChat = async () => {
             const newChat = await createChat();
             if (newChat) {
                 navigate(`/chat/${newChat._id}`, { replace: true });
             }
        };
        initNewChat();
        return;
    }

    if (chatId) {
       if (activeChat?._id === chatId) return;
       const chat = chats.find(c => c._id === chatId);
       if (chat) selectChat(chat);
    } 
    else {
        if (chats.length > 0) {
             navigate(`/chat/${chats[0]._id}`, { replace: true });
        } else {
            const initNewChat = async () => {
                 const newChat = await createChat();
                 if (newChat) navigate(`/chat/${newChat._id}`, { replace: true });
            };
            initNewChat();
        }
    }
  }, [chatId, chats, loadingChats, activeChat, createChat, selectChat, navigate]);

  // Framer Motion Variants
  const sidebarVariants = {
      closed: { x: '-100%', opacity: 0 },
      open: { 
          x: 0, 
          opacity: 1,
          transition: { type: 'spring', stiffness: 300, damping: 30 }
      }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Toggle Button */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Overlay & Sidebar for Mobile / Desktop Logic */}
      {/* 
         On Desktop: Sidebar is always visible and static.
         On Mobile: Sidebar is absolute and togglable.
         We can use media query to hide desktop wrapper on mobile, and show mobile wrapper.
         Or keep one wrapper and change its behavior.
         
         Easier: Render Sidebar once, distinct containers for mobile vs desktop?
         Or shared container with conditional class.
         Framer Motion is tricky with media queries. 
         Best approach: Use a `useMediaQuery` hook or CSS + AnimatePresence conditional render.
         For simplicity: 
         - Desktops: standard flex sidebar.
         - Mobile: AnimatePresence overlay + sidebar.
      */}

      {/* Desktop Sidebar (Hidden on Mobile via CSS) */}
      <div className={styles.desktopSidebar}>
          <Sidebar />
      </div>

      {/* Mobile Sidebar (Visible only on Mobile via CSS + State) */}
      <AnimatePresence>
          {isSidebarOpen && (
              <>
                  <motion.div 
                      className={styles.overlay}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSidebarOpen(false)}
                  />
                  <motion.div 
                      className={styles.mobileSidebar}
                      variants={sidebarVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                  >
                      <button 
                          className={styles.closeBtn}
                          onClick={() => setIsSidebarOpen(false)}
                      >
                          <X size={24} />
                      </button>
                      <Sidebar onClose={() => setIsSidebarOpen(false)} />
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <main className={styles.main}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50 }}>
            <ThemeToggle />
        </div>
        <ChatWindow />
      </main>
    </div>
  );
}
