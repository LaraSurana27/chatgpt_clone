import { User, Sparkles } from 'lucide-react';
import styles from './Message.module.css';

export default function Message({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.aiRow}`}>
        {!isUser && (
            <div className={`${styles.avatar} ${styles.aiAvatar}`}>
                <Sparkles size={16} />
            </div>
        )}
        
        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
           {message.content}
        </div>

        {isUser && (
            <div className={`${styles.avatar} ${styles.userAvatar}`}>
                <User size={16} />
            </div>
        )}
    </div>
  );
}
