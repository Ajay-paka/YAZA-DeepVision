import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Chat, Message, AnalysisResult, FilePreview } from '../types';
import { analyzeVideoOnFrontend } from '../services/geminiService';

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  loadingStatus: string;
  createNewChat: () => void;
  selectChat: (id: string) => void;
  sendMessage: (content: string, attachments: FilePreview[]) => void;
  deleteChat: (id: string) => void;
  togglePinChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  archiveChat: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Fetch all chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats');
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
          throw new Error(errData.error || 'Failed to fetch chats');
        }
        const data = await response.json();
        
        const formattedChats: Chat[] = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: [], // Messages will be fetched when chat is selected
          isPinned: c.pinned,
          isArchived: c.archived,
          updatedAt: new Date(c.updated_at || c.created_at),
        }));
        
        setChats(formattedChats);
      } catch (err) {
        console.error('Error fetching chats:', err);
      }
    };
    fetchChats();
  }, []);

  const createNewChat = useCallback(() => {
    setCurrentChatId(null); // Reset to "new analysis" state
  }, []);

  const selectChat = useCallback(async (id: string) => {
    setCurrentChatId(id);
    
    // Check if messages are already loaded
    const chat = chats.find(c => c.id === id);
    if (chat && chat.messages.length > 0) return;

    // Fetch messages for this chat
    try {
      const response = await fetch(`/api/chats/${id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const { messages, analysis } = await response.json();

      const formattedMessages: Message[] = messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
        analysis: m.role === 'assistant' && analysis ? {
          summary: analysis.summary,
          steps: analysis.steps,
          notes: analysis.notes,
          promptOutput: analysis.prompt_output
        } : undefined
      }));

      setChats(prev => prev.map(c => c.id === id ? { ...c, messages: formattedMessages } : c));
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [chats]);

  const sendMessage = useCallback(async (content: string, attachments: FilePreview[]) => {
    // If no attachments and no content, do nothing
    if (attachments.length === 0 && !content.trim()) return;

    setIsLoading(true);
    setLoadingStatus('processing request');

    try {
      let videoUrl = '';
      let filename = '';
      let mimeType = 'video/mp4';
      let originalName = '';

      if (attachments.length > 0) {
        setLoadingStatus('uploading video');
        const formData = new FormData();
        const videoBlob = await fetch(attachments[0].url).then(r => r.blob());
        formData.append('video', videoBlob, attachments[0].name);

        const uploadResponse = await fetch('/api/upload-video', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Upload failed');
        const uploadData = await uploadResponse.json();
        videoUrl = uploadData.videoUrl;
        filename = uploadData.filename;
        originalName = uploadData.originalName;
        mimeType = uploadData.mimeType;
      } else {
        setLoadingStatus('downloading video from link');
        const linkResponse = await fetch('/api/process-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: content.trim() }),
        });

        if (!linkResponse.ok) {
          const errData = await linkResponse.json().catch(() => ({ message: 'Link processing failed' }));
          throw new Error(errData.message || 'Link processing failed');
        }
        const linkData = await linkResponse.json();
        videoUrl = linkData.videoUrl;
        filename = linkData.filename;
        mimeType = linkData.mimeType;
        originalName = `Link: ${content.substring(0, 30)}...`;
      }

      // 2. Perform analysis on frontend
      setLoadingStatus('analyzing video content');
      
      // Fetch the video from the server (or use the blob we already have)
      const videoBlob = await fetch(videoUrl).then(r => r.blob());
      
      // Convert to base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

      const base64Data = await base64Promise;
      const analysis = await analyzeVideoOnFrontend(base64Data, mimeType);

      // 3. Save analysis to backend
      setLoadingStatus('saving results');
      const saveResponse = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: originalName || content.substring(0, 30),
          analysis,
          userMessage: attachments.length > 0 ? `Uploaded video: ${attachments[0].name}` : `Analyze link: ${content}`
        }),
      });

      if (!saveResponse.ok) throw new Error('Failed to save analysis results');
      const saveData = await saveResponse.json();

      // 4. Cleanup temporary file on server
      fetch('/api/cleanup-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      }).catch(err => console.error('Cleanup failed:', err));

      const newChat: Chat = {
        id: saveData.chatId || `temp-${Date.now()}`,
        title: originalName || (content.length > 20 ? content.substring(0, 20) + '...' : content),
        messages: [
          {
            id: 'user-msg',
            role: 'user',
            content: attachments.length > 0 ? `Uploaded video: ${attachments[0].name}` : `Analyze link: ${content}`,
            timestamp: new Date(),
            attachments
          },
          {
            id: 'assistant-msg',
            role: 'assistant',
            content: analysis.summary,
            timestamp: new Date(),
            analysis
          }
        ],
        isPinned: false,
        isArchived: false,
        updatedAt: new Date(),
      };

      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    } catch (err: any) {
      console.error('Error analyzing video:', err);
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }, []);

  const deleteChat = async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete chat');
      
      setChats(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) setCurrentChatId(null);
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const togglePinChat = async (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !chat.isPinned }),
      });
      if (!response.ok) throw new Error('Failed to pin chat');
      
      setChats(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    } catch (err) {
      console.error('Error pinning chat:', err);
    }
  };

  const renameChat = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) throw new Error('Failed to rename chat');
      
      setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    } catch (err) {
      console.error('Error renaming chat:', err);
    }
  };

  const archiveChat = async (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !chat.isArchived }),
      });
      if (!response.ok) throw new Error('Failed to archive chat');
      
      setChats(prev => prev.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c));
    } catch (err) {
      console.error('Error archiving chat:', err);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      chats, currentChatId, isLoading, loadingStatus,
      createNewChat, selectChat, sendMessage, deleteChat,
      togglePinChat, renameChat, archiveChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
