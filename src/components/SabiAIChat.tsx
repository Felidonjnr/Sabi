import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile, SubjectName, MasteryMapItem } from '../types';
import { Send, Loader2, Sparkles, AlertCircle, Info, ChevronDown, BookOpen, ChevronRight } from 'lucide-react';
import MathText from './MathText';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
}

interface SabiAIChatProps {
  profile: StudentProfile | null;
  masteryMap?: Record<string, MasteryMapItem>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatSubject: 'English Language' | 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology';
  setChatSubject: (sub: 'English Language' | 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology') => void;
  chatTopic: string;
  setChatTopic: (topic: string) => void;
  isChatActive: boolean;
  setIsChatActive: (active: boolean) => void;
}

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  'English Language': ['Proximity Concord', 'Synonyms', 'Subjunctive Mood'],
  'Mathematics': ['Quadratic Equations', 'Indices', 'Calculus'],
  'Physics': ['Mechanics', 'Electricity', 'Waves & Optics'],
  'Chemistry': ['Atomic Structure', 'Gases', 'Acids, Bases & Salts'],
  'Biology': ['Cell Biology', 'Genetics', 'Ecology']
};

export default function SabiAIChat({
  profile,
  masteryMap = {},
  messages,
  setMessages,
  chatSubject,
  setChatSubject,
  chatTopic,
  setChatTopic,
  isChatActive,
  setIsChatActive
}: SabiAIChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<'subject' | 'topic' | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Hook for network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute dynamic performance statement linked to actual student history
  const currentMasteryItem = Object.values(masteryMap || {}).find(
    (m: any) => m.topic === chatTopic && m.subject === chatSubject
  );
  const missedCount = currentMasteryItem?.history?.filter((h: any) => !h.correct).length || 0;
  const totalAttempts = currentMasteryItem?.history?.length || 0;

  let performanceText = `You haven't attempted any question on ${chatTopic} yet. Build evidence on this topic through practice before treating it as a learning priority.`;
  if (missedCount > 0) {
    performanceText = `You missed ${missedCount} question${missedCount > 1 ? 's' : ''} on ${chatTopic} during your recent practice sessions. Let's close your knowledge gaps and master this topic together!`;
  } else if (totalAttempts > 0) {
    performanceText = `Superb achievement! You got all ${totalAttempts} practice question${totalAttempts > 1 ? 's' : ''} correct on ${chatTopic}. Sabi AI is standing by to take you through advanced formulas and tricky catch questions!`;
  }

  // Get topics for active subject sorted by mastery_score in ascending order (weakest first)
  const sortedTopics = (TOPICS_BY_SUBJECT[chatSubject] || []).map(topic => {
    const item = Object.values(masteryMap || {}).find(
      (m: any) => m.topic === topic && m.subject === chatSubject
    );
    return {
      topic,
      score: item ? item.score : null
    };
  }).sort((a, b) => (a.score ?? Number.POSITIVE_INFINITY) - (b.score ?? Number.POSITIVE_INFINITY));

  const handleSend = async (textOverride?: string) => {
    if (!isOnline) return;
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) {
      setInput('');
    }
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentTopic: chatTopic,
          currentSubject: chatSubject,
          studentProfile: profile,
          topicMemory: profile?.topicMemories?.[chatTopic] || ''
        })
      });

      const data = await response.json();
      
      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        sender: 'model',
        text: data.reply || `I didn't capture that concept note. Ask me another question on ${chatTopic}!`
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `m-error-${Date.now()}`,
        sender: 'model',
        text: `My friend, I hit a slight connection glitch. But make we focus! Under "${chatTopic}", make sure you grab the core formulas/cases. Try asking again.`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const latestMessage = messages[messages.length - 1];
  const isLatestModel = latestMessage && latestMessage.sender === 'model';

  return (
    <div id="tutor-chat-screen" className="flex flex-col min-h-[620px] h-full w-full bg-[#F8FAFC] rounded-[28px] overflow-hidden border border-slate-200 relative">
      <header className="bg-[#07152F] text-white px-5 py-5 md:px-7 md:py-6 shrink-0 relative overflow-hidden">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#2563EB]/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.22em] font-black text-[#F5C518]">AI Coach</span>
            <h2 className="text-2xl md:text-3xl font-black mt-1">Let’s figure it out together.</h2>
            <p className="text-xs md:text-sm text-white/55 mt-2 max-w-xl leading-relaxed">Ask about a JAMB concept, work through a difficult question, or ask SABI to test your understanding.</p>
          </div>
          <div className="hidden sm:flex h-10 w-10 rounded-2xl bg-white/10 border border-white/10 items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#F5C518]" />
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button onClick={() => setActiveBottomSheet('subject')} className="shrink-0 rounded-full bg-[#F8FAFC] border border-slate-200 px-3 py-2 text-[10px] font-black text-[#0B1220] flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-[#2563EB]" /> {chatSubject} <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
        <button onClick={() => setActiveBottomSheet('topic')} className="shrink-0 max-w-[220px] rounded-full bg-[#F8FAFC] border border-slate-200 px-3 py-2 text-[10px] font-black text-[#0B1220] flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#F5C518]" /> <span className="truncate">{chatTopic}</span> <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {!isChatActive ? (
        <div className="flex-1 p-4 md:p-7 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-2xl">
            <div className="rounded-[24px] bg-white border border-slate-200 p-5 md:p-7">
              <span className="text-[9px] uppercase tracking-[0.18em] font-black text-[#2563EB]">Start a coaching session</span>
              <h3 className="text-xl md:text-2xl font-black text-[#0B1220] mt-2">What are you trying to understand?</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{performanceText}</p>

              <div className="grid md:grid-cols-3 gap-2 mt-6">
                {[
                  ['Explain it', 'Walk me through the method'],
                  ['Test me', 'Test me on this topic'],
                  ['Simplify it', 'Simplify this explanation']
                ].map(([label, prompt]) => (
                  <button
                    key={label}
                    onClick={() => { setIsChatActive(true); handleSend(prompt); }}
                    disabled={!isOnline}
                    className="text-left rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 hover:border-[#2563EB]/50 hover:-translate-y-0.5 transition-all disabled:opacity-40"
                  >
                    <span className="block text-xs font-black text-[#0B1220]">{label}</span>
                    <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>

              {!isOnline && (
                <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-100 p-3 flex gap-2 items-center text-[10px] font-bold text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> AI Coach requires an internet connection. Practice remains available.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 min-h-0">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[88%] md:max-w-[75%] rounded-[20px] px-4 py-3 border shadow-sm ${m.sender === 'user' ? 'bg-[#07152F] text-white border-[#07152F] rounded-br-md' : 'bg-white text-[#0B1220] border-slate-200 rounded-bl-md'}`}>
                  {m.sender === 'model' && <span className="block text-[8px] uppercase tracking-[0.16em] font-black text-[#2563EB] mb-1">SABI AI Coach</span>}
                  <div className="text-xs leading-relaxed"><MathText text={m.text} /></div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[20px] bg-white border border-slate-200 px-4 py-3 shadow-sm">
                  <span className="block text-[8px] uppercase tracking-[0.16em] font-black text-[#2563EB] mb-2">SABI AI Coach</span>
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{animationDelay:'120ms'}} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{animationDelay:'240ms'}} />
                    <span className="text-[10px] text-slate-400 ml-1">Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            {isLatestModel && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {['Show me an example', 'Test me on this topic', 'Simplify this explanation'].map(chip => (
                  <button key={chip} onClick={() => handleSend(chip)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-[#0B1220] hover:border-[#2563EB] transition">
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3 md:p-4 shrink-0">
            {!isOnline && <div className="mb-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-[10px] font-bold text-rose-700">Tutor requires internet. Practice is still available offline.</div>}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder={isOnline ? `Ask about ${chatTopic}…` : 'AI Coach requires internet'}
                disabled={!isOnline}
                className="min-h-[50px] flex-1 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-medium outline-none focus:border-[#2563EB]"
              />
              <button onClick={() => handleSend()} disabled={loading || !input.trim() || !isOnline} className="min-w-[50px] rounded-2xl bg-[#07152F] text-[#F5C518] flex items-center justify-center disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )


      {/* Interactive Bottom Sheet Select Drawer */}
      {activeBottomSheet && (
        <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex flex-col justify-end">
          <div className="flex-1" onClick={() => setActiveBottomSheet(null)} />
          <div className="bg-white rounded-t-3xl p-5 border-t border-slate-200 animate-slide-up flex flex-col max-h-[75%] shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-[#0A1128] uppercase tracking-widest flex items-center gap-2">
                {activeBottomSheet === 'subject' ? '🎯 Select Focus Subject' : '🧠 Select Weakest Topic First'}
              </h4>
              <button
                onClick={() => setActiveBottomSheet(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2.5 py-1 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1 pb-4 min-h-0 select-none scrollbar-none">
              {activeBottomSheet === 'subject' ? (
                (((profile as any)?.subjects || profile?.chosenSubjects || ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology']) as SubjectName[]).map(sub => (
                  <button
                    key={sub}
                    onClick={() => {
                      setChatSubject(sub as any);
                      
                      // Cascading Dropdown state logic reset
                      const topicsList = TOPICS_BY_SUBJECT[sub] || [];
                      const sorted = topicsList.map(t => {
                        const item = Object.values(masteryMap || {}).find((m: any) => m.topic === t && m.subject === sub);
                        return { topic: t, score: item ? item.score : 40 };
                      }).sort((a, b) => a.score - b.score);
                      
                      if (sorted.length > 0) {
                        setChatTopic(sorted[0].topic);
                      }
                      
                      // Clear active chat session slice on explicit subject change
                      setMessages([]);
                      setIsChatActive(false);
                      setActiveBottomSheet(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border font-bold text-xs transition flex justify-between items-center ${chatSubject === sub ? 'bg-[#0A1128] text-white border-[#0A1128]' : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'}`}
                  >
                    <span>{sub}</span>
                    {chatSubject === sub && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Active</span>}
                  </button>
                ))
              ) : (
                sortedTopics.map(({ topic, score }) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setChatTopic(topic);
                      // Clear active chat session slice on explicit topic change
                      setMessages([]);
                      setIsChatActive(false);
                      setActiveBottomSheet(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border font-bold text-xs transition flex justify-between items-center ${chatTopic === topic ? 'bg-[#0A1128] text-white border-[#0A1128]' : 'bg-slate-50 text-slate-705 border-slate-100 hover:bg-slate-100'}`}
                  >
                    <div className="flex flex-col pr-2 min-w-0">
                      <span className="truncate">{topic}</span>
                      <span className={`text-[9px] mt-0.5 ${chatTopic === topic ? 'text-slate-350' : 'text-slate-450'}`}>
                        {score === null ? 'No evidence yet' : 'Backend mastery state available'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-extrabold uppercase font-mono ${score === null ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-sky-700'}`}>
                        {score === null ? 'Not assessed' : 'Backend state'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
