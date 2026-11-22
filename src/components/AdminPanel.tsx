import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  ShoppingBag,
  Settings,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Check,
  Search,
  Wallet,
  Plus,
  Edit3,
  Trash2,
  Ban,
  RefreshCw,
  Clock,
  FileText,
  Send,
  X,
  AlertCircle
} from 'lucide-react';
import {
  User,
  Product,
  OrderStatus,
  AssistantConversation
} from '../types';
import {
  getUsers,
  syncUsersFromFirestore,
  approveKYC,
  rejectKYC,
  suspendUser,
  reactivateUser,
  deleteUserAccount,
  getWallet,
  adjustUserBalance,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  processWithdrawal,
  getOrders,
  approveOrder,
  rejectOrder,
  updateOrderStatus,
  getOrderStatusLabel,
  getAllResaleListings,
  approveResaleListing,
  rejectResaleListing,
  getNegotiations,
  approveNegotiationProposal,
  rejectNegotiationProposal,
  getProducts,
  updateProduct,
  createProduct,
  getAllAssistantConversations,
  adminReplyAssistantConversation,
  adminUpdateAssistantStatus,
  markAssistantConversationRead,
  formatKz,
  DB_STATE_EVENT
} from '../services/db';
import { copyTextToClipboard } from '../utils/image';

interface AdminPanelProps {
  currentUser: User;
  onDataChanged?: () => void;
}

type AdminTab = 'validacao_bi' | 'depositos' | 'saques' | 'users' | 'operacoes' | 'ajustes';

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('validacao_bi');
  const [, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Filters & search
  const [depositFilter, setDepositFilter] = useState<'pendente' | 'aprovado' | 'rejeitado' | 'todos'>('pendente');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pendente' | 'processado' | 'rejeitado' | 'todos'>('pendente');
  const [userFilter, setUserFilter] = useState<'todos' | 'em_processamento' | 'ativo' | 'suspenso' | 'rejeitado'>('todos');
  const [userSearch, setUserSearch] = useState('');
  const [opsSubTab, setOpsSubTab] = useState<'pedidos' | 'revendas' | 'negociacoes'>('pedidos');
  const [settingsSubTab, setSettingsSubTab] = useState<'catalogo' | 'suporte'>('suporte');

  // Modals & action dialogs
  const [biModalUser, setBiModalUser] = useState<User | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{ title: string; src: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    title: string;
    placeholder: string;
    onConfirm: (reason: string) => void;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Balance adjustment modal
  const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
  const [balanceType, setBalanceType] = useState<'add' | 'remove'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');

  // Product editor modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Assistant support reply
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Copied IBAN feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = () => {
    setTick(t => t + 1);
    onDataChanged?.();
  };

  useEffect(() => {
    syncUsersFromFirestore().then(() => setTick(t => t + 1)).catch(() => {});
    const onDb = () => setTick(t => t + 1);
    window.addEventListener(DB_STATE_EVENT, onDb);
    return () => window.removeEventListener(DB_STATE_EVENT, onDb);
  }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const users = getUsers();
  const deposits = getDeposits();
  const withdrawals = getWithdrawals();
  const orders = getOrders();
  const listings = getAllResaleListings();
  const negotiations = getNegotiations(currentUser.id);
  const products = getProducts();
  const conversations = getAllAssistantConversations();

  const nonAdminUsers = useMemo(
    () =>
      users.filter(
        u =>
          u &&
          u.role !== 'admin' &&
          u.id !== 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' &&
          u.id !== 'usr_admin'
      ),
    [users]
  );

  const pendingUsers = useMemo(
    () => nonAdminUsers.filter(u => u.accountStatus === 'em_processamento'),
    [nonAdminUsers]
  );
  const activeUsers = useMemo(
    () => nonAdminUsers.filter(u => u.accountStatus === 'ativo'),
    [nonAdminUsers]
  );

  const pendingDeposits = useMemo(() => deposits.filter(d => d.status === 'pendente'), [deposits]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => w.status === 'pendente'), [withdrawals]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'aguardando_aprovacao'), [orders]);
  const pendingListings = useMemo(() => listings.filter(l => l.status === 'pendente'), [listings]);
  const pendingNegs = useMemo(() => negotiations.filter(n => n.status === 'aguardando_adm'), [negotiations]);
  const escalatedConvs = useMemo(
    () => conversations.filter(c => c.status === 'aguardando_adm' || c.unreadByAdmin),
    [conversations]
  );

  const pendingOpsCount = pendingOrders.length + pendingListings.length + pendingNegs.length;

  const openRejectPrompt = (
    title: string,
    placeholder: string,
    onConfirm: (reason: string) => void
  ) => {
    setRejectReason('');
    setRejectModal({ title, placeholder, onConfirm });
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleBalanceSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!balanceModalUser) return;
    const num = Number(balanceAmount);
    if (!num || num <= 0) {
      notify('Insere um valor positivo válido em Kz.', 'error');
      return;
    }
    try {
      adjustUserBalance(
        balanceModalUser.id,
        num,
        balanceType,
        balanceReason.trim() || (balanceType === 'add' ? 'Crédito Administrativo' : 'Débito Administrativo'),
        currentUser.id
      );
      notify(
        `${balanceType === 'add' ? 'Adicionado' : 'Debitado'} ${formatKz(num)} na conta de ${balanceModalUser.name}.`
      );
      setBalanceModalUser(null);
      setBalanceAmount('');
      setBalanceReason('');
      refresh();
    } catch (err: any) {
      notify(err?.message || 'Erro ao ajustar saldo.', 'error');
    }
  };

  const handleSaveProduct = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingProduct) return;
    try {
      if (isNewProduct) {
        if (!editingProduct.name?.trim() || !editingProduct.officialPrice) {
          notify('Preenche o nome e o preço oficial do produto.', 'error');
          return;
        }
        createProduct({
          name: editingProduct.name.trim(),
          description: editingProduct.description?.trim() || 'Artigo oficial verificado BABA SHOPPING.',
          category: editingProduct.category || 'eletronicos',
          brand: editingProduct.brand?.trim() || 'BABA Official',
          officialPrice: Number(editingProduct.officialPrice),
          suggestedResalePrice:
            Number(editingProduct.suggestedResalePrice) ||
            Math.round(Number(editingProduct.officialPrice) * 1.35),
          stock: Number(editingProduct.stock ?? 50),
          imageUrl:
            editingProduct.imageUrl?.trim() ||
            'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80',
          status: (editingProduct.status as Product['status']) || 'disponivel',
          type: 'fisico',
          createdAt: new Date().toISOString(),
          resaleEligible: true,
          deliveryTime: 'Imediato na plataforma',
          deliveryConditions: 'Custódia Digital BABA SHOPPING',
          moq: '1 unidade',
          supplierName: 'Hub Oficial BABA Angola',
          supplierRating: 4.9,
          features: ['Garantia BABA Trade Assurance', 'Elegível para Revenda P2P']
        });
        notify('Novo produto criado no catálogo oficial!');
      } else if (editingProduct.id) {
        updateProduct(editingProduct.id, {
          name: editingProduct.name,
          brand: editingProduct.brand,
          officialPrice: Number(editingProduct.officialPrice),
          suggestedResalePrice: Number(editingProduct.suggestedResalePrice),
          stock: Number(editingProduct.stock),
          status: editingProduct.status,
          imageUrl: editingProduct.imageUrl,
          description: editingProduct.description
        });
        notify(`Produto "${editingProduct.name}" atualizado!`);
      }
      setEditingProduct(null);
      refresh();
    } catch (err: any) {
      notify(err?.message || 'Erro ao guardar produto.', 'error');
    }
  };

  const filteredDeposits = useMemo(() => {
    const list =
      depositFilter === 'todos' ? deposits : deposits.filter(d => d.status === depositFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [deposits, depositFilter]);

  const filteredWithdrawals = useMemo(() => {
    const list =
      withdrawalFilter === 'todos'
        ? withdrawals
        : withdrawals.filter(w => w.status === withdrawalFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [withdrawals, withdrawalFilter]);

  const filteredUsers = useMemo(() => {
    return nonAdminUsers.filter(u => {
      if (userFilter !== 'todos' && u.accountStatus !== userFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          u.idNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [nonAdminUsers, userFilter, userSearch]);

  const selectedConv: AssistantConversation | undefined = useMemo(
    () => conversations.find(c => c.id === selectedConvId) || conversations[0],
    [conversations, selectedConvId]
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-16">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xl animate-fadeIn ${
            feedback.type === 'error'
              ? 'bg-red-950/90 border-red-500/60 text-red-200'
              : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARD PRINCIPAL DO DESIGN: MIDNIGHT NAVY & ROYAL BLUE DASHBOARD */}
      {/* ============================================================ */}
      <div className="bg-[#0A1026] border-2 border-[#0EA5E9]/70 rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(8,14,38,0.55)] space-y-5 text-white">
        {/* Header Row */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-600/35 shrink-0 border border-blue-400/40">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] sm:text-xs font-black tracking-[0.18em] text-[#38BDF8] uppercase">
                Controlo Total
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/45 text-emerald-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tempo Real Ativo</span>
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Painel do Administrador
            </h1>
            <p className="text-xs font-mono text-slate-400 truncate">
              ID ADM: {currentUser.id}
            </p>
          </div>
        </div>

        {/* Highlighted Pill Box: TOTAL DE USUÁRIOS */}
        <div className="inline-block min-w-[200px] sm:min-w-[240px] rounded-2xl bg-[#112456] border border-[#2563EB]/65 px-5 py-3.5 shadow-inner">
          <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-[#38BDF8]">
            Total de Usuários
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tabular-nums mt-0.5 leading-none">
            {nonAdminUsers.length}
          </div>
        </div>

        {/* 2x2 + Full-Width KPI Grid */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* Card 1: USUÁRIOS REGISTADOS */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className="text-left rounded-2xl bg-[#101830] hover:bg-[#141E3B] border border-slate-700/60 hover:border-[#38BDF8]/60 p-4 sm:p-5 transition-all cursor-pointer group"
          >
            <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
              Usuários Registados
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-2 leading-none">
              {nonAdminUsers.length}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-2.5 flex items-center justify-between gap-2">
              <span>No Banco de Dados</span>
              {pendingUsers.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {pendingUsers.length} BI pend.
                </span>
              )}
            </div>
          </button>

          {/* Card 2: APROVAÇÃO / VALIDAÇÃO DE BILHETE (Electric Royal Blue Gradient) */}
          <button
            type="button"
            onClick={() => setActiveTab('validacao_bi')}
            className="text-left rounded-2xl bg-gradient-to-br from-[#1D63FF] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] border border-blue-400/75 p-4 sm:p-5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Aprovação de Bilhete</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-2 leading-none">
              {pendingUsers.length}
            </div>
            <div className="text-[11px] sm:text-xs text-blue-100 mt-2.5">
              {pendingUsers.length === 1 ? 'Conta em Análise' : 'Contas em Análise'}
            </div>
          </button>

          {/* Card 3: DEPÓSITOS PEND. */}
          <button
            type="button"
            onClick={() => setActiveTab('depositos')}
            className="text-left rounded-2xl bg-[#101830] hover:bg-[#141E3B] border border-slate-700/60 hover:border-[#38BDF8]/60 p-4 sm:p-5 transition-all cursor-pointer"
          >
            <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
              Depósitos Pend.
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-2 leading-none">
              {pendingDeposits.length}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-2.5">
              Total: {deposits.length}
            </div>
          </button>

          {/* Card 4: SAQUES PEND. */}
          <button
            type="button"
            onClick={() => setActiveTab('saques')}
            className="text-left rounded-2xl bg-[#101830] hover:bg-[#141E3B] border border-slate-700/60 hover:border-amber-400/60 p-4 sm:p-5 transition-all cursor-pointer"
          >
            <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-400">
              Saques Pend.
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-2 leading-none">
              {pendingWithdrawals.length}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-2.5">
              Total: {withdrawals.length}
            </div>
          </button>

          {/* Card 5: OPERAÇÕES & CONTAS ATIVAS (Full width) */}
          <button
            type="button"
            onClick={() => setActiveTab('operacoes')}
            className="col-span-2 text-left rounded-2xl bg-[#101830] hover:bg-[#141E3B] border border-slate-700/60 hover:border-purple-400/60 p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-purple-400">
                Compras, Revendas &amp; Ativos
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-1.5 leading-none">
                {pendingOpsCount}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-2">
                Ativos verificados: {activeUsers.length} · Pedidos: {orders.length} · Revendas P2P: {listings.length} · Negociações: {negotiations.length}
              </div>
            </div>
            <div className="text-[11px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/35 px-3 py-1.5 rounded-xl self-start sm:self-center shrink-0">
              Gerir Operações →
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BARRA DE NAVEGAÇÃO INFERIOR ESTILO DOCK ESCURO */}
      {/* ============================================================ */}
      <div className="bg-[#141D35] border border-slate-700/75 rounded-2xl p-2 grid grid-cols-3 sm:grid-cols-6 gap-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => setActiveTab('validacao_bi')}
          className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === 'validacao_bi'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Aprovar BI ({pendingUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('depositos')}
          className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === 'depositos'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Depós. ({pendingDeposits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saques')}
          className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === 'saques'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Saques ({pendingWithdrawals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users ({nonAdminUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operacoes')}
          className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === 'operacoes'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Operações ({pendingOpsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ajustes')}
          className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer relative ${
            activeTab === 'ajustes'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/35'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes{escalatedConvs.length > 0 ? ` (${escalatedConvs.length})` : ''}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* CONTEÚDO DA ABA SELECIONADA (COM TODAS AS FUNCIONALIDADES) */}
      {/* ============================================================ */}
      <div className="bg-[#0A1026] border border-slate-800 rounded-3xl p-4 sm:p-6 text-white shadow-xl space-y-5">
        {/* ---------------- TAB 1: APROVAÇÃO & VALIDAÇÃO DE BILHETE (BI) ---------------- */}
        {activeTab === 'validacao_bi' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#38BDF8]" />
                  <span>Aprovação &amp; Validação de Bilhete de Identidade (BI)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Todo o usuário que cria uma conta fica em análise até que o Administrador valide o Bilhete de Identidade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  syncUsersFromFirestore()
                    .then(() => {
                      refresh();
                      notify('Lista de contas em análise atualizada.');
                    })
                    .catch(() => refresh());
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer self-start shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Atualizar Contas</span>
              </button>
            </div>

            {/* Regra Obrigatória */}
            <div className="p-4 rounded-2xl bg-[#112456]/80 border border-blue-500/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-black text-white uppercase tracking-wide">
                  Controlo de Acesso por Bilhete de Identidade (Angola)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Nenhuma nova conta pode aceder ao mercado, comprar, vender ou movimentar a carteira antes da validação documental. Confere a <strong>Frente</strong> e o <strong>Verso</strong> do BI abaixo antes de aprovar.
                </p>
              </div>
            </div>

            {/* Lista de Contas Em Análise */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Contas em Análise a Aguardar Validação ({pendingUsers.length})</span>
                </h3>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#101830] border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-black text-white">
                    Nenhuma conta em análise neste momento!
                  </h4>
                  <p className="text-xs text-slate-400">
                    Todos os Bilhetes de Identidade submetidos já foram analisados e validados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map(u => (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#101830] border border-blue-500/45 space-y-4 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white font-black text-lg flex items-center justify-center shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-black text-white truncate">
                                {u.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                                Em Análise
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 truncate">
                              {u.phone} · {u.email} · {u.city}, {u.province}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Nº do Bilhete (BI)
                          </span>
                          <span className="text-sm font-mono font-black text-[#38BDF8] tracking-wider">
                            {u.idNumber || 'Sem nº'}
                          </span>
                        </div>
                      </div>

                      {/* Pré-visualização Frente e Verso do BI */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-300">1. Frente do BI</span>
                            <button
                              type="button"
                              onClick={() => setBiModalUser(u)}
                              className="text-[#38BDF8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ampliar</span>
                            </button>
                          </div>
                          <div
                            onClick={() => setBiModalUser(u)}
                            className="aspect-[16/10] rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#38BDF8]/60 transition-colors"
                          >
                            {u.idCardFront ? (
                              <img
                                src={u.idCardFront}
                                alt={`Frente do BI de ${u.name}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-slate-500">Sem foto frontal</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-300">2. Verso do BI</span>
                            <button
                              type="button"
                              onClick={() => setBiModalUser(u)}
                              className="text-[#38BDF8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ampliar</span>
                            </button>
                          </div>
                          <div
                            onClick={() => setBiModalUser(u)}
                            className="aspect-[16/10] rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#38BDF8]/60 transition-colors"
                          >
                            {u.idCardBack ? (
                              <img
                                src={u.idCardBack}
                                alt={`Verso do BI de ${u.name}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-slate-500">Sem foto traseira</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                        <span className="text-[11px] text-slate-500">
                          Registado em: {new Date(u.createdAt).toLocaleString('pt-AO')}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openRejectPrompt(
                                `Recusar BI de ${u.name}`,
                                'Motivo da recusa do Bilhete de Identidade...',
                                reason => {
                                  rejectKYC(u.id, reason);
                                  notify(`Bilhete de ${u.name} recusado.`, 'error');
                                  refresh();
                                }
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-red-600/85 hover:bg-red-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Recusar Bilhete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              approveKYC(u.id);
                              notify(`Conta de ${u.name} validada e ativada com sucesso!`);
                              refresh();
                            }}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprovar &amp; Validar Conta</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contas Já Validadas e Ativas */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Contas Validadas pelo Administrador ({activeUsers.length})
              </h3>
              {activeUsers.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                  Nenhuma conta validada ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-[#101830] overflow-hidden">
                  {activeUsers.slice(0, 15).map(u => (
                    <div
                      key={u.id}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/60"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">{u.name}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            BI VALIDADO
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          BI: {u.idNumber} · {u.phone} · {u.province}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBiModalUser(u)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-[#38BDF8] flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver BI</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: DEPÓSITOS ---------------- */}
        {activeTab === 'depositos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-[#38BDF8]" />
                  <span>Gestão de Depósitos ({deposits.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Confere os comprovativos submetidos pelos clientes antes de creditar o saldo em Kwanzas.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['pendente', 'aprovado', 'rejeitado', 'todos'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDepositFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer ${
                      depositFilter === f
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredDeposits.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                Nenhum pedido de depósito neste filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeposits.map(d => (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{d.userName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            d.status === 'aprovado'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : d.status === 'pendente'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Método: <strong className="text-slate-200">{d.paymentMethod}</strong> · Ref:{' '}
                        <span className="font-mono text-slate-200">{d.reference}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(d.createdAt).toLocaleString('pt-AO')}
                      </div>
                      {d.rejectionReason && (
                        <div className="text-xs text-red-300">Motivo: {d.rejectionReason}</div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="text-lg font-black text-emerald-400 tabular-nums mr-2">
                        +{formatKz(d.amount)}
                      </div>
                      {d.receiptProof && (
                        <button
                          type="button"
                          onClick={() =>
                            setReceiptPreview({
                              title: `Comprovativo — ${d.userName} (${formatKz(d.amount)})`,
                              src: d.receiptProof!
                            })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Comprovativo</span>
                        </button>
                      )}
                      {d.status === 'pendente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              approveDeposit(d.id);
                              notify(`Depósito de ${formatKz(d.amount)} aprovado!`);
                              refresh();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openRejectPrompt(
                                `Recusar depósito de ${d.userName}`,
                                'Indica o motivo da recusa...',
                                reason => {
                                  rejectDeposit(d.id, reason);
                                  notify('Depósito recusado.');
                                  refresh();
                                }
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white cursor-pointer"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: SAQUES ---------------- */}
        {activeTab === 'saques' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                  <span>Gestão de Levantamentos / Saques ({withdrawals.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verifica o IBAN e o titular antes de marcar o levantamento como processado.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['pendente', 'processado', 'rejeitado', 'todos'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setWithdrawalFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer ${
                      withdrawalFilter === f
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                Nenhum pedido de saque neste filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWithdrawals.map(w => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{w.userName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            w.status === 'processado'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : w.status === 'pendente'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Banco: <strong>{w.bankName}</strong> · Titular: <strong>{w.accountHolder}</strong>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8]">
                        <span>{w.iban}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(w.iban, w.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                          title="Copiar IBAN"
                        >
                          {copiedId === w.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(w.createdAt).toLocaleString('pt-AO')}
                      </div>
                      {w.rejectionReason && (
                        <div className="text-xs text-red-300">Motivo: {w.rejectionReason}</div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="text-lg font-black text-amber-400 tabular-nums mr-2">
                        {formatKz(w.amount)}
                      </div>
                      {w.status === 'pendente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                processWithdrawal(w.id, 'processado');
                                notify(`Saque de ${formatKz(w.amount)} aprovado!`);
                                refresh();
                              } catch (err: any) {
                                notify(err?.message || 'Erro ao aprovar saque.', 'error');
                              }
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openRejectPrompt(
                                `Recusar saque de ${w.userName}`,
                                'Motivo da recusa...',
                                reason => {
                                  processWithdrawal(w.id, 'rejeitado', reason);
                                  notify('Saque recusado.');
                                  refresh();
                                }
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white cursor-pointer"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 4: USERS & KYC ---------------- */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#38BDF8]" />
                  <span>Utilizadores, BI (KYC) &amp; Saldos ({nonAdminUsers.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Valida Bilhetes de Identidade, ajusta saldos manualmente, suspende ou remove contas.
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Procurar nome, BI, telefone..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#101830] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'todos', label: `Todos (${nonAdminUsers.length})` },
                  { id: 'em_processamento', label: `BI Pendente (${pendingUsers.length})` },
                  { id: 'ativo', label: `Ativos (${activeUsers.length})` },
                  { id: 'suspenso', label: 'Suspensos' },
                  { id: 'rejeitado', label: 'Rejeitados' }
                ] as const
              ).map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUserFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    userFilter === f.id
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                Nenhum utilizador encontrado.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(u => {
                  const uWallet = getWallet(u.id);
                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white">{u.name}</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                              u.accountStatus === 'ativo'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : u.accountStatus === 'em_processamento'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.accountStatus === 'suspenso'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                          <span className="text-[11px] font-mono text-[#38BDF8]">
                            BI: {u.idNumber || 'Pendente'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {u.phone} · {u.email} · {u.city}, {u.province}
                        </div>
                        <div className="text-xs font-bold text-emerald-400 tabular-nums">
                          Saldo Disponível: {formatKz(uWallet.availableBalance)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setBiModalUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Ver BI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBalanceModalUser(u);
                            setBalanceType('add');
                            setBalanceAmount('');
                            setBalanceReason('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Ajustar Saldo</span>
                        </button>

                        {u.accountStatus === 'em_processamento' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                approveKYC(u.id);
                                notify(`BI e conta de ${u.name} aprovados!`);
                                refresh();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                            >
                              Aprovar BI
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openRejectPrompt(
                                  `Recusar BI de ${u.name}`,
                                  'Motivo da recusa do BI...',
                                  reason => {
                                    rejectKYC(u.id, reason);
                                    notify(`BI de ${u.name} recusado.`, 'error');
                                    refresh();
                                  }
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white cursor-pointer"
                            >
                              Recusar BI
                            </button>
                          </>
                        )}

                        {u.accountStatus === 'ativo' && (
                          <button
                            type="button"
                            onClick={() =>
                              openRejectPrompt(
                                `Suspender conta de ${u.name}`,
                                'Motivo da suspensão...',
                                reason => {
                                  suspendUser(u.id, reason);
                                  notify(`Conta de ${u.name} suspensa.`);
                                  refresh();
                                }
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspender</span>
                          </button>
                        )}

                        {u.accountStatus === 'suspenso' && (
                          <button
                            type="button"
                            onClick={() => {
                              reactivateUser(u.id);
                              notify(`Conta de ${u.name} reativada!`);
                              refresh();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                          >
                            Reativar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            deleteUserAccount(u.id);
                            notify(`Conta de ${u.name} eliminada.`);
                            refresh();
                          }}
                          className="p-2 rounded-xl bg-red-950/80 hover:bg-red-800 border border-red-700/60 text-red-300 cursor-pointer"
                          title="Eliminar Conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 5: OPERAÇÕES (PEDIDOS, REVENDAS, NEGOCIAÇÕES) ---------------- */}
        {activeTab === 'operacoes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                  <span>Compras, Revendas P2P &amp; Negociações</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Gere todas as aprovações de pedidos de compra, anúncios de revenda e propostas.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setOpsSubTab('pedidos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    opsSubTab === 'pedidos'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Pedidos ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOpsSubTab('revendas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    opsSubTab === 'revendas'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Anúncios P2P ({listings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOpsSubTab('negociacoes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    opsSubTab === 'negociacoes'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Negociações ({negotiations.length})
                </button>
              </div>
            </div>

            {opsSubTab === 'pedidos' && (
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                    Nenhum pedido registado.
                  </div>
                ) : (
                  orders.map(ord => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white">
                            {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-[#38BDF8]">
                            {getOrderStatusLabel(ord.status)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Comprador: <strong className="text-slate-200">{ord.buyerName}</strong> · Ref:{' '}
                          <span className="font-mono">{ord.paymentReference}</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-400 tabular-nums">
                          {formatKz(ord.totalAmount)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {ord.status === 'aguardando_aprovacao' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  approveOrder(ord.id);
                                  notify('Pedido aprovado e entregue ao cliente!');
                                  refresh();
                                } catch (err: any) {
                                  notify(err?.message || 'Erro ao aprovar pedido.', 'error');
                                }
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                            >
                              Aprovar Pedido
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openRejectPrompt(
                                  `Recusar pedido de ${ord.buyerName}`,
                                  'Motivo da recusa...',
                                  reason => {
                                    rejectOrder(ord.id, reason);
                                    notify('Pedido recusado.');
                                    refresh();
                                  }
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white cursor-pointer"
                            >
                              Recusar
                            </button>
                          </>
                        ) : (
                          <select
                            value={ord.status}
                            onChange={e => {
                              updateOrderStatus(ord.id, e.target.value as OrderStatus);
                              notify('Estado do pedido atualizado.');
                              refresh();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
                          >
                            <option value="pagamento_confirmado">Pagamento Confirmado</option>
                            <option value="em_preparacao">Em Preparação</option>
                            <option value="enviado">Enviado</option>
                            <option value="em_entrega">Em Entrega</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {opsSubTab === 'revendas' && (
              <div className="space-y-3">
                {listings.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                    Nenhum anúncio de revenda encontrado.
                  </div>
                ) : (
                  listings.map(lst => (
                    <div
                      key={lst.id}
                      className="p-4 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={lst.imageUrl}
                          alt={lst.productName}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white truncate">
                              {lst.productName}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-slate-800 text-[#38BDF8]">
                              {lst.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Vendedor: {lst.sellerName} · Preço: {formatKz(lst.listingPrice)}
                          </div>
                        </div>
                      </div>
                      {lst.status === 'pendente' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              approveResaleListing(lst.id);
                              notify('Anúncio aprovado no Mercado P2P!');
                              refresh();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openRejectPrompt(
                                `Recusar anúncio "${lst.productName}"`,
                                'Motivo da recusa...',
                                reason => {
                                  rejectResaleListing(lst.id, reason);
                                  notify('Anúncio recusado.');
                                  refresh();
                                }
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white cursor-pointer"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {opsSubTab === 'negociacoes' && (
              <div className="space-y-3">
                {negotiations.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                    Nenhuma negociação registada.
                  </div>
                ) : (
                  negotiations.map(neg => (
                    <div
                      key={neg.id}
                      className="p-4 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white">{neg.productName}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-slate-800 text-amber-300">
                            {neg.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Comprador: {neg.buyerName} · Vendedor: {neg.sellerName} · Proposta:{' '}
                          <strong className="text-white">{formatKz(neg.currentProposedPrice)}</strong>
                        </div>
                      </div>
                      {neg.status === 'aguardando_adm' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              approveNegotiationProposal(neg.id);
                              notify('Proposta aprovada!');
                              refresh();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openRejectPrompt(
                                `Recusar proposta de ${neg.buyerName}`,
                                'Motivo...',
                                reason => {
                                  rejectNegotiationProposal(neg.id, reason);
                                  notify('Proposta recusada.');
                                  refresh();
                                }
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white cursor-pointer"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 6: AJUSTES (SUPORTE JENIFFER & CATÁLOGO) ---------------- */}
        {activeTab === 'ajustes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#38BDF8]" />
                  <span>Ajustes, Atendimento &amp; Catálogo Oficial</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Responde a clientes encaminhados pela Assistente Jeniffer e gere os produtos oficiais.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('suporte')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    settingsSubTab === 'suporte'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Atendimento ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('catalogo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    settingsSubTab === 'catalogo'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Catálogo ({products.length})
                </button>
              </div>
            </div>

            {settingsSubTab === 'suporte' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {conversations.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#101830] border border-slate-800 text-center text-xs text-slate-400">
                      Nenhuma conversa de suporte ainda.
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => {
                          setSelectedConvId(conv.id);
                          markAssistantConversationRead(conv.id, 'admin');
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          selectedConv?.id === conv.id
                            ? 'bg-[#112456] border-[#2563EB]'
                            : 'bg-[#101830] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white truncate">
                            {conv.userName}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              conv.status === 'aguardando_adm'
                                ? 'bg-orange-500/25 text-orange-300'
                                : conv.status === 'resolvido'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {conv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-1">
                          {conv.lastMessagePreview || conv.title}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="lg:col-span-7 rounded-2xl bg-[#101830] border border-slate-800 flex flex-col h-[420px] overflow-hidden">
                  {!selectedConv ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                      Seleciona uma conversa para responder ao cliente.
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-white">{selectedConv.userName}</div>
                          <div className="text-[10px] text-slate-400">
                            {selectedConv.userPhone} · {selectedConv.userProvince}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            adminUpdateAssistantStatus(
                              selectedConv.id,
                              selectedConv.status === 'resolvido' ? 'ativo' : 'resolvido'
                            );
                            notify('Estado do atendimento atualizado.');
                            refresh();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-400 cursor-pointer"
                        >
                          {selectedConv.status === 'resolvido' ? 'Reabrir' : 'Marcar Resolvido'}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                        {selectedConv.messages.map(m => (
                          <div
                            key={m.id}
                            className={`flex flex-col ${
                              m.sender === 'admin' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <span className="text-[10px] text-slate-500 mb-0.5 px-1">
                              {m.senderName}
                            </span>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                m.sender === 'admin'
                                  ? 'bg-[#2563EB] text-white'
                                  : m.sender === 'jeniffer'
                                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                  : 'bg-slate-900 text-white border border-slate-700'
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          if (!replyText.trim()) return;
                          adminReplyAssistantConversation(
                            selectedConv.id,
                            currentUser,
                            replyText.trim()
                          );
                          setReplyText('');
                          notify('Resposta enviada ao cliente!');
                          refresh();
                        }}
                        className="p-3 border-t border-slate-800 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Escreve a resposta oficial do Administrador..."
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                        />
                        <button
                          type="submit"
                          disabled={!replyText.trim()}
                          className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}

            {settingsSubTab === 'catalogo' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Produtos Oficiais do Catálogo ({products.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProduct(true);
                      setEditingProduct({
                        name: '',
                        brand: 'BABA Official',
                        category: 'eletronicos',
                        officialPrice: 25000,
                        suggestedResalePrice: 35000,
                        stock: 50,
                        status: 'disponivel',
                        imageUrl: '',
                        description: ''
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Produto</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {products.map(prod => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-2xl bg-[#101830] border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{prod.name}</div>
                          <div className="text-[11px] text-[#38BDF8] font-black tabular-nums">
                            {formatKz(prod.officialPrice)} · Stock: {prod.stock}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewProduct(false);
                          setEditingProduct({ ...prod });
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0"
                        title="Editar Produto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL DE VISUALIZAÇÃO DO BI */}
      {/* ============================================================ */}
      {biModalUser && (
        <div
          onClick={() => setBiModalUser(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0A1026] border border-blue-500/50 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  Bilhete de Identidade — {biModalUser.name}
                </h3>
                <p className="text-xs font-mono text-[#38BDF8]">BI: {biModalUser.idNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setBiModalUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300">Frente do BI</div>
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
                  {biModalUser.idCardFront ? (
                    <img
                      src={biModalUser.idCardFront}
                      alt="Frente BI"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Sem imagem</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300">Verso do BI</div>
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
                  {biModalUser.idCardBack ? (
                    <img
                      src={biModalUser.idCardBack}
                      alt="Verso BI"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Sem imagem</span>
                  )}
                </div>
              </div>
            </div>

            {biModalUser.accountStatus === 'em_processamento' && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    approveKYC(biModalUser.id);
                    notify(`BI e conta de ${biModalUser.name} aprovados!`);
                    setBiModalUser(null);
                    refresh();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                >
                  Aprovar BI &amp; Ativar Conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = biModalUser;
                    setBiModalUser(null);
                    openRejectPrompt(
                      `Recusar BI de ${target.name}`,
                      'Indica o motivo da recusa...',
                      reason => {
                        rejectKYC(target.id, reason);
                        notify(`BI de ${target.name} recusado.`, 'error');
                        refresh();
                      }
                    );
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white cursor-pointer"
                >
                  Recusar BI
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE AJUSTE DE SALDO MANUAL */}
      {/* ============================================================ */}
      {balanceModalUser && (
        <div
          onClick={() => setBalanceModalUser(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleBalanceSubmit}
            className="bg-[#0A1026] border border-blue-500/50 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Ajustar Saldo da Carteira</h3>
                <p className="text-xs text-slate-400">{balanceModalUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setBalanceModalUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBalanceType('add')}
                className={`py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                  balanceType === 'add'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                + Adicionar Saldo
              </button>
              <button
                type="button"
                onClick={() => setBalanceType('remove')}
                className={`py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                  balanceType === 'remove'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                - Debitar Saldo
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Montante (Kz): *</label>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  min="1"
                  required
                  placeholder="Ex: 10000"
                  className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white font-bold tabular-nums focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Motivo / Nota:</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  placeholder="Ex: Bónus ou correção administrativa"
                  className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBalanceModalUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-black cursor-pointer"
              >
                Confirmar Ajuste
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE COMPROVATIVO */}
      {/* ============================================================ */}
      {receiptPreview && (
        <div
          onClick={() => setReceiptPreview(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0A1026] border border-blue-500/50 rounded-3xl max-w-xl w-full p-4 space-y-3 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-black text-white">{receiptPreview.title}</span>
              <button
                type="button"
                onClick={() => setReceiptPreview(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[70vh]">
              <img
                src={receiptPreview.src}
                alt={receiptPreview.title}
                className="max-w-full max-h-[68vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE RECUSA / SUSPENSÃO */}
      {/* ============================================================ */}
      {rejectModal && (
        <div
          onClick={() => setRejectModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              if (!rejectReason.trim()) return;
              rejectModal.onConfirm(rejectReason.trim());
              setRejectModal(null);
            }}
            className="bg-[#0A1026] border border-red-500/50 rounded-3xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl"
          >
            <h3 className="text-base font-black text-white">{rejectModal.title}</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              required
              placeholder={rejectModal.placeholder}
              className="w-full p-3 rounded-xl bg-[#101830] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE EDITAR / CRIAR PRODUTO OFICIAL */}
      {/* ============================================================ */}
      {editingProduct && (
        <div
          onClick={() => setEditingProduct(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSaveProduct}
            className="bg-[#0A1026] border border-blue-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-3.5 text-white shadow-2xl my-auto text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {isNewProduct ? 'Adicionar Produto Oficial' : 'Editar Produto Oficial'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Nome do Produto: *</label>
              <input
                type="text"
                value={editingProduct.name || ''}
                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Preço Oficial (Kz): *</label>
                <input
                  type="number"
                  value={editingProduct.officialPrice || 0}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, officialPrice: Number(e.target.value) })
                  }
                  required
                  className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Revenda Sugerida (Kz):</label>
                <input
                  type="number"
                  value={editingProduct.suggestedResalePrice || 0}
                  onChange={e =>
                    setEditingProduct({
                      ...editingProduct,
                      suggestedResalePrice: Number(e.target.value)
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Stock:</label>
                <input
                  type="number"
                  value={editingProduct.stock ?? 0}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Marca:</label>
                <input
                  type="text"
                  value={editingProduct.brand || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">URL da Imagem:</label>
              <input
                type="text"
                value={editingProduct.imageUrl || ''}
                onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Descrição:</label>
              <textarea
                rows={2}
                value={editingProduct.description || ''}
                onChange={e =>
                  setEditingProduct({ ...editingProduct, description: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-[#101830] border border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white font-black cursor-pointer"
              >
                Guardar Produto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
