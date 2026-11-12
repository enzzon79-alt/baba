import React, { useState } from 'react';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Sparkles,
  ArrowRight,
  X,
  ShieldCheck,
  Award,
  Wallet,
  Send
} from 'lucide-react';
import { formatKz } from '../services/db';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onNavigateToWallet?: () => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateToWallet
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const userCode = currentUser
    ? `BABA-${currentUser.name ? currentUser.name.split(' ')[0].toUpperCase() : 'AMIGO'}${currentUser.id ? currentUser.id.slice(-3).toUpperCase() : '94'}`
    : 'BABA-AMIGO94';

  const getAppBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
      return (window.location.origin + window.location.pathname).replace(/\/+$/, '');
    }
    return 'https://ais-pre-phoy7ctpuxm5f3sgpzwe76-708153948394.europe-west2.run.app';
  };
  const appBaseUrl = getAppBaseUrl();
  const inviteLink = `${appBaseUrl}/?ref=${encodeURIComponent(userCode)}`;
  const shareMessage = `Olá! Convido-te a juntar à BABA SHOPPING Angola. Compra produtos originais por atacado em Kwanzas com garantia oficial e revende na plataforma com lucro garantido! Usa o meu código de convite ${userCode} e ganha 500 Kz de bónus de boas-vindas: ${inviteLink}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  // Mock invited friends demonstration data
  const invitedFriends = [
    { name: 'Mateus Silva', date: 'Hoje às 11:20', status: 'ativo', bonus: 1000, bi: '0078...LA041' },
    { name: 'Ana Carvalho', date: 'Ontem às 16:45', status: 'ativo', bonus: 1000, bi: '0089...LA099' },
    { name: 'Paulo Costa', date: 'Há 2 dias', status: 'em_processamento', bonus: 0, bi: '0062...BE012' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto text-neutral-900 relative flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-neutral-950 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Gift className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950">
                  Bónus de Indicação
                </span>
                <span className="text-xs text-amber-300 font-bold hidden sm:inline">
                  +1.000 Kz por Amigo
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                Convidar Amigos & Ganhar Bónus
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left text-xs sm:text-sm">
          {/* Banner Promo */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-[#FF6A00] uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                <span>Como Funciona o Programa de Convites:</span>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Ilimitado
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-neutral-700">
              <div className="p-2.5 rounded-xl bg-white border border-orange-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                <p className="font-bold text-neutral-900 leading-snug">Partilha o Teu Link</p>
                <p className="text-[11px] text-neutral-500 leading-tight">Envia o link ou código para amigos via WhatsApp ou SMS.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-orange-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <p className="font-bold text-neutral-900 leading-snug">Amigo Valida o BI</p>
                <p className="text-[11px] text-neutral-500 leading-tight">O teu amigo cria conta e valida o seu BI nacional com 500 Kz grátis.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-orange-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                <p className="font-bold text-emerald-800 leading-snug">Recebes 1.000 Kz</p>
                <p className="text-[11px] text-neutral-500 leading-tight">O bónus cai diretamente na tua carteira + 1% em todas as revendas dele!</p>
              </div>
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
              <span>O Teu Código Exclusivo de Convite:</span>
              <span className="text-[11px] text-[#FF6A00] font-semibold">Os teus amigos inserem no registo</span>
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50">
              <span className="flex-1 font-mono font-black text-base sm:text-lg text-neutral-900 px-3 tracking-widest text-center">
                {userCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
              <span>Ligação Direta de Indicação:</span>
              <span className="text-[11px] text-neutral-500">Abre já com o código pré-preenchido</span>
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-neutral-200 bg-neutral-50">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-1.5 bg-transparent text-xs text-neutral-700 font-medium truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Ligação Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>Copiar Ligação</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-neutral-700 block">
              Partilhar Imediatamente com os Teus Amigos:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'BABA SHOPPING Angola - Convite',
                      text: shareMessage,
                      url: inviteLink
                    }).catch(() => handleCopyLink());
                  } else {
                    handleCopyLink();
                  }
                }}
                className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Outras Redes / SMS</span>
              </button>
            </div>
          </div>

          {/* Your Invitation Stats */}
          <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  O Teu Painel de Convites
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">
                Atualizado em tempo real
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
                <span className="text-[10px] text-neutral-400 block font-semibold">Amigos Convidados</span>
                <span className="text-base sm:text-lg font-black text-white tabular-nums">3</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
                <span className="text-[10px] text-neutral-400 block font-semibold">Bónus Recebidos</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 tabular-nums">2.000 Kz</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
                <span className="text-[10px] text-neutral-400 block font-semibold">Comissões Revenda</span>
                <span className="text-base sm:text-lg font-black text-amber-400 tabular-nums">1.250 Kz</span>
              </div>
            </div>
          </div>

          {/* Recent Referrals List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-700 block">
              Últimas Indicações:
            </span>
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50/50">
              {invitedFriends.map((f, i) => (
                <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                      {f.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 truncate">{f.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">BI: {f.bi} · {f.date}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {f.status === 'ativo' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        +{formatKz(f.bonus)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Aguardando BI
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantee footer */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garantia de Pagamento Trade Assurance BABA</span>
            </span>
            <span className="font-bold text-neutral-400">
              Bónus creditado automaticamente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
