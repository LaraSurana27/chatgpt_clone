import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const isCreatingRef = useRef(false);

  /* ===============================
     SOCKET CONNECTION
     =============================== */
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(API_BASE_URL, {
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('ai-response', (data) => {
        setMessages(prev => {
          if (activeChat && data.chat === activeChat._id) {
            return [
              ...prev,
              {
                role: 'model', // match backend
                content: data.content,
                _id: Date.now(),
              },
            ];
          }
          return prev;
        });
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, activeChat]);

  /* ===============================
     FETCH CHATS
     =============================== */
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    } finally {
      setLoadingChats(false);
    }
  };

  /* ===============================
     CREATE CHAT
     =============================== */
  const createChat = async (title = 'New Chat') => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        const data = await res.json();
        const newChat = data.chat;
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat);
        return newChat;
      }
    } catch (err) {
      console.error('Failed to create chat', err);
    } finally {
      isCreatingRef.current = false;
    }
  };

  /* ===============================
     DELETE CHAT
     =============================== */
  const deleteChat = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setChats(prev => prev.filter(c => c._id !== chatId));

        if (activeChat?._id === chatId) {
          setActiveChat(null);
          setMessages([]);
        }

        return { success: true };
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }

    return null;
  };

  /* ===============================
     SELECT CHAT
     =============================== */
  const selectChat = async (chat) => {
    setActiveChat(chat);
    setLoadingMessages(true);
    setMessages([]);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/${chat._id}/messages`,
        { credentials: 'include' }
      );

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  /* ===============================
     SEND MESSAGE
     =============================== */
  const sendMessage = async (content) => {
    if (!activeChat || !socketRef.current) return;

    // Optimistic message
    const tempMsg = {
      role: 'user',
      content,
      _id: Date.now(),
    };

    setMessages(prev => [...prev, tempMsg]);

    socketRef.current.emit('ai-message', {
      chat: activeChat._id,
      content,
    });

    // Auto rename first message
    if (activeChat.title === 'New Chat' && messages.length === 0) {
      const newTitle =
        content.substring(0, 30) +
        (content.length > 30 ? '...' : '');

      try {
        await fetch(
          `${API_BASE_URL}/api/chat/${activeChat._id}/title`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title: newTitle }),
          }
        );

        setChats(prev =>
          prev.map(c =>
            c._id === activeChat._id
              ? { ...c, title: newTitle }
              : c
          )
        );

        setActiveChat(prev => ({
          ...prev,
          title: newTitle,
        }));
      } catch (err) {
        console.error('Failed to rename chat', err);
      }
    }
  };

  /* ===============================
     LOAD CHATS WHEN USER LOGS IN
     =============================== */
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        fetchChats,
        createChat,
        selectChat,
        sendMessage,
        deleteChat,
        loadingChats,
        loadingMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
