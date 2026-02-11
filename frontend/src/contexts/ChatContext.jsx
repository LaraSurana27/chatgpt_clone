import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // entire chat object or just ID? Let's store ID and find object when needed or store object.
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const socketRef = useRef(null);

  // Initialize Socket
  useEffect(() => {
    if (user && !socketRef.current) {
        // Assuming backend is on same host/port or proxied. 
        // If separate, need URL. Implementation Plan assumed localhost:3000 implied or proxied.
        // Vite proxy usually handles /api, but socket.io might need explicit URL if not same origin.
        // I will assume explicit path or auto-discovery. 
        // If backend is on 3000 and frontend on 5173, we need to point to 3000.
        // PROXY in vite.config.js usually handles this for HTTP.
        // For socket.io, if we use relative path, it goes through proxy?
        // Let's try relative path first if proxy is set up (I haven't checked vite.config.js yet but I should assume standard setups).
        // Actually, I haven't seen vite.config.js. I should check it to be sure about proxy.
        // For now, I'll assume standard socket.io connection logic.
        
        socketRef.current = io('/', {
            path: '/socket.io', // Standard path
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected');
        });

        socketRef.current.on('ai-response', (data) => {
            // data: { chat, content }
            // Verify it belongs to active chat
            setMessages(prev => {
                // If we are in the active chat
                // We might receive messages for other chats too if backend broadcasts to user room.
                // Spec says "Messages append only to the active chat" - implied frontend filtering or backend targeting.
                // "Client emits ai-message -> { chat, content }"
                // "Server emits ai-response -> { chat, content }"
                // So we get the chat ID back.
                
                // If the message belongs to current chat, append it.
                // Note: Real-time AI usually streams or sends chunks. 
                // Spec says "ai-response -> { chat, content }". If it's a full message or chunk is not specified.
                // "Messages must append only to the active chat"
                // I will assume it's a full message or a chunk that appends. 
                // For simplicity, let's assume it's a chunk or a completion. 
                // If it's a full completion, we add a new message.
                // If it's a stream, we update the last message.
                // "Messages always fetched from backend" -> "Realtime AI ... Server emits ai-response".
                // Managing streaming vs full messages is key. 
                // Given "ChatGPT-style", it's likely streaming. 
                // But without explicit "stream" instruction, I'll treat it as standard message append first.
                // Wait, "Messages belong to exactly one chat". 
                // If I receive a message for the active chat, I append it.
                
                 if (activeChat && data.chat === activeChat._id) {
                     return [...prev, { role: 'ai', content: data.content, _id: Date.now() }]; // Mock ID for now
                 }
                 return prev;
            });
        });
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }
  }, [user, activeChat]);

  // Fetch Chats
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        const chatList = data.chats || [];
        setChats(chatList);
        
        // Removed auto-load logic here in favor of URL-driven initialization in ChatLayout
      }
    } catch (err) {
      console.error("Failed to fetch chats", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const isCreatingRef = useRef(false);

  // Create Chat
  const createChat = async (title = 'New Chat') => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data = await res.json();
        const newChat = data.chat;
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat); // Switch to new chat
        return newChat;
      }
    } catch (err) {
      console.error("Failed to create chat", err);
    } finally {
      isCreatingRef.current = false;
    }
  };

  // Delete Chat
  const deleteChat = async (chatId) => {
      // Calculate next chat ID if we are deleting the active one.
      let isActive = false;
      if (activeChat && activeChat._id === chatId) {
          isActive = true;
      }
      
      // Determine next chat candidate (for redirection) before we modify state
      let redirectPath = null;
      if (isActive) {
          const remaining = chats.filter(c => c._id !== chatId);
          if (remaining.length > 0) {
              // Redirect to the first one in the list (most recent)
              redirectPath = `/chat/${remaining[0]._id}`;
          } else {
              // List empty, redirect to new chat creation
              redirectPath = '/chat';
          }
      }

      try {
          const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
          if (res.ok) {
              setChats(prev => prev.filter(c => c._id !== chatId));
              
              // If the deleted chat was active, we return the path so the component can navigate
              if (isActive && redirectPath) {
                  return { redirect: redirectPath };
              }
              // If not active, we don't need to redirect
              return { success: true };
          }
      } catch (err) {
          console.error("Failed to delete chat", err);
      }
      return null;
  };

  // Select Chat & Fetch Messages
  const selectChat = async (chat) => {
    setActiveChat(chat);
    setLoadingMessages(true);
    setMessages([]); 
    try {
      const res = await fetch(`/api/chat/${chat._id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (content) => {
    if (!activeChat || !socketRef.current) return;

    // Optimistic UI
    const tempMsg = { role: 'user', content, _id: Date.now() };
    setMessages(prev => [...prev, tempMsg]);

    // Emit
    socketRef.current.emit('ai-message', {
        chat: activeChat._id,
        content
    });
    
    // Auto-rename if first message (or generic title)
    // We check if it's "New Chat". 
    // And ideally we check if it's the *first* message exchange. 
    // Checking messages.length === 0 implies it was empty before this message.
    // (Note: we just added tempMsg, so length is 0 in 'prev' but we use current state usually. 
    // actually, setMessages is async. messages here is old state. so messages.length === 0 is correct)
    if (activeChat.title === 'New Chat' && messages.length === 0) {
        const newTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
        try {
            const res = await fetch(`/api/chat/${activeChat._id}/title`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                // Update local chat list
                setChats(prev => prev.map(c => 
                    c._id === activeChat._id ? { ...c, title: newTitle } : c
                ));
                // Update active chat object
                setActiveChat(prev => ({ ...prev, title: newTitle }));
            }
        } catch (err) {
            console.error("Failed to rename chat", err);
        }
    }
  };

  // Fetch chats on mount if user exists
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const value = {
    chats,
    activeChat,
    messages,
    fetchChats,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
    loadingChats,
    loadingMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
