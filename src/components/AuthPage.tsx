import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  Store,
  Upload,
  FileText,
  Clock,
  Check,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  Award,
  RefreshCw
} from 'lucide-react';
import { User as UserType } from '../types';
import {
  registerUser,
  loginUser,
  formatKz
} from '../services/db';

interface AuthPageProps {
  onLoginSuccess: (user: UserType) => void;
  onCancel?: () => void;
  initialMode?: 'presentation' | 'register' | 'login';
}

const ANGOLA_PROVINCES = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire'
];

// Imagens de demonstração para o Bilhete de Identidade (caso o utilizador não tenha fotos no dispositivo)
const DEMO_BI_FRONT = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80';
const DEMO_BI_BACK = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onCancel,
  initialMode = 'presentation'
}) => {
  // Passos do funil solicitado:
  // 1. 'presentation' (Apresentação de como funciona a plataforma)
  // 2. 'register_form' (Preencher nome completo, Gmail, número de telefone e selecionar a província)
  // 3. 'processing_data' (Processamento dos dados)
  // 4. 'identity_verification' (Abrir página de verificação de identidade e carregar fotografia frente e verso)
  // 5. 'waiting_approval' (Aguardar aprovação)
  // 6. 'approved' (Aprovado com botão "Entrar na plataforma")
  // 7. 'login' (Acesso para utilizadores já registados)
  const [step, setStep] = useState<
    'presentation' | 'register_form' | 'processing_data' | 'identity_verification' | 'waiting_approval' | 'approved' | 'login'
  >(initialMode === 'login' ? 'login' : 'presentation');

  // Form State - Dados Cadastrais
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+244 9');
  const [regProvince, setRegProvince] = useState('Luanda');
  const [regCity, setRegCity] = useState('Luanda (Talatona)');
  const [regPassword, setRegPassword] = useState('BABA2026!');
  const [regConfirmPassword, setRegConfirmPassword] = useState('BABA2026!');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Form State - Verificação do Bilhete de Identidade (BI)
  const [regIdNumber, setRegIdNumber] = useState('009847123LA042');
  const [frontDoc, setFrontDoc] = useState('');
  const [backDoc, setBackDoc] = useState('');
  const [biError, setBiError] = useState<string | null>(null);

  // Processed registered user state
  const [registeredUser, setRegisteredUser] = useState<UserType | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('kt5dFLArJzV7hCNMQ3ZvgqFokM62');
  const [loginPassword, setLoginPassword] = useState('BABA2026!');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Effect para simular barra de progresso no "Processamento dos dados"
  useEffect(() => {
    if (step === 'processing_data') {
      setProcessingProgress(15);
      const t1 = setTimeout(() => setProcessingProgress(45), 400);
      const t2 = setTimeout(() => setProcessingProgress(80), 900);
      const t3 = setTimeout(() => {
        setProcessingProgress(100);
        setTimeout(() => {
          setStep('identity_verification');
        }, 500);
      }, 1500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  // Upload de ficheiros de imagem do BI
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setBiError('A imagem deve ter no máximo 8MB.');
        return;
      }
      setBiError(null);
      const reader = new FileReader();
      reader.onload = ev => {
        if (typeof ev.target?.result === 'string') {
          if (side === 'front') setFrontDoc(ev.target.result);
          else setBackDoc(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDemoDocs = () => {
    setFrontDoc(DEMO_BI_FRONT);
    setBackDoc(DEMO_BI_BACK);
    setBiError(null);
  };

  // 1. Clicar em concluir dados cadastrais -> Processamento dos dados
  const handleCompleteCadastralData = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const name = regName.trim();
    const email = regEmail.trim();
    const phone = regPhone.trim();

    if (!name || !email || !phone) {
      setRegError('Por favor preenche o Nome Completo, Gmail e Número de Telefone.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setRegError('Por favor insere um endereço de email ou Gmail válido.');
      return;
    }

    if (phone.length < 9) {
      setRegError('Por favor insere um número de telefone angolano válido (+244 9xx xxx xxx).');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('A palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As palavras-passe não coincidem.');
      return;
    }

    // Avança para: Processamento dos dados
    setStep('processing_data');
  };

  // 2. Enviar para verificação de identidade
  const handleSubmitForVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setBiError(null);

    const idNum = regIdNumber.trim().toUpperCase();
    if (!idNum || idNum.length < 6) {
      setBiError('Por favor insere o número completo do teu Bilhete de Identidade (Nº do BI).');
      return;
    }

    const front = frontDoc || DEMO_BI_FRONT;
    const back = backDoc || DEMO_BI_BACK;

    setIsSubmitting(true);
    try {
      // Regista o utilizador no Firebase e na base de dados com estado de análise
      const newUser = await registerUser(
        regName.trim(),
        regEmail.trim(),
        regPhone.trim(),
        regPassword,
        regProvince,
        regCity.trim() || regProvince,
        idNum,
        '1997-04-12',
        front,
        back
      );

      // Marca o estado como pendente de aprovação
      newUser.accountStatus = 'em_processamento';
      setRegisteredUser(newUser);

      // Avança para: Aguardar aprovação
      setStep('waiting_approval');
    } catch (err: any) {
      setBiError(err.message || 'Erro ao submeter os documentos para verificação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Simular Aprovação do Administrador -> Entrar na plataforma
  const handleApproveAccount = () => {
    if (registeredUser) {
      registeredUser.accountStatus = 'ativo';
      setRegisteredUser({ ...registeredUser, accountStatus: 'ativo' });
    }
    setStep('approved');
  };

  // 4. Entrar na plataforma final
  const handleEnterPlatform = () => {
    if (registeredUser) {
      registeredUser.accountStatus = 'ativo';
      onLoginSuccess(registeredUser);
    } else {
      // Fallback
      loginUser(regEmail.trim() || 'domingos@baba.ao', regPassword || 'BABA2026!')
        .then(u => onLoginSuccess(u))
        .catch(() => {
          loginUser('usr_domingos', 'BABA2026!').then(u => onLoginSuccess(u));
        });
    }
  };

  // 5. Iniciar sessão tradicional (Login)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const rawId = loginIdentifier.trim();
    if (!rawId) {
      setLoginError('Por favor insere o teu email, telemóvel ou ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await loginUser(rawId, loginPassword.trim() || 'BABA2026!');
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError(err?.message || 'Credenciais inválidas. Verifica os dados ou seleciona uma conta de acesso rápido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (identifier: string) => {
    setLoginError(null);
    setLoginIdentifier(identifier);
    setIsSubmitting(true);
    try {
      const user = await loginUser(identifier, 'BABA2026!');
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError('Não foi possível aceder à conta selecionada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFB] via-[#F4F4F6] to-[#EAEAEF] text-neutral-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header com Logótipo Oficial BABA SHOPPING */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5000] via-[#FF6A00] to-[#FFAA00] flex items-center justify-center text-white shadow-lg shadow-orange-500/25 p-1.5 shrink-0">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
              <rect x="15" y="15" width="70" height="70" rx="22" fill="#FFFFFF" fillOpacity="0.18" />
              <path d="M28 32H72L65 72H35L28 32Z" fill="#FFFFFF" />
              <path d="M40 32V24C40 18.5 44.5 14 50 14C55.5 14 60 18.5 60 24V32" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
              <path d="M43 42H57C61 42 63 44 63 47C63 50 61 52 57 52H43V42Z" fill="#FF5000" />
              <path d="M43 52H59C63.5 52 66 54.5 66 58C66 61.5 63.5 64 59 64H43V52Z" fill="#FF5000" />
              <circle cx="74" cy="28" r="6" fill="#10B981" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-neutral-950">BABA</span>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 border border-amber-300 shadow-2xs flex items-center gap-1">
                <span>SHOPPING</span>
                <span className="text-sm">🇦🇴</span>
              </span>
            </div>
            <p className="text-[11px] font-bold text-neutral-500 tracking-wider">
              COMPRA • REVENDE • LUCRA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => handleQuickLogin('kt5dFLArJzV7hCNMQ3ZvgqFokM62')}
            className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 px-3 py-2 rounded-xl shadow-xs border border-amber-400 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Acesso Automático do Administrador Master (kt5dFLArJzV7hCNMQ3ZvgqFokM62)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-950" />
            <span className="hidden sm:inline">Entrar como</span>
            <span>Adm</span>
            <span className="text-[9px] bg-neutral-950 text-amber-300 px-1 py-0.2 rounded font-mono">kt5d...M62</span>
          </button>

          {step !== 'login' ? (
            <button
              type="button"
              onClick={() => setStep('login')}
              className="text-xs font-bold text-neutral-700 hover:text-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Já Tenho Conta</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep('presentation')}
              className="text-xs font-bold text-[#FF6A00] hover:text-orange-700 px-3.5 py-2 rounded-xl border border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Nova Conta</span>
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Flow Containers */}
      <div className="max-w-2xl w-full mx-auto my-6">

        {/* ======================================================== */}
        {/* PASSO 1: APRESENTAÇÃO DE COMO FUNCIONA A PLATAFORMA */}
        {/* ======================================================== */}
        {step === 'presentation' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden animate-fadeIn">
            {/* Banner Superior da Apresentação */}
            <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white p-6 sm:p-8 relative overflow-hidden text-center space-y-3">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Apresentação Oficial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Como Funciona a <span className="text-[#FF6A00]">BABA SHOPPING</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed">
                A primeira plataforma em Angola onde compras produtos por atacado a preços fixos em Kwanza e revendes com lucro garantido sem intermediários.
              </p>
            </div>

            {/* Os 3 Pilares de Funcionamento */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pilar 1 */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 hover:border-[#FF6A00]/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6A00] flex items-center justify-center font-black text-base shadow-xs">
                    1
                  </div>
                  <h3 className="font-extrabold text-sm text-neutral-900">
                    Compra no Atacado
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Escolhes produtos no catálogo oficial por atacado a preços de fábrica, com garantia total BABA Trade Assurance.
                  </p>
                </div>

                {/* Pilar 2 */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 hover:border-[#FF6A00]/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-base shadow-xs">
                    2
                  </div>
                  <h3 className="font-extrabold text-sm text-neutral-900">
                    Titularidade Digital
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Ao comprar, o produto é transferido imediatamente para a tua posse em "Meus Produtos" sob a tua custódia verificada.
                  </p>
                </div>

                {/* Pilar 3 */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 hover:border-[#FF6A00]/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-base shadow-xs">
                    3
                  </div>
                  <h3 className="font-extrabold text-sm text-neutral-900">
                    Revenda com Lucro
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Defines o teu próprio preço de venda no Mercado de Revenda. Quando outro utilizador comprar, o valor entra direto na tua carteira.
                  </p>
                </div>
              </div>

              {/* Bónus de Boas-Vindas */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-[#FF6A00] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    🎁
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-neutral-900">
                      Bónus Inicial de Boas-Vindas de 500,00 Kz
                    </h4>
                    <p className="text-xs text-neutral-600">
                      Creditado automaticamente na tua carteira digital após a aprovação da conta.
                    </p>
                  </div>
                </div>
                <span className="text-base font-black text-[#FF6A00] tabular-nums shrink-0">
                  +500 Kz
                </span>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('register_form')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#FF6A00] via-[#FF5000] to-[#E03A00] hover:from-[#FF5000] hover:to-[#C03000] text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Criar Conta na BABA SHOPPING</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Direct Admin Master Access Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('kt5dFLArJzV7hCNMQ3ZvgqFokM62')}
                  className="w-full py-3.5 px-4 bg-neutral-950 hover:bg-neutral-900 text-amber-400 font-black text-xs sm:text-sm rounded-2xl border-2 border-amber-400/80 shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Entrar como Administrador (kt5dFLArJzV7hCNMQ3ZvgqFokM62)</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('login')}
                    className="text-xs font-bold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    Já tens uma conta registada? <span className="text-[#FF6A00] underline font-extrabold">Iniciar Sessão</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: CRIAR CONTA (FORMULÁRIO DE DADOS CADASTRAIS) */}
        {/* ======================================================== */}
        {step === 'register_form' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden animate-fadeIn">
            {/* Header com indicador de progresso */}
            <div className="bg-neutral-900 text-white p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Passo 1 de 4 • Cadastro
                </span>
                <h2 className="text-lg font-black text-white leading-tight">
                  Preenche os teus Dados Pessoais
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep('presentation')}
                className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Apresentação
              </button>
            </div>

            <form onSubmit={handleCompleteCadastralData} className="p-6 sm:p-8 space-y-4">
              {regError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Nome Completo */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Nome Completo: *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Ex: Domingos António Sebastião"
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Gmail / Email */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Gmail / Email: *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="ex: domingos.sebastiao@gmail.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Número de Telefone */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Número de Telefone (+244): *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+244 923 456 789"
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Usado para notificações de compras, vendas e Multicaixa Express.
                </span>
              </div>

              {/* Selecionar a Província */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Selecionar a Província: *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={regProvince}
                      onChange={e => {
                        setRegProvince(e.target.value);
                        setRegCity(e.target.value);
                      }}
                      required
                      className="w-full pl-10 pr-8 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00] appearance-none cursor-pointer"
                    >
                      {ANGOLA_PROVINCES.map(prov => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Município / Cidade:
                  </label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={e => setRegCity(e.target.value)}
                    placeholder="Ex: Luanda, Talatona, Viana..."
                    className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Palavra-passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Palavra-passe: *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full p-3 pr-10 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Confirmar Palavra-passe: *
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Repete a senha"
                    required
                    minLength={6}
                    className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Botão Clicar em Concluir */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Check className="w-5 h-5" />
                  <span>Concluir Dados Cadastrais</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 3: PROCESSAMENTO DOS DADOS */}
        {/* ======================================================== */}
        {step === 'processing_data' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-orange-50 border-4 border-orange-200 flex items-center justify-center mx-auto text-[#FF6A00] shadow-lg shadow-orange-500/10">
              <RefreshCw className="w-10 h-10 animate-spin stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF6A00]">
                Processamento Seguro dos Dados
              </span>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                A processar os teus dados cadastrais...
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
                Estamos a registar e encriptar os dados de <strong>{regName}</strong> com proteção comercial BABA Trade Assurance.
              </p>
            </div>

            {/* Barra de Progresso Animada */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden border border-neutral-200">
                <div
                  className="bg-gradient-to-r from-amber-500 via-[#FF6A00] to-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-neutral-400">
                <span>Validação cadastral</span>
                <span>{processingProgress}%</span>
              </div>
            </div>

            {/* Checklist Visual */}
            <div className="max-w-sm mx-auto p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-2 text-left">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Contacto e Província ({regProvince}) validados</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Conta Gmail ({regEmail}) configurada</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>A preparar página de verificação de identidade...</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 4: ABRIR PÁGINA DE VERIFICAÇÃO DE IDENTIDADE */}
        {/* ======================================================== */}
        {step === 'identity_verification' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden animate-fadeIn">
            {/* Header com indicador */}
            <div className="bg-neutral-900 text-white p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Passo 2 de 4 • Documentação
                </span>
                <h2 className="text-lg font-black text-white leading-tight">
                  Página de Verificação de Identidade
                </h2>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                Bilhete de Identidade
              </div>
            </div>

            <form onSubmit={handleSubmitForVerification} className="p-6 sm:p-8 space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Verificação Obrigatória em Angola:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Para comprar mercadoria por atacado e receber liquidações na carteira, carrega a fotografia da <strong>Frente</strong> e do <strong>Verso</strong> do teu Bilhete de Identidade Nacional.
                </p>
              </div>

              {biError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{biError}</span>
                </div>
              )}

              {/* Número do Bilhete de Identidade */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Número do Bilhete de Identidade (Nº do BI): *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regIdNumber}
                    onChange={e => setRegIdNumber(e.target.value.toUpperCase())}
                    placeholder="Ex: 009847123LA042"
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF6A00] uppercase"
                  />
                </div>
              </div>

              {/* Carregar Fotografia da Frente e do Verso do BI */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-900">
                    Fotografias do Documento (Frente e Verso): *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseDemoDocs}
                    className="text-[11px] font-bold text-[#FF6A00] hover:text-orange-700 underline cursor-pointer"
                  >
                    📸 Usar Fotos de Demonstração
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto Frente */}
                  <div>
                    <span className="text-[11px] font-bold text-neutral-700 block mb-1">
                      1. Foto da Frente do BI:
                    </span>
                    {frontDoc ? (
                      <div className="relative rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 p-2 text-center group">
                        <img
                          src={frontDoc}
                          alt="Frente do BI"
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs px-1">
                          <span className="text-emerald-800 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Frente Anexada
                          </span>
                          <button
                            type="button"
                            onClick={() => setFrontDoc('')}
                            className="text-red-600 hover:text-red-800 font-bold text-xs cursor-pointer"
                          >
                            Substituir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-neutral-300 hover:border-[#FF6A00] rounded-2xl p-4 text-center hover:bg-orange-50/40 cursor-pointer block transition-colors h-36 flex flex-col items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFileUpload(e, 'front')}
                          className="hidden"
                        />
                        <Upload className="w-6 h-6 mb-1 text-neutral-400" />
                        <span className="text-xs font-black text-neutral-800 block">
                          Carregar Foto Frente
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          Tirar foto ou escolher ficheiro
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Foto Verso */}
                  <div>
                    <span className="text-[11px] font-bold text-neutral-700 block mb-1">
                      2. Foto do Verso do BI:
                    </span>
                    {backDoc ? (
                      <div className="relative rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 p-2 text-center group">
                        <img
                          src={backDoc}
                          alt="Verso do BI"
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs px-1">
                          <span className="text-emerald-800 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Verso Anexado
                          </span>
                          <button
                            type="button"
                            onClick={() => setBackDoc('')}
                            className="text-red-600 hover:text-red-800 font-bold text-xs cursor-pointer"
                          >
                            Substituir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-neutral-300 hover:border-[#FF6A00] rounded-2xl p-4 text-center hover:bg-orange-50/40 cursor-pointer block transition-colors h-36 flex flex-col items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFileUpload(e, 'back')}
                          className="hidden"
                        />
                        <Upload className="w-6 h-6 mb-1 text-neutral-400" />
                        <span className="text-xs font-black text-neutral-800 block">
                          Carregar Foto Verso
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          Tirar foto ou escolher ficheiro
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão Enviar para Verificação */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isSubmitting ? 'A enviar documentos...' : 'Enviar para Verificação'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 5: AGUARDAR APROVAÇÃO */}
        {/* ======================================================== */}
        {step === 'waiting_approval' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white p-6 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-400 border-2 border-amber-400/50 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-8 h-8 stroke-[2.5]" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                Passo 3 de 4 • Análise Pericial
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Aguardar Aprovação do Administrador
              </h2>
              <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                O teu Bilhete de Identidade e dados cadastrais foram enviados com sucesso. O Administrador da BABA SHOPPING está a analisar a conformidade legal do teu processo.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Resumo do Processo Submetido */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-semibold">Estado do Processo:</span>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-300 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    EM ANÁLISE PELO ADMINISTRADOR
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Nome:</span>
                    <strong className="text-neutral-900">{regName || 'Domingos Sebastião'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Nº do BI:</span>
                    <strong className="text-[#FF6A00] font-mono">{regIdNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Província:</span>
                    <strong className="text-neutral-900">{regProvince}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Telefone:</span>
                    <strong className="text-neutral-900">{regPhone}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Fotografias Frente e Verso anexadas:</span>
                  <span className="font-bold text-emerald-700">✓ Recebidas no Sistema</span>
                </div>
              </div>

              {/* Ação: Simular Aprovação do Administrador */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-300 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Área de Validação Rápida:</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Para fins de teste e verificação imediata, podes aprovar o teu Bilhete de Identidade agora mesmo sem ter de aguardar a moderação externa:
                </p>
                <button
                  type="button"
                  onClick={handleApproveAccount}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>⚡ Aprovar Conta Imediatamente (Simulação Admin)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASSO 6: ENTRAR NA PLATAFORMA (APROVADO COM SUCESSO) */}
        {/* ======================================================== */}
        {step === 'approved' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 sm:p-10 text-center space-y-6 animate-fadeIn">
            {/* Ícone de Sucesso */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border-4 border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                ✓ APROVADO PELO ADMINISTRADOR
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Parabéns! Conta Aprovada com Sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                O teu Bilhete de Identidade (<strong>{regIdNumber}</strong>) foi formalmente verificado e regularizado na República de Angola.
              </p>
            </div>

            {/* Bónus de 500 Kz Creditado */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 max-w-md mx-auto space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Saldo Inicial de Boas-Vindas
              </span>
              <div className="text-3xl font-black text-[#FF6A00] tabular-nums">
                500,00 Kz
              </div>
              <p className="text-[11px] text-neutral-500">
                Já creditado e pronto a utilizar na tua Carteira Digital BABA SHOPPING!
              </p>
            </div>

            {/* Botão Entrar na Plataforma */}
            <div className="pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleEnterPlatform}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#FF6A00] via-[#FF5000] to-[#E03A00] hover:from-[#FF5000] hover:to-[#C03000] text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98"
              >
                <span>Entrar na Plataforma</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* LOGIN PARA UTILIZADORES JÁ REGISTADOS */}
        {/* ======================================================== */}
        {step === 'login' && (
          <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden animate-fadeIn">
            <div className="bg-neutral-900 text-white p-6 text-center space-y-1">
              <h2 className="text-xl font-black text-white">
                Iniciar Sessão na Conta
              </h2>
              <p className="text-xs text-neutral-400">
                Acede à tua carteira, compras oficiais e mercado de revenda.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Master Admin Detection Banner */}
              {(loginIdentifier.trim() === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
                loginIdentifier.trim().toLowerCase().includes('kt5dflarjzv7hcnmq3zvgqfokm62') ||
                loginPassword.trim() === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
                loginIdentifier.trim().toLowerCase() === 'admin' ||
                loginIdentifier.trim().toLowerCase() === 'adm') && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-neutral-950 font-bold text-xs border border-amber-500 shadow-md flex items-center gap-3 animate-fadeIn">
                  <div className="w-9 h-9 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black uppercase text-[10px] tracking-wider bg-neutral-950 text-amber-400 px-2 py-0.5 rounded">
                        ADMIN MASTER DETETADO
                      </span>
                      <span className="text-[10px] text-neutral-900 font-mono font-bold">kt5d...M62</span>
                    </div>
                    <p className="text-[11px] text-neutral-950 mt-0.5 font-bold leading-tight">
                      Ao clicar no botão abaixo, entrarás diretamente e de forma automática no Painel do Administrador com controlo total!
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Email, Telemóvel ou ID do Administrador:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="kt5dFLArJzV7hCNMQ3ZvgqFokM62, telemóvel ou email"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Podes colar o teu ID <strong>kt5dFLArJzV7hCNMQ3ZvgqFokM62</strong> para aceder de imediato.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Palavra-passe (Opcional para ID de Administrador):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Digita a tua palavra-passe (ou entra direto com o ID)"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 px-4 font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 ${
                  loginIdentifier.trim() === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
                  loginIdentifier.trim().toLowerCase().includes('kt5dflarjzv7hcnmq3zvgqfokm62') ||
                  loginPassword.trim() === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
                  loginIdentifier.trim().toLowerCase() === 'admin' ||
                  loginIdentifier.trim().toLowerCase() === 'adm'
                    ? 'bg-neutral-950 hover:bg-neutral-900 text-amber-400 border border-amber-400/50 shadow-lg shadow-amber-500/20'
                    : 'bg-gradient-to-r from-[#FF6A00] to-[#FF5000] hover:from-[#FF5000] hover:to-[#E03A00] text-white shadow-orange-500/20'
                }`}
              >
                {loginIdentifier.trim() === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
                loginIdentifier.trim().toLowerCase().includes('kt5dflarjzv7hcnmq3zvgqfokm62') ||
                loginPassword.trim() === 'kt5dFLArJzV7hCNMQ3ZvgqFokM62' ||
                loginIdentifier.trim().toLowerCase() === 'admin' ||
                loginIdentifier.trim().toLowerCase() === 'adm' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>{isSubmitting ? 'A aceder ao painel...' : '⚡ Entrar Automaticamente no Painel do Adm'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'A entrar na conta...' : 'Entrar na Conta'}</span>
                  </>
                )}
              </button>

              {/* Botão de 1 Clique para Administrador */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('kt5dFLArJzV7hCNMQ3ZvgqFokM62')}
                  className="w-full p-3.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-neutral-950 via-slate-900 to-neutral-950 text-white hover:border-amber-300 transition-all cursor-pointer shadow-md flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5 text-neutral-950" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-amber-400 text-xs">Acesso Direto: Administrador Master</span>
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded font-mono font-bold">
                          kt5dFLArJzV7hCNMQ3ZvgqFokM62
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        Entra automaticamente no Painel com todos os utilizadores, saldos e mercado
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-neutral-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-sm group-hover:bg-amber-300">
                    <span>Entrar Já</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Contas de Acesso Rápido para Testes */}
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block text-center">
                  Outras Contas de Demonstração:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('domingos@baba.ao')}
                    className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-neutral-900 truncate">Domingos Sebastião</div>
                    <div className="text-[10px] text-neutral-500">Cliente • 500 Kz</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('antonio@baba.ao')}
                    className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-neutral-900 truncate">António Kwanza</div>
                    <div className="text-[10px] text-amber-600">Em Processamento</div>
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('presentation')}
                  className="text-xs font-bold text-[#FF6A00] hover:text-orange-700 underline cursor-pointer"
                >
                  ← Ver Apresentação e Criar Nova Conta
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto text-center pt-4 text-xs text-neutral-500">
        <p>© 2026 BABA SHOPPING 🇦🇴 — Plataforma Oficial de Comércio e Revenda. Garantia BABA Trade Assurance.</p>
      </div>
    </div>
  );
};
