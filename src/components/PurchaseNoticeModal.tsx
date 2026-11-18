import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
  Upload,
  FileText,
  Check,
  ShieldCheck,
  Copy,
  RotateCcw
} from 'lucide-react';
import { formatKz } from '../services/db';
import { readReceiptFileToDataUrl, copyTextToClipboard } from '../utils/image';

export interface PurchaseNotice {
  type: 'insufficient_funds' | 'success' | 'deposit_success';
  productName: string;
  price: number;
  availableBalance: number;
  orderId?: string;
  product?: any;
}

interface PurchaseNoticeModalProps {
  notice: PurchaseNotice | null;
  onClose: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToMyProducts?: () => void;
  onQuickDeposit?: () => void;
  onDepositAndBuy?: (
    depositAmount: number,
    paymentMethod: string,
    reference: string,
    receiptProof?: string
  ) => void;
  onNavigateToDeposit?: (suggestedAmount?: number) => void;
  currentUser?: any;
}

export const PurchaseNoticeModal: React.FC<PurchaseNoticeModalProps> = ({
  notice,
  onClose,
  onDepositAndBuy,
  onQuickDeposit,
  currentUser
}) => {
  // AVISO E CARREGAMENTO SÓ APARECEM EXCLUSIVAMENTE QUANDO TENTA COMPRAR E NÃO TEM SALDO SUFICIENTE
  if (!notice || notice.type !== 'insufficient_funds') return null;

  const missingAmount = Math.max(0, notice.price - notice.availableBalance);

  // Step state: 'notice' (first view with Carregar Já) | 'deposit' (deposit view with receipt faixa)
  const [step, setStep] = useState<'notice' | 'deposit'>('notice');

  // Deposit form state
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'multicaixa_express' | 'paypay'>('multicaixa_express');
  const [receiptProof, setReceiptProof] = useState<string | null>(null);
  const [receiptProofName, setReceiptProofName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<'xpress' | 'ent' | 'ref' | null>(null);

  const handleCopyField = async (value: string, key: 'xpress' | 'ent' | 'ref') => {
    const ok = await copyTextToClipboard(value);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Reset when notice changes
  useEffect(() => {
    if (notice && notice.type === 'insufficient_funds') {
      setCustomAmount(0);
      setStep('notice');
      setReceiptProof(null);
      setReceiptProofName('');
      setErrorMessage(null);
    }
  }, [notice]);

  // Handle file upload for receipt proof
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage('O ficheiro do comprovativo deve ter no máximo 15MB.');
        return;
      }
      setErrorMessage(null);
      setReceiptProofName(file.name);
      readReceiptFileToDataUrl(file)
        .then(dataUrl => {
          setReceiptProof(dataUrl);
          setErrorMessage(null);
        })
        .catch((err: any) => {
          setReceiptProof(null);
          setReceiptProofName('');
          setErrorMessage(err?.message || 'Não foi possível processar o comprovativo selecionado.');
        });
    }
  };

  // Submit deposit: conclui apenas o carregamento
  const handleConfirmDeposit = () => {
    setErrorMessage(null);
    if (!customAmount || customAmount <= 0 || isNaN(customAmount)) {
      setErrorMessage('Por favor, seleciona ou introduz o valor que desejas depositar.');
      return;
    }
    if (!receiptProof) {
      setErrorMessage('Por favor, carrega o comprovativo de pagamento no espaço acima antes de enviar.');
      return;
    }

    const ref =
      paymentMethod === 'paypay'
        ? `PAYPAY-10116-935723248-${Date.now().toString().slice(-4)}`
        : `XPRESS-933191188-${Date.now().toString().slice(-4)}`;

    setIsProcessing(true);
    try {
      if (onDepositAndBuy) {
        onDepositAndBuy(customAmount, paymentMethod, ref, receiptProof);
      } else if (onQuickDeposit) {
        onQuickDeposit();
      }
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar o carregamento');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-red-500/80 shadow-red-500/20 transition-all my-auto text-center p-5 sm:p-7 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar with back or close */}
        <div className="flex items-center justify-between -mt-1">
          {step === 'deposit' ? (
            <button
              type="button"
              onClick={() => {
                setStep('notice');
                setErrorMessage(null);
              }}
              className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer ml-auto"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: NOTICE VIEW */}
        {step === 'notice' && (
          <div className="space-y-4">
            {/* Big Icon Banner */}
            <div className="flex justify-center -mt-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-8 ring-red-50 shadow-lg shadow-red-500/20">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
              </div>
            </div>

            {/* Header Title */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-red-600">
                Saldo Insuficiente
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-sm mx-auto leading-relaxed">
                Não tens saldo suficiente para comprar este produto. Clica em <strong className="text-neutral-900">Carregar Já</strong> para fazer o depósito e anexar o comprovativo.
              </p>
            </div>

            {/* Financial Details Card */}
            <div className="p-3.5 rounded-2xl border text-left text-xs sm:text-sm space-y-2 bg-red-50/70 border-red-200 text-neutral-900">
              <div className="flex items-center justify-between pb-1.5 border-b border-red-200/60">
                <span className="text-neutral-500 font-semibold">Artigo:</span>
                <span className="font-extrabold text-neutral-900 max-w-[200px] truncate text-right">
                  {notice.productName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-semibold">Preço do Produto:</span>
                <span className="font-black text-sm sm:text-base tabular-nums text-red-700">
                  {formatKz(notice.price)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-semibold">Teu Saldo Atual:</span>
                <span className="font-bold text-neutral-800 tabular-nums">
                  {formatKz(notice.availableBalance)}
                </span>
              </div>

              <div className="pt-2 border-t border-red-200 flex items-center justify-between text-red-900">
                <span className="font-black text-xs uppercase tracking-wider text-red-700">
                  Valor em falta para comprar:
                </span>
                <span className="font-black text-base sm:text-lg text-red-600 tabular-nums">
                  {formatKz(missingAmount)}
                </span>
              </div>
            </div>

            {/* Amount Selector */}
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-neutral-900">
                  <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                  <span>Seleciona o valor do depósito</span>
                </div>
                {customAmount > 0 && (
                  <span className="text-xs font-black text-[#FF4500] tabular-nums">
                    {formatKz(customAmount)}
                  </span>
                )}
              </div>

              {/* Quick Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {missingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomAmount(missingAmount)}
                    className={`col-span-2 sm:col-span-3 py-2 px-2.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer tabular-nums ${
                      customAmount === missingAmount
                        ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF4500] text-white border-[#FF4500] shadow-md'
                        : 'bg-white text-neutral-800 border-amber-300 hover:border-[#FF6A00]'
                    }`}
                  >
                    Falta exata ({formatKz(missingAmount)})
                  </button>
                )}
                {[500, 1000, 5000, 10000, 25000, 50000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomAmount(val)}
                    className={`py-2 px-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer tabular-nums ${
                      customAmount === val
                        ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {formatKz(val)}
                  </button>
                ))}
              </div>

              <div>
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount || ''}
                    onChange={e => setCustomAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="Ou digita outro valor (ex: 15.000)"
                    min={1}
                    step="any"
                    className="w-full py-2.5 px-3 bg-white border-2 border-neutral-300 focus:border-[#FF6A00] rounded-xl text-sm font-black text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-neutral-400">
                    Kz
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: CARREGAR JÁ */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('deposit');
                  setErrorMessage(null);
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>⚡ Carregar Já {customAmount > 0 ? `(${formatKz(customAmount)})` : ''}</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-3 border border-neutral-300 hover:bg-neutral-100 text-neutral-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DEPOSIT & FAIXA DE COMPROVANTE */}
        {step === 'deposit' && (
          <div className="space-y-3.5 text-left">
            <div className="text-center space-y-1 pb-1 border-b border-neutral-100">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-[#FF5000] text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Carregamento da Plataforma</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-neutral-900">
                {customAmount > 0 ? `Fazer Depósito de ${formatKz(customAmount)}` : 'Seleciona o Valor do Depósito'}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Seleciona o montante, escolhe o método de pagamento e carrega o comprovativo abaixo.
              </p>
            </div>

            {/* Selectable Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-neutral-900">
                  1. Seleciona o valor do depósito (Kz):
                </label>
                {customAmount > 0 && (
                  <span className="text-xs font-black text-[#FF4500] tabular-nums">
                    {formatKz(customAmount)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {missingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAmount(missingAmount);
                      setErrorMessage(null);
                    }}
                    className={`col-span-2 sm:col-span-4 py-2 px-2.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer tabular-nums ${
                      customAmount === missingAmount
                        ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF4500] text-white border-[#FF4500] shadow-md'
                        : 'bg-amber-50 text-neutral-900 border-amber-300 hover:border-[#FF6A00]'
                    }`}
                  >
                    Falta exata ({formatKz(missingAmount)})
                  </button>
                )}
                {[500, 1000, 2500, 5000, 10000, 25000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setCustomAmount(val);
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer tabular-nums ${
                      customAmount === val
                        ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF4500] text-white border-[#FF4500] shadow-md'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    {formatKz(val)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={customAmount || ''}
                  onChange={e => {
                    setCustomAmount(Math.max(0, Number(e.target.value)));
                    setErrorMessage(null);
                  }}
                  min={1}
                  step="any"
                  placeholder="Ou digita outro valor (ex: 15.000)"
                  className="w-full py-2 px-3 pr-10 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-black text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-neutral-400">
                  Kz
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-700 block">
                Método de Recarga Oficial (Angola):
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('multicaixa_express')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    paymentMethod === 'multicaixa_express'
                      ? 'border-[#FF6A00] bg-orange-50 text-neutral-900 ring-2 ring-[#FF6A00]/40 shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <img
                    src="/assets/aistudio/IMG_4106_b00dac5c.jpeg"
                    alt="Multicaixa Express"
                    className="w-11 h-8 rounded-lg object-cover border border-orange-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-black block leading-tight truncate">Multicaixa Express</span>
                    <span className="text-[10px] font-mono font-bold text-[#FF6A00] block truncate">933 191 188</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypay')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    paymentMethod === 'paypay'
                      ? 'border-indigo-600 bg-indigo-50 text-neutral-900 ring-2 ring-indigo-500/40 shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <img
                    src="/assets/aistudio/IMG_1417_a64da3e1.jpeg"
                    alt="PayPay"
                    className="w-9 h-9 rounded-lg object-cover border border-indigo-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-black block leading-tight truncate">PayPay</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 block truncate">Ent: 10116</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Method Details Box */}
            {paymentMethod === 'multicaixa_express' && (
              <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-200 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-orange-200/70">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/assets/aistudio/IMG_4106_b00dac5c.jpeg"
                      alt="Express"
                      className="w-12 h-8 rounded-lg object-cover border border-orange-300 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-orange-800 block">Nº Xpress Oficial</span>
                      <span className="text-sm font-black font-mono text-neutral-900 tracking-wide">933 191 188</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyField('933191188', 'xpress')}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedKey === 'xpress' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'xpress' ? 'Copiado!' : 'Copiar Nº'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-neutral-700 block">
                  {customAmount > 0 ? `Transfere ${formatKz(customAmount)} via Express para ` : 'Transfere o valor selecionado via Express para '}
                  <strong>933 191 188</strong> e carrega o comprovativo abaixo.
                </span>
              </div>
            )}

            {paymentMethod === 'paypay' && (
              <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs space-y-2">
                <div className="flex items-center gap-2.5 pb-2 border-b border-indigo-200/70">
                  <img
                    src="/assets/aistudio/IMG_1417_a64da3e1.jpeg"
                    alt="PayPay"
                    className="w-9 h-9 rounded-lg object-cover border border-indigo-300 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-black text-indigo-950 block">Pagamento por Referência PayPay</span>
                    <span className="text-[10px] text-indigo-700 font-medium">Usa os dados oficiais abaixo na app PayPay</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100">
                  <span className="text-neutral-500 font-semibold">Entidade (Ent):</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-neutral-950 font-mono text-sm">10116</strong>
                    <button
                      type="button"
                      onClick={() => handleCopyField('10116', 'ent')}
                      className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'ent' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'ent' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100">
                  <span className="text-neutral-500 font-semibold">Referência (Ref):</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-neutral-950 font-mono text-sm">935 723 248</strong>
                    <button
                      type="button"
                      onClick={() => handleCopyField('935723248', 'ref')}
                      className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'ref' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'ref' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between px-1 pt-0.5">
                  <span className="text-neutral-500 font-semibold">Montante:</span>
                  <strong className="text-neutral-900 tabular-nums">
                    {customAmount > 0 ? formatKz(customAmount) : 'Seleciona o valor acima'}
                  </strong>
                </div>
              </div>
            )}

            {/* ÚNICO ESPAÇO GRANDE PARA CARREGAR O COMPROVATIVO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-neutral-900">
                  3. Comprovativo de Pagamento:
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    receiptProof ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {receiptProof ? '✓ Carregado' : 'Obrigatório'}
                </span>
              </div>

              {receiptProof ? (
                <div className="min-h-[170px] p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-400 flex flex-col items-center justify-center gap-3 text-center">
                  {receiptProof.startsWith('data:application/pdf') ? (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-emerald-700" />
                    </div>
                  ) : (
                    <img
                      src={receiptProof}
                      alt="Comprovativo"
                      className="w-full max-h-40 object-contain rounded-xl border border-emerald-200 bg-white p-1"
                    />
                  )}
                  <div className="w-full space-y-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1 truncate">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{receiptProofName || 'Comprovativo Carregado'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptProof(null);
                        setReceiptProofName('');
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                    >
                      Remover e carregar outro ficheiro
                    </button>
                  </div>
                </div>
              ) : (
                <label className="min-h-[170px] p-6 rounded-2xl bg-amber-50/70 hover:bg-amber-50 border-2 border-dashed border-amber-400 hover:border-[#FF4500] flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-amber-200 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7 text-[#FF4500]" />
                  </div>
                  <span className="text-sm font-black text-neutral-900">
                    Carregar Comprovativo
                  </span>
                  <span className="text-xs font-medium text-neutral-600 max-w-[260px]">
                    Toca neste espaço grande para anexar a foto do talão ou ficheiro PDF
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleReceiptUpload}
                  />
                </label>
              )}

              {/* Admin Approval Required Note */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1.5 rounded-lg border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                <span>Aprovação do Administrador Obrigatória: O saldo só será creditado na tua carteira após aprovação do Adm.</span>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Primary Action: Enviar Pedido de Depósito */}
            <div className="space-y-2 pt-1 text-center">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDeposit}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin text-white" />
                    <span>A Enviar Pedido de Depósito...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Enviar Depósito para Aprovação</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
