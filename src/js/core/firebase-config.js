// ===== CONFIGURAÇÃO DO FIREBASE =====
// Configuração do projeto Firebase (inpacto) - REALTIME DATABASE

const firebaseConfig = {
  apiKey: "AIzaSyAE8sXb5mZvq-t4j3VummmsI0_iyvPlQA",
  authDomain: "inpacto-9e38c.firebaseapp.com",
  databaseURL: "https://inpacto-9e38c-default-rtdb.firebaseio.com",
  projectId: "inpacto-9e38c",
  storageBucket: "inpacto-9e38c.firebasestorage.app",
  messagingSenderId: "225840938291",
  appId: "1:225840938291:web:b5ff5219effaa0an857fe5",
  measurementId: "G-7Q5W0PEZZ"
};

// Inicializa o Firebase com tratamento de erro
let database = null;
let firebaseDisponivel = false;

try {
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  firebaseDisponivel = true;
  
  console.log('🔥 Firebase Realtime Database inicializado com sucesso!');
  
  // Monitora conexão e atualiza badge visual
  database.ref('.info/connected').on('value', (snapshot) => {
    const conectado = snapshot.val() === true;
    console.log(conectado ? '✅ Conectado ao Realtime Database!' : '⚠️ Desconectado do Realtime Database');

    const badge = document.getElementById('syncStatusBadge');
    const dot   = document.getElementById('syncDot');
    const label = document.getElementById('syncLabel');
    if (!badge) return;

    if (conectado) {
      badge.style.background = '#e8f5e9';
      badge.style.color      = '#2e7d32';
      badge.style.border     = '1px solid #a5d6a7';
      dot.style.background   = '#4caf50';
      label.textContent      = 'Sincronizado com a nuvem';
    } else {
      badge.style.background = '#fff3e0';
      badge.style.color      = '#e65100';
      badge.style.border     = '1px solid #ffcc80';
      dot.style.background   = '#ff9800';
      label.textContent      = 'Sem conexão – dados salvos localmente';
    }
  });
    
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  console.warn('📝 Sistema continuará funcionando com localStorage');
  firebaseDisponivel = false;
}

// ===== FUNÇÕES AUXILIARES =====

// Fila de retry para saves que falharam
let _filaRetryFirebase = [];
const _MAX_RETRIES = 5;
let _retryInterval = null;

function _agendarRetry(caminho, dados) {
  _filaRetryFirebase.push({ caminho, dados, tentativas: 0 });
  if (!_retryInterval) {
    _retryInterval = setInterval(_processarRetryFila, 5000);
  }
}

async function _processarRetryFila() {
  if (_filaRetryFirebase.length === 0 || !database) {
    if (_retryInterval) { clearInterval(_retryInterval); _retryInterval = null; }
    return;
  }
  const item = _filaRetryFirebase.shift();
  try {
    await database.ref(item.caminho).set(item.dados);
    console.log(`✅ Retry: dados salvos em ${item.caminho}`);
  } catch (e) {
    item.tentativas++;
    if (item.tentativas < _MAX_RETRIES) {
      _filaRetryFirebase.push(item);
    } else {
      console.error(`❌ Falha após ${_MAX_RETRIES} tentativas em ${item.caminho}`);
    }
  }
}

// Salva dados no Realtime Database (com retry automático em caso de falha)
async function salvarNoDatabase(caminho, dados) {
  try {
    if (!firebaseDisponivel || !database) {
      console.warn('⚠️ Firebase não disponível. Salvando apenas localmente.');
      return null;
    }
    
    await database.ref(caminho).set(dados);
    console.log(`✅ Dados salvos em: ${caminho}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar em ${caminho}:`, error);
    _agendarRetry(caminho, dados);
    return null;
  }
}

// Atualiza dados no Realtime Database (merge)
async function atualizarNoDatabase(caminho, dados) {
  try {
    if (!firebaseDisponivel || !database) {
      console.warn('⚠️ Firebase não disponível. Salvando apenas localmente.');
      return null;
    }
    
    await database.ref(caminho).update(dados);
    console.log(`✅ Dados atualizados em: ${caminho}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar em ${caminho}:`, error);
    console.warn('📝 Dados salvos apenas localmente');
    return null;
  }
}

// Busca dados do Realtime Database
async function buscarDoDatabase(caminho) {
  try {
    if (!firebaseDisponivel || !database) {
      console.warn('⚠️ Firebase não disponível.');
      return null;
    }
    
    const snapshot = await database.ref(caminho).once('value');
    const dados = snapshot.val();
    
    if (dados) {
      console.log(`✅ Dados obtidos de: ${caminho}`);
      return dados;
    }
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar de ${caminho}:`, error);
    return null;
  }
}

// Deleta dados do Realtime Database
async function deletarDoDatabase(caminho) {
  try {
    if (!firebaseDisponivel || !database) {
      console.warn('⚠️ Firebase não disponível.');
      return null;
    }
    
    await database.ref(caminho).remove();
    console.log(`✅ Dados deletados de: ${caminho}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao deletar de ${caminho}:`, error);
    return null;
  }
}

// Salva arquivo como base64 (já que não temos Storage)
async function salvarArquivoBase64(caminho, base64String) {
  try {
    if (!firebaseDisponivel || !database) {
      console.warn('⚠️ Firebase não disponível. Arquivo não salvo na nuvem.');
      return null;
    }
    
    // Salva o base64 diretamente no database
    await database.ref(caminho).set(base64String);
    console.log(`✅ Arquivo salvo em: ${caminho}`);
    return caminho;
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error);
    return null;
  }
}

// Busca arquivo base64
async function buscarArquivoBase64(caminho) {
  try {
    if (!firebaseDisponivel || !database) {
      return null;
    }
    
    const snapshot = await database.ref(caminho).once('value');
    return snapshot.val();
  } catch (error) {
    console.error('❌ Erro ao buscar arquivo:', error);
    return null;
  }
}

// ===== SINCRONIZAÇÃO BIDIRECIONAL =====

// Flag global para evitar loop: quando recebendo do Firebase, não salva de volta
window._fbReceivendo = false;

// Debounce de UI: evita re-render constante quando dois dispositivos estão abertos
const _fbDebounceTimers = {};
const _fbDebounceMs = 150;
function _fbDebouncedUI(tipo, fn) {
  if (_fbDebounceTimers[tipo]) clearTimeout(_fbDebounceTimers[tipo]);
  _fbDebounceTimers[tipo] = setTimeout(() => {
    delete _fbDebounceTimers[tipo];
    if (typeof fn === 'function') fn();
  }, _fbDebounceMs);
}

// Listener para sincronizar dados em tempo real
function iniciarSincronizacaoTempoReal() {
  if (!firebaseDisponivel || !database) {
    console.warn('⚠️ Firebase não disponível para sincronização');
    return;
  }

  console.log('🔄 Iniciando sincronização em tempo real...');

  // ── Notas Fiscais ──────────────────────────────────────────────
  database.ref('dados/notasFiscais').on('value', (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
      // Firebase vazio → sobe dados locais se existirem
      const localStr = localStorage.getItem('notasFiscais');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          const temDados = (local.igrejas && local.igrejas.length > 0) || (local.arquivadas && local.arquivadas.length > 0);
          if (temDados) {
            if (!local._ts) local._ts = Date.now();
            salvarNoDatabase('dados/notasFiscais', local);
            console.log('📤 NF local enviada para Firebase (primeiro upload)');
          }
        } catch (e) { /* ignora erro de parse */ }
      }
      return;
    }

    window._fbReceivendo = true;
    try {
      // PROTEÇÃO: só aceita Firebase se for mais recente; nunca sobrescreve se local tem mais dados
      const localStr = localStorage.getItem('notasFiscais');
      let localParsed = null;
      try { localParsed = localStr ? JSON.parse(localStr) : null; } catch (_) {}
      const localTs = localParsed ? (localParsed._ts || 0) : 0;
      const remoteTs = dados._ts || 0;
      const mesmoDado = remoteTs === localTs && remoteTs > 0;
      // Proteção extra: se NF foi salvo localmente nos últimos 30s, sempre protege local
      const nfSalvouHaPouco = window._nfSalvouTs && (Date.now() - window._nfSalvouTs < 30000);
      if (!mesmoDado && (nfSalvouHaPouco || remoteTs < localTs) && localStr) {
        console.log('🛡️ NF: protegendo dados locais, enviando para Firebase' + (nfSalvouHaPouco ? ' (salvo há pouco)' : ''));
        try {
          const local = localParsed || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/notasFiscais', local);
        } catch (e) { /* ignora */ }
      } else {
        localStorage.setItem('notasFiscais', JSON.stringify(dados));
        if (typeof nfData !== 'undefined') {
          nfData.igrejas    = Array.isArray(dados.igrejas)    ? dados.igrejas    : [];
          nfData.arquivadas = Array.isArray(dados.arquivadas) ? dados.arquivadas : [];
          nfData.especiais  = Array.isArray(dados.especiais)  ? dados.especiais  : [];
          nfData._ts        = dados._ts || 0;
        }
        if (!mesmoDado) {
          _fbDebouncedUI('notasFiscais', () => {
            const el = document.getElementById('notasFiscais');
            if (el && el.classList.contains('active') && typeof atualizarListaNF === 'function') atualizarListaNF();
          });
          console.log('🔄 Notas Fiscais atualizadas do Firebase');
        }
      }
    } finally {
      window._fbReceivendo = false;
    }
  });

  // ── Materiais ──────────────────────────────────────────────────
  database.ref('dados/materiais').on('value', (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
      // Firebase vazio → sobe dados locais se existirem
      const localStr = localStorage.getItem('materiaisIgrejas');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          const temDados = (local.pendentes && local.pendentes.length > 0) ||
                           (local.enviadas && local.enviadas.length > 0) ||
                           (local.pedidosSandro && local.pedidosSandro.length > 0);
          if (temDados) {
            if (!local._ts) local._ts = Date.now();
            salvarNoDatabase('dados/materiais', local);
            console.log('📤 Material local enviado para Firebase (primeiro upload)');
          }
        } catch (e) { /* ignora */ }
      }
      return;
    }

    window._fbReceivendo = true;
    try {
      const localStr = localStorage.getItem('materiaisIgrejas');
      let localMat = null;
      try { localMat = localStr ? JSON.parse(localStr) : null; } catch (_) {}
      const localTs = localMat ? (localMat._ts || 0) : 0;
      const remoteTs = dados._ts || 0;
      const mesmoMat = remoteTs === localTs && remoteTs > 0;
      if (!mesmoMat && (remoteTs < localTs) && localStr) {
        console.log('🛡️ Material: protegendo dados locais, enviando para Firebase');
        try {
          const local = localMat || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/materiais', local);
        } catch (e) { /* ignora */ }
      } else {
        localStorage.setItem('materiaisIgrejas', JSON.stringify(dados));
        if (typeof materialData !== 'undefined') {
          materialData.pendentes     = Array.isArray(dados.pendentes)     ? dados.pendentes     : [];
          materialData.enviadas      = Array.isArray(dados.enviadas)      ? dados.enviadas      : [];
          materialData.pedidosSandro = Array.isArray(dados.pedidosSandro) ? dados.pedidosSandro : [];
          materialData._ts           = dados._ts || 0;
        }
        if (!mesmoMat) {
          _fbDebouncedUI('materiais', () => {
            const el = document.getElementById('material');
            if (el && el.classList.contains('active') && typeof atualizarListaMaterial === 'function') atualizarListaMaterial();
          });
          console.log('🔄 Materiais atualizados do Firebase');
        }
      }
    } finally {
      window._fbReceivendo = false;
    }
  });

  // ── Estoque ─────────────────────────────────────────────────────
  database.ref('dados/estoque').on('value', (snapshot) => {
    const dados = snapshot.val();
    if (!dados) {
      const localStr = localStorage.getItem('estoqueData');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          if (local.itens && local.itens.length > 0) {
            if (!local._ts) local._ts = Date.now();
            salvarNoDatabase('dados/estoque', local);
            console.log('📤 Estoque local enviado para Firebase (primeiro upload)');
          }
        } catch (e) { /* ignora */ }
      }
      return;
    }
    window._estoqueCarregando = true;
    try {
      const localStr = localStorage.getItem('estoqueData');
      let localEst = null;
      try { localEst = localStr ? JSON.parse(localStr) : null; } catch (_) {}
      const localTs = localEst ? (localEst._ts || 0) : 0;
      const remoteTs = dados._ts || 0;
      const mesmoEst = remoteTs === localTs && remoteTs > 0;
      if (!mesmoEst && remoteTs < localTs && localStr) {
        console.log('🛡️ Estoque: protegendo dados locais, enviando para Firebase');
        try {
          const local = localEst || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/estoque', local);
        } catch (e) { /* ignora */ }
      } else {
        if (typeof estoqueData !== 'undefined') {
          estoqueData.itens = Array.isArray(dados.itens) ? dados.itens : [];
          if (typeof window._ordenarItensEstoque === 'function') {
            window._ordenarItensEstoque();
          }
        }
        const dadosParaSalvar = { ...dados, itens: estoqueData?.itens || dados.itens || [] };
        localStorage.setItem('estoqueData', JSON.stringify(dadosParaSalvar));
        _fbDebouncedUI('estoque', () => {
          const content = document.getElementById('estoque');
          if (content && content.classList.contains('active') && typeof window.renderizarAbaEstoque === 'function') {
            window.renderizarAbaEstoque();
          }
        });
        console.log('🔄 Estoque atualizado do Firebase');
      }
    } finally {
      window._estoqueCarregando = false;
    }
  });

  // ── Pagamento ──────────────────────────────────────────────────
  // IMPORTANTE: NÃO usa window._fbReceivendo (flag global que bloqueia saves de NF/Material/Checklist)
  // O módulo de Pagamento tem seu próprio controle via _pagCarregando + cooldown _pagSalvandoTs
  database.ref('dados/pagamento').on('value', (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
      // Firebase vazio → sobe dados locais se existirem
      const localStr = localStorage.getItem('pagamentoData');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          const temDados = (local.igrejasArquivadas && local.igrejasArquivadas.length > 0) ||
                           Object.keys(local.igrejasSelecionadas || {}).length > 0 ||
                           (local.itensExtras && local.itensExtras.length > 0);
          if (temDados) {
            if (!local._ts) local._ts = Date.now();
            salvarNoDatabase('dados/pagamento', local);
            console.log('📤 Pagamento local enviado para Firebase (primeiro upload)');
          }
        } catch (e) { /* ignora */ }
      }
      return;
    }

    const localStr = localStorage.getItem('pagamentoData');
    let localPag = null;
    try { localPag = localStr ? JSON.parse(localStr) : null; } catch (_) {}
    const localTs = localPag ? (localPag._ts || 0) : 0;
    const remoteTs = dados._ts || 0;
    const mesmoPag = remoteTs === localTs && remoteTs > 0;
    if (!mesmoPag && remoteTs < localTs && localStr) {
      console.log('🛡️ Pagamento: protegendo dados locais, enviando para Firebase');
      try {
        const local = localPag || JSON.parse(localStr);
        if (!local._ts) local._ts = Date.now();
        salvarNoDatabase('dados/pagamento', local);
      } catch (e) { /* ignora */ }
    } else if (!mesmoPag && typeof window._aplicarDadosFirebasePagamento === 'function') {
      // Só aplica quando o dado do Firebase é genuinamente diferente (ts diferente)
      _fbDebouncedUI('pagamento', () => window._aplicarDadosFirebasePagamento(dados));
      console.log('🔄 Pagamento atualizado do Firebase');
    }
  });

  // ── Valores por tipo de igreja (config) ─────────────────────────
  database.ref('dados/valoresIgreja').on('value', (snapshot) => {
    const dados = snapshot.val();
    if (!dados) {
      const localStr = localStorage.getItem('configValoresIgreja');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          salvarNoDatabase('dados/valoresIgreja', { ...local, _ts: Date.now() });
          console.log('📤 Valores igreja enviados para Firebase');
        } catch (e) { /* ignora */ }
      }
      return;
    }
    const { _ts, ...valores } = dados;
    if (valores && Object.keys(valores).length > 0) {
      try {
        // Preserva _ts no localStorage para que o sync periódico e o forcarSync
        // consigam detectar que estes dados já foram enviados e evitem re-envio.
        localStorage.setItem('configValoresIgreja', JSON.stringify(dados));
        if (_ts) window._fbMarcarEnviado && window._fbMarcarEnviado('configValoresIgreja', _ts);
        _fbDebouncedUI('valores', () => { if (typeof carregarConfigValores === 'function') carregarConfigValores(); });
        console.log('🔄 Valores igreja atualizados do Firebase');
      } catch (e) { /* ignora */ }
    }
  });

  // ── Checklists ─────────────────────────────────────────────────
  database.ref('dados/checklists').on('value', (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
      // Firebase vazio → sobe dados locais completos (com assinaturas)
      const localStr = localStorage.getItem('checklistsIgrejas');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          if ((local.igrejas && local.igrejas.length > 0) || (local.pedidosSandro && local.pedidosSandro.length > 0)) {
            // Restaura assinaturas do storage separado antes de subir
            const mapaAss = JSON.parse(localStorage.getItem('checklistAssinaturas') || '{}');
            [...(local.igrejas || []), ...(local.pedidosSandro || [])].forEach(ig => {
              const key = (ig.nome || '') + '_' + (ig.id || '');
              if (mapaAss[key]) { if (!ig.checklist) ig.checklist = {}; ig.checklist.assinatura = mapaAss[key]; }
            });
            if (!local._ts) local._ts = Date.now();
            salvarNoDatabase('dados/checklists', local);
            console.log('📤 Checklist local enviado para Firebase (com assinaturas)');
          }
        } catch (e) { /* ignora */ }
      }
      return;
    }

    window._fbReceivendo = true;
    try {
      const localStr = localStorage.getItem('checklistsIgrejas');
      let localChk = null;
      try { localChk = localStr ? JSON.parse(localStr) : null; } catch (_) {}
      const localTs = localChk ? (localChk._ts || 0) : 0;
      const remoteTs = dados._ts || 0;
      const mesmoChk = remoteTs === localTs && remoteTs > 0;
      if (!mesmoChk && remoteTs < localTs && localStr) {
        console.log('🛡️ Checklist: protegendo dados locais, enviando para Firebase');
        try {
          const local = localChk || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/checklists', local);
        } catch (e) { /* ignora */ }
      } else {
        if (typeof window._restaurarAssinaturas === 'function') {
          window._restaurarAssinaturas([...(dados.igrejas || []), ...(dados.pedidosSandro || [])]);
        }
        try {
          const mapaAtual = JSON.parse(localStorage.getItem('checklistAssinaturas') || '{}');
          let atualizou = false;
          [...(dados.igrejas || []), ...(dados.pedidosSandro || [])].forEach(ig => {
            if (ig.checklist && ig.checklist.assinatura) {
              const key = (ig.nome || '') + '_' + (ig.id || '');
              mapaAtual[key] = ig.checklist.assinatura;
              atualizou = true;
            }
          });
          if (atualizou) localStorage.setItem('checklistAssinaturas', JSON.stringify(mapaAtual));
        } catch (_) {}
        localStorage.setItem('checklistsIgrejas', JSON.stringify(dados));
        if (typeof checklistData !== 'undefined') {
          checklistData.igrejas = Array.isArray(dados.igrejas) ? dados.igrejas : [];
          checklistData.pedidosSandro = Array.isArray(dados.pedidosSandro) ? dados.pedidosSandro : [];
          checklistData._ts = dados._ts || 0;
        }
        if (!mesmoChk) {
          _fbDebouncedUI('checklists', () => {
            const el = document.getElementById('checklist');
            if (el && el.classList.contains('active') && typeof atualizarListaChecklist === 'function') atualizarListaChecklist();
          });
          console.log('🔄 Checklists atualizados do Firebase');
        }
      }
    } finally {
      window._fbReceivendo = false;
    }
  });

  // ── Relatórios ───────────────────────────────────────────────────
  database.ref('dados/relatorios').on('value', (snapshot) => {
    const dados = snapshot.val();
    if (!dados) {
      const localStr = localStorage.getItem('relatoriosData');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          const temDados = (local.pendentes && local.pendentes.length > 0) ||
            (local.gerados && local.gerados.length > 0) ||
            (local.pedidosSandro && local.pedidosSandro.length > 0);
          if (temDados) {
            if (!local._ts) local._ts = Date.now();
            salvarNoDatabase('dados/relatorios', local);
            console.log('📤 Relatórios locais enviados para Firebase (primeiro upload)');
          }
        } catch (e) { /* ignora */ }
      }
      return;
    }
    window._fbReceivendo = true;
    try {
      const localStr = localStorage.getItem('relatoriosData');
      let localRel = null;
      try { localRel = localStr ? JSON.parse(localStr) : null; } catch (_) {}
      const localTs = localRel ? (localRel._ts || 0) : 0;
      const remoteTs = dados._ts || 0;
      const mesmoRel = remoteTs === localTs && remoteTs > 0;
      if (!mesmoRel && remoteTs < localTs && localStr) {
        console.log('🛡️ Relatórios: protegendo dados locais, enviando para Firebase');
        try {
          const local = localRel || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/relatorios', local);
        } catch (e) { /* ignora */ }
      } else {
        localStorage.setItem('relatoriosData', JSON.stringify(dados));
        if (typeof relatoriosData !== 'undefined') {
          relatoriosData.pendentes = Array.isArray(dados.pendentes) ? dados.pendentes : [];
          relatoriosData.gerados = Array.isArray(dados.gerados) ? dados.gerados : [];
          relatoriosData.pedidosSandro = Array.isArray(dados.pedidosSandro) ? dados.pedidosSandro : [];
          relatoriosData._ts = dados._ts || 0;
        }
        if (!mesmoRel) {
          _fbDebouncedUI('relatorios', () => {
            const el = document.getElementById('relatorioTecnico');
            if (el && el.classList.contains('active') && typeof atualizarListaRelatoriosNovo === 'function') atualizarListaRelatoriosNovo();
          });
          console.log('🔄 Relatórios atualizados do Firebase');
        }
      }
    } finally {
      window._fbReceivendo = false;
    }
  });
}

// Auto-inicia a sincronização assim que o Firebase conecta
database && database.ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === true && !window._syncIniciado) {
    window._syncIniciado = true;
    iniciarSincronizacaoTempoReal();
  }
});

// Rastreia o último _ts enviado ao Firebase por chave de localStorage.
// Exposto em window para que os managers possam marcar após saves imediatos,
// evitando que o sync periódico de 15s reenvie dados já confirmados.
const _ultimoTsEnviado = {};
window._fbMarcarEnviado = function(lsKey, ts) {
  _ultimoTsEnviado[lsKey] = ts || 0;
};

function _tsLocal(chave) {
  try {
    const raw = localStorage.getItem(chave);
    if (!raw) return 0;
    const d = JSON.parse(raw);
    return d._ts || 0;
  } catch (_) { return 0; }
}

// Sync periódico automático — só envia paths cujo _ts mudou desde o último envio.
setInterval(() => {
  if (typeof window._resetSyncArc === 'function') window._resetSyncArc();
  if (!firebaseDisponivel || !database || document.visibilityState === 'hidden') return;

  const mapa = {
    'notasFiscais':      'dados/notasFiscais',
    'materiaisIgrejas':  'dados/materiais',
    'checklistsIgrejas': 'dados/checklists',
    'estoqueData':       'dados/estoque',
    'pagamentoData':     'dados/pagamento',
    'configValoresIgreja': 'dados/valoresIgreja',
    'relatoriosData':    'dados/relatorios',
  };

  let algumEnviado = false;
  for (const [lsKey, fbPath] of Object.entries(mapa)) {
    const ts = _tsLocal(lsKey);
    if (ts && ts !== _ultimoTsEnviado[lsKey]) {
      try {
        const d = JSON.parse(localStorage.getItem(lsKey));
        salvarNoDatabase(fbPath, d);
        _ultimoTsEnviado[lsKey] = ts;
        algumEnviado = true;
      } catch (_) {}
    }
  }
  if (algumEnviado) console.log('📤 Sync periódico: apenas dados alterados enviados ao Firebase');
}, 15000); // a cada 15 segundos

// Utilitário: pisca o badge indicando "salvando"
function _piscarBadgeSync() {
  const label = document.getElementById('syncLabel');
  const dot   = document.getElementById('syncDot');
  const badge = document.getElementById('syncStatusBadge');
  if (!badge || !firebaseDisponivel) return;
  const orig = label ? label.textContent : '';
  if (label) label.textContent = 'Salvando na nuvem…';
  if (dot)   dot.style.background = '#1565c0';
  if (badge) { badge.style.background = '#e3f2fd'; badge.style.color = '#1565c0'; badge.style.border = '1px solid #90caf9'; }
  if (typeof window._syncArcSalvando === 'function') window._syncArcSalvando();
  setTimeout(() => {
    if (label) label.textContent    = orig || 'Sincronizado com a nuvem';
    if (dot)   dot.style.background = '#4caf50';
    if (badge) { badge.style.background = '#e8f5e9'; badge.style.color = '#2e7d32'; badge.style.border = '1px solid #a5d6a7'; }
    if (typeof window._syncArcConcluido === 'function') window._syncArcConcluido();
  }, 1800);
}
window._piscarBadgeSync = _piscarBadgeSync;

// Força envio de TODOS os dados locais para o Firebase e aguarda confirmação.
// Ao ser chamado manualmente (forcarAgora=true), atribui um timestamp NOVO a cada
// dataset para garantir que este snapshot "vença" qualquer versão antiga em outros
// dispositivos, e renova as janelas de proteção dos listeners.
async function forcarSyncParaFirebase(forcarAgora = false) {
  if (!firebaseDisponivel || !database) return;
  try {
    const saves = [];
    // Timestamp único para todo o sync — garante que vence qualquer dispositivo parado
    const tsAgora = forcarAgora ? Date.now() : null;

    function prepararDado(raw) {
      const d = JSON.parse(raw);
      if (forcarAgora) d._ts = tsAgora;
      return d;
    }

    // helper: prepara dado, enfileira save e registra ts enviado
    function enviar(lsKey, fbPath, extraFn) {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return;
      try {
        const d = prepararDado(raw);
        // Se não for forçado, pula caminhos cujo _ts não mudou desde o último envio confirmado
        if (!forcarAgora && d._ts && d._ts === _ultimoTsEnviado[lsKey]) return;
        if (forcarAgora) localStorage.setItem(lsKey, JSON.stringify(d));
        if (extraFn) extraFn(d);
        saves.push(salvarNoDatabase(fbPath, d).then(() => {
          _ultimoTsEnviado[lsKey] = d._ts || 0;
        }));
      } catch (_) {}
    }

    enviar('notasFiscais', 'dados/notasFiscais', d => {
      if (forcarAgora) { window._nfSalvouTs = tsAgora; }
    });
    enviar('materiaisIgrejas', 'dados/materiais', d => {
      if (forcarAgora) { window._materialSalvouTs = tsAgora; }
    });
    enviar('checklistsIgrejas', 'dados/checklists');
    enviar('estoqueData',       'dados/estoque');
    enviar('pagamentoData',     'dados/pagamento');
    enviar('configValoresIgreja', 'dados/valoresIgreja');
    enviar('relatoriosData',    'dados/relatorios');

    await Promise.all(saves);
    console.log('📤 Sync forçado: todos os dados CONFIRMADOS no Firebase' + (forcarAgora ? ' (timestamp renovado)' : ''));
  } catch (e) { console.error('Erro ao forçar sync:', e); }
}
window.forcarSyncParaFirebase = forcarSyncParaFirebase;

// Ao fechar aba ou trocar de aba: garante que dados locais sejam enviados ao Firebase
let _fbVisibilitySyncTimer = null;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (_fbVisibilitySyncTimer) clearTimeout(_fbVisibilitySyncTimer);
    _fbVisibilitySyncTimer = setTimeout(() => {
      _fbVisibilitySyncTimer = null;
      forcarSyncParaFirebase();
    }, 200);
  } else {
    if (_fbVisibilitySyncTimer) { clearTimeout(_fbVisibilitySyncTimer); _fbVisibilitySyncTimer = null; }
  }
});
window.addEventListener('pagehide', () => forcarSyncParaFirebase());

// Expõe funções globalmente
window.firebaseDB = {
  salvar: salvarNoDatabase,
  atualizar: atualizarNoDatabase,
  buscar: buscarDoDatabase,
  deletar: deletarDoDatabase,
  salvarArquivo: salvarArquivoBase64,
  buscarArquivo: buscarArquivoBase64,
  iniciarSync: iniciarSincronizacaoTempoReal,
  forcarSync: forcarSyncParaFirebase,
  disponivel: () => firebaseDisponivel
};

console.log('✅ Firebase Realtime Database Config carregado e pronto!');
