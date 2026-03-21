import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Pin, 
  MoreVertical, 
  Trash2, 
  Archive, 
  Edit3, 
  Share2,
  X
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { Chat } from '../../types/frontend';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { chats, currentChatId, selectChat, createNewChat, deleteChat, togglePinChat, renameChat, archiveChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) && !chat.isArchived
  );

  const pinnedChats = filteredChats.filter(chat => chat.isPinned);
  const otherChats = filteredChats.filter(chat => !chat.isPinned);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -300,
          width: isOpen ? 260 : 0
        }}
        className={`fixed lg:relative z-40 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col overflow-hidden`}
      >
        {/* Search & New Chat */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between lg:hidden">
            <span className="font-bold text-[var(--text-primary)]">YAZA</span>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-color)] transition-all duration-200 group"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">New Analysis</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-transparent border border-[var(--border-color)] rounded-lg text-xs focus:outline-none focus:border-[var(--text-secondary)] transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4">
          {/* Pinned */}
          {pinnedChats.length > 0 && (
            <div>
              <div className="px-3 mb-1 flex items-center gap-2 text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-wider">
                Pinned
              </div>
              <div className="space-y-0.5">
                {pinnedChats.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={currentChatId === chat.id}
                    onClick={() => selectChat(chat.id)}
                    onAction={(action) => {
                      if (action === 'delete') deleteChat(chat.id);
                      if (action === 'pin') togglePinChat(chat.id);
                      if (action === 'archive') archiveChat(chat.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          <div>
            <div className="px-3 mb-1 text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-wider">
              History
            </div>
            <div className="space-y-0.5">
              {otherChats.map(chat => (
                <ChatItem 
                  key={chat.id} 
                  chat={chat} 
                  isActive={currentChatId === chat.id}
                  onClick={() => selectChat(chat.id)}
                  onAction={(action) => {
                    if (action === 'delete') deleteChat(chat.id);
                    if (action === 'pin') togglePinChat(chat.id);
                    if (action === 'archive') archiveChat(chat.id);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  onAction: (action: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-left ${
          isActive 
            ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <MessageSquare size={14} className={isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'} />
        <span className="flex-1 truncate text-xs font-medium">{chat.title}</span>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={`p-1 hover:bg-[var(--bg-primary)] rounded opacity-0 group-hover:opacity-100 transition-all ${showMenu ? 'opacity-100' : ''}`}
        >
          <MoreVertical size={12} />
        </button>
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl z-[60] py-2"
            >
              <button onClick={() => { onAction('pin'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--bg-secondary)]">
                <Pin size={14} className={chat.isPinned ? 'text-yellow-500' : ''} />
                {chat.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={() => { onAction('archive'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--bg-secondary)]">
                <Archive size={14} />
                Archive
              </button>
              <div className="h-px bg-[var(--border-color)] my-1" />
              <button onClick={() => { onAction('delete'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                <Trash2 size={14} />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
