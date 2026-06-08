const CONFIG = {
  whatsapp: '5521966268540',
};

const PILATES_HORARIOS = ['15:00', '16:00', '17:00', '18:00', '19:00'];

// Adicione ou remova horários aqui para bloquear vagas
const HORARIOS_LOTADOS = [];

const PLANOS_PILATES = {
  mensal: [
    { freq: '1x/semana', preco: 'R$ 180/mês' },
    { freq: '2x/semana', preco: 'R$ 290/mês' },
    { freq: '3x/semana', preco: 'R$ 390/mês' },
    { freq: '4x/semana', preco: 'R$ 480/mês' },
    { freq: '5x/semana', preco: 'R$ 560/mês' },
  ],
  trimestral: [
    { freq: '1x/semana', preco: 'R$ 170/mês' },
    { freq: '2x/semana', preco: 'R$ 275/mês' },
    { freq: '3x/semana', preco: 'R$ 370/mês' },
    { freq: '4x/semana', preco: 'R$ 455/mês' },
    { freq: '5x/semana', preco: 'R$ 530/mês' },
  ],
  semestral: [
    { freq: '1x/semana', preco: 'R$ 160/mês' },
    { freq: '2x/semana', preco: 'R$ 255/mês' },
    { freq: '3x/semana', preco: 'R$ 345/mês' },
    { freq: '4x/semana', preco: 'R$ 430/mês' },
    { freq: '5x/semana', preco: 'R$ 499/mês' },
  ],
};


// ── ESTADO DO AGENDAMENTO ─────────────────────────────────────

// Guarda todas as escolhas do usuário durante o fluxo do modal
let state = {};

function resetState() {
  state = {
    step: 1,
    atividade: '',
    subAtividade: '',
    grupoTipo: '',
    pessoas: '',
    horario: '',
    listaEspera: false,
    plano: '',
    periodoAtivo: 'mensal',
    nome: '',
    tel: '',
    email: '',
    obs: '',
  };
}


// ── HELPERS DE FLUXO ─────────────────────────────────────────

function isGrupo() {
  return state.subAtividade && state.subAtividade.includes('Grupo');
}

/**
 * Retorna o total de steps conforme a atividade escolhida:
 * - Pilates:       Atividade → Horário → Plano → Dados  (4 steps)
 * - Yoga individual: Atividade → Modalidade → Horário → Dados  (4 steps)
 * - Yoga em grupo: Atividade → Modalidade → Tipo → Pessoas → Horário → Dados  (6 steps)
 */
function getTotalSteps() {
  if (state.atividade === 'Pilates') return 4;
  if (isGrupo()) return 6;
  return 4;
}

/**
 * Mapeia o número do step para um nome lógico,
 * facilitando saber qual tela renderizar.
 */
function getLogicStep() {
  const n = state.step;

  if (state.atividade === 'Pilates') {
    return ['atividade', 'horario', 'plano', 'dados'][n - 1];
  }

  if (isGrupo()) {
    return ['atividade', 'subatividade', 'grupo', 'pessoas', 'horario', 'dados'][n - 1] || 'dados';
  }

  return ['atividade', 'subatividade', 'horario', 'dados'][n - 1] || 'dados';
}

function podeAvancar() {
  const step = getLogicStep();
  const validacoes = {
    atividade: () => !!state.atividade,
    subatividade: () => !!state.subAtividade,
    grupo: () => !!state.grupoTipo,
    pessoas: () => !!state.pessoas,
    horario: () => !!state.horario,
    plano: () => !!state.plano,
  };
  return validacoes[step] ? validacoes[step]() : true;
}


// ── MODAL: ABRIR / FECHAR ─────────────────────────────────────

function abrirAgendar() {
  resetState();
  renderStep();
  document.getElementById('agendarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharAgendar() {
  document.getElementById('agendarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}


// ── RENDERIZAÇÃO PRINCIPAL ────────────────────────────────────

function renderStep() {
  renderDots();
  renderBody();
  renderFooter();
}

function renderDots() {
  const total = getTotalSteps();
  const dots = Array.from({ length: total }, (_, i) => {
    const cls = i + 1 < state.step ? 'done' : i + 1 === state.step ? 'active' : '';
    return `<div class="agendar-step-dot ${cls}"></div>`;
  }).join('');

  document.getElementById('agendarDots').innerHTML = dots;
  document.getElementById('stepLabel').textContent = `Passo ${state.step} de ${total}`;
}

function renderBody() {
  const renderers = {
    atividade: renderAtividade,
    subatividade: renderSubAtividade,
    grupo: renderGrupo,
    pessoas: renderPessoas,
    horario: renderHorario,
    plano: renderPlano,
    dados: renderDados,
  };

  const html = renderers[getLogicStep()]();
  document.getElementById('agendarBodyWrap').innerHTML = `<div class="agendar-body">${html}</div>`;
}

function renderFooter() {
  const footer = document.getElementById('agendarFooter');
  const logicStep = getLogicStep();
  const backBtn = state.step > 1
    ? `<button class="btn-agendar-back" onclick="voltarStep()">← Voltar</button>`
    : '';

  if (logicStep === 'dados') {
    footer.innerHTML = `
      ${backBtn}
      <button class="btn-whatsapp" onclick="enviarWhatsApp()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        Enviar pelo WhatsApp
      </button>`;
    return;
  }

  footer.innerHTML = `
    ${backBtn}
    <button class="btn-agendar-next" onclick="avancarStep()" ${podeAvancar() ? '' : 'disabled'}>
      Continuar →
    </button>`;
}


// ── TELAS DO MODAL ────────────────────────────────────────────

function renderAtividade() {
  document.getElementById('stepTitle').innerHTML = 'Qual atividade<br><em>você prefere?</em>';

  const opcoes = [
    { val: 'Pilates', det: 'Aulas em aparelhos · personalizada' },
    { val: 'Yoga', det: 'Personal · Gestantes · Kids · Grupo' },
  ];

  return renderOpcoes(opcoes, 'atividade', state.atividade);
}

function renderSubAtividade() {
  document.getElementById('stepTitle').innerHTML = 'Qual modalidade<br><em>de Yoga?</em>';

  const opcoes = [
    { val: 'Personal Yoga', det: 'Aula particular · só você' },
    { val: 'Yoga Gestantes', det: 'Especialidade para gestantes' },
    { val: 'Yoga Kids', det: 'Para crianças' },
    { val: 'Yoga em Grupo', det: 'Aulas para 2+ pessoas' },
  ];

  return renderOpcoes(opcoes, 'subAtividade', state.subAtividade);
}

function renderGrupo() {
  document.getElementById('stepTitle').innerHTML = 'Qual tipo<br><em>de grupo?</em>';

  const opcoes = [
    { val: 'Grupo Particular', det: 'Grupo personalizado' },
    { val: 'Grupo Gestantes', det: 'Yoga para mamães' },
    { val: 'Grupo Kids', det: 'Yoga infantil' },
  ];

  return renderOpcoes(opcoes, 'grupoTipo', state.grupoTipo);
}

function renderPessoas() {
  document.getElementById('stepTitle').innerHTML = 'Quantas pessoas<br><em>no grupo?</em>';

  const opcoes = [
    { val: '2 pessoas', det: 'Dupla' },
    { val: '3 pessoas', det: 'Trio' },
    { val: '4 pessoas', det: 'Quarteto' },
    { val: '5+ pessoas', det: 'Combinamos juntas' },
  ];

  return `
    <p class="agendar-nota">Para grupos, o valor é combinado conforme o número de participantes.</p>
    <div class="opcoes-grid opcoes-grid-2">
      ${renderOpcoesBtns(opcoes, 'pessoas', state.pessoas)}
    </div>`;
}

function renderHorario() {
  const isPilates = state.atividade === 'Pilates';

  document.getElementById('stepTitle').innerHTML = isPilates
    ? 'Escolha seu<br><em>horário preferido.</em>'
    : 'Quando você<br><em>prefere praticar?</em>';

  if (isPilates) {
    return renderHorarioPilates();
  }

  return renderHorarioYoga();
}

function renderHorarioPilates() {
  const botoes = PILATES_HORARIOS.map(h => {
    const lotado = HORARIOS_LOTADOS.includes(h);
    const isEspera = state.horario === `Lista de espera — ${h}`;
    const isSelecionado = state.horario === h;

    if (lotado) {
      return `
        <button class="horario-btn avise-me ${isEspera ? 'selected' : ''}" onclick="selecionarEspera('${h}')">
          ${h} · Lista de espera
        </button>`;
    }

    return `
      <button class="horario-btn ${isSelecionado ? 'selected' : ''}" onclick="selecionarHorario('${h}')">
        ${h}
      </button>`;
  }).join('');

  const avisoEspera = state.listaEspera
    ? `<p class="horario-aviso-espera">✓ Você será avisada assim que uma vaga abrir no horário das ${state.horario.replace('Lista de espera — ', '')}</p>`
    : '';

  return `
    <p class="agendar-nota">Aulas de <strong>50 minutos</strong> · Quarta-feira e Sexta-feira</p>
    <div class="horarios-grid">${botoes}</div>
    ${avisoEspera}`;
}

function renderHorarioYoga() {
  const prefs = [
    '🌅 Manhã (8h–12h)',
    '☀️ Tarde (12h–17h)',
    '🌙 Noite (17h–20h)',
    '🗓️ Flexível',
  ];

  const botoes = prefs.map(p => `
    <button class="horario-btn ${state.horario === p ? 'selected' : ''}" onclick="selecionarHorario('${p}')">
      ${p}
    </button>`).join('');

  return `
    <p class="agendar-nota">Aulas personalizadas. Combinamos o melhor horário para você!</p>
    <div class="horarios-grid">${botoes}</div>`;
}

function renderPlano() {
  document.getElementById('stepTitle').innerHTML = 'Qual plano<br><em>te atende melhor?</em>';

  if (state.atividade === 'Pilates') {
    return renderPlanoPilates();
  }

  return renderPlanoYoga();
}

function renderPlanoPilates() {
  const tabs = ['mensal', 'trimestral', 'semestral'];

  const tabsHtml = `
    <div class="plano-periodo-tabs">
      ${tabs.map(t => `
        <button
          class="plano-periodo-btn ${state.periodoAtivo === t ? 'active' : ''}"
          onclick="mudarPeriodo('${t}')">
          ${t.charAt(0).toUpperCase() + t.slice(1)}
        </button>`).join('')}
    </div>`;

  const itens = PLANOS_PILATES[state.periodoAtivo].map(p => {
    const id = `${p.freq} ${state.periodoAtivo} — ${p.preco}`;
    const popular = p.freq === '2x/semana';
    const sel = state.plano === id;

    return `
      <div class="plano-opcao ${sel ? 'selected' : ''}" onclick="selecionarPlano('${id}')">
        <div class="plano-opcao-check">✓</div>
        <div class="plano-opcao-info">
          <div class="plano-opcao-nome">${p.freq}</div>
          <div class="plano-opcao-detalhe">Plano ${state.periodoAtivo}</div>
        </div>
        <div class="plano-opcao-preco">${p.preco}</div>
        ${popular ? '<div class="plano-popular-badge">Popular</div>' : ''}
      </div>`;
  }).join('');

  return tabsHtml + `<div class="plano-opcoes">${itens}</div>`;
}

function renderPlanoYoga() {
  const det = 'Valor combinado com a professora';

  const opcoes = isGrupo()
    ? [
      { nome: 'Grupo · Yoga Tradicional', det },
      { nome: 'Grupo · Gestantes', det },
      { nome: 'Grupo · Kids', det },
    ]
    : [
      { nome: 'Yoga Tradicional', det },
      { nome: 'Yoga Gestantes', det },
      { nome: 'Yoga Kids', det },
    ];

  return opcoes.map(p => `
    <div class="plano-opcao ${state.plano === p.nome ? 'selected' : ''}" onclick="selecionarPlano('${p.nome}')">
      <div class="plano-opcao-check">✓</div>
      <div class="plano-opcao-info">
        <div class="plano-opcao-nome">${p.nome}</div>
        <div class="plano-opcao-detalhe">${p.det}</div>
      </div>
    </div>`).join('');
}

function renderDados() {
  document.getElementById('stepTitle').innerHTML = 'Quase lá!<br><em>Seus dados.</em>';

  const atividade = state.atividade === 'Yoga' ? (state.subAtividade || 'Yoga') : state.atividade;
  const pessoas = state.pessoas ? ` · <strong>Grupo:</strong> ${state.pessoas}` : '';

  return `
    <div class="dados-resumo">
      <strong>Atividade:</strong> ${atividade}${pessoas} &nbsp;·&nbsp;
      <strong>Horário:</strong> ${state.horario}
      ${state.plano ? ` &nbsp;·&nbsp; <strong>Plano:</strong> ${state.plano}` : ''}
    </div>
    <div class="dados-form">
      <div class="dados-input-group">
        <label>Seu nome</label>
        <input type="text" id="dadosNome" placeholder="Como prefere ser chamada?" value="${state.nome}">
      </div>
      <div class="dados-input-group">
        <label>WhatsApp</label>
        <input type="tel" id="dadosTel" placeholder="(21) 99999-9999" value="${state.tel}">
      </div>
      <div class="dados-input-group">
        <label>E-mail <span class="label-opcional">(opcional)</span></label>
        <input type="email" id="dadosEmail" placeholder="seu@email.com" value="${state.email}">
      </div>
      <div class="dados-input-group">
        <label>Observações <span class="label-opcional">(opcional)</span></label>
        <textarea id="dadosObs" placeholder="Lesões, preferências, dúvidas...">${state.obs}</textarea>
      </div>
    </div>`;
}


// ── HELPERS DE RENDERIZAÇÃO ───────────────────────────────────

/** Gera um grid de botões de opção */
function renderOpcoes(opcoes, campo, valorAtual) {
  return `
    <div class="opcoes-grid">
      ${renderOpcoesBtns(opcoes, campo, valorAtual)}
    </div>`;
}

function renderOpcoesBtns(opcoes, campo, valorAtual) {
  return opcoes.map(o => `
    <button class="opcao-btn ${valorAtual === o.val ? 'selected' : ''}" onclick="pick('${campo}','${o.val}')">
      <div class="opcao-info">
        <div class="opcao-nome">${o.val}</div>
        <div class="opcao-detalhe">${o.det}</div>
      </div>
    </button>`).join('');
}


// ── AÇÕES DO USUÁRIO ──────────────────────────────────────────

function pick(campo, valor) {
  // Reseta campos dependentes ao mudar atividade ou modalidade
  if (campo === 'atividade') {
    Object.assign(state, { atividade: valor, subAtividade: '', grupoTipo: '', pessoas: '', horario: '', plano: '', listaEspera: false });
  } else if (campo === 'subAtividade') {
    Object.assign(state, { subAtividade: valor, grupoTipo: '', pessoas: '', horario: '', plano: '', listaEspera: false });
  } else {
    state[campo] = valor;
  }
  renderStep();
}

function selecionarHorario(valor) {
  state.horario = valor;
  state.listaEspera = false;
  renderStep();
}

function selecionarEspera(horario) {
  state.horario = `Lista de espera — ${horario}`;
  state.listaEspera = true;
  renderStep();
}

function selecionarPlano(nome) {
  state.plano = nome;
  renderStep();
}

function mudarPeriodo(periodo) {
  state.periodoAtivo = periodo;
  state.plano = '';
  renderStep();
}

function avancarStep() {
  if (!podeAvancar()) return;
  state.step++;
  renderStep();
}

function voltarStep() {
  state.step--;
  renderStep();
}


// ── ENVIO WHATSAPP ────────────────────────────────────────────

function coletarDados() {
  state.nome = document.getElementById('dadosNome')?.value || '';
  state.tel = document.getElementById('dadosTel')?.value || '';
  state.email = document.getElementById('dadosEmail')?.value || '';
  state.obs = document.getElementById('dadosObs')?.value || '';
}

function montarMensagem() {
  coletarDados();

  const atividade = state.atividade === 'Yoga' ? (state.subAtividade || 'Yoga') : state.atividade;
  const pessoasLinha = state.pessoas ? `*Pessoas no grupo:* ${state.pessoas}\n` : '';
  const planoLinha = state.plano ? `*Plano desejado:* ${state.plano}\n` : '';
  const emailLinha = state.email ? `*E-mail:* ${state.email}\n` : '';
  const obsLinha = state.obs ? `*Observações:* ${state.obs}\n` : '';
  const espera = state.listaEspera ? ' (lista de espera)' : '';

  return [
    `Olá! Tenho interesse em agendar uma aula no Studios Prana 🌿\n`,
    `*Nome:* ${state.nome || 'Não informado'}`,
    `*Atividade:* ${atividade}`,
    pessoasLinha,
    `*Horário preferido:* ${state.horario}${espera}`,
    planoLinha,
    `*WhatsApp:* ${state.tel || 'Não informado'}`,
    emailLinha,
    obsLinha,
    `\nAguardo retorno! 🙏`,
  ].join('\n');
}

function enviarWhatsApp() {
  const msg = montarMensagem();
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}


// ── EVENTOS & RETIROS ─────────────────────────────────────────

function enviarAvisoEvento() {
  const input = document.getElementById('eventosEmailInput');
  const email = input?.value?.trim();

  if (!email || !email.includes('@')) {
    input.style.borderColor = '#E07A5F';
    return;
  }

  const msg = `Olá! Quero ser avisada sobre eventos e retiros do Studios Prana 🌿\n\nMeu e-mail: ${email}`;
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');

  document.getElementById('eventosEmailForm').style.display = 'none';
  document.getElementById('eventosEmailOk').style.display = 'flex';
}


// ── LOGIN DA PROFESSORA ───────────────────────────────────────

function loginProfessora() {
  const email = document.querySelector('.login-modal input[type="email"]').value;
  const senha = document.querySelector('.login-modal input[type="password"]').value;

  // TODO: substituir por autenticação real
  if (email === 'gmail@prana.com' && senha === '123456') {
    document.getElementById('loginOverlay').classList.remove('open');
    window.location.href = 'painel.html';
    return;
  }

  alert('E-mail ou senha incorretos');
}


// ── INICIALIZAÇÃO DA PÁGINA ───────────────────────────────────

(function init() {
  // Scroll sempre do topo ao carregar
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.location.hash) {
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);

  // Sombra na nav ao scrollar
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(107,94,168,0.1)' : 'none';
  });

  // Animação de entrada dos elementos .reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


// ── TABS PILATES ──────────────────────────────────────────────

function showTab(prefix, tab, btn) {
  document.querySelectorAll(`#${prefix}-mensal, #${prefix}-trimestral, #${prefix}-semestral`)
    .forEach(p => p.classList.remove('active'));

  document.getElementById(`${prefix}-${tab}`).classList.add('active');

  btn.closest('.planos-tabs').querySelectorAll('.plano-tab')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
}


// ── TABS YOGA ─────────────────────────────────────────────────

function showYogaTab(panelId, btn) {
  document.querySelectorAll('#yoga-valores, #yoga-eventos')
    .forEach(p => p.classList.remove('active'));

  document.getElementById(panelId).classList.add('active');

  btn.closest('.yoga-tabs').querySelectorAll('.yoga-tab')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
}

function abrirDrawer() {
  document.getElementById('navDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharDrawer() {
  document.getElementById('navDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

