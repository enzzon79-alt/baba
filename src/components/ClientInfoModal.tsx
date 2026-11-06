import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  LogOut,
  Users,
  Wallet,
  ArrowRightLeft,
  X,
  Package,
  Calendar,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { User as UserType } from '../types';
import { formatKz } from '../services/db';

interface ClientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  wallet?: any;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onOpenInvite: () => void;
  onNavigateToWallet: () => void;
  onNavigateToProducts: () => void;
}

export const ClientInfoModal: React.FC<ClientInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  wallet,
  onLogout,
  onSwitchAccount,
  onOpenInvite,
  onNavigateToWallet,
  onNavigateToProducts
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.idNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogoutClick = () => {
    onClose();
    onLogout();
  };

  const handleSwitchClick = () => {
    onClose();
    onSwitchAccount();
  };

  const handleInviteClick = () => {
    onClose();
    onOpenInvite();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-neutral-900 px-6 py-4 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF5000] flex items-center justify-center text-white shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                Informações do Cliente
              </h3>
              <p className="text-[11px] text-neutral-400">
                Dados cadastrais e gestão da sessão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main User Identity Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-neutral-50 to-orange-50/40 border border-neutral-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-[#FF6A00] flex items-center justify-center font-black text-2xl shadow-md border-2 border-orange-200 shrink-0">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-base sm:text-lg text-neutral-900 truncate">
                  {currentUser.name}
                </h4>
                {currentUser.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[10px] font-black uppercase">
                    Administrador
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    BI Verificado
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5 truncate">
                ID da Conta: {currentUser.id}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Conta Ativa & Regularizada em Angola</span>
              </div>
            </div>
          </div>

          {/* Dados do Bilhete de Identidade e Contactos */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
              Dados Cadastrais Oficiais
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* BI Number Card */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#FF6A00]" />
                    Nº do Bilhete (BI)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-[#FF6A00] hover:text-orange-700 cursor-pointer flex items-center gap-0.5"
                    title="Copiar BI"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono font-black text-sm text-neutral-900 tracking-wider">
                  {currentUser.idNumber}
                </div>
              </div>

              {/* Phone Card */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="flex items-center gap-1 text-neutral-500 text-[10px] font-bold uppercase">
                  <Phone className="w-3 h-3 text-neutral-600" />
                  Telemóvel
                </span>
                <div className="font-bold text-sm text-neutral-900">
                  {currentUser.phone || '+244 923 000 000'}
                </div>
              </div>

              {/* Email Card */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="flex items-center gap-1 text-neutral-500 text-[10px] font-bold uppercase">
                  <Mail className="w-3 h-3 text-neutral-600" />
                  Email Registado
                </span>
                <div className="font-semibold text-xs text-neutral-900 truncate">
                  {currentUser.email}
                </div>
              </div>

              {/* Location Card */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="flex items-center gap-1 text-neutral-500 text-[10px] font-bold uppercase">
                  <MapPin className="w-3 h-3 text-neutral-600" />
                  Localização
                </span>
                <div className="font-semibold text-xs text-neutral-900 truncate">
                  {currentUser.city}, {currentUser.province}
                </div>
              </div>
            </div>
          </div>

          {/* Saldo da Carteira Digital */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-[#FF6A00]" />
                Saldo Disponível na Carteira
              </span>
              <div className="text-xl sm:text-2xl font-black text-neutral-950 tabular-nums">
                {formatKz(wallet?.availableBalance ?? 0)}
              </div>
            </div>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200">
              ✓ Regularizado
            </span>
          </div>

          {/* Atalhos Rápidos: Convidar Amigos & Meus Produtos */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleInviteClick}
              className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-300 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#FF6A00] font-black text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Convidar Amigos
                </span>
                <span className="text-[9px] bg-amber-400 text-neutral-950 font-black px-1.5 py-0.2 rounded">
                  +1.000 Kz
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-tight">
                Ganha 1.000 Kz por cada amigo que validar o BI.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToProducts();
              }}
              className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-neutral-900 font-bold text-xs mb-1">
                <Package className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Meus Produtos</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-tight">
                Gerir artigos adquiridos e vendas no mercado.
              </p>
            </button>
          </div>

          {/* Action Buttons: Mudar de Conta & Terminar Sessão */}
          <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleSwitchClick}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4 text-neutral-600" />
              <span>Mudar de Conta</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
