import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  Plus,
  History,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ArrowRight,
  Lock,
  MessageSquare,
  RefreshCw,
  X
} from 'lucide-react';
import { User, AssistantConversation } from '../types';
import {
  getAssistantConversations,
  createAssistantConversation,
  sendJenifferChatMessage,
  escalateAssistantConversation,
  markAssistantConversationRead,
  DB_STATE_EVENT
} from '../services/db';

interface AssistantJenifferViewProps {
  currentUser: User;
  onNavigateToWallet?: () => void;
  onNavigateToMarket?: () => void;
}

export const JENIFFER_PHOTO_URL = '/assets/aistudio/IMG_4183_faf19f06.jpeg';

const JenifferAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
      ? 'w-12 h-12'
      : 'w-10 h-10';
  return (
    <div
      className={`${dims} rounded-2xl bg-gradient-to-br from-[#0B132B] via-[#2B1D52] to-[#FF6A00] p-[2px] shrink-0 shadow-sm`}
    >
      <div className="w-full h-full rounded-[14px] bg-[#0B132B] overflow-hidden">
        <img
          src={JENIFFER_PHOTO_URL}
          alt="Assistente Jeniffer"
          className="w-full h-full object-cover object-top"
        />
      </div>
    </div>
  );
};

function renderFormattedText(text: string): React.ReactNode {
  const lines = String(text || '').split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className={i > 0 ? 'block mt-1.5' : 'block'}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
              <strong key={idx} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={idx}>{part}</React.Fragment>;
        })}
      </span>
    );
  });
}

const QUICK_PROMPTS = [
  { label: 'Consultar meu saldo', prompt: 'Como posso consultar o meu saldo atual e qual é o valor disponível?' },
  { label: 'Como fazer depósito', prompt: 'Como posso fazer o depósito na minha carteira?' },
  { label: 'Prazo do saque', prompt: 'Quanto tempo demora o saque e como sei se foi aprovado?' },
  { label: 'Como funciona', prompt: 'Como funciona a plataforma BABA SHOPPING?' },
  { label: 'Publicar produto', prompt: 'Como posso publicar um produto para revender?' },
  { label: 'Cancelar anúncio', prompt: 'Como posso cancelar um anúncio que publiquei?' },
  { label: 'Comprar produto', prompt: 'Como posso comprar um produto?' },
  { label: 'Taxas e comissões', prompt: 'Existem taxas ou comissões nos levantamentos e revendas?' },
  { label: 'Proteger conta', prompt: 'Como posso proteger a minha conta e recuperar acesso?' },
  { label: 'Meus movimentos', prompt: 'Podes consultar o estado dos meus últimos depósitos, saques e pedidos?' }
];

export const AssistantJenifferView: React.FC<AssistantJenifferViewProps> = ({
  currentUser,
  onNavigateToWallet,
  onNavigateToMarket
}) => {
  const [conversations, setConversations] = useState<AssistantConversation[]>(() =>
    getAssistantConversations(currentUser.id)
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const list = getAssistantConversations(currentUser.id);
    return list[0]?.id || null;
  });
  const [historySearch, setHistorySearch] = useState('');
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<{ msg: string; failedText?: string } | null>(null);

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync live updates from SSE / local state
  useEffect(() => {
    const refresh = () => {
      const list = getAssistantConversations(currentUser.id);
      setConversations(list);
    };
    refresh();
    window.addEventListener(DB_STATE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DB_STATE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [currentUser.id]);

  // Ensure at least one initial conversation exists for smooth onboarding
  const activeConversation = useMemo(() => {
    if (!activeConvId) return conversations[0] || null;
    return conversations.find(c => c.id === activeConvId) || conversations[0] || null;
  }, [conversations, activeConvId]);

  useEffect(() => {
    if (activeConversation && activeConversation.id !== activeConvId) {
      setActiveConvId(activeConversation.id);
    }
  }, [activeConversation, activeConvId]);

  useEffect(() => {
    if (activeConversation?.unreadByUser) {
      markAssistantConversationRead(activeConversation.id, 'user');
    }
  }, [activeConversation?.id, activeConversation?.unreadByUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length, isSending]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.lastMessagePreview || '').toLowerCase().includes(q) ||
        (c.messages || []).some(m => (m.text || '').toLowerCase().includes(q))
    );
  }, [conversations, historySearch]);

  const handleNewConversation = () => {
    const created = createAssistantConversation(currentUser, 'Novo Atendimento');
    setConversations(getAssistantConversations(currentUser.id));
    setActiveConvId(created.id);
    setChatError(null);
    setShowMobileHistory(false);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride !== undefined ? textOverride : inputText).trim();
    if (!textToSend || isSending) return;

    let targetConv = activeConversation;
    if (!targetConv) {
      targetConv = createAssistantConversation(currentUser, textToSend.slice(0, 42));
      setActiveConvId(targetConv.id);
    }

    if (textOverride === undefined) {
      setInputText('');
    }
    setChatError(null);
    setIsSending(true);

    try {
      const result = await sendJenifferChatMessage(targetConv.id, currentUser.id, textToSend);
      setConversations(getAssistantConversations(currentUser.id));
      if (!result.ok) {
        setChatError({
          msg: result.error || 'Não foi possível obter resposta da Assistente Jeniffer.',
          failedText: textToSend
        });
      }
    } catch {
      setChatError({
        msg: 'Erro de ligação ao servidor ao contactar a Assistente Jeniffer.',
        failedText: textToSend
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEscalating) return;
    let targetConv = activeConversation;
    if (!targetConv) {
      targetConv = createAssistantConversation(currentUser, 'Atendimento ao Administrador');
      setActiveConvId(targetConv.id);
    }
    setIsEscalating(true);
    try {
      const res = await escalateAssistantConversation(
        targetConv.id,
        currentUser.id,
        escalateReason.trim() || 'Solicitação de acompanhamento humano pelo Administrador.'
      );
      setConversations(getAssistantConversations(currentUser.id));
      if (res.ok) {
        setShowEscalateModal(false);
        setEscalateReason('');
      } else {
        setChatError({ msg: res.error || 'Falha ao encaminhar atendimento.' });
      }
    } finally {
      setIsEscalating(false);
    }
  };

  const getStatusMeta = (status: AssistantConversation['status']) => {
    if (status === 'aguardando_adm') {
      return {
        label: 'Encaminhado ao Administrador',
        textClass: 'text-amber-700',
        icon: <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      };
    }
    if (status === 'resolvido') {
      return {
        label: 'Atendimento Resolvido',
        textClass: 'text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      };
    }
    return {
      label: 'Online 24/24h · Ilimitado',
      textClass: 'text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    };
  };

  const welcomePreviewMessages = activeConversation?.messages || [
    {
      id: 'preview_welcome',
      conversationId: 'preview',
      sender: 'jeniffer' as const,
      senderName: 'Assistente Jeniffer',
      text: `Olá ${currentUser.name?.split(' ')[0] || 'Cliente'}! Sou a **Assistente Jeniffer**, a tua gerente virtual oficial na BABA SHOPPING.\n\nEstou disponível para responder a qualquer pergunta sobre depósitos, prazos de levantamento, compras, publicação ou cancelamento de anúncios, segurança da conta, taxas e comissões, além de consultar os teus dados reais autorizados.\n\nSe preferires atendimento humano direto, podes clicar em **Falar com Administrador**. Como posso ajudar hoje?`,
      timestamp: new Date().toISOString()
    }
  ];

  const activeStatus = getStatusMeta(activeConversation?.status || 'ativo');

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[620px] lg:h-[calc(100vh-185px)] max-h-[820px]">
        {/* LEFT SIDEBAR: HISTÓRICO DE CONVERSAS */}
        <aside
          className={`${
            showMobileHistory ? 'flex fixed inset-0 z-50 bg-white' : 'hidden lg:flex'
          } lg:static lg:w-80 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/60`}
        >
          <div className="p-4 border-b border-neutral-200 bg-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <History className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <h2 className="text-sm font-bold text-neutral-900 truncate">Histórico de Conversas</h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleNewConversation}
                className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Nova</span>
              </button>
              {showMobileHistory && (
                <button
                  type="button"
                  onClick={() => setShowMobileHistory(false)}
                  className="lg:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                  aria-label="Fechar histórico"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-3 border-b border-neutral-200/80">
            <div className="relative">
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Pesquisar conversas..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#FF6A00]"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200/70">
            {filteredHistory.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-500">
                  {historySearch.trim()
                    ? 'Nenhuma conversa corresponde à pesquisa.'
                    : 'Ainda não tens conversas anteriores. Escreve à Assistente Jeniffer para começar.'}
                </p>
              </div>
            ) : (
              filteredHistory.map(conv => {
                const isSelected = activeConversation?.id === conv.id;
                const statusInfo = getStatusMeta(conv.status);
                const dateLabel = new Date(conv.updatedAt || conv.createdAt).toLocaleDateString('pt-AO', {
                  day: '2-digit',
                  month: '2-digit'
                });
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowMobileHistory(false);
                      setChatError(null);
                    }}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer space-y-1 ${
                      isSelected ? 'bg-white border-r-2 border-r-[#FF6A00]' : 'hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900 truncate">
                        {conv.title || 'Atendimento BABA'}
                      </span>
                      <span className="text-[11px] text-neutral-400 tabular-nums shrink-0">{dateLabel}</span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-snug">
                      {conv.lastMessagePreview || 'Sem mensagens ainda'}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                      <span className={`flex items-center gap-1 font-medium ${statusInfo.textClass}`}>
                        {statusInfo.icon}
                        <span className="truncate">{statusInfo.label}</span>
                      </span>
                      {conv.unreadByUser && (
                        <span className="text-[11px] font-bold text-[#FF5000]">Nova resposta</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3.5 border-t border-neutral-200 bg-white space-y-2">
            <div className="flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed">
              <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <span>
                Privacidade protegida: a Jeniffer consulta apenas os teus dados autorizados e nunca realiza operações financeiras diretas.
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-200 bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowMobileHistory(true)}
                className="lg:hidden px-2.5 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                title="Ver histórico de conversas"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Histórico</span>
              </button>

              <JenifferAvatar size="lg" />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-neutral-950 truncate">
                    Assistente Jeniffer
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 truncate">
                  <span className="truncate">Gerente Virtual BABA SHOPPING</span>
                  <span aria-hidden="true">·</span>
                  <span className={`flex items-center gap-1 font-medium shrink-0 ${activeStatus.textClass}`}>
                    {activeStatus.icon}
                    <span>{activeStatus.label}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleNewConversation}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Conversa</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Falar com Administrador</span>
                <span className="sm:hidden">Adm</span>
              </button>
            </div>
          </div>

          {/* Escalation Notice Strip if Waiting Admin */}
          {activeConversation?.status === 'aguardando_adm' && (
            <div className="px-4 sm:px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  Atendimento encaminhado ao Administrador
                  {activeConversation.escalationReason ? ` · Motivo: ${activeConversation.escalationReason}` : ''}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 shrink-0">A aguardar resposta</span>
            </div>
          )}

          {/* Quick Starters & Shortcuts Bar */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-neutral-100 bg-neutral-50/70 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            {QUICK_PROMPTS.map(item => (
              <button
                key={item.label}
                type="button"
                disabled={isSending}
                onClick={() => handleSendMessage(item.prompt)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-orange-50 border border-neutral-200 hover:border-[#FF6A00]/50 text-xs font-medium text-neutral-700 hover:text-[#FF5000] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
            {onNavigateToWallet && (
              <button
                type="button"
                onClick={onNavigateToWallet}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Abrir Carteira</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {onNavigateToMarket && (
              <button
                type="button"
                onClick={onNavigateToMarket}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Ir ao Mercado</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-[#FAF9FC]">
            {welcomePreviewMessages.map(msg => {
              const isUser = msg.sender === 'user';
              const isAdmin = msg.sender === 'admin';
              const timeStr = new Date(msg.timestamp).toLocaleTimeString('pt-AO', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    isAdmin ? (
                      <div className="w-9 h-9 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="mt-1 shrink-0">
                        <JenifferAvatar size="sm" />
                      </div>
                    )
                  )}

                  <div className={`max-w-[85%] sm:max-w-[74%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 px-1">
                      <span className="font-semibold text-neutral-700">
                        {isUser ? 'Tu' : isAdmin ? `${msg.senderName} · Administrador` : 'Assistente Jeniffer'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{timeStr}</span>
                    </div>

                    <div
                      className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-neutral-950 text-white rounded-tr-sm shadow-xs'
                          : isAdmin
                          ? 'bg-amber-50 border border-amber-300 text-neutral-950 rounded-tl-sm shadow-2xs'
                          : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-2xs'
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                    </div>

                    {msg.consultedTools && msg.consultedTools.length > 0 && (
                      <div className="text-[11px] text-neutral-500 px-1 flex items-center gap-1.5 flex-wrap">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Consulta real verificada: {msg.consultedTools.join(' · ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="mt-1 shrink-0">
                  <JenifferAvatar size="sm" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 text-[#FF6A00] animate-spin" />
                  <span>Assistente Jeniffer está a consultar os dados e a preparar a resposta...</span>
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{chatError.msg}</span>
                </div>
                {chatError.failedText && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(chatError.failedText)}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Tentar Novamente
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <form
            onSubmit={e => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="p-3.5 sm:p-4 border-t border-neutral-200 bg-white space-y-2 shrink-0"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isSending}
                placeholder="Escreve a tua pergunta à Assistente Jeniffer (saldo, depósitos, saques, BI, revenda...)"
                className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 transition-all"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 shrink-0 whitespace-nowrap transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400 px-1">
              <span>Assistente Jeniffer · Atendimento 24/24h com perguntas ilimitadas</span>
              <span className="hidden sm:inline">Operações financeiras são aprovadas apenas pelo Administrador</span>
            </div>
          </form>
        </section>
      </div>

      {/* ESCALATION TO ADMIN MODAL */}
      {showEscalateModal && (
        <div
          onClick={() => setShowEscalateModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950">Encaminhar ao Administrador</h3>
                  <p className="text-xs text-neutral-500">Intervenção humana direta pelo Painel Adm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEscalate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">
                  Descreve brevemente o motivo (opcional):
                </label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={e => setEscalateReason(e.target.value)}
                  placeholder="Ex.: Preciso de verificação manual de um comprovativo ou ajuste no meu pedido..."
                  className="w-full p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-[#FF6A00] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEscalating}
                  className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isEscalating ? 'A encaminhar...' : 'Confirmar Encaminhamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
