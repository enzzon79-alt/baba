// @ts-nocheck
import { AuthPage } from './components/AuthPage';
import { CurrencySelector } from './components/CurrencySelector';
import { PurchaseNoticeModal, type PurchaseNotice } from './components/PurchaseNoticeModal';
import { InviteFriendsModal, InviteFriendsView } from './components/InviteFriendsModal';
import { ClientInfoModal } from './components/ClientInfoModal';
import { AdminPanel } from './components/AdminPanel';
import { PRODUCT_8_COLORS, DEFAULT_8_COLORS } from './types';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable */


import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';

const _ = React;

const jsx = (type: any, props: any) => {
  if (!props) return React.createElement(type);
  const { children, key, ...rest } = props;
  const config = key !== undefined ? { ...rest, key } : rest;
  if (Array.isArray(children)) {
    return React.createElement(type, config, ...children);
  } else if (children !== undefined) {
    return React.createElement(type, config, children);
  }
  return React.createElement(type, config);
};
const jsxs = jsx;
const V = { jsx, jsxs, Fragment };


import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpDown,
  ArrowUpRight,
  Ban,
  BarChart3,
  Bell,
  Building2,
  Car,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Dumbbell,
  Eye,
  FileText,
  Gift,
  History,
  Home,
  Info,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  PenLine,
  Percent,
  Phone,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Watch,
  Wrench,
  X
} from 'lucide-react';

const qe = ArrowDownLeft;
const Je = ArrowRightLeft;
const Ye = ArrowRight;
const Xe = ArrowUpDown;
const Ze = ArrowUpRight;
const Qe = Ban;
const $e = Bell;
const et = Building2;
const tt = Car;
const nt = BarChart3;
const rt = CheckCheck;
const it = Check;
const at = ChevronDown;
const ot = ChevronRight;
const st = AlertCircle;
const ct = CheckCircle2;
const lt = PlusCircle;
const ut = Clock;
const dt = DollarSign;
const ft = Dumbbell;
const pt = Eye;
const mt = FileText;
const ht = History;
const gt = Home;
const _t = Info;
const vt = KeyRound;
const yt = Laptop;
const bt = Layers;
const xt = Lock;
const St = LogOut;
const Ct = MapPin;
const wt = MessageSquare;
const L = Package;
const Tt = PenLine;
const Et = Percent;
const Dt = Phone;
const Ot = Plus;
const kt = RefreshCw;
const At = RotateCcw;
const jt = Search;
const Mt = Send;
const Nt = Share2;
const Pt = ShieldAlert;
const R = ShieldCheck;
const Ft = Shirt;
const z = ShoppingBag;
const It = Smartphone;
const Lt = Sparkles;
const Rt = Star;
const zt = Store;
const Bt = Tag;
const Vt = Trash2;
const Ht = TrendingUp;
const Ut = Truck;
const Wt = Upload;
const B = UserCheck;
const Gt = UserPlus;
const Kt = User;
const qt = Users;
const Jt = Wallet;
const Yt = Watch;
const Xt = Wrench;
const Zt = X;

const showAppNotice = (msg: string, type: 'error' | 'success' = 'error') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('baba_in_app_notification', { detail: { msg, type } }));
  }
};


import {
  initDatabase as ae,
  getUsers as oe,
  getCurrentUser as se,
  setCurrentUser as ce,
  logoutUser,
  registerUser as le,
  approveKYC as ue,
  rejectKYC as de,
  getPendingKYCUsers as fe,
  resubmitKYCDocuments as pe,
  getProducts as me,
  createProduct as he,
  updateProduct as ge,
  getUserProducts as _e,
  getResaleListings as ve,
  getAllResaleListings as veAll,
  getSpendableBalance as getLivre,
  getPendingReservedAmount as getReservado,
  createResaleListing as ye,
  cancelResaleListing as j,
  getNegotiations as M,
  createNegotiation as be,
  respondSellerNegotiation as xe,
  respondBuyerNegotiation as Se,
  sendNegotiationMessage as Ce,
  getWallets as we,
  getWallet as N,
  getTransactions as Te,
  requestDeposit as Ee,
  approveDeposit as De,
  requestWithdrawal as Oe,
  processWithdrawal as ke,
  purchaseOfficialProduct as Ae,
  purchaseResaleListing as je,
  getOrders as Me,
  updateOrderStatus as Ne,
  getOrderStatusLabel as Pe,
  getNotifications as Fe,
  createNotification as P,
  markNotificationAsRead as Ie,
  markAllNotificationsAsRead as Le,
  getDeposits as Re,
  getWithdrawals as ze,
  formatKz as F,
  DB_STATE_EVENT as re,
  CURRENCIES,
  getActiveCurrency,
  syncUsersFromFirestore,
  syncAdminCollectionsFromFirestore,
  getUserInviteCode
} from './services/db';
import { compressImageToDataUrl, copyTextToClipboard } from './utils/image';

import {
  CATEGORIES as y,
  CATEGORIES as S,
  ANGOLAN_PROVINCES as ne
} from './data/mockData';


let $t: any, en: any, tn: any, nn: any, rn: any, an: any, on: any, sn: any, cn: any, ln: any, un: any, dn: any, fn: any, pn: any, mn: any, hn: any, gn: any;
let BabaLogo: any, AppHeader: any, BottomNavBar: any, ProductDetailModal: any, HomeMarketView: any, OfficialMarketView: any, NegotiationModal: any, ResaleMarketView: any, MyProductsView: any, WalletView: any, NotificationsDrawer: any, CartDrawer: any, ProfileView: any;
$t=({size:e=`md`,showSlogan:t=!0,theme:n=`light`,className:r=``})=>{
    let i={sm:`w-8 h-8`,md:`w-11 h-11`,lg:`w-14 h-14`,xl:`w-20 h-20`}[e],
        a={sm:`text-lg`,md:`text-2xl`,lg:`text-3xl`,xl:`text-5xl`}[e],
        o={sm:`text-[9px]`,md:`text-[11px]`,lg:`text-xs`,xl:`text-sm`}[e];
    return(0,V.jsxs)(`div`,{className:`flex items-center gap-2.5 sm:gap-3.5 select-none ${r}`,children:[
      (0,V.jsx)(`div`,{className:`${i} relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF5000] via-[#FF6A00] to-[#FFAA00] shadow-md shadow-orange-500/25 p-1.5 transition-transform hover:scale-105`,children:
        (0,V.jsxs)(`svg`,{viewBox:`0 0 100 100`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,className:`w-full h-full drop-shadow-sm`,children:[
          (0,V.jsx)(`rect`,{x:`15`,y:`15`,width:`70`,height:`70`,rx:`22`,fill:`#FFFFFF`,fillOpacity:`0.18`}),
          (0,V.jsx)(`path`,{d:`M28 32H72L65 72H35L28 32Z`,fill:`#FFFFFF`}),
          (0,V.jsx)(`path`,{d:`M40 32V24C40 18.5 44.5 14 50 14C55.5 14 60 18.5 60 24V32`,stroke:`#FFFFFF`,strokeWidth:`6`,strokeLinecap:`round`}),
          (0,V.jsx)(`path`,{d:`M43 42H57C61 42 63 44 63 47C63 50 61 52 57 52H43V42Z`,fill:`#FF5000`}),
          (0,V.jsx)(`path`,{d:`M43 52H59C63.5 52 66 54.5 66 58C66 61.5 63.5 64 59 64H43V52Z`,fill:`#FF5000`}),
          (0,V.jsx)(`circle`,{cx:`74`,cy:`28`,r:`6`,fill:`#10B981`})
        ]})
      }),
      (0,V.jsxs)(`div`,{className:`flex flex-col justify-center leading-none`,children:[
        (0,V.jsxs)(`div`,{className:`font-black tracking-tight flex items-center gap-1.5 ${a}`,children:[
          (0,V.jsx)(`span`,{className:n===`dark`?`text-white`:`text-neutral-950 font-black tracking-tighter`,children:`BABA`}),
          (0,V.jsxs)(`button`,{type:`button`,onClick:e=>{e.stopPropagation();window.dispatchEvent(new CustomEvent('baba_open_country_modal'))},title:`Escolher o País`,className:`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 border border-amber-300 shadow-2xs flex items-center gap-1 cursor-pointer hover:brightness-105 active:scale-95 transition-all`,children:[
            (0,V.jsx)(`span`,{children:`SHOPPING`}),
            (0,V.jsx)(`span`,{className:`text-xs`,children:CURRENCIES[getActiveCurrency()]?.flag||`🇧🇷`})
          ]})
        ]}),
        t&&(0,V.jsxs)(`div`,{className:`font-bold tracking-wider text-neutral-500 mt-1 flex items-center gap-1.5 ${o}`,children:[
          (0,V.jsx)(`span`,{className:`text-neutral-700 font-extrabold hover:text-[#FF6A00] transition-colors`,children:`Compra`}),
          (0,V.jsx)(`span`,{className:`text-amber-500`,children:`•`}),
          (0,V.jsx)(`span`,{className:`text-neutral-700 font-extrabold hover:text-[#FF6A00] transition-colors`,children:`Revende`}),
          (0,V.jsx)(`span`,{className:`text-amber-500`,children:`•`}),
          (0,V.jsx)(`span`,{className:`text-[#FF6A00] font-black`,children:`Lucra`})
        ]})
      ]})
    ]});
  };
BabaLogo = $t;
en = ({
  currentUser: e,
  wallet: t,
  unreadCount: n,
  cartCount: r,
  activeTab: i,
  setActiveTab: a,
  onOpenNotifications: o,
  onOpenCart: s,
  onOpenAuth: c,
  searchQuery: l,
  setSearchQuery: u,
  onSelectCategory: d,
  activeCategory: f = 'all',
  onOpenInvite,
  onOpenClientInfo
}: any) => {
  const [p, m] = useState(f || 'all');
  useEffect(() => {
    m(f || 'all');
  }, [f]);

  const isMarketTab = i === 'inicio' || i === 'oficial' || i === 'revenda';
  const selectCategory = (cat: string) => {
    if (d) {
      d(cat);
    } else {
      a('inicio');
    }
  };
  const isAdmin = e && (e.role === 'admin' || e.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62');

  const categoryButtons = [
    { id: 'telemoveis_acessorios', label: '📱 Telemóveis' },
    { id: 'computadores_eletronicos', label: '💻 Computadores' },
    { id: 'roupas_calcados', label: '👕 Roupas & Calçados' },
    { id: 'produtos_beleza', label: '✨ Beleza & Perfumes' },
    { id: 'casa_decoracao', label: '🏠 Casa & Decoração' },
    { id: 'relogios_acessorios', label: '⌚ Relógios' },
    { id: 'equipamentos_ferramentas', label: '🔧 Ferramentas' },
    { id: 'produtos_automoveis', label: '🚗 Automóveis' },
    { id: 'desporto_lazer', label: '⚽ Desporto & Lazer' },
    { id: 'produtos_variados', label: '📦 Variados' }
  ];

  const handleOpenInvite = () => {
    if (onOpenInvite) onOpenInvite();
    else a('convidar');
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-white border-b border-neutral-200 transition-all shadow-xs">
      {/* Linha Superior Principal */}
      <div className="w-full max-w-full px-3 sm:px-5 lg:px-6 py-2 flex items-center justify-between gap-2 md:gap-3">
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              a('inicio');
              d && d('all');
            }}
            className="flex items-center text-left focus:outline-none cursor-pointer"
          >
            <BabaLogo size="md" theme="light" showSlogan={isMarketTab} />
          </button>
        </div>

        {/* Barra de Pesquisa (APENAS no Mercado) OU Navegação Limpa Desktop nas outras páginas */}
        {isMarketTab ? (
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <form
              onSubmit={ev => {
                ev.preventDefault();
                p !== 'all' && d && d(p);
              }}
              className="w-full flex items-center rounded-xl border-2 border-[#FF6A00] bg-white overflow-hidden shadow-xs hover:border-[#FF5000] focus-within:border-[#FF5000] transition-colors"
            >
              <div className="relative border-r border-neutral-200 bg-neutral-50 shrink-0">
                <select
                  value={p}
                  onChange={ev => {
                    m(ev.target.value);
                    d && d(ev.target.value);
                  }}
                  className="text-xs font-semibold text-neutral-700 bg-transparent py-2 pl-3 pr-7 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="telemoveis_acessorios">Telemóveis e Acessórios</option>
                  <option value="computadores_eletronicos">Computadores e Eletrónicos</option>
                  <option value="roupas_calcados">Roupas e Calçados</option>
                  <option value="produtos_beleza">Produtos de Beleza</option>
                  <option value="casa_decoracao">Casa e Decoração</option>
                  <option value="relogios_acessorios">Relógios e Acessórios</option>
                  <option value="equipamentos_ferramentas">Equipamentos e Ferramentas</option>
                  <option value="produtos_automoveis">Produtos Automóveis</option>
                  <option value="desporto_lazer">Desporto e Lazer</option>
                  <option value="produtos_variados">Produtos Variados</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
              <input
                type="text"
                value={l}
                onChange={ev => u(ev.target.value)}
                placeholder="Pesquisar produtos para comprar ou revender..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Pesquisar</span>
              </button>
            </form>
          </div>
        ) : (
          <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
            <button
              type="button"
              onClick={() => {
                a('inicio');
                d && d('all');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 hover:text-[#FF6A00] hover:bg-orange-50 transition-colors cursor-pointer"
            >
              Mercado
            </button>
            <button
              type="button"
              onClick={() => a('meus_produtos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                i === 'meus_produtos'
                  ? 'bg-neutral-900 text-amber-400 shadow-xs'
                  : 'text-neutral-700 hover:text-[#FF6A00] hover:bg-orange-50'
              }`}
            >
              Meus Produtos
            </button>
            <button
              type="button"
              onClick={handleOpenInvite}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                i === 'convidar'
                  ? 'bg-neutral-900 text-amber-400 shadow-xs'
                  : 'text-neutral-700 hover:text-[#FF6A00] hover:bg-orange-50'
              }`}
            >
              Convidar
            </button>
            <button
              type="button"
              onClick={() => a('carteira')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                i === 'carteira'
                  ? 'bg-neutral-900 text-amber-400 shadow-xs'
                  : 'text-neutral-700 hover:text-[#FF6A00] hover:bg-orange-50'
              }`}
            >
              Carteira
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => a('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  i === 'admin'
                    ? 'bg-amber-400 text-neutral-950 shadow-xs'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                Admin
              </button>
            ) : (
              <button
                type="button"
                onClick={() => a('perfil')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  i === 'perfil'
                    ? 'bg-neutral-900 text-amber-400 shadow-xs'
                    : 'text-neutral-700 hover:text-[#FF6A00] hover:bg-orange-50'
                }`}
              >
                Perfil
              </button>
            )}
          </nav>
        )}

        {/* Controlos à Direita */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 shrink">
          {isMarketTab && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => a('meus_produtos')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-[#FF5000] border border-orange-200 transition-all cursor-pointer shrink-0"
              >
                <L className="w-3.5 h-3.5" />
                <span>Meus Produtos</span>
              </button>
              <button
                type="button"
                onClick={handleOpenInvite}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer shrink-0"
              >
                <Gift className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Convidar</span>
              </button>
              <button
                type="button"
                onClick={() => a('carteira')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
              >
                <Jt className="w-3.5 h-3.5" />
                <span className="tabular-nums">{F(t.availableBalance)}</span>
              </button>
            </div>
          )}

          <CurrencySelector className="shrink-0" />

          <button
            type="button"
            onClick={o}
            title="Notificações"
            className="relative flex items-center gap-1 px-2 py-1.5 text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 text-xs font-bold"
          >
            <Bell className="w-4 h-4 text-neutral-700" />
            {n > 0 && (
              <span className="px-1.5 py-0.2 bg-[#FF5000] text-white text-[10px] font-black rounded-full">
                {n > 9 ? '9+' : n}
              </span>
            )}
          </button>

          {(isMarketTab || r > 0) && (
            <button
              type="button"
              onClick={s}
              title="Carrinho de Compras"
              className="relative flex items-center gap-1 px-2 py-1.5 text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 text-xs font-bold"
            >
              <ShoppingBag className="w-4 h-4 text-neutral-700" />
              {r > 0 && (
                <span className="px-1.5 py-0.2 bg-neutral-950 text-amber-400 text-[10px] font-black rounded-full">
                  {r}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={e ? (onOpenClientInfo || c) : c}
            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl border border-neutral-200 hover:border-[#FF6A00]/60 bg-white hover:bg-orange-50/40 text-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-2xs min-w-0"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 text-amber-400 flex items-center justify-center text-xs font-black shrink-0">
              {e ? e.name.charAt(0) : '?'}
            </div>
            <span className="max-w-[68px] sm:max-w-[110px] truncate">
              {e ? e.name.split(' ')[0] : 'Conta'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Pesquisa Mobile (APENAS nas páginas de Mercado) */}
      {isMarketTab && (
        <div className="md:hidden px-3 pb-2 pt-1 bg-white border-t border-neutral-100">
          <div className="relative w-full">
            <input
              type="text"
              value={l}
              onChange={ev => u(ev.target.value)}
              placeholder="Pesquisar produtos no mercado..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-100 text-xs text-neutral-900 placeholder-neutral-400 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </div>
        </div>
      )}

      {/* Faixa Única de Categorias de Produto (APENAS nas páginas de Mercado) */}
      {isMarketTab && (
        <div className="bg-neutral-900 text-neutral-200 text-xs border-t border-neutral-800 px-3 sm:px-5 lg:px-6 py-2 w-full max-w-full overflow-hidden">
          <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-neutral-700">
              <button
                type="button"
                onClick={() => a('inicio')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  i === 'inicio' || i === 'oficial'
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                Mercado Oficial
              </button>
              <button
                type="button"
                onClick={() => a('revenda')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  i === 'revenda'
                    ? 'bg-amber-400 text-neutral-950 shadow-xs'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                Revenda P2P
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 font-semibold">
              <button
                type="button"
                onClick={() => selectCategory('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  !f || f === 'all'
                    ? 'bg-[#FF6A00] text-white shadow-xs'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todas as Categorias</span>
              </button>

              {categoryButtons.map(cat => {
                const isSelected =
                  f === cat.id ||
                  (cat.id === 'roupas_calcados' && f === 'roupas_calcados_moda');
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#FF6A00] text-white shadow-xs'
                        : 'text-neutral-200 hover:bg-neutral-800 hover:text-[#FF6A00]'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
AppHeader = en;

tn = ({ activeTab: e, setActiveTab: t, userRole: n, isAdmin: isAdmProp, unreadCount: r = 0, onOpenInvite }: any) => {
  const isAdminUser = Boolean(isAdmProp || n === 'admin');
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[45] bg-white/95 backdrop-blur-md border-t border-neutral-200 px-1.5 sm:px-4 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-bottom">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-0.5 sm:gap-2">
        <button
          type="button"
          onClick={() => t('inicio')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
            e === 'inicio' ? 'text-amber-600 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-full">Início</span>
        </button>

        <button
          type="button"
          onClick={() => t('oficial')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
            e === 'oficial' || e === 'revenda' ? 'text-amber-600 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-full">Mercado</span>
        </button>

        <button
          type="button"
          onClick={() => t('meus_produtos')}
          className={`flex-1 min-w-0 relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
            e === 'meus_produtos' ? 'text-amber-600 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <L className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[11px] leading-tight text-center tracking-tight whitespace-nowrap max-w-full">Meus Produtos</span>
          {r > 0 && <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
        </button>

        <button
          type="button"
          onClick={() => (onOpenInvite ? onOpenInvite() : t('convidar'))}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
            e === 'convidar' ? 'text-amber-600 font-bold' : 'text-[#FF6A00] font-bold hover:text-orange-700'
          }`}
        >
          <Gift className={`w-5 h-5 mb-0.5 ${e === 'convidar' ? 'text-amber-600' : 'text-[#FF6A00]'}`} />
          <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-full">Convidar</span>
        </button>

        <button
          type="button"
          onClick={() => t('carteira')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
            e === 'carteira' ? 'text-amber-600 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Jt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-full">Carteira</span>
        </button>

        <button
          type="button"
          onClick={() => t(isAdminUser ? 'admin' : 'perfil')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
            e === 'perfil' || e === 'admin' ? 'text-amber-600 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          {isAdminUser ? <Pt className="w-5 h-5 mb-0.5 text-amber-600" /> : <Kt className="w-5 h-5 mb-0.5" />}
          <span className={`text-[10px] sm:text-[11px] tracking-tight truncate max-w-full ${isAdminUser ? 'text-amber-600 font-bold' : ''}`}>
            {isAdminUser ? 'Admin' : 'Perfil'}
          </span>
        </button>
      </div>
    </nav>
  );
};
BottomNavBar = tn;
nn=({product:e,onClose:t,onAddToCart:n,onDirectBuy:r})=>{let[i,a]=(0,_.useState)(1),[o,s]=(0,_.useState)(0),[c,l]=(0,_.useState)(!1),[chosenColor,setChosenColor]=(0,_.useState)(()=>e?.selectedColor||'Preto');(0,_.useEffect)(()=>{if(e)setChosenColor(e.selectedColor||'Preto')},[e]);if(!e)return null;let u=e.suggestedResalePrice||Math.round(e.officialPrice*1.4),d=u-e.officialPrice,f=d*i,p=e.officialPrice*i,m=e.gallery&&e.gallery.length>0?[e.imageUrl,...e.gallery]:[e.imageUrl];return(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto text-neutral-900 relative max-h-[92vh] flex flex-col`,onClick:e=>e.stopPropagation(),children:[(0,V.jsxs)(`div`,{className:`px-6 py-3.5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 shrink-0`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2 text-xs`,children:[(0,V.jsx)(`span`,{className:`px-2 py-0.5 rounded bg-[#FF6A00] text-white font-black text-[10px] tracking-wider uppercase`,children:`BABA Trade Assurance`}),(0,V.jsx)(`span`,{className:`text-neutral-400 hidden sm:inline`,children:`· Fornecedor Verificado Ouro 5 Anos`})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsxs)(`button`,{onClick:()=>{navigator.clipboard?.writeText(window.location.href),l(!0),setTimeout(()=>l(!1),2e3)},className:`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1`,title:`Copiar ligação`,children:[(0,V.jsx)(Nt,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{className:`hidden sm:inline`,children:c?`Copiado!`:`Partilhar`})]}),(0,V.jsx)(`button`,{onClick:t,className:`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]})]}),(0,V.jsx)(`div`,{className:`p-6 overflow-y-auto space-y-6`,children:(0,V.jsxs)(`div`,{className:`grid grid-cols-1 md:grid-cols-12 gap-8 items-start`,children:[(0,V.jsxs)(`div`,{className:`md:col-span-5 space-y-3`,children:[(0,V.jsxs)(`div`,{className:`relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-inner group`,children:[(0,V.jsx)(`img`,{src:m[o]||e.imageUrl,alt:e.name,referrerPolicy:`no-referrer`,onError:e=>{e.currentTarget.onerror=null;e.currentTarget.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';},className:`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`}),(0,V.jsxs)(`span`,{className:`absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1`,children:[(0,V.jsx)(R,{className:`w-3.5 h-3.5 text-amber-400`}),`Foto Original`]})]}),m.length>1&&(0,V.jsx)(`div`,{className:`flex items-center gap-2 overflow-x-auto pb-1`,children:m.map((e,t)=>(0,V.jsx)(`button`,{onClick:()=>s(t),className:`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${o===t?`border-[#FF6A00] ring-2 ring-orange-200`:`border-neutral-200 opacity-70 hover:opacity-100`}`,children:(0,V.jsx)(`img`,{src:e,alt:`Miniatura`,className:`w-full h-full object-cover`})},t))}),(0,V.jsxs)(`div`,{className:`p-4 rounded-xl bg-orange-50/60 border border-orange-200 text-neutral-800 space-y-2 text-xs`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2 font-bold text-[#FF5000]`,children:[(0,V.jsx)(et,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:e.supplierName||`Hub Oficial BABA Angola (Fornecedor Verificado)`})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-3 text-neutral-600 text-[11px]`,children:[(0,V.jsxs)(`span`,{className:`flex items-center gap-1 text-amber-600 font-semibold`,children:[(0,V.jsx)(Rt,{className:`w-3.5 h-3.5 fill-amber-400 text-amber-400`}),e.supplierRating||`4.9`,` / 5.0`]}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsxs)(`span`,{children:[`Taxa de Resposta: `,(0,V.jsx)(`strong`,{children:`99.8%`})]}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsxs)(`span`,{children:[`Envio a Tempo: `,(0,V.jsx)(`strong`,{children:`100%`})]})]})]})]}),(0,V.jsxs)(`div`,{className:`md:col-span-7 space-y-5`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-1`,children:[(0,V.jsxs)(`span`,{children:[`Marca: `,(0,V.jsx)(`strong`,{className:`text-neutral-900`,children:e.brand})]}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsxs)(`span`,{children:[`Ref: `,(0,V.jsx)(`code`,{className:`text-neutral-700 bg-neutral-100 px-1 py-0.5 rounded`,children:e.id})]})]}),(0,V.jsx)(`h1`,{className:`text-xl sm:text-2xl font-black text-neutral-950 leading-snug`,children:e.name})]}),(0,V.jsxs)(`div`,{className:`p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3`,children:[(0,V.jsxs)(`div`,{className:`flex items-baseline justify-between`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`text-[11px] font-bold uppercase tracking-wider text-neutral-500 block`,children:`Preço de Compra (Atacado BABA)`}),(0,V.jsx)(`div`,{className:`text-3xl font-black text-[#FF6A00] tabular-nums`,children:F(e.officialPrice)})]}),(0,V.jsxs)(`div`,{className:`text-right`,children:[(0,V.jsx)(`span`,{className:`text-[11px] font-semibold text-neutral-500 block`,children:`MOQ (Qtd. Mínima)`}),(0,V.jsx)(`span`,{className:`text-xs font-bold text-neutral-800 bg-white px-2 py-1 rounded border border-neutral-200 inline-block`,children:e.moq||`1 unidade`})]})]}),(0,V.jsxs)(`div`,{className:`p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-950 space-y-2`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between text-xs font-extrabold text-emerald-800`,children:[(0,V.jsxs)(`span`,{className:`flex items-center gap-1.5`,children:[(0,V.jsx)(Ht,{className:`w-4 h-4 text-emerald-600`}),`Margem Estimada de Revenda:`]}),(0,V.jsxs)(`span`,{className:`text-sm font-black text-emerald-700`,children:[`+`,F(d),` por unidade`]})]}),(0,V.jsxs)(`p`,{className:`text-[11px] text-emerald-800 leading-relaxed`,children:[`💡 `,(0,V.jsx)(`strong`,{children:`Modelo de Revenda BABA:`}),` Podes comprar este produto a `,(0,V.jsx)(`strong`,{children:F(e.officialPrice)}),` e revendê-lo no Mercado de Revenda pelo valor sugerido de `,(0,V.jsx)(`strong`,{children:F(u)}),` ou pelo preço que definires, obtendo lucro garantido!`]})]})]}),(0,V.jsxs)(`div`,{className:`space-y-2 text-xs border-y border-neutral-200 py-3 text-neutral-700`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,V.jsx)(`span`,{className:`text-neutral-500`,children:`Stock Disponível para Compra:`}),(0,V.jsxs)(`span`,{className:`font-bold text-emerald-700 flex items-center gap-1`,children:[(0,V.jsx)(ct,{className:`w-3.5 h-3.5 text-emerald-600`}),e.stock,` unidades disponíveis no sistema`]})]}),(0,V.jsxs)(`div`,{className:`flex items-start justify-between gap-4`,children:[(0,V.jsx)(`span`,{className:`text-neutral-500 shrink-0`,children:`Transferência de Titularidade:`}),(0,V.jsx)(`span`,{className:`font-bold text-neutral-900 text-right`,children:`Após Aprovação do Administrador`})]}),(0,V.jsxs)(`div`,{className:`p-2.5 rounded-lg bg-orange-50/80 border border-orange-200/80 text-[11px] text-orange-950 space-y-1`,children:[(0,V.jsxs)(`div`,{className:`font-bold flex items-center gap-1 text-[#FF6A00]`,children:[(0,V.jsx)(R,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Ciclo de Compra e Revenda 100% Interno:`})]}),(0,V.jsx)(`p`,{children:`Todo o processo acontece dentro da plataforma. Ao comprar, o pedido fica pendente até aprovação do Administrador, sendo depois entregue em "Meus Produtos" para uso ou revenda com lucro. A plataforma não realiza entregas físicas nem recomenda compras externas.`})]})]}),(0,V.jsxs)(`div`,{className:`p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between text-xs`,children:[(0,V.jsxs)(`span`,{className:`font-bold text-neutral-800 flex items-center gap-1.5`,children:[(0,V.jsx)(`span`,{children:`🎨 Escolha a Cor:`}),(0,V.jsx)(`strong`,{className:`text-[#FF6A00] font-black`,children:chosenColor})]}),(0,V.jsx)(`span`,{className:`text-[10px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200`,children:`8 Opções Disponíveis`})]}),(0,V.jsx)(`div`,{className:`grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-0.5`,children:PRODUCT_8_COLORS.map(c=>{let isSel=chosenColor===c.name;return(0,V.jsxs)(`button`,{key:c.name,type:`button`,onClick:()=>setChosenColor(c.name),className:`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${isSel?`border-[#FF6A00] bg-orange-50 ring-2 ring-orange-200 shadow-xs`:`border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50`}`,children:[(0,V.jsx)(`span`,{className:`w-5 h-5 rounded-full border shadow-2xs shrink-0 inline-block`,style:{backgroundColor:c.hex,borderColor:c.border}}),(0,V.jsx)(`span`,{className:`text-[9px] font-bold truncate max-w-full ${isSel?`text-[#FF6A00]`:`text-neutral-700`}`,children:c.name})]})})})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,V.jsx)(`span`,{className:`text-xs font-bold text-neutral-700`,children:`Quantidade:`}),(0,V.jsxs)(`div`,{className:`flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white`,children:[(0,V.jsx)(`button`,{onClick:()=>a(Math.max(1,i-1)),className:`px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-sm transition-colors`,children:`-`}),(0,V.jsx)(`span`,{className:`px-4 py-1 text-sm font-bold text-neutral-900 min-w-[36px] text-center`,children:i}),(0,V.jsx)(`button`,{onClick:()=>a(Math.min(e.stock,i+1)),className:`px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-sm transition-colors`,children:`+`})]}),i>1&&(0,V.jsxs)(`span`,{className:`text-xs text-neutral-500`,children:[`Total: `,(0,V.jsx)(`strong`,{className:`text-neutral-900`,children:F(p)}),` (Lucro potencial: `,(0,V.jsxs)(`strong`,{className:`text-emerald-700`,children:[`+`,F(f)]}),`)`]})]}),(0,V.jsxs)(`div`,{className:`pt-2 flex flex-col sm:flex-row gap-3`,children:[(0,V.jsxs)(`button`,{onClick:()=>{for(let t=0;t<i;t++)n({...e,selectedColor:chosenColor});t()},disabled:e.stock<=0,className:`flex-1 py-3 px-4 rounded-xl border-2 border-[#FF6A00] text-[#FF6A00] hover:bg-orange-50 text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`,children:[(0,V.jsx)(z,{className:`w-4 h-4`}),(0,V.jsxs)(`span`,{children:[`Adicionar ao Carrinho (`,i,`)`]})]}),(0,V.jsxs)(`button`,{onClick:()=>{r({...e,selectedColor:chosenColor,_buyQuantity:i}),t()},disabled:e.stock<=0,className:`flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`,children:[(0,V.jsxs)(`span`,{children:[`Comprar Agora (`,F(p),`)`]}),(0,V.jsx)(Ye,{className:`w-4 h-4`})]})]}),(0,V.jsxs)(`div`,{className:`pt-3 border-t border-neutral-100 space-y-2`,children:[(0,V.jsx)(`h3`,{className:`text-xs font-bold uppercase tracking-wider text-neutral-500`,children:`Descrição & Especificações Oficiais`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-700 leading-relaxed`,children:e.description}),e.features&&e.features.length>0&&(0,V.jsx)(`ul`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2`,children:e.features.map((e,t)=>(0,V.jsxs)(`li`,{className:`text-xs text-neutral-600 flex items-center gap-1.5`,children:[(0,V.jsx)(ct,{className:`w-3.5 h-3.5 text-amber-500 shrink-0`}),(0,V.jsx)(`span`,{children:e})]},t))})]})]})]})})]})})},rn=({products:e,currentUser:n,onNavigateTab:i,onAddToCart:a,onDirectBuy:o,initialCategory:s,searchQuery:c=``})=>{
  const [selectedCat,setSelectedCat]=(0,_.useState)(s||`all`);
  const [sortBy,setSortBy]=(0,_.useState)(`featured`);
  const [selectedProd,setSelectedProd]=(0,_.useState)(null);
  const [toastMsg,setToastMsg]=(0,_.useState)(null);

  (0,_.useEffect)(()=>{
    if(s!==void 0){
      setSelectedCat(s||`all`);
    }
  },[s]);

  const filteredProducts=(0,_.useMemo)(()=>{
    return e.filter(item=>{
      if(selectedCat!==`all`){
        if(selectedCat===`roupas_calcados`){
          if(item.category!==`roupas_calcados`&&item.category!==`roupas_calcados_moda`)return!1;
        }else if(item.category!==selectedCat)return!1;
      }
      if(c&&c.trim()){
        const q=c.toLowerCase().trim();
        if(!item.name.toLowerCase().includes(q)&&!item.brand.toLowerCase().includes(q)&&!item.description.toLowerCase().includes(q))return!1;
      }
      return!0;
    }).sort((x,y)=>sortBy===`price_asc`?x.officialPrice-y.officialPrice:sortBy===`price_desc`?y.officialPrice-x.officialPrice:sortBy===`stock`?y.stock-x.stock:0);
  },[e,selectedCat,c,sortBy]);

  const activeCatObj=(0,_.useMemo)(()=>S.find(item=>item.id===selectedCat),[selectedCat]);

  const handleQuickAdd=(item:any,ev:any)=>{
    ev.stopPropagation();
    a(item);
    setToastMsg(`"${item.name}" adicionado ao carrinho!`);
    setTimeout(()=>setToastMsg(null),2500);
  };

  return(
    <div id="grelha-produtos-baba" className="w-full space-y-4 pb-12">
      {toastMsg&&(
        <div className="fixed bottom-20 right-6 z-50 bg-neutral-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-[#FF6A00] animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#FF6A00]"/>
          <span>{toastMsg}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] shrink-0"/>
          <h1 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-tight">
            {selectedCat===`all`?`Todos os Produtos`:(activeCatObj?.label||selectedCat)}
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-200 text-xs font-extrabold tabular-nums">
            {filteredProducts.length} produtos
          </span>
          {selectedCat!==`all`&&(
            <button type="button" onClick={()=>setSelectedCat(`all`)} className="text-xs font-bold text-neutral-700 hover:text-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
              Ver Todos
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500 font-semibold flex items-center gap-1">
              <Xe className="w-3.5 h-3.5"/>
              <span className="hidden sm:inline">Ordenar:</span>
            </span>
            <select value={sortBy} onChange={ev=>setSortBy(ev.target.value)} className="text-xs font-bold text-neutral-800 bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#FF6A00] cursor-pointer">
              <option value="featured">Destaques</option>
              <option value="price_asc">Menor Preço Kz</option>
              <option value="price_desc">Maior Preço Kz</option>
              <option value="stock">Maior Stock Disponível</option>
            </select>
          </div>
          {i&&(
            <button type="button" onClick={()=>i(`revenda`,selectedCat===`all`?void 0:selectedCat)} className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors">
              <span>Revenda P2P</span>
              <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length===0?(
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <L className="w-12 h-12 text-neutral-300 mx-auto"/>
          <h4 className="text-base font-bold text-neutral-800">Nenhum produto encontrado nesta categoria</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">Experimenta selecionar outra categoria acima ou clica em Ver Todos para explorar todo o catálogo.</p>
          <button type="button" onClick={()=>setSelectedCat(`all`)} className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs cursor-pointer">
            Ver Todas as Categorias
          </button>
        </div>
      ):(
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredProducts.map(item=>{
            const profit=(item.suggestedResalePrice||Math.round(item.officialPrice*1.4))-item.officialPrice;
            return(
              <div key={item.id} onClick={()=>setSelectedProd(item)} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-[#FF6A00]/50 transition-all flex flex-col justify-between group cursor-pointer relative">
                <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    onError={ev=>{ev.currentTarget.onerror=null;ev.currentTarget.src=`https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80`;}}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-neutral-950/80 text-white text-[9px] font-bold backdrop-blur-xs flex items-center gap-1">
                    <R className="w-3 h-3 text-[#FF6A00]"/>
                    <span>Ouro</span>
                  </div>
                  <button type="button" onClick={ev=>{ev.stopPropagation();setSelectedProd(item);}} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white text-neutral-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" title="Ver Detalhes do Produto">
                    <Eye className="w-3.5 h-3.5"/>
                  </button>
                </div>
                <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                  <div className="space-y-1">
                    <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider truncate">{item.brand}</div>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-[#FF6A00] transition-colors">{item.name}</h4>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-neutral-100">
                    <div className="text-sm sm:text-base font-black text-[#FF6A00] tabular-nums leading-none">{F(item.officialPrice)}</div>
                    <div className="text-[10px] text-neutral-500 font-medium">
                      MOQ: <strong>{item.moq||`1 un (Atacado)`}</strong>
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/80 flex items-center justify-between">
                      <span>Lucro Revenda:</span>
                      <span className="font-black text-emerald-700">+{F(profit)}</span>
                    </div>
                  </div>
                  <div className="pt-1 space-y-1 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-[9px] text-neutral-500 font-semibold">
                      <span>8 Cores:</span>
                      <span className="font-bold text-neutral-700 bg-neutral-100 px-1 py-0.2 rounded">{item.selectedColor||`Preto`}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {PRODUCT_8_COLORS.map(c=>(
                        <span key={c.name} title={c.name} className="w-2.5 h-2.5 rounded-full border shadow-2xs inline-block" style={{backgroundColor:c.hex,borderColor:c.border}}/>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5">
                    <button type="button" onClick={ev=>handleQuickAdd(item,ev)} className="p-2 rounded-xl border border-neutral-200 hover:border-[#FF6A00] hover:text-[#FF6A00] text-neutral-700 transition-colors shrink-0 cursor-pointer" title="Adicionar ao Carrinho">
                      <ShoppingBag className="w-3.5 h-3.5"/>
                    </button>
                    <button type="button" onClick={ev=>{ev.stopPropagation();o(item);}} className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-extrabold text-[11px] transition-all text-center cursor-pointer shadow-2xs">
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedProd&&(
        <ProductDetailModal product={selectedProd} onClose={()=>setSelectedProd(null)} onAddToCart={a} onDirectBuy={o}/>
      )}
    </div>
  );
},HomeMarketView = rn,an=({products:e,currentUser:t,onAddToCart:r,onDirectBuy:i,searchQuery:a,initialCategory:o})=>(
  <HomeMarketView products={e} currentUser={t} onAddToCart={r} onDirectBuy={i} initialCategory={o} searchQuery={a}/>
),OfficialMarketView = an,on=({isOpen:e,onClose:t,negotiation:n,currentUser:r,wallet:i,onConfirmPurchase:a})=>{let[o,s]=(0,_.useState)(``),[c,l]=(0,_.useState)(n.currentProposedPrice),[u,d]=(0,_.useState)(!1),[f,p]=(0,_.useState)(null);_.useEffect(()=>{l(n.currentProposedPrice)},[n?.id,n?.currentProposedPrice]);if(!e)return null;let m=r.id===n.sellerId,h=r.id===n.buyerId,g=n.status===`aceite`,v=n.status===`concluida`||n.status===`cancelada`||n.status===`recusada`,awaitingAdm=n.status===`aguardando_adm`;i.availableBalance,n.currentProposedPrice;let y=e=>{if(e.preventDefault(),o.trim())try{Ce(n.id,r.id,r.name,o.trim()),s(``)}catch(e){p(e.message)}},b=e=>{p(null);try{if(e===`contraproposta`){if(!c||c<=0){p(`Insere um valor válido para a contraproposta.`);return}xe(n.id,`contraproposta`,c),d(!1)}else xe(n.id,e)}catch(e){p(e.message)}},x=e=>{p(null);try{if(e===`contraproposta`){if(!c||c<=0){p(`Insere um valor válido para a contraproposta.`);return}Se(n.id,`contraproposta`,c),d(!1)}else Se(n.id,e)}catch(e){p(e.message)}};return(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh]`,children:[(0,V.jsxs)(`div`,{className:`p-4 bg-neutral-900 text-white flex items-center justify-between`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,V.jsx)(`img`,{src:n.productImage,alt:n.productName,referrerPolicy:`no-referrer`,onError:e=>{e.currentTarget.onerror=null;e.currentTarget.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';},className:`w-11 h-11 rounded-lg object-cover bg-neutral-800 border border-neutral-700`}),(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`span`,{className:`text-[10px] text-amber-400 font-bold uppercase tracking-wider`,children:`Mesa de Negociação`}),(0,V.jsx)(`span`,{className:`text-neutral-500`,children:`·`}),(0,V.jsx)(`span`,{className:`text-[11px] text-neutral-300`,children:m?`Comprador: ${n.buyerName}`:`Vendedor: ${n.sellerName}`})]}),(0,V.jsx)(`h3`,{className:`text-sm font-bold text-white line-clamp-1`,children:n.productName})]})]}),(0,V.jsx)(`button`,{onClick:t,className:`p-1 text-neutral-400 hover:text-white rounded-lg transition-colors`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]}),(0,V.jsxs)(`div`,{className:`bg-amber-50/80 border-b border-amber-200/80 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`text-neutral-500 block text-[10px] uppercase font-semibold`,children:`Preço Anunciado`}),(0,V.jsx)(`span`,{className:`font-bold text-neutral-800 line-through tabular-nums`,children:F(n.listedPrice)})]}),(0,V.jsxs)(`div`,{className:`text-right sm:text-left`,children:[(0,V.jsx)(`span`,{className:`text-amber-800 block text-[10px] uppercase font-bold`,children:`Proposta Atual em Vigor`}),(0,V.jsx)(`span`,{className:`text-lg font-black text-amber-600 tabular-nums`,children:F(n.currentProposedPrice)})]}),(0,V.jsxs)(`div`,{className:`w-full sm:w-auto`,children:[(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-500 block uppercase font-semibold`,children:`Estado da Negociação`}),(0,V.jsxs)(`span`,{className:`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${n.status===`aceite`?`bg-emerald-100 text-emerald-800`:n.status===`aguardando_adm`?`bg-purple-100 text-purple-800`:n.status===`contraproposta`?`bg-amber-100 text-amber-800`:n.status===`recusada`?`bg-red-100 text-red-800`:`bg-neutral-200 text-neutral-800`}`,children:[n.status===`aguardando_adm`&&`Aguardando Adm`,n.status===`aceite`&&`✓ Proposta Aceite!`,n.status===`contraproposta`&&`Contraproposta Ativa`,n.status===`pendente`&&`Aguardando Resposta`,n.status===`recusada`&&`Proposta Recusada`,n.status===`concluida`&&`Venda Concluída`,n.status===`cancelada`&&`Cancelada`]})]})]}),awaitingAdm&&(0,V.jsxs)(`div`,{className:`p-3 bg-purple-50 border-b border-purple-200 text-purple-900 text-xs flex items-center gap-2`,children:[(0,V.jsx)(ut,{className:`w-4 h-4 text-purple-600 shrink-0`}),(0,V.jsx)(`span`,{children:`Proposta submetida! A aguardar aprovação do Administrador no Painel do Adm antes de ser encaminhada para o vendedor.`})]}),n.status===`recusada`&&n.adminRejectionReason&&(0,V.jsxs)(`div`,{className:`p-3 bg-red-50 border-b border-red-200 text-red-800 text-xs flex items-start gap-2 font-semibold`,children:[(0,V.jsx)(Qe,{className:`w-4 h-4 text-red-600 shrink-0 mt-0.5`}),(0,V.jsxs)(`span`,{children:[`Proposta recusada pelo Administrador. Motivo: `,n.adminRejectionReason]})]}),g&&(0,V.jsxs)(`div`,{className:`p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(ct,{className:`w-4 h-4 text-emerald-600 shrink-0`}),(0,V.jsxs)(`span`,{children:[(0,V.jsxs)(`strong`,{children:[`Acordo alcançado por `,F(n.currentProposedPrice),`!`]}),h?` Podes agora solicitar o pagamento (ficará sujeito a aprovação do Adm).`:` Aguarda que o comprador finalize o pagamento.`]})]}),h&&(0,V.jsxs)(`button`,{onClick:()=>a(n),className:`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer`,children:[`Comprar por `,F(n.currentProposedPrice)]})]}),(0,V.jsx)(`div`,{className:`flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50 min-h-[220px]`,children:n.messages.map(e=>{let t=e.senderId===r.id;return(0,V.jsxs)(`div`,{className:`flex flex-col ${t?`items-end`:`items-start`}`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-1.5 text-[10px] text-neutral-400 mb-0.5 px-1`,children:[(0,V.jsx)(`span`,{children:t?`Tu`:e.senderName}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsx)(`span`,{children:new Date(e.timestamp).toLocaleTimeString(`pt-AO`,{hour:`2-digit`,minute:`2-digit`})})]}),(0,V.jsx)(`div`,{className:`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed ${t?`bg-neutral-900 text-white rounded-tr-xs`:`bg-white text-neutral-800 border border-neutral-200 rounded-tl-xs shadow-2xs`}`,children:e.text})]},e.id)})}),u&&!v&&!awaitingAdm&&(0,V.jsxs)(`div`,{className:`p-3 bg-amber-50/70 border-t border-amber-200 flex items-center gap-2`,children:[(0,V.jsxs)(`div`,{className:`flex-1`,children:[(0,V.jsx)(`label`,{className:`text-[10px] font-bold text-neutral-600 block mb-1`,children:`Indica o teu novo valor de contraproposta (Kz):`}),(0,V.jsx)(`input`,{type:`number`,value:c,onChange:e=>l(Number(e.target.value)),step:`500`,min:`1000`,className:`w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500`})]}),(0,V.jsx)(`button`,{onClick:()=>m?b(`contraproposta`):x(`contraproposta`),className:`mt-4 px-4 py-2 bg-neutral-900 text-amber-400 hover:bg-neutral-800 text-xs font-bold rounded-lg transition-colors`,children:`Enviar Valor`}),(0,V.jsx)(`button`,{onClick:()=>d(!1),className:`mt-4 px-2 py-2 text-neutral-500 hover:text-neutral-800 text-xs`,children:`Cancelar`})]}),f&&(0,V.jsx)(`div`,{className:`p-2.5 bg-red-50 text-red-700 text-xs border-t border-red-200`,children:f}),m&&!v&&!awaitingAdm&&n.lastOfferBy===`buyer`&&(0,V.jsxs)(`div`,{className:`p-3 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2`,children:[(0,V.jsxs)(`span`,{className:`text-xs font-semibold text-neutral-700`,children:[`O comprador propôs `,F(n.currentProposedPrice),`:`]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsxs)(`button`,{onClick:()=>b(`aceitar`),className:`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors`,children:[(0,V.jsx)(ct,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Aceitar Proposta`})]}),(0,V.jsxs)(`button`,{onClick:()=>d(!0),className:`px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-neutral-300`,children:[(0,V.jsx)(At,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Contraproposta`})]}),(0,V.jsxs)(`button`,{onClick:()=>b(`recusar`),className:`px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-red-200`,children:[(0,V.jsx)(Qe,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Recusar`})]})]})]}),h&&!v&&!awaitingAdm&&n.lastOfferBy===`seller`&&(0,V.jsxs)(`div`,{className:`p-3 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2`,children:[(0,V.jsxs)(`span`,{className:`text-xs font-semibold text-neutral-700`,children:[`O vendedor propôs `,F(n.currentProposedPrice),`:`]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsxs)(`button`,{onClick:()=>x(`aceitar`),className:`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors`,children:[(0,V.jsx)(ct,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Aceitar Valor`})]}),(0,V.jsxs)(`button`,{onClick:()=>d(!0),className:`px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-neutral-300`,children:[(0,V.jsx)(At,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Nova Proposta`})]}),(0,V.jsxs)(`button`,{onClick:()=>x(`recusar`),className:`px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-red-200`,children:[(0,V.jsx)(Qe,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Desistir`})]})]})]}),!v&&!awaitingAdm&&!u&&!((m&&n.lastOfferBy===`buyer`)||(h&&n.lastOfferBy===`seller`))&&(m||h)&&(0,V.jsxs)(`div`,{className:`px-3 py-2 bg-amber-50/60 border-t border-amber-200/80 flex items-center justify-between gap-2 text-xs`,children:[(0,V.jsx)(`span`,{className:`text-neutral-600 font-medium`,children:`Podem continuar a conversar ou ajustar o valor até chegarem a acordo:`}),(0,V.jsxs)(`button`,{type:`button`,onClick:()=>d(!0),className:`px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0`,children:[(0,V.jsx)(At,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Propor Novo Preço`})]})]}),!v&&!awaitingAdm&&(0,V.jsxs)(`form`,{onSubmit:y,className:`p-3 bg-white border-t border-neutral-200 flex items-center gap-2`,children:[(0,V.jsx)(`input`,{type:`text`,value:o,onChange:e=>s(e.target.value),placeholder:`Escreve uma mensagem para combinar detalhes ou preço...`,className:`flex-1 px-3 py-2 bg-neutral-100 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500`}),(0,V.jsx)(`button`,{type:`submit`,disabled:!o.trim(),className:`p-2 bg-neutral-900 text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-40`,title:`Enviar Mensagem`,children:(0,V.jsx)(Mt,{className:`w-4 h-4`})})]})]})})},sn=({listings:e,currentUser:t,wallet:n,onOpenNegotiation:r,onSuccessOrder:i,onNavigateToWallet:a,searchQuery:o,initialCategory:s,onNotice,onNavigateToOfficial})=>{
  const [c,l]=(0,_.useState)(s||`all`);
  const [f,p]=(0,_.useState)(null);
  const [m,h]=(0,_.useState)(0);
  const [g,v]=(0,_.useState)(``);
  const [y,b]=(0,_.useState)(!1);
  const [x,C]=(0,_.useState)(null);
  const [w,T]=(0,_.useState)(null);

  (0,_.useEffect)(()=>{
    s!==void 0&&l(s||`all`);
  },[s]);

  const E=(0,_.useMemo)(()=>{
    return e.filter(item=>{
      if(item.status===`vendido`)return!1;
      if(c!==`all`){
        if(c===`roupas_calcados`){
          if(item.category!==`roupas_calcados`&&item.category!==`roupas_calcados_moda`)return!1;
        }else if(item.category!==c)return!1;
      }
      if(o.trim()){
        const q=o.toLowerCase();
        if(!item.productName.toLowerCase().includes(q)&&!item.customDescription.toLowerCase().includes(q)&&!item.sellerName.toLowerCase().includes(q))return!1;
      }
      return!0;
    });
  },[e,c,o]);

  const D=item=>{
    if(item.sellerId===t.id){
      C(`Não podes fazer propostas no teu próprio produto.`);
      return;
    }
    p(item);h(Math.round(item.listingPrice*.9));v(``);C(null);
  };

  const ee=ev=>{
    if(ev.preventDefault(),f){
      if(m<=0){
        C(`O valor proposto deve ser maior que zero.`);
      }else{
        b(!0),C(null);
        try{
          const neg=be(f.id,t.id,m,g);
          p(null),T(neg);
        }catch(err:any){
          C(err.message||`Erro ao enviar proposta`);
        }finally{
          b(!1);
        }
      }
    }
  };

  const te=item=>{
    if(item.sellerId===t.id){
      showAppNotice('Não podes comprar o teu próprio produto.', 'error');
      return;
    }
    const isAdminBuyer=t.role==='admin'||t.id==='kt5dFLArJzV7hCNMQ3ZvgqFokM62'||t.id==='usr_admin';
    const spendable=isAdminBuyer?n.availableBalance:getLivre(t.id);
    if(!isAdminBuyer&&spendable<item.listingPrice){
      if(onNotice){
        onNotice({
          type:'insufficient_funds',
          productName:item.productName,
          price:item.listingPrice,
          availableBalance:spendable
        });
      }else{
        a();
      }
      return;
    }
    try{
      je(item.id,t.id,item.listingPrice);
      i(item.productName);
    }catch(err:any){
      showAppNotice(err.message||'Falha ao concluir compra', 'error');
    }
  };

  return(
    <div className="w-full space-y-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"/>
          <h1 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-tight">
            {c===`all`?`Revenda P2P — Todos os Produtos`:`Revenda P2P · ${S.find(item=>item.id===c)?.label||c}`}
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold tabular-nums">
            {E.length} {E.length===1?`anúncio ativo`:`anúncios ativos`}
          </span>
          {c!==`all`&&(
            <button type="button" onClick={()=>l(`all`)} className="text-xs font-bold text-neutral-700 hover:text-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
              Ver Todos
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToOfficial&&(
            <button type="button" onClick={onNavigateToOfficial} className="px-3 py-1.5 rounded-lg bg-[#FF6A00] hover:bg-[#FF5000] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors">
              <span>Mercado Oficial</span>
              <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
      </div>

      {x&&(
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0"/>
          <span>{x}</span>
        </div>
      )}

      {E.length===0?(
        <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-white space-y-3">
          <Bt className="w-12 h-12 mx-auto text-neutral-300 stroke-1"/>
          <h3 className="text-base font-bold text-neutral-800">Nenhum artigo disponível para revenda</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">Quando os clientes colocam produtos adquiridos à venda, eles surgem aqui no Mercado de Revenda.</p>
        </div>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {E.map(item=>{
            const isMine=item.sellerId===t.id;
            return(
              <div key={item.id} className="bg-white rounded-2xl border border-neutral-200 hover:border-amber-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
                <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    onError={ev=>{ev.currentTarget.onerror=null;ev.currentTarget.src=`https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80`;}}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-neutral-900/85 backdrop-blur-xs text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <R className="w-3 h-3"/>
                    <span>Revenda Verificada</span>
                  </div>
                  {isMine&&(
                    <div className="absolute top-2.5 right-2.5 bg-amber-400 text-neutral-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                      Teu Anúncio
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1 font-medium text-neutral-700">
                        <Kt className="w-3.5 h-3.5 text-neutral-400"/>
                        {item.sellerName}
                      </span>
                      <span>Anunciado em Angola</span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">{item.productName}</h3>
                    <p className="text-xs text-neutral-500 line-clamp-2">{item.customDescription}</p>
                    <div className="text-[11px] text-neutral-400 pt-1 flex items-center justify-between">
                      <span>Preço original BABA:</span>
                      <span className="font-medium text-neutral-600 tabular-nums">{F(item.originalPrice)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold block leading-none">Preço Anunciado</span>
                        <div className="text-lg font-black text-neutral-900 tabular-nums">{F(item.listingPrice)}</div>
                      </div>
                      {item.allowNegotiation&&(
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Aceita Negociação
                        </span>
                      )}
                    </div>
                    <div className="pt-1 pb-1 space-y-1 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-[9px] text-neutral-500 font-semibold">
                        <span>8 Cores do Artigo:</span>
                        <span className="font-bold text-neutral-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">{item.selectedColor||`Preto`}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {PRODUCT_8_COLORS.map(col=>(
                          <span key={col.name} title={col.name} className="w-2.5 h-2.5 rounded-full border shadow-2xs inline-block" style={{backgroundColor:col.hex,borderColor:col.border}}/>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={()=>D(item)} disabled={isMine} className="py-2 px-3 rounded-xl border border-neutral-300 hover:border-amber-500 hover:bg-amber-50 text-neutral-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600"/>
                        <span>Fazer Proposta</span>
                      </button>
                      <button type="button" onClick={()=>te(item)} disabled={isMine} className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <ShoppingBag className="w-3.5 h-3.5"/>
                        <span>Comprar Já</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {f&&(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Je className="w-4 h-4 text-amber-400"/>
                <h3 className="font-bold text-sm">Fazer Proposta de Negociação</h3>
              </div>
              <button type="button" onClick={()=>p(null)} className="text-neutral-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={ee} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <img
                  src={f.imageUrl}
                  alt={f.productName}
                  referrerPolicy="no-referrer"
                  onError={ev=>{ev.currentTarget.onerror=null;ev.currentTarget.src=`https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80`;}}
                  className="w-12 h-12 rounded-lg object-cover bg-neutral-100"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 truncate">{f.productName}</h4>
                  <div className="text-[11px] text-neutral-500">Vendedor: <strong>{f.sellerName}</strong></div>
                  <div className="text-xs font-bold text-neutral-800 tabular-nums">Preço anunciado: {F(f.listingPrice)}</div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">A tua proposta de preço (em Kwanza - Kz):</label>
                <input type="number" value={m} onChange={ev=>h(Number(ev.target.value))} step="500" min="500" required className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"/>
                <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-1">
                  <span>Preço anunciado: {F(f.listingPrice)}</span>
                  {m<f.listingPrice&&(
                    <span className="text-emerald-600 font-semibold">Desconto de {Math.round((f.listingPrice-m)/f.listingPrice*100)}%</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">Mensagem para o vendedor (opcional):</label>
                <textarea value={g} onChange={ev=>v(ev.target.value)} placeholder="Ex: Olá, tenho interesse no artigo e disponho deste valor para fechar negócio hoje." rows={3} className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"/>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ℹ️ <strong>Como funciona a negociação:</strong> A tua proposta passa primeiro pela aprovação do Administrador no Painel do Adm. Depois de aprovada, o vendedor recebe notificação em <em>Meus Produtos</em> para aceitar, contrapropor ou recusar. Qualquer compra final também passa pela aprovação do Administrador.
              </div>
              {x&&(<div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">{x}</div>)}
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={()=>p(null)} className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={y} className="flex-1 py-2.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
                  {y?`A enviar...`:`Enviar Proposta`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {w&&(
        <NegotiationModal
          isOpen
          onClose={()=>T(null)}
          negotiation={M(t.id).find(item=>item.id===w.id)||w}
          currentUser={t}
          wallet={n}
          onConfirmPurchase={neg=>{
            const isAdminBuyer=t.role==='admin'||t.id==='kt5dFLArJzV7hCNMQ3ZvgqFokM62'||t.id==='usr_admin';
            const spendable=isAdminBuyer?n.availableBalance:getLivre(t.id);
            if(!isAdminBuyer&&spendable<neg.currentProposedPrice){
              T(null);
              if(onNotice){
                onNotice({
                  type:'insufficient_funds',
                  productName:neg.productName,
                  price:neg.currentProposedPrice,
                  availableBalance:spendable
                });
              }else{
                showAppNotice(`Saldo livre insuficiente (${F(spendable)}) para comprar por ${F(neg.currentProposedPrice)}.`, 'error');
              }
              return;
            }
            try{
              je(neg.listingId,t.id,neg.currentProposedPrice);
              T(null);
              i(neg.productName);
            }catch(err:any){
              showAppNotice(err.message||'Falha ao concluir compra da proposta.', 'error');
            }
          }}
        />
      )}
    </div>
  );
},cn=({userProducts:e,currentUser:t,wallet:n,onNavigateToOfficial:r,onSuccessOrder:i,initialNegotiationId:a}: any)=>{
  const [o,s]=useState(a?'negociacoes':'todos');
  const [c,l]=useState<any>(null);
  const [u,d]=useState(0);
  const [f,p]=useState('');
  const [m,h]=useState(0);
  const [g,v]=useState<string|null>(null);
  const [y,b]=useState<any>(null);

  const x = veAll();
  const S = x.filter((item: any) => item.sellerId === t.id && item.status !== 'vendido' && item.status !== 'rejeitado' && item.status !== 'pausado');
  const C = M(t.id);

  useEffect(() => {
    if (a) {
      const found = C.find((item: any) => item.id === a);
      if (found) {
        b(found);
        s('negociacoes');
      }
    }
  }, [a]);

  const w = (prod: any) => {
    l(prod);
    const suggested = Math.round(prod.originalPrice * 1.2);
    d(suggested);
    h(prod.originalPrice);
    p(`Artigo original adquirido na BABA SHOPPING em ${new Date(prod.purchaseDate).toLocaleDateString('pt-AO')}. Estado verificado e funcional.`);
    v(null);
  };

  const T = (ev: any) => {
    ev.preventDefault();
    if (!c) return;
    if (u <= 0) {
      v('O preço deve ser superior a zero.');
      return;
    }
    try {
      ye(c.id, t.id, u, f, m);
      l(null);
      v(t.role === 'admin'
        ? 'Anúncio publicado no Mercado de Revenda!'
        : 'Anúncio enviado para aprovação do Administrador! Só ficará visível no mercado após aprovação.');
      setTimeout(() => v(null), 5000);
    } catch (err: any) {
      v(err.message || 'Falha ao colocar produto à venda.');
    }
  };

  const E = (listingId: any) => {
    try {
      j(listingId, t.id);
      v('Anúncio retirado do mercado com sucesso! O produto voltou ao teu inventário para editares o preço ou usares.');
      setTimeout(() => v(null), 4000);
    } catch (err: any) {
      v(err.message || 'Erro ao retirar anúncio');
    }
  };

  const H = (listing: any, userProd: any) => {
    try {
      j(listing.id, t.id);
      l(userProd);
      d(listing.listingPrice);
      h(listing.minAcceptablePrice || Math.round(listing.listingPrice * 0.8));
      p(listing.customDescription || '');
      v('Define o novo preço desejado e coloca novamente à venda!');
    } catch (err: any) {
      v(err.message || 'Erro ao preparar edição do anúncio');
    }
  };

  const D = (status: any) => {
    switch (status) {
      case 'disponivel':
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Disponível no Inventário</span>;
      case 'anunciado':
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">À Venda no Mercado</span>;
      case 'reservado':
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">Reservado</span>;
      case 'vendido':
        return <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-300">Vendido com Sucesso</span>;
      case 'entregue':
        return <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">Entregue</span>;
      default:
        return <span className="text-[11px] font-medium text-neutral-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {g && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{g}</span>
          </div>
          <button type="button" onClick={() => v(null)} className="text-amber-800 hover:text-amber-950 font-bold cursor-pointer">✕</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Meus Produtos</h1>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              {e.length} {e.length === 1 ? 'artigo' : 'artigos'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Gere os produtos que compraste no Mercado Oficial, coloca-os à venda e acompanha as propostas de negociação.
          </p>
        </div>
      </div>

      <div className="w-full max-w-full flex items-center gap-2 border-b border-neutral-200 pb-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => s('todos')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${o === 'todos' ? 'bg-neutral-900 text-amber-400 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
        >
          <Package className="w-4 h-4" />
          <span>1. Todos os Meus Produtos ({e.length})</span>
        </button>
        <button
          type="button"
          onClick={() => s('venda')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${o === 'venda' ? 'bg-neutral-900 text-amber-400 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
        >
          <Bt className="w-4 h-4" />
          <span>2. Produtos à Venda ({S.length})</span>
        </button>
        <button
          type="button"
          onClick={() => s('negociacoes')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap relative cursor-pointer ${o === 'negociacoes' ? 'bg-neutral-900 text-amber-400 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>3. Negociações ({C.length})</span>
          {C.some((item: any) => item.status === 'pendente' && item.lastOfferBy !== (t.id === item.sellerId ? 'seller' : 'buyer')) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {o === 'todos' && (
        <div className="space-y-4">
          {e.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-white space-y-3">
              <Package className="w-12 h-12 mx-auto text-neutral-300 stroke-1" />
              <h3 className="text-base font-bold text-neutral-800">Ainda não possuis produtos</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Quando compras produtos no Mercado Oficial com o teu saldo, eles aparecem automaticamente aqui e ficam elegíveis para revenda.
              </p>
              <button
                type="button"
                onClick={r}
                className="mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Ir para o Mercado Oficial
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {e.map((item: any) => {
                const isAnnounced = item.status === 'anunciado';
                const isSold = item.status === 'vendido';
                const activeListing = x.find((lItem: any) => lItem.userProductId === item.id && (lItem.status === 'ativo' || lItem.status === 'pendente'));
                const lastRejectedListing = x.filter((lItem: any) => lItem.userProductId === item.id && lItem.status === 'rejeitado').slice(-1)[0];
                const itemNegs = C.filter((ng: any) => ng.userProductId === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all shadow-xs ${isSold ? 'border-neutral-200 opacity-80 bg-neutral-50/50' : 'border-neutral-200 hover:border-amber-300'}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          onError={ev => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'; }}
                          className="w-18 h-18 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            {D(item.status)}
                            {activeListing?.status === 'pendente' && (
                              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                Aguardando Aprovação do Adm
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 line-clamp-2">{item.productName}</h3>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">ID: {item.serialNumber || item.id}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-1">
                        <div className="flex justify-between text-neutral-500">
                          <span>Preço Oficial de Compra:</span>
                          <span className="font-bold text-neutral-800 tabular-nums">{F(item.originalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400 text-[11px]">
                          <span>Data de Compra:</span>
                          <span>{new Date(item.purchaseDate).toLocaleDateString('pt-AO')}</span>
                        </div>
                        {activeListing && (
                          <div className="flex justify-between text-amber-700 font-semibold pt-1 border-t border-neutral-200 text-xs">
                            <span>Preço Anunciado:</span>
                            <span className="font-bold tabular-nums">{F(activeListing.listingPrice)}</span>
                          </div>
                        )}
                      </div>
                      {item.status === 'disponivel' && lastRejectedListing?.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700">
                          Anúncio recusado pelo Adm — Motivo: {lastRejectedListing.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                      {item.status === 'disponivel' && (
                        <button
                          type="button"
                          onClick={() => w(item)}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Revender</span>
                        </button>
                      )}
                      {isAnnounced && activeListing && (
                        <div className="w-full flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => E(activeListing.id)}
                            className="py-2 px-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Retirar anúncio e voltar para inventário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Retirar Anúncio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => H(activeListing, item)}
                            className="py-2 px-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Editar preço e colocar novamente"
                          >
                            <Tt className="w-3.5 h-3.5 text-amber-600" />
                            <span>Editar Preço</span>
                          </button>
                          {itemNegs.length > 0 && (
                            <button
                              type="button"
                              onClick={() => { b(itemNegs[0]); s('negociacoes'); }}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-neutral-900 text-amber-400 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Propostas ({itemNegs.length})</span>
                            </button>
                          )}
                        </div>
                      )}
                      {isSold && (
                        <div className="text-xs text-emerald-700 font-bold text-center w-full py-1">
                          ✓ Vendido e valor creditado na carteira
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {o === 'venda' && (
        <div className="space-y-4">
          {S.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-white space-y-3">
              <Bt className="w-12 h-12 mx-auto text-neutral-300 stroke-1" />
              <h3 className="text-base font-bold text-neutral-800">Não tens produtos anunciados no momento</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Para começar a revender, vai ao separador <em>Todos os Meus Produtos</em> e clica em <strong>Revender</strong>.
              </p>
              <button type="button" onClick={() => s('todos')} className="mt-2 text-xs font-bold text-amber-600 hover:underline cursor-pointer">
                Ver os meus produtos disponíveis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {S.map((item: any) => {
                const itemNegs = C.filter((ng: any) => ng.listingId === item.id);
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-amber-300/80 p-4 flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          onError={ev => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'; }}
                          className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'pendente' ? 'text-purple-800 bg-purple-100 border border-purple-200' : 'text-amber-800 bg-amber-100'}`}>
                            {item.status === 'pendente' ? 'Aguardando Aprovação do Adm' : 'Ativo no Mercado de Revenda'}
                          </span>
                          <h3 className="text-sm font-bold text-neutral-900 mt-1 line-clamp-1">{item.productName}</h3>
                          <div className="text-base font-black text-neutral-900 mt-0.5 tabular-nums">{F(item.listingPrice)}</div>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                        "{item.customDescription}"
                      </p>
                      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                        <span>Preço de compra original:</span>
                        <span className="tabular-nums font-semibold">{F(item.originalPrice)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <button type="button" onClick={() => E(item.id)} className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer">
                        Retirar Anúncio
                      </button>
                      {itemNegs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => { b(itemNegs[0]); s('negociacoes'); }}
                          className="py-1.5 px-3 rounded-lg bg-neutral-900 text-amber-400 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ver Propostas ({itemNegs.length})</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">Aguardando propostas</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {o === 'negociacoes' && (
        <div className="space-y-4">
          {C.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-white space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto text-neutral-300 stroke-1" />
              <h3 className="text-base font-bold text-neutral-800">Nenhuma negociação em curso</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Quando enviares ou receberes propostas de preço no Mercado de Revenda, a mesa de negociação e o histórico de mensagens aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {C.map((item: any) => {
                const isSeller = item.sellerId === t.id;
                const otherName = isSeller ? item.buyerName : item.sellerName;
                const isClosedOrAdm = item.status === 'aguardando_adm' || item.status === 'concluida' || item.status === 'cancelada' || item.status === 'recusada';
                const myTurn = !isClosedOrAdm && ((isSeller && item.lastOfferBy === 'buyer') || (!isSeller && item.lastOfferBy === 'seller'));
                return (
                  <div
                    key={item.id}
                    onClick={() => b(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${myTurn ? 'bg-amber-50/50 border-amber-300 hover:bg-amber-50' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        onError={ev => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'; }}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900">{item.productName}</span>
                          <span className="text-[10px] text-neutral-400">·</span>
                          <span className="text-xs text-neutral-500">{isSeller ? `Comprador: ${otherName}` : `Vendedor: ${otherName}`}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-neutral-400 line-through tabular-nums">{F(item.listedPrice)}</span>
                          <span className="text-sm font-black text-amber-600 tabular-nums">{F(item.currentProposedPrice)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'aceite' ? 'bg-emerald-100 text-emerald-800' : item.status === 'aguardando_adm' ? 'bg-purple-100 text-purple-800' : item.status === 'contraproposta' ? 'bg-amber-100 text-amber-800' : item.status === 'recusada' ? 'bg-red-100 text-red-800' : item.status === 'concluida' ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-700'}`}>
                            {item.status === 'aguardando_adm' && 'Aguardando Adm'}
                            {item.status === 'aceite' && 'Acordo Aceite!'}
                            {item.status === 'contraproposta' && 'Contraproposta'}
                            {item.status === 'pendente' && 'Pendente'}
                            {item.status === 'recusada' && 'Recusada'}
                            {item.status === 'concluida' && 'Concluída'}
                          </span>
                        </div>
                        {item.status === 'recusada' && item.adminRejectionReason && (
                          <div className="mt-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5 inline-block">
                            Motivo da recusa pelo Adm: {item.adminRejectionReason}
                          </div>
                        )}
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                          Última mensagem: {item.messages[item.messages.length - 1]?.text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {myTurn && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                          Tua vez de responder
                        </span>
                      )}
                      <button type="button" className="px-3 py-1.5 rounded-xl bg-neutral-900 text-amber-400 text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer">
                        <span>Abrir Negociação</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {c && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bt className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="font-extrabold text-sm">Revender Produto no Mercado</h3>
              </div>
              <button type="button" onClick={() => l(null)} className="text-neutral-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={T} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <img
                  src={c.productImage}
                  alt={c.productName}
                  referrerPolicy="no-referrer"
                  onError={ev => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'; }}
                  className="w-14 h-14 rounded-lg object-cover bg-neutral-100"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 truncate">{c.productName}</h4>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Preço original BABA: <strong className="tabular-nums">{F(c.originalPrice)}</strong>
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Comprado em: {new Date(c.purchaseDate).toLocaleDateString('pt-AO')}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">Preço pretendido de revenda (Kz):</label>
                <input
                  type="number"
                  value={u}
                  onChange={ev => d(Number(ev.target.value))}
                  step="500"
                  min="500"
                  required
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-1">
                  <span>Preço original de compra: {F(c.originalPrice)}</span>
                  {u > c.originalPrice ? (
                    <span className="text-emerald-600 font-semibold">+{F(u - c.originalPrice)} de margem bruta</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Desconto de {F(c.originalPrice - u)}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">Descrição complementar para os compradores:</label>
                <textarea
                  value={f}
                  onChange={ev => p(ev.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Descreve o estado do artigo, acessórios incluídos e disponibilidade em Angola..."
                />
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                <div className="flex justify-between">
                  <span>Preço anunciado:</span>
                  <span className="font-bold text-neutral-900 tabular-nums">{F(u)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Comissão da BABA SHOPPING (5%):</span>
                  <span className="tabular-nums">-{F(Math.round(u * 0.05))}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-neutral-200">
                  <span>Valor líquido a receber na venda:</span>
                  <span className="tabular-nums">{F(u - Math.round(u * 0.05))}</span>
                </div>
              </div>
              {g && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">{g}</div>}
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => l(null)} className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50 cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">Confirmar Anúncio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {y && (
        <NegotiationModal
          isOpen
          onClose={() => b(null)}
          negotiation={C.find((item: any) => item.id === y.id) || y}
          currentUser={t}
          wallet={n}
          onConfirmPurchase={(neg: any) => {
            const isAdminBuyer = t.role === 'admin' || t.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || t.id === 'usr_admin';
            const spendable = isAdminBuyer ? n.availableBalance : getLivre(t.id);
            if (!isAdminBuyer && spendable < neg.currentProposedPrice) {
              showAppNotice(`Saldo livre insuficiente (${F(spendable)}) para comprar por ${F(neg.currentProposedPrice)}.`, 'error');
              return;
            }
            try {
              je(neg.listingId, t.id, neg.currentProposedPrice);
              b(null);
              i(neg.productName);
            } catch (err: any) {
              showAppNotice(err.message || 'Falha ao confirmar compra', 'error');
            }
          }}
        />
      )}
    </div>
  );
},ln=({wallet:e,currentUser:t,onNavigateToMarket:n,onNavigateToSell:onSell,initialAction:initAct,initialDepositAmount:initAmt,onClearInitialAction:clearAct}:any)=>{
  let [r,i]=(0,_.useState)(initAct||null);
  let [a,o]=(0,_.useState)('all');
  let [s,c]=(0,_.useState)(initAmt&&initAmt>0?initAmt:0);

  (0,_.useEffect)(()=>{
    if(initAct){
      i(initAct);
      if(initAmt && initAmt > 0) c(initAmt);
      else if(initAct==='deposit') c(0);
      clearAct && clearAct();
    }
  },[initAct,initAmt]);

  let [l,u]=(0,_.useState)('multicaixa_express');
  let [p,m]=(0,_.useState)(false);
  let [h,g]=(0,_.useState)(null);
  let [v,y]=(0,_.useState)(null);

  // Receipt proof state for Deposit
  let [depositReceiptProof, setDepositReceiptProof]=(0,_.useState)(null);
  let [depositReceiptFileName, setDepositReceiptFileName]=(0,_.useState)('');
  let [copiedField, setCopiedField]=(0,_.useState)(null);
  let openDepositModal=()=>{
    c(initAmt&&initAmt>0?initAmt:0);
    setDepositReceiptProof(null);
    setDepositReceiptFileName('');
    y(null);
    g(null);
    i('deposit');
  };
  let handleCopyRechargeValue = async (val: string, field: string) => {
    let ok = await copyTextToClipboard(val);
    if(ok){
      setCopiedField(field);
      setTimeout(()=>setCopiedField(null), 2000);
    }
  };

  // Withdrawal amount: livre para qualquer valor positivo, sem sobrescrita automática
  let [withdrawAmountStr, setWithdrawAmountStr] = (0,_.useState)('');
  let parseWithdrawAmount = (raw: string): number => {
    let cleaned = String(raw || '').trim().replace(/\s+/g, '');
    if (!cleaned) return NaN;
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    return Number(cleaned);
  };
  let pendingWithdrawTotal = getReservado(t.id);
  let maxWithdrawableBalance = getLivre(t.id);
  let openWithdrawModal = () => {
    setWithdrawAmountStr('');
    O(null);
    te(null);
    i('withdraw');
  };

  let [S,C]=(0,_.useState)('Banco Angolano de Investimentos (BAI)');
  let [w,T]=(0,_.useState)('AO06.0040.0000.1234.5678.9012.3');
  let [E,D]=(0,_.useState)(t.name);
  let [ee,te]=(0,_.useState)(null);
  let [ne,O]=(0,_.useState)(null);

  let re=Te(t.id);
  let ie=re.filter(e=>a==='all'?!0:a==='carregamento'?e.type==='carregamento':a==='compra'?e.type==='compra_oficial'||e.type==='compra_revenda':a==='venda'?e.type==='venda_recebida':a!=='levantamento'||e.type==='levantamento');

  // Submit Deposit
  let k=ev=>{
    ev.preventDefault();
    y(null);
    g(null);
    if(!s||s<=0||isNaN(s)){
      y('Por favor, seleciona ou introduz o valor que desejas depositar.');
      return;
    }
    if(!depositReceiptProof){
      y('Por favor, carrega o comprovativo de pagamento no espaço acima antes de enviar.');
      return;
    }
    try{
      let defaultRef = l==='paypay' ? ('PAYPAY-10116-935723248-' + Date.now().toString().slice(-4)) : ('XPRESS-933191188-' + Date.now().toString().slice(-4));
      Ee(t.id, s, l, defaultRef, false, depositReceiptProof);
      g(`Pedido de depósito de ${F(s)} enviado! Aparecerá no extrato como Pendente e só será creditado após aprovação do Administrador.`);
      setTimeout(()=>{
        i(null);
        g(null);
        c(0);
        setDepositReceiptProof(null);
        setDepositReceiptFileName('');
      },2400);
    }catch(err: any){
      y(err.message||'Erro ao processar carregamento');
    }
  };

  // Submit Withdrawal: permite qualquer valor positivo até ao saldo disponível
  let A=ev=>{
    ev.preventDefault();
    O(null);
    te(null);
    let numericAmt = parseWithdrawAmount(withdrawAmountStr);
    if(!numericAmt || isNaN(numericAmt) || numericAmt <= 0){
      O('Por favor, seleciona ou digita o valor que desejas sacar.');
      return;
    }
    if(numericAmt < 2000){
      O('O valor mínimo para saque é de 2.000,00 Kz.');
      return;
    }
    if(numericAmt > maxWithdrawableBalance){
      if(pendingWithdrawTotal > 0 && numericAmt <= e.availableBalance){
        O(`Já tens ${F(pendingWithdrawTotal)} em movimentos pendentes de aprovação pelo Administrador. Podes sacar até ${F(maxWithdrawableBalance)}.`);
      } else {
        O(`Saldo insuficiente. O teu saldo disponível para levantamento é de ${F(e.availableBalance)}.`);
      }
      return;
    }
    if(!w || !w.trim()){
      O('Por favor, introduz o IBAN de destino em Angola (AO06...).');
      return;
    }
    if(!E || !E.trim()){
      O('Por favor, indica o nome do titular da conta bancária.');
      return;
    }
    try{
      Oe(t.id, numericAmt, w.trim(), S, E.trim());
      te(`Pedido de saque de ${F(numericAmt)} enviado! Aparecerá no extrato como Pendente e só será debitado e marcado como Sucesso após aprovação do Adm.`);
      setTimeout(()=>{
        i(null);
        te(null);
        setWithdrawAmountStr('');
      },2400);
    }catch(err: any){
      O(err.message||'Erro ao solicitar levantamento');
    }
  };

  let handleDepositReceiptUpload=(ev: any)=>{
    let file = ev.target.files?.[0];
    if(file){
      setDepositReceiptFileName(file.name);
      if (file.type && file.type.startsWith('image/')) {
        compressImageToDataUrl(file).then((compressed: string) => {
          setDepositReceiptProof(compressed);
        }).catch(() => {
          let reader = new FileReader();
          reader.onloadend = () => {
            if(typeof reader.result === 'string'){
              setDepositReceiptProof(reader.result);
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        let reader = new FileReader();
        reader.onloadend = () => {
          if(typeof reader.result === 'string'){
            setDepositReceiptProof(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  let ae=e=>{switch(e){case'carregamento':return'Carregamento (Express / PayPay)';case'compra_oficial':return'Compra no Mercado Oficial';case'compra_revenda':return'Compra no Mercado de Revenda';case'venda_recebida':return'Crédito de Venda Concluída';case'levantamento':return'Levantamento para IBAN';case'taxa_plataforma':return'Comissão da Plataforma';default:return e}};

  return (0,V.jsxs)('div',{className:'space-y-8 pb-12',children:[
    (0,V.jsxs)('div',{className:'flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4',children:[
      (0,V.jsxs)('div',{children:[
        (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
          (0,V.jsx)(Jt,{className:'w-6 h-6 text-amber-500'}),
          (0,V.jsx)('h1',{className:'text-2xl font-black text-neutral-900 tracking-tight',children:'Minha Carteira Digital'})
        ]}),
        (0,V.jsx)('p',{className:'text-xs text-neutral-500 mt-1',children:'Gestão financeira transparente em Kwanzas (Kz) com transações atómicas seguras.'})
      ]}),
      (0,V.jsxs)('div',{className:'flex flex-wrap items-center gap-2',children:[
        (0,V.jsxs)('button',{type:'button',onClick:openDepositModal,className:'px-4 py-2 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#e05d00] hover:to-[#e04700] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer',children:[(0,V.jsx)(lt,{className:'w-4 h-4 text-white'}),(0,V.jsx)('span',{children:'Recarregar Carteira'})]}),
        (0,V.jsxs)('button',{type:'button',onClick:openWithdrawModal,className:'px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer',children:[(0,V.jsx)(Ze,{className:'w-4 h-4'}),(0,V.jsx)('span',{children:'Levantar Dinheiro'})]})
      ]})
    ]}),
    (0,V.jsxs)('div',{className:'grid grid-cols-1 md:grid-cols-3 gap-5',children:[
      (0,V.jsxs)('div',{className:'p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-md relative overflow-hidden flex flex-col justify-between',children:[
        (0,V.jsxs)('div',{className:'space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center justify-between',children:[
            (0,V.jsx)('span',{className:'text-xs uppercase font-bold tracking-wider text-amber-400',children:'Saldo Disponível'}),
            (0,V.jsx)(R,{className:'w-5 h-5 text-amber-400'})
          ]}),
          (0,V.jsx)('div',{className:'text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight',children:F(e.availableBalance)}),
          (0,V.jsx)('p',{className:'text-xs text-neutral-400',children:'Pronto a utilizar para compras imediatas na BABA SHOPPING ou levantamentos bancários.'})
        ]}),
        (0,V.jsxs)('div',{className:'pt-4 mt-4 border-t border-neutral-800 grid grid-cols-2 gap-2.5',children:[
          (0,V.jsxs)('button',{type:'button',onClick:openDepositModal,className:'py-2.5 px-3 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#e05d00] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer',children:[(0,V.jsx)(lt,{className:'w-3.5 h-3.5 text-white'}),(0,V.jsx)('span',{children:'Recarregar'})]}),
          (0,V.jsxs)('button',{type:'button',onClick:openWithdrawModal,className:'py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer',children:[(0,V.jsx)(Ze,{className:'w-3.5 h-3.5'}),(0,V.jsx)('span',{children:'Levantar'})]})
        ]})
      ]}),
      (0,V.jsxs)('div',{className:'p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between space-y-4',children:[
        (0,V.jsxs)('div',{className:'space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center justify-between',children:[
            (0,V.jsx)('span',{className:'text-xs uppercase font-bold tracking-wider text-neutral-500',children:'Valores em Processamento'}),
            (0,V.jsx)(ut,{className:'w-4 h-4 text-blue-500'})
          ]}),
          (0,V.jsx)('div',{className:'text-2xl sm:text-3xl font-extrabold text-neutral-800 tabular-nums',children:F(e.pendingBalance)}),
          (0,V.jsx)('p',{className:'text-xs text-neutral-500 leading-relaxed',children:'Pagamentos de vendas ou carregamentos a aguardar confirmação pelo prestador ou entrega.'})
        ]}),
        (0,V.jsx)('div',{className:'text-[11px] text-neutral-400 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100',children:'Crédito automático após validação pelo prestador.'})
      ]}),
      (0,V.jsxs)('div',{className:'p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between space-y-4',children:[
        (0,V.jsxs)('div',{className:'space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center justify-between',children:[
            (0,V.jsx)('span',{className:'text-xs uppercase font-bold tracking-wider text-neutral-500',children:'Valores Reservados'}),
            (0,V.jsx)(xt,{className:'w-4 h-4 text-amber-500'})
          ]}),
          (0,V.jsx)('div',{className:'text-2xl sm:text-3xl font-extrabold text-neutral-800 tabular-nums',children:F(e.reservedBalance)}),
          (0,V.jsx)('p',{className:'text-xs text-neutral-500 leading-relaxed',children:'Montantes cativos para levantamentos em curso ou propostas de compra aceites.'})
        ]}),
        (0,V.jsx)('div',{className:'text-[11px] text-neutral-400 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100',children:'Impede o gasto duplicado do mesmo saldo em simultâneo.'})
      ]})
    ]}),
    (0,V.jsxs)('div',{className:'grid grid-cols-2 lg:grid-cols-4 gap-4',children:[
      (0,V.jsxs)('div',{className:'p-4 rounded-xl bg-white border border-neutral-200 text-xs',children:[
        (0,V.jsx)('span',{className:'text-neutral-500 block',children:'Total de Carregamentos'}),
        (0,V.jsxs)('span',{className:'text-base font-bold text-neutral-900 tabular-nums',children:['+',F(e.totalDeposited)]})
      ]}),
      (0,V.jsxs)('div',{className:'p-4 rounded-xl bg-white border border-neutral-200 text-xs',children:[
        (0,V.jsx)('span',{className:'text-neutral-500 block',children:'Total Gasto em Compras'}),
        (0,V.jsxs)('span',{className:'text-base font-bold text-neutral-900 tabular-nums',children:['-',F(e.totalSpent)]})
      ]}),
      (0,V.jsxs)('div',{className:'p-4 rounded-xl bg-white border border-neutral-200 text-xs',children:[
        (0,V.jsx)('span',{className:'text-neutral-500 block',children:'Total Recebido em Vendas'}),
        (0,V.jsxs)('span',{className:'text-base font-bold text-emerald-600 tabular-nums',children:['+',F(e.totalEarned)]})
      ]}),
      (0,V.jsxs)('div',{className:'p-4 rounded-xl bg-white border border-neutral-200 text-xs',children:[
        (0,V.jsx)('span',{className:'text-neutral-500 block',children:'Total de Levantamentos'}),
        (0,V.jsx)('span',{className:'text-base font-bold text-neutral-900 tabular-nums',children:F(e.totalWithdrawn)})
      ]})
    ]}),
    (0,V.jsxs)('div',{className:'bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs',children:[
      (0,V.jsxs)('div',{className:'p-4 sm:p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50',children:[
        (0,V.jsxs)('div',{children:[
          (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
            (0,V.jsx)(ht,{className:'w-5 h-5 text-neutral-700'}),
            (0,V.jsx)('h2',{className:'text-base font-bold text-neutral-900',children:'Extrato Completo de Transações'})
          ]}),
          (0,V.jsx)('p',{className:'text-xs text-neutral-500 mt-0.5',children:'Registo financeiro auditável com carimbos de data, referências e idempotência.'})
        ]}),
        (0,V.jsxs)('div',{className:'w-full max-w-full flex items-center gap-2 overflow-x-auto scrollbar-none text-xs',children:[
          (0,V.jsxs)('button',{type:'button',onClick:()=>o('all'),className:`px-3 py-1.5 rounded-lg font-semibold transition-colors ${a==='all'?'bg-neutral-900 text-amber-400':'bg-white border border-neutral-200 text-neutral-600'}`,children:['Todas (',re.length,')']}),
          (0,V.jsx)('button',{type:'button',onClick:()=>o('carregamento'),className:`px-3 py-1.5 rounded-lg font-semibold transition-colors ${a==='carregamento'?'bg-neutral-900 text-amber-400':'bg-white border border-neutral-200 text-neutral-600'}`,children:'Carregamentos'}),
          (0,V.jsx)('button',{type:'button',onClick:()=>o('compra'),className:`px-3 py-1.5 rounded-lg font-semibold transition-colors ${a==='compra'?'bg-neutral-900 text-amber-400':'bg-white border border-neutral-200 text-neutral-600'}`,children:'Compras'}),
          (0,V.jsx)('button',{type:'button',onClick:()=>o('venda'),className:`px-3 py-1.5 rounded-lg font-semibold transition-colors ${a==='venda'?'bg-neutral-900 text-amber-400':'bg-white border border-neutral-200 text-neutral-600'}`,children:'Vendas'}),
          (0,V.jsx)('button',{type:'button',onClick:()=>o('levantamento'),className:`px-3 py-1.5 rounded-lg font-semibold transition-colors ${a==='levantamento'?'bg-neutral-900 text-amber-400':'bg-white border border-neutral-200 text-neutral-600'}`,children:'Levantamentos'})
        ]})
      ]}),
      ie.length===0?(0,V.jsxs)('div',{className:'p-12 text-center text-neutral-400 space-y-2',children:[
        (0,V.jsx)(mt,{className:'w-10 h-10 mx-auto text-neutral-300 stroke-1'}),
        (0,V.jsx)('p',{className:'text-sm font-semibold text-neutral-600',children:'Nenhuma transação registada neste filtro'}),
        (0,V.jsx)('p',{className:'text-xs text-neutral-400',children:'As operações financeiras realizadas nesta conta surgirão aqui com recibo e referência.'})
      ]}):(0,V.jsx)('div',{className:'divide-y divide-neutral-100 overflow-x-auto',children:ie.map(e=>{
        let t=e.type==='carregamento'||e.type==='venda_recebida';
        return (0,V.jsxs)('div',{className:'p-4 sm:px-6 hover:bg-neutral-50/70 transition-colors flex items-center justify-between gap-4 text-xs',children:[
          (0,V.jsxs)('div',{className:'flex items-start gap-3 min-w-0',children:[
            (0,V.jsx)('div',{className:`p-2.5 rounded-xl border mt-0.5 shrink-0 ${t?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-neutral-100 text-neutral-700 border-neutral-200'}`,children:t?(0,V.jsx)(qe,{className:'w-4 h-4'}):(0,V.jsx)(Ze,{className:'w-4 h-4'})}),
            (0,V.jsxs)('div',{className:'min-w-0',children:[
              (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
                (0,V.jsx)('span',{className:'font-bold text-neutral-900 text-sm',children:ae(e.type)}),
                (0,V.jsxs)('span',{className:'text-[10px] text-neutral-400 font-mono',children:['Ref: ',e.reference]})
              ]}),
              (0,V.jsx)('p',{className:'text-xs text-neutral-600 mt-0.5 truncate max-w-md',children:e.description}),
              e.status==='recusada'&&e.rejectionReason&&(0,V.jsxs)('div',{className:'mt-1 inline-block px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700',children:['Motivo da rejeição: ',e.rejectionReason]}),
              (0,V.jsx)('span',{className:'text-[11px] text-neutral-400 mt-0.5 block',children:new Date(e.createdAt).toLocaleString('pt-AO')})
            ]})
          ]}),
          (0,V.jsxs)('div',{className:'text-right shrink-0',children:[
            (0,V.jsxs)('div',{className:`text-base font-extrabold tabular-nums ${t?'text-emerald-600':'text-neutral-900'}`,children:[t?'+':'-',F(Math.abs(e.amount))]}),
            (0,V.jsx)('span',{className:`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${e.status==='confirmada'?'bg-emerald-100 text-emerald-800':e.status==='pendente'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-800'}`,children:e.status==='confirmada'?'Sucesso':e.status==='pendente'?'Pendente':'Recusada'})
          ]})
        ]},e.id);
      })})
    ]}),

    /* MODAL DE CARREGAMENTO (DEPOSIT) COM SELEÇÃO DE VALOR E ESPAÇO GRANDE DE COMPROVATIVO */
    r==='deposit'&&(0,V.jsx)('div',{className:'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn',children:(0,V.jsxs)('div',{className:'bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto',children:[
      (0,V.jsxs)('div',{className:'p-4 bg-neutral-900 text-white flex items-center justify-between',children:[
        (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
          (0,V.jsx)(lt,{className:'w-4 h-4 text-amber-400'}),
          (0,V.jsx)('h3',{className:'font-bold text-sm',children:'Carregamento da Carteira (Kz)'})
        ]}),
        (0,V.jsx)('button',{type:'button',onClick:()=>i(null),className:'text-neutral-400 hover:text-white cursor-pointer',children:'✕'})
      ]}),
      (0,V.jsxs)('form',{onSubmit:k,noValidate:true,className:'p-5 space-y-4',children:[
        (0,V.jsxs)('div',{className:'space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center justify-between',children:[
            (0,V.jsx)('label',{className:'text-xs font-black text-neutral-900',children:'1. Seleciona o valor do depósito (Kz):'}),
            s>0&&(0,V.jsx)('span',{className:'text-xs font-black text-[#FF4500] tabular-nums',children:F(s)})
          ]}),
          (0,V.jsx)('div',{className:'grid grid-cols-2 sm:grid-cols-4 gap-1.5',children:[500,1000,2500,5000,10000,25000,50000,100000].map(val=>(0,V.jsx)('button',{key:val,type:'button',onClick:()=>{c(val);y(null);},className:`py-2 px-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer tabular-nums ${s===val?'bg-gradient-to-r from-[#FF6A00] to-[#FF4500] text-white border-[#FF4500] shadow-md scale-[1.02]':'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'}`,children:F(val)}))}),
          (0,V.jsxs)('div',{className:'relative pt-1',children:[
            (0,V.jsx)('input',{type:'number',value:s||'',onChange:e=>{c(Math.max(0,Number(e.target.value)));y(null);},min:'1',step:'any',placeholder:'Ou digita outro valor (ex: 15.000)',className:'w-full p-2.5 pr-10 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-black text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500'}),
            (0,V.jsx)('span',{className:'absolute right-3 top-3.5 text-xs font-bold text-neutral-400',children:'Kz'})
          ]})
        ]}),
        (0,V.jsxs)('div',{children:[
          (0,V.jsx)('label',{className:'text-xs font-black text-neutral-900 block mb-1.5',children:'2. Método de Recarga Oficial em Angola:'}),
          (0,V.jsxs)('div',{className:'grid grid-cols-2 gap-2 text-xs',children:[
            (0,V.jsxs)('button',{type:'button',onClick:()=>u('multicaixa_express'),className:`p-2.5 rounded-xl border font-bold text-left transition-all cursor-pointer flex items-center gap-2.5 ${l==='multicaixa_express'?'border-[#FF6A00] bg-orange-50 text-neutral-900 ring-2 ring-[#FF6A00]/40 shadow-xs':'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'}`,children:[
              (0,V.jsx)('img',{src:'/assets/aistudio/IMG_4106_b00dac5c.jpeg',alt:'Multicaixa Express',className:'w-11 h-8 rounded-lg object-cover border border-orange-200 shrink-0'}),
              (0,V.jsxs)('div',{className:'min-w-0',children:[
                (0,V.jsx)('span',{className:'block font-black text-neutral-900 truncate',children:'Multicaixa Express'}),
                (0,V.jsx)('span',{className:'block text-[10px] font-mono font-bold text-[#FF6A00] truncate',children:'Nº 933 191 188'})
              ]})
            ]}),
            (0,V.jsxs)('button',{type:'button',onClick:()=>u('paypay'),className:`p-2.5 rounded-xl border font-bold text-left transition-all cursor-pointer flex items-center gap-2.5 ${l==='paypay'?'border-indigo-600 bg-indigo-50 text-neutral-900 ring-2 ring-indigo-500/40 shadow-xs':'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'}`,children:[
              (0,V.jsx)('img',{src:'/assets/aistudio/IMG_1417_a64da3e1.jpeg',alt:'PayPay',className:'w-9 h-9 rounded-lg object-cover border border-indigo-200 shrink-0'}),
              (0,V.jsxs)('div',{className:'min-w-0',children:[
                (0,V.jsx)('span',{className:'block font-black text-neutral-900 truncate',children:'PayPay'}),
                (0,V.jsx)('span',{className:'block text-[10px] font-mono font-bold text-indigo-700 truncate',children:'Ent: 10116'})
              ]})
            ]})
          ]})
        ]}),
        l==='multicaixa_express'?(0,V.jsxs)('div',{className:'p-3 rounded-xl bg-orange-50/80 border border-orange-200 text-xs space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center justify-between gap-2 pb-2 border-b border-orange-200/70',children:[
            (0,V.jsxs)('div',{className:'flex items-center gap-2.5',children:[
              (0,V.jsx)('img',{src:'/assets/aistudio/IMG_4106_b00dac5c.jpeg',alt:'Express',className:'w-12 h-8 rounded-lg object-cover border border-orange-300 shrink-0'}),
              (0,V.jsxs)('div',{children:[
                (0,V.jsx)('span',{className:'text-[10px] font-bold uppercase text-orange-800 block',children:'Nº Xpress Oficial'}),
                (0,V.jsx)('span',{className:'text-sm font-black font-mono text-neutral-900 tracking-wide',children:'933 191 188'})
              ]})
            ]}),
            (0,V.jsxs)('button',{type:'button',onClick:()=>handleCopyRechargeValue('933191188','xpress'),className:'px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0',children:[
              copiedField==='xpress'?(0,V.jsx)(it,{className:'w-3.5 h-3.5 text-emerald-400'}):(0,V.jsx)(Copy,{className:'w-3.5 h-3.5'}),
              (0,V.jsx)('span',{children:copiedField==='xpress'?'Copiado!':'Copiar Nº'})
            ]})
          ]}),
          (0,V.jsxs)('span',{className:'text-[11px] text-neutral-700 block',children:[s>0?`Transfere ${F(s)} via Multicaixa Express para `:'Transfere o valor selecionado via Multicaixa Express para ',(0,V.jsx)('strong',{children:'933 191 188'}),' e carrega o comprovativo abaixo.']})
        ]}):(0,V.jsxs)('div',{className:'p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center gap-2.5 pb-2 border-b border-indigo-200/70',children:[
            (0,V.jsx)('img',{src:'/assets/aistudio/IMG_1417_a64da3e1.jpeg',alt:'PayPay',className:'w-9 h-9 rounded-lg object-cover border border-indigo-300 shrink-0'}),
            (0,V.jsxs)('div',{children:[
              (0,V.jsx)('span',{className:'text-xs font-black text-indigo-950 block',children:'Pagamento por Referência PayPay'}),
              (0,V.jsx)('span',{className:'text-[10px] text-indigo-700 font-medium',children:'Usa a Entidade e Referência abaixo na app PayPay'})
            ]})
          ]}),
          (0,V.jsxs)('div',{className:'flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100',children:[
            (0,V.jsx)('span',{className:'text-neutral-500 font-semibold',children:'Entidade (Ent):'}),
            (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
              (0,V.jsx)('strong',{className:'text-neutral-950 font-mono text-sm',children:'10116'}),
              (0,V.jsxs)('button',{type:'button',onClick:()=>handleCopyRechargeValue('10116','ent'),className:'px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer',children:[
                copiedField==='ent'?(0,V.jsx)(it,{className:'w-3 h-3 text-emerald-600'}):(0,V.jsx)(Copy,{className:'w-3 h-3'}),
                (0,V.jsx)('span',{children:copiedField==='ent'?'Copiado':'Copiar'})
              ]})
            ]})
          ]}),
          (0,V.jsxs)('div',{className:'flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100',children:[
            (0,V.jsx)('span',{className:'text-neutral-500 font-semibold',children:'Referência (Ref):'}),
            (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
              (0,V.jsx)('strong',{className:'text-neutral-950 font-mono text-sm',children:'935 723 248'}),
              (0,V.jsxs)('button',{type:'button',onClick:()=>handleCopyRechargeValue('935723248','ref'),className:'px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer',children:[
                copiedField==='ref'?(0,V.jsx)(it,{className:'w-3 h-3 text-emerald-600'}):(0,V.jsx)(Copy,{className:'w-3 h-3'}),
                (0,V.jsx)('span',{children:copiedField==='ref'?'Copiado':'Copiar'})
              ]})
            ]})
          ]}),
          (0,V.jsxs)('div',{className:'flex justify-between px-1 pt-0.5',children:[
            (0,V.jsx)('span',{className:'text-neutral-500 font-semibold',children:'Montante:'}),
            (0,V.jsx)('strong',{className:'text-neutral-900 tabular-nums',children:s>0?F(s):'Seleciona o valor acima'})
          ]})
        ]}),

        /* ÚNICO ESPAÇO GRANDE PARA CARREGAR O COMPROVATIVO */
        (0,V.jsxs)('div',{className:'space-y-2',children:[
          (0,V.jsxs)('div',{className:'flex items-center justify-between',children:[
            (0,V.jsx)('label',{className:'text-xs font-black text-neutral-900',children:'3. Comprovativo de Pagamento:'}),
            (0,V.jsx)('span',{className:`text-[10px] font-bold px-2 py-0.5 rounded-md ${depositReceiptProof?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-900'}`,children:depositReceiptProof?'✓ Carregado':'Obrigatório'})
          ]}),
          depositReceiptProof?(0,V.jsxs)('div',{className:'min-h-[170px] p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-400 flex flex-col items-center justify-center gap-3 text-center',children:[
            depositReceiptProof.startsWith('data:application/pdf')?(0,V.jsx)('div',{className:'w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center',children:(0,V.jsx)(ht,{className:'w-8 h-8 text-emerald-700'})}):(0,V.jsx)('img',{src:depositReceiptProof,alt:'Comprovativo',className:'w-full max-h-40 object-contain rounded-xl border border-emerald-200 bg-white p-1'}),
            (0,V.jsxs)('div',{className:'w-full space-y-1',children:[
              (0,V.jsxs)('span',{className:'text-xs font-bold text-emerald-900 flex items-center justify-center gap-1 truncate',children:[(0,V.jsx)(it,{className:'w-4 h-4 text-emerald-600 shrink-0'}),(0,V.jsx)('span',{className:'truncate',children:depositReceiptFileName||'Comprovativo Carregado'})]}),
              (0,V.jsx)('button',{type:'button',onClick:()=>{setDepositReceiptProof(null);setDepositReceiptFileName('');},className:'text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer',children:'Remover e carregar outro ficheiro'})
            ]})
          ]}):(0,V.jsxs)('label',{className:'min-h-[170px] p-6 rounded-2xl bg-amber-50/70 hover:bg-amber-50 border-2 border-dashed border-amber-400 hover:border-[#FF4500] flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all group',children:[
            (0,V.jsx)('div',{className:'w-14 h-14 rounded-2xl bg-white border border-amber-200 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform',children:(0,V.jsx)(Wt,{className:'w-7 h-7 text-[#FF4500]'})}),
            (0,V.jsx)('span',{className:'text-sm font-black text-neutral-900',children:'Carregar Comprovativo'}),
            (0,V.jsx)('span',{className:'text-xs font-medium text-neutral-600 max-w-[260px]',children:'Toca neste espaço grande para anexar a foto do talão ou ficheiro PDF'}),
            (0,V.jsx)('input',{type:'file',accept:'image/*,application/pdf',className:'hidden',onChange:handleDepositReceiptUpload})
          ]})
        ]}),

        (0,V.jsxs)('div',{className:'p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1',children:[
          (0,V.jsx)('span',{className:'font-black block',children:'Aprovação Obrigatória pelo Administrador'}),
          (0,V.jsx)('span',{className:'text-[11px] text-amber-900 leading-relaxed block',children:'Todos os depósitos e saques são verificados pelo Administrador antes de serem creditados ou transferidos na carteira.'})
        ]}),
        v&&(0,V.jsx)('div',{className:'p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-semibold',children:v}),
        h&&(0,V.jsxs)('div',{className:'p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-1.5 font-bold',children:[(0,V.jsx)(ct,{className:'w-4 h-4 text-emerald-600 shrink-0'}),(0,V.jsx)('span',{children:h})]}),
        (0,V.jsxs)('div',{className:'flex items-center gap-2 pt-2',children:[
          (0,V.jsx)('button',{type:'button',onClick:()=>i(null),className:'flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50 cursor-pointer',children:'Cancelar'}),
          (0,V.jsx)('button',{type:'submit',className:'flex-1 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer',children:'Enviar Depósito para Aprovação'})
        ]})
      ]})
    ]})}),

    /* MODAL DE LEVANTAMENTO (WITHDRAW) COM VALIDAÇÃO AMIGÁVEL E SEM ERRO NATIVO */
    r==='withdraw'&&(0,V.jsx)('div',{className:'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn',children:(0,V.jsxs)('div',{className:'bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200',children:[
      (0,V.jsxs)('div',{className:'p-4 bg-neutral-900 text-white flex items-center justify-between',children:[
        (0,V.jsxs)('div',{className:'flex items-center gap-2',children:[
          (0,V.jsx)(et,{className:'w-4 h-4 text-amber-400'}),
          (0,V.jsx)('h3',{className:'font-bold text-sm',children:'Levantamento Bancário (Angola)'})
        ]}),
        (0,V.jsx)('button',{type:'button',onClick:()=>i(null),className:'text-neutral-400 hover:text-white',children:'✕'})
      ]}),
      (0,V.jsxs)('form',{onSubmit:A,noValidate:true,className:'p-5 space-y-4',children:[
        (0,V.jsxs)('div',{className:'p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1',children:[
          (0,V.jsxs)('div',{className:'flex justify-between text-neutral-600',children:[
            (0,V.jsx)('span',{children:'Saldo disponível na conta:'}),
            (0,V.jsx)('strong',{className:'text-neutral-900 tabular-nums font-black text-sm',children:F(e.availableBalance)})
          ]}),
          pendingWithdrawTotal > 0 && (0,V.jsxs)('div',{className:'flex justify-between text-amber-800 font-semibold text-[11px]',children:[
            (0,V.jsx)('span',{children:'Saldo retido em pedidos/saques pendentes:'}),
            (0,V.jsx)('span',{className:'tabular-nums',children:F(pendingWithdrawTotal)})
          ]})
        ]}),
        (0,V.jsxs)('div',{children:[
          (0,V.jsx)('label',{className:'text-xs font-bold text-neutral-800 block mb-1',children:'Montante a sacar (Mínimo: 2.000,00 Kz):'}),
          (0,V.jsx)('input',{
            type:'text',
            inputMode:'decimal',
            value:withdrawAmountStr,
            onChange:ev=>{setWithdrawAmountStr(ev.target.value);O(null);},
            placeholder:'Digita o valor a sacar (mínimo 2.000 Kz)',
            className:'w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-base font-bold text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500'
          }),
          maxWithdrawableBalance < 2000 && (0,V.jsx)('p',{className:'text-[11px] font-semibold text-amber-700 mt-1',children:'Nota: O valor mínimo para solicitar um saque é de 2.000,00 Kz.'}),
          (0,V.jsxs)('div',{className:'flex flex-wrap gap-1.5 mt-2',children:[
            maxWithdrawableBalance >= 2000 && (0,V.jsxs)('button',{
              type:'button',
              onClick:()=>{setWithdrawAmountStr(String(maxWithdrawableBalance));O(null);},
              className:'px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer transition-colors',
              children:['Todo o Saldo (',F(maxWithdrawableBalance),')']
            }),
            [2000, 5000, 10000, 25000, 50000].filter(val=>val<=maxWithdrawableBalance).map(val=>(0,V.jsx)('button',{
              type:'button',
              onClick:()=>{setWithdrawAmountStr(String(val));O(null);},
              className:`px-2.5 py-1 text-[11px] font-semibold rounded-lg border cursor-pointer transition-colors ${parseWithdrawAmount(withdrawAmountStr)===val?'bg-neutral-900 text-amber-400 border-neutral-900':'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'}`,
              children:F(val)
            },val))
          ]})
        ]}),
        (0,V.jsxs)('div',{children:[
          (0,V.jsx)('label',{className:'text-xs font-bold text-neutral-800 block mb-1',children:'Banco de Destino em Angola:'}),
          (0,V.jsxs)('select',{value:S,onChange:e=>C(e.target.value),className:'w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500',children:[
            (0,V.jsx)('option',{value:'Banco Angolano de Investimentos (BAI)',children:'Banco Angolano de Investimentos (BAI)'}),
            (0,V.jsx)('option',{value:'Banco de Fomento Angola (BFA)',children:'Banco de Fomento Angola (BFA)'}),
            (0,V.jsx)('option',{value:'Banco BIC Angola',children:'Banco BIC Angola'}),
            (0,V.jsx)('option',{value:'Banco Millennium Atlântico (BMA)',children:'Banco Millennium Atlântico (BMA)'}),
            (0,V.jsx)('option',{value:'Banco Sol',children:'Banco Sol'}),
            (0,V.jsx)('option',{value:'Standard Bank Angola',children:'Standard Bank Angola'}),
            (0,V.jsx)('option',{value:'Banco Caixa Geral Angola (BCGA)',children:'Banco Caixa Geral Angola (BCGA)'})
          ]})
        ]}),
        (0,V.jsxs)('div',{children:[
          (0,V.jsx)('label',{className:'text-xs font-bold text-neutral-800 block mb-1',children:'IBAN Angolano (AO06...):'}),
          (0,V.jsx)('input',{type:'text',value:w,onChange:e=>T(e.target.value),placeholder:'AO06.xxxx.xxxx.xxxx.xxxx.xxxx.x',className:'w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500'})
        ]}),
        (0,V.jsxs)('div',{children:[
          (0,V.jsx)('label',{className:'text-xs font-bold text-neutral-800 block mb-1',children:'Nome do Titular da Conta:'}),
          (0,V.jsx)('input',{type:'text',value:E,onChange:e=>D(e.target.value),className:'w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500'})
        ]}),
        (0,V.jsxs)('div',{className:'p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 leading-relaxed',children:[
          'ℹ️ ',(0,V.jsx)('strong',{children:'Aprovação do Administrador:'}),' O teu pedido de saque aparecerá no extrato como ',(0,V.jsx)('strong',{children:'Pendente'}),'. O valor só será debitado da tua conta e marcado como ',(0,V.jsx)('strong',{children:'Sucesso'}),' após aprovação do Administrador.'
        ]}),
        ne&&(0,V.jsx)('div',{className:'p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold',children:ne}),
        ee&&(0,V.jsxs)('div',{className:'p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 font-bold',children:[(0,V.jsx)(ct,{className:'w-4 h-4 text-emerald-600 shrink-0'}),(0,V.jsx)('span',{children:ee})]}),
        (0,V.jsxs)('div',{className:'flex items-center gap-2 pt-2',children:[
          (0,V.jsx)('button',{type:'button',onClick:()=>i(null),className:'flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50 cursor-pointer',children:'Cancelar'}),
          (0,V.jsx)('button',{type:'submit',className:'flex-1 py-2.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer',children:'Solicitar Levantamento'})
        ]})
      ]})
    ]})})
  ]});
};
un=()=>null;
dn=({currentUser:e,onNavigateToMarket:t})=>{let[n,r]=(0,_.useState)(`verificacao_bi`),[i,a]=(0,_.useState)(null),[o,s]=(0,_.useState)(null),[c,l]=(0,_.useState)(`Fotografia do Bilhete de Identidade ilegível. Por favor, tira nova fotografia nítida.`),[u,d]=(0,_.useState)(null),[f,p]=(0,_.useState)(!1),[m,h]=(0,_.useState)(``),[g,v]=(0,_.useState)(`telemoveis_acessorios`),[y,b]=(0,_.useState)(``),[x,C]=(0,_.useState)(8e3),[w,T]=(0,_.useState)(50),[E,D]=(0,_.useState)(`/src/assets/images/product_smartphone_pro_1792077571413.jpg`),[ee,te]=(0,_.useState)(``),[ne,O]=(0,_.useState)(`fisico`),[re,ie]=(0,_.useState)(null),k=me(),A=ve(),ae=Me(),se=oe();Te();let ce=Re(),le=ze(),fe=we();fe.usr_admin?.availableBalance;let pe=fe.usr_admin?.totalEarned||0,_e=Object.entries(fe).filter(([e])=>e!==`usr_admin`).reduce((e,[,t])=>e+t.availableBalance+t.reservedBalance,0),ye=ae.filter(e=>e.status!==`cancelado`).reduce((e,t)=>e+t.totalAmount,0),j=()=>{d(null),h(``),v(`telemoveis_acessorios`),b(`BABA Official`),C(15e3),T(50),D(`/src/assets/images/product_headphones_gold_1792077588306.jpg`),te(`Artigo oficial de alta qualidade com garantia de procedência BABA SHOPPING.`),O(`fisico`),p(!0),ie(null)},M=e=>{d(e),h(e.name),v(e.category),b(e.brand),C(e.officialPrice),T(e.stock),D(e.imageUrl),te(e.description),O(e.type),p(!0),ie(null)},be=e=>{e.preventDefault(),x<=0||w<0?ie(`Preço ou stock inválidos.`):(u?(ge(u.id,{name:m,category:g,brand:y,officialPrice:x,stock:w,imageUrl:E,description:ee,type:ne,status:w>0?`disponivel`:`esgotado`}),ie(`Produto oficial atualizado com sucesso!`)):(he({name:m,category:g,brand:y,officialPrice:x,stock:w,imageUrl:E,description:ee,type:ne,status:w>0?`disponivel`:`esgotado`,resaleEligible:!0}),ie(`Novo produto adicionado ao catálogo oficial!`)),setTimeout(()=>{p(!1),ie(null)},1500))},xe=e=>{try{De(e)}catch(e){showAppNotice(e.message, 'error')}},Se=(e,t)=>{try{ke(e,t)}catch(e){showAppNotice(e.message, 'error')}},Ce=(e,t)=>{try{Ne(e,t)}catch(e){showAppNotice(e.message, 'error')}};return(0,V.jsxs)(`div`,{className:`space-y-8 pb-16`,children:[(0,V.jsxs)(`div`,{className:`p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`,children:[(0,V.jsxs)(`div`,{className:`space-y-1`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider`,children:[(0,V.jsx)(R,{className:`w-4 h-4 text-amber-400`}),(0,V.jsx)(`span`,{children:`Área Administrativa Autorizada`})]}),(0,V.jsx)(`h1`,{className:`text-2xl font-black text-white tracking-tight`,children:`Painel de Gestão BABA SHOPPING`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-400`,children:`Controlo de preços oficiais, stock, liquidações em Kz, moderação e entregas em Angola.`})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2 text-xs`,children:[(0,V.jsx)(`span`,{className:`text-neutral-400`,children:`Sessão:`}),(0,V.jsxs)(`span`,{className:`font-bold text-amber-400 bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-700`,children:[e.name,` (Super Admin)`]})]})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200`,children:[(0,V.jsxs)(`button`,{onClick:()=>r(`verificacao_bi`),className:`py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap relative ${n===`verificacao_bi`?`bg-amber-400 text-neutral-950 shadow-xs font-black`:`text-neutral-700 bg-amber-50/80 border border-amber-200 hover:bg-amber-100`}`,children:[(0,V.jsx)(mt,{className:`w-4 h-4 text-amber-700`}),(0,V.jsx)(`span`,{children:`Aprovação de Contas & BI`}),se.filter(e=>e.accountStatus===`em_processamento`).length>0&&(0,V.jsx)(`span`,{className:`w-5 h-5 rounded-full bg-neutral-900 text-amber-400 text-[10px] font-black flex items-center justify-center`,children:se.filter(e=>e.accountStatus===`em_processamento`).length})]}),(0,V.jsxs)(`button`,{onClick:()=>r(`stats`),className:`py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${n===`stats`?`bg-neutral-900 text-amber-400 shadow-2xs`:`text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100`}`,children:[(0,V.jsx)(nt,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Estatísticas & Receitas`})]}),(0,V.jsxs)(`button`,{onClick:()=>r(`produtos`),className:`py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${n===`produtos`?`bg-neutral-900 text-amber-400 shadow-2xs`:`text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100`}`,children:[(0,V.jsx)(L,{className:`w-4 h-4`}),(0,V.jsxs)(`span`,{children:[`Gestão de Produtos (`,k.length,`)`]})]}),(0,V.jsxs)(`button`,{onClick:()=>r(`financeiro`),className:`py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap relative ${n===`financeiro`?`bg-neutral-900 text-amber-400 shadow-2xs`:`text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100`}`,children:[(0,V.jsx)(dt,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Gestão Financeira`}),(ce.filter(e=>e.status===`pendente`).length>0||le.filter(e=>e.status===`solicitado`).length>0)&&(0,V.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-amber-500 animate-pulse`})]}),(0,V.jsxs)(`button`,{onClick:()=>r(`utilizadores`),className:`py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${n===`utilizadores`?`bg-neutral-900 text-amber-400 shadow-2xs`:`text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100`}`,children:[(0,V.jsx)(qt,{className:`w-4 h-4`}),(0,V.jsxs)(`span`,{children:[`Utilizadores (`,se.length,`)`]})]})]}),n===`verificacao_bi`&&(0,V.jsxs)(`div`,{className:`space-y-6`,children:[(0,V.jsxs)(`div`,{className:`p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4`,children:[(0,V.jsxs)(`div`,{className:`space-y-1`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(R,{className:`w-5 h-5 text-amber-700`}),(0,V.jsx)(`h2`,{className:`text-base font-extrabold text-amber-950`,children:`Validação Documental de Bilhetes de Identidade (BI)`})]}),(0,V.jsx)(`p`,{className:`text-xs text-amber-900/80 leading-relaxed max-w-2xl`,children:`Nenhum utilizador pode comprar, anunciar produtos ou movimentar fundos na BABA SHOPPING sem que o seu Bilhete de Identidade (Frente e Verso) seja formalmente aprovado nesta área.`})]}),(0,V.jsxs)(`div`,{className:`text-right shrink-0`,children:[(0,V.jsx)(`span`,{className:`text-[10px] uppercase font-bold text-amber-800 block`,children:`Em Processamento`}),(0,V.jsxs)(`span`,{className:`text-2xl font-black text-amber-700 tabular-nums`,children:[se.filter(e=>e.accountStatus===`em_processamento`).length,` conta`,se.filter(e=>e.accountStatus===`em_processamento`).length===1?``:`s`]})]})]}),(0,V.jsxs)(`div`,{className:`space-y-4`,children:[(0,V.jsxs)(`h3`,{className:`text-sm font-bold text-neutral-900 flex items-center gap-2`,children:[(0,V.jsx)(ut,{className:`w-4 h-4 text-amber-500`}),(0,V.jsxs)(`span`,{children:[`Contas a Aguardar Análise do Administrador (`,se.filter(e=>e.accountStatus===`em_processamento`).length,`)`]})]}),se.filter(e=>e.accountStatus===`em_processamento`).length===0?(0,V.jsxs)(`div`,{className:`p-10 rounded-2xl bg-white border border-neutral-200 text-center space-y-2`,children:[(0,V.jsx)(ct,{className:`w-10 h-10 text-emerald-500 mx-auto`}),(0,V.jsx)(`h4`,{className:`font-bold text-sm text-neutral-800`,children:`Todas as contas estão em dia!`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-400`,children:`Não existem novos Bilhetes de Identidade pendentes de validação no momento.`})]}):(0,V.jsx)(`div`,{className:`space-y-4`,children:se.filter(e=>e.accountStatus===`em_processamento`).map(e=>(0,V.jsxs)(`div`,{className:`p-5 sm:p-6 bg-white rounded-3xl border border-amber-300 shadow-md space-y-5 transition-all`,children:[(0,V.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,V.jsx)(`div`,{className:`w-12 h-12 rounded-2xl bg-neutral-900 text-amber-400 font-black text-lg flex items-center justify-center shrink-0`,children:e.name.charAt(0)}),(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`h4`,{className:`text-base font-extrabold text-neutral-900`,children:e.name}),(0,V.jsx)(`span`,{className:`text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200`,children:`Aguardando Decisão`})]}),(0,V.jsxs)(`div`,{className:`text-xs text-neutral-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5`,children:[(0,V.jsxs)(`span`,{children:[`Email: `,(0,V.jsx)(`strong`,{className:`text-neutral-700`,children:e.email})]}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsxs)(`span`,{children:[`Telemóvel: `,(0,V.jsx)(`strong`,{className:`text-neutral-700`,children:e.phone})]}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsxs)(`span`,{children:[`Localidade: `,(0,V.jsxs)(`strong`,{className:`text-neutral-700`,children:[e.city,`, `,e.province]})]})]})]})]}),(0,V.jsxs)(`div`,{className:`text-left sm:text-right`,children:[(0,V.jsx)(`span`,{className:`text-[10px] uppercase font-bold text-neutral-400 block`,children:`Nº de Bilhete Submetido`}),(0,V.jsx)(`span`,{className:`text-base font-black text-amber-600 font-mono tracking-wider`,children:e.idNumber})]})]}),(0,V.jsxs)(`div`,{className:`space-y-2`,children:[(0,V.jsx)(`span`,{className:`text-xs font-bold text-neutral-800 block`,children:`Fotografias do Documento para Análise Pericial:`}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4`,children:[(0,V.jsxs)(`div`,{className:`rounded-2xl border border-neutral-200 p-3 bg-neutral-50 space-y-2`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between text-xs`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-700`,children:`1. Frente do BI (Foto e Dados Pessoais)`}),(0,V.jsxs)(`button`,{type:`button`,onClick:()=>e.idCardFront&&a({title:`Frente do BI — ${e.name}`,src:e.idCardFront}),className:`text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 text-[11px]`,children:[(0,V.jsx)(pt,{className:`w-3.5 h-3.5`}),` Ampliar Imagem`]})]}),(0,V.jsx)(`div`,{onClick:()=>e.idCardFront&&a({title:`Frente do BI — ${e.name}`,src:e.idCardFront}),className:`aspect-16/10 rounded-xl bg-white border border-neutral-200 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`,children:e.idCardFront?(0,V.jsx)(`img`,{src:e.idCardFront,alt:`Frente do BI`,className:`w-full h-full object-contain p-1`}):(0,V.jsx)(`span`,{className:`text-neutral-400 text-xs`,children:`Sem foto`})})]}),(0,V.jsxs)(`div`,{className:`rounded-2xl border border-neutral-200 p-3 bg-neutral-50 space-y-2`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between text-xs`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-700`,children:`2. Verso do BI (Filiação, Residência e Código)`}),(0,V.jsxs)(`button`,{type:`button`,onClick:()=>e.idCardBack&&a({title:`Verso do BI — ${e.name}`,src:e.idCardBack}),className:`text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 text-[11px]`,children:[(0,V.jsx)(pt,{className:`w-3.5 h-3.5`}),` Ampliar Imagem`]})]}),(0,V.jsx)(`div`,{onClick:()=>e.idCardBack&&a({title:`Verso do BI — ${e.name}`,src:e.idCardBack}),className:`aspect-16/10 rounded-xl bg-white border border-neutral-200 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`,children:e.idCardBack?(0,V.jsx)(`img`,{src:e.idCardBack,alt:`Verso do BI`,className:`w-full h-full object-contain p-1`}):(0,V.jsx)(`span`,{className:`text-neutral-400 text-xs`,children:`Sem foto`})})]})]})]}),(0,V.jsxs)(`div`,{className:`pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3`,children:[(0,V.jsxs)(`span`,{className:`text-[11px] text-neutral-400`,children:[`Submetido em: `,new Date(e.createdAt).toLocaleString(`pt-AO`)]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-3 w-full sm:w-auto`,children:[(0,V.jsxs)(`button`,{type:`button`,onClick:()=>{s(e),l(`Fotografia do Bilhete de Identidade ilegível ou cortada. Por favor, tira nova fotografia com boa iluminação.`)},className:`flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5`,children:[(0,V.jsx)(Zt,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Rejeitar Documento`})]}),(0,V.jsxs)(`button`,{type:`button`,onClick:()=>{try{ue(e.id)}catch(e){showAppNotice(e.message, 'error')}},className:`flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-colors flex items-center justify-center gap-2`,children:[(0,V.jsx)(it,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Aprovar Conta & Validar BI`})]})]})]})]},e.id))})]}),(0,V.jsxs)(`div`,{className:`bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-2xs`,children:[(0,V.jsxs)(`div`,{className:`p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`h4`,{className:`font-bold text-xs uppercase tracking-wider text-neutral-800`,children:`Contas com Bilhete de Identidade Verificado`}),(0,V.jsx)(`p`,{className:`text-[11px] text-neutral-500`,children:`Membros autorizados para compras e revenda em Angola`})]}),(0,V.jsxs)(`span`,{className:`text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full`,children:[se.filter(e=>e.accountStatus===`ativo`).length,` verificados`]})]}),(0,V.jsx)(`div`,{className:`divide-y divide-neutral-100 overflow-x-auto text-xs`,children:se.filter(e=>e.accountStatus===`ativo`).map(e=>(0,V.jsxs)(`div`,{className:`p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,V.jsx)(`div`,{className:`w-9 h-9 rounded-xl bg-neutral-900 text-amber-400 font-bold flex items-center justify-center text-xs`,children:e.name.charAt(0)}),(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`strong`,{className:`text-neutral-900`,children:e.name}),e.role===`admin`?(0,V.jsx)(`span`,{className:`text-[9px] bg-amber-400 text-neutral-950 font-black px-1.5 py-0.5 rounded`,children:`ADMIN`}):(0,V.jsxs)(`span`,{className:`text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5`,children:[(0,V.jsx)(ct,{className:`w-2.5 h-2.5`}),` BI VÁLIDO`]})]}),(0,V.jsxs)(`div`,{className:`text-[11px] text-neutral-500 mt-0.5 font-mono`,children:[`BI: `,e.idNumber,` · `,e.province,` (`,e.city,`)`]})]})]}),(0,V.jsxs)(`div`,{className:`text-right`,children:[(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400 block`,children:`Contacto`}),(0,V.jsx)(`span`,{className:`text-neutral-700 font-medium`,children:e.phone})]})]},e.id))})]})]}),n===`stats`&&(0,V.jsxs)(`div`,{className:`space-y-6`,children:[(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`,children:[(0,V.jsxs)(`div`,{className:`p-5 rounded-2xl bg-white border border-neutral-200 shadow-2xs`,children:[(0,V.jsx)(`span`,{className:`text-xs text-neutral-500 block font-medium`,children:`Volume Total de Vendas`}),(0,V.jsx)(`div`,{className:`text-2xl font-black text-neutral-900 mt-1 tabular-nums`,children:F(ye)}),(0,V.jsx)(`span`,{className:`text-[11px] text-neutral-400 block mt-1`,children:`Transações comerciais oficiais e revenda`})]}),(0,V.jsxs)(`div`,{className:`p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs`,children:[(0,V.jsx)(`span`,{className:`text-xs text-amber-800 block font-bold`,children:`Comissões da Plataforma (5%)`}),(0,V.jsx)(`div`,{className:`text-2xl font-black text-amber-700 mt-1 tabular-nums`,children:F(pe)}),(0,V.jsx)(`span`,{className:`text-[11px] text-amber-800/80 block mt-1`,children:`Receita efetiva retida pela BABA SHOPPING`})]}),(0,V.jsxs)(`div`,{className:`p-5 rounded-2xl bg-white border border-neutral-200 shadow-2xs`,children:[(0,V.jsx)(`span`,{className:`text-xs text-neutral-500 block font-medium`,children:`Saldo de Utilizadores em Circulação`}),(0,V.jsx)(`div`,{className:`text-2xl font-black text-neutral-900 mt-1 tabular-nums`,children:F(_e)}),(0,V.jsx)(`span`,{className:`text-[11px] text-neutral-400 block mt-1`,children:`Fundos dos clientes mantidos em custódia`})]}),(0,V.jsxs)(`div`,{className:`p-5 rounded-2xl bg-white border border-neutral-200 shadow-2xs`,children:[(0,V.jsx)(`span`,{className:`text-xs text-neutral-500 block font-medium`,children:`Transações Totais`}),(0,V.jsx)(`div`,{className:`text-2xl font-black text-neutral-900 mt-1 tabular-nums`,children:ae.length}),(0,V.jsx)(`span`,{className:`text-[11px] text-neutral-400 block mt-1`,children:`Compras e Vendas na Plataforma`})]})]}),(0,V.jsxs)(`div`,{className:`p-4 rounded-xl bg-neutral-900 text-neutral-200 text-xs border border-neutral-800 flex items-start gap-3`,children:[(0,V.jsx)(R,{className:`w-5 h-5 text-amber-400 shrink-0 mt-0.5`}),(0,V.jsxs)(`div`,{className:`space-y-1`,children:[(0,V.jsx)(`span`,{className:`font-bold text-white text-sm`,children:`Princípio de Transparência e Segregação Contabilística:`}),(0,V.jsxs)(`p`,{className:`text-neutral-300 leading-relaxed`,children:[`A BABA SHOPPING distingue categoricamente o `,(0,V.jsx)(`strong`,{children:`volume bruto transacionado`}),` e o `,(0,V.jsx)(`strong`,{children:`saldo pertencente aos utilizadores`}),` da `,(0,V.jsx)(`strong`,{children:`receita efetiva da empresa`}),` (comissões de 5% sobre revendas e margens de artigos oficiais). O dinheiro dos clientes permanece segregado e auditável a qualquer momento.`]})]})]}),(0,V.jsxs)(`div`,{className:`bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs`,children:[(0,V.jsxs)(`div`,{className:`p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between`,children:[(0,V.jsx)(`h3`,{className:`font-bold text-sm text-neutral-900`,children:`Anúncios no Mercado de Revenda para Moderação`}),(0,V.jsxs)(`span`,{className:`text-xs text-neutral-500`,children:[A.length,` anúncios registados`]})]}),(0,V.jsx)(`div`,{className:`divide-y divide-neutral-100 overflow-x-auto text-xs`,children:A.map(e=>(0,V.jsxs)(`div`,{className:`p-3 sm:px-5 flex items-center justify-between gap-4`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-3 min-w-0`,children:[(0,V.jsx)(`img`,{src:e.imageUrl,alt:``,className:`w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0`}),(0,V.jsxs)(`div`,{className:`min-w-0`,children:[(0,V.jsx)(`h4`,{className:`font-bold text-neutral-900 truncate`,children:e.productName}),(0,V.jsxs)(`span`,{className:`text-[11px] text-neutral-500`,children:[`Vendedor: `,e.sellerName,` · Preço: `,F(e.listingPrice),` (Original: `,F(e.originalPrice),`)`]})]})]}),(0,V.jsx)(`div`,{className:`flex items-center gap-2`,children:(0,V.jsx)(`span`,{className:`px-2 py-0.5 rounded text-[10px] font-bold ${e.status===`ativo`?`bg-emerald-100 text-emerald-800`:`bg-neutral-200 text-neutral-800`}`,children:e.status===`ativo`?`Ativo`:e.status})})]},e.id))})]})]}),n===`produtos`&&(0,V.jsxs)(`div`,{className:`space-y-6`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`h2`,{className:`text-lg font-bold text-neutral-900`,children:`Catálogo do Mercado Oficial`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-500`,children:`O administrador define os preços oficiais fixos e o stock disponível para venda inicial.`})]}),(0,V.jsxs)(`button`,{onClick:j,className:`px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5`,children:[(0,V.jsx)(Ot,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Adicionar Novo Produto`})]})]}),f&&(0,V.jsxs)(`div`,{className:`p-6 bg-white rounded-2xl border border-amber-300 shadow-md space-y-4 animate-fadeIn`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between border-b border-neutral-100 pb-3`,children:[(0,V.jsx)(`h3`,{className:`font-bold text-base text-neutral-900`,children:u?`Editar Produto Oficial`:`Novo Produto Oficial`}),(0,V.jsx)(`button`,{onClick:()=>p(!1),className:`text-neutral-400 hover:text-neutral-700 font-bold text-xs`,children:`Fechar ✕`})]}),(0,V.jsxs)(`form`,{onSubmit:be,className:`grid grid-cols-1 md:grid-cols-2 gap-4 text-xs`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Nome do Produto:`}),(0,V.jsx)(`input`,{type:`text`,value:m,onChange:e=>h(e.target.value),required:!0,className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-medium`,placeholder:`Ex: Auscultadores Bluetooth Aurora`})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Marca:`}),(0,V.jsx)(`input`,{type:`text`,value:y,onChange:e=>b(e.target.value),required:!0,className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900`,placeholder:`Ex: Aurora Audio`})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Categoria:`}),(0,V.jsx)(`select`,{value:g,onChange:e=>v(e.target.value),className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900`,children:S.map(e=>(0,V.jsx)(`option`,{value:e.id,children:e.label},e.id))})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Tipo de Artigo:`}),(0,V.jsxs)(`select`,{value:ne,onChange:e=>O(e.target.value),className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900`,children:[(0,V.jsx)(`option`,{value:`fisico`,children:`Físico (Entrega ao domicílio em Angola)`}),(0,V.jsx)(`option`,{value:`digital`,children:`Digital (Download / Licença imediata)`})]})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Preço Oficial de Venda (Kz):`}),(0,V.jsx)(`input`,{type:`number`,value:x,onChange:e=>C(Number(e.target.value)),step:`500`,min:`500`,required:!0,className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-bold tabular-nums`}),(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400 mt-0.5 block`,children:`Todos os clientes pagarão exatamente este valor no Mercado Oficial.`})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Stock Disponível:`}),(0,V.jsx)(`input`,{type:`number`,value:w,onChange:e=>T(Number(e.target.value)),min:`0`,required:!0,className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-bold tabular-nums`})]}),(0,V.jsxs)(`div`,{className:`md:col-span-2`,children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`URL da Imagem do Produto:`}),(0,V.jsx)(`input`,{type:`text`,value:E,onChange:e=>D(e.target.value),required:!0,className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900`})]}),(0,V.jsxs)(`div`,{className:`md:col-span-2`,children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-700 block mb-1`,children:`Descrição Comercial:`}),(0,V.jsx)(`textarea`,{value:ee,onChange:e=>te(e.target.value),rows:3,required:!0,className:`w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900`,placeholder:`Especificações, detalhes técnicos e garantia...`})]}),re&&(0,V.jsx)(`div`,{className:`md:col-span-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200`,children:re}),(0,V.jsxs)(`div`,{className:`md:col-span-2 flex items-center justify-end gap-2 pt-2`,children:[(0,V.jsx)(`button`,{type:`button`,onClick:()=>p(!1),className:`px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-semibold`,children:`Cancelar`}),(0,V.jsx)(`button`,{type:`submit`,className:`px-5 py-2 bg-neutral-900 text-amber-400 hover:bg-neutral-800 rounded-lg font-bold shadow-xs transition-colors`,children:u?`Guardar Alterações`:`Adicionar ao Catálogo`})]})]})]}),(0,V.jsx)(`div`,{className:`bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs`,children:(0,V.jsx)(`div`,{className:`divide-y divide-neutral-100 overflow-x-auto text-xs`,children:k.map(e=>(0,V.jsxs)(`div`,{className:`p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-3 min-w-0`,children:[(0,V.jsx)(`img`,{src:e.imageUrl,alt:``,className:`w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0`}),(0,V.jsxs)(`div`,{className:`min-w-0`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`h4`,{className:`font-bold text-neutral-900 text-sm truncate`,children:e.name}),(0,V.jsxs)(`span`,{className:`text-[10px] text-neutral-400`,children:[`· `,e.brand]})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-3 text-neutral-500 mt-1`,children:[(0,V.jsxs)(`span`,{children:[`Stock: `,(0,V.jsxs)(`strong`,{className:`text-neutral-800`,children:[e.stock,` un.`]})]}),(0,V.jsx)(`span`,{children:`·`}),(0,V.jsxs)(`span`,{children:[`Tipo: `,(0,V.jsx)(`strong`,{className:`text-neutral-800`,children:e.type})]})]})]})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-4 shrink-0`,children:[(0,V.jsxs)(`div`,{className:`text-right`,children:[(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400 block uppercase font-semibold`,children:`Preço Oficial`}),(0,V.jsx)(`span`,{className:`text-base font-extrabold text-neutral-900 tabular-nums`,children:F(e.officialPrice)})]}),(0,V.jsx)(`button`,{onClick:()=>M(e),className:`p-2 border border-neutral-300 rounded-lg hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors`,title:`Editar preço e stock`,children:(0,V.jsx)(Tt,{className:`w-4 h-4`})})]})]},e.id))})})]}),n===`financeiro`&&(0,V.jsxs)(`div`,{className:`space-y-6`,children:[(0,V.jsxs)(`div`,{className:`bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs`,children:[(0,V.jsxs)(`div`,{className:`p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`h3`,{className:`font-bold text-sm text-neutral-900`,children:`Pedidos de Carregamento de Carteira`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-500`,children:`Validação e crédito de fundos dos utilizadores`})]}),(0,V.jsxs)(`span`,{className:`text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full`,children:[ce.filter(e=>e.status===`pendente`).length,` pendente`,ce.filter(e=>e.status===`pendente`).length===1?``:`s`]})]}),ce.length===0?(0,V.jsx)(`div`,{className:`p-8 text-center text-xs text-neutral-400`,children:`Nenhum carregamento solicitado recentemente.`}):(0,V.jsx)(`div`,{className:`divide-y divide-neutral-100 overflow-x-auto text-xs`,children:ce.map(e=>(0,V.jsxs)(`div`,{className:`p-4 flex items-center justify-between gap-4`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-900`,children:e.userName}),(0,V.jsx)(`span`,{className:`text-neutral-400`,children:`·`}),(0,V.jsx)(`span`,{className:`text-neutral-500`,children:e.method===`multicaixa_express`?`Multicaixa Express`:`Referência Bancária`})]}),(0,V.jsxs)(`div`,{className:`text-[11px] text-neutral-400 mt-0.5`,children:[`Contacto/Ref: `,e.phoneOrRef,` · Solicitado em: `,new Date(e.createdAt).toLocaleString(`pt-AO`)]})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,V.jsx)(`span`,{className:`text-sm font-black text-neutral-900 tabular-nums`,children:F(e.amount)}),e.status===`pendente`?(0,V.jsxs)(`button`,{onClick:()=>xe(e.id),className:`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1`,children:[(0,V.jsx)(it,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Aprovar & Creditar`})]}):(0,V.jsx)(`span`,{className:`text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200`,children:`✓ Aprovado`})]})]},e.id))})]}),(0,V.jsxs)(`div`,{className:`bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs`,children:[(0,V.jsxs)(`div`,{className:`p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`h3`,{className:`font-bold text-sm text-neutral-900`,children:`Pedidos de Levantamento para IBAN`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-500`,children:`Transferências bancárias e liquidação de saldo`})]}),(0,V.jsxs)(`span`,{className:`text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full`,children:[le.filter(e=>e.status===`solicitado`).length,` a aguardar`]})]}),le.length===0?(0,V.jsx)(`div`,{className:`p-8 text-center text-xs text-neutral-400`,children:`Nenhum pedido de levantamento pendente.`}):(0,V.jsx)(`div`,{className:`divide-y divide-neutral-100 overflow-x-auto text-xs`,children:le.map(e=>(0,V.jsxs)(`div`,{className:`p-4 flex items-center justify-between gap-4`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-900`,children:e.userName}),(0,V.jsx)(`span`,{className:`text-neutral-400`,children:`·`}),(0,V.jsx)(`span`,{className:`text-neutral-600`,children:e.bankName})]}),(0,V.jsxs)(`div`,{className:`text-[11px] text-neutral-500 font-mono mt-0.5`,children:[`IBAN: `,e.iban,` (Titular: `,e.accountHolder,`)`]})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,V.jsx)(`span`,{className:`text-sm font-black text-neutral-900 tabular-nums`,children:F(e.amount)}),e.status===`solicitado`?(0,V.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,V.jsx)(`button`,{onClick:()=>Se(e.id,`aprovar`),className:`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors`,children:`Confirmar Pagamento`}),(0,V.jsx)(`button`,{onClick:()=>Se(e.id,`recusar`),className:`px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors border border-red-200`,children:`Recusar`})]}):(0,V.jsx)(`span`,{className:`text-[11px] font-bold px-2.5 py-1 rounded-md ${e.status===`pago`?`bg-emerald-50 text-emerald-800`:`bg-red-50 text-red-800`}`,children:e.status===`pago`?`✓ Pago`:`Recusado`})]})]},e.id))})]})]}),n===`utilizadores`&&(0,V.jsxs)(`div`,{className:`bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs`,children:[(0,V.jsxs)(`div`,{className:`p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50`,children:[(0,V.jsx)(`h3`,{className:`font-bold text-sm text-neutral-900`,children:`Utilizadores Registados na BABA SHOPPING`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-500`,children:`Contas de clientes e administradores em Angola`})]}),(0,V.jsx)(`div`,{className:`divide-y divide-neutral-100 overflow-x-auto text-xs`,children:se.map(e=>{let t=fe[e.id];return(0,V.jsxs)(`div`,{className:`p-4 flex items-center justify-between gap-4`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-900 text-sm`,children:e.name}),(0,V.jsx)(`span`,{className:`text-[10px] font-bold px-2 py-0.5 rounded ${e.role===`admin`?`bg-amber-100 text-amber-900`:`bg-neutral-100 text-neutral-700`}`,children:e.role===`admin`?`Administrador`:`Cliente`})]}),(0,V.jsxs)(`div`,{className:`text-[11px] text-neutral-500 mt-0.5`,children:[e.email,` · `,e.phone,` · `,e.city,`, `,e.province]})]}),(0,V.jsxs)(`div`,{className:`text-right`,children:[(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400 block uppercase font-semibold`,children:`Saldo Atual`}),(0,V.jsx)(`span`,{className:`font-extrabold text-neutral-900 tabular-nums`,children:F(t?.availableBalance||0)})]})]},e.id)})})]}),i&&(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full p-5 overflow-hidden shadow-2xl`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between pb-3 border-b border-neutral-800 mb-4`,children:[(0,V.jsxs)(`h4`,{className:`font-bold text-sm text-white flex items-center gap-2`,children:[(0,V.jsx)(mt,{className:`w-4 h-4 text-amber-400`}),(0,V.jsx)(`span`,{children:i.title})]}),(0,V.jsx)(`button`,{onClick:()=>a(null),className:`p-1.5 text-neutral-400 hover:text-white rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]}),(0,V.jsx)(`div`,{className:`max-h-[75vh] flex items-center justify-center bg-black/60 rounded-2xl p-4 overflow-auto border border-neutral-800`,children:(0,V.jsx)(`img`,{src:i.src,alt:``,className:`max-w-full max-h-[70vh] object-contain rounded-xl`})}),(0,V.jsx)(`div`,{className:`pt-3 flex justify-end`,children:(0,V.jsx)(`button`,{onClick:()=>a(null),className:`px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl`,children:`Concluir Inspeção`})})]})}),o&&(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between border-b border-neutral-100 pb-3`,children:[(0,V.jsxs)(`h4`,{className:`font-bold text-sm text-neutral-900 flex items-center gap-2`,children:[(0,V.jsx)(st,{className:`w-4 h-4 text-red-600`}),(0,V.jsx)(`span`,{children:`Rejeitar Bilhete de Identidade`})]}),(0,V.jsx)(`button`,{onClick:()=>s(null),className:`text-neutral-400 hover:text-neutral-700`,children:`✕`})]}),(0,V.jsxs)(`p`,{className:`text-xs text-neutral-600`,children:[`Indica o motivo pelo qual o documento de `,(0,V.jsx)(`strong`,{children:o.name}),` (BI: `,o.idNumber,`) foi recusado:`]}),(0,V.jsx)(`textarea`,{value:c,onChange:e=>l(e.target.value),rows:3,required:!0,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`,placeholder:`Ex: Fotografia do verso ilegível, nome no formulário divergente do bilhete...`}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2 pt-2`,children:[(0,V.jsx)(`button`,{type:`button`,onClick:()=>s(null),className:`flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-semibold text-xs rounded-xl hover:bg-neutral-50`,children:`Cancelar`}),(0,V.jsx)(`button`,{type:`button`,onClick:()=>{try{de(o.id,c),s(null)}catch(e){showAppNotice(e.message, 'error')}},className:`flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors`,children:`Confirmar Rejeição`})]})]})})]})},fn=({isOpen:e,onClose:t,notifications:n,userId:r,onNavigate:i})=>{if(!e)return null;let a=n.filter(e=>!e.read).length,o=e=>{Ie(e.id),e.linkType===`negociacao`?i(`meus_produtos`,e.linkId):e.linkType===`produto`?i(`revenda`,e.linkId):e.linkType===`carteira`?i(`carteira`):e.linkType===`admin`?i(`admin`):null,t()},s=e=>{switch(e){case`negociacao`:return(0,V.jsx)(wt,{className:`w-4 h-4 text-amber-500`});case`venda`:return(0,V.jsx)(Bt,{className:`w-4 h-4 text-emerald-600`});case`compra`:return(0,V.jsx)(z,{className:`w-4 h-4 text-blue-500`});case`carteira`:return(0,V.jsx)(rt,{className:`w-4 h-4 text-emerald-500`});default:return(0,V.jsx)($e,{className:`w-4 h-4 text-neutral-500`})}};return(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200`,children:[(0,V.jsxs)(`div`,{className:`p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,V.jsx)($e,{className:`w-5 h-5 text-amber-500`}),(0,V.jsx)(`h2`,{className:`font-bold text-neutral-900 text-base`,children:`Notificações`}),a>0&&(0,V.jsxs)(`span`,{className:`text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full`,children:[a,` nova`,a>1?`s`:``]})]}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[a>0&&(0,V.jsx)(`button`,{onClick:()=>Le(r),className:`text-xs text-amber-600 hover:text-amber-700 font-semibold`,children:`Marcar lidas`}),(0,V.jsx)(`button`,{onClick:t,className:`p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]})]}),(0,V.jsx)(`div`,{className:`flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-neutral-100`,children:n.length===0?(0,V.jsxs)(`div`,{className:`h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400`,children:[(0,V.jsx)($e,{className:`w-12 h-12 stroke-1 text-neutral-300 mb-2`}),(0,V.jsx)(`p`,{className:`text-sm font-medium text-neutral-600`,children:`Sem notificações no momento`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-400 mt-1`,children:`Todas as atualizações de negociações, vendas e carteira aparecerão aqui.`})]}):n.map(e=>(0,V.jsx)(`div`,{onClick:()=>o(e),className:`pt-2.5 pb-2 px-3 rounded-lg cursor-pointer transition-colors ${e.read?`hover:bg-neutral-50`:`bg-amber-50/60 hover:bg-amber-50`}`,children:(0,V.jsxs)(`div`,{className:`flex items-start gap-3`,children:[(0,V.jsx)(`div`,{className:`p-2 rounded-lg bg-white border border-neutral-200 shrink-0 mt-0.5`,children:s(e.type)}),(0,V.jsxs)(`div`,{className:`flex-1 min-w-0`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between gap-2`,children:[(0,V.jsx)(`h4`,{className:`text-xs ${e.read?`font-medium text-neutral-700`:`font-bold text-neutral-900`}`,children:e.title}),(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400 whitespace-nowrap`,children:new Date(e.createdAt).toLocaleTimeString(`pt-AO`,{hour:`2-digit`,minute:`2-digit`})})]}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-600 mt-0.5 line-clamp-2`,children:e.message}),e.linkType&&(0,V.jsxs)(`div`,{className:`flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-1.5`,children:[(0,V.jsx)(`span`,{children:`Ver detalhes`}),(0,V.jsx)(Ye,{className:`w-3 h-3`})]})]})]})},e.id))})]})})},pn=({isOpen:e,onClose:t,items:n,onUpdateQuantity:r,onRemoveItem:i,onClearCart:a,currentUser:o,wallet:s,onSuccessOrder:c,onTopUpWallet:l,onNotice})=>{let[u,d]=(0,_.useState)(!1),[f,p]=(0,_.useState)(null);if(!e)return null;let m=n.reduce((e,t)=>e+t.quantity,0),h=n.reduce((e,t)=>e+t.price*t.quantity,0),g=h,v=s.availableBalance>=g,y=g-s.availableBalance;return(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200`,onClick:e=>e.stopPropagation(),children:[(0,V.jsxs)(`div`,{className:`p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-2.5`,children:[(0,V.jsx)(`div`,{className:`w-8 h-8 rounded-lg bg-[#FF6A00] flex items-center justify-center text-white`,children:(0,V.jsx)(z,{className:`w-4 h-4`})}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`h2`,{className:`font-extrabold text-white text-base leading-tight`,children:`Carrinho de Compras`}),(0,V.jsxs)(`span`,{className:`text-[11px] text-neutral-400 font-medium`,children:[m,` `,m===1?`artigo selecionado`:`artigos selecionados`]})]})]}),(0,V.jsx)(`button`,{onClick:t,className:`p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer`,title:`Fechar carrinho`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]}),n.length===0?(0,V.jsxs)(`div`,{className:`flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400`,children:[(0,V.jsx)(`div`,{className:`w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-3`,children:(0,V.jsx)(z,{className:`w-10 h-10 stroke-1 text-neutral-400`})}),(0,V.jsx)(`p`,{className:`text-base font-extrabold text-neutral-800`,children:`O teu carrinho está vazio`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-500 mt-1.5 max-w-xs leading-relaxed`,children:`Explora o catálogo com mais de 200 produtos oficiais, compra com o saldo da tua carteira e revende com lucro na plataforma.`}),(0,V.jsx)(`button`,{onClick:t,className:`mt-6 px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] text-white text-xs font-bold rounded-xl shadow-md hover:from-[#FF5000] hover:to-[#E03A00] transition-all cursor-pointer`,children:`Explorar Catálogo de Produtos`})]}):(0,V.jsxs)(`div`,{className:`flex-1 overflow-y-auto p-4 space-y-4`,children:[(0,V.jsxs)(`div`,{className:`p-3 rounded-xl bg-orange-50 border border-orange-200 text-neutral-800 space-y-1.5`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-1.5 font-bold text-xs text-[#FF6A00]`,children:[(0,V.jsx)(Ht,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Compra & Revenda 100% na Plataforma`})]}),(0,V.jsxs)(`p`,{className:`text-[11px] text-neutral-700 leading-relaxed`,children:[`Ao confirmares a compra, os artigos são adicionados imediatamente ao teu inventário em `,(0,V.jsx)(`strong`,{children:`Meus Produtos`}),`, onde poderás clicar no botão `,(0,V.jsx)(`strong`,{children:`Revender`}),` e definir a tua margem de lucro.`]})]}),(0,V.jsx)(`div`,{className:`space-y-3`,children:n.map(e=>{let t=e.price*e.quantity;return(0,V.jsxs)(`div`,{className:`flex gap-3 p-3 rounded-2xl border border-neutral-200 bg-white shadow-2xs hover:border-[#FF6A00]/40 transition-colors`,children:[(0,V.jsx)(`img`,{src:e.imageUrl,alt:e.name,referrerPolicy:`no-referrer`,onError:e=>{e.currentTarget.onerror=null;e.currentTarget.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';},className:`w-18 h-18 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-100`}),(0,V.jsxs)(`div`,{className:`flex-1 min-w-0 flex flex-col justify-between`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`h4`,{className:`text-xs font-bold text-neutral-900 line-clamp-2 leading-snug`,children:e.name}),(0,V.jsxs)(`p`,{className:`text-xs font-black text-[#FF6A00] mt-1 tabular-nums`,children:[F(e.price),e.quantity>1&&(0,V.jsxs)(`span`,{className:`text-[10px] text-neutral-500 font-normal ml-1`,children:[`(Subtotal: `,F(t),`)`]})]})]}),(0,V.jsxs)(`div`,{className:`flex items-center justify-between mt-2 pt-1 border-t border-neutral-100`,children:[(0,V.jsxs)(`div`,{className:`flex items-center border border-neutral-200 rounded-lg bg-neutral-50 text-xs overflow-hidden`,children:[(0,V.jsx)(`button`,{onClick:()=>r(e.id,-1),className:`px-2.5 py-1 text-neutral-700 hover:bg-neutral-200 font-bold transition-colors cursor-pointer`,title:`Diminuir quantidade`,children:`-`}),(0,V.jsx)(`span`,{className:`px-3 font-extrabold text-neutral-900 tabular-nums`,children:e.quantity}),(0,V.jsx)(`button`,{onClick:()=>r(e.id,1),className:`px-2.5 py-1 text-neutral-700 hover:bg-neutral-200 font-bold transition-colors cursor-pointer`,title:`Aumentar quantidade`,children:`+`})]}),(0,V.jsx)(`button`,{onClick:()=>i(e.id),className:`text-neutral-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer`,title:`Remover do carrinho`,children:(0,V.jsx)(Vt,{className:`w-4 h-4`})})]})]})]},e.id)})}),(0,V.jsxs)(`div`,{className:`p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2.5`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between text-xs`,children:[(0,V.jsxs)(`span`,{className:`flex items-center gap-1.5 text-neutral-600 font-bold`,children:[(0,V.jsx)(Jt,{className:`w-4 h-4 text-[#FF6A00]`}),(0,V.jsx)(`span`,{children:`Saldo Disponível na Carteira`})]}),(0,V.jsx)(`span`,{className:`font-black text-neutral-950 tabular-nums text-sm`,children:F(s.availableBalance)})]})]}),f&&(0,V.jsx)(`div`,{className:`p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 font-medium`,children:f})]}),n.length>0&&(0,V.jsxs)(`div`,{className:`p-4 border-t border-neutral-200 bg-white space-y-3 shrink-0 shadow-lg`,children:[(0,V.jsxs)(`div`,{className:`space-y-1.5 text-xs`,children:[(0,V.jsxs)(`div`,{className:`flex justify-between text-neutral-600`,children:[(0,V.jsxs)(`span`,{children:[`Subtotal (`,m,` itens)`]}),(0,V.jsx)(`span`,{className:`font-bold text-neutral-900 tabular-nums`,children:F(h)})]}),(0,V.jsxs)(`div`,{className:`flex justify-between text-base font-black text-neutral-950 pt-2 border-t border-neutral-100`,children:[(0,V.jsx)(`span`,{children:`Total a Pagar`}),(0,V.jsx)(`span`,{className:`text-[#FF6A00] tabular-nums text-lg`,children:F(g)})]})]}),!v&&(0,V.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs flex items-center justify-between gap-2`,children:[(0,V.jsxs)(`span`,{className:`text-red-700 font-bold`,children:[`Saldo insuficiente: faltam `,F(y)]}),(0,V.jsx)(`button`,{type:`button`,onClick:()=>{t();l&&l();},className:`px-2.5 py-1 rounded-lg bg-[#FF6A00] text-white font-black text-[11px] shrink-0 cursor-pointer`,children:`Carregar Carteira`})]}),(0,V.jsxs)(`button`,{onClick:()=>{if(p(null),n.length===0)p(`O teu carrinho está vazio.`);else if(!v){t();if(onNotice){onNotice({type:'insufficient_funds',productName:n.length===1?n[0].name:`${n.length} Artigos no Carrinho`,price:g,availableBalance:s.availableBalance,product:n[0]});}}else{d(!0);try{
  let lastId = '';
  for (let it of n) {
    if (it.source === 'oficial') lastId = Ae(o.id, it.id, it.quantity).order.id;
    else if (it.source === 'revenda') lastId = je(it.id, o.id, it.price).id;
  }
  a();
  t();
  c(n.length === 1 ? n[0].name : `${n.length} Artigos`);
}catch(err: any){p(err.message||'Falha ao processar a compra na plataforma.')}finally{d(!1)}}},disabled:u,className:`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${!u?`bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white cursor-pointer active:scale-98 shadow-orange-600/30`:`bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300`}`,children:[(0,V.jsx)(R,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:u?`A processar pagamento...`:`Finalizar Compra / Pagar com Carteira`})]}),(0,V.jsxs)(`div`,{className:`flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-semibold`,children:[(0,V.jsx)(ct,{className:`w-3.5 h-3.5 text-emerald-600`}),(0,V.jsx)(`span`,{children:`Titularidade transferida imediatamente para "Meus Produtos"`})]})]})]})})},mn=({isOpen:e,onClose:t,currentUser:n,onUserChanged:r})=>{let[i,a]=(0,_.useState)(`switch`),[o,s]=(0,_.useState)(``),[c,l]=(0,_.useState)(``),[u,d]=(0,_.useState)(`+244 9`),[f,p]=(0,_.useState)(`Luanda`),[m,h]=(0,_.useState)(`Luanda (Talatona)`),[g,v]=(0,_.useState)(``),[y,b]=(0,_.useState)(`1998-05-15`),[x,S]=(0,_.useState)(``),[C,w]=(0,_.useState)(``),[T,E]=(0,_.useState)(!1),[D,ee]=(0,_.useState)(null);if(!e)return null;let te=oe(),O=e=>{r(ce(e)),t()},re=(e,t)=>{let n=e.target.files?.[0];if(n){let e=new FileReader;e.onload=()=>{typeof e.result==`string`&&(t===`front`?S(e.result):w(e.result))},e.readAsDataURL(n)}};return(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn`,children:(0,V.jsxs)(`div`,{className:`bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-6`,children:[(0,V.jsxs)(`div`,{className:`p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between`,children:[(0,V.jsx)($t,{size:`sm`,theme:`dark`}),(0,V.jsx)(`button`,{onClick:t,className:`p-1 text-neutral-400 hover:text-white rounded-lg transition-colors`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]}),(0,V.jsxs)(`div`,{className:`flex border-b border-neutral-200 bg-neutral-50 text-xs font-bold`,children:[(0,V.jsxs)(`button`,{onClick:()=>a(`switch`),className:`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${i===`switch`?`bg-white text-neutral-900 border-b-2 border-amber-500`:`text-neutral-500 hover:text-neutral-800`}`,children:[(0,V.jsx)(B,{className:`w-4 h-4 text-amber-500`}),(0,V.jsx)(`span`,{children:`Contas / Iniciar Sessão`})]}),(0,V.jsxs)(`button`,{onClick:()=>a(`register`),className:`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${i===`register`?`bg-white text-neutral-900 border-b-2 border-amber-500`:`text-neutral-500 hover:text-neutral-800`}`,children:[(0,V.jsx)(Gt,{className:`w-4 h-4 text-amber-500`}),(0,V.jsx)(`span`,{children:`Criar Conta com BI`})]})]}),i===`switch`&&(0,V.jsxs)(`div`,{className:`p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto`,children:[(0,V.jsxs)(`div`,{className:`space-y-1`,children:[(0,V.jsx)(`h4`,{className:`text-sm font-bold text-neutral-900`,children:`Seleciona a Conta para Aceder`}),(0,V.jsx)(`p`,{className:`text-xs text-neutral-500 leading-relaxed`,children:`Alterna entre o Administrador (para validar bilhetes e stock) e clientes para comprar e revender.`})]}),(0,V.jsx)(`div`,{className:`space-y-2.5`,children:te.map(e=>{let t=e.id===n.id,r=N(e.id),i=e.accountStatus===`em_processamento`;return(0,V.jsxs)(`button`,{onClick:()=>O(e.id),className:`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${t?`bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-xs`:`bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50`}`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-3 min-w-0`,children:[(0,V.jsx)(`div`,{className:`w-10 h-10 rounded-full bg-neutral-900 text-amber-400 font-bold flex items-center justify-center shrink-0`,children:e.name.charAt(0)}),(0,V.jsxs)(`div`,{className:`min-w-0`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,V.jsx)(`h4`,{className:`text-xs font-bold text-neutral-900 truncate`,children:e.name}),e.role===`admin`?(0,V.jsx)(`span`,{className:`text-[9px] bg-amber-400 text-neutral-950 font-black px-1.5 py-0.5 rounded`,children:`ADMIN`}):i?(0,V.jsxs)(`span`,{className:`text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1`,children:[(0,V.jsx)(ut,{className:`w-2.5 h-2.5`}),` EM PROCESSAMENTO`]}):(0,V.jsx)(`span`,{className:`text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded`,children:`BI VERIFICADO`})]}),(0,V.jsxs)(`div`,{className:`text-[11px] text-neutral-500 truncate mt-0.5`,children:[`BI: `,(0,V.jsx)(`strong`,{className:`text-neutral-700 font-mono`,children:e.idNumber}),` · `,e.city]})]})]}),(0,V.jsxs)(`div`,{className:`text-right shrink-0`,children:[(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400 block uppercase font-semibold`,children:`Saldo`}),(0,V.jsx)(`span`,{className:`text-xs font-black text-neutral-900 tabular-nums`,children:F(r.availableBalance)})]})]},e.id)})}),(0,V.jsxs)(`div`,{className:`p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 space-y-1.5`,children:[(0,V.jsxs)(`div`,{className:`flex items-center gap-1.5 font-bold text-neutral-800`,children:[(0,V.jsx)(R,{className:`w-4 h-4 text-amber-500`}),(0,V.jsx)(`span`,{children:`Fluxo de Conformidade do Bilhete de Identidade:`})]}),(0,V.jsxs)(`p`,{className:`text-[11px] leading-relaxed text-neutral-500`,children:[`Para testar a validação do BI: cria uma nova conta na aba ao lado (que ficará em processamento) ou clica no utilizador `,(0,V.jsx)(`strong`,{children:`António Kwanza`}),`. Depois troca para a conta do `,(0,V.jsx)(`strong`,{children:`Administrador`}),` para rever o documento frente/verso e aprovar a ativação!`]})]})]}),i===`register`&&(0,V.jsxs)(`form`,{onSubmit:e=>{if(e.preventDefault(),ee(null),!o.trim()||!c.trim()||!u.trim()||!g.trim())ee(`Preenche todos os campos obrigatórios, incluindo o Nº do Bilhete de Identidade.`);else if(!x||!C)ee(`Deves anexar a fotografia da FRENTE e do VERSO do Bilhete de Identidade.`);else{E(!0);try{r(le(o.trim(),c.trim(),u.trim(),f,m.trim(),g.trim().toUpperCase(),y,x,C)),t()}catch(e){ee(e.message||`Erro ao criar conta.`)}finally{E(!1)}}},className:`p-5 sm:p-6 space-y-4 text-xs max-h-[78vh] overflow-y-auto`,children:[(0,V.jsxs)(`div`,{className:`p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5`,children:[(0,V.jsx)(R,{className:`w-5 h-5 text-amber-600 shrink-0 mt-0.5`}),(0,V.jsxs)(`div`,{className:`space-y-0.5`,children:[(0,V.jsx)(`span`,{className:`font-bold block`,children:`Verificação Obrigatória de Identidade (Angola)`}),(0,V.jsx)(`p`,{className:`text-[11px] text-amber-800 leading-relaxed`,children:`Insere os dados reais conforme o teu Bilhete de Identidade de Cidadão Nacional. A tua conta entrará em processamento e será validada pela administração da BABA SHOPPING antes da ativação.`})]})]}),(0,V.jsxs)(`div`,{className:`space-y-3`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Nome Completo (conforme o BI): *`}),(0,V.jsx)(`input`,{type:`text`,value:o,onChange:e=>s(e.target.value),required:!0,placeholder:`Ex: Domingos Manuel da Silva`,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500`})]}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-3`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Nº do Bilhete de Identidade (BI): *`}),(0,V.jsx)(`input`,{type:`text`,value:g,onChange:e=>v(e.target.value.toUpperCase()),required:!0,placeholder:`Ex: 007294812LA041`,maxLength:14,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500`})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Data de Nascimento: *`}),(0,V.jsx)(`input`,{type:`date`,value:y,onChange:e=>b(e.target.value),required:!0,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500`})]})]}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-3`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Província de Residência: *`}),(0,V.jsx)(`select`,{value:f,onChange:e=>p(e.target.value),className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500`,children:ne.map(e=>(0,V.jsx)(`option`,{value:e,children:e},e))})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Município / Bairro: *`}),(0,V.jsx)(`input`,{type:`text`,value:m,onChange:e=>h(e.target.value),required:!0,placeholder:`Ex: Talatona, Bairro Benfica`,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500`})]})]}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-3`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Telemóvel (+244): *`}),(0,V.jsx)(`input`,{type:`text`,value:u,onChange:e=>d(e.target.value),required:!0,placeholder:`+244 9xx xxx xxx`,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500`})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`font-bold text-neutral-800 block mb-1`,children:`Endereço de Email: *`}),(0,V.jsx)(`input`,{type:`email`,value:c,onChange:e=>l(e.target.value),required:!0,placeholder:`nome@exemplo.ao`,className:`w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500`})]})]}),(0,V.jsxs)(`div`,{className:`pt-2 border-t border-neutral-200 space-y-3`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,V.jsxs)(`span`,{className:`font-bold text-xs text-neutral-900 flex items-center gap-1.5`,children:[(0,V.jsx)(mt,{className:`w-4 h-4 text-amber-500`}),(0,V.jsx)(`span`,{children:`Fotografias do Bilhete de Identidade (Frente e Verso): *`})]}),(0,V.jsxs)(`button`,{type:`button`,onClick:()=>{let e=`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="%23f7f9fa" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="360" height="40" rx="8" fill="%231e293b"/><text x="200" y="38" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23f59e0b" text-anchor="middle">REPÚBLICA DE ANGOLA</text><text x="200" y="52" font-family="sans-serif" font-size="9" fill="%23ffffff" text-anchor="middle">BILHETE DE IDENTIDADE DE CIDADÃO NACIONAL</text><rect x="30" y="80" width="85" height="110" rx="8" fill="%23e2e8f0" stroke="%2394a3b8"/><text x="72" y="140" font-family="sans-serif" font-size="10" fill="%2364748b" text-anchor="middle">FOTO TITULAR</text><text x="135" y="95" font-family="sans-serif" font-size="9" fill="%2364748b">NOME COMPLETO:</text><text x="135" y="112" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">${o.toUpperCase()||`CIDADÃO ANGOLANO`}</text><text x="135" y="135" font-family="sans-serif" font-size="9" fill="%2364748b">Nº DO BILHETE (BI):</text><text x="135" y="152" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23b45309">${g||`008912341LA099`}</text><text x="135" y="175" font-family="sans-serif" font-size="9" fill="%2364748b">DATA NASC / NATURALIDADE:</text><text x="135" y="190" font-family="sans-serif" font-size="10" font-weight="semibold" fill="%23334155">${y} · ${f.toUpperCase()}</text><rect x="20" y="210" width="360" height="25" rx="4" fill="%23e2e8f0"/><text x="200" y="226" font-family="monospace" font-size="10" fill="%23475569" text-anchor="middle">IDAGO${g||`008912341LA099`}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text></svg>`,t=`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="%23f1f5f9" stroke="%23cbd5e1" stroke-width="2"/><text x="30" y="45" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23475569">FILIAÇÃO E RESIDÊNCIA (VERSO DO BI):</text><text x="30" y="70" font-family="sans-serif" font-size="9" fill="%2364748b">PAI: MANUEL ANTÓNIO</text><text x="30" y="90" font-family="sans-serif" font-size="9" fill="%2364748b">MÃE: MARIA SEBASTIÃO</text><text x="30" y="110" font-family="sans-serif" font-size="9" fill="%2364748b">RESIDÊNCIA: ${m.toUpperCase()}, ${f.toUpperCase()}</text><text x="30" y="130" font-family="sans-serif" font-size="9" fill="%2364748b">EMISSÃO / VALIDADE: 2024 A 2034</text><rect x="30" y="155" width="340" height="65" fill="%23334155" rx="6"/><text x="200" y="190" font-family="monospace" font-size="11" fill="%2338bdf8" text-anchor="middle">||| | ||||| |||| || |||||| |||||||||| ||||||</text><text x="200" y="206" font-family="sans-serif" font-size="8" fill="%2394a3b8" text-anchor="middle">CÓDIGO DE BARRAS DE SEGURANÇA NACIONAL</text></svg>`;S(e),w(t)},className:`text-[11px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1`,children:[(0,V.jsx)(Lt,{className:`w-3 h-3`}),(0,V.jsx)(`span`,{children:`Preencher BI de Exemplo`})]})]}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-3`,children:[(0,V.jsxs)(`div`,{className:`border border-neutral-300 rounded-2xl p-3 bg-neutral-50 text-center space-y-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-700 block text-[11px]`,children:`1. Foto da FRENTE do BI`}),x?(0,V.jsxs)(`div`,{className:`relative rounded-xl overflow-hidden aspect-16/10 bg-white border border-neutral-200`,children:[(0,V.jsx)(`img`,{src:x,alt:`Frente BI`,className:`w-full h-full object-contain`}),(0,V.jsx)(`button`,{type:`button`,onClick:()=>S(``),className:`absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md text-[10px]`,children:`Trocar`})]}):(0,V.jsxs)(`label`,{className:`cursor-pointer border-2 border-dashed border-neutral-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-neutral-100 transition-colors`,children:[(0,V.jsx)(Wt,{className:`w-6 h-6 text-neutral-400 mb-1`}),(0,V.jsx)(`span`,{className:`text-[11px] font-semibold text-neutral-700`,children:`Carregar Frente`}),(0,V.jsx)(`span`,{className:`text-[9px] text-neutral-400 mt-0.5`,children:`PNG, JPG ou câmara`}),(0,V.jsx)(`input`,{type:`file`,accept:`image/*`,onChange:e=>re(e,`front`),className:`hidden`})]})]}),(0,V.jsxs)(`div`,{className:`border border-neutral-300 rounded-2xl p-3 bg-neutral-50 text-center space-y-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-700 block text-[11px]`,children:`2. Foto do VERSO do BI`}),C?(0,V.jsxs)(`div`,{className:`relative rounded-xl overflow-hidden aspect-16/10 bg-white border border-neutral-200`,children:[(0,V.jsx)(`img`,{src:C,alt:`Verso BI`,className:`w-full h-full object-contain`}),(0,V.jsx)(`button`,{type:`button`,onClick:()=>w(``),className:`absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md text-[10px]`,children:`Trocar`})]}):(0,V.jsxs)(`label`,{className:`cursor-pointer border-2 border-dashed border-neutral-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-neutral-100 transition-colors`,children:[(0,V.jsx)(Wt,{className:`w-6 h-6 text-neutral-400 mb-1`}),(0,V.jsx)(`span`,{className:`text-[11px] font-semibold text-neutral-700`,children:`Carregar Verso`}),(0,V.jsx)(`span`,{className:`text-[9px] text-neutral-400 mt-0.5`,children:`PNG, JPG ou câmara`}),(0,V.jsx)(`input`,{type:`file`,accept:`image/*`,onChange:e=>re(e,`back`),className:`hidden`})]})]})]})]})]}),D&&(0,V.jsxs)(`div`,{className:`p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2`,children:[(0,V.jsx)(st,{className:`w-4 h-4 shrink-0`}),(0,V.jsx)(`span`,{children:D})]}),(0,V.jsxs)(`div`,{className:`pt-2`,children:[(0,V.jsxs)(`button`,{type:`submit`,disabled:T,className:`w-full py-3 bg-neutral-900 text-amber-400 hover:bg-neutral-800 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2`,children:[(0,V.jsx)(R,{className:`w-4 h-4 text-amber-400`}),(0,V.jsx)(`span`,{children:T?`A submeter dados...`:`Submeter Criação de Conta para Análise`})]}),(0,V.jsx)(`p`,{className:`text-[10px] text-center text-neutral-400 mt-2`,children:`A tua conta será aberta em modo de processamento até aprovação pelo administrador.`})]})]})]})})},hn=({user:e,onSwitchUser:t,onAdminDirectLogin:n,onRefreshStatus:r})=>{let[i,a]=(0,_.useState)(null),[o,s]=(0,_.useState)(!1),[c,l]=(0,_.useState)(e.idCardFront||``),[u,d]=(0,_.useState)(e.idCardBack||``),[f,p]=(0,_.useState)(e.idNumber||``),[m,h]=(0,_.useState)(null),g=e.accountStatus===`rejeitado`,v=(e,t)=>{let n=e.target.files?.[0];if(n){compressImageToDataUrl(n).then(url=>{t===`front`?l(url):d(url)}).catch(()=>h(`Erro ao processar fotografia do BI.`))}};return(0,V.jsxs)(`div`,{className:`min-h-screen bg-[#0C0D12] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8`,children:[(0,V.jsxs)(`header`,{className:`max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-neutral-800`,children:[(0,V.jsx)($t,{size:`md`}),(0,V.jsxs)(`div`,{className:`flex items-center gap-2`,children:[n&&(0,V.jsxs)(`button`,{onClick:n,className:`text-xs font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm transition-colors`,children:[(0,V.jsx)(vt,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Aceder como Administrador`})]}),(0,V.jsxs)(`button`,{onClick:t,className:`text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors`,children:[(0,V.jsx)(St,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Alternar Conta`})]})]})]}),(0,V.jsxs)(`main`,{className:`max-w-3xl mx-auto w-full my-8 bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-md`,children:[(0,V.jsxs)(`div`,{className:`text-center space-y-3`,children:[(0,V.jsx)(`div`,{className:`w-20 h-20 mx-auto rounded-3xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner`,children:g?(0,V.jsx)(st,{className:`w-10 h-10 text-red-400`}):(0,V.jsx)(ut,{className:`w-10 h-10 animate-pulse text-amber-400`})}),(0,V.jsxs)(`div`,{className:`space-y-1`,children:[(0,V.jsx)(`span`,{className:`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block ${g?`bg-red-500/20 text-red-400 border border-red-500/30`:`bg-amber-400/20 text-amber-400 border border-amber-400/30`}`,children:g?`Registo Não Aprovado`:`Criação de Conta em Processamento`}),(0,V.jsx)(`h1`,{className:`text-2xl sm:text-3xl font-black text-white tracking-tight mt-2`,children:g?`Validação de Documento Recusada`:`Aguardando Verificação do Bilhete de Identidade`}),(0,V.jsx)(`p`,{className:`text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed`,children:g?e.rejectionReason||`Os dados ou fotos do Bilhete de Identidade apresentados não puderam ser validados pelo Administrador. Podes reenviar novas fotografias abaixo.`:`A tua conta não abre imediatamente. Conforme as regras da BABA SHOPPING em Angola, todos os dados e as fotos do Bilhete de Identidade (Frente e Verso) são enviados para o painel do Administrador para conferência antes da ativação definitiva.`})]})]}),!g&&(0,V.jsxs)(`div`,{className:`bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800 space-y-3`,children:[(0,V.jsx)(`span`,{className:`text-[10px] uppercase font-bold text-neutral-400 block tracking-wider`,children:`Fluxo Obrigatório de Validação de Identidade (Angola)`}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs`,children:[(0,V.jsxs)(`div`,{className:`flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800`,children:[(0,V.jsx)(ct,{className:`w-4 h-4 text-emerald-400 shrink-0 mt-0.5`}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`font-bold text-white block`,children:`1. Registo & Upload do BI`}),(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-400`,children:`Dados e fotos submetidos`})]})]}),(0,V.jsxs)(`div`,{className:`flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30`,children:[(0,V.jsx)(ut,{className:`w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin`}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`font-bold text-amber-300 block`,children:`2. Em Análise no Painel Adm`}),(0,V.jsx)(`span`,{className:`text-[10px] text-amber-300/80`,children:`Conferência frente & verso`})]})]}),(0,V.jsxs)(`div`,{className:`flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 opacity-60`,children:[(0,V.jsx)(R,{className:`w-4 h-4 text-neutral-400 shrink-0 mt-0.5`}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-300 block`,children:`3. Ativação da Conta`}),(0,V.jsx)(`span`,{className:`text-[10px] text-neutral-500`,children:`Carteira & Revenda ativadas`})]})]})]})]}),(0,V.jsxs)(`div`,{className:`bg-neutral-950/80 rounded-2xl border border-neutral-800 p-5 space-y-4`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between border-b border-neutral-800 pb-3`,children:[(0,V.jsxs)(`h3`,{className:`font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2`,children:[(0,V.jsx)(mt,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Dossier de Identificação Submetido`})]}),(0,V.jsxs)(`span`,{className:`text-[11px] text-neutral-500 font-mono`,children:[`Registo #`,e.id.replace(`usr_`,``)]})]}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs`,children:[(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`text-neutral-500 text-[11px] block`,children:`Nome Completo:`}),(0,V.jsx)(`strong`,{className:`text-white text-sm`,children:e.name})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`text-neutral-500 text-[11px] block`,children:`Nº do Bilhete de Identidade (BI):`}),(0,V.jsx)(`strong`,{className:`text-amber-400 text-sm font-mono tracking-wide`,children:e.idNumber})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`text-neutral-500 text-[11px] block`,children:`Contacto & Email:`}),(0,V.jsxs)(`span`,{className:`text-neutral-300`,children:[e.phone,` · `,e.email]})]}),(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`span`,{className:`text-neutral-500 text-[11px] block`,children:`Residência em Angola:`}),(0,V.jsxs)(`span`,{className:`text-neutral-300`,children:[e.city,`, `,e.province]})]})]}),(0,V.jsxs)(`div`,{className:`pt-3 border-t border-neutral-800 space-y-2`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,V.jsx)(`span`,{className:`text-[11px] font-bold text-neutral-400`,children:`Fotografias do Bilhete de Identidade Submetidas:`}),g&&!o&&(0,V.jsxs)(`button`,{type:`button`,onClick:()=>s(!0),className:`text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1`,children:[(0,V.jsx)(kt,{className:`w-3.5 h-3.5`}),` Reenviar Novas Fotos`]})]}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-3`,children:[(0,V.jsxs)(`div`,{onClick:()=>e.idCardFront&&a({title:`Frente do Bilhete de Identidade (BI)`,src:e.idCardFront}),className:`group relative rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 p-2 cursor-pointer hover:border-amber-400 transition-colors`,children:[(0,V.jsxs)(`div`,{className:`text-[10px] text-neutral-400 mb-1 flex items-center justify-between`,children:[(0,V.jsx)(`span`,{children:`1. Frente do BI (Foto Titular)`}),(0,V.jsxs)(`span`,{className:`text-amber-400 flex items-center gap-1 group-hover:underline`,children:[(0,V.jsx)(pt,{className:`w-3 h-3`}),` Ampliar`]})]}),(0,V.jsx)(`div`,{className:`aspect-16/10 rounded-lg overflow-hidden bg-neutral-950 flex items-center justify-center`,children:e.idCardFront?(0,V.jsx)(`img`,{src:e.idCardFront,alt:`Frente do BI`,className:`w-full h-full object-contain`}):(0,V.jsx)(`span`,{className:`text-neutral-600 text-xs`,children:`Sem fotografia`})})]}),(0,V.jsxs)(`div`,{onClick:()=>e.idCardBack&&a({title:`Verso do Bilhete de Identidade (BI)`,src:e.idCardBack}),className:`group relative rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 p-2 cursor-pointer hover:border-amber-400 transition-colors`,children:[(0,V.jsxs)(`div`,{className:`text-[10px] text-neutral-400 mb-1 flex items-center justify-between`,children:[(0,V.jsx)(`span`,{children:`2. Verso do BI (Código de Barras / Filiação)`}),(0,V.jsxs)(`span`,{className:`text-amber-400 flex items-center gap-1 group-hover:underline`,children:[(0,V.jsx)(pt,{className:`w-3 h-3`}),` Ampliar`]})]}),(0,V.jsx)(`div`,{className:`aspect-16/10 rounded-lg overflow-hidden bg-neutral-950 flex items-center justify-center`,children:e.idCardBack?(0,V.jsx)(`img`,{src:e.idCardBack,alt:`Verso do BI`,className:`w-full h-full object-contain`}):(0,V.jsx)(`span`,{className:`text-neutral-600 text-xs`,children:`Sem fotografia`})})]})]})]})]}),o&&(0,V.jsxs)(`form`,{onSubmit:t=>{if(t.preventDefault(),!c||!u)h(`Carrega ambas as fotografias (frente e verso) do Bilhete de Identidade.`);else try{pe(e.id,c,u,f),s(!1),h(null),r()}catch(e){h(e.message||`Erro ao reenviar documentos.`)}},className:`bg-neutral-950 p-5 rounded-2xl border border-amber-400/40 space-y-4`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between border-b border-neutral-800 pb-3`,children:[(0,V.jsxs)(`h4`,{className:`font-bold text-sm text-amber-400 flex items-center gap-2`,children:[(0,V.jsx)(kt,{className:`w-4 h-4`}),(0,V.jsx)(`span`,{children:`Reenviar Fotografias do Bilhete de Identidade`})]}),(0,V.jsxs)(`button`,{type:`button`,onClick:()=>{let t=`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="%23f7f9fa" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="360" height="40" rx="8" fill="%231e293b"/><text x="200" y="38" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23f59e0b" text-anchor="middle">REPÚBLICA DE ANGOLA</text><text x="200" y="52" font-family="sans-serif" font-size="9" fill="%23ffffff" text-anchor="middle">BILHETE DE IDENTIDADE DE CIDADÃO NACIONAL</text><rect x="30" y="80" width="85" height="110" rx="8" fill="%23e2e8f0" stroke="%2394a3b8"/><text x="72" y="140" font-family="sans-serif" font-size="10" fill="%2364748b" text-anchor="middle">FOTO TITULAR</text><text x="135" y="95" font-family="sans-serif" font-size="9" fill="%2364748b">NOME COMPLETO:</text><text x="135" y="112" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">${e.name.toUpperCase()}</text><text x="135" y="135" font-family="sans-serif" font-size="9" fill="%2364748b">Nº DO BILHETE (BI):</text><text x="135" y="152" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23b45309">${f||e.idNumber}</text><text x="135" y="175" font-family="sans-serif" font-size="9" fill="%2364748b">DATA NASC / NATURALIDADE:</text><text x="135" y="190" font-family="sans-serif" font-size="10" font-weight="semibold" fill="%23334155">${e.birthDate||`1998-05-15`} · ${e.province.toUpperCase()}</text><rect x="20" y="210" width="360" height="25" rx="4" fill="%23e2e8f0"/><text x="200" y="226" font-family="monospace" font-size="10" fill="%23475569" text-anchor="middle">IDAGO${f||e.idNumber}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text></svg>`,n=`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="%23f1f5f9" stroke="%23cbd5e1" stroke-width="2"/><text x="30" y="45" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23475569">FILIAÇÃO E RESIDÊNCIA (VERSO DO BI):</text><text x="30" y="70" font-family="sans-serif" font-size="9" fill="%2364748b">PAI: MANUEL ANTÓNIO</text><text x="30" y="90" font-family="sans-serif" font-size="9" fill="%2364748b">MÃE: MARIA SEBASTIÃO</text><text x="30" y="110" font-family="sans-serif" font-size="9" fill="%2364748b">RESIDÊNCIA: ${e.city.toUpperCase()}, ${e.province.toUpperCase()}</text><text x="30" y="130" font-family="sans-serif" font-size="9" fill="%2364748b">EMISSÃO / VALIDADE: 2024 A 2034</text><rect x="30" y="155" width="340" height="65" fill="%23334155" rx="6"/><text x="200" y="190" font-family="monospace" font-size="11" fill="%2338bdf8" text-anchor="middle">||| | ||||| |||| || |||||| |||||||||| ||||||</text><text x="200" y="206" font-family="sans-serif" font-size="8" fill="%2394a3b8" text-anchor="middle">CÓDIGO DE BARRAS DE SEGURANÇA NACIONAL</text></svg>`;l(t),d(n)},className:`text-xs text-amber-300 underline font-semibold flex items-center gap-1`,children:[(0,V.jsx)(Lt,{className:`w-3.5 h-3.5`}),` Exemplo Válido`]})]}),(0,V.jsx)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs`,children:(0,V.jsxs)(`div`,{children:[(0,V.jsx)(`label`,{className:`block text-neutral-400 mb-1 font-semibold`,children:`Nº do Bilhete de Identidade:`}),(0,V.jsx)(`input`,{type:`text`,value:f,onChange:e=>p(e.target.value.toUpperCase()),className:`w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl font-mono text-white`,required:!0})]})}),(0,V.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs`,children:[(0,V.jsxs)(`div`,{className:`border border-neutral-700 rounded-xl p-3 bg-neutral-900 text-center space-y-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-300 block text-[11px]`,children:`Nova Foto da Frente:`}),c?(0,V.jsxs)(`div`,{className:`aspect-16/10 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 relative`,children:[(0,V.jsx)(`img`,{src:c,alt:`Nova Frente`,className:`w-full h-full object-contain`}),(0,V.jsx)(`button`,{type:`button`,onClick:()=>l(``),className:`absolute top-1 right-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded`,children:`Remover`})]}):(0,V.jsxs)(`label`,{className:`cursor-pointer border-2 border-dashed border-neutral-700 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-neutral-800`,children:[(0,V.jsx)(Wt,{className:`w-5 h-5 text-neutral-400 mb-1`}),(0,V.jsx)(`span`,{className:`text-[11px] text-neutral-300`,children:`Carregar Frente`}),(0,V.jsx)(`input`,{type:`file`,accept:`image/*`,onChange:e=>v(e,`front`),className:`hidden`})]})]}),(0,V.jsxs)(`div`,{className:`border border-neutral-700 rounded-xl p-3 bg-neutral-900 text-center space-y-2`,children:[(0,V.jsx)(`span`,{className:`font-bold text-neutral-300 block text-[11px]`,children:`Nova Foto do Verso:`}),u?(0,V.jsxs)(`div`,{className:`aspect-16/10 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 relative`,children:[(0,V.jsx)(`img`,{src:u,alt:`Novo Verso`,className:`w-full h-full object-contain`}),(0,V.jsx)(`button`,{type:`button`,onClick:()=>d(``),className:`absolute top-1 right-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded`,children:`Remover`})]}):(0,V.jsxs)(`label`,{className:`cursor-pointer border-2 border-dashed border-neutral-700 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-neutral-800`,children:[(0,V.jsx)(Wt,{className:`w-5 h-5 text-neutral-400 mb-1`}),(0,V.jsx)(`span`,{className:`text-[11px] text-neutral-300`,children:`Carregar Verso`}),(0,V.jsx)(`input`,{type:`file`,accept:`image/*`,onChange:e=>v(e,`back`),className:`hidden`})]})]})]}),m&&(0,V.jsx)(`p`,{className:`text-xs text-red-400 font-semibold`,children:m}),(0,V.jsxs)(`div`,{className:`flex items-center justify-end gap-3 pt-2`,children:[(0,V.jsx)(`button`,{type:`button`,onClick:()=>s(!1),className:`px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl`,children:`Cancelar`}),(0,V.jsx)(`button`,{type:`submit`,className:`px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black rounded-xl shadow-md`,children:`Submeter para Nova Análise`})]})]}),(0,V.jsxs)(`div`,{className:`pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`,children:[(0,V.jsxs)(`button`,{onClick:()=>{syncUsersFromFirestore().then(()=>r())},className:`w-full sm:w-auto px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl border border-neutral-700 transition-colors flex items-center justify-center gap-1.5`,children:[(0,V.jsx)(kt,{className:`w-3.5 h-3.5`}),(0,V.jsx)(`span`,{children:`Verificar se Já Foi Aprovado`})]}),n?(0,V.jsxs)(`button`,{onClick:n,className:`w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-2`,children:[(0,V.jsx)(R,{className:`w-4 h-4 text-neutral-950`}),(0,V.jsx)(`span`,{children:`Aceder ao Painel Admin para Validar Este BI`})]}):(0,V.jsx)(`button`,{onClick:t,className:`w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl shadow-md transition-colors`,children:`Aceder como Administrador para Validar`})]})]}),i&&(0,V.jsx)(`div`,{className:`fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4`,children:(0,V.jsxs)(`div`,{className:`bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl`,children:[(0,V.jsxs)(`div`,{className:`flex items-center justify-between pb-3 border-b border-neutral-800 mb-3`,children:[(0,V.jsx)(`h4`,{className:`font-bold text-sm text-white`,children:i.title}),(0,V.jsx)(`button`,{onClick:()=>a(null),className:`p-1 text-neutral-400 hover:text-white rounded-lg`,children:(0,V.jsx)(Zt,{className:`w-5 h-5`})})]}),(0,V.jsx)(`div`,{className:`max-h-[75vh] flex items-center justify-center bg-black/40 rounded-xl p-2 overflow-auto`,children:(0,V.jsx)(`img`,{src:i.src,alt:``,className:`max-w-full max-h-[70vh] object-contain rounded-lg`})})]})}),(0,V.jsx)(`footer`,{className:`max-w-4xl mx-auto w-full text-center text-xs text-neutral-600 pt-6 border-t border-neutral-900`,children:`BABA SHOPPING Angola · Compra. Revende. Ganha. · Proteção de Identidade e Conformidade Legal`})]})},gn=({currentUser:e,wallet:t,userProducts:n,orders:r,onNavigateTab:i,onOpenAuth:a,onLogout:pLogout,onSwitchAccount:pSwitchAccount}: any)=>{
  const [o,s] = useState<'geral'|'bi_dossier'>('geral');
  const [c,l] = useState<'frente'|'verso'|null>(null);

  const u = n.filter((item: any) => item.status === 'anunciado' || item.status === 'reservado').length;
  const d = n.filter((item: any) => item.status === 'disponivel').length;

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-[#FF6A00] flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm shrink-0 border-2 border-orange-200">
              {e.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-950">{e.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <R className="w-3.5 h-3.5 text-emerald-600" />
                  <span>BI Verificado</span>
                </span>
                {e.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[10px] font-black uppercase">
                    Administrador
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <mt className="w-3.5 h-3.5 text-neutral-400" />
                  Nº BI: <strong className="text-neutral-800 font-mono">{e.idNumber}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Ct className="w-3.5 h-3.5 text-neutral-400" />
                  {e.city}, {e.province}
                </span>
                <span className="flex items-center gap-1">
                  <Dt className="w-3.5 h-3.5 text-neutral-400" />
                  {e.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={pSwitchAccount || a}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Je className="w-3.5 h-3.5 text-neutral-600" />
              <span>Mudar de Conta</span>
            </button>
            <button
              type="button"
              onClick={pLogout}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <St className="w-3.5 h-3.5 text-red-600" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
            <span>Saldo da Carteira</span>
            <Jt className="w-4 h-4 text-[#FF6A00]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-950 tabular-nums">{F(t.availableBalance)}</div>
          <p className="text-[10px] text-neutral-500">Pronto para compras ou levantamento</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
            <span>Em Stock (Revenda)</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">{d} unidades</div>
          <p className="text-[10px] text-neutral-500">Prontos para anunciar no mercado</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
            <span>Anúncios Ativos</span>
            <Je className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 tabular-nums">{u} artigos</div>
          <p className="text-[10px] text-neutral-500">A receber propostas de compradores</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => s('geral')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${o === 'geral' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
        >
          Visão Geral & Acessos Rápidos
        </button>
        <button
          type="button"
          onClick={() => s('bi_dossier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${o === 'bi_dossier' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
        >
          <R className="w-3.5 h-3.5 text-emerald-500" />
          <span>Dossiê do Bilhete de Identidade</span>
        </button>
      </div>

      {o === 'geral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FF6A00]" />
              <span>Gestão Rápida da Tua Conta</span>
            </h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => i('carteira')}
                className="w-full p-3 rounded-xl border border-neutral-200 hover:border-[#FF6A00] bg-neutral-50/70 hover:bg-orange-50/50 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900">Minha Carteira & Extrato</div>
                  <div className="text-[11px] text-neutral-500">Carregar saldo, levantar fundos ou ver movimentos</div>
                </div>
                <ot className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => i('meus_produtos')}
                className="w-full p-3 rounded-xl border border-neutral-200 hover:border-[#FF6A00] bg-neutral-50/70 hover:bg-orange-50/50 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900">Ver Meu Inventário para Revenda</div>
                  <div className="text-[11px] text-neutral-500">Artigos comprados que podes anunciar com o teu próprio preço</div>
                </div>
                <ot className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF6A00] uppercase tracking-wider">
                <Ht className="w-4 h-4" />
                <span>Como Funciona a Compra & Revenda</span>
              </div>
              <h3 className="text-base font-extrabold text-white">Ganha dinheiro comprando por atacado e revendendo na BABA SHOPPING</h3>
              <ol className="space-y-3 text-xs text-neutral-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <span><strong>Compra ao Preço de Fábrica:</strong> Escolhe produtos no catálogo oficial por atacado a preços fixos em Kwanza.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <span><strong>Fica no Teu Stock:</strong> O artigo entra instantaneamente em <em>Meus Produtos</em> como teu património verificado.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                  <span><strong>Revende com Lucro:</strong> Define o teu preço de venda e recebe o valor na carteira após conclusão.</span>
                </li>
              </ol>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => i('inicio')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                Comprar Produtos para Revender Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {o === 'bi_dossier' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                <R className="w-5 h-5 text-emerald-600" />
                <span>Bilhete de Identidade Nacional (Angola)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Dados cadastrais autênticos verificados e validados pelo Administrador do BABA SHOPPING.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 self-start sm:self-auto">
              STATUS: ATIVO &amp; REGULARIZADO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Nome no BI</span>
              <span className="text-xs font-bold text-neutral-900 block mt-0.5">{e.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Número do BI</span>
              <span className="text-xs font-mono font-bold text-[#FF6A00] block mt-0.5">{e.idNumber}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Data de Nascimento</span>
              <span className="text-xs font-bold text-neutral-900 block mt-0.5">{e.birthDate || '14/09/1995'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Província / Município</span>
              <span className="text-xs font-bold text-neutral-900 block mt-0.5">{e.city}, {e.province}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase text-neutral-700 tracking-wider">
              Fotografias Originais do Documento (Frente e Verso)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-600 flex items-center justify-between">
                  <span>Foto Frente do BI:</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Validado</span>
                </div>
                <div className="rounded-xl border-2 border-neutral-200 overflow-hidden bg-neutral-100 aspect-[16/10] relative group">
                  {e.idCardFront ? (
                    <img src={e.idCardFront} alt="Frente do BI" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">Imagem não disponível</div>
                  )}
                  <button
                    type="button"
                    onClick={() => l('frente')}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                  >
                    <pt className="w-4 h-4" />
                    <span>Ampliar Imagem</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-600 flex items-center justify-between">
                  <span>Foto Verso do BI:</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Validado</span>
                </div>
                <div className="rounded-xl border-2 border-neutral-200 overflow-hidden bg-neutral-100 aspect-[16/10] relative group">
                  {e.idCardBack ? (
                    <img src={e.idCardBack} alt="Verso do BI" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">Imagem não disponível</div>
                  )}
                  <button
                    type="button"
                    onClick={() => l('verso')}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                  >
                    <pt className="w-4 h-4" />
                    <span>Ampliar Imagem</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {c && (
        <div onClick={() => l(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-fadeIn">
          <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-4 space-y-3" onClick={ev => ev.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 uppercase">
                Visualização do Bilhete de Identidade ({c === 'frente' ? 'Frente' : 'Verso'})
              </span>
              <button type="button" onClick={() => l(null)} className="text-neutral-500 hover:text-neutral-900 text-xs font-bold p-1 cursor-pointer">
                ✕ Fechar
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
              <img src={c === 'frente' ? e.idCardFront : e.idCardBack} alt="Documento ampliado" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};function _n(){
  ProductDetailModal = nn;
  NegotiationModal = on;
  ResaleMarketView = sn;
  MyProductsView = cn;
  WalletView = ln;
  NotificationsDrawer = fn;
  CartDrawer = pn;
  ProfileView = gn;
  (0,_.useEffect)(()=>{ae();syncUsersFromFirestore();syncAdminCollectionsFromFirestore();try{if(typeof window!=='undefined'){let params=new URLSearchParams(window.location.search);let ref=(params.get('ref')||'').trim().toUpperCase();if(ref){localStorage.setItem('baba_ref_code',ref);}}}catch{}},[]);let[e,t]=(0,_.useState)(()=>{try{if(typeof window!=='undefined'&&!localStorage.getItem('baba_onboarding_completed')){return null;}}catch{}return se()}),[authMode,setAuthMode]=(0,_.useState)(()=>{try{if(typeof window!=='undefined'&&!localStorage.getItem('baba_onboarding_completed')){return 'presentation';}}catch{}return null}),[purchaseNotice,setPurchaseNotice]=(0,_.useState)(null),[walletAction,setWalletAction]=(0,_.useState)(null),[walletInitialAmount,setWalletInitialAmount]=(0,_.useState)(50000),[,setCurrencyTick]=(0,_.useState)(0),[n,r]=(0,_.useState)(()=>e?N(e.id):null),[i,a]=(0,_.useState)(()=>me()),[o,s]=(0,_.useState)(()=>ve()),[c,l]=(0,_.useState)(()=>e?_e(e.id):[]),[u,d]=(0,_.useState)(()=>e?Fe(e.id):[]),[f,p]=(0,_.useState)(()=>e?Me(e.id):[]),[m,h]=(0,_.useState)(()=>{try{let u=se();if(u&&(u.role==='admin'||u.id==='kt5dFLArJzV7hCNMQ3ZvgqFokM62'))return'admin';}catch{}return'inicio';}),[g,v]=(0,_.useState)(void 0),[y,b]=(0,_.useState)(``),[x,S]=(0,_.useState)(!1),[C,w]=(0,_.useState)(!1),[T,E]=(0,_.useState)(!1),[D,ee]=(0,_.useState)([]),[te,ne]=(0,_.useState)(null),O=(0,_.useCallback)(()=>{let u=se();if(u){if(u.role==='admin'||u.id==='kt5dFLArJzV7hCNMQ3ZvgqFokM62'||u.id==='usr_admin'){u.accountStatus='ativo';}t(u);r(N(u.id));l(_e(u.id));d(Fe(u.id));p(Me(u.id));}else{t(null);}a(me());s(ve());},[]);(0,_.useEffect)(()=>{let e=()=>{O()};window.addEventListener(re,e);let curHandler=()=>setCurrencyTick(t=>t+1);window.addEventListener("baba_currency_change",curHandler);return()=>{window.removeEventListener(re,e);window.removeEventListener("baba_currency_change",curHandler)}},[O]);
  if (!e || authMode) {
    return (0, V.jsx)(AuthPage, {
      onLoginSuccess: (user: any) => {
        if (user) {
          if (user.role === 'admin' || user.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || user.id === 'usr_admin') {
            user.accountStatus = 'ativo';
          }
          ce(user);
          t(user);
        }
        setAuthMode(null);
        try {
          localStorage.setItem('baba_onboarding_completed', 'true');
        } catch {}
        if (user && (user.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || user.id === 'dR71uBkwU4Z8k52HyDL9TdeXdeR2' || user.role === 'admin')) {
          h('admin');
          v(void 0);
        } else {
          h('inicio');
          v(void 0);
        }
        O();
      },
      onCancel: e && (e.accountStatus === 'ativo' || e.role === 'admin' || e.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62') ? () => setAuthMode(null) : undefined,
      initialMode: authMode || 'presentation'
    });
  };
  if (e && e.accountStatus === 'em_processamento' && e.role !== 'admin' && e.id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62') { return (0,V.jsxs)(V.Fragment, { children: [(0,V.jsx)(hn, { user: e, onSwitchUser: () => setAuthMode('login'), onRefreshStatus: O })] }); }
  if (e && e.accountStatus === 'rejeitado' && e.role !== 'admin' && e.id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62')return(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(hn,{user:e,onSwitchUser:()=>setAuthMode('login'),onRefreshStatus:O})]});
  if (e && e.accountStatus === 'suspenso' && e.role !== 'admin' && e.id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62') {
    return (
      <div className="min-h-screen bg-[#0C0D12] text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-neutral-900 border border-orange-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Qe className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-black uppercase tracking-wider border border-orange-500/30">
              Conta Suspensa
            </span>
            <h1 className="text-2xl font-black text-white">
              A sua conta encontra-se suspensa
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Motivo: {e.suspensionReason || e.rejectionReason || 'Suspensão temporária aplicada pelo Administrador.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => { logoutUser(); t(null); setAuthMode('login'); }}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs cursor-pointer"
            >
              Terminar Sessão / Mudar de Conta
            </button>
          </div>
        </div>
      </div>
    );
  }
  let ie=prod=>{if(e&&(e.role==='admin'||e.id==='kt5dFLArJzV7hCNMQ3ZvgqFokM62')){showAppNotice('Como Administrador, podes apenas comprar e negociar os produtos que os utilizadores estão a vender no Mercado de Revenda!', 'error');h('revenda');return;}ee(t=>t.find(t=>t.id===prod.id)?t.map(t=>t.id===prod.id?{...t,quantity:t.quantity+1,selectedColor:prod.selectedColor||t.selectedColor}:t):[...t,{id:prod.id,name:prod.name,price:prod.officialPrice,quantity:1,imageUrl:prod.imageUrl,source:`oficial`,selectedColor:prod.selectedColor}])};
let k=prod=>{
  if (!e) {
    setAuthMode('login');
    return;
  }
  if (e.role === 'admin' || e.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62') {
    showAppNotice('Como Administrador, podes apenas comprar e negociar os produtos que os utilizadores estão a vender no Mercado de Revenda!', 'error');
    h('revenda');
    return;
  }
  const qty = Math.max(1, Number(prod._buyQuantity || 1));
  const totalPrice = prod.officialPrice * qty;
  const spendable = getLivre(e.id);
  if (spendable < totalPrice) {
    setPurchaseNotice({
      type: 'insufficient_funds',
      productName: qty > 1 ? `${qty}x ${prod.name}` : prod.name,
      price: totalPrice,
      availableBalance: spendable,
      product: prod
    });
  } else {
    try {
      Ae(e.id, prod.id, qty, prod.selectedColor);
      O();
      ne(`${qty > 1 ? `${qty}x ` : ''}${prod.name}`);
    } catch (err: any) {
      showAppNotice(err.message || 'Erro ao processar compra', 'error');
    }
  }
};
let [inAppToast, setInAppToast] = (0,_.useState)(null);
let [isClientInfoOpen, setIsClientInfoOpen] = (0,_.useState)(false);
let [isInviteOpen, setIsInviteOpen] = (0,_.useState)(false);
(0,_.useEffect)(() => {
  let handler = (ev: any) => {
    if (ev.detail?.msg) {
      setInAppToast({ msg: ev.detail.msg, type: ev.detail.type || 'error' });
    }
  };
  window.addEventListener('baba_in_app_notification', handler);
  let openInviteHandler = () => { h('convidar'); v(void 0); };
  window.addEventListener('baba_open_invite_modal', openInviteHandler);
  let buyAfterHandler = (ev: any) => {
    if (ev?.detail?.product) {
      k(ev.detail.product);
    }
  };
  window.addEventListener('baba_buy_after_deposit', buyAfterHandler);
  return () => {
    window.removeEventListener('baba_in_app_notification', handler);
    window.removeEventListener('baba_open_invite_modal', openInviteHandler);
    window.removeEventListener('baba_buy_after_deposit', buyAfterHandler);
  };
}, [k]);
(0,_.useEffect)(() => {
  if (inAppToast) {
    let t = setTimeout(() => setInAppToast(null), 3500);
    return () => clearTimeout(t);
  }
}, [inAppToast]);

let handleDepositAndBuy = (depositAmount: number, paymentMethod: string, reference: string, receiptProof?: string) => {
  if (!e) {
    setAuthMode('login');
    return;
  }
  try {
    const prod = purchaseNotice?.product;
    const topUp = depositAmount > 0 ? depositAmount : (prod ? Math.max(0, prod.officialPrice - (n?.availableBalance || 0)) : (purchaseNotice?.price ? Math.max(0, purchaseNotice.price - (n?.availableBalance || 0)) : 5000));
    const ref = reference && reference.trim() ? reference.trim() : `DEP-${Date.now().toString().slice(-6)}`;
    Ee(e.id, topUp, paymentMethod || 'multicaixa_express', ref, false, receiptProof);
    O();
    setPurchaseNotice(null);
    showAppNotice(`Pedido de depósito de ${topUp.toLocaleString('pt-AO')} Kz enviado para aprovação do Administrador! O saldo será creditado na carteira após confirmação.`, 'success');
  } catch (err: any) {
    showAppNotice(err.message || 'Erro ao enviar pedido de depósito', 'error');
  }
};

let handleQuickDepositAndBuy = () => {
  if (!e) return;
  try {
    const prod = purchaseNotice?.product;
    const missing = prod ? Math.max(0, prod.officialPrice - (n?.availableBalance || 0)) : 0;
    const topUp = missing > 0 ? missing : 5000;
    Ee(e.id, topUp, 'multicaixa_express', `MCX-TOPUP-${Date.now().toString().slice(-6)}`, false);
    O();
    setPurchaseNotice(null);
    showAppNotice(`Pedido de depósito de ${topUp.toLocaleString('pt-AO')} Kz enviado para aprovação do Administrador! O saldo será creditado na carteira após confirmação.`, 'success');
  } catch (err: any) {
    showAppNotice(err.message || 'Erro ao enviar pedido de depósito', 'error');
  }
};
let A=(e,t)=>{ee(n=>n.map(n=>{if(n.id===e){let e=n.quantity+t;return e>0?{...n,quantity:e}:null}return n}).filter(Boolean))},oe=e=>{ee(t=>t.filter(t=>t.id!==e))},le=()=>{ee([])},ue=e=>{ne(e),O()},de=(e,t)=>{v(t),h(e)},fe=u.filter(e=>!e.read).length,pe=D.reduce((e,t)=>e+t.quantity,0);
let handleLogout=()=>{logoutUser();try{localStorage.removeItem('baba_onboarding_completed')}catch{}t(null);setAuthMode('presentation');};
return(
  <div className="min-h-screen w-full max-w-full overflow-x-clip bg-gradient-to-br from-[#F4F1FF] via-[#FFF7F0] to-[#EEF3FF] text-neutral-900 flex flex-col font-sans">
    {e&&(e.role===`admin`||e.id===`kt5dFLArJzV7hCNMQ3ZvgqFokM62`)&&(
      <div className="w-full max-w-full overflow-x-hidden bg-neutral-950 text-white border-b-2 border-amber-400 px-3 sm:px-5 lg:px-6 py-2 flex items-center justify-between gap-2 text-xs sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"/>
          <span className="px-2 py-0.5 rounded bg-amber-400 text-neutral-950 font-black text-[10px] uppercase tracking-wider">ADMIN MASTER</span>
          <span className="font-mono text-neutral-300 font-bold hidden sm:inline">932200719</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto scrollbar-none">
          <button type="button" onClick={()=>{h(`admin`);v(void 0);}} className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${m===`admin`?`bg-amber-400 text-neutral-950 shadow-xs`:`bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700`}`}>
            <R className="w-3.5 h-3.5"/>
            <span>Painel do Adm</span>
          </button>
          <button type="button" onClick={()=>{h(`inicio`);v(void 0);}} className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${m===`inicio`||m===`oficial`?`bg-amber-400 text-neutral-950 shadow-xs`:`bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700`}`}>
            Mercado Oficial
          </button>
          <button type="button" onClick={()=>{h(`revenda`);v(void 0);}} className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${m===`revenda`?`bg-amber-400 text-neutral-950 shadow-xs`:`bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700`}`}>
            Revenda P2P
          </button>
          <button type="button" onClick={()=>{h(`meus_produtos`);v(void 0);}} className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-1 cursor-pointer ${m===`meus_produtos`?`bg-amber-400 text-neutral-950 shadow-xs`:`bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700`}`}>
            <L className="w-3.5 h-3.5"/>
            <span>Meus Produtos</span>
          </button>
          <button type="button" onClick={()=>{h(`carteira`);v(void 0);}} className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${m===`carteira`?`bg-amber-400 text-neutral-950 shadow-xs`:`bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700`}`}>
            Minha Carteira
          </button>
          <button type="button" onClick={()=>{h(`convidar`);v(void 0);}} className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${m===`convidar`?`bg-amber-400 text-neutral-950 shadow-xs`:`bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700`}`}>
            Convidar
          </button>
          <button type="button" onClick={handleLogout} className="px-2.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 text-red-400 hover:text-white hover:bg-red-950 transition-colors cursor-pointer border border-red-500/30">
            Sair
          </button>
        </div>
      </div>
    )}

    {!(m===`admin`&&e&&(e.role===`admin`||e.id===`kt5dFLArJzV7hCNMQ3ZvgqFokM62`))&&(
      <AppHeader
        currentUser={e}
        wallet={n}
        onLogout={handleLogout}
        onSwitchAccount={()=>setAuthMode(`login`)}
        onOpenInvite={()=>{h(`convidar`);v(void 0);}}
        onOpenClientInfo={()=>setIsClientInfoOpen(!0)}
        unreadCount={fe}
        cartCount={pe}
        activeTab={m}
        setActiveTab={tab=>{h(tab);v(void 0);}}
        onSelectCategory={cat=>{v(cat===`all`?void 0:cat);if(m!==`inicio`&&m!==`oficial`&&m!==`revenda`)h(`inicio`);}}
        activeCategory={g||`all`}
        onOpenNotifications={()=>S(!0)}
        onOpenCart={()=>w(!0)}
        onOpenAuth={()=>setAuthMode(`login`)}
        searchQuery={y}
        setSearchQuery={b}
      />
    )}

    <main className="flex-1 w-full max-w-full px-3 sm:px-5 lg:px-6 pt-5 pb-24">
      {m===`inicio`&&(<HomeMarketView products={i} currentUser={e} onNavigateTab={de} onAddToCart={ie} onDirectBuy={k} initialCategory={g} searchQuery={y}/>)}
      {m===`oficial`&&(<OfficialMarketView products={i} currentUser={e} onAddToCart={ie} onDirectBuy={k} searchQuery={y} initialCategory={g}/>)}
      {m===`revenda`&&(<ResaleMarketView listings={o} currentUser={e} wallet={n} onOpenNegotiation={negId=>{v(negId);h(`meus_produtos`);}} onSuccessOrder={ue} onNavigateToWallet={()=>h(`carteira`)} searchQuery={y} initialCategory={g} onNotice={setPurchaseNotice} onNavigateToOfficial={()=>{h(`inicio`);v(void 0);}}/>)}
      {m===`meus_produtos`&&(<MyProductsView userProducts={c} currentUser={e} wallet={n} onNavigateToOfficial={()=>h(`inicio`)} onSuccessOrder={ue} initialNegotiationId={g}/>)}
      {m===`carteira`&&(<WalletView wallet={n} currentUser={e} onNavigateToMarket={()=>h(`revenda`)} onNavigateToSell={()=>h(`meus_produtos`)} initialAction={walletAction} initialDepositAmount={walletInitialAmount} onClearInitialAction={()=>setWalletAction(null)}/>)}
      {m===`convidar`&&(<InviteFriendsView currentUser={e} onNavigateToWallet={()=>{h(`carteira`);v(void 0);}}/>)}
      {m===`admin`&&(e.role===`admin`||e.id===`kt5dFLArJzV7hCNMQ3ZvgqFokM62`)&&(<AdminPanel currentUser={e} onNavigateToMarket={()=>{h(`revenda`);v(void 0);}} onNavigateToMyProducts={()=>{h(`meus_produtos`);v(void 0);}} onRefreshState={O}/>)}
      {m===`perfil`&&(<ProfileView currentUser={e} wallet={n} userProducts={c} orders={f} onNavigateTab={(tab,cat)=>{h(tab);v(cat);}} onOpenAuth={()=>setAuthMode(`login`)} onSwitchAccount={()=>setAuthMode(`login`)} onLogout={handleLogout}/>)}
    </main>

    {inAppToast&&(
      <div className={`fixed top-3 left-3 right-3 sm:left-auto sm:top-5 sm:right-5 z-[9999] sm:max-w-sm w-auto sm:w-full bg-white border-2 ${inAppToast.type===`error`?`border-red-500 shadow-red-500/20`:`border-emerald-500 shadow-emerald-500/20`} shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3 animate-fadeIn`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {inAppToast.type===`error`?<AlertCircle className="w-5 h-5 text-red-600 shrink-0"/>:<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0"/>}
          <span className="text-xs font-bold text-neutral-900 truncate">{inAppToast.msg}</span>
        </div>
        <button type="button" onClick={()=>setInAppToast(null)} className="text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1 cursor-pointer">
          ✕
        </button>
      </div>
    )}

    <BottomNavBar activeTab={m} setActiveTab={tab=>{h(tab);v(void 0);}} userRole={e.role} isAdmin={e.role===`admin`||e.id===`kt5dFLArJzV7hCNMQ3ZvgqFokM62`} unreadCount={fe} onOpenInvite={()=>{h(`convidar`);v(void 0);}}/>
    <NotificationsDrawer isOpen={x} onClose={()=>S(!1)} notifications={u} userId={e.id} onNavigate={de}/>
    <CartDrawer isOpen={C} onClose={()=>w(!1)} items={D} onUpdateQuantity={A} onRemoveItem={oe} onClearCart={le} currentUser={e} wallet={n} onSuccessOrder={ue} onTopUpWallet={()=>{w(!1);h(`carteira`);}} onNotice={setPurchaseNotice}/>
    <ClientInfoModal isOpen={isClientInfoOpen} onClose={()=>setIsClientInfoOpen(!1)} currentUser={e} wallet={n} onLogout={handleLogout} onSwitchAccount={()=>{setIsClientInfoOpen(!1);setAuthMode(`login`);}} onOpenInvite={()=>{setIsClientInfoOpen(!1);h(`convidar`);v(void 0);}} onNavigateToWallet={()=>{setIsClientInfoOpen(!1);h(`carteira`);}} onNavigateToProducts={()=>{setIsClientInfoOpen(!1);h(`meus_produtos`);}}/>
    <InviteFriendsModal isOpen={isInviteOpen} onClose={()=>setIsInviteOpen(!1)} currentUser={e} onNavigateToWallet={()=>{setIsInviteOpen(!1);h(`carteira`);}}/>
    <PurchaseNoticeModal notice={purchaseNotice} onClose={()=>setPurchaseNotice(null)} onNavigateToWallet={()=>{setPurchaseNotice(null);h(`carteira`);}} onNavigateToMyProducts={()=>{setPurchaseNotice(null);h(`meus_produtos`);}} onQuickDeposit={handleQuickDepositAndBuy} onDepositAndBuy={handleDepositAndBuy} onNavigateToDeposit={amount=>{setPurchaseNotice(null);setWalletAction(`deposit`);if(amount&&amount>0)setWalletInitialAmount(amount);h(`carteira`);}} currentUser={e}/>
    {te&&(
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-center space-y-4">
          {e&&(e.role===`admin`||e.id===`kt5dFLArJzV7hCNMQ3ZvgqFokM62`)?(
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8"/>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-neutral-900">Compra Concluída com Sucesso!</h3>
                <p className="text-xs text-neutral-500">
                  A tua compra <strong>{te}</strong> foi confirmada! O artigo já está em Meus Produtos.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={()=>{ne(null);h(`meus_produtos`);}} className="flex-1 py-2.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer">
                  Ver em Meus Produtos
                </button>
                <button type="button" onClick={()=>ne(null)} className="flex-1 py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                  Continuar no Mercado
                </button>
              </div>
            </>
          ):(
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8"/>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-neutral-900">Pedido Enviado para Aprovação do Adm!</h3>
                <p className="text-xs text-neutral-500">
                  O teu pedido de compra <strong>{te}</strong> ficou registado como <strong className="text-amber-700">Pendente</strong> no teu Extrato.
                </p>
              </div>
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1 text-left">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <L className="w-4 h-4"/>
                  <span>Aguardando aprovação do Administrador</span>
                </div>
                <p className="text-[11px] text-amber-900">
                  O valor só será debitado da tua conta e marcado como Sucesso quando o Administrador aprovar o movimento, momento em que o artigo entra automaticamente em Meus Produtos.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={()=>{ne(null);h(`carteira`);}} className="flex-1 py-2.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer">
                  Ver Extrato
                </button>
                <button type="button" onClick={()=>ne(null)} className="flex-1 py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                  Continuar no Mercado
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);
}
export default _n;
