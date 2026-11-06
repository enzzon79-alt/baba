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
  Building2,
  Phone,
  RotateCcw
} from 'lucide-react';
import { formatKz } from '../services/db';

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
  const [customAmount, setCustomAmount] = useState<number>(missingAmount > 0 ? missingAmount : 5000);
  const [paymentMethod, setPaymentMethod] = useState<'multicaixa_express' | 'transferencia' | 'referencia'>('multicaixa_express');
  const [phone, setPhone] = useState(currentUser?.phone || '+244 923 000 000');
  const [receiptProof, setReceiptProof] = useState<string | null>(null);
  const [receiptProofName, setReceiptProofName] = useState<string>('');
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset when notice changes
  useEffect(() => {
    if (notice && notice.type === 'insufficient_funds') {
      const missing = Math.max(0, notice.price - notice.availableBalance);
      setCustomAmount(missing > 0 ? missing : 5000);
      setStep('notice');
      setReceiptProof(null);
      setReceiptProofName('');
      setTransactionCode('');
      setErrorMessage(null);
    }
  }, [notice]);

  // Handle file upload for receipt proof
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('O ficheiro do comprovativo deve ter no máximo 10MB.');
        return;
      }
      setReceiptProofName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setReceiptProof(reader.result);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit deposit: conclui apenas o carregamento
  const handleConfirmDeposit = () => {
    setErrorMessage(null);
    const amountToUse = customAmount > 0 ? customAmount : missingAmount;
    if (amountToUse <= 0) {
      setErrorMessage('Por favor insere um montante válido para carregar.');
      return;
    }

    const ref = transactionCode.trim() || `MCX-${Date.now().toString().slice(-6)}`;

    setIsProcessing(true);
    try {
      if (onDepositAndBuy) {
        onDepositAndBuy(amountToUse, paymentMethod, ref, receiptProof || undefined);
      } else if (onQuickDeposit) {
        onQuickDeposit();
      }
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
                  <span>Montante que pretendes carregar</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">
                  Personalizado
                </span>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount || ''}
                    onChange={e => setCustomAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="Digita qualquer valor (ex: 5000, 15000, 50000)"
                    min={500}
                    step={500}
                    className="w-full py-2.5 px-3 bg-white border-2 border-neutral-300 focus:border-[#FF6A00] rounded-xl text-base font-black text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-neutral-400">
                    Kz
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Podes carregar qualquer valor que quiseres. Mínimo: 500 Kz.
                </p>
              </div>

              {/* Quick Pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {missingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomAmount(missingAmount)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      customAmount === missingAmount
                        ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    Falta exata ({formatKz(missingAmount)})
                  </button>
                )}
                {[5000, 10000, 25000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomAmount(val)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      customAmount === val
                        ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    +{formatKz(val)}
                  </button>
                ))}
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
                Fazer Depósito de {formatKz(customAmount || missingAmount)}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Escolhe o método de pagamento e anexa o comprovativo na faixa abaixo para concluir.
              </p>
            </div>

            {/* Editable Amount */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Montante a Depositar (Kz):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={customAmount || ''}
                  onChange={e => setCustomAmount(Math.max(0, Number(e.target.value)))}
                  min={500}
                  step={500}
                  className="w-full py-2 px-3 bg-neutral-50 border border-neutral-300 rounded-xl text-base font-black text-neutral-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-neutral-400">
                  Kz
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-700 block">
                Método de Pagamento em Angola:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('multicaixa_express')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'multicaixa_express'
                      ? 'border-[#FF6A00] bg-orange-50 font-black text-[#FF6A00] ring-1 ring-[#FF6A00]'
                      : 'border-neutral-200 bg-neutral-50 font-semibold text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 mx-auto mb-1 text-orange-500" />
                  <span className="text-[10px] sm:text-xs block leading-tight">Multicaixa Express</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'transferencia'
                      ? 'border-[#FF6A00] bg-orange-50 font-black text-[#FF6A00] ring-1 ring-[#FF6A00]'
                      : 'border-neutral-200 bg-neutral-50 font-semibold text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
                  <span className="text-[10px] sm:text-xs block leading-tight">Transf. Bancária</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('referencia')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'referencia'
                      ? 'border-[#FF6A00] bg-orange-50 font-black text-[#FF6A00] ring-1 ring-[#FF6A00]'
                      : 'border-neutral-200 bg-neutral-50 font-semibold text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-[10px] sm:text-xs block leading-tight">Por Referência</span>
                </button>
              </div>
            </div>

            {/* Method Details Box */}
            {paymentMethod === 'multicaixa_express' && (
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-700 block">
                  Telemóvel Multicaixa Express (+244):
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+244 9xx xxx xxx"
                  className="w-full py-1.5 px-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Receberás a solicitação no teu aplicativo Multicaixa Express.
                </span>
              </div>
            )}

            {paymentMethod === 'transferencia' && (
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Banco:</span>
                  <strong className="text-neutral-900">Banco Angolano de Investimentos (BAI)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Beneficiário:</span>
                  <strong className="text-neutral-900">BABA SHOPPING ANGOLA LDA</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-semibold">IBAN:</span>
                  <code className="text-[11px] font-mono font-bold text-neutral-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                    AO06.0040.0000.9924.8105.1012.8
                  </code>
                </div>
              </div>
            )}

            {paymentMethod === 'referencia' && (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Entidade:</span>
                  <strong className="text-neutral-900">00142 (BABA SHOPPING AO)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Referência:</span>
                  <strong className="text-neutral-900 font-mono">992 481 054</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Montante:</span>
                  <strong className="text-neutral-900 tabular-nums">{formatKz(customAmount)}</strong>
                </div>
              </div>
            )}

            {/* FAIXA ONDE COLOCAR O COMPROVANTE (RECEIPT PROOF STRIP) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#FF6A00]" />
                  <span>Faixa de Comprovativo de Pagamento</span>
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  {receiptProof ? '✓ Anexado' : 'Inserir Comprovativo'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-tight">
                Anexa a foto do talão Multicaixa Express / transferência bancária ou digita o código do comprovativo para concluir o carregamento.
              </p>

              {/* Receipt Preview or Upload Trigger */}
              {receiptProof ? (
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-300">
                  <img
                    src={receiptProof}
                    alt="Comprovativo"
                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200 shrink-0 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 truncate">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{receiptProofName || 'Comprovativo de Pagamento'}</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Ficheiro validado e pronto para envio
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptProof(null);
                      setReceiptProofName('');
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-800 p-1 cursor-pointer shrink-0"
                    title="Remover ficheiro"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl cursor-pointer text-xs font-bold text-neutral-700 hover:text-orange-600 transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-[#FF6A00]" />
                  <span>📸 Clica aqui para anexar a foto ou PDF do comprovativo</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleReceiptUpload}
                  />
                </label>
              )}

              {/* Transaction Code / Reference input */}
              <div>
                <label className="text-[10px] font-bold text-neutral-700 block mb-0.5">
                  Nº de Operação ou Código do Comprovativo (Opcional se anexar foto):
                </label>
                <input
                  type="text"
                  value={transactionCode}
                  onChange={e => setTransactionCode(e.target.value)}
                  placeholder="Ex: MCX-948123 ou TRF-BAI-4819"
                  className="w-full py-1.5 px-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>

              {/* Trade Assurance Instant Validation Note */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Trade Assurance: Saldo validado e creditado imediatamente na tua carteira</span>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Primary Action: Concluir o Depósito */}
            <div className="space-y-2 pt-1 text-center">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDeposit}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin text-white" />
                    <span>A Concluir o Depósito...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    <span>Concluir o Depósito</span>
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
