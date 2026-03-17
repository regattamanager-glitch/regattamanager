import React, { useState, useRef } from 'react';

export const LegalModal = ({ isOpen, onAccept, onCancel, t }: { 
  isOpen: boolean, 
  onAccept: () => void, 
  onCancel: () => void,
  t: any 
}) => {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Wenn der Nutzer bis auf 20px am Ende ist
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasReadToBottom(true);
      }
    }
  };

  if (!isOpen) return null;

  const sectionKeys = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-blue-900/20 text-center">
          <h2 className="text-xl font-bold text-white tracking-tight italic">
            {t('legal.title')}
          </h2>
          <p className="text-[10px] text-blue-400 mt-2 uppercase font-black tracking-widest">
            {t('legal.parties')}
          </p>
        </div>

        {/* Content */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-8 overflow-y-auto text-sm text-gray-300 space-y-8 custom-scrollbar leading-relaxed"
        >
          {sectionKeys.map((key) => (
            <section key={key} className="space-y-2">
              <h3 className="text-white font-bold text-base border-l-4 border-blue-600 pl-3">
                {t(`legal.sections.${key}_title`)}
              </h3>
              <p className="whitespace-pre-line opacity-80 pl-4">
                {t(`legal.sections.${key}_text`)}
              </p>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-slate-900/50">
          {!hasReadToBottom && (
            <p className="text-center text-amber-400 text-[10px] mb-4 animate-bounce uppercase font-bold">
              ↓ {t('legal.scrollInstruction')} ↓
            </p>
          )}
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onAccept}
              disabled={!hasReadToBottom}
              className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg ${
                hasReadToBottom 
                ? "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-blue-600/20" 
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              {t('legal.accept')}
            </button>
            <button 
              onClick={onCancel} 
              className="w-full text-gray-500 text-xs hover:text-gray-300 transition-colors py-2"
            >
              {t('legal.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};