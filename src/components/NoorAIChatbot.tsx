import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, RotateCcw, MessageCircle, ExternalLink, Users, Phone } from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { evaluateNoorBotQuery } from '../utils/cmsLogic';
import { localizeDynamicText } from '../utils/i18nContent';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const NoorAIChatbot: React.FC = () => {
  const { state, t, language } = useCMS();
  const { aiBotConfig, whatsappConfig, settings } = state;

  const [isOpen, setIsOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppCustomText, setWhatsAppCustomText] = useState('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getInitialGreeting = () => {
    if (language === 'bn') {
      return aiBotConfig.welcomeMessageBn || t.aiAssistantGreeting;
    }
    return t.aiAssistantGreeting;
  };

  // Initialize or reset greeting when language or bot config changes
  useEffect(() => {
    setMessages([
      {
        id: 'bot-init',
        sender: 'bot',
        text: getInitialGreeting(),
        timestamp: language === 'bn' ? 'এইমাত্র' : language === 'ar' ? 'الآن' : 'Just now',
      },
    ]);
  }, [language, t.aiAssistantGreeting, aiBotConfig.welcomeMessageBn]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Evaluate local knowledge base, custom Q&A items, and deterministic guardrail
    const evaluation = evaluateNoorBotQuery(
      query,
      warningCount,
      aiBotConfig,
      settings,
      language
    );

    let reply = evaluation.warningText
      ? `${evaluation.replyText}\n\n${evaluation.warningText}`
      : evaluation.replyText;

    // Optional server API call if not matched by exact Q&A or out-of-scope
    const matchedExactQA = (aiBotConfig.qaItems || []).some(
      (qa) => qa.active && reply === qa.answerBn
    );

    if (!evaluation.isOutOfScope && !matchedExactQA) {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            botName: aiBotConfig.botName,
            knowledgeBase: aiBotConfig.customKnowledgeBase,
            instituteNameBn: settings.instituteNameBn,
            phone: settings.phonePrimary,
            address: settings.address,
            language,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) reply = data.reply;
        }
      } catch {
        // Fallback to evaluation.replyText
      }
    }

    setTimeout(() => {
      setWarningCount(evaluation.newWarningCount);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 350);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getInitialGreeting(),
        timestamp: language === 'bn' ? 'এইমাত্র' : language === 'ar' ? 'الآن' : 'Just now',
      },
    ]);
    setInput('');
  };

  const getCleanWhatsAppNumber = () => {
    const rawPhone = (whatsappConfig?.phoneNumber || settings.phonePrimary).replace(/[^0-9]/g, '');
    return rawPhone.startsWith('88') ? rawPhone : `88${rawPhone}`;
  };

  const openWhatsAppWithMessage = (messageText: string) => {
    const cleanPhone = getCleanWhatsAppNumber();
    const encoded = encodeURIComponent(messageText.trim() || whatsappConfig.defaultMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const suggestedQuestions =
    language === 'bn' && aiBotConfig.suggestedQuestions && aiBotConfig.suggestedQuestions.length > 0
      ? aiBotConfig.suggestedQuestions
      : [t.aiQuestion1, t.aiQuestion2, t.aiQuestion3, t.aiQuestion4, t.aiQuestion5];

  const activeWhatsAppTopics = (whatsappConfig?.quickTopics || []).filter((tp) => tp.active);

  const waCopy = {
    bn: {
      activeLabel: 'সক্রিয়',
      welcomeBodyPrefix: 'আসসালামু আলাইকুম!',
      welcomeBodySuffix: '-এর অফিসিয়াল হোয়াটসঅ্যাপ ডেস্কে আপনাকে স্বাগতম। নিচের যেকোনো বিষয়ে ক্লিক করে সরাসরি কথা বলুন:',
      selectTopic: 'দ্রুত তথ্য জানতে বিষয় নির্বাচন করুন:',
      joinGroup: 'অফিসিয়াল হোয়াটসঅ্যাপ গ্রুপে যুক্ত হোন',
      placeholder: 'আপনার বার্তা লিখুন...',
      sendBtn: 'পাঠান',
      typing: 'লিখছে...',
    },
    en: {
      activeLabel: 'Online',
      welcomeBodyPrefix: 'Assalamu Alaikum! Welcome to the official WhatsApp desk of',
      welcomeBodySuffix: '. Click any topic below to start a direct conversation:',
      selectTopic: 'Select a topic for instant assistance:',
      joinGroup: 'Join Official WhatsApp Community Group',
      placeholder: 'Type your message...',
      sendBtn: 'Send',
      typing: 'Typing...',
    },
    ar: {
      activeLabel: 'متصل الآن',
      welcomeBodyPrefix: 'السلام عليكم! مرحباً بكم في مكتب واتساب الرسمي لـ',
      welcomeBodySuffix: '. اختر أي موضوع أدناه للتحدث المباشر:',
      selectTopic: 'اختر موضوعاً للاستفسار السريع:',
      joinGroup: 'انضم إلى مجموعة واتساب الرسمية',
      placeholder: 'اكتب رسالتك هنا...',
      sendBtn: 'إرسال',
      typing: 'يكتب...',
    },
  }[language];

  return (
    <>
      {/* Floating Action Buttons at Bottom Right */}
      <aside
        aria-label="Contact and AI Assistant"
        className="fixed bottom-20 lg:bottom-5 right-3 sm:right-6 z-40 flex flex-col items-center gap-3"
      >
        {/* 1. AI Assistant Floating Button */}
        {aiBotConfig.enabled && (
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setIsWhatsAppOpen(false);
            }}
            aria-label={isOpen ? 'Close MMM AI Agent' : t.aiAssistantTitle}
            title={isOpen ? 'Close MMM AI Agent' : t.aiAssistantTitle}
            className={`w-13 h-13 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-95 border border-[#e5b94c]/50 ${
              isOpen
                ? 'bg-[#005a6e] hover:bg-[#004454] text-white rotate-90 scale-105'
                : 'bg-gradient-to-tr from-[#0a1738] via-[#192f64] to-[#005a6e] text-[#f0c95e] hover:scale-105 shadow-[#192f64]/45 animate-pulse'
            }`}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white stroke-[2.5]" />
            ) : (
              <Sparkles className="w-6 h-6 text-[#f0c95e] fill-[#f0c95e]/20 animate-spin-slow" />
            )}
          </button>
        )}

        {/* 2. Official WhatsApp Bot Floating Button */}
        {whatsappConfig?.enabled !== false && (
          <button
            type="button"
            onClick={() => {
              setIsWhatsAppOpen((prev) => !prev);
              setIsOpen(false);
            }}
            aria-label="Chat on WhatsApp"
            title={localizeDynamicText(
              whatsappConfig?.floatingTooltipBn || 'হোয়াটসঅ্যাপে সরাসরি কথা বলুন',
              language
            )}
            className={`w-13 h-13 rounded-full text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-green-500/30 ${
              isWhatsAppOpen ? 'bg-emerald-700 rotate-12 scale-105' : 'bg-[#25D366] hover:bg-[#20ba5a]'
            }`}
          >
            {isWhatsAppOpen ? (
              <X className="w-6 h-6 text-white stroke-[2.5]" />
            ) : (
              <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            )}
          </button>
        )}
      </aside>

      {/* Interactive WhatsApp Bot Quick-Inquiry Drawer */}
      {isWhatsAppOpen && whatsappConfig?.enabled !== false && (
        <aside
          aria-label="WhatsApp Quick Inquiry Bot"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          className="fixed bottom-22 sm:bottom-24 right-3 sm:right-6 z-50 w-[94vw] sm:w-[370px] max-h-[84vh] flex flex-col rounded-3xl bg-white dark:bg-[#0b1f17] border border-emerald-200 dark:border-emerald-500/40 shadow-2xl text-slate-900 dark:text-white overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* WhatsApp Header */}
          <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] px-4 py-3.5 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight">
                  {localizeDynamicText(
                    whatsappConfig.welcomeHeadline || 'হোয়াটসঅ্যাপ ভর্তি সহায়তা',
                    language
                  )}
                </h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>
                    {waCopy.activeLabel} •{' '}
                    {localizeDynamicText(whatsappConfig.phoneNumber || settings.phonePrimary, language)}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(false)}
              aria-label="Close WhatsApp Bot"
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-3.5 max-h-[55vh] bg-[#efeae2]/60 dark:bg-[#071510]">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#122b22] border border-emerald-100 dark:border-emerald-500/20 text-xs text-slate-700 dark:text-emerald-100 shadow-xs leading-relaxed">
              {waCopy.welcomeBodyPrefix}{' '}
              <strong>
                {language === 'bn'
                  ? settings.instituteNameBn
                  : language === 'en'
                    ? settings.instituteName
                    : t.instituteName}
              </strong>
              {waCopy.welcomeBodySuffix}
            </div>

            {/* Quick Topics List */}
            {activeWhatsAppTopics.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 px-1">
                  {waCopy.selectTopic}
                </p>
                {activeWhatsAppTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      openWhatsAppWithMessage(localizeDynamicText(topic.prefilledMessage, language))
                    }
                    className="w-full text-left rtl:text-right px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#112a20] hover:bg-emerald-50 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-500/30 text-xs font-bold text-slate-800 dark:text-emerald-100 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span>{localizeDynamicText(topic.labelBn, language)}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Direct WhatsApp Group Link */}
            {whatsappConfig.groupLink && (
              <div className="pt-1">
                <a
                  href={whatsappConfig.groupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/15 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
                >
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{waCopy.joinGroup}</span>
                </a>
              </div>
            )}
          </div>

          {/* Custom Message Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openWhatsAppWithMessage(whatsAppCustomText || whatsappConfig.defaultMessage);
              setWhatsAppCustomText('');
            }}
            className="p-3 bg-white dark:bg-[#0d2119] border-t border-emerald-200/70 dark:border-emerald-500/25 flex items-center gap-2"
          >
            <input
              type="text"
              value={whatsAppCustomText}
              onChange={(e) => setWhatsAppCustomText(e.target.value)}
              placeholder={waCopy.placeholder}
              className="flex-1 rounded-xl bg-slate-50 dark:bg-[#132e23] border border-emerald-200 dark:border-emerald-500/30 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{waCopy.sendBtn}</span>
            </button>
          </form>
        </aside>
      )}

      {/* Interactive AI Assistant Modal Dialog */}
      {isOpen && aiBotConfig.enabled && (
        <aside
          aria-label={t.aiAssistantTitle}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          className="fixed bottom-22 sm:bottom-24 right-3 sm:right-6 z-50 w-[94vw] sm:w-[390px] max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-[#08132e] border border-[#005a6e]/30 dark:border-[#007c91]/45 shadow-2xl text-slate-900 dark:text-white overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 transition-colors"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] px-4 py-3 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f0c95e]" />
              <span className="font-extrabold text-sm tracking-wide">
                {language === 'bn' ? aiBotConfig.botName || t.aiAssistantTitle : t.aiAssistantTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation History & Suggestions Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[50vh] text-xs sm:text-sm">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div
                  key={m.id}
                  className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                      isBot
                        ? 'bg-[#f0f7fa] dark:bg-[#102042] border border-[#005a6e]/20 dark:border-[#007c91]/35 text-slate-800 dark:text-sky-100'
                        : 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span
                      className={`block text-[10px] text-right mt-1 font-mono ${
                        isBot ? 'text-slate-500 dark:text-sky-300/70' : 'text-sky-100/80'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-[#f0f7fa] dark:bg-[#102042] border border-[#005a6e]/25 text-[#192f64] dark:text-sky-200 text-xs flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#192f64] dark:bg-sky-300 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005a6e] dark:bg-[#0ea5b7] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c4962c] dark:bg-[#f0c95e] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">{waCopy.typing}</span>
                </div>
              </div>
            )}

            {/* Quick Suggestions */}
            <div className="pt-2 space-y-2">
              <div className="text-[11px] font-bold text-[#005a6e] dark:text-[#f0c95e] flex items-center justify-between">
                <span>{t.aiCommonQuestionsTitle}</span>
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="text-[10px] text-[#192f64] dark:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.aiResetChat}</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left rtl:text-right p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f1d3b] hover:bg-[#005a6e]/10 dark:hover:bg-[#005a6e]/35 border border-[#005a6e]/20 dark:border-[#007c91]/30 text-xs text-slate-700 dark:text-sky-100 hover:text-[#192f64] dark:hover:text-white transition-all cursor-pointer font-medium leading-tight"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-50 dark:bg-[#0a1738] border-t border-[#005a6e]/20 dark:border-[#007c91]/30 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.aiInputPlaceholder}
              className="flex-1 rounded-xl bg-white dark:bg-[#102042] border border-[#005a6e]/25 dark:border-[#007c91]/35 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#005a6e] dark:focus:border-[#f0c95e] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-gradient-to-r from-[#192f64] to-[#005a6e] hover:opacity-95 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md active:scale-90"
            >
              <Send className="w-4 h-4 ml-0.5 text-[#f0c95e]" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
