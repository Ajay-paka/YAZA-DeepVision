import React, { useState, useRef } from 'react';
import { Upload, Send, Info, X, FileVideo, FileText } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { FilePreview } from '../../types/frontend';

const ChatInput: React.FC = () => {
  const { sendMessage, isLoading } = useChat();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setInput(target.value);
    
    // Auto-expand logic
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FilePreview[] = Array.from(files).map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    sendMessage(input, attachments);
    setInput('');
    setAttachments([]);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-8 pt-4">
      <div className="relative bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[26px] shadow-sm overflow-hidden transition-all focus-within:border-[var(--text-secondary)]">
        
        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 p-3 border-b border-[var(--border-color)]"
            >
              {attachments.map(file => (
                <div key={file.id} className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-1.5 rounded-xl text-xs group shadow-sm">
                  {file.type.includes('video') ? <FileVideo size={14} className="text-brand" /> : <FileText size={14} />}
                  <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                  <button onClick={() => removeAttachment(file.id)} className="p-1 hover:text-red-500 rounded-lg transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end p-2 gap-2">
          <div className="flex items-center pb-1.5 pl-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              multiple
              accept="video/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Upload Video"
            >
              <Upload size={20} />
            </button>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                  }
                }
              }}
              placeholder="Message YAZA..."
              className="w-full bg-transparent border-none focus:ring-0 text-base py-3 px-2 resize-none min-h-[52px] max-h-[200px] placeholder:text-[var(--text-secondary)]/60 overflow-y-auto"
              rows={1}
            />
          </div>
          
          <div className="flex items-center pb-1.5 pr-1.5">
            <button 
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`p-2 rounded-xl transition-all ${
                (!input.trim() && attachments.length === 0) || isLoading
                  ? 'text-[var(--border-color)] cursor-not-allowed'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <button 
          onClick={handleSend}
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className={`px-6 py-2 rounded-full font-semibold text-xs transition-all border ${
            (!input.trim() && attachments.length === 0) || isLoading
              ? 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] cursor-not-allowed opacity-50'
              : 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] hover:opacity-90'
          }`}
        >
          Analyse Video
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 text-[var(--text-secondary)] hover:text-brand transition-colors"
          >
            <Info size={16} />
          </button>

          <AnimatePresence>
            {showInfo && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowInfo(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 p-5"
                >
                  <h4 className="text-sm font-bold mb-3 text-brand uppercase tracking-wider">Analysis Specs</h4>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand" />
                      Supported formats: MP4, MOV, AVI
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand" />
                      Public links supported (YouTube, Vimeo)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand" />
                      Max file size: 50MB
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand" />
                      Max duration: 5 minutes
                    </li>
                    <li className="flex items-center gap-2 font-bold text-brand/80">
                      <div className="w-1 h-1 rounded-full bg-brand" />
                      5 free analyses daily
                    </li>
                  </ul>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
