import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Users,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  AlertCircle,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  Maximize2,
  X,
  CreditCard,
  ShoppingBag,
  Handshake,
  MessageSquare,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Send,
  Check,
  ExternalLink,
  Tag,
  Plus,
  Minus,
  Wallet,
  SlidersHorizontal,
  ArrowUpDown,
  Ban,
  Zap,
  Star,
  Settings,
  Shield,
  Download,
  Upload,
  UserPlus,
  Layers,
  MessageCircle,
  Sparkle,
  Trash2,
  Package
} from 'lucide-react';
import {
  getUsers,
  approveKYC,
  rejectKYC,
  suspendUser,
  reactivateUser,
  deleteUserAccount,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  processWithdrawal,
  getResaleListings,
  getAllResaleListings,
  approveResaleListing,
  rejectResaleListing,
  purchaseResaleListing,
  createNegotiation,
  getNegotiations,
  approveNegotiationProposal,
  rejectNegotiationProposal,
  sendNegotiationMessage,
  respondBuyerNegotiation,
  getOrders,
  approveOrder,
  rejectOrder,
  getWallet,
  formatKz,
  adjustUserBalance,
  dispatchDbChange,
  syncUsersFromFirestore,
  syncAdminCollectionsFromFirestore,
  getAllTransactions,
  DB_STATE_EVENT
} from '../services/db';
import { User, DepositRequest, WithdrawalRequest, ResaleListing, Negotiation, Transaction, Order } from '../types';

export interface BuyerPersona {
  id: string;
  name: string;
  avatarColor: string;
  location: string;
  phone: string;
  discountPercent: number;
  defaultMessage: string;
}

export const DEFAULT_PERSONAS: BuyerPersona[] = [
  {
    id: 'persona_1',
    name: 'Manuel Baptista Silva',
    avatarColor: 'from-blue-600 to-indigo-700',
    location: 'Luanda (Talatona)',
    phone: '+244 923 881 204',
    discountPercent: 12,
    defaultMessage: 'Olá boa tarde amigo! Tenho interesse no artigo e disponho deste valor pronto na carteira para fecharmos negócio já hoje. Aceitas?'
  },
  {
    id: 'persona_2',
    name: 'Teresa Domingos André',
    avatarColor: 'from-rose-500 to-pink-600',
    location: 'Luanda (Kilamba)',
    phone: '+244 945 112 879',
    discountPercent: 18,
    defaultMessage: 'Boa tarde! O produto está completo e bem conservado? Consigo transferir este montante agora mesmo se concordares com a proposta.'
  },
  {
    id: 'persona_3',
    name: 'João Pedro Fernandes',
    avatarColor: 'from-emerald-600 to-teal-700',
    location: 'Benguela (Centro)',
    phone: '+244 931 445 601',
    discountPercent: 22,
    defaultMessage: 'Saudações! Procuro este artigo com urgência para a minha loja. Se fizeres este valor em conta, fecho negócio no minuto!'
  },
  {
    id: 'persona_4',
    name: 'Ana Paula Kassoma',
    avatarColor: 'from-purple-600 to-fuchsia-700',
    location: 'Huíla (Lubango)',
    phone: '+244 912 334 990',
    discountPercent: 26,
    defaultMessage: 'Olá! Sou compradora frequente no BABA SHOPPING. Fazes por este valor para compensar a entrega? Aguardo a tua confirmação.'
  },
  {
    id: 'persona_5',
    name: 'Carlos Mateus Gouveia',
    avatarColor: 'from-amber-500 to-orange-600',
    location: 'Luanda (Viana)',
    phone: '+244 926 778 123',
    discountPercent: 30,
    defaultMessage: 'Boas amigo! Tenho o saldo disponível na conta BABA para transferência imediata. Se aceitares podemos concluir já.'
  }
];

interface AdminPanelProps {
  currentUser: User;
  onNavigateToMarket?: () => void;
  onNavigateToMyProducts?: () => void;
  onRefreshState?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onNavigateToMarket,
  onNavigateToMyProducts,
  onRefreshState
}) => {
  // Navigation tabs - Default is 'members' (Total de Usuário) as requested
  const [activeTab, setActiveTab] = useState<'members' | 'deposits' | 'withdrawals' | 'kyc' | 'resale_market' | 'negotiations' | 'live' | 'overview'>('members');

  // Live state from db
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [deposits, setDeposits] = useState<DepositRequest[]>(() => getDeposits());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => getWithdrawals());
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>(() => getResaleListings());
  const [allResaleListings, setAllResaleListings] = useState<ResaleListing[]>(() => getAllResaleListings());
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [negotiations, setNegotiations] = useState<Negotiation[]>(() => getNegotiations(currentUser.id));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getAllTransactions());
  const [liveFilter, setLiveFilter] = useState<'all' | 'pendente' | 'deposito' | 'saque' | 'pedidos' | 'kyc' | 'revenda' | 'transacoes'>('all');
  const [syncTick, setSyncTick] = useState(0);

  // Local notifications / alerts
  const [actionAlert, setActionAlert] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Members Directory & Balance Management State
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'ativo' | 'em_processamento' | 'rejeitado' | 'suspenso'>('all');
  const [memberProvinceFilter, setMemberProvinceFilter] = useState('all');
  const [memberSortBy, setMemberSortBy] = useState<'number_asc' | 'number_desc' | 'balance_desc' | 'balance_asc' | 'name_asc'>('number_asc');

  // Balance Adjustment Modal State
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number | string>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Filters & Search for other tabs
  const [kycFilter, setKycFilter] = useState<'em_processamento' | 'ativo' | 'rejeitado' | 'suspenso' | 'all'>('em_processamento');
  const [kycSearch, setKycSearch] = useState('');

  const [depositFilter, setDepositFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [depositSearch, setDepositSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pendente' | 'processado' | 'rejeitado'>('pendente');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  const [resaleSearch, setResaleSearch] = useState('');
  const [resaleCategory, setResaleCategory] = useState('all');

  // Document Zoom Modal
  const [zoomedDoc, setZoomedDoc] = useState<{ title: string; src: string; userName?: string } | null>(null);

  // Reject KYC Modal
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Fotografia do Bilhete de Identidade ilegível. Por favor, carrega uma fotografia nítida da frente e do verso.');
  const [kycRejectionError, setKycRejectionError] = useState<string | null>(null);

  // Reject Movement Modal (Todos os movimentos: Depósitos, Saques, Pedidos, Anúncios e Propostas)
  const [rejectingMovement, setRejectingMovement] = useState<
    | { type: 'deposit'; item: DepositRequest }
    | { type: 'withdrawal'; item: WithdrawalRequest }
    | { type: 'order'; item: Order }
    | { type: 'listing'; item: ResaleListing }
    | { type: 'negotiation'; item: Negotiation }
    | null
  >(null);
  const [movementRejectionReason, setMovementRejectionReason] = useState('');
  const [movementRejectionError, setMovementRejectionError] = useState<string | null>(null);

  // Suspend / Delete User Modals
  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('Conta suspensa temporariamente pelo Administrador para verificação de segurança.');
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Receipt Zoom Modal
  const [zoomedReceipt, setZoomedReceipt] = useState<{ title: string; src: string; deposit: DepositRequest } | null>(null);

  // Admin Direct Buy Confirmation Modal
  const [buyingListing, setBuyingListing] = useState<ResaleListing | null>(null);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);

  // Admin Multi-Persona Negotiation Modal (1 a 5 Conversas com Nomes Diferentes)
  const [negotiatingListing, setNegotiatingListing] = useState<ResaleListing | null>(null);
  const [personaOffers, setPersonaOffers] = useState<Record<string, { name: string; price: number; message: string; isLaunching?: boolean }>>({});
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(['persona_1']);
  const [isBatchLaunching, setIsBatchLaunching] = useState(false);
  const [activeNegotiationProductFilter, setActiveNegotiationProductFilter] = useState<string>('all');

  // Selected Active Negotiation Chat (live-synced from negotiations list)
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const liveSelectedNegotiation = useMemo(() => {
    if (!selectedNegotiation) return null;
    return negotiations.find(n => n.id === selectedNegotiation.id) || selectedNegotiation;
  }, [negotiations, selectedNegotiation]);
  const [chatMessage, setChatMessage] = useState('');
  const [counterPriceInput, setCounterPriceInput] = useState<number>(0);

  // Sync with database events
  const refreshData = () => {
    setUsers([...getUsers()]);
    setDeposits([...getDeposits()]);
    setWithdrawals([...getWithdrawals()]);
    setResaleListings([...getResaleListings()]);
    setAllResaleListings([...getAllResaleListings()]);
    setOrders([...getOrders()]);
    setNegotiations([...getNegotiations(currentUser.id)]);
    setTransactions([...getAllTransactions()]);
    setSyncTick(t => t + 1);
    if (onRefreshState) onRefreshState();
  };

  const handleManualRefresh = () => {
    refreshData();
    syncUsersFromFirestore().then(synced => {
      setUsers([...synced]);
      setSyncTick(t => t + 1);
    });
    syncAdminCollectionsFromFirestore().then(() => {
      refreshData();
    });
  };

  useEffect(() => {
    syncUsersFromFirestore().then(synced => {
      setUsers([...synced]);
      setSyncTick(t => t + 1);
    });
    syncAdminCollectionsFromFirestore().then(() => {
      refreshData();
    });
    const handleDbChange = () => refreshData();
    const handleFocusSync = () => handleManualRefresh();
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        handleManualRefresh();
      }
    };
    window.addEventListener(DB_STATE_EVENT, handleDbChange);
    window.addEventListener('storage', handleDbChange);
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleVisibilitySync);
    return () => {
      window.removeEventListener(DB_STATE_EVENT, handleDbChange);
      window.removeEventListener('storage', handleDbChange);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [currentUser.id]);

  const showAlert = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionAlert({ msg, type });
    setTimeout(() => setActionAlert(null), 4000);
  };

  // -------------------------------------------------------------
  // KYC Actions
  // -------------------------------------------------------------
  const handleApproveKYC = (u: User) => {
    try {
      approveKYC(u.id);
      showAlert(`Cadastro de ${u.name} (BI: ${u.idNumber}) aprovado com sucesso!`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aprovar cadastro.', 'error');
    }
  };

  const handleConfirmRejectKYC = () => {
    if (!rejectingUser) return;
    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setKycRejectionError('Por favor, escreve o motivo da rejeição do Bilhete de Identidade.');
      return;
    }
    try {
      rejectKYC(rejectingUser.id, cleanReason);
      showAlert(`Cadastro de ${rejectingUser.name} rejeitado. O utilizador foi notificado com o motivo.`, 'error');
      setRejectingUser(null);
      setKycRejectionError(null);
      refreshData();
    } catch (err: any) {
      setKycRejectionError(err.message || 'Erro ao rejeitar cadastro.');
    }
  };

  // -------------------------------------------------------------
  // Deposits Actions
  // -------------------------------------------------------------
  const formatPaymentMethodLabel = (method?: string) => {
    if (method === 'multicaixa_express') return 'Multicaixa Express (933 191 188)';
    if (method === 'paypay') return 'PayPay (Ent: 10116 | Ref: 935 723 248)';
    if (method === 'transferencia') return 'Transferência Bancária';
    if (method === 'referencia') return 'Pagamento por Referência';
    return method || 'Multicaixa Express';
  };

  const handleApproveDeposit = (d: DepositRequest) => {
    try {
      approveDeposit(d.id);
      showAlert(`Depósito de ${formatKz(d.amount)} para ${d.userName} aprovado e creditado na carteira!`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aprovar depósito.', 'error');
    }
  };

  const handleRejectDeposit = (d: DepositRequest) => {
    setRejectingMovement({ type: 'deposit', item: d });
    setMovementRejectionReason('');
    setMovementRejectionError(null);
  };

  // -------------------------------------------------------------
  // Withdrawals Actions
  // -------------------------------------------------------------
  const handleApproveWithdrawal = (w: WithdrawalRequest) => {
    try {
      processWithdrawal(w.id, 'processado');
      showAlert(`Levantamento de ${formatKz(w.amount)} aprovado, debitado da conta de ${w.userName} e marcado como Sucesso no extrato!`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aprovar levantamento.', 'error');
    }
  };

  const handleRejectWithdrawal = (w: WithdrawalRequest) => {
    setRejectingMovement({ type: 'withdrawal', item: w });
    setMovementRejectionReason('');
    setMovementRejectionError(null);
  };

  // -------------------------------------------------------------
  // Orders (Compras Oficiais e P2P), Anúncios de Revenda & Propostas
  // -------------------------------------------------------------
  const handleApproveOrder = (o: Order) => {
    try {
      approveOrder(o.id);
      showAlert(
        `Compra de ${formatKz(o.totalAmount)} de ${o.buyerName} aprovada! Saldo debitado e artigo entregue.`,
        'success'
      );
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aprovar pedido de compra.', 'error');
    }
  };

  const handleRejectOrder = (o: Order) => {
    setRejectingMovement({ type: 'order', item: o });
    setMovementRejectionReason('');
    setMovementRejectionError(null);
  };

  const handleApproveListing = (l: ResaleListing) => {
    try {
      approveResaleListing(l.id);
      showAlert(`Anúncio "${l.productName}" de ${l.sellerName} aprovado e publicado no Mercado de Revenda!`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aprovar anúncio de revenda.', 'error');
    }
  };

  const handleRejectListing = (l: ResaleListing) => {
    setRejectingMovement({ type: 'listing', item: l });
    setMovementRejectionReason('');
    setMovementRejectionError(null);
  };

  const handleApproveNegotiation = (n: Negotiation) => {
    try {
      approveNegotiationProposal(n.id);
      showAlert(`Proposta de ${formatKz(n.currentProposedPrice)} de ${n.buyerName} aprovada e enviada para ${n.sellerName}!`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aprovar proposta de negociação.', 'error');
    }
  };

  const handleRejectNegotiation = (n: Negotiation) => {
    setRejectingMovement({ type: 'negotiation', item: n });
    setMovementRejectionReason('');
    setMovementRejectionError(null);
  };

  const handleConfirmRejectMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingMovement) return;
    const cleanReason = movementRejectionReason.trim();
    if (!cleanReason) {
      setMovementRejectionError('Por favor, escreve o motivo da rejeição para informar o utilizador.');
      return;
    }
    try {
      if (rejectingMovement.type === 'deposit') {
        const dep = rejectingMovement.item;
        rejectDeposit(dep.id, cleanReason);
        showAlert(`Depósito de ${formatKz(dep.amount)} recusado. Motivo enviado a ${dep.userName}.`, 'error');
      } else if (rejectingMovement.type === 'withdrawal') {
        const wth = rejectingMovement.item;
        processWithdrawal(wth.id, 'rejeitado', cleanReason);
        showAlert(`Saque de ${formatKz(wth.amount)} recusado. O saldo de ${wth.userName} não foi debitado e o motivo foi registado.`, 'error');
      } else if (rejectingMovement.type === 'order') {
        const ord = rejectingMovement.item;
        rejectOrder(ord.id, cleanReason);
        showAlert(`Compra de ${formatKz(ord.totalAmount)} recusada. O saldo de ${ord.buyerName} não foi debitado.`, 'error');
      } else if (rejectingMovement.type === 'listing') {
        const lst = rejectingMovement.item;
        rejectResaleListing(lst.id, cleanReason);
        showAlert(`Anúncio "${lst.productName}" recusado. O artigo regressou ao inventário de ${lst.sellerName}.`, 'error');
      } else if (rejectingMovement.type === 'negotiation') {
        const neg = rejectingMovement.item;
        rejectNegotiationProposal(neg.id, cleanReason);
        showAlert(`Proposta de ${neg.buyerName} recusada pelo Administrador.`, 'error');
      }
      setRejectingMovement(null);
      setMovementRejectionReason('');
      setMovementRejectionError(null);
      refreshData();
    } catch (err: any) {
      setMovementRejectionError(err.message || 'Erro ao registar rejeição.');
    }
  };

  // -------------------------------------------------------------
  // Resale Market (Admin Buy & Negotiate)
  // -------------------------------------------------------------
  const handleConfirmAdminBuy = () => {
    if (!buyingListing) return;
    setIsProcessingBuy(true);
    try {
      // Ensure admin has sufficient funds
      const adminWallet = getWallet(currentUser.id);
      if (adminWallet.availableBalance < buyingListing.listingPrice) {
        adminWallet.availableBalance += buyingListing.listingPrice + 5000000;
        adminWallet.totalDeposited += buyingListing.listingPrice + 5000000;
      }

      purchaseResaleListing(buyingListing.id, currentUser.id, buyingListing.listingPrice);
      showAlert(`Produto "${buyingListing.productName}" comprado com sucesso pelo Administrador por ${formatKz(buyingListing.listingPrice)}! O vendedor ${buyingListing.sellerName} recebeu o valor na carteira.`, 'success');
      setBuyingListing(null);
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao comprar produto do utilizador.', 'error');
    } finally {
      setIsProcessingBuy(false);
    }
  };

  // Multi-Persona Negotiation Handlers (O Administrador pode abrir 1 a 5 conversas e trocar mensagens até acordo)
  const handleOpenPersonaModal = (item: ResaleListing) => {
    setNegotiatingListing(item);
    // Por padrão seleciona todas as 5 conversas para poder trocar mensagens em todas até chegarem a um acordo
    setSelectedPersonaIds(DEFAULT_PERSONAS.map(p => p.id));
    const initialOffers: Record<string, { name: string; price: number; message: string }> = {};
    DEFAULT_PERSONAS.forEach((p) => {
      const discounted = Math.round(item.listingPrice * (1 - p.discountPercent / 100));
      // Round to nearest 500 Kz
      const cleanPrice = Math.max(1000, Math.round(discounted / 500) * 500);
      initialOffers[p.id] = {
        name: p.name,
        price: cleanPrice,
        message: p.defaultMessage
      };
    });
    setPersonaOffers(initialOffers);
  };

  const handleSelectPersonaCount = (count: number) => {
    const clamped = Math.max(1, Math.min(5, count));
    const ids = DEFAULT_PERSONAS.slice(0, clamped).map(p => p.id);
    setSelectedPersonaIds(ids);
  };

  const handleTogglePersona = (id: string) => {
    setSelectedPersonaIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          showAlert('Deves selecionar pelo menos 1 conversa para negociar.', 'info');
          return prev;
        }
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleStartSinglePersona = (persona: BuyerPersona) => {
    if (!negotiatingListing) return;
    const offer = personaOffers[persona.id] || {
      name: persona.name,
      price: Math.max(1000, Math.round(negotiatingListing.listingPrice * (1 - persona.discountPercent / 100))),
      message: persona.defaultMessage
    };

    if (offer.price <= 0) {
      showAlert('Por favor insere um montante válido superior a 0 Kz.', 'error');
      return;
    }

    try {
      const buyerId = `persona_${persona.id}_${negotiatingListing.id}`;
      createNegotiation(
        negotiatingListing.id,
        buyerId,
        offer.price,
        offer.message.trim() || persona.defaultMessage,
        offer.name.trim() || persona.name
      );
      showAlert(`Proposta enviada em nome de "${offer.name}" por ${formatKz(offer.price)}! O vendedor verá como cliente individual.`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao iniciar conversa.', 'error');
    }
  };

  const handleStartSelectedPersonas = () => {
    if (!negotiatingListing) return;
    if (selectedPersonaIds.length === 0) {
      showAlert('Por favor escolhe pelo menos 1 conversa para começar a negociar.', 'error');
      return;
    }
    setIsBatchLaunching(true);
    try {
      let createdCount = 0;
      DEFAULT_PERSONAS.forEach((persona) => {
        if (!selectedPersonaIds.includes(persona.id)) return;
        const buyerId = `persona_${persona.id}_${negotiatingListing.id}`;
        const alreadyExists = negotiations.some(n => n.listingId === negotiatingListing.id && n.buyerId === buyerId);
        if (!alreadyExists) {
          const offer = personaOffers[persona.id] || {
            name: persona.name,
            price: Math.max(1000, Math.round(negotiatingListing.listingPrice * (1 - persona.discountPercent / 100))),
            message: persona.defaultMessage
          };
          createNegotiation(
            negotiatingListing.id,
            buyerId,
            offer.price,
            offer.message.trim() || persona.defaultMessage,
            offer.name.trim() || persona.name
          );
          createdCount++;
        }
      });
      if (createdCount > 0) {
        showAlert(`Sucesso! Iniciaste ${createdCount} conversa${createdCount === 1 ? '' : 's'} com o vendedor com nome${createdCount === 1 ? '' : 's'} diferente${createdCount === 1 ? '' : 's'}. O vendedor verá como ${createdCount === 1 ? 'cliente individual' : 'compradores reais distintos'}!`, 'success');
      } else {
        showAlert('As conversas selecionadas já tinham sido iniciadas.', 'info');
      }
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao iniciar conversas selecionadas.', 'error');
    } finally {
      setIsBatchLaunching(false);
    }
  };

  const handleConcludePurchase = (neg: Negotiation) => {
    if (neg.status !== 'aceite') {
      showAlert(
        'Para concluir por negociação, troca conversa com o vendedor nesta proposta até chegarem a um acordo ("Acordo Aceite!").',
        'info'
      );
      return;
    }
    try {
      purchaseResaleListing(neg.listingId, currentUser.id, neg.currentProposedPrice);
      showAlert(`Compra concluída com sucesso por ${formatKz(neg.currentProposedPrice)}! O vendedor ${neg.sellerName} recebeu o saldo na carteira.`, 'success');
      setSelectedNegotiation(null);
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao concluir compra.', 'error');
    }
  };

  const handleAcceptSellerCounterOffer = (neg: Negotiation) => {
    try {
      const updated = respondBuyerNegotiation(neg.id, 'aceitar');
      setSelectedNegotiation(updated);
      showAlert(`Acordo fechado com ${neg.sellerName} por ${formatKz(updated.currentProposedPrice)}! Já podes concluir o pagamento.`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao aceitar valor do vendedor.', 'error');
    }
  };

  const handleSendPersonaChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedNegotiation || !chatMessage.trim()) return;
    try {
      const updated = sendNegotiationMessage(
        liveSelectedNegotiation.id,
        liveSelectedNegotiation.buyerId,
        liveSelectedNegotiation.buyerName,
        chatMessage.trim()
      );
      setSelectedNegotiation(updated);
      setChatMessage('');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao enviar mensagem.', 'error');
    }
  };

  const handleSendPersonaCounterOffer = () => {
    if (!liveSelectedNegotiation || counterPriceInput <= 0) {
      showAlert('Por favor insere um valor de contraproposta válido.', 'error');
      return;
    }
    try {
      const updated = sendNegotiationMessage(
        liveSelectedNegotiation.id,
        liveSelectedNegotiation.buyerId,
        liveSelectedNegotiation.buyerName,
        `Envio nova proposta de preço: ${formatKz(counterPriceInput)}. Podemos fechar por este valor?`,
        counterPriceInput
      );
      setSelectedNegotiation(updated);
      setCounterPriceInput(updated.currentProposedPrice);
      showAlert(`Nova proposta de ${formatKz(updated.currentProposedPrice)} enviada como ${liveSelectedNegotiation.buyerName}!`, 'success');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao enviar contraproposta.', 'error');
    }
  };

  // Counts for badges
  const pendingKycCount = useMemo(() => users.filter(u => u.accountStatus === 'em_processamento').length, [users]);
  const pendingDepositsCount = useMemo(() => deposits.filter(d => d.status === 'pendente').length, [deposits]);
  const pendingWithdrawalsCount = useMemo(() => withdrawals.filter(w => w.status === 'pendente').length, [withdrawals]);
  const activeUserListings = useMemo(() => resaleListings.filter(l => l.status === 'ativo'), [resaleListings]);
  const pendingOrdersList = useMemo(() => orders.filter(o => o.status === 'aguardando_aprovacao'), [orders]);
  const pendingListingsList = useMemo(() => allResaleListings.filter(l => l.status === 'pendente'), [allResaleListings]);
  const pendingNegotiationsList = useMemo(() => negotiations.filter(n => n.status === 'aguardando_adm'), [negotiations]);

  // Filtered lists (prioritiza contas em revisão mais recentes no topo)
  const filteredUsers = useMemo(() => {
    const statusPriority: Record<string, number> = {
      em_processamento: 0,
      rejeitado: 1,
      suspenso: 2,
      ativo: 3
    };
    return users
      .filter(u => {
        if (kycFilter !== 'all' && u.accountStatus !== kycFilter) return false;
        if (kycSearch.trim()) {
          const q = kycSearch.toLowerCase();
          const matchName = u.name.toLowerCase().includes(q);
          const matchBi = (u.idNumber || '').toLowerCase().includes(q);
          const matchPhone = (u.phone || '').toLowerCase().includes(q);
          const matchEmail = (u.email || '').toLowerCase().includes(q);
          const matchProv = (u.province || '').toLowerCase().includes(q);
          if (!matchName && !matchBi && !matchPhone && !matchEmail && !matchProv) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pa = statusPriority[a.accountStatus] ?? 4;
        const pb = statusPriority[b.accountStatus] ?? 4;
        if (pa !== pb) return pa - pb;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [users, kycFilter, kycSearch]);

  const filteredDeposits = useMemo(() => {
    return deposits.filter(d => {
      if (depositFilter !== 'all' && d.status !== depositFilter) return false;
      if (depositSearch.trim()) {
        const q = depositSearch.toLowerCase();
        const matchUser = (d.userName || '').toLowerCase().includes(q);
        const matchRef = (d.reference || '').toLowerCase().includes(q);
        const matchMethod = (d.paymentMethod || '').toLowerCase().includes(q);
        if (!matchUser && !matchRef && !matchMethod) return false;
      }
      return true;
    });
  }, [deposits, depositFilter, depositSearch]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
      if (withdrawalSearch.trim()) {
        const q = withdrawalSearch.toLowerCase();
        const matchUser = (w.userName || '').toLowerCase().includes(q);
        const matchBank = (w.bankName || '').toLowerCase().includes(q);
        const matchIban = (w.iban || '').toLowerCase().includes(q);
        if (!matchUser && !matchBank && !matchIban) return false;
      }
      return true;
    });
  }, [withdrawals, withdrawalFilter, withdrawalSearch]);

  const filteredResale = useMemo(() => {
    return activeUserListings.filter(l => {
      if (resaleCategory !== 'all' && l.category !== resaleCategory) return false;
      if (resaleSearch.trim()) {
        const q = resaleSearch.toLowerCase();
        const matchTitle = l.productName.toLowerCase().includes(q);
        const matchSeller = l.sellerName.toLowerCase().includes(q);
        const matchDesc = (l.customDescription || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSeller && !matchDesc) return false;
      }
      return true;
    });
  }, [activeUserListings, resaleCategory, resaleSearch]);

  // -------------------------------------------------------------
  // Member Balance & Account Actions
  // -------------------------------------------------------------
  const handleOpenBalanceModal = (u: User, type: 'add' | 'remove' = 'add') => {
    setAdjustingUser(u);
    setAdjustType(type);
    setAdjustAmount('');
    setAdjustReason(type === 'add' ? 'Crédito manual pelo Administrador' : 'Débito manual pelo Administrador');
  };

  const handleAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const num = Number(adjustAmount);
    if (isNaN(num) || num <= 0) {
      showAlert('Por favor insere um montante válido superior a 0 Kz.', 'error');
      return;
    }
    const userWallet = getWallet(adjustingUser.id);
    if (adjustType === 'remove' && userWallet.availableBalance < num) {
      showAlert(`Saldo insuficiente. O membro dispõe apenas de ${formatKz(userWallet.availableBalance)}.`, 'error');
      return;
    }
    setIsAdjusting(true);
    try {
      adjustUserBalance(
        adjustingUser.id,
        num,
        adjustType,
        adjustReason.trim() || (adjustType === 'add' ? 'Crédito administrativo' : 'Débito administrativo'),
        currentUser.id
      );
      showAlert(
        `Sucesso! ${adjustType === 'add' ? 'Creditados' : 'Debitado'} ${formatKz(num)} na carteira de ${adjustingUser.name}.`,
        'success'
      );
      setAdjustingUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao processar ajuste de saldo.', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleToggleMemberStatus = (u: User) => {
    try {
      if (u.accountStatus === 'ativo') {
        setSuspendingUser(u);
        setSuspensionReason('Conta suspensa temporariamente pelo Administrador para verificação de segurança.');
      } else if (u.accountStatus === 'suspenso') {
        reactivateUser(u.id);
        showAlert(`A conta de ${u.name} foi reativada com sucesso!`, 'success');
        refreshData();
      } else {
        approveKYC(u.id);
        showAlert(`A conta de ${u.name} foi aprovada e ativada com sucesso!`, 'success');
        refreshData();
      }
    } catch (err: any) {
      showAlert(err.message || 'Erro ao alterar estado do membro.', 'error');
    }
  };

  const handleConfirmSuspendUser = () => {
    if (!suspendingUser) return;
    try {
      suspendUser(suspendingUser.id, suspensionReason);
      showAlert(`A conta de ${suspendingUser.name} foi suspensa com sucesso.`, 'error');
      setSuspendingUser(null);
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao suspender utilizador.', 'error');
    }
  };

  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    try {
      const deletedName = deletingUser.name;
      deleteUserAccount(deletingUser.id);
      setDeletingUser(null);
      showAlert(`A conta de ${deletedName} foi eliminada permanentemente.`, 'error');
      refreshData();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao eliminar conta do utilizador.', 'error');
    }
  };

  // Aggregated System Balances
  const totalSystemBalances = useMemo(() => {
    return users.reduce((acc, u) => acc + (getWallet(u.id)?.availableBalance || 0), 0);
  }, [users, syncTick]);

  const activeMembersCount = useMemo(() => {
    return users.filter(u => u.accountStatus === 'ativo').length;
  }, [users]);

  // Angolan Provinces for filtering
  const angolaProvinces = [
    'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Cuanza Sul', 'Cuanza Norte',
    'Uíge', 'Malanje', 'Namibe', 'Zaire', 'Lunda Norte', 'Lunda Sul', 'Moxico',
    'Bié', 'Cunene', 'Cuando Cubango', 'Bengo'
  ];

  // Filtered and Sorted Members List
  const filteredMembers = useMemo(() => {
    const list = users.filter(u => {
      if (memberStatusFilter !== 'all' && u.accountStatus !== memberStatusFilter) return false;
      if (memberProvinceFilter !== 'all' && u.province !== memberProvinceFilter) return false;
      if (memberSearch.trim()) {
        const q = memberSearch.toLowerCase().trim();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchBi = (u.idNumber || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchProv = (u.province || '').toLowerCase().includes(q);
        const matchCity = (u.city || '').toLowerCase().includes(q);
        const matchId = (u.id || '').toLowerCase().includes(q);
        if (!matchName && !matchBi && !matchPhone && !matchEmail && !matchProv && !matchCity && !matchId) {
          return false;
        }
      }
      return true;
    });

    list.sort((a, b) => {
      if (memberSortBy === 'balance_desc') {
        return (getWallet(b.id)?.availableBalance || 0) - (getWallet(a.id)?.availableBalance || 0);
      }
      if (memberSortBy === 'balance_asc') {
        return (getWallet(a.id)?.availableBalance || 0) - (getWallet(b.id)?.availableBalance || 0);
      }
      if (memberSortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (memberSortBy === 'number_desc') {
        return users.indexOf(b) - users.indexOf(a);
      }
      // default: number_asc
      return users.indexOf(a) - users.indexOf(b);
    });

    return list;
  }, [users, memberSearch, memberStatusFilter, memberProvinceFilter, memberSortBy, syncTick]);

  const pendingDepositsList = useMemo(() => deposits.filter(d => d.status === 'pendente'), [deposits]);
  const pendingWithdrawalsList = useMemo(() => withdrawals.filter(w => w.status === 'pendente'), [withdrawals]);
  const pendingKycList = useMemo(() => users.filter(u => u.accountStatus === 'em_processamento'), [users]);
  const totalAllPendingCount =
    pendingDepositsList.length +
    pendingWithdrawalsList.length +
    pendingKycList.length +
    pendingOrdersList.length +
    pendingListingsList.length +
    pendingNegotiationsList.length;

  // Live movements stream for 'AO VIVO' view (TODOS os movimentos da plataforma sem exceção!)
  const liveMovements = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'deposito' | 'saque' | 'pedido' | 'kyc' | 'transacao' | 'revenda' | 'negociacao';
      title: string;
      desc: string;
      time: string;
      rawTime: number;
      amount?: number;
      statusLabel: 'Pendente' | 'Sucesso' | 'Recusada' | 'Ativo';
      isPending?: boolean;
      color: 'emerald' | 'amber' | 'purple' | 'cyan' | 'red' | 'orange';
      depositObj?: DepositRequest;
      withdrawalObj?: WithdrawalRequest;
      orderObj?: Order;
      listingObj?: ResaleListing;
      negotiationObj?: Negotiation;
      kycUser?: User;
    }> = [];

    deposits.forEach(d => {
      const ts = new Date(d.createdAt || 0).getTime();
      const statusLabel = d.status === 'aprovado' ? 'Sucesso' : d.status === 'rejeitado' ? 'Recusada' : 'Pendente';
      list.push({
        id: `mov_dep_${d.id}`,
        type: 'deposito',
        title: `Depósito (${formatPaymentMethodLabel(d.paymentMethod)})`,
        desc: `${d.userName} • Ref: ${d.reference}${d.status === 'rejeitado' && d.rejectionReason ? ` • Motivo: ${d.rejectionReason}` : ''}`,
        time: new Date(d.createdAt || Date.now()).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: isNaN(ts) ? Date.now() : ts,
        amount: d.amount,
        statusLabel,
        isPending: d.status === 'pendente',
        color: d.status === 'aprovado' ? 'emerald' : d.status === 'rejeitado' ? 'red' : 'cyan',
        depositObj: d
      });
    });

    withdrawals.forEach(w => {
      const ts = new Date(w.createdAt || 0).getTime();
      const statusLabel = w.status === 'processado' ? 'Sucesso' : w.status === 'rejeitado' ? 'Recusada' : 'Pendente';
      list.push({
        id: `mov_wit_${w.id}`,
        type: 'saque',
        title: `Saque para ${w.bankName || 'Banco Angola'}`,
        desc: `${w.userName} • IBAN: ${w.iban || 'AO06...'}${w.status === 'rejeitado' && w.rejectionReason ? ` • Motivo: ${w.rejectionReason}` : ''}`,
        time: new Date(w.createdAt || Date.now()).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: isNaN(ts) ? Date.now() : ts,
        amount: w.amount,
        statusLabel,
        isPending: w.status === 'pendente',
        color: w.status === 'processado' ? 'emerald' : w.status === 'rejeitado' ? 'red' : 'amber',
        withdrawalObj: w
      });
    });

    orders.forEach(o => {
      const ts = new Date(o.createdAt || 0).getTime();
      const statusLabel =
        o.status === 'aguardando_aprovacao'
          ? 'Pendente'
          : o.status === 'cancelado'
          ? 'Recusada'
          : 'Sucesso';
      const itemSummary = o.items.map(it => `${it.quantity}x ${it.name}${it.selectedColor ? ` (${it.selectedColor})` : ''}`).join(', ');
      list.push({
        id: `mov_ord_${o.id}`,
        type: 'pedido',
        title: o.source === 'revenda' ? `Compra P2P: ${itemSummary}` : `Compra Oficial: ${itemSummary}`,
        desc: `Comprador: ${o.buyerName}${o.sellerName ? ` ← Vendedor: ${o.sellerName}` : ''}${o.status === 'cancelado' && o.rejectionReason ? ` • Motivo: ${o.rejectionReason}` : ''}`,
        time: new Date(o.createdAt || Date.now()).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: isNaN(ts) ? Date.now() : ts,
        amount: o.totalAmount,
        statusLabel,
        isPending: o.status === 'aguardando_aprovacao',
        color: statusLabel === 'Sucesso' ? 'emerald' : statusLabel === 'Recusada' ? 'red' : 'amber',
        orderObj: o
      });
    });

    transactions.forEach(tx => {
      // Evita duplicar os tx_dep_ / tx_wth_ / tx_ord_ que já estão listados acima com botões de aprovação
      if (tx.id.startsWith('tx_dep_') || tx.id.startsWith('tx_wth_') || tx.id.startsWith('tx_ord_')) return;
      const ts = new Date(tx.createdAt || 0).getTime();
      const statusLabel = tx.status === 'confirmada' ? 'Sucesso' : tx.status === 'recusada' ? 'Recusada' : 'Pendente';
      list.push({
        id: `mov_tx_${tx.id}`,
        type: 'transacao',
        title: tx.description || 'Movimento Financeiro',
        desc: `${tx.userName} • Ref: ${tx.reference}${tx.rejectionReason ? ` • Motivo: ${tx.rejectionReason}` : ''}`,
        time: new Date(tx.createdAt || Date.now()).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: isNaN(ts) ? Date.now() : ts,
        amount: Math.abs(tx.amount),
        statusLabel,
        isPending: tx.status === 'pendente',
        color: tx.status === 'confirmada' ? 'emerald' : tx.status === 'recusada' ? 'red' : 'amber'
      });
    });

    users
      .filter(u => u.role !== 'admin')
      .forEach(u => {
        const ts = new Date(u.createdAt || 0).getTime();
        const isPendingKyc = u.accountStatus === 'em_processamento';
        const isRejectedKyc = u.accountStatus === 'rejeitado';
        list.push({
          id: `mov_kyc_${u.id}`,
          type: 'kyc',
          title: isPendingKyc ? 'Validação de BI Submetida' : isRejectedKyc ? 'Validação de BI Recusada' : 'Validação de BI Aprovada',
          desc: `${u.name} • BI: ${u.idNumber} (${u.province || 'Angola'})${isRejectedKyc && u.rejectionReason ? ` • Motivo: ${u.rejectionReason}` : ''}`,
          time: u.createdAt ? new Date(u.createdAt).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente',
          rawTime: isNaN(ts) ? Date.now() : ts,
          statusLabel: isPendingKyc ? 'Pendente' : isRejectedKyc ? 'Recusada' : 'Sucesso',
          isPending: isPendingKyc,
          color: isRejectedKyc ? 'red' : isPendingKyc ? 'purple' : 'emerald',
          kycUser: u
        });
      });

    allResaleListings.forEach(l => {
      const ts = new Date(l.createdAt || 0).getTime();
      const statusLabel =
        l.status === 'pendente'
          ? 'Pendente'
          : l.status === 'rejeitado'
          ? 'Recusada'
          : l.status === 'vendido'
          ? 'Sucesso'
          : 'Ativo';
      list.push({
        id: `mov_lst_${l.id}`,
        type: 'revenda',
        title: `Anúncio de Revenda: ${l.productName}`,
        desc: `Vendedor: ${l.sellerName} • Preço: ${formatKz(l.listingPrice)}${l.status === 'rejeitado' && l.rejectionReason ? ` • Motivo: ${l.rejectionReason}` : ''}`,
        time: new Date(l.createdAt || Date.now()).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: isNaN(ts) ? Date.now() : ts,
        amount: l.listingPrice,
        statusLabel,
        isPending: l.status === 'pendente',
        color: l.status === 'rejeitado' ? 'red' : l.status === 'pendente' ? 'amber' : 'orange',
        listingObj: l
      });
    });

    negotiations.forEach(n => {
      const ts = new Date(n.updatedAt || n.createdAt || 0).getTime();
      const isPendingNeg = n.status === 'aguardando_adm';
      const statusLabel =
        n.status === 'concluida' || n.status === 'aceite'
          ? 'Sucesso'
          : n.status === 'recusada'
          ? 'Recusada'
          : isPendingNeg || n.status === 'pendente'
          ? 'Pendente'
          : 'Ativo';
      list.push({
        id: `mov_neg_${n.id}`,
        type: 'negociacao',
        title: `Proposta de Negociação: ${n.productName}`,
        desc: `${n.buyerName} ⇄ ${n.sellerName} (${isPendingNeg ? 'Aguarda Adm' : n.status})${n.adminRejectionReason ? ` • Motivo: ${n.adminRejectionReason}` : ''}`,
        time: new Date(n.updatedAt || n.createdAt || Date.now()).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        rawTime: isNaN(ts) ? Date.now() : ts,
        amount: n.currentProposedPrice,
        statusLabel,
        isPending: isPendingNeg,
        color: n.status === 'recusada' ? 'red' : isPendingNeg ? 'purple' : 'cyan',
        negotiationObj: n
      });
    });

    list.sort((a, b) => b.rawTime - a.rawTime);
    return list;
  }, [deposits, withdrawals, orders, transactions, users, allResaleListings, negotiations]);

  const filteredLiveMovements = useMemo(() => {
    return liveMovements.filter(m => {
      if (liveFilter === 'all') return true;
      if (liveFilter === 'pendente') return Boolean(m.isPending);
      if (liveFilter === 'deposito') return m.type === 'deposito';
      if (liveFilter === 'saque') return m.type === 'saque';
      if (liveFilter === 'pedidos') return m.type === 'pedido';
      if (liveFilter === 'transacoes') return m.type === 'transacao' || m.type === 'pedido';
      if (liveFilter === 'kyc') return m.type === 'kyc';
      if (liveFilter === 'revenda') return m.type === 'revenda' || m.type === 'negociacao';
      return true;
    });
  }, [liveMovements, liveFilter]);

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-16 animate-fadeIn">
      {/* Toast Alert */}
      {actionAlert && (
        <div
          className={`fixed top-3 left-3 right-3 sm:left-auto sm:top-5 sm:right-5 z-[100] sm:max-w-md w-auto sm:w-full p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 animate-fadeIn ${
            actionAlert.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500 shadow-emerald-900/30'
              : actionAlert.type === 'info'
              ? 'bg-blue-950 text-blue-100 border-blue-500 shadow-blue-900/30'
              : 'bg-red-950 text-red-100 border-red-500 shadow-red-900/30'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : actionAlert.type === 'info' ? (
              <Sparkle className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold leading-tight">{actionAlert.msg}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAINEL DO ADMINISTRADOR - DESIGN CLARO, FÁCIL E INTUITIVO */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* PAINEL DO ADMINISTRADOR - DESIGN EXECUTIVO PREMIUM (IMG_3642) */}
      {/* ======================================================== */}
      <div className="bg-[#0B132B] rounded-[32px] p-5 sm:p-7 border border-blue-900/40 shadow-2xl space-y-5 text-white">
        {/* Top Header matching IMG_3642 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-950 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center border-2 border-blue-400/30 shadow-lg shadow-blue-600/30 shrink-0">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#5BC0BE]">
                  CONTROLO TOTAL
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0c2e3a] text-[#48E5C2] border border-[#48E5C2]/40 text-[10px] font-black tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#48E5C2] animate-pulse" />
                  TEMPO REAL ATIVO
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight mt-1">
                Painel do Administrador
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                ID ADM: <span className="text-slate-200 font-bold">kt5dFLArJzV7hCNMQ3ZvgqFokM62</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto max-w-full">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3.5 py-2.5 rounded-xl bg-[#131E3A] hover:bg-[#1a284c] border border-blue-900/50 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Atualizar dados do painel"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Atualizar</span>
            </button>
            {onNavigateToMarket && (
              <button
                type="button"
                onClick={onNavigateToMarket}
                className="px-4 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#e05d00] text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-orange-600/30"
                title="Ver Mercado de Revenda onde os usuários anunciam produtos"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                <span>Produtos dos Usuários</span>
              </button>
            )}
            {onNavigateToMyProducts && (
              <button
                type="button"
                onClick={onNavigateToMyProducts}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                title="Abrir Meus Produtos (Inventário para Revenda)"
              >
                <Package className="w-4 h-4 text-neutral-950" />
                <span>Meus Produtos</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. TOTAL DE USUÁRIOS (Highlight Box) */}
        <div
          onClick={() => setActiveTab('members')}
          className={`rounded-2xl border-2 p-5 shadow-lg transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'border-blue-400 bg-blue-900/40 ring-2 ring-blue-500/50'
              : 'border-blue-500/80 bg-blue-950/20 hover:bg-blue-950/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black tracking-widest text-blue-300 uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>1. TOTAL DE USUÁRIOS</span>
            </div>
            <span className="text-xs font-bold text-cyan-300 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-500/30">
              Ver Tabela de Membros & Gerir Saldos ➔
            </span>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white mt-1.5 tabular-nums">
            {users.length}
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
            <span>{activeMembersCount} Contas Ativas</span>
            <span>•</span>
            <span>Saldo em Carteiras: {formatKz(totalSystemBalances)}</span>
          </div>
        </div>

        {/* 4 Cards organized in the exact order requested: Depósito Pendente, Saques Pendente, Validar Bilhete, Produtos a Venda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 2. DEPÓSITOS PENDENTES */}
          <div
            onClick={() => { setActiveTab('deposits'); setDepositFilter('pendente'); }}
            className={`p-5 rounded-2xl bg-[#131E3A] border transition-all cursor-pointer text-left ${
              activeTab === 'deposits' ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20' : 'border-blue-900/40 hover:border-emerald-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-emerald-400">
                <Download className="w-4 h-4" />
                2. DEPÓSITOS PEND.
              </span>
              {pendingDepositsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black animate-pulse">
                  {pendingDepositsCount}
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-white mt-1 tabular-nums">
              {pendingDepositsCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Multicaixa Express • Total: {deposits.length}
            </div>
          </div>

          {/* 3. SAQUES PENDENTES */}
          <div
            onClick={() => { setActiveTab('withdrawals'); setWithdrawalFilter('pendente'); }}
            className={`p-5 rounded-2xl bg-[#131E3A] border transition-all cursor-pointer text-left ${
              activeTab === 'withdrawals' ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-950/20' : 'border-blue-900/40 hover:border-purple-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-purple-400">
                <Upload className="w-4 h-4" />
                3. SAQUES PEND.
              </span>
              {pendingWithdrawalsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black animate-pulse">
                  {pendingWithdrawalsCount}
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-white mt-1 tabular-nums">
              {pendingWithdrawalsCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Transferências IBAN • Total: {withdrawals.length}
            </div>
          </div>

          {/* 4. VALIDAR BILHETE */}
          <div
            onClick={() => {
              setActiveTab('kyc');
              setKycFilter(pendingKycCount > 0 ? 'em_processamento' : 'all');
              syncUsersFromFirestore().then(synced => setUsers([...synced]));
            }}
            className={`p-5 rounded-2xl bg-[#131E3A] border transition-all cursor-pointer text-left ${
              activeTab === 'kyc' ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20' : 'border-blue-900/40 hover:border-rose-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-rose-400">
                <FileText className="w-4 h-4" />
                4. VALIDAR BILHETE
              </span>
              {pendingKycCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {pendingKycCount}
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-white mt-1 tabular-nums">
              {pendingKycCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Dossiês KYC Frente/Verso
            </div>
          </div>

          {/* 5. PRODUTOS A VENDA POR USUÁRIO PARA NEGOCIAR */}
          <div
            onClick={() => setActiveTab('resale_market')}
            className={`p-5 rounded-2xl bg-[#131E3A] border transition-all cursor-pointer text-left ${
              activeTab === 'resale_market' ? 'border-orange-500 ring-2 ring-orange-500/40 bg-orange-950/20' : 'border-orange-500/40 hover:border-orange-400'
            }`}
          >
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-orange-400">
                <ShoppingBag className="w-4 h-4" />
                5. PRODUTOS A VENDA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                {activeUserListings.length}
              </span>
            </div>
            <div className="text-3xl font-black text-white mt-1 tabular-nums">
              {activeUserListings.length}
            </div>
            <div className="text-xs text-orange-200 mt-1 font-semibold">
              Negociar (Personas) ou Comprar Já ➔
            </div>
          </div>
        </div>

        {/* Executive Bottom Navigation Dock Bar matching exact requested order */}
        <div className="pt-2">
          <div className="bg-[#080E1E] border border-blue-900/60 p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full max-w-full text-xs font-bold shadow-inner">
            {/* 1. TOTAL DE USUÁRIOS */}
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-300" />
              <span>1. TOTAL DE USUÁRIOS</span>
              <span className="text-[10px] opacity-80">({users.length})</span>
            </button>

            {/* 2. DEPÓSITO PENDENTE */}
            <button
              type="button"
              onClick={() => { setActiveTab('deposits'); setDepositFilter('pendente'); }}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'deposits'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>2. DEPÓSITOS PEND.</span>
              <span className="text-[10px] opacity-80">({pendingDepositsCount})</span>
            </button>

            {/* 3. SAQUES PENDENTE */}
            <button
              type="button"
              onClick={() => { setActiveTab('withdrawals'); setWithdrawalFilter('pendente'); }}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'withdrawals'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4 text-purple-300" />
              <span>3. SAQUES PEND.</span>
              <span className="text-[10px] opacity-80">({pendingWithdrawalsCount})</span>
            </button>

            {/* 4. VALIDAR BILHETE */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('kyc');
                setKycFilter(pendingKycCount > 0 ? 'em_processamento' : 'all');
                syncUsersFromFirestore().then(synced => setUsers([...synced]));
              }}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'kyc'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-300" />
              <span>4. VALIDAR BILHETE</span>
              <span className="text-[10px] opacity-80">({pendingKycCount})</span>
            </button>

            {/* 5. PRODUTOS A VENDA POR USUÁRIO PARA NEGOCIAR */}
            <button
              type="button"
              onClick={() => setActiveTab('resale_market')}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'resale_market'
                  ? 'bg-[#FF6A00] text-white shadow-md shadow-orange-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>5. PRODUTOS A VENDA</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-amber-300 text-[10px]">
                {activeUserListings.length}
              </span>
            </button>

            {/* 6. MESA DE NEGOCIAÇÃO (PERSONAS) */}
            <button
              type="button"
              onClick={() => setActiveTab('negotiations')}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'negotiations'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Handshake className="w-4 h-4 text-indigo-300" />
              <span>MESA DE PERSONAS</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-indigo-200 text-[10px]">
                {negotiations.length}
              </span>
            </button>

            {/* 7. AO VIVO */}
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>AO VIVO</span>
              <span className="text-[10px] opacity-80">({liveMovements.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* CAIXA DE APROVAÇÃO IMEDIATA: TODOS OS MOVIMENTOS PENDENTES DA PLATAFORMA */}
      {totalAllPendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-amber-400 shadow-lg space-y-4 animate-fadeIn text-neutral-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-neutral-900">
                  Todos os Movimentos Pendentes para Aprovar ({totalAllPendingCount})
                </h2>
                <p className="text-[11px] text-neutral-600">
                  Nenhum depósito, saque, BI, compra, anúncio ou proposta avança sem a tua aprovação ou rejeição com motivo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab('live'); setLiveFilter('pendente'); }}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 text-amber-400 text-xs font-black hover:bg-neutral-800 cursor-pointer self-start sm:self-auto"
            >
              Ver Todos ao Vivo ({liveMovements.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pendingDepositsList.map(d => (
              <div key={d.id} className="p-3.5 rounded-2xl bg-white border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Depósito Pendente</span>
                    <span className="font-black text-sm text-neutral-900 truncate">{d.userName}</span>
                  </div>
                  <div className="text-xs text-neutral-600 truncate">
                    {formatPaymentMethodLabel(d.paymentMethod)} • Ref: <strong className="font-mono">{d.reference}</strong>
                  </div>
                  <div className="text-base font-black text-emerald-600 tabular-nums">+{formatKz(d.amount)}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {d.receiptProof && (
                    <button
                      type="button"
                      onClick={() => setZoomedReceipt({ title: `Comprovativo - ${d.userName} (${formatKz(d.amount)})`, src: d.receiptProof!, deposit: d })}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-900 text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Talão</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRejectDeposit(d)}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveDeposit(d)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aprovar</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingWithdrawalsList.map(w => (
              <div key={w.id} className="p-3.5 rounded-2xl bg-white border border-purple-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black uppercase">Saque Pendente</span>
                    <span className="font-black text-sm text-neutral-900 truncate">{w.userName}</span>
                  </div>
                  <div className="text-xs text-neutral-600 truncate">
                    {w.bankName} • <span className="font-mono">{w.iban}</span>
                  </div>
                  <div className="text-base font-black text-purple-700 tabular-nums">-{formatKz(w.amount)}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRejectWithdrawal(w)}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveWithdrawal(w)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aprovar & Debitar</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingKycList.map(u => (
              <div key={u.id} className="p-3.5 rounded-2xl bg-white border border-rose-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase">Validação de BI</span>
                    <span className="font-black text-sm text-neutral-900 truncate">{u.name}</span>
                  </div>
                  <div className="text-xs text-neutral-600 truncate">
                    BI: <strong className="font-mono">{u.idNumber}</strong> • {u.province || 'Angola'}
                  </div>
                  <div className="text-[11px] font-bold text-rose-600">{u.phone}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('kyc'); setKycFilter('em_processamento'); }}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-900 text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver BI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingUser(u);
                      setRejectionReason('Fotografia do Bilhete de Identidade ilegível. Por favor, carrega uma fotografia nítida da frente e do verso.');
                      setKycRejectionError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveKYC(u)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aprovar BI</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingOrdersList.map(o => {
              const itemsText = o.items.map(it => `${it.quantity}x ${it.name}${it.selectedColor ? ` (${it.selectedColor})` : ''}`).join(', ');
              return (
                <div key={o.id} className="p-3.5 rounded-2xl bg-white border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${o.source === 'revenda' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-900'}`}>
                        {o.source === 'revenda' ? 'Compra Revenda P2P' : 'Compra Mercado Oficial'}
                      </span>
                      <span className="font-black text-sm text-neutral-900 truncate">{o.buyerName}</span>
                    </div>
                    <div className="text-xs text-neutral-700 font-semibold truncate">{itemsText}</div>
                    <div className="text-base font-black text-[#FF6A00] tabular-nums">-{formatKz(o.totalAmount)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRejectOrder(o)}
                      className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                    >
                      Recusar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveOrder(o)}
                      className="px-3 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#e05d00] text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{o.source === 'revenda' ? 'Aprovar Compra P2P' : 'Aprovar & Entregar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingListingsList.map(l => (
              <div key={l.id} className="p-3.5 rounded-2xl bg-white border border-orange-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={l.imageUrl}
                    alt={l.productName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase">Anúncio Revenda</span>
                      <span className="font-black text-sm text-neutral-900 truncate">{l.sellerName}</span>
                    </div>
                    <div className="text-xs text-neutral-700 font-semibold truncate">{l.productName}</div>
                    <div className="text-xs text-neutral-500">
                      Original: {formatKz(l.originalPrice)} → <strong className="text-orange-700 font-black">{formatKz(l.listingPrice)}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRejectListing(l)}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveListing(l)}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aprovar Anúncio</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingNegotiationsList.map(n => (
              <div key={n.id} className="p-3.5 rounded-2xl bg-white border border-indigo-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">Proposta P2P</span>
                    <span className="font-black text-sm text-neutral-900 truncate">{n.buyerName} → {n.sellerName}</span>
                  </div>
                  <div className="text-xs text-neutral-700 font-semibold truncate">{n.productName}</div>
                  <div className="text-xs text-neutral-500">
                    Anunciado: {formatKz(n.listedPrice)} • Proposta: <strong className="text-indigo-700 font-black">{formatKz(n.currentProposedPrice)}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRejectNegotiation(n)}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveNegotiation(n)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aprovar Envio</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingKycCount > 0 && activeTab !== 'kyc' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-950">
                {pendingKycCount} {pendingKycCount === 1 ? 'documento BI aguarda validação' : 'documentos BI aguardam validação'}
              </p>
              <p className="text-xs text-rose-800">
                Novos utilizadores enviaram os dados e fotos do Bilhete de Identidade e estão em revisão até aceitares.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('kyc');
              setKycFilter('em_processamento');
              syncUsersFromFirestore().then(synced => setUsers([...synced]));
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validar Bilhetes Agora</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: FEED AO VIVO EM TEMPO REAL (TODOS OS MOVIMENTOS)    */}
      {/* ======================================================== */}
      {activeTab === 'live' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-[#0B132B] border border-blue-900/40 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                  <Zap className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Todos os Movimentos ao Vivo na Plataforma</h2>
                  <p className="text-xs text-slate-400">Fluxo completo e em tempo real de depósitos, saques, compras, anúncios, validações de BI e negociações para aprovação.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-xs font-black self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Monitorização Ativa ({liveMovements.length})
              </span>
            </div>

            {/* Quick Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-blue-950">
              <div className="p-3.5 rounded-2xl bg-[#131E3A] border border-blue-900/40">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Movimentos</div>
                <div className="text-xl font-black text-white mt-0.5">{liveMovements.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#131E3A] border border-blue-900/40">
                <div className="text-[10px] font-bold uppercase text-amber-400">Pendentes de Aprovação</div>
                <div className="text-xl font-black text-white mt-0.5">{totalAllPendingCount}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#131E3A] border border-blue-900/40">
                <div className="text-[10px] font-bold uppercase text-emerald-400">Depósitos / Saques Pend.</div>
                <div className="text-xl font-black text-white mt-0.5">{pendingDepositsCount} / {pendingWithdrawalsCount}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#131E3A] border border-blue-900/40">
                <div className="text-[10px] font-bold uppercase text-cyan-400">Pedidos & BI Pend.</div>
                <div className="text-xl font-black text-white mt-0.5">{pendingOrdersList.length} / {pendingKycCount}</div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 text-xs">
              {[
                { id: 'all', label: `Todos (${liveMovements.length})` },
                { id: 'pendente', label: `Pendentes (${liveMovements.filter(m => m.isPending).length})` },
                { id: 'deposito', label: `Depósitos (${deposits.length})` },
                { id: 'saque', label: `Saques (${withdrawals.length})` },
                { id: 'pedidos', label: `Compras & Pedidos (${orders.length})` },
                { id: 'kyc', label: `BI (${pendingKycCount} pend.)` },
                { id: 'revenda', label: `Anúncios & Propostas (${allResaleListings.length + negotiations.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    liveFilter === tab.id
                      ? 'bg-cyan-500 text-neutral-950 font-black'
                      : 'bg-[#131E3A] text-slate-300 hover:bg-[#1a284c]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Activity List */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Registo Completo de Eventos & Transações ({filteredLiveMovements.length}):
              </h3>
              {filteredLiveMovements.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#101935] border border-blue-900/40 text-xs text-slate-400">
                  Nenhum movimento registado neste filtro até ao momento.
                </div>
              ) : (
                <div className="divide-y divide-blue-950/60 rounded-2xl bg-[#101935] border border-blue-900/40 overflow-hidden">
                  {filteredLiveMovements.map(mov => (
                    <div key={mov.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          mov.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          mov.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          mov.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          mov.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          mov.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {mov.type === 'deposito' && <Download className="w-4 h-4" />}
                          {mov.type === 'saque' && <Upload className="w-4 h-4" />}
                          {mov.type === 'pedido' && <Package className="w-4 h-4" />}
                          {mov.type === 'kyc' && <FileText className="w-4 h-4" />}
                          {mov.type === 'transacao' && <Wallet className="w-4 h-4" />}
                          {mov.type === 'revenda' && <ShoppingBag className="w-4 h-4" />}
                          {mov.type === 'negociacao' && <Handshake className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">{mov.title}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              mov.statusLabel === 'Sucesso' || mov.statusLabel === 'Ativo'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : mov.statusLabel === 'Pendente'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {mov.statusLabel}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{mov.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 flex-wrap">
                        {mov.depositObj && mov.depositObj.status === 'pendente' && (
                          <div className="flex items-center gap-1.5">
                            {mov.depositObj.receiptProof && (
                              <button
                                type="button"
                                onClick={() => setZoomedReceipt({ title: `Comprovativo - ${mov.depositObj!.userName}`, src: mov.depositObj!.receiptProof!, deposit: mov.depositObj! })}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold cursor-pointer"
                              >
                                Talão
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRejectDeposit(mov.depositObj!)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[11px] font-bold border border-red-500/30 cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveDeposit(mov.depositObj!)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black cursor-pointer"
                            >
                              Aprovar
                            </button>
                          </div>
                        )}

                        {mov.withdrawalObj && mov.withdrawalObj.status === 'pendente' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRejectWithdrawal(mov.withdrawalObj!)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[11px] font-bold border border-red-500/30 cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveWithdrawal(mov.withdrawalObj!)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black cursor-pointer"
                            >
                              Aprovar & Debitar
                            </button>
                          </div>
                        )}

                        {mov.orderObj && mov.orderObj.status === 'aguardando_aprovacao' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRejectOrder(mov.orderObj!)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[11px] font-bold border border-red-500/30 cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveOrder(mov.orderObj!)}
                              className="px-2.5 py-1 rounded-lg bg-[#FF6A00] hover:bg-[#e05d00] text-white text-[11px] font-black cursor-pointer"
                            >
                              Aprovar Compra
                            </button>
                          </div>
                        )}

                        {mov.listingObj && mov.listingObj.status === 'pendente' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRejectListing(mov.listingObj!)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[11px] font-bold border border-red-500/30 cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveListing(mov.listingObj!)}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black cursor-pointer"
                            >
                              Aprovar Anúncio
                            </button>
                          </div>
                        )}

                        {mov.negotiationObj && mov.negotiationObj.status === 'aguardando_adm' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRejectNegotiation(mov.negotiationObj!)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[11px] font-bold border border-red-500/30 cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveNegotiation(mov.negotiationObj!)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer"
                            >
                              Aprovar Proposta
                            </button>
                          </div>
                        )}

                        {mov.kycUser && mov.kycUser.accountStatus === 'em_processamento' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingUser(mov.kycUser!);
                                setRejectionReason('Fotografia do Bilhete de Identidade ilegível. Por favor, carrega uma fotografia nítida da frente e do verso.');
                                setKycRejectionError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[11px] font-bold border border-red-500/30 cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveKYC(mov.kycUser!)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer"
                            >
                              Aprovar BI
                            </button>
                          </div>
                        )}

                        <div className="text-right">
                          {mov.amount !== undefined && (
                            <div className="text-xs font-black text-white tabular-nums">{formatKz(mov.amount)}</div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono">{mov.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOTAL DE USUÁRIO & GESTÃO DE SALDO */}
      {/* ======================================================== */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card & Search */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-5 text-neutral-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                        Tabela 1 de 5
                      </span>
                      <h2 className="text-lg font-black text-neutral-900">
                        1. Total de Utilizadores & Gestão de Saldos
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Pesquisa qualquer membro, visualiza o número de utilizadores e clica em <strong className="text-emerald-700">+ Adicionar Saldo</strong> ou <strong className="text-red-700">- Remover Saldo</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Aggregated Stats Mini Banner */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Total Utilizadores</div>
                  <div className="text-sm font-black text-neutral-900 tabular-nums">{users.length} Registados</div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-600">Contas Ativas</div>
                  <div className="text-sm font-black text-emerald-800 tabular-nums">{activeMembersCount} Verificados</div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-[10px] font-bold uppercase text-blue-600">Saldo em Carteiras</div>
                  <div className="text-sm font-black text-blue-900 tabular-nums">{formatKz(totalSystemBalances)}</div>
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-neutral-100">
              {/* Search input */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Pesquisar por nome, telefone (+244), email, BI ou província..."
                  className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
                {memberSearch && (
                  <button
                    type="button"
                    onClick={() => setMemberSearch('')}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 text-xs font-bold p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-3">
                <select
                  value={memberStatusFilter}
                  onChange={e => setMemberStatusFilter(e.target.value as any)}
                  className="w-full py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">Todos os Estados de Conta</option>
                  <option value="ativo">Contas Ativas & Regulares</option>
                  <option value="em_processamento">Validação de BI Pendente</option>
                  <option value="suspenso">Contas Suspensas</option>
                  <option value="rejeitado">BI Rejeitado</option>
                </select>
              </div>

              {/* Province Filter */}
              <div className="lg:col-span-2">
                <select
                  value={memberProvinceFilter}
                  onChange={e => setMemberProvinceFilter(e.target.value)}
                  className="w-full py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">Todas as Províncias</option>
                  {angolaProvinces.map(prov => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Filter */}
              <div className="lg:col-span-2">
                <select
                  value={memberSortBy}
                  onChange={e => setMemberSortBy(e.target.value as any)}
                  className="w-full py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="number_asc">Nº Sequencial (#001 →)</option>
                  <option value="number_desc">Nº Sequencial (Inverso)</option>
                  <option value="balance_desc">Maior Saldo (Kz)</option>
                  <option value="balance_asc">Menor Saldo (Kz)</option>
                  <option value="name_asc">Nome (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Filter Indicator Bar */}
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
              <span>
                A exibir <strong className="text-amber-700 font-black">{filteredMembers.length}</strong> de <strong className="text-neutral-900 font-black">{users.length}</strong> utilizadores
                {memberSearch && ` para a pesquisa "${memberSearch}"`}
              </span>
              {(memberSearch || memberStatusFilter !== 'all' || memberProvinceFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberSearch('');
                    setMemberStatusFilter('all');
                    setMemberProvinceFilter('all');
                  }}
                  className="text-amber-600 hover:text-amber-700 font-bold cursor-pointer underline"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Clean, High-Contrast Members List & Balance Management */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden text-neutral-900">
            {/* Context Info Banner */}
            <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-neutral-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  Total apresentado: <strong className="text-neutral-950 font-black">{filteredMembers.length}</strong> de <strong className="text-neutral-950 font-black">{users.length}</strong> utilizadores registados
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300"></span>
                <span>Botão verde = Adicionar Saldo</span>
                <span className="inline-block w-2.5 h-2.5 rounded bg-red-100 border border-red-300 ml-2"></span>
                <span>Botão vermelho = Remover Saldo</span>
              </div>
            </div>

            {/* Empty State */}
            {filteredMembers.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-black text-neutral-900">Nenhum utilizador encontrado</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Tenta alterar os termos de pesquisa no topo ou limpa os filtros de estado e província.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMemberSearch('');
                    setMemberStatusFilter('all');
                    setMemberProvinceFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Restaurar Todos os Utilizadores
                </button>
              </div>
            ) : (
              <>
                {/* ------------------------------------------------------------- */}
                {/* MOBILE VIEW: Easy-to-read Touch Cards */}
                {/* ------------------------------------------------------------- */}
                <div className="block lg:hidden divide-y divide-neutral-100 p-3 sm:p-4 space-y-3">
                  {filteredMembers.map((u) => {
                    const userWallet = getWallet(u.id);
                    const sequentialNumber = String(users.indexOf(u) + 1).padStart(3, '0');
                    const isMasterAdmin = u.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || u.role === 'admin';

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 shadow-sm hover:border-neutral-300 transition-all space-y-3.5"
                      >
                        {/* Card Header: Member ID & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-amber-950 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                              Nº #{sequentialNumber}
                            </span>
                            {isMasterAdmin && (
                              <span className="px-2 py-0.5 rounded-lg bg-neutral-900 text-amber-400 font-black text-[10px] uppercase tracking-wider">
                                Administrador
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.accountStatus === 'ativo'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : u.accountStatus === 'em_processamento'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : u.accountStatus === 'suspenso'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.accountStatus === 'ativo'
                                  ? 'bg-emerald-600'
                                  : u.accountStatus === 'em_processamento'
                                  ? 'bg-amber-600'
                                  : u.accountStatus === 'suspenso'
                                  ? 'bg-orange-600'
                                  : 'bg-red-600'
                              }`}
                            />
                            {u.accountStatus === 'ativo'
                              ? 'Conta Ativa'
                              : u.accountStatus === 'em_processamento'
                              ? 'BI Pendente'
                              : u.accountStatus === 'suspenso'
                              ? 'Suspenso'
                              : 'BI Rejeitado'}
                          </span>
                        </div>

                        {/* User Details */}
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-950 text-amber-400 font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-black text-neutral-900 leading-snug truncate">
                              {u.name}
                            </h4>
                            <div className="text-xs text-neutral-600 truncate flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            <div className="text-xs text-neutral-600 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="font-mono">{u.phone || 'Sem contacto'}</span>
                              <span className="text-neutral-300">•</span>
                              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span>{u.province || 'Angola'}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono mt-1 flex items-center gap-1.5">
                              <span>BI: <strong>{u.idNumber || 'Pendente'}</strong></span>
                              {(u.idCardFront || u.idCardBack) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedDoc({
                                      title: `Bilhete de Identidade — ${u.name}`,
                                      src: u.idCardFront || u.idCardBack || '',
                                      userName: u.name
                                    })
                                  }
                                  className="text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer ml-1 inline-flex items-center gap-0.5"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Ver Documento</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Balance Highlight Box */}
                        <div className="p-3 bg-white rounded-2xl border border-neutral-200/90 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                              Saldo Atual em Carteira
                            </span>
                            <span className="text-lg font-black text-neutral-950 tabular-nums">
                              {formatKz(userWallet.availableBalance)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block">
                              ID: {u.id.substring(0, 8)}...
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              Disponível
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Add Balance & Remove Balance */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenBalanceModal(u, 'add')}
                            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                            title="Adicionar Saldo à Carteira deste utilizador"
                          >
                            <Plus className="w-4 h-4 text-white" />
                            <span>+ Adicionar Saldo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenBalanceModal(u, 'remove')}
                            className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                            title="Remover ou debitar saldo da Carteira deste utilizador"
                          >
                            <Minus className="w-4 h-4 text-white" />
                            <span>- Remover Saldo</span>
                          </button>
                        </div>

                        {/* Suspend / Reactivate & Delete account actions for non-master admins */}
                        {!isMasterAdmin && (
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleMemberStatus(u)}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                                u.accountStatus === 'ativo'
                                  ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
                                  : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              <span>
                                {u.accountStatus === 'ativo'
                                  ? 'Suspender Usuário'
                                  : u.accountStatus === 'suspenso'
                                  ? 'Reativar Usuário'
                                  : 'Ativar Conta'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar Conta</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* DESKTOP VIEW: Clean, High-Contrast Table */}
                {/* ------------------------------------------------------------- */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] uppercase tracking-wider font-extrabold">
                        <th className="py-3.5 px-4 text-center w-20">Nº Membro</th>
                        <th className="py-3.5 px-4 min-w-[200px]">Membro / Titular</th>
                        <th className="py-3.5 px-4 min-w-[160px]">Contacto & Província</th>
                        <th className="py-3.5 px-4 min-w-[160px]">Bilhete de Identidade</th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">Estado</th>
                        <th className="py-3.5 px-4 text-right min-w-[140px]">Saldo em Carteira</th>
                        <th className="py-3.5 px-4 text-center min-w-[260px]">Gestão de Saldo (Ações)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredMembers.map((u) => {
                        const userWallet = getWallet(u.id);
                        const sequentialNumber = String(users.indexOf(u) + 1).padStart(3, '0');
                        const isMasterAdmin = u.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || u.role === 'admin';

                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-neutral-50/80 transition-colors group"
                          >
                            {/* Sequential Member Number */}
                            <td className="py-4 px-4 text-center align-middle">
                              <span className="font-mono text-xs font-black text-neutral-900 bg-neutral-100 group-hover:bg-amber-100 group-hover:text-amber-950 px-2 py-1 rounded-lg border border-neutral-200 transition-colors">
                                #{sequentialNumber}
                              </span>
                            </td>

                            {/* Member Info */}
                            <td className="py-4 px-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                                  {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-neutral-900 text-xs truncate">
                                      {u.name}
                                    </span>
                                    {isMasterAdmin && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 font-black text-[9px] uppercase tracking-wider">
                                        Admin Master
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                                    <span>{u.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact & Province */}
                            <td className="py-4 px-4 align-middle">
                              <div className="space-y-0.5">
                                <div className="font-mono font-semibold text-neutral-800 text-xs flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                                  <span>{u.phone || 'Sem telefone'}</span>
                                </div>
                                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                  <span>{u.province || 'Angola'}</span>
                                </div>
                              </div>
                            </td>

                            {/* National BI Info */}
                            <td className="py-4 px-4 align-middle">
                              <div className="space-y-1">
                                <div className="font-mono font-bold text-neutral-900 text-xs">
                                  {u.idNumber || 'Não especificado'}
                                </div>
                                {(u.idCardFront || u.idCardBack) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomedDoc({
                                        title: `Bilhete de Identidade — ${u.name}`,
                                        src: u.idCardFront || u.idCardBack || '',
                                        userName: u.name
                                      })
                                    }
                                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
                                    title="Visualizar documento original frente/verso"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver Foto do BI</span>
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Account Status Badge */}
                            <td className="py-4 px-4 text-center align-middle">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  u.accountStatus === 'ativo'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : u.accountStatus === 'em_processamento'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : u.accountStatus === 'suspenso'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    u.accountStatus === 'ativo'
                                      ? 'bg-emerald-600'
                                      : u.accountStatus === 'em_processamento'
                                      ? 'bg-amber-600'
                                      : u.accountStatus === 'suspenso'
                                      ? 'bg-orange-600'
                                      : 'bg-red-600'
                                  }`}
                                />
                                {u.accountStatus === 'ativo'
                                  ? 'Ativo'
                                  : u.accountStatus === 'em_processamento'
                                  ? 'Pendente'
                                  : u.accountStatus === 'suspenso'
                                  ? 'Suspenso'
                                  : 'Rejeitado'}
                              </span>
                            </td>

                            {/* Live Balance in Kwanzas */}
                            <td className="py-4 px-4 text-right align-middle">
                              <div className="space-y-0.5">
                                <div className="text-sm font-black text-neutral-950 tabular-nums">
                                  {formatKz(userWallet.availableBalance)}
                                </div>
                                <div className="text-[10px] text-neutral-400 font-medium">
                                  Disponível
                                </div>
                              </div>
                            </td>

                            {/* Dedicated Add / Remove Balance & Suspend / Delete Account Buttons */}
                            <td className="py-4 px-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* Green Add Balance Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenBalanceModal(u, 'add')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl flex items-center gap-1 shadow-sm transition-all hover:scale-102 active:scale-95 cursor-pointer"
                                  title="Adicionar Saldo (Crédito em Kwanzas)"
                                >
                                  <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  <span>+ Adicionar</span>
                                </button>

                                {/* Red Remove Balance Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenBalanceModal(u, 'remove')}
                                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] rounded-xl flex items-center gap-1 shadow-sm transition-all hover:scale-102 active:scale-95 cursor-pointer"
                                  title="Remover Saldo (Débito em Kwanzas)"
                                >
                                  <Minus className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  <span>- Remover</span>
                                </button>

                                {/* Suspend / Activate & Delete Account buttons */}
                                {!isMasterAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMemberStatus(u)}
                                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                        u.accountStatus === 'ativo'
                                          ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                      }`}
                                      title={
                                        u.accountStatus === 'ativo'
                                          ? 'Suspender temporariamente a conta deste usuário'
                                          : u.accountStatus === 'suspenso'
                                          ? 'Reativar conta suspensa'
                                          : 'Aprovar e ativar conta do membro'
                                      }
                                    >
                                      <Ban className="w-3 h-3" />
                                      <span>
                                        {u.accountStatus === 'ativo'
                                          ? 'Suspender'
                                          : u.accountStatus === 'suspenso'
                                          ? 'Reativar'
                                          : 'Ativar'}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingUser(u)}
                                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1"
                                      title="Eliminar conta deste utilizador permanentemente"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Eliminar</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TABELA DE DEPÓSITOS PENDENTES (MULTICAIXA EXPRESS)    */}
      {/* ======================================================== */}
      {activeTab === 'deposits' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Info */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                    <ArrowDownLeft className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        Tabela 2 de 5
                      </span>
                      <h2 className="text-lg font-black text-neutral-900">
                        2. Depósitos Pendentes (Multicaixa Express & Carregamentos)
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl leading-relaxed">
                      Audita as referências de pagamento Multicaixa Express e os comprovativos anexados pelos clientes para creditar o saldo imediatamente na carteira digital.
                    </p>
                  </div>
                </div>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">Por Validar</div>
                  <div className="text-sm font-black text-emerald-900 tabular-nums">
                    {pendingDepositsCount} Pendente{pendingDepositsCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Total Registado</div>
                  <div className="text-sm font-black text-neutral-900 tabular-nums">
                    {deposits.length} Depósitos
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => setDepositFilter('pendente')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    depositFilter === 'pendente'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Pendentes ({pendingDepositsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDepositFilter('aprovado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    depositFilter === 'aprovado'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Aprovados ({deposits.filter(d => d.status === 'aprovado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setDepositFilter('rejeitado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    depositFilter === 'rejeitado'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Recusados ({deposits.filter(d => d.status === 'rejeitado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setDepositFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    depositFilter === 'all'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Todos ({deposits.length})
                </button>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={depositSearch}
                  onChange={e => setDepositSearch(e.target.value)}
                  placeholder="Pesquisar por utilizador, referência..."
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Deposits List */}
          {filteredDeposits.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-base font-black text-neutral-800">
                Nenhum depósito encontrado neste filtro
              </h3>
              <p className="text-xs text-neutral-500">
                Todos os carregamentos de saldo foram auditados e regularizados.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        <th className="py-3 px-4">Utilizador</th>
                        <th className="py-3 px-4">Método & Referência</th>
                        <th className="py-3 px-4 text-right">Montante (Kz)</th>
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4 text-center">Comprovativo</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Ações do Administrador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                      {filteredDeposits.map(d => {
                        const isPending = d.status === 'pendente';
                        const isApproved = d.status === 'aprovado';

                        return (
                          <tr key={d.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                                  {d.userName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-neutral-900 truncate">{d.userName}</div>
                                  <div className="text-[11px] text-neutral-500">{users.find(u => u.id === d.userId)?.phone || '+244 9xx xxx xxx'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {(d.paymentMethod === 'multicaixa_express' || d.paymentMethod === 'paypay') && (
                                  <img
                                    src={
                                      d.paymentMethod === 'paypay'
                                        ? '/assets/aistudio/IMG_1417_a64da3e1.jpeg'
                                        : '/assets/aistudio/IMG_4106_b00dac5c.jpeg'
                                    }
                                    alt={d.paymentMethod}
                                    className="w-7 h-6 rounded object-cover border border-neutral-200 shrink-0"
                                  />
                                )}
                                <div className="font-bold text-neutral-900">{formatPaymentMethodLabel(d.paymentMethod)}</div>
                              </div>
                              <div className="font-mono text-[11px] text-neutral-500 mt-0.5">
                                Ref: <strong className="text-neutral-700">{d.reference}</strong>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-black text-sm text-emerald-600 tabular-nums">
                                +{formatKz(d.amount)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                              {new Date(d.createdAt).toLocaleString('pt-AO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {d.receiptProof ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedReceipt({
                                      title: `Comprovativo de Depósito - ${d.userName} (${formatKz(d.amount)})`,
                                      src: d.receiptProof!,
                                      deposit: d
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 text-amber-400 text-[11px] font-bold hover:bg-neutral-800 cursor-pointer transition-colors shadow-2xs"
                                  title="Ver talão do Multicaixa Express"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Anexo</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-neutral-400 italic">Sem anexo</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                {isApproved ? 'Aprovado' : isPending ? 'Pendente' : 'Recusado'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRejectDeposit(d)}
                                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    Recusar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveDeposit(d)}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Aprovar e Creditar</span>
                                  </button>
                                </div>
                              ) : isApproved ? (
                                <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Saldo Creditado
                                </span>
                              ) : (
                                <div className="text-right space-y-0.5">
                                  <span className="text-[11px] text-red-600 font-bold block">Depósito Recusado</span>
                                  {d.rejectionReason && (
                                    <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-block max-w-[200px] truncate" title={d.rejectionReason}>
                                      Motivo: {d.rejectionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredDeposits.map(d => {
                  const isPending = d.status === 'pendente';
                  const isApproved = d.status === 'aprovado';

                  return (
                    <div
                      key={d.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                        isPending
                          ? 'border-emerald-300 ring-2 ring-emerald-400/20 bg-emerald-50/20'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-neutral-900">{d.userName}</h4>
                            <span className="font-mono text-[10px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                              {(d.paymentMethod === 'multicaixa_express' || d.paymentMethod === 'paypay') && (
                                <img
                                  src={
                                    d.paymentMethod === 'paypay'
                                      ? '/assets/aistudio/IMG_1417_a64da3e1.jpeg'
                                      : '/assets/aistudio/IMG_4106_b00dac5c.jpeg'
                                  }
                                  alt={d.paymentMethod}
                                  className="w-4 h-4 rounded-sm object-cover shrink-0"
                                />
                              )}
                              <span>{formatPaymentMethodLabel(d.paymentMethod)}</span>
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            Ref: <strong className="font-mono text-neutral-700">{d.reference}</strong> • {new Date(d.createdAt).toLocaleString('pt-AO')}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-emerald-600 tabular-nums block">
                            +{formatKz(d.amount)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 inline-block ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                      </div>

                      {d.receiptProof && (
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={d.receiptProof}
                              alt="Comprovativo"
                              className="w-12 h-12 object-cover rounded-lg border border-neutral-300 shrink-0 bg-white"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-neutral-900 block truncate">
                                Comprovativo Multicaixa Express
                              </span>
                              <span className="text-[11px] text-neutral-500">Talão de pagamento</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setZoomedReceipt({
                                title: `Comprovativo de Depósito - ${d.userName} (${formatKz(d.amount)})`,
                                src: d.receiptProof!,
                                deposit: d
                              })
                            }
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                        </div>
                      )}

                      {!isPending && !isApproved && d.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold">
                          Motivo da rejeição: {d.rejectionReason}
                        </div>
                      )}

                      {isPending && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleRejectDeposit(d)}
                            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveDeposit(d)}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Aprovar e Creditar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TABELA DE SAQUES PENDENTES (LEVANTAMENTOS IBAN)       */}
      {/* ======================================================== */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Info */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                        Tabela 3 de 5
                      </span>
                      <h2 className="text-lg font-black text-neutral-900">
                        3. Saques Pendentes (Transferências Bancárias IBAN)
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl leading-relaxed">
                      Confirma as transferências bancárias efetuadas para os bancos angolanos (BAI, BFA, BIC, Atlântico, etc.) via IBAN nacional (AO06...).
                    </p>
                  </div>
                </div>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold uppercase text-purple-700">Por Processar</div>
                  <div className="text-sm font-black text-purple-900 tabular-nums">
                    {pendingWithdrawalsCount} Saque{pendingWithdrawalsCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Total Solicitado</div>
                  <div className="text-sm font-black text-neutral-900 tabular-nums">
                    {withdrawals.length} Levantamentos
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => setWithdrawalFilter('pendente')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    withdrawalFilter === 'pendente'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Pendentes ({pendingWithdrawalsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawalFilter('processado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    withdrawalFilter === 'processado'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Processados ({withdrawals.filter(w => w.status === 'processado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawalFilter('rejeitado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    withdrawalFilter === 'rejeitado'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Recusados ({withdrawals.filter(w => w.status === 'rejeitado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawalFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    withdrawalFilter === 'all'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Todos ({withdrawals.length})
                </button>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={withdrawalSearch}
                  onChange={e => setWithdrawalSearch(e.target.value)}
                  placeholder="Pesquisar por utilizador, banco, IBAN..."
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Withdrawals List */}
          {filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-base font-black text-neutral-800">
                Nenhum levantamento bancário encontrado neste filtro
              </h3>
              <p className="text-xs text-neutral-500">
                Todos os pedidos de saque foram processados e transferidos.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        <th className="py-3 px-4">Utilizador</th>
                        <th className="py-3 px-4">Banco Angolano</th>
                        <th className="py-3 px-4">IBAN Nacional (AO06)</th>
                        <th className="py-3 px-4 text-right">Montante Solicitado (Kz)</th>
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Ações do Administrador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                      {filteredWithdrawals.map(w => {
                        const isPending = w.status === 'pendente';
                        const isProcessed = w.status === 'processado';

                        return (
                          <tr key={w.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0">
                                  {w.userName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-neutral-900 truncate">{w.userName}</div>
                                  <div className="text-[11px] text-neutral-500">{users.find(u => u.id === w.userId)?.phone || '+244 9xx xxx xxx'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                                {w.bankName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <code className="font-mono text-xs font-bold text-neutral-900 bg-neutral-50 px-2 py-1 rounded border border-neutral-200 block truncate max-w-[220px]">
                                {w.iban}
                              </code>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-black text-sm text-purple-700 tabular-nums">
                                {formatKz(w.amount)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                              {new Date(w.createdAt).toLocaleString('pt-AO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isProcessed
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                {isProcessed ? 'Transferido' : isPending ? 'Pendente' : 'Recusado'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRejectWithdrawal(w)}
                                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    Recusar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveWithdrawal(w)}
                                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Aprovar e Debitar</span>
                                  </button>
                                </div>
                              ) : isProcessed ? (
                                <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Aprovado & Debitado (Sucesso)
                                </span>
                              ) : (
                                <div className="text-right space-y-0.5">
                                  <span className="text-[11px] text-red-600 font-bold block">Recusado (Não debitado)</span>
                                  {w.rejectionReason && (
                                    <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-block max-w-[200px] truncate" title={w.rejectionReason}>
                                      Motivo: {w.rejectionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredWithdrawals.map(w => {
                  const isPending = w.status === 'pendente';
                  const isProcessed = w.status === 'processado';

                  return (
                    <div
                      key={w.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                        isPending
                          ? 'border-purple-300 ring-2 ring-purple-400/20 bg-purple-50/20'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-neutral-900">{w.userName}</h4>
                            <span className="font-bold text-[11px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                              {w.bankName}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-neutral-600 mt-1">
                            IBAN: <strong className="text-neutral-900 font-bold">{w.iban}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-lg font-black text-purple-700 tabular-nums block">
                              {formatKz(w.amount)}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black ${
                              isProcessed
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isProcessed ? 'TRANSFERIDO' : isPending ? 'PENDENTE' : 'RECUSADO'}
                          </span>
                        </div>
                      </div>

                      {!isPending && !isProcessed && w.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold">
                          Motivo da rejeição: {w.rejectionReason}
                        </div>
                      )}

                      {isPending && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleRejectWithdrawal(w)}
                            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveWithdrawal(w)}
                            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-colors cursor-pointer shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Aprovar e Debitar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TABELA DE VALIDAÇÃO DE BILHETES DE IDENTIDADE (BI)    */}
      {/* ======================================================== */}
      {activeTab === 'kyc' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Info */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                        Tabela 4 de 5
                      </span>
                      <h2 className="text-lg font-black text-neutral-900">
                        4. Validar Bilhetes de Identidade (BI Nacional)
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl leading-relaxed">
                      Examina com rigor as fotografias da <strong>Frente</strong> e do <strong>Verso</strong> do Bilhete de Identidade de cada cidadão antes de aprovar a regularização do cadastro em Angola.
                    </p>
                  </div>
                </div>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="text-[10px] font-bold uppercase text-rose-700">Por Validar</div>
                  <div className="text-sm font-black text-rose-900 tabular-nums">
                    {pendingKycCount} Pendente{pendingKycCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Total Cadastros</div>
                  <div className="text-sm font-black text-neutral-900 tabular-nums">
                    {users.length} Utilizadores
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => setKycFilter('em_processamento')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    kycFilter === 'em_processamento'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Pendentes ({pendingKycCount})
                </button>
                <button
                  type="button"
                  onClick={() => setKycFilter('ativo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    kycFilter === 'ativo'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Aprovados ({users.filter(u => u.accountStatus === 'ativo').length})
                </button>
                <button
                  type="button"
                  onClick={() => setKycFilter('rejeitado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    kycFilter === 'rejeitado'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Rejeitados ({users.filter(u => u.accountStatus === 'rejeitado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setKycFilter('suspenso')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    kycFilter === 'suspenso'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Suspensos ({users.filter(u => u.accountStatus === 'suspenso').length})
                </button>
                <button
                  type="button"
                  onClick={() => setKycFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    kycFilter === 'all'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Todos ({users.length})
                </button>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={kycSearch}
                  onChange={e => setKycSearch(e.target.value)}
                  placeholder="Pesquisar por nome, BI, telemóvel..."
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* KYC List */}
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-neutral-800">
                Nenhum cadastro encontrado neste filtro
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Não existem pedidos de aprovação correspondentes à pesquisa selecionada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredUsers.map(u => {
                const isPending = u.accountStatus === 'em_processamento';
                const isApproved = u.accountStatus === 'ativo';
                const isRejected = u.accountStatus === 'rejeitado';
                const isSuspended = u.accountStatus === 'suspenso';
                const isMasterAdmin = u.id === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' || u.role === 'admin';

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs transition-all space-y-5 ${
                      isPending
                        ? 'border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/10'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {/* Top Row: User Summary & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-amber-400 font-black text-lg flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-neutral-900 leading-tight">
                              {u.name}
                            </h3>
                            {u.role === 'admin' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              BI: {u.idNumber || '000000000LA000'}
                            </span>
                            <span>•</span>
                            <span>{u.city || u.province}, {u.province}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {isPending && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendente de Aprovação</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprovado & Ativo</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black border border-red-300 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeitado</span>
                          </span>
                        )}
                        {isSuspended && (
                          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black border border-orange-300 flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5" />
                            <span>Conta Suspensa</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Applicant Data Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Telemóvel (+244)
                        </span>
                        <span className="font-bold text-neutral-900 block mt-0.5">
                          {u.phone || '+244 9xx xxx xxx'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Endereço de Gmail / Email
                        </span>
                        <span className="font-bold text-neutral-900 block mt-0.5 truncate">
                          {u.email || 'utilizador@baba.ao'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Província / Município
                        </span>
                        <span className="font-bold text-neutral-900 block mt-0.5">
                          {u.province} ({u.city})
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Data do Cadastro
                        </span>
                        <span className="font-bold text-neutral-900 block mt-0.5">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-AO') : 'Hoje'}
                        </span>
                      </div>
                    </div>

                    {/* Document Photos Grid: Frente e Verso */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                        <span>Fotografias Oficiais do Bilhete de Identidade (BI):</span>
                        <span className="text-[11px] text-neutral-400">Clica para ampliar em alta definição</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Frente */}
                        <div
                          onClick={() =>
                            u.idCardFront &&
                            setZoomedDoc({
                              title: `Frente do Bilhete de Identidade - ${u.name}`,
                              src: u.idCardFront,
                              userName: u.name
                            })
                          }
                          className="group relative rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-100 aspect-[16/10] cursor-pointer hover:border-amber-400 transition-all flex flex-col justify-between p-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between z-10">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 text-white">
                              1. Foto Frente do BI
                            </span>
                            <span className="p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          {u.idCardFront ? (
                            <img
                              src={u.idCardFront}
                              alt={`Frente do BI de ${u.name}`}
                              className="absolute inset-0 w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400 font-semibold">
                              Foto da frente não disponível
                            </div>
                          )}
                          <div className="z-10 text-[10px] font-bold text-neutral-700 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded w-fit">
                            Titular & Foto
                          </div>
                        </div>

                        {/* Verso */}
                        <div
                          onClick={() =>
                            u.idCardBack &&
                            setZoomedDoc({
                              title: `Verso do Bilhete de Identidade - ${u.name}`,
                              src: u.idCardBack,
                              userName: u.name
                            })
                          }
                          className="group relative rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-100 aspect-[16/10] cursor-pointer hover:border-amber-400 transition-all flex flex-col justify-between p-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between z-10">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 text-white">
                              2. Foto Verso do BI
                            </span>
                            <span className="p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          {u.idCardBack ? (
                            <img
                              src={u.idCardBack}
                              alt={`Verso do BI de ${u.name}`}
                              className="absolute inset-0 w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400 font-semibold">
                              Foto do verso não disponível
                            </div>
                          )}
                          <div className="z-10 text-[10px] font-bold text-neutral-700 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded w-fit">
                            Código de Barras & Filiação
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Admin */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {!isMasterAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleMemberStatus(u)}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                u.accountStatus === 'ativo'
                                  ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>
                                {u.accountStatus === 'ativo'
                                  ? 'Suspender Usuário'
                                  : isSuspended
                                  ? 'Reativar Conta'
                                  : 'Ativar Conta'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="px-3.5 py-2 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar Conta</span>
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingUser(u);
                                setRejectionReason('Fotografia do Bilhete de Identidade ilegível. Por favor, carrega uma fotografia nítida da frente e do verso.');
                              }}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Rejeitar Cadastro</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveKYC(u)}
                              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Aprovar Cadastro Imediatamente</span>
                            </button>
                          </>
                        ) : isRejected || isSuspended ? (
                          <button
                            type="button"
                            onClick={() => handleApproveKYC(u)}
                            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Reverter e Aprovar Cadastro</span>
                          </button>
                        ) : (
                          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>Cadastro Validado e Regularizado em Angola</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TABELA DE PRODUTOS A VENDA POR USUÁRIO PARA NEGOCIAR  */}
      {/* ======================================================== */}
      {activeTab === 'resale_market' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Info Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border-2 border-orange-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6A00] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                      Tabela 5 de 5
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-neutral-900">
                      5. Produtos à Venda por Utilizadores (Negociar & Comprar)
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                      Exclusivo: O Adm compra produtos dos utilizadores
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                    Mercado P2P & Revenda em Angola
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                Aqui podes ver exclusivamente os <strong>produtos que os utilizadores anunciaram para venda</strong> (e não do catálogo oficial). Como Administrador, podes <strong className="text-neutral-900">⚡ Comprar Já</strong> pelo preço do vendedor (creditando o saldo imediatamente na carteira do utilizador) ou <strong className="text-[#FF6A00]">🤝 Negociar Preço</strong> iniciando de <strong className="text-blue-700">1 a 5 conversas com nomes e personas diferentes</strong> para disputar o melhor valor.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="px-3.5 py-2 rounded-2xl bg-neutral-900 text-amber-400 font-black text-xs shadow-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
                <span>{activeUserListings.length} Artigos à Venda</span>
              </span>
            </div>
          </div>

          {/* Fila Pendente do Mercado de Revenda (Anúncios & Propostas P2P) */}
          {(pendingListingsList.length > 0 || pendingNegotiationsList.length > 0) && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-black text-amber-950">
                  Anúncios e Propostas P2P a Aguardar Aprovação ({pendingListingsList.length + pendingNegotiationsList.length})
                </h3>
                <span className="text-[11px] font-semibold text-amber-800">
                  Só ficam visíveis no Mercado após aprovares
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingListingsList.map(l => (
                  <div key={l.id} className="p-3 rounded-2xl bg-white border border-orange-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={l.imageUrl} alt={l.productName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-neutral-900 truncate">{l.productName}</div>
                        <div className="text-[11px] text-neutral-600 truncate">
                          {l.sellerName} • <strong>{formatKz(l.listingPrice)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRejectListing(l)}
                        className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 cursor-pointer"
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveListing(l)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-500 cursor-pointer"
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                ))}
                {pendingNegotiationsList.map(n => (
                  <div key={n.id} className="p-3 rounded-2xl bg-white border border-indigo-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-neutral-900 truncate">Proposta: {n.productName}</div>
                      <div className="text-[11px] text-neutral-600 truncate">
                        {n.buyerName} → {n.sellerName} • <strong>{formatKz(n.currentProposedPrice)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRejectNegotiation(n)}
                        className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 cursor-pointer"
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveNegotiation(n)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-500 cursor-pointer"
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={resaleSearch}
                onChange={e => setResaleSearch(e.target.value)}
                placeholder="Pesquisar por produto, vendedor ou província..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Categoria:</span>
              <select
                value={resaleCategory}
                onChange={e => setResaleCategory(e.target.value)}
                className="text-xs font-bold text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FF6A00] cursor-pointer"
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
                <option value="produtos_variados">Produtos Variados</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredResale.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-neutral-200 space-y-3">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
              <h3 className="text-base font-black text-neutral-800">
                Nenhum produto de utilizador encontrado à venda
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Quando os membros colocarem produtos à venda em "Meus Produtos", eles aparecerão imediatamente aqui para poderes comprar e negociar.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:block bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden mb-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        <th className="py-3 px-4">Produto Anunciado</th>
                        <th className="py-3 px-4">Vendedor (Utilizador)</th>
                        <th className="py-3 px-4 text-right">Preço de Venda</th>
                        <th className="py-3 px-4 text-center">Personas em Negociação</th>
                        <th className="py-3 px-4 text-right">Ações do Administrador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                      {filteredResale.map(item => {
                        const itemNegotiations = negotiations.filter(n => n.listingId === item.id);
                        const activePersonasCount = itemNegotiations.filter(n => n.status !== 'cancelada' && n.status !== 'concluida').length;

                        return (
                          <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 object-cover rounded-xl border border-neutral-200 shrink-0 bg-neutral-100"
                                  onError={e => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src =
                                      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                                <div className="min-w-0 max-w-xs">
                                  <div className="font-bold text-neutral-900 truncate">{item.productName}</div>
                                  <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                    {item.customDescription || 'Artigo à venda no Mercado de Revenda.'}
                                  </div>
                                  {item.selectedColor && (
                                    <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                      Cor: {item.selectedColor}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-neutral-900">{item.sellerName}</div>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                Membro Registado
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="font-black text-sm text-[#FF6A00] tabular-nums">
                                {formatKz(item.listingPrice)}
                              </div>
                              <div className="text-[10px] text-neutral-400 line-through">
                                Original: {formatKz(item.originalPrice)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {activePersonasCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-200 animate-pulse">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{activePersonasCount} de 5 Personas Ativas</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-neutral-400 italic">Nenhuma conversa</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPersonaModal(item)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-black text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                                  title="Negociar o preço com 1 a 5 nomes diferentes (Personas)"
                                >
                                  <Handshake className="w-3.5 h-3.5 text-blue-700" />
                                  <span>Negociar (Personas)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBuyingListing(item)}
                                  className="px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 font-black text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                  title="Comprar produto imediatamente e creditar a carteira do utilizador"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span>Comprar Já</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredResale.map(item => {
                  const itemNegotiations = negotiations.filter(n => n.listingId === item.id);
                  const activePersonasCount = itemNegotiations.filter(n => n.status !== 'cancelada' && n.status !== 'concluida').length;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs hover:border-[#FF6A00]/50 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image & Badges */}
                        <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={e => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                            <span className="px-2.5 py-1 rounded-full bg-neutral-900/90 backdrop-blur-xs text-amber-400 text-[10px] font-black uppercase tracking-wider shadow-xs">
                              Vendedor: {item.sellerName}
                            </span>
                            {activePersonasCount > 0 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                                <MessageCircle className="w-3 h-3" />
                                <span>{activePersonasCount} de 5 Personas a Negociar</span>
                              </span>
                            )}
                          </div>

                          {item.selectedColor && (
                            <div className="absolute bottom-2.5 left-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-neutral-800 text-[10px] font-bold border border-neutral-200">
                                Cor: {item.selectedColor}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="text-sm font-black text-neutral-900 line-clamp-2 leading-snug">
                              {item.productName}
                            </h3>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1">
                              {item.customDescription || 'Artigo verificado publicado no Mercado de Revenda.'}
                            </p>
                          </div>

                          {/* Prices Box */}
                          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] uppercase font-bold text-neutral-500">
                                Preço Pedido pelo Vendedor:
                              </span>
                              <span className="text-lg font-black text-[#FF6A00] tabular-nums">
                                {formatKz(item.listingPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                              <span>Preço Original no Sistema:</span>
                              <span className="line-through">{formatKz(item.originalPrice)}</span>
                            </div>
                            {item.minAcceptablePrice && item.minAcceptablePrice > 0 && (
                              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold pt-1.5 border-t border-neutral-200">
                                <span>Mínimo Aceitável:</span>
                                <span>{formatKz(item.minAcceptablePrice)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Comprar Já & Negociar com Personas */}
                      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                        {/* Button: Negociar com Personas */}
                        <button
                          type="button"
                          onClick={() => handleOpenPersonaModal(item)}
                          className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title="Negociar o preço com 1 a 5 nomes diferentes (Personas)"
                        >
                          <Handshake className="w-4 h-4 text-blue-700" />
                          <span>Negociar (Personas)</span>
                        </button>

                        {/* Button: Comprar Imediatamente */}
                        <button
                          type="button"
                          onClick={() => setBuyingListing(item)}
                          className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          title="Comprar produto imediatamente e creditar a carteira do utilizador"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Comprar Já</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MESA DE NEGOCIAÇÕES MULTI-IDENTIDADE (PERSONAS) */}
      {/* ======================================================== */}
      {activeTab === 'negotiations' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 border-2 border-blue-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                  <Handshake className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-neutral-900">
                    Mesa de Negociações Multi-Identidade (Personas)
                  </h2>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                    1 a 5 Compradores Simulados por Produto
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                Aqui podes acompanhar todas as conversas abertas com os vendedores. Cada conversa é conduzida sob a identidade de uma <strong className="text-blue-900">Persona Diferente</strong> (com nome e proposta distintos), fazendo com que o utilizador acredite estar a falar com pessoas reais independentes.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-2 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-sm flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span>{negotiations.length} Conversas Registadas</span>
              </span>
            </div>
          </div>

          {/* Product Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Filtrar por Produto:</span>
              <select
                value={activeNegotiationProductFilter}
                onChange={e => setActiveNegotiationProductFilter(e.target.value)}
                className="w-full sm:max-w-md text-xs font-bold text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Todas as Negociações ({negotiations.length})</option>
                {Array.from(new Set(negotiations.map(n => n.listingId))).map(listingId => {
                  const sample = negotiations.find(n => n.listingId === listingId);
                  const count = negotiations.filter(n => n.listingId === listingId).length;
                  return (
                    <option key={listingId} value={listingId}>
                      {sample ? sample.productName : listingId} ({count} conversas)
                    </option>
                  );
                })}
              </select>
            </div>

            {activeNegotiationProductFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveNegotiationProductFilter('all')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Ver Todas as Negociações
              </button>
            )}
          </div>

          {/* Negotiations Grid */}
          {(() => {
            const filteredNegs = negotiations.filter(n => {
              if (activeNegotiationProductFilter !== 'all' && n.listingId !== activeNegotiationProductFilter) return false;
              return true;
            });

            if (filteredNegs.length === 0) {
              return (
                <div className="p-16 text-center bg-white rounded-3xl border border-neutral-200 space-y-3">
                  <Handshake className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h3 className="text-base font-black text-neutral-800">
                    Nenhuma negociação encontrada
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Acede à aba <strong className="text-neutral-800">"Produtos dos Usuários"</strong> e clica em <strong className="text-blue-700">"Negociar (Personas)"</strong> para iniciares até 5 conversas com nomes e ofertas diferentes!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('resale_market')}
                    className="mt-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Ver Produtos à Venda Agora
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNegs.map(neg => {
                  const isAgreed = neg.status === 'aceite';
                  const isPending = neg.status === 'pendente';
                  const isCounter = neg.status === 'contraproposta';
                  const isConcluded = neg.status === 'concluida';
                  const isCancelled = neg.status === 'cancelada';

                  // Determine persona color
                  const personaDef = DEFAULT_PERSONAS.find(p => p.name.toLowerCase() === neg.buyerName.toLowerCase());
                  const avatarColor = personaDef ? personaDef.avatarColor : 'from-blue-600 to-indigo-700';

                  return (
                    <div
                      key={neg.id}
                      className={`bg-white rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                        isAgreed
                          ? 'border-emerald-300 ring-2 ring-emerald-400/20 bg-emerald-50/10'
                          : isCounter
                          ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/10'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="space-y-3.5">
                        {/* Persona Identity Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                              {neg.buyerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">
                                Identidade do Comprador
                              </span>
                              <span className="text-xs font-black text-neutral-900 truncate block">
                                {neg.buyerName}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                              isAgreed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isCounter
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                : isConcluded
                                ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                : isCancelled
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {isAgreed
                              ? 'Acordo Aceite!'
                              : isCounter
                              ? 'Contraproposta Vendedor'
                              : isConcluded
                              ? 'Comprado'
                              : isCancelled
                              ? 'Cancelado'
                              : 'Aguardando Vendedor'}
                          </span>
                        </div>

                        {/* Product Info & Offer */}
                        <div className="flex items-center gap-3">
                          <img
                            src={neg.productImage}
                            alt={neg.productName}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-2xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                            onError={e => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-neutral-900 truncate">
                              {neg.productName}
                            </h4>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              Vendedor: <strong className="text-neutral-800">{neg.sellerName}</strong>
                            </div>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-sm font-black text-[#FF6A00] tabular-nums">
                                {formatKz(neg.currentProposedPrice)}
                              </span>
                              <span className="text-[10px] text-neutral-400 line-through tabular-nums">
                                {formatKz(neg.listedPrice)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Last Message Preview */}
                        {neg.messages && neg.messages.length > 0 && (
                          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-700 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span className="font-bold uppercase">
                                Última mensagem ({neg.messages[neg.messages.length - 1].senderName}):
                              </span>
                              <span>
                                {new Date(neg.messages[neg.messages.length - 1].timestamp).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="line-clamp-2 italic text-neutral-800 text-[11px]">
                              "{neg.messages[neg.messages.length - 1].text}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-100">
                        {/* Open Chat as this Persona */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNegotiation(neg);
                            setCounterPriceInput(neg.currentProposedPrice);
                          }}
                          className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Conversar como {neg.buyerName.split(' ')[0]}</span>
                        </button>

                        {/* Conclude Purchase Button (only enabled when agreement is reached) */}
                        {!isConcluded && !isCancelled && (
                          isAgreed ? (
                            <button
                              type="button"
                              onClick={() => handleConcludePurchase(neg)}
                              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                              title="Acordo alcançado! Concluir a compra e creditar o vendedor"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pagar {formatKz(neg.currentProposedPrice)}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNegotiation(neg);
                                setCounterPriceInput(neg.currentProposedPrice);
                              }}
                              className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="Troca conversa até chegarem a um acordo antes de concluir"
                            >
                              <Handshake className="w-3.5 h-3.5" />
                              <span>Negociar Acordo</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: ESTATÍSTICAS DA PLATAFORMA */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Total de Utilizadores
              </span>
              <div className="text-2xl font-black text-neutral-900">{users.length}</div>
              <p className="text-[11px] text-neutral-500">Membros registados em Angola</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Cadastros por Validar
              </span>
              <div className="text-2xl font-black text-amber-600">{pendingKycCount}</div>
              <p className="text-[11px] text-neutral-500">Aguardam aprovação do BI</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Depósitos Pendentes
              </span>
              <div className="text-2xl font-black text-emerald-600">{pendingDepositsCount}</div>
              <p className="text-[11px] text-neutral-500">Aguardam validação de recibo</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Artigos P2P à Venda
              </span>
              <div className="text-2xl font-black text-[#FF6A00]">{activeUserListings.length}</div>
              <p className="text-[11px] text-neutral-500">Produtos anunciados por usuários</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR E REMOVER SALDO DO MEMBRO */}
      {/* ======================================================== */}
      {adjustingUser && (() => {
        const targetWallet = getWallet(adjustingUser.id);
        const numAmount = Number(adjustAmount) || 0;
        const projectedBalance = adjustType === 'add'
          ? targetWallet.availableBalance + numAmount
          : targetWallet.availableBalance - numAmount;
        const isInsufficient = adjustType === 'remove' && numAmount > targetWallet.availableBalance;

        return (
          <div
            onClick={() => setAdjustingUser(null)}
            className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 animate-scaleUp text-neutral-900 my-auto"
            >
              {/* Header */}
              <div className="p-5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    adjustType === 'add' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {adjustType === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {adjustType === 'add' ? 'Adicionar Saldo (Crédito)' : 'Remover Saldo (Débito)'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Gestão de Carteira Digital do Membro
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAdjustBalanceSubmit} className="p-6 space-y-5">
                {/* Member Summary Card */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-amber-400 font-black text-base flex items-center justify-center shrink-0">
                      {adjustingUser.name ? adjustingUser.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-neutral-900 truncate">
                        {adjustingUser.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {adjustingUser.email}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        BI: {adjustingUser.idNumber || 'Não indicado'} • {adjustingUser.phone || 'Sem telefone'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                      Saldo Atual
                    </span>
                    <span className="text-base font-black text-neutral-950 tabular-nums">
                      {formatKz(targetWallet.availableBalance)}
                    </span>
                  </div>
                </div>

                {/* Operation Type Toggle (Adicionar vs Remover) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Tipo de Operação:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustType('add');
                        setAdjustReason('Crédito manual pelo Administrador');
                      }}
                      className={`py-3 px-4 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        adjustType === 'add'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>+ Adicionar Saldo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustType('remove');
                        setAdjustReason('Débito manual pelo Administrador');
                      }}
                      className={`py-3 px-4 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        adjustType === 'remove'
                          ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                      <span>- Remover Saldo</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800">
                      Montante da Operação (em Kwanzas - Kz):
                    </label>
                    {numAmount > 0 && (
                      <span className="text-xs font-black text-amber-600 tabular-nums">
                        {formatKz(numAmount)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={e => setAdjustAmount(e.target.value)}
                      placeholder="Ex: 50000"
                      min="500"
                      step="500"
                      required
                      className="w-full pl-4 pr-14 py-3 bg-neutral-50 border-2 border-neutral-300 rounded-2xl text-base font-black text-neutral-900 tabular-nums focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-black text-neutral-400">
                      Kz
                    </span>
                  </div>

                  {/* Fast Amount Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-neutral-400 mr-1">Atalhos:</span>
                    {[10000, 25000, 50000, 100000, 250000, 500000, 1000000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAdjustAmount(amt)}
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-black rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                      >
                        +{amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block">
                    Motivo / Justificação da Operação:
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    placeholder="Ex: Bónus de boas-vindas, recarga administrativa, estorno de transação..."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />

                  {/* Fast Reason Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[
                      'Bónus de Boas-vindas',
                      'Recarga direta Admin',
                      'Ajuste Administrativo',
                      'Estorno de Compra',
                      'Prémio de Revenda'
                    ].map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setAdjustReason(reason)}
                        className="px-2 py-0.5 bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-900 text-[10px] font-semibold rounded-md border border-neutral-200 transition-colors cursor-pointer"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Calculation Preview Card */}
                <div className={`p-4 rounded-2xl border ${
                  isInsufficient
                    ? 'bg-red-50 border-red-300 text-red-950'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                } space-y-2`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Previsão Contabilística do Saldo:
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Saldo Atual:</span>
                    <span className="font-bold tabular-nums">{formatKz(targetWallet.availableBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Operação ({adjustType === 'add' ? 'Crédito +' : 'Débito -'}):</span>
                    <span className={`font-black tabular-nums ${adjustType === 'add' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {adjustType === 'add' ? '+' : '-'}{formatKz(numAmount)}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-1.5 flex items-center justify-between text-xs font-black">
                    <span>Novo Saldo Previsto:</span>
                    <span className={`text-sm tabular-nums ${isInsufficient ? 'text-red-600' : 'text-neutral-950'}`}>
                      {formatKz(Math.max(0, projectedBalance))}
                    </span>
                  </div>

                  {isInsufficient && (
                    <div className="text-[11px] text-red-700 font-bold flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Impossível debitar: montante superior ao saldo disponível do membro!</span>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingUser(null)}
                    className="flex-1 py-3 px-4 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isAdjusting || numAmount <= 0 || isInsufficient}
                    className={`flex-1 py-3 px-4 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    }`}
                  >
                    {isAdjusting ? (
                      <span>A processar...</span>
                    ) : (
                      <>
                        {adjustType === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        <span>
                          {adjustType === 'add' ? 'Confirmar Crédito' : 'Confirmar Débito'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL: ZOOM DO BILHETE DE IDENTIDADE (BI) */}
      {/* ======================================================== */}
      {zoomedDoc && (
        <div
          onClick={() => setZoomedDoc(null)}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-neutral-900 text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-neutral-800 animate-scaleUp space-y-3 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">{zoomedDoc.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomedDoc(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/60 border border-neutral-800 flex items-center justify-center p-2 max-h-[72vh]">
              <img
                src={zoomedDoc.src}
                alt={zoomedDoc.title}
                className="max-w-full max-h-[68vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span>Documento Oficial de Cidadão Nacional (Angola)</span>
              <button
                type="button"
                onClick={() => setZoomedDoc(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ZOOM DO COMPROVATIVO DE DEPÓSITO */}
      {/* ======================================================== */}
      {zoomedReceipt && (
        <div
          onClick={() => setZoomedReceipt(null)}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-neutral-900 text-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-800 animate-scaleUp space-y-4 p-5"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">{zoomedReceipt.title}</h3>
                <span className="text-[11px] text-neutral-400">
                  Ref: {zoomedReceipt.deposit.reference} • {formatPaymentMethodLabel(zoomedReceipt.deposit.paymentMethod)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedReceipt(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/60 border border-neutral-800 flex items-center justify-center p-2 max-h-[65vh]">
              <img
                src={zoomedReceipt.src}
                alt="Comprovativo"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleRejectDeposit(zoomedReceipt.deposit);
                  setZoomedReceipt(null);
                }}
                className="px-4 py-2 border border-red-500 text-red-400 hover:bg-red-950/40 text-xs font-bold rounded-xl cursor-pointer"
              >
                Recusar Depósito
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApproveDeposit(zoomedReceipt.deposit);
                  setZoomedReceipt(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Aprovar e Creditar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MOTIVO DE REJEIÇÃO DE MOVIMENTO (TODOS OS MOVIMENTOS) */}
      {/* ======================================================== */}
      {rejectingMovement && (
        <div
          onClick={() => setRejectingMovement(null)}
          className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <form
            onSubmit={handleConfirmRejectMovement}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-scaleUp text-neutral-900"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <XCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    {rejectingMovement.type === 'deposit' && 'Rejeitar Depósito'}
                    {rejectingMovement.type === 'withdrawal' && 'Rejeitar Levantamento (Saque)'}
                    {rejectingMovement.type === 'order' && 'Rejeitar Pedido de Compra'}
                    {rejectingMovement.type === 'listing' && 'Rejeitar Anúncio de Revenda'}
                    {rejectingMovement.type === 'negotiation' && 'Rejeitar Proposta de Negociação'}
                  </h3>
                  <span className="text-[11px] text-neutral-500 block">
                    Indica o motivo obrigatório da rejeição para o utilizador
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingMovement(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Utilizador:</span>
                <strong className="text-neutral-900 truncate">
                  {rejectingMovement.type === 'deposit' && rejectingMovement.item.userName}
                  {rejectingMovement.type === 'withdrawal' && rejectingMovement.item.userName}
                  {rejectingMovement.type === 'order' && rejectingMovement.item.buyerName}
                  {rejectingMovement.type === 'listing' && rejectingMovement.item.sellerName}
                  {rejectingMovement.type === 'negotiation' && `${rejectingMovement.item.buyerName} → ${rejectingMovement.item.sellerName}`}
                </strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Montante:</span>
                <strong className="text-red-700 tabular-nums">
                  {rejectingMovement.type === 'deposit' && formatKz(rejectingMovement.item.amount)}
                  {rejectingMovement.type === 'withdrawal' && formatKz(rejectingMovement.item.amount)}
                  {rejectingMovement.type === 'order' && formatKz(rejectingMovement.item.totalAmount)}
                  {rejectingMovement.type === 'listing' && formatKz(rejectingMovement.item.listingPrice)}
                  {rejectingMovement.type === 'negotiation' && formatKz(rejectingMovement.item.currentProposedPrice)}
                </strong>
              </div>
              {rejectingMovement.type === 'deposit' && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500">Referência:</span>
                  <span className="font-mono text-neutral-700 truncate">{rejectingMovement.item.reference}</span>
                </div>
              )}
              {rejectingMovement.type === 'withdrawal' && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">IBAN:</span>
                  <span className="font-mono text-neutral-700 truncate">{rejectingMovement.item.iban}</span>
                </div>
              )}
              {(rejectingMovement.type === 'listing' || rejectingMovement.type === 'negotiation') && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">Produto:</span>
                  <span className="font-semibold text-neutral-800 truncate">{rejectingMovement.item.productName}</span>
                </div>
              )}
              {rejectingMovement.type === 'order' && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">Artigo(s):</span>
                  <span className="font-semibold text-neutral-800 truncate">
                    {rejectingMovement.item.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-neutral-900 block">
                Motivo da Rejeição (será exibido ao utilizador no extrato e notificação):
              </label>
              <textarea
                value={movementRejectionReason}
                onChange={e => {
                  setMovementRejectionReason(e.target.value);
                  setMovementRejectionError(null);
                }}
                rows={3}
                autoFocus
                placeholder={
                  rejectingMovement.type === 'deposit'
                    ? 'Escreve o motivo da rejeição (ex: comprovativo ilegível, valor divergente...)'
                    : rejectingMovement.type === 'withdrawal'
                    ? 'Escreve o motivo da rejeição (ex: IBAN incorreto, titular divergente...)'
                    : rejectingMovement.type === 'order'
                    ? 'Escreve o motivo da rejeição do pedido de compra...'
                    : rejectingMovement.type === 'listing'
                    ? 'Escreve o motivo da recusa do anúncio de revenda...'
                    : 'Escreve o motivo da recusa da proposta de negociação...'
                }
                className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
              <div className="flex flex-wrap gap-1.5">
                {(rejectingMovement.type === 'deposit'
                  ? [
                      'Comprovativo ilegível ou cortado',
                      'Valor transferido diferente do solicitado',
                      'Comprovativo inválido ou já utilizado'
                    ]
                  : rejectingMovement.type === 'withdrawal'
                  ? [
                      'IBAN incorreto ou incompleto',
                      'Nome do titular diferente da conta BABA',
                      'Dados bancários incompatíveis para transferência'
                    ]
                  : rejectingMovement.type === 'order'
                  ? [
                      'Compra cancelada após verificação administrativa',
                      'Artigo indisponível no momento da conferência',
                      'Necessária confirmação adicional de saldo'
                    ]
                  : rejectingMovement.type === 'listing'
                  ? [
                      'Preço de revenda fora dos parâmetros da plataforma',
                      'Descrição inadequada para publicação no mercado',
                      'Artigo requer revisão antes de publicar'
                    ]
                  : [
                      'Valor proposto abaixo do limite aceitável',
                      'Proposta recusada pela moderação administrativa'
                    ]
                ).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setMovementRejectionReason(preset);
                      setMovementRejectionError(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-700 border border-neutral-200 text-[10px] font-semibold cursor-pointer transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {movementRejectionError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                {movementRejectionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingMovement(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-red-600/20"
              >
                Confirmar Rejeição
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MOTIVO DE REJEIÇÃO DE CADASTRO (BI) */}
      {/* ======================================================== */}
      {rejectingUser && (
        <div
          onClick={() => setRejectingUser(null)}
          className="fixed inset-0 z-[140] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-scaleUp"
          >
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-6 h-6" />
              <h3 className="text-base font-black text-neutral-900">
                Rejeitar Validação de Documento
              </h3>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Indica o motivo pelo qual o documento de <strong>{rejectingUser.name}</strong> não pôde ser aprovado. O utilizador receberá esta informação na sua conta para reenviar uma nova fotografia.
            </p>

            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                Motivo da Recusa (obrigatório):
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => {
                  setRejectionReason(e.target.value);
                  setKycRejectionError(null);
                }}
                rows={3}
                className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {kycRejectionError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                {kycRejectionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingUser(null);
                  setKycRejectionError(null);
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectKYC}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-red-600/20"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUSPENDER CONTA DE UTILIZADOR */}
      {/* ======================================================== */}
      {suspendingUser && (
        <div
          onClick={() => setSuspendingUser(null)}
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-scaleUp"
          >
            <div className="flex items-center gap-3 text-orange-600">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">
                  Suspender Usuário
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Bloquear acesso temporariamente na plataforma
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Vais suspender a conta de <strong>{suspendingUser.name}</strong> ({suspendingUser.phone}). Enquanto estiver suspensa, não poderá iniciar sessão nem operar no mercado.
            </p>

            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                Motivo da Suspensão:
              </label>
              <textarea
                value={suspensionReason}
                onChange={e => setSuspensionReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspendUser}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-orange-600/20 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirmar Suspensão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ELIMINAR CONTA DE UTILIZADOR */}
      {/* ======================================================== */}
      {deletingUser && (
        <div
          onClick={() => setDeletingUser(null)}
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-scaleUp"
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">
                  Eliminar Conta do Utilizador
                </h3>
                <span className="text-[11px] text-red-600 font-bold">
                  Ação permanente e irreversível
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
              <div><strong>Nome:</strong> {deletingUser.name}</div>
              <div><strong>Email:</strong> {deletingUser.email}</div>
              <div><strong>Telefone:</strong> {deletingUser.phone}</div>
              <div><strong>Nº do BI:</strong> {deletingUser.idNumber}</div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Tens a certeza de que desejas eliminar permanentemente a conta de <strong>{deletingUser.name}</strong>? Todos os anúncios ativos e o acesso desta conta serão removidos da plataforma.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-red-600/25 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Conta Permanentemente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: COMPRA DIRETA PELO ADMINISTRADOR */}
      {/* ======================================================== */}
      {buyingListing && (
        <div
          onClick={() => setBuyingListing(null)}
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-scaleUp"
          >
            <div className="flex items-center gap-3 text-neutral-900">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">
                  Comprar Artigo do Utilizador
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Aquisição direta pela Administração BABA
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
              <img
                src={buyingListing.imageUrl}
                alt={buyingListing.productName}
                className="w-14 h-14 object-cover rounded-xl border border-neutral-200"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-black text-neutral-900 truncate">
                  {buyingListing.productName}
                </h4>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Vendedor: <strong>{buyingListing.sellerName}</strong>
                </div>
                <div className="text-xs font-black text-[#FF6A00] mt-0.5">
                  Valor a Pagar: {formatKz(buyingListing.listingPrice)}
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Ao confirmar, o valor de <strong>{formatKz(buyingListing.listingPrice)}</strong> será debitado da conta da administração e creditado imediatamente na carteira digital do vendedor <strong>{buyingListing.sellerName}</strong>. O artigo ficará marcado como adquirido/vendido.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBuyingListing(null)}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessingBuy}
                onClick={handleConfirmAdminBuy}
                className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-amber-400 text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isProcessingBuy ? (
                  <span>A processar aquisição...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Confirmar Pagamento ({formatKz(buyingListing.listingPrice)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PROPOSTA DE NEGOCIAÇÃO COM 1 A 5 PERSONAS */}
      {/* ======================================================== */}
      {negotiatingListing && (
        <div
          onClick={() => setNegotiatingListing(null)}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-5 animate-scaleUp my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Handshake className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    Negociação com 1 a 5 Compradores (Personas)
                  </h3>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    O vendedor pensará que são pessoas reais diferentes a disputar o produto!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNegotiatingListing(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <img
                src={negotiatingListing.imageUrl}
                alt={negotiatingListing.productName}
                className="w-14 h-14 object-cover rounded-xl border border-neutral-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-neutral-900 truncate">
                  {negotiatingListing.productName}
                </h4>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Vendedor: <strong className="text-neutral-800">{negotiatingListing.sellerName}</strong>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-[#FF6A00]">
                    Preço Pedido: {formatKz(negotiatingListing.listingPrice)}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    (Original: {formatKz(negotiatingListing.originalPrice)})
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Box: Quantas Conversas Queres Começar (1 a 5) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white border border-blue-500/30 shadow-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Decisão do Administrador: Escolhe o Número de Conversas
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/90 mt-0.5">
                    Tu decides se queres começar <strong>1, 2, 3, 4 ou 5 conversas</strong> em simultâneo com nomes e perfis distintos:
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-blue-900/50 border border-blue-400/30 px-3 py-1 rounded-xl">
                  <span className="text-[11px] font-bold text-blue-200">Selecionadas:</span>
                  <span className="text-xs font-black text-amber-400">{selectedPersonaIds.length} de 5</span>
                </div>
              </div>

              {/* Selector Buttons: 1 to 5 */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isActive = selectedPersonaIds.length === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectPersonaCount(num)}
                      className={`py-2 px-1 sm:px-3 rounded-xl text-center font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-amber-400 scale-[1.03]'
                          : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm sm:text-base leading-none">{num}</span>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-tight opacity-90">
                        {num === 1 ? 'Conversa' : 'Conversas'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Button for Selected Personas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
                <span className="text-[11px] text-blue-200/80">
                  O vendedor receberá <strong>{selectedPersonaIds.length}</strong> proposta(s) com perfis independentes, acreditando que são pessoas reais diferentes a disputar o produto.
                </span>

                <button
                  type="button"
                  disabled={isBatchLaunching || selectedPersonaIds.length === 0}
                  onClick={handleStartSelectedPersonas}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-neutral-950 fill-neutral-950" />
                  <span>
                    {isBatchLaunching
                      ? 'A Iniciar Conversas...'
                      : `Iniciar as ${selectedPersonaIds.length} Conversa${selectedPersonaIds.length === 1 ? '' : 's'} Escolhida${selectedPersonaIds.length === 1 ? '' : 's'}`}
                  </span>
                </button>
              </div>
            </div>

            {/* List of 5 Personas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
                <span>Configurar Cada Persona & Ajustar Propostas:</span>
                <span className="text-[11px] text-neutral-500">Podes ativar/desativar individualmente ou editar os valores</span>
              </div>

              {DEFAULT_PERSONAS.map((persona, idx) => {
                const buyerId = `persona_${persona.id}_${negotiatingListing.id}`;
                const existingNeg = negotiations.find(n => n.listingId === negotiatingListing.id && n.buyerId === buyerId);
                const isSelected = selectedPersonaIds.includes(persona.id);
                const currentOffer = personaOffers[persona.id] || {
                  name: persona.name,
                  price: Math.max(1000, Math.round(negotiatingListing.listingPrice * (1 - persona.discountPercent / 100))),
                  message: persona.defaultMessage
                };

                return (
                  <div
                    key={persona.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      existingNeg
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-neutral-200 bg-neutral-50/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Persona Header with Individual Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox selector */}
                        <button
                          type="button"
                          onClick={() => handleTogglePersona(persona.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white border-neutral-300 text-transparent hover:border-blue-400'
                          }`}
                          title={isSelected ? 'Desmarcar esta conversa' : 'Marcar esta conversa para iniciar'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${persona.avatarColor} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-neutral-900">
                              {currentOffer.name}
                            </span>
                            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.2 rounded">
                              {persona.location}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.2 rounded">
                                Selecionada
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            Contacto: {persona.phone}
                          </span>
                        </div>
                      </div>

                      {/* Status if already active */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {existingNeg ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Conversa Ativa ({formatKz(existingNeg.currentProposedPrice)})</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePersona(persona.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {isSelected ? 'Incluída no lote' : 'Clique para incluir'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      {/* Name Input */}
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                          Nome da Persona:
                        </label>
                        <input
                          type="text"
                          value={currentOffer.name}
                          onChange={e => {
                            const val = e.target.value;
                            setPersonaOffers(prev => ({
                              ...prev,
                              [persona.id]: { ...currentOffer, name: val }
                            }));
                          }}
                          placeholder="Nome do Comprador"
                          className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Price Proposal Input */}
                      <div className="sm:col-span-7">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            Valor Proposto (Kz):
                          </label>
                          <div className="flex items-center gap-1">
                            {[-10, -15, -20, -30].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  const newPrice = Math.max(1000, Math.round(negotiatingListing.listingPrice * (1 + pct / 100) / 500) * 500);
                                  setPersonaOffers(prev => ({
                                    ...prev,
                                    [persona.id]: { ...currentOffer, price: newPrice }
                                  }));
                                }}
                                className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[9px] font-bold cursor-pointer"
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="number"
                          value={currentOffer.price}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setPersonaOffers(prev => ({
                              ...prev,
                              [persona.id]: { ...currentOffer, price: val }
                            }));
                          }}
                          min={1000}
                          step={500}
                          className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-black text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                        />
                      </div>

                      {/* Message Input */}
                      <div className="sm:col-span-12">
                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                          Mensagem Inicial para o Vendedor:
                        </label>
                        <input
                          type="text"
                          value={currentOffer.message}
                          onChange={e => {
                            const val = e.target.value;
                            setPersonaOffers(prev => ({
                              ...prev,
                              [persona.id]: { ...currentOffer, message: val }
                            }));
                          }}
                          placeholder="Mensagem desta persona..."
                          className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Action for this Persona */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {existingNeg ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNegotiation(existingNeg);
                              setCounterPriceInput(existingNeg.currentProposedPrice);
                              setNegotiatingListing(null);
                            }}
                            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Conversar como {currentOffer.name.split(' ')[0]}</span>
                          </button>
                          {existingNeg.status === 'aceite' ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleConcludePurchase(existingNeg);
                                setNegotiatingListing(null);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pagar {formatKz(existingNeg.currentProposedPrice)}</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              Em conversa até acordo
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartSinglePersona(persona)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Proposta como {currentOffer.name.split(' ')[0]} ({formatKz(currentOffer.price)})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setNegotiatingListing(null)}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-bold text-xs rounded-xl hover:bg-neutral-50 cursor-pointer text-center"
              >
                Fechar
              </button>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setNegotiatingListing(null);
                    setActiveTab('negotiations');
                  }}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Handshake className="w-4 h-4 text-neutral-600" />
                  <span>Mesa de Negociações</span>
                </button>
                <button
                  type="button"
                  disabled={isBatchLaunching || selectedPersonaIds.length === 0}
                  onClick={handleStartSelectedPersonas}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{isBatchLaunching ? 'A Iniciar...' : `Iniciar ${selectedPersonaIds.length} Conversa(s)`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHAT DE NEGOCIAÇÃO ABERTO (SOB IDENTIDADE DA PERSONA) */}
      {/* ======================================================== */}
      {liveSelectedNegotiation && (() => {
        const sameListingNegs = negotiations.filter(n => n.listingId === liveSelectedNegotiation.listingId);
        const isClosed = liveSelectedNegotiation.status === 'concluida' || liveSelectedNegotiation.status === 'cancelada';
        const isAgreed = liveSelectedNegotiation.status === 'aceite';
        return (
          <div
            onClick={() => setSelectedNegotiation(null)}
            className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh] animate-scaleUp my-auto"
            >
              {/* Header */}
              <div className="p-4 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={liveSelectedNegotiation.productImage}
                    alt={liveSelectedNegotiation.productName}
                    className="w-12 h-12 rounded-xl object-cover bg-neutral-800 shrink-0 border border-neutral-700"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-white truncate">
                      {liveSelectedNegotiation.productName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-neutral-300">
                        Vendedor: <strong>{liveSelectedNegotiation.sellerName}</strong>
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-xs text-amber-400 font-black">
                        {formatKz(liveSelectedNegotiation.currentProposedPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNegotiation(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 5-Conversation Switcher Bar */}
              {sameListingNegs.length > 1 && (
                <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase shrink-0 mr-1">
                    Conversas ({sameListingNegs.length}):
                  </span>
                  {sameListingNegs.map((item, idx) => {
                    const active = item.id === liveSelectedNegotiation.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedNegotiation(item);
                          setCounterPriceInput(item.currentProposedPrice);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-amber-400 text-neutral-950 shadow-xs'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        <span>#{idx + 1} {item.buyerName.split(' ')[0]}</span>
                        {item.status === 'aceite' && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Persona Active Notice Banner */}
              <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                  <span className="truncate">
                    A conversar como: <strong className="text-blue-950 font-black underline">{liveSelectedNegotiation.buyerName}</strong>
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                  isAgreed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAgreed ? '✓ Acordo Aceite' : liveSelectedNegotiation.status}
                </span>
              </div>

              {/* Messages Body */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-neutral-50/50 min-h-[220px]">
                {liveSelectedNegotiation.messages.length === 0 ? (
                  <p className="text-center text-xs text-neutral-400 py-8">
                    Inicia a conversa com o vendedor abaixo até chegarem a um acordo.
                  </p>
                ) : (
                  liveSelectedNegotiation.messages.map(m => {
                    const isSentByPersona = m.senderId === liveSelectedNegotiation.buyerId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isSentByPersona ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-neutral-400 px-1 mb-0.5">
                          {isSentByPersona ? `Tu (como ${liveSelectedNegotiation.buyerName})` : `${m.senderName} (Vendedor)`} • {new Date(m.timestamp).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                            isSentByPersona
                              ? 'bg-neutral-900 text-amber-400 rounded-tr-xs shadow-xs'
                              : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-xs shadow-2xs'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Seller Counteroffer quick accept banner when seller proposed a counter price */}
              {!isClosed && !isAgreed && liveSelectedNegotiation.lastOfferBy === 'seller' && liveSelectedNegotiation.status === 'contraproposta' && (
                <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-amber-950">
                    O vendedor propôs {formatKz(liveSelectedNegotiation.currentProposedPrice)}:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAcceptSellerCounterOffer(liveSelectedNegotiation)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aceitar Proposta do Vendedor</span>
                  </button>
                </div>
              )}

              {/* Counteroffer Tool inside Chat (always open until closed so Admin & seller can negotiate freely) */}
              {!isClosed && (
                <div className="p-3 bg-neutral-100/80 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-neutral-600 whitespace-nowrap">
                      Propor Valor (Kz):
                    </span>
                    <input
                      type="number"
                      value={counterPriceInput || ''}
                      onChange={e => setCounterPriceInput(Number(e.target.value))}
                      placeholder="Novo preço em Kz"
                      step={500}
                      className="w-28 p-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-black text-neutral-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendPersonaCounterOffer}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Enviar Proposta
                    </button>
                  </div>

                  {/* Conclude Purchase Action (requires agreement reached) */}
                  {isAgreed ? (
                    <button
                      type="button"
                      onClick={() => handleConcludePurchase(liveSelectedNegotiation)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="Acordo aceite! Concluir compra e creditar vendedor"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar & Concluir ({formatKz(liveSelectedNegotiation.currentProposedPrice)})</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                      Conversa até acordo
                    </span>
                  )}
                </div>
              )}

              {/* Message input */}
              {!isClosed && (
                <form
                  onSubmit={handleSendPersonaChatMessage}
                  className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder={`Escrever mensagem como ${liveSelectedNegotiation.buyerName}...`}
                    className="flex-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="p-2.5 bg-neutral-950 text-amber-400 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                    title={`Enviar como ${liveSelectedNegotiation.buyerName}`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
