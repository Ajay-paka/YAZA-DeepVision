import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useChat } from '../../context/ChatContext';
import ChatMessage from '../chat/ChatMessage';
import ChatInput from '../chat/ChatInput';
import ChatEmptyState from '../chat/ChatEmptyState';
import LoadingOverlay from '../ui/LoadingOverlay';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentChatId, chats } = useChat();

  const currentChat = chats.find(c => c.id === currentChatId);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto flex flex-col">
          {!currentChat || currentChat.messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <div className="flex-1">
              <div className="max-w-4xl mx-auto py-8">
                {currentChat.messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
            </div>
          )}
          
          <div className="sticky bottom-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pt-10">
            <ChatInput />
          </div>
        </main>

        <LoadingOverlay />
      </div>
    </div>
  );
};

export default MainLayout;
