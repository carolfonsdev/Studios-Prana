// ── Scroll restoration ──
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (window.location.hash) history.replaceState(null, document.title, window.location.pathname + window.location.search);
window.scrollTo(0, 0);

// ── Scroll reveal ──
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => observer.observe(el));

// ── Nav scroll ──
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(107,94,168,0.1)' : 'none';
});

// ── Tabs Pilates ──
function showTab(prefix, tab, btn) {
  document.querySelectorAll('#' + prefix + '-mensal, #' + prefix + '-trimestral, #' + prefix + '-semestral').forEach(p => p.classList.remove('active'));
  document.getElementById(prefix + '-' + tab).classList.add('active');
  btn.closest('.planos-tabs').querySelectorAll('.plano-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Tabs Yoga ──
function showYogaTab(panelId, btn) {
  document.querySelectorAll('#yoga-valores, #yoga-eventos').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  btn.closest('.yoga-tabs').querySelectorAll('.yoga-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── MODAL AGENDAMENTO ──
const WHATSAPP_NUMBER = '5521966268540';
const EMAIL_STUDIO = 'contato@studiosprana.com.br';

const PILATES_HORARIOS = ['15:00', '16:00', '17:00', '18:00', '19:00'];

const planosPilates = {
  mensal: [{ freq: '1x/semana', preco: 'R$ 180/mês' }, { freq: '2x/semana', preco: 'R$ 290/mês' }, { freq: '3x/semana', preco: 'R$ 390/mês' }, { freq: '4x/semana', preco: 'R$ 480/mês' }, { freq: '5x/semana', preco: 'R$ 560/mês' }],
  trimestral: [{ freq: '1x/semana', preco: 'R$ 170/mês' }, { freq: '2x/semana', preco: 'R$ 275/mês' }, { freq: '3x/semana', preco: 'R$ 370/mês' }, { freq: '4x/semana', preco: 'R$ 455/mês' }, { freq: '5x/semana', preco: 'R$ 530/mês' }],
  semestral: [{ freq: '1x/semana', preco: 'R$ 160/mês' }, { freq: '2x/semana', preco: 'R$ 255/mês' }, { freq: '3x/semana', preco: 'R$ 345/mês' }, { freq: '4x/semana', preco: 'R$ 430/mês' }, { freq: '5x/semana', preco: 'R$ 499/mês' }]
};

// Horários lotados — adicione '15:00' etc. para bloquear
const horariosLotados = [''];

// state completo
let S = {};

function resetState() {
  S = {
    step: 1,
    totalSteps: 5,
    atividade: '',
    subAtividade: '',
    grupoTipo: '',
    pessoas: '',
    horario: '',
    listaEspera: false,
    plano: '',
    periodoAtivo: 'mensal'
  };
}

// ── STEPS DEFINITIONS ──
// Step 1: Atividade principal (Pilates / Yoga)
// Step 2: Sub-atividade (só Yoga tem sub; Pilates pula direto)
// Step 3: Quantidade de pessoas
// Step 4: Horário / preferência
// Step 5: Plano
// Step 6: Dados + envio

function isGrupo() { return S.subAtividade && S.subAtividade.includes('Grupo'); }

function totalStepsFor() {
  if (S.atividade === 'Pilates') return 4;
  if (isGrupo()) return 6;
  return 4;
}

function getLogicStep() {
  const n = S.step;
  if (S.atividade === 'Pilates') {
    return ['atividade', 'horario', 'plano', 'dados'][n - 1];
  }
  if (isGrupo()) {
    return ['atividade', 'subatividade', 'grupo', 'pessoas', 'horario', 'dados'][n - 1] || 'dados';
  }
  return ['atividade', 'subatividade', 'horario', 'dados'][n - 1] || 'dados';
}

function stepLabel(n) {
  const t = totalStepsFor();
  return `Passo ${n} de ${t}`;
}

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

// ── RENDER ENGINE ──
function renderStep() {
  const n = S.step;
  const total = totalStepsFor();

  // Dots
  let dotsHtml = '';
  for (let i = 1; i <= total; i++) {
    const cls = i < n ? 'done' : i === n ? 'active' : '';
    dotsHtml += `<div class="agendar-step-dot ${cls}"></div>`;
  }
  document.getElementById('agendarDots').innerHTML = dotsHtml;
  document.getElementById('stepLabel').textContent = stepLabel(n);

  const logicStep = getLogicStep();

  const renderers = {
    atividade: renderAtividade,
    subatividade: renderSubAtividade,
    grupo: renderGrupo,
    pessoas: renderPessoas,
    horario: renderHorario,
    plano: renderPlano,
    dados: renderDados,
  };

  document.getElementById('agendarBodyWrap').innerHTML =
    `<div class="agendar-body">${renderers[logicStep]()}</div>`;

  renderFooter(logicStep);
}

// ── RENDERERS ──
function renderAtividade() {
  document.getElementById('stepTitle').innerHTML =
    'Qual atividade<br><em>você prefere?</em>';

  const opts = [
    {
      val: 'Pilates',
      det: 'Aulas em aparelhos · personalizada'
    },
    {
      val: 'Yoga',
      det: 'Personal · Gestantes · Kids · Grupo'
    }
  ];

  return `
    <div class="opcoes-grid">
      ${opts.map(o => `
        <button 
          class="opcao-btn ${S.atividade === o.val ? 'selected' : ''}" 
          onclick="pick('atividade','${o.val}',this)"
        >
          <div class="opcao-info">
            <div class="opcao-nome">${o.val}</div>
            <div class="opcao-detalhe">${o.det}</div>
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

function renderSubAtividade() {
  document.getElementById('stepTitle').innerHTML =
    'Qual modalidade<br><em>de Yoga?</em>';

  const opts = [
    { val: 'Personal Yoga',    det: 'Aula particular · só você' },
    { val: 'Yoga Gestantes',   det: 'Especialidade para gestantes' },
    { val: 'Yoga Kids',        det: 'Para crianças' },
    { val: 'Yoga em Grupo',    det: 'Aulas para 2+ pessoas' }
  ];

  return `
    <div class="opcoes-grid">
      ${opts.map(o => `
        <button class="opcao-btn ${S.subAtividade === o.val ? 'selected' : ''}"
          onclick="pick('subAtividade','${o.val}',this)">
          <div class="opcao-info">
            <div class="opcao-nome">${o.val}</div>
            <div class="opcao-detalhe">${o.det}</div>
          </div>
        </button>
      `).join('')}
    </div>`;
}

function renderGrupo() {

  document.getElementById('stepTitle').innerHTML =
    'Qual tipo<br><em>de grupo?</em>';

  const opts = [
    {
      val: 'Grupo Particular',
      det: 'Grupo personalizado'
    },
    {
      val: 'Grupo Gestantes',
      det: 'Yoga para mamães'
    },
    {
      val: 'Grupo Kids',
      det: 'Yoga infantil'
    }
  ];

  return `
    <div class="opcoes-grid">
      ${opts.map(o => `
        <button 
          class="opcao-btn ${S.grupoTipo === o.val ? 'selected' : ''}" 
          onclick="pick('grupoTipo','${o.val}',this)"
        >
          <div class="opcao-info">
            <div class="opcao-nome">${o.val}</div>
            <div class="opcao-detalhe">${o.det}</div>
          </div>
        </button>
      `).join('')}
    </div>
  `;
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
        <p style="font-size:12px;color:var(--texto-muted);margin-bottom:1.25rem;line-height:1.6;">Para grupos, o valor é combinado conforme o número de participantes e a modalidade.</p>
        <div class="opcoes-grid opcoes-grid-2">
          ${opcoes.map(o => `
            <button class="opcao-btn ${S.pessoas === o.val ? 'selected' : ''}" onclick="pick('pessoas','${o.val}',this)">
              <div class="opcao-info">
                <div class="opcao-nome">${o.val}</div>
                <div class="opcao-detalhe">${o.det}</div>
              </div>
            </button>`).join('')}
        </div>`;
}

function renderHorario() {
  const isPilates = S.atividade === 'Pilates';
  document.getElementById('stepTitle').innerHTML = isPilates
    ? 'Escolha seu<br><em>horário preferido.</em>'
    : 'Quando você<br><em>prefere praticar?</em>';

  if (isPilates) {
    const botoesHtml = PILATES_HORARIOS.map(h => {
      const lotado = horariosLotados.includes(h);
      const isListaEspera = S.horario === `Lista de espera — ${h}`;
      const isSelected = S.horario === h;

      if (lotado) {
        // Só mostra lista de espera, sem o botão lotado
        return `<button class="horario-btn avise-me ${isListaEspera ? 'selected' : ''}" onclick="selecionarHorarioEspera(this,'${h}')">
              ${h} · Lista de espera
            </button>`;
      }
      // Horário disponível: só o botão normal
      return `<button class="horario-btn ${isSelected ? 'selected' : ''}" onclick="selecionarHorarioDisp(this,'${h}')">${h}</button>`;
    }).join('');

    return `
          <p style="font-size:13px;color:var(--texto-muted);margin-bottom:1.25rem;line-height:1.6;">Aulas de <strong style="color:var(--verde)">50 minutos</strong> · Quarta-feira e Sexta-feira</p>
          <div class="horarios-grid">${botoesHtml}</div>
          ${S.listaEspera ? `<p style="margin-top:1rem;font-size:12px;color:var(--roxo);background:var(--roxo-bg);padding:10px 14px;border-radius:10px;">✓ Você será avisada assim que uma vaga abrir no horário das ${S.horario.replace('Lista de espera — ', '')}</p>` : ''}`;
  } else {
    const prefs = ['🌅 Manhã (8h–12h)', '☀️ Tarde (12h–17h)', '🌙 Noite (17h–20h)', '🗓️ Flexível'];
    return `
          <p style="font-size:13px;color:var(--texto-muted);margin-bottom:1.25rem;line-height:1.6;">Aulas personalizadas. Combinamos o melhor horário para você!</p>
          <div class="horarios-grid">
            ${prefs.map(p => `<button class="horario-btn ${S.horario === p ? 'selected' : ''}" onclick="selecionarHorarioDisp(this,'${p}')">${p}</button>`).join('')}
          </div>`;
  }
}

function renderPlano() {
  document.getElementById('stepTitle').innerHTML = 'Qual modalidade<br><em>te interessa?</em>';
  if (S.atividade === 'Pilates') {
    const tabs = ['mensal', 'trimestral', 'semestral'];
    const tabsHtml = `<div style="display:flex;gap:0;margin-bottom:1.25rem;border:0.5px solid rgba(107,94,168,0.2);border-radius:12px;overflow:hidden;width:fit-content;">
      ${tabs.map(t => `<button style="padding:8px 18px;font-size:11px;font-weight:500;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border:none;background:${S.periodoAtivo === t ? 'var(--roxo)' : 'transparent'};color:${S.periodoAtivo === t ? '#fff' : 'var(--texto-muted)'};font-family:var(--font-body);transition:all 0.2s;" onclick="mudarPeriodo('${t}',this)">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join('')}
    </div>`;
    const itens = planosPilates[S.periodoAtivo].map((p) => {
      const popular = p.freq === '2x/semana';
      const sel = S.plano === `${p.freq} ${S.periodoAtivo} — ${p.preco}`;
      return `<div class="plano-opcao ${sel ? 'selected' : ''}" onclick="selecionarPlano(this,'${p.freq} ${S.periodoAtivo} — ${p.preco}')">
        <div class="plano-opcao-check">✓</div>
        <div class="plano-opcao-info"><div class="plano-opcao-nome">${p.freq}</div><div class="plano-opcao-detalhe">Plano ${S.periodoAtivo}</div></div>
        <div class="plano-opcao-preco">${p.preco}</div>
        ${popular ? '<div class="plano-popular-badge">Popular</div>' : ''}
      </div>`;
    }).join('');
    return tabsHtml + `<div class="plano-opcoes">${itens}</div>`;
  } else {
    const isCasal = isGrupo();
    const yogaPlanos = isCasal ? [
      { nome: 'Grupo · Yoga Tradicional', det: 'Valor combinado com a professora' },
      { nome: 'Grupo · Gestantes',        det: 'Valor combinado com a professora' },
      { nome: 'Grupo · Kids',             det: 'Valor combinado com a professora' },
    ] : [
      { nome: 'Yoga Tradicional', det: 'Valor combinado com a professora' },
      { nome: 'Yoga Gestantes',   det: 'Valor combinado com a professora' },
      { nome: 'Yoga Kids',        det: 'Valor combinado com a professora' },
    ];
    return yogaPlanos.map(p => {
      const sel = S.plano === p.nome;
      return `<div class="plano-opcao ${sel ? 'selected' : ''}" onclick="selecionarPlano(this,'${p.nome}')">
        <div class="plano-opcao-check">✓</div>
        <div class="plano-opcao-info">
          <div class="plano-opcao-nome">${p.nome}</div>
          <div class="plano-opcao-detalhe">${p.det}</div>
        </div>
      </div>`;
    }).join('');
  }
}
function renderDados() {
  document.getElementById('stepTitle').innerHTML = 'Quase lá!<br><em>Seus dados.</em>';
  const atividadeDisplay = S.atividade === 'Yoga' ? (S.subAtividade || 'Yoga') : S.atividade;
  const resumo = `<strong>Atividade:</strong> ${atividadeDisplay} &nbsp;·&nbsp; <strong>Pessoas:</strong> ${S.pessoas} &nbsp;·&nbsp; <strong>Horário:</strong> ${S.horario} &nbsp;·&nbsp; <strong>Plano:</strong> ${S.plano}`;
  return `
        <div class="dados-resumo" style="margin-bottom:1.25rem;">${resumo}</div>
        <div class="dados-form">
          <div class="dados-input-group">
            <label>Seu nome</label>
            <input type="text" id="dadosNome" placeholder="Como prefere ser chamada?" value="${S.nome || ''}">
          </div>
          <div class="dados-input-group">
            <label>WhatsApp</label>
            <input type="tel" id="dadosTel" placeholder="(21) 99999-9999" value="${S.tel || ''}">
          </div>
          <div class="dados-input-group">
            <label>E-mail <span style="font-size:9px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--texto-muted)">(opcional)</span></label>
            <input type="email" id="dadosEmail" placeholder="seu@email.com" value="${S.email || ''}">
          </div>
          <div class="dados-input-group">
            <label>Observações <span style="font-size:9px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--texto-muted)">(opcional)</span></label>
            <textarea id="dadosObs" placeholder="Lesões, preferências, dúvidas...">${S.obs || ''}</textarea>
          </div>
        </div>`;
}

// ── FOOTER ──
function renderFooter(logicStep) {
  const footer = document.getElementById('agendarFooter');
  const backBtn = S.step > 1 ? `<button class="btn-agendar-back" onclick="voltarStep()">← Voltar</button>` : '';
  const isDados = logicStep === 'dados';

  if (!isDados) {
    footer.innerHTML = backBtn + `<button class="btn-agendar-next" id="btnNext" onclick="avancarStep()" ${podeAvancar() ? '' : 'disabled'}>Continuar →</button>`;
  } else {
    footer.innerHTML = `
          ${backBtn}
          <a class="btn-whatsapp" href="javascript:void(0)" onclick="enviarWhatsApp()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            WhatsApp
          </a>`;
  }
}

function podeAvancar() {
  const logicStep = getLogicStep();
  if (logicStep === 'atividade') return !!S.atividade;
  if (logicStep === 'subatividade') return !!S.subAtividade;
  if (logicStep === 'grupo') return !!S.grupoTipo;
  if (logicStep === 'pessoas') return !!S.pessoas;
  if (logicStep === 'horario') return !!S.horario;
  if (logicStep === 'plano') return !!S.plano;
  return true;
}

// ── PICKERS ──
function pick(campo, valor, btn) {
  if (campo === 'atividade') {
    S.atividade = valor;
    S.subAtividade = ''; S.pessoas = ''; S.horario = ''; S.plano = ''; S.listaEspera = false;
  } else if (campo === 'subAtividade') {
    S.subAtividade = valor;
    S.pessoas = ''; S.horario = ''; S.plano = ''; S.listaEspera = false;
  } else {
    S[campo] = valor;
  }
  renderStep();
}

function selecionarHorarioDisp(btn, valor) {
  S.horario = valor; S.listaEspera = false;
  renderStep();
}

function selecionarHorarioEspera(btn, horario) {
  S.horario = `Lista de espera — ${horario}`; S.listaEspera = true;
  renderStep();
}

function selecionarPlano(el, nome) {
  S.plano = nome;
  renderStep();
}

function mudarPeriodo(periodo, btn) {
  S.periodoAtivo = periodo;
  S.plano = '';
  renderStep();
}

function avancarStep() {
  if (!podeAvancar()) return;
  // Salvar dados se estiver no step dados antes de avançar (não aplicável aqui)
  S.step++;
  renderStep();
}

function voltarStep() {
  S.step--;
  renderStep();
}

// ── ENVIO ──
function coletarDados() {
  S.nome = document.getElementById('dadosNome')?.value || '';
  S.tel = document.getElementById('dadosTel')?.value || '';
  S.email = document.getElementById('dadosEmail')?.value || '';
  S.obs = document.getElementById('dadosObs')?.value || '';
}

function montarMensagem() {
  coletarDados();
  const atividadeDisplay = S.atividade === 'Yoga' ? (S.subAtividade || 'Yoga') : S.atividade;
  const pessoasLinha = S.pessoas ? `*Pessoas no grupo:* ${S.pessoas}\n` : '';
  const planoLinha = S.plano ? `*Plano desejado:* ${S.plano}\n` : '';
  return `Olá! Tenho interesse em agendar uma aula no Studios Prana 🌿\n\n` +
    `*Nome:* ${S.nome || 'Não informado'}\n` +
    `*Atividade:* ${atividadeDisplay}\n` +
    pessoasLinha +
    `*Horário preferido:* ${S.horario}${S.listaEspera ? ' (lista de espera)' : ''}\n` +
    planoLinha +
    `*WhatsApp:* ${S.tel || 'Não informado'}\n` +
    (S.email ? `*E-mail:* ${S.email}\n` : '') +
    (S.obs ? `*Observações:* ${S.obs}\n` : '') +
    `\nAguardo retorno! 🙏`;
}

function enviarWhatsApp() {
  const msg = montarMensagem();
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── AVISO EVENTOS ──
function enviarAvisoEvento() {
  const email = document.getElementById('eventosEmailInput')?.value?.trim();
  if (!email || !email.includes('@')) {
    document.getElementById('eventosEmailInput').style.borderColor = '#E07A5F';
    return;
  }
  const msg = `Olá! Quero ser avisada sobre eventos e retiros do Studios Prana 🌿\n\nMeu e-mail: ${email}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  document.getElementById('eventosEmailForm').style.display = 'none';
  document.getElementById('eventosEmailOk').style.display = 'flex';
}

function loginProfessora() {

  const email =
    document.querySelector('.login-modal input[type="email"]').value;

  const senha =
    document.querySelector('.login-modal input[type="password"]').value;

  // LOGIN TEMPORÁRIO
  if (email === 'gmail@prana.com' && senha === '123456') {

    alert('Login realizado com sucesso 🌿');

    document.getElementById('loginOverlay')
      .classList.remove('open');

    // REDIRECIONAMENTO
    window.location.href = 'painel.html';

  } else {

    alert('E-mail ou senha incorretos');

  }
}