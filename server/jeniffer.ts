import { GoogleGenAI, ThinkingLevel, Type, type FunctionDeclaration } from '@google/genai';

const FIREBASE_PROJECT_ID = 'lucano-375bf';
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBuhej6-6idJS2cPEdaad66Svr4wffvBfc';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const ADMIN_UID = 'oYHKf9Uvp5Sm0aPyUefjM8aNrrK2';

export interface JenifferChatResult {
  ok: boolean;
  statusCode?: number;
  code?: string;
  error?: string;
  conversation?: any;
  userMessage?: any;
  replyMessage?: any;
}

const JENIFFER_SYSTEM_INSTRUCTION = `
És a **Assistente Jeniffer**, a Gerente Virtual Oficial de Atendimento Inteligente da plataforma **BABA SHOPPING** em Angola.

### Personalidade e Estilo de Comunicação
- Comunica exclusivamente em **português claro, natural, educado, simpático e profissional** (adequado a Angola, valores em Kwanzas - Kz).
- Estás disponível **24/24h** com perguntas e respostas **ilimitadas** para todos os clientes.
- Sê objetiva, organizada e prestativa. Compreende a pergunta do cliente mesmo quando estiver escrita de outra maneira, com sinónimos, abreviações ou linguagem informal — **não te limites a repetir exatamente o texto padrão**, adapta a resposta de forma natural ao contexto da dúvida.
- Responde a qualquer pergunta sobre a BABA SHOPPING com clareza. Quando não tiveres informações suficientes para responder com segurança ou o assunto exigir análise individual, **NÃO inventes respostas** — encaminha o cliente para o Administrador chamando \`encaminhar_para_administrador\`.
- Nunca uses jargão técnico de programação nem exponhas nomes internos de funções ou detalhes internos do código.

### Base Oficial de Perguntas, Respostas & Conhecimento BABA SHOPPING
Usa esta base como referência principal (compreendendo e adaptando naturalmente a qualquer forma como o cliente pergunte):

1. **Como funciona a plataforma (Aplicativo / Compra & Revenda)**:
   - Os clientes compram produtos no **Mercado Oficial** a preços de atacado usando o saldo da carteira digital e podem manter os artigos ou revendê-los no **Mercado de Revenda P2P** para obter lucro.
   - As compras no **Mercado Oficial** e no **Mercado de Revenda P2P** são **automáticas e imediatas**: ao confirmar a compra com saldo disponível, o valor é debitado na hora e o artigo entra diretamente na secção **Meus Produtos**.
   - **Acesso diário**: O cliente pode aceder e utilizar o aplicativo todos os dias, sempre que desejar, respeitando as condições de funcionamento da plataforma.
2. **Depósitos ("Como fazer depósito?" / "Meu depósito não apareceu")**:
   - **Como depositar**: Ir à aba **Carteira**, clicar em **Recarregar** (ou **Depositar**) e seguir as instruções apresentadas no aplicativo, enviando o comprovativo. O pedido fica em estado **Pendente** até validação e aprovação pelo Administrador; só após aprovação entra no saldo disponível.
   - **Depósito não apareceu**: Consultar primeiro os movimentos reais na conta (usando \`consultar_meus_movimentos\`). Orientar o cliente a verificar se a operação foi concluída; se já foi concluída e ainda não constar, orientar a contactar o suporte oficial apresentando o comprovativo (e oferecer/realizar encaminhamento ao Administrador se necessário).
3. **Saques / Levantamentos ("Quanto tempo demora?", "Como sei se foi aprovado?", "Taxas?")**:
   - **Prazo de processamento**: O prazo indicado para processamento do saque é de **5 a 15 minutos**, podendo variar conforme as condições da operação e aprovação do Administrador.
   - **Qualquer valor e método**: O cliente pode solicitar levantamento de **qualquer valor disponível** na carteira (desde que positivo e dentro do saldo gastável) via transferência bancária (**IBAN**). Fica em estado **Pendente** até aprovação do Administrador, momento em que é debitado da carteira.
   - **Como saber se foi aprovado**: Consultar o histórico/extrato de operações na aba **Carteira** (ou verificar diretamente aqui com \`consultar_meus_movimentos\`).
   - **Taxas nos levantamentos e comissões**: As taxas aplicáveis nos levantamentos devem ser consultadas diretamente na área de levantamentos ou nos termos da plataforma antes de confirmar o pedido. No mercado de revenda P2P aplica-se comissão oficial de **5%** sobre a venda concluída, conforme apresentado no momento de anunciar.
4. **Consultar Saldo**:
   - O cliente pode consultar o saldo disponível a qualquer momento entrando na opção **Carteira** — e sempre que perguntar pelo seu saldo aqui no chat, deves consultar primeiro \`consultar_minha_carteira\` para dar o valor real exato.
5. **Produtos & Compras ("Como comprar?", "Como publicar?", "Alterar preço?", "Cancelar anúncio?", "Quanto tempo demora a ser comprado?")**:
   - **Comprar um produto**: Entrar na área de produtos (**Mercado Oficial** ou **Revenda P2P**), escolher o artigo desejado e seguir as instruções para efetuar a compra (usando o saldo da carteira).
   - **Publicar um produto**: Aceder à área **Meus Produtos**, selecionar o artigo pretendido na opção de publicar/revender e preencher todas as informações solicitadas (incluindo qualquer preço de venda desejado).
   - **Alterar preço do produto**: Caso a plataforma permita editar o anúncio, aceder a **Meus Produtos** e verificar a opção de edição/preço disponível para o anúncio.
   - **Cancelar um anúncio**: Aceder a **Meus Produtos**, localizar o anúncio ativo no mercado de revenda e utilizar a opção **Cancelar Anúncio** para retirar o produto da venda e devolvê-lo ao stock pessoal.
   - **Quanto tempo demora para ser comprado**: Depende do preço definido no anúncio e do interesse dos compradores; quanto mais atrativo e competitivo for o preço, maior poderá ser a procura.
6. **Confiança, Transparência & Segurança ("Será que não é burla?", "Como ter certeza?", "Como proteger a minha conta?", "Como recuperar a conta?")**:
   - **Preocupação / Burla**: Acolher a preocupação com respeito e empatia. Recomendar que, antes de realizar qualquer depósito, conheça bem a plataforma, consulte as condições de utilização e confirme as informações da empresa.
   - **Como ter certeza**: A empresa deve disponibilizar informações verificáveis sobre o seu funcionamento. A BABA SHOPPING **não obriga ninguém a investir** — se o utilizador não tiver certeza, não deve investir.
   - **Proteger a conta**: Nunca partilhar a palavra-passe, códigos pessoais ou fotografias do Bilhete de Identidade com terceiros; usar palavra-passe segura e exclusiva; aceder apenas pelos canais oficiais e confirmar operações diretamente no extrato da Carteira.
   - **Recuperar a conta**: Utilizar a opção de recuperação de palavra-passe disponível na página de entrada (login) do aplicativo; se continuar sem acesso, encaminhar para o Administrador.
7. **Validação do Bilhete de Identidade (BI / KYC) e Convites**:
   - Novos cadastros ficam em revisão (**em_processamento**) até o Administrador validar os dados e as fotos (frente e verso) do BI.
   - **Convites**: Cada utilizador tem um código pessoal de convite; quando um amigo convidado se regista e tem o BI validado pelo Administrador, quem convidou recebe **+1.000 Kz** de bónus na carteira.
8. **Suporte e Contacto com o Administrador**:
   - O cliente pode usar esta janela de atendimento sempre que precisar, ou clicar em **"Falar com Administrador"** para enviar o pedido diretamente ao Painel Administrativo.

### REGRAS DE SEGURANÇA E CONFORMIDADE (OBRIGATÓRIAS E INVIOLÁVEIS)
1. **NUNCA inventar informações**: Nunca inventes saldos, estados de depósitos, saques, transferências, referências, encomendas, aprovações ou informações que não constem na base oficial nem nas consultas reais. Se não tiveres informação suficiente para responder, não inventes — encaminha para o Administrador.
2. **NUNCA confirmar operações sem consultar dados reais**: Sempre que o cliente perguntar sobre o seu saldo, depósitos, saques, encomendas, estado do BI, produtos, negociações ou catálogo, **CHAMA PRIMEIRO as ferramentas autorizadas** (\`consultar_minha_conta\`, \`consultar_minha_carteira\`, \`consultar_meus_movimentos\`, \`consultar_meus_produtos_e_anuncios\`, \`consultar_catalogo_oficial\`).
3. **Se não houver registo**: Se a consulta devolver vazio, informa claramente que não encontraste nenhum registo correspondente no sistema.
4. **NUNCA executar operações financeiras**: Não aprovas depósitos, não processas saques, não transferes saldos, não realizas compras nem alteras preços/estados financeiros. Explica sempre que apenas o Administrador humano tem autorização para aprovar ou executar operações financeiras.
5. **PRIVACIDADE ESTRITA (ZERO dados de terceiros)**: Só podes consultar e partilhar dados do **próprio utilizador autenticado nesta sessão**. Se o cliente perguntar sobre saldo, dados, pagamentos ou transferências de outro utilizador ou pedir informações administrativas internas confidenciais, recusa educadamente explicando a política de privacidade.
6. **ENCAMINHAMENTO HUMANO AO ADMINISTRADOR**: Quando não conseguires resolver um problema, quando não tiveres informações suficientes, quando houver dúvida complexa, contestação de pagamento, reclamação, bloqueio/recuperação manual de conta ou quando o cliente pedir para falar com um administrador/humano, chama a ferramenta \`encaminhar_para_administrador\` com um resumo claro do motivo e informa o cliente que o atendimento foi encaminhado para o Administrador acompanhar no Painel.
`.trim();

const TOOL_LABELS: Record<string, string> = {
  consultar_minha_conta: 'Dados da Conta & BI',
  consultar_minha_carteira: 'Carteira Digital',
  consultar_meus_movimentos: 'Depósitos, Saques & Encomendas',
  consultar_meus_produtos_e_anuncios: 'Meus Produtos & Revendas',
  consultar_catalogo_oficial: 'Catálogo Oficial BABA',
  encaminhar_para_administrador: 'Encaminhamento ao Administrador'
};

const jenifferTools: FunctionDeclaration[] = [
  {
    name: 'consultar_minha_conta',
    description:
      'Consulta exclusivamente os dados autorizados da conta do cliente autenticado na sessão atual (nome, estado da conta/BI, motivo de rejeição/suspensão se existir, província, cidade, código de convite). Nunca acede a dados de outros utilizadores.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'consultar_minha_carteira',
    description:
      'Consulta exclusivamente os saldos reais da carteira digital do cliente autenticado (saldo disponível, pendente, reservado, saldo gastável, totais depositado/gasto/ganho/levantado).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'consultar_meus_movimentos',
    description:
      'Consulta os movimentos reais recentes exclusivamente do cliente autenticado: depósitos, saques, encomendas/compras e transações no extrato (incluindo estado e motivo de rejeição, se houver).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipo: {
          type: Type.STRING,
          description: 'Filtro opcional: "todos", "depositos", "saques", "encomendas" ou "transacoes".'
        }
      }
    }
  },
  {
    name: 'consultar_meus_produtos_e_anuncios',
    description:
      'Consulta exclusivamente o inventário "Meus Produtos", anúncios de revenda P2P e negociações do cliente autenticado.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'consultar_catalogo_oficial',
    description:
      'Consulta o catálogo público oficial de produtos BABA SHOPPING (nomes, categorias, preços de compra, preços sugeridos de revenda e stock disponível).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        termo: {
          type: Type.STRING,
          description: 'Termo de pesquisa ou categoria opcional (ex.: "telemóvel", "Samsung", "todos").'
        }
      }
    }
  },
  {
    name: 'encaminhar_para_administrador',
    description:
      'Encaminha este atendimento para intervenção humana do Administrador no Painel Administrativo. Usar sempre que o problema for complexo, envolver contestação financeira, validação urgente, ou quando o cliente solicitar falar com o Administrador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        motivo: {
          type: Type.STRING,
          description: 'Resumo claro e objetivo do motivo pelo qual o cliente precisa de apoio do Administrador.'
        }
      },
      required: ['motivo']
    }
  }
];

function computeUserInviteCode(user: any): string {
  if (!user) return 'BABA-AMIGO94';
  const firstName =
    String(user.name || 'AMIGO')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase() || 'AMIGO';
  const suffix =
    String(user.id || '94')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(-3)
      .toUpperCase() || '94';
  return `BABA-${firstName}${suffix}`;
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('arrayValue' in val) {
    const arr = val.arrayValue?.values;
    return Array.isArray(arr) ? arr.map(fromFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return null;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { doubleValue: 0 };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.filter(item => item !== undefined).map(item => toFirestoreValue(item))
      }
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function decodeFirestoreDoc(docJson: any): any {
  if (!docJson || typeof docJson !== 'object' || !docJson.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(docJson.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  const nameStr = String(docJson.name || '');
  const idPart = nameStr.split('/').pop();
  if (idPart && !out.id) {
    out.id = idPart;
  }
  return out;
}

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const user = data?.users?.[0];
    if (!user?.localId) return null;
    return { uid: String(user.localId), email: user.email ? String(user.email) : undefined };
  } catch {
    return null;
  }
}

async function getFirestoreDocRest(collectionName: string, docId: string, idToken: string): Promise<any> {
  const res = await fetch(`${FIRESTORE_BASE_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore GET ${collectionName}/${docId} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return decodeFirestoreDoc(json);
}

async function queryFirestoreCollectionRest(
  collectionId: string,
  idToken: string,
  filter?: { field: string; op?: 'EQUAL'; value: string },
  limitCount = 50
): Promise<any[]> {
  const structuredQuery: any = {
    from: [{ collectionId }],
    limit: limitCount
  };
  if (filter) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: filter.op || 'EQUAL',
        value: { stringValue: filter.value }
      }
    };
  }
  const res = await fetch(`${FIRESTORE_BASE_URL}:runQuery`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ structuredQuery })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(`Firestore query ${collectionId} note (${res.status}):`, text);
    return [];
  }
  const rows = (await res.json()) as any[];
  if (!Array.isArray(rows)) return [];
  const results: any[] = [];
  for (const row of rows) {
    if (row?.document) {
      const parsed = decodeFirestoreDoc(row.document);
      if (parsed) results.push(parsed);
    }
  }
  return results;
}

async function upsertFirestoreDocRest(
  collectionName: string,
  docId: string,
  data: Record<string, any>,
  idToken: string
): Promise<any> {
  const cleanData: Record<string, any> = { ...data, id: data.id || docId };
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(cleanData)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  const res = await fetch(`${FIRESTORE_BASE_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore PATCH ${collectionName}/${docId} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return decodeFirestoreDoc(json) || cleanData;
}

function createStrictUserToolExecutor(params: {
  userId: string;
  user: any;
  conversationId: string;
  idToken: string;
}) {
  const { userId, user, conversationId, idToken } = params;

  const getUserWallet = async () => {
    const [w, withdrawals, orders] = await Promise.all([
      getFirestoreDocRest('wallets', userId, idToken).catch(() => null),
      queryFirestoreCollectionRest('withdrawals', idToken, { field: 'userId', value: userId }, 50),
      queryFirestoreCollectionRest('orders', idToken, { field: 'buyerId', value: userId }, 50)
    ]);
    if (!w) {
      return {
        encontrado: false,
        aviso: 'Carteira ainda não inicializada no Firestore.',
        availableBalance: 0,
        pendingBalance: 0,
        reservedBalance: 0,
        spendableBalance: 0
      };
    }
    const pendingRes = withdrawals
      .filter((wd: any) => wd && wd.status === 'pendente')
      .reduce((sum: number, wd: any) => sum + (Number(wd.amount) || 0), 0);
    const ordRes = orders
      .filter((o: any) => o && o.status === 'aguardando_aprovacao')
      .reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
    const available = Number(w.availableBalance) || 0;
    const spendable = Math.max(0, available - pendingRes - ordRes);
    return {
      encontrado: true,
      availableBalanceKz: available,
      pendingWithdrawalReservedKz: pendingRes,
      pendingOrdersReservedKz: ordRes,
      spendableBalanceKz: spendable,
      pendingBalanceKz: Number(w.pendingBalance) || 0,
      reservedBalanceKz: Number(w.reservedBalance) || 0,
      totalDepositedKz: Number(w.totalDeposited) || 0,
      totalSpentKz: Number(w.totalSpent) || 0,
      totalEarnedKz: Number(w.totalEarned) || 0,
      totalWithdrawnKz: Number(w.totalWithdrawn) || 0,
      updatedAt: w.updatedAt || null
    };
  };

  const executeTool = async (name: string, args: Record<string, any> = {}): Promise<any> => {
    if (name === 'consultar_minha_conta') {
      if (!user) return { encontrado: false, mensagem: 'Utilizador não encontrado.' };
      return {
        encontrado: true,
        nome: user.name,
        email: user.email,
        telefone: user.phone,
        provincia: user.province,
        cidade: user.city,
        estadoConta: user.accountStatus || 'em_processamento',
        motivoRejeicao: user.rejectionReason || null,
        motivoSuspensao: user.suspensionReason || null,
        codigoConvite: computeUserInviteCode(user),
        criadoEm: user.createdAt || null,
        verificadoEm: user.verifiedAt || null
      };
    }

    if (name === 'consultar_minha_carteira') {
      return await getUserWallet();
    }

    if (name === 'consultar_meus_movimentos') {
      const filtro = String(args?.tipo || 'todos').toLowerCase();
      const sortDesc = (a: any, b: any) =>
        new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();

      const [rawDeposits, rawWithdrawals, buyerOrders, sellerOrders, rawTransactions] = await Promise.all([
        queryFirestoreCollectionRest('deposits', idToken, { field: 'userId', value: userId }, 25),
        queryFirestoreCollectionRest('withdrawals', idToken, { field: 'userId', value: userId }, 25),
        queryFirestoreCollectionRest('orders', idToken, { field: 'buyerId', value: userId }, 25),
        queryFirestoreCollectionRest('orders', idToken, { field: 'sellerId', value: userId }, 25),
        queryFirestoreCollectionRest('transactions', idToken, { field: 'userId', value: userId }, 30)
      ]);

      const mergedOrdersMap = new Map<string, any>();
      [...buyerOrders, ...sellerOrders].forEach(o => {
        if (o?.id) mergedOrdersMap.set(o.id, o);
      });

      const deposits = rawDeposits
        .sort(sortDesc)
        .slice(0, 10)
        .map((d: any) => ({
          id: d.id,
          valorKz: Number(d.amount) || 0,
          metodo: d.paymentMethod,
          referencia: d.reference,
          estado: d.status,
          motivoRejeicao: d.rejectionReason || null,
          data: d.createdAt
        }));

      const withdrawals = rawWithdrawals
        .sort(sortDesc)
        .slice(0, 10)
        .map((w: any) => ({
          id: w.id,
          valorKz: Number(w.amount) || 0,
          banco: w.bankName,
          titular: w.accountHolder,
          estado: w.status,
          motivoRejeicao: w.rejectionReason || null,
          data: w.createdAt
        }));

      const orders = Array.from(mergedOrdersMap.values())
        .sort(sortDesc)
        .slice(0, 10)
        .map((o: any) => ({
          id: o.id,
          papel: o.buyerId === userId ? 'comprador' : 'vendedor',
          origem: o.source,
          valorTotalKz: Number(o.totalAmount) || 0,
          estado: o.status,
          motivoRejeicao: o.rejectionReason || null,
          itens: Array.isArray(o.items)
            ? o.items.map((it: any) => `${it.quantity || 1}x ${it.name || 'Artigo'}`).join(', ')
            : '',
          data: o.createdAt
        }));

      const transactions = rawTransactions
        .sort(sortDesc)
        .slice(0, 12)
        .map((t: any) => ({
          id: t.id,
          tipo: t.type,
          valorKz: Number(t.amount) || 0,
          estado: t.status,
          descricao: t.description,
          motivoRejeicao: t.rejectionReason || null,
          data: t.createdAt
        }));

      if (filtro === 'depositos') return { depositos: deposits };
      if (filtro === 'saques') return { saques: withdrawals };
      if (filtro === 'encomendas') return { encomendas: orders };
      if (filtro === 'transacoes') return { transacoes: transactions };
      return { depositos: deposits, saques: withdrawals, encomendas: orders, transacoes: transactions };
    }

    if (name === 'consultar_meus_produtos_e_anuncios') {
      const [ownedRaw, listingsRaw, buyerNegs, sellerNegs] = await Promise.all([
        queryFirestoreCollectionRest('user_products', idToken, { field: 'currentOwnerId', value: userId }, 40),
        queryFirestoreCollectionRest('resale_listings', idToken, { field: 'sellerId', value: userId }, 40),
        queryFirestoreCollectionRest('negotiations', idToken, { field: 'buyerId', value: userId }, 30),
        queryFirestoreCollectionRest('negotiations', idToken, { field: 'sellerId', value: userId }, 30)
      ]);

      const mergedNegsMap = new Map<string, any>();
      [...buyerNegs, ...sellerNegs].forEach(n => {
        if (n?.id) mergedNegsMap.set(n.id, n);
      });

      return {
        meusProdutos: ownedRaw.map((p: any) => ({
          id: p.id,
          nome: p.productName,
          categoria: p.category,
          precoCompraKz: Number(p.purchasePrice ?? p.originalPrice) || 0,
          estado: p.status,
          cor: p.selectedColor || null
        })),
        meusAnunciosRevenda: listingsRaw.map((l: any) => ({
          id: l.id,
          produto: l.productName,
          precoAnuncioKz: Number(l.listingPrice) || 0,
          estado: l.status,
          motivoRejeicao: l.rejectionReason || null
        })),
        minhasNegociacoes: Array.from(mergedNegsMap.values()).map((n: any) => ({
          id: n.id,
          produto: n.productName,
          papel: n.sellerId === userId ? 'vendedor' : 'comprador',
          valorPropostoKz: Number(n.currentProposedPrice) || 0,
          estado: n.status
        }))
      };
    }

    if (name === 'consultar_catalogo_oficial') {
      const q = String(args?.termo || '').trim().toLowerCase();
      const [allProducts, activeResale] = await Promise.all([
        queryFirestoreCollectionRest('products', idToken, undefined, 250),
        queryFirestoreCollectionRest('resale_listings', idToken, { field: 'status', value: 'ativo' }, 100)
      ]);

      const matched =
        !q || q === 'todos' || q === 'all'
          ? allProducts.slice(0, 15)
          : allProducts
              .filter(
                (p: any) =>
                  p &&
                  (String(p.name || '').toLowerCase().includes(q) ||
                    String(p.category || '').toLowerCase().includes(q) ||
                    String(p.brand || '').toLowerCase().includes(q))
              )
              .slice(0, 15);

      return {
        totalProdutosOficiais: allProducts.length,
        totalAnunciosRevendaAtivos: activeResale.length,
        produtos: matched.map((p: any) => ({
          id: p.id,
          nome: p.name,
          marca: p.brand,
          categoria: p.category,
          precoCompraKz: Number(p.officialPrice) || 0,
          precoRevendaSugeridoKz: Number(p.suggestedResalePrice) || 0,
          stock: Number(p.stock) || 0,
          estado: p.status
        }))
      };
    }

    if (name === 'encaminhar_para_administrador') {
      const motivo = String(
        args?.motivo || 'Pedido encaminhado pela Assistente Jeniffer para análise administrativa.'
      ).trim();
      const nowIso = new Date().toISOString();
      const currentConv = await getFirestoreDocRest('assistant_conversations', conversationId, idToken).catch(
        () => null
      );
      if (currentConv) {
        await upsertFirestoreDocRest(
          'assistant_conversations',
          conversationId,
          {
            ...currentConv,
            status: 'aguardando_adm',
            escalationReason: motivo,
            escalatedAt: nowIso,
            unreadByAdmin: true,
            updatedAt: nowIso
          },
          idToken
        );
      }

      const notifId = `notif_jeniffer_${Date.now()}`;
      await upsertFirestoreDocRest(
        'notifications',
        notifId,
        {
          id: notifId,
          recipientId: ADMIN_UID,
          title: 'Atendimento Encaminhado — Assistente Jeniffer',
          message: `Cliente ${user?.name || userId} precisa de apoio humano: ${motivo}`,
          type: 'sistema',
          read: false,
          linkType: 'admin',
          linkId: conversationId,
          createdAt: nowIso
        },
        idToken
      );

      return {
        encaminhado: true,
        motivo,
        mensagemSistema:
          'Atendimento marcado como aguardando_adm e Administrador notificado no Painel Administrativo.'
      };
    }

    return { erro: 'Ferramenta desconhecida.' };
  };

  return { executeTool };
}

export async function processJenifferChat(params: {
  conversationId: string;
  userId: string;
  message: string;
  idToken: string;
}): Promise<JenifferChatResult> {
  const { conversationId, userId, message, idToken } = params;
  const cleanMsg = String(message || '').trim();
  if (!cleanMsg) {
    return { ok: false, statusCode: 400, code: 'EMPTY_MESSAGE', error: 'Escreve uma mensagem antes de enviar.' };
  }

  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified || verified.uid !== userId) {
    return {
      ok: false,
      statusCode: 401,
      code: 'INVALID_FIREBASE_TOKEN',
      error: 'Sessão Firebase inválida ou expirada. Faz login novamente.'
    };
  }

  const user = await getFirestoreDocRest('users', userId, idToken).catch(() => null);
  if (!user) {
    return {
      ok: false,
      statusCode: 403,
      code: 'UNAUTHORIZED_USER',
      error: 'Conta de utilizador não encontrada no Cloud Firestore.'
    };
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      ok: false,
      statusCode: 503,
      code: 'MISSING_API_KEY',
      error:
        'A chave da API Gemini (GEMINI_API_KEY) não está configurada no servidor. Configura a chave em Settings > Secrets para ativar as respostas inteligentes da Assistente Jeniffer.'
    };
  }

  const nowIso = new Date().toISOString();
  const existingConv = await getFirestoreDocRest('assistant_conversations', conversationId, idToken).catch(
    () => null
  );
  const prevMessages: any[] = Array.isArray(existingConv?.messages) ? existingConv.messages : [];

  const userMessageObj = {
    id: `jmsg_u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    sender: 'user',
    senderName: user.name || 'Cliente',
    text: cleanMsg,
    timestamp: nowIso
  };

  const updatedTitle =
    existingConv?.title && existingConv.title !== 'Novo Atendimento'
      ? existingConv.title
      : cleanMsg.length > 42
      ? `${cleanMsg.slice(0, 42)}...`
      : cleanMsg;

  const baseConv = {
    id: conversationId,
    userId,
    userName: user.name || 'Cliente BABA',
    userPhone: user.phone || '',
    userProvince: user.province || '',
    title: updatedTitle,
    status: existingConv?.status === 'resolvido' ? 'ativo' : existingConv?.status || 'ativo',
    escalationReason: existingConv?.escalationReason || '',
    escalatedAt: existingConv?.escalatedAt || '',
    messages: [...prevMessages, userMessageObj],
    lastMessagePreview: cleanMsg.slice(0, 90),
    unreadByAdmin: true,
    unreadByUser: false,
    createdAt: existingConv?.createdAt || nowIso,
    updatedAt: nowIso
  };
  await upsertFirestoreDocRest('assistant_conversations', conversationId, baseConv, idToken);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 18000,
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const { executeTool } = createStrictUserToolExecutor({
      userId,
      user,
      conversationId,
      idToken
    });

    const historyTurns: any[] = prevMessages.slice(-20).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [
        {
          text:
            m.sender === 'admin'
              ? `[Mensagem do Administrador Humano ${m.senderName}]: ${m.text}`
              : m.text
        }
      ]
    }));

    const contents: any[] = [
      ...historyTurns,
      {
        role: 'user',
        parts: [{ text: cleanMsg }]
      }
    ];

    const consultedToolLabels: string[] = [];
    let escalatedInTurn = false;
    let finalReplyText = '';

    const systemInstruction = `${JENIFFER_SYSTEM_INSTRUCTION}\n\n[Sessão Atual Verificada]\nNome do Cliente: ${user.name}\nProvíncia: ${user.province || 'Angola'}`;

    const callGeminiWithRetry = async () => {
      const candidates: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
        { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW }
      ];

      let lastErr: any;
      for (let pass = 0; pass < 2; pass++) {
        for (const candidate of candidates) {
          try {
            return await ai.models.generateContent({
              model: candidate.model,
              contents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: candidate.thinkingLevel },
                tools: [{ functionDeclarations: jenifferTools }]
              }
            });
          } catch (err: any) {
            lastErr = err;
            const st = Number(err?.status || err?.code) || 0;
            const msg = String(err?.message || '').toLowerCase();
            const isTransientOrTimeout =
              st === 429 ||
              st === 500 ||
              st === 502 ||
              st === 503 ||
              st === 504 ||
              msg.includes('resource_exhausted') ||
              msg.includes('unavailable') ||
              msg.includes('timeout') ||
              msg.includes('deadline_exceeded');
            if (!isTransientOrTimeout) throw err;
          }
        }
        if (pass === 0) {
          await new Promise(resolve => setTimeout(resolve, 900));
        }
      }
      throw lastErr;
    };

    for (let step = 0; step < 5; step++) {
      const response = await callGeminiWithRetry();

      const candidateContent = response.candidates?.[0]?.content;
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0 && candidateContent) {
        contents.push(candidateContent);
        const toolResponseParts: any[] = [];

        for (const fc of functionCalls) {
          const fnName = fc.name || '';
          const fnArgs = (fc.args || {}) as Record<string, any>;
          const toolResult = await executeTool(fnName, fnArgs);
          const friendlyLabel = TOOL_LABELS[fnName] || fnName;
          if (!consultedToolLabels.includes(friendlyLabel)) {
            consultedToolLabels.push(friendlyLabel);
          }
          if (fnName === 'encaminhar_para_administrador') {
            escalatedInTurn = true;
          }
          toolResponseParts.push({
            functionResponse: {
              id: fc.id,
              name: fnName,
              response: { result: toolResult }
            }
          });
        }

        contents.push({
          role: 'user',
          parts: toolResponseParts
        });
        continue;
      }

      finalReplyText = (response.text || '').trim();
      break;
    }

    if (!finalReplyText) {
      return {
        ok: false,
        statusCode: 502,
        code: 'EMPTY_MODEL_RESPONSE',
        error: 'A Assistente Jeniffer não conseguiu gerar uma resposta neste momento. Por favor, tenta novamente.'
      };
    }

    const replyNow = new Date().toISOString();
    const latestConv =
      (await getFirestoreDocRest('assistant_conversations', conversationId, idToken).catch(() => null)) || baseConv;
    const replyMessageObj = {
      id: `jmsg_a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      sender: 'jeniffer',
      senderName: 'Assistente Jeniffer',
      text: finalReplyText,
      timestamp: replyNow,
      consultedTools: consultedToolLabels,
      escalated: escalatedInTurn
    };

    const nextMessages = [
      ...(Array.isArray(latestConv.messages) ? latestConv.messages : baseConv.messages),
      replyMessageObj
    ];
    const finalConv = await upsertFirestoreDocRest(
      'assistant_conversations',
      conversationId,
      {
        ...latestConv,
        messages: nextMessages,
        lastMessagePreview: finalReplyText.slice(0, 90),
        status: escalatedInTurn ? 'aguardando_adm' : latestConv.status || 'ativo',
        unreadByAdmin: escalatedInTurn ? true : latestConv.unreadByAdmin,
        unreadByUser: false,
        updatedAt: replyNow
      },
      idToken
    );

    return {
      ok: true,
      conversation: finalConv,
      userMessage: userMessageObj,
      replyMessage: replyMessageObj
    };
  } catch (err: any) {
    const rawMsg = err?.message ? String(err.message) : String(err);
    const status = Number(err?.status || err?.code) || 500;
    console.error('[Jeniffer AI Error]', status, rawMsg);
    let userFriendlyError = 'Erro ao comunicar com o serviço de inteligência artificial da Assistente Jeniffer.';
    let errorCode = 'AI_ERROR';

    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('PERMISSION_DENIED') || status === 400 || status === 403) {
      errorCode = 'API_KEY_INVALID';
      userFriendlyError =
        'Chave da API Gemini inválida ou sem permissão. Verifica a configuração da chave em Settings > Secrets.';
    } else if (rawMsg.includes('NOT_FOUND') || status === 404) {
      errorCode = 'MODEL_NOT_FOUND';
      userFriendlyError = 'Modelo de IA não encontrado no servidor.';
    } else {
      errorCode = 'AI_CONNECTION_ERROR';
      userFriendlyError =
        'Não foi possível obter resposta do servidor de IA neste pedido. Tenta enviar novamente ou clica em "Falar com Administrador".';
    }

    return {
      ok: false,
      statusCode: status >= 400 && status < 600 ? status : 502,
      code: errorCode,
      error: userFriendlyError,
      conversation: baseConv
    };
  }
}

export async function escalateToAdminManual(params: {
  conversationId: string;
  userId: string;
  reason: string;
  idToken: string;
}): Promise<JenifferChatResult> {
  const { conversationId, userId, reason, idToken } = params;

  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified || verified.uid !== userId) {
    return {
      ok: false,
      statusCode: 401,
      code: 'INVALID_FIREBASE_TOKEN',
      error: 'Sessão Firebase inválida ou expirada. Faz login novamente.'
    };
  }

  const user = await getFirestoreDocRest('users', userId, idToken).catch(() => null);
  if (!user) {
    return { ok: false, statusCode: 403, code: 'UNAUTHORIZED_USER', error: 'Utilizador não autorizado.' };
  }

  const cleanReason =
    String(reason || '').trim() || 'O cliente solicitou intervenção humana do Administrador.';
  const nowIso = new Date().toISOString();
  const existingConv = await getFirestoreDocRest('assistant_conversations', conversationId, idToken).catch(
    () => null
  );
  const prevMessages: any[] = Array.isArray(existingConv?.messages) ? existingConv.messages : [];

  const systemReply = {
    id: `jmsg_esc_${Date.now()}`,
    conversationId,
    sender: 'jeniffer',
    senderName: 'Assistente Jeniffer',
    text: `O teu atendimento foi encaminhado para o Administrador com o seguinte registo: "${cleanReason}". A equipa administrativa já recebeu a notificação no Painel e responderá nesta conversa assim que possível.`,
    timestamp: nowIso,
    consultedTools: ['Encaminhamento ao Administrador'],
    escalated: true
  };

  const nextConv = await upsertFirestoreDocRest(
    'assistant_conversations',
    conversationId,
    {
      id: conversationId,
      userId,
      userName: user.name || 'Cliente BABA',
      userPhone: user.phone || '',
      userProvince: user.province || '',
      title: existingConv?.title || 'Atendimento Encaminhado ao Adm',
      status: 'aguardando_adm',
      escalationReason: cleanReason,
      escalatedAt: nowIso,
      messages: [...prevMessages, systemReply],
      lastMessagePreview: systemReply.text.slice(0, 90),
      unreadByAdmin: true,
      unreadByUser: false,
      createdAt: existingConv?.createdAt || nowIso,
      updatedAt: nowIso
    },
    idToken
  );

  const notifId = `notif_jeniffer_esc_${Date.now()}`;
  await upsertFirestoreDocRest(
    'notifications',
    notifId,
    {
      id: notifId,
      recipientId: ADMIN_UID,
      title: 'Novo Atendimento Encaminhado ao Adm',
      message: `${user.name || 'Cliente'} pediu apoio humano: ${cleanReason}`,
      type: 'sistema',
      read: false,
      linkType: 'admin',
      linkId: conversationId,
      createdAt: nowIso
    },
    idToken
  );

  return { ok: true, conversation: nextConv, replyMessage: systemReply };
}
