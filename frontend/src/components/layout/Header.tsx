import React, { useState } from 'react';
import { Menu, Plus, MoreVertical, Moon, Sun, Share2, Edit3, Archive, Pin, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentChatId, chats, createNewChat, deleteChat, togglePinChat, archiveChat } = useChat();
  const [showMenu, setShowMenu] = useState(false);

  const currentChat = chats.find(c => c.id === currentChatId);

  return (
    <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg lg:hidden transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-[var(--text-primary)]">
            YAZA DeepVision
          </h1>
          <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-medium">
            Deep Video Analyzer
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          onClick={createNewChat}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          title="New Chat"
        >
          <Plus size={18} />
        </button>

        {chats.length > 0 && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)]"
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 py-3"
                  >
                    <div className="px-4 py-2 mb-2 border-b border-[var(--border-color)]">
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Chat Title</p>
                      <p className="text-sm font-medium truncate">{currentChat?.title || 'New Analysis'}</p>
                    </div>
                    
                    <MenuAction icon={<Share2 size={16} />} label="Share" onClick={() => setShowMenu(false)} />
                    <MenuAction icon={<Edit3 size={16} />} label="Rename" onClick={() => setShowMenu(false)} />
                    <MenuAction 
                      icon={<Pin size={16} className={currentChat?.isPinned ? 'text-yellow-500' : ''} />} 
                      label={currentChat?.isPinned ? 'Unpin Chat' : 'Pin Chat'} 
                      onClick={() => { if(currentChatId) togglePinChat(currentChatId); setShowMenu(false); }} 
                    />
                    <MenuAction 
                      icon={<Archive size={16} />} 
                      label="Archive" 
                      onClick={() => { if(currentChatId) archiveChat(currentChatId); setShowMenu(false); }} 
                    />
                    
                    <div className="h-px bg-[var(--border-color)] my-2" />
                    
                    <MenuAction 
                      icon={<Trash2 size={16} />} 
                      label="Delete" 
                      danger 
                      onClick={() => { if(currentChatId) deleteChat(currentChatId); setShowMenu(false); }} 
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

const MenuAction = ({ icon, label, onClick, danger = false }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
      danger ? 'text-red-500 hover:bg-red-50' : 'hover:bg-[var(--bg-secondary)]'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

export default Header;
