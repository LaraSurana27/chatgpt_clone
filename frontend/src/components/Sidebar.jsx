import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, LogOut, User as UserIcon } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar({ onClose }) {
  const { chats, activeChat, createChat, deleteChat, loadingChats } = useChat();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  // ... (handlers remain unchanged) ...

  const handleSelectChat = (chat) => {
      navigate(`/chat/${chat._id}`);
      if (onClose) onClose();
  };

  const handleNewChat = async (e) => {
      if (e) e.preventDefault();
      try {
          const newChat = await createChat();
          if (newChat) {
              navigate(`/chat/${newChat._id}`);
          }
      } catch (error) {
          console.error("Failed to create new chat:", error);
      }
      if (onClose) onClose();
  };

  const handleDelete = async (e, chatId) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this chat?")) {
          setDeletingId(chatId);
          const result = await deleteChat(chatId);
          setDeletingId(null);
          
          if (result?.redirect) {
              navigate(result.redirect);
          }
      }
  };

  return (
    <aside className={styles.sidebar}>
      <button onClick={handleNewChat} className={styles.newChatBtn}>
        <Plus size={20} />
        <span>New Chat</span>
      </button>

      <div className={styles.chatList}>
        {loadingChats ? (
            <div className={styles.loading}>Loading chats...</div>
        ) : (
            <AnimatePresence initial={false} mode='popLayout'>
            {chats.map(chat => (
            <motion.div 
                key={chat._id} 
                className={`${styles.chatItem} ${activeChat?._id === chat._id ? styles.active : ''}`}
                onClick={() => handleSelectChat(chat)}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
            >
                <div className={styles.chatIcon}>
                    <MessageSquare size={18} />
                </div>
                <div className={styles.chatTitle}>
                    {chat.title || 'New Chat'}
                </div>
                
                {deletingId === chat._id ? (
                    <div className={styles.spinner}>...</div>
                ) : (
                    <button 
                        className={styles.deleteBtn}
                        onClick={(e) => handleDelete(e, chat._id)}
                        title="Delete Chat"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </motion.div>
            ))}
            </AnimatePresence>
        )}
      </div>

      <div className={styles.userSection}>
        <div className={styles.userInfo}>
           <div className={styles.avatar}>
             {user?.fullName?.firstName?.[0] || <UserIcon size={20} />}
           </div>
           <div className={styles.username}>
             {user?.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : 'User'}
           </div> 
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
           <LogOut size={16} style={{ marginRight: '8px' }} />
           Logout
        </button>
      </div>
    </aside>
  );
}
