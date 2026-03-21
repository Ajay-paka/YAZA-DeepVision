import React from 'react';
import { motion } from 'motion/react';
import { Message } from '../../types/frontend';
import { User, Bot, FileVideo, CheckCircle2, Info, Lightbulb, Terminal } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex gap-4 p-6 ${isAssistant ? 'bg-[var(--bg-secondary)]' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border-color)] ${
        isAssistant ? 'bg-brand/10 text-brand' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
      }`}>
        {isAssistant ? <Bot size={18} /> : <User size={18} />}
      </div>

      <div className="flex-1 space-y-4 max-w-2xl">
        <div className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {message.attachments.map(file => (
              <div key={file.id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl overflow-hidden w-48 shadow-sm">
                <div className="aspect-video bg-black/10 flex items-center justify-center relative group">
                  <FileVideo size={32} className="text-brand opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-2 text-[10px] font-medium truncate border-t border-[var(--border-color)]">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis Result Cards */}
        {message.analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <AnalysisCard 
              icon={<Info size={18} className="text-blue-400" />} 
              title="Summary" 
              content={message.analysis.summary} 
            />
            <AnalysisCard 
              icon={<CheckCircle2 size={18} className="text-green-400" />} 
              title="Key Steps" 
              content={
                <ul className="space-y-1">
                  {message.analysis.steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand font-bold">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              } 
            />
            <AnalysisCard 
              icon={<Lightbulb size={18} className="text-yellow-400" />} 
              title="Notes" 
              content={
                <ul className="space-y-1">
                  {message.analysis.notes.map((note, i) => (
                    <li key={i} className="flex gap-2">• {note}</li>
                  ))}
                </ul>
              } 
            />
            <AnalysisCard 
              icon={<Terminal size={18} className="text-brand" />} 
              title="Prompt Output" 
              content={message.analysis.promptOutput}
              className="md:col-span-2"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AnalysisCard = ({ icon, title, content, className = '' }: { icon: React.ReactNode, title: string, content: React.ReactNode, className?: string }) => (
  <div className={`bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-[var(--bg-secondary)] rounded-lg">
        {icon}
      </div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{title}</h4>
    </div>
    <div className="text-sm text-[var(--text-primary)] leading-relaxed">
      {content}
    </div>
  </div>
);

export default ChatMessage;
