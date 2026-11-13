export type UserRole = 'admin' | 'client';
export type AccountStatus = 'ativo' | 'em_processamento' | 'rejeitado';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  role: UserRole;
  idNumber: string;
  birthDate: string;
  accountStatus: AccountStatus;
  password?: string;
  idCardFront?: string;
  idCardBack?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  iconName: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  officialPrice: number;
  suggestedResalePrice: number;
  stock: number;
  imageUrl: string;
  gallery?: string[];
  status: 'disponivel' | 'esgotado' | 'descontinuado';
  type: 'fisico' | 'digital';
  createdAt: string;
  resaleEligible: boolean;
  deliveryTime: string;
  deliveryConditions: string;
  moq: string;
  supplierName: string;
  supplierRating: number;
  features: string[];
  colors?: string[];
  selectedColor?: string;
}

export interface ProductColorOption {
  name: string;
  hex: string;
  border: string;
}

export const PRODUCT_8_COLORS: ProductColorOption[] = [
  { name: 'Preto', hex: '#171717', border: '#404040' },
  { name: 'Branco', hex: '#FFFFFF', border: '#D4D4D4' },
  { name: 'Azul', hex: '#2563EB', border: '#1D4ED8' },
  { name: 'Vermelho', hex: '#DC2626', border: '#B91C1C' },
  { name: 'Dourado', hex: '#EAB308', border: '#CA8A04' },
  { name: 'Verde', hex: '#16A34A', border: '#15803D' },
  { name: 'Prata', hex: '#94A3B8', border: '#64748B' },
  { name: 'Rosa', hex: '#EC4899', border: '#DB2777' }
];

export const DEFAULT_8_COLORS: string[] = [
  'Preto',
  'Branco',
  'Azul',
  'Vermelho',
  'Dourado',
  'Verde',
  'Prata',
  'Rosa'
];

export interface UserProduct {
  id: string;
  originalProductId: string;
  productName: string;
  productImage: string;
  category: string;
  originalPrice: number;
  purchasePrice?: number;
  resaleCycle?: number;
  previousOwnerName?: string;
  currentOwnerId: string;
  purchaseDate: string;
  status: 'disponivel' | 'anunciado' | 'vendido';
  type: 'fisico' | 'digital';
  condition: 'novo' | 'como_novo' | 'bom_estado';
  serialNumber: string;
  colors?: string[];
  selectedColor?: string;
}

export interface ResaleListing {
  id: string;
  userProductId: string;
  sellerId: string;
  sellerName: string;
  productName: string;
  category: string;
  imageUrl: string;
  originalPrice: number;
  listingPrice: number;
  customDescription: string;
  status: 'ativo' | 'vendido' | 'pausado';
  allowNegotiation: boolean;
  minAcceptablePrice: number;
  resaleCycle?: number;
  createdAt: string;
  updatedAt: string;
  colors?: string[];
  selectedColor?: string;
}

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Negotiation {
  id: string;
  listingId: string;
  userProductId: string;
  productName: string;
  productImage: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  listedPrice: number;
  currentProposedPrice: number;
  lastOfferBy: 'buyer' | 'seller';
  status: 'pendente' | 'contraproposta' | 'aceite' | 'recusada' | 'concluida' | 'cancelada';
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
  messages: NegotiationMessage[];
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  reservedBalance: number;
  totalDeposited: number;
  totalSpent: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'carregamento' | 'compra_oficial' | 'compra_revenda' | 'venda_recebida' | 'taxa_plataforma' | 'levantamento';
  amount: number;
  feeAmount?: number;
  netAmount?: number;
  status: 'confirmada' | 'pendente' | 'recusada';
  reference: string;
  description: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface DeliveryAddress {
  province: string;
  city: string;
  street: string;
  recipientName: string;
  recipientPhone: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  source: 'oficial' | 'revenda';
  userProductId?: string;
  sellerId?: string;
  selectedColor?: string;
}

export type OrderStatus =
  | 'aguardando_pagamento'
  | 'pagamento_confirmado'
  | 'em_preparacao'
  | 'enviado'
  | 'em_entrega'
  | 'entregue'
  | 'cancelado';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId?: string;
  sellerName?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'carteira' | 'multicaixa' | 'transferencia';
  paymentReference: string;
  status: OrderStatus;
  source: 'oficial' | 'revenda';
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  receiptProof?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankName: string;
  iban: string;
  accountHolder: string;
  status: 'pendente' | 'processado' | 'rejeitado';
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'venda' | 'compra' | 'negociacao' | 'sistema';
  read: boolean;
  linkType?: 'produto' | 'negociacao' | 'carteira';
  linkId?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  source: 'oficial';
  selectedColor?: string;
}
