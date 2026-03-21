import React from 'react';
import { CheckCircle2, Info, Lightbulb, Terminal } from 'lucide-react';
import { AnalysisResult } from '../../types/frontend';

interface AnalysisCardsProps {
  analysis: AnalysisResult;
}

const AnalysisCards: React.FC<AnalysisCardsProps> = ({ analysis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      <AnalysisCard 
        icon={<Info size={18} className="text-blue-400" />} 
        title="Summary" 
        content={analysis.summary} 
      />
      <AnalysisCard 
        icon={<CheckCircle2 size={18} className="text-green-400" />} 
        title="Key Steps" 
        content={
          <ul className="space-y-1">
            {analysis.steps.map((step, i) => (
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
            {analysis.notes.map((note, i) => (
              <li key={i} className="flex gap-2">• {note}</li>
            ))}
          </ul>
        } 
      />
      <AnalysisCard 
        icon={<Terminal size={18} className="text-brand" />} 
        title="Prompt Output" 
        content={analysis.promptOutput}
        className="md:col-span-2"
      />
    </div>
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

export default AnalysisCards;
