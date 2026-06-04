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

// ===== NOTIFICAÇÕES DO NAVEGADOR =====

// Números ativos na lista remota (ignora tombstones)
function _pedidosNumerosAtivos(lista, deletados) {
  const set = new Set();
  (lista || []).forEach(p => {
    const num = String((typeof p === 'object' ? p.numero : p) || '').trim().toLowerCase();
    if (!num) return;
    const delTs = (deletados && (deletados[num] || deletados[p.numero])) || 0;
    if (delTs && (p._ts || 0) <= delTs) return;
    set.add(num);
  });
  return set;
}

// Compara snapshot remoto ANTERIOR vs ATUAL (não depende do local — funciona em Opera/Chrome)
function _pedidosDetectarNovosSnapshot(listaRemota, delRemoto) {
  const prev = window._pedidosSnapNumeros;
  if (!prev) return [];
  const novos = [];
  (listaRemota || []).forEach(p => {
    const num = String((typeof p === 'object' ? p.numero : p) || '').trim().toLowerCase();
    if (!num || prev.has(num)) return;
    const delTs = (delRemoto && (delRemoto[num] || delRemoto[p.numero])) || 0;
    if (delTs && (p._ts || 0) <= delTs) return;
    novos.push(p);
  });
  return novos;
}

function _pedidosAtualizarSnapshotRemoto(listaRemota, delRemoto) {
  window._pedidosSnapNumeros = _pedidosNumerosAtivos(listaRemota, delRemoto);
}

// Atualiza snapshot com lista local (evita notificar o próprio aparelho que salvou)
window._pedidosSyncSnapshotLocal = function(lista) {
  const arr = lista || (typeof pedidosPendentes !== 'undefined' ? pedidosPendentes : []);
  window._pedidosSnapNumeros = new Set(
    arr.map(p => String((typeof p === 'object' ? p.numero : p) || '').trim().toLowerCase()).filter(Boolean)
  );
};

// Banner na tela + notificação do sistema
function _bannerNovoPedido(pedido) {
  const num = (typeof pedido === 'object' ? pedido.numero : pedido) || '?';
  const tipo = (typeof pedido === 'object' && pedido.tipo) || 'nome';
  const valor = (typeof pedido === 'object' && pedido.valor) ? pedido.valor : '';
  const detalhe = tipo === 'orcamento' ? `Orçamento · R$ ${valor || '—'}` : 'Passar nome';
  let el = document.getElementById('alertaNovoPedido');
  if (!el) {
    el = document.createElement('div');
    el.id = 'alertaNovoPedido';
    el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:10001;' +
      'max-width:360px;width:calc(100% - 24px);background:#1a237e;color:#fff;padding:14px 18px;' +
      'border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,0.35);display:flex;align-items:center;gap:12px;' +
      'animation:slideDown 0.35s ease;font-size:14px;';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div style="flex:1;"><strong>📋 Novo pedido pendente</strong><br><span style="opacity:0.9">${num} · ${detalhe}</span></div>` +
    `<button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;">OK</button>`;
  clearTimeout(window._alertaPedidoTimer);
  window._alertaPedidoTimer = setTimeout(() => { if (el.parentElement) el.remove(); }, 12000);
}

window._alertarNovoPedido = function(pedido) {
  _bannerNovoPedido(pedido);
  _notificarPedido(pedido);
};

// Envia notificação via service worker (funciona em segundo plano no celular)
function _notificarPedido(pedido) {
  if (!('Notification' in window)) {
    console.warn('🔔 Notificações não suportadas neste navegador');
    return;
  }
  if (Notification.permission !== 'granted') {
    console.warn('🔔 Permissão de notificação não concedida:', Notification.permission);
    return;
  }
  const num   = (typeof pedido === 'object' ? pedido.numero : pedido) || '?';
  const tipo  = (typeof pedido === 'object' && pedido.tipo) || 'nome';
  const valor = (typeof pedido === 'object' && pedido.valor) ? pedido.valor : null;
  const detalhe = tipo === 'orcamento' ? `Orçamento · R$ ${valor || '—'}` : 'Passar nome';
  const body  = `${num} · ${detalhe}`;
  const iconUrl = (location.origin || '') + '/impacto/icon-192.png';
  const title = '📋 Novo Pedido Pendente';
  const tag = 'pedido-' + String(num).replace(/\s/g, '_');

  const mostrarViaSw = (reg) => {
    if (!reg) {
      new Notification(title, { body, icon: iconUrl, tag });
      return;
    }
    if (reg.showNotification) {
      reg.showNotification(title, {
        body, icon: iconUrl, badge: iconUrl, tag, renotify: true, vibrate: [200, 100, 200],
      }).catch(err => {
        console.warn('🔔 showNotification falhou, tentando postMessage:', err);
        _notificarPedidoViaPostMessage(reg, title, body, tag);
      });
    } else {
      _notificarPedidoViaPostMessage(reg, title, body, tag);
    }
  };

  function _notificarPedidoViaPostMessage(reg, title, body, tag) {
    const sw = reg.active || reg.waiting || reg.installing || navigator.serviceWorker.controller;
    if (sw) {
      sw.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
    } else {
      new Notification(title, { body, icon: iconUrl, tag });
    }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(mostrarViaSw)
      .catch(err => {
        console.warn('🔔 SW não pronto:', err);
        new Notification(title, { body, icon: iconUrl, tag });
      });
  } else {
    new Notification(title, { body, icon: iconUrl, tag });
  }
  console.log('🔔 Notificação enviada:', num);
}
window._notificarPedido = _notificarPedido;

// Atualiza o texto do status nas Configurações
window._atualizarStatusNotificacoesUI = function() {
  const el = document.getElementById('notifStatusLabel');
  const btn = document.getElementById('btnAtivarNotificacoes');
  if (!el) return;
  if (!('Notification' in window)) {
    el.textContent = 'Não suportado neste navegador';
    el.style.color = '#c62828';
    if (btn) btn.disabled = true;
    return;
  }
  const p = Notification.permission;
  if (p === 'granted') {
    el.textContent = '✅ Ativadas — você receberá avisos de novos pedidos';
    el.style.color = '#2e7d32';
    if (btn) { btn.textContent = 'Testar notificação'; btn.disabled = false; }
  } else if (p === 'denied') {
    el.textContent = '❌ Bloqueadas — libere nas configurações do Chrome (ícone de cadeado na barra de endereço → Notificações)';
    el.style.color = '#c62828';
    if (btn) { btn.textContent = 'Como liberar'; btn.disabled = false; }
  } else {
    el.textContent = 'Desativadas — toque no botão para ativar';
    el.style.color = '#e65100';
    if (btn) { btn.textContent = 'Ativar notificações'; btn.disabled = false; }
  }
};

// Ativa ou testa notificações (botão nas Configurações)
window._ativarNotificacoesApp = async function() {
  if (!('Notification' in window)) {
    alert('Seu navegador não suporta notificações.');
    return;
  }
  if (Notification.permission === 'denied') {
    alert('As notificações foram bloqueadas.\n\n1. Toque no cadeado ou ⋮ na barra de endereço\n2. Configurações do site → Notificações → Permitir\n3. Volte ao app e toque em "Ativar" de novo\n\nNo Opera: Configurações → Sites → Notificações → permitir este site.');
    return;
  }
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    window._atualizarStatusNotificacoesUI();
    if (perm !== 'granted') {
      alert(perm === 'denied' ? 'Permissão negada. Você pode liberar depois nas configurações do site.' : 'Permissão não concedida.');
      return;
    }
  }
  // Garante que o service worker está ativo (necessário para notificar em segundo plano)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const iconUrl = (location.origin || '') + '/impacto/icon-192.png';
      await reg.showNotification('🔔 Impacto', {
        body: 'Notificações ativadas! Você será avisado quando houver novo pedido pendente.',
        icon: iconUrl,
        badge: iconUrl,
        tag: 'impacto-teste',
      });
    } catch (e) {
      new Notification('🔔 Impacto', { body: 'Notificações ativadas!', icon: '/impacto/icon-192.png' });
    }
  }
  window._atualizarStatusNotificacoesUI();
};

window._solicitarPermissaoNotificacoes = function() {
  window._ativarNotificacoesApp();
};

// ===== SINCRONIZAÇÃO BIDIRECIONAL =====

// Flag global para evitar loop: quando recebendo do Firebase, não salva de volta
window._fbReceivendo = false;

// Debounce de UI: evita re-render constante quando dois dispositivos estão abertos
const _fbDebounceTimers = {};
const _fbDebounceMs = 300;
function _fbDebouncedUI(tipo, fn) {
  if (_fbDebounceTimers[tipo]) clearTimeout(_fbDebounceTimers[tipo]);
  _fbDebounceTimers[tipo] = setTimeout(() => {
    delete _fbDebounceTimers[tipo];
    if (typeof fn === 'function') fn();
  }, _fbDebounceMs);
}

// Guarda interna para evitar listener duplo
let _sincronizacaoIniciada = false;

// Listener para sincronizar dados em tempo real
function iniciarSincronizacaoTempoReal() {
  if (_sincronizacaoIniciada) {
    console.log('ℹ️ Sincronização já iniciada, ignorando chamada duplicada.');
    return;
  }
  if (!firebaseDisponivel || !database) {
    console.warn('⚠️ Firebase não disponível para sincronização');
    return;
  }
  _sincronizacaoIniciada = true;

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
            // Sempre atualiza a lista de NF quando dados chegam do Firebase
            if (typeof atualizarListaNF === 'function') atualizarListaNF();
            // Também atualiza módulos que dependem de nfData
            if (typeof sincronizarIgrejasNF === 'function') sincronizarIgrejasNF();
            if (typeof sincronizarIgrejasChecklistNF === 'function') sincronizarIgrejasChecklistNF();
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

      // Proteção "salvo há pouco" — igual ao NF
      const matSalvouHaPouco = window._materialSalvouTs && (Date.now() - window._materialSalvouTs < 30000);

      // Proteção de regressão: conta total de igrejas em cada lado
      const totalRemoto = (dados.pendentes||[]).length + (dados.enviadas||[]).length + (dados.pedidosSandro||[]).length;
      const totalLocal  = localMat ? ((localMat.pendentes||[]).length + (localMat.enviadas||[]).length + (localMat.pedidosSandro||[]).length) : 0;
      const remoteRegride = totalRemoto < totalLocal && totalLocal > 0;

      if (!mesmoMat && (matSalvouHaPouco || remoteTs < localTs || remoteRegride) && localStr) {
        console.log('🛡️ Material: protegendo dados locais, enviando para Firebase' +
          (matSalvouHaPouco ? ' (salvo há pouco)' : '') +
          (remoteRegride ? ` (local tem ${totalLocal} igrejas, remoto tem ${totalRemoto})` : ''));
        try {
          const local = localMat || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/materiais', local);
        } catch (e) { /* ignora */ }
      } else if (!remoteRegride) {
        localStorage.setItem('materiaisIgrejas', JSON.stringify(dados));
        if (typeof materialData !== 'undefined') {
          materialData.pendentes     = Array.isArray(dados.pendentes)     ? dados.pendentes     : [];
          materialData.enviadas      = Array.isArray(dados.enviadas)      ? dados.enviadas      : [];
          materialData.pedidosSandro = Array.isArray(dados.pedidosSandro) ? dados.pedidosSandro : [];
          materialData._ts           = dados._ts || 0;
        }
        if (!mesmoMat) {
          _fbDebouncedUI('materiais', () => {
            if (typeof atualizarListaMaterial === 'function') atualizarListaMaterial();
          });
          console.log('🔄 Materiais atualizados do Firebase');
        }
      } else {
        console.warn('⚠️ Material Firebase ignorado: regressão de dados detectada (remoto regrediria de', totalLocal, 'para', totalRemoto, 'igrejas)');
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

      // Proteção "salvo há pouco"
      const chkSalvouHaPouco = window._checklistSalvouTs && (Date.now() - window._checklistSalvouTs < 30000);

      // Proteção de regressão: compara total de igrejas
      const totalRemotoChk = (dados.igrejas||[]).length + (dados.pedidosSandro||[]).length;
      const totalLocalChk  = localChk ? ((localChk.igrejas||[]).length + (localChk.pedidosSandro||[]).length) : 0;
      const chkRegride = totalRemotoChk < totalLocalChk && totalLocalChk > 0;

      if (!mesmoChk && (chkSalvouHaPouco || remoteTs < localTs || chkRegride) && localStr) {
        console.log('🛡️ Checklist: protegendo dados locais, enviando para Firebase' +
          (chkSalvouHaPouco ? ' (salvo há pouco)' : '') +
          (chkRegride ? ` (local tem ${totalLocalChk}, remoto tem ${totalRemotoChk})` : ''));
        try {
          const local = localChk || JSON.parse(localStr);
          if (!local._ts) local._ts = Date.now();
          salvarNoDatabase('dados/checklists', local);
        } catch (e) { /* ignora */ }
      } else if (!chkRegride) {
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
      } else {
        console.warn('⚠️ Checklist Firebase ignorado: regressão de dados detectada (remoto regrediria de', totalLocalChk, 'para', totalRemotoChk, 'igrejas)');
      }
    } finally {
      window._fbReceivendo = false;
    }
  });

  // ── Prévia de Materiais ──────────────────────────────────────────
  database.ref('dados/previaMateriais').on('value', (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
      const localStr = localStorage.getItem('previaMateriais');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          const payload = (local && local._ts) ? local : { dados: local, _ts: Date.now() };
          salvarNoDatabase('dados/previaMateriais', payload);
          console.log('📤 Prévia local enviada para Firebase');
        } catch (e) { /* ignora */ }
      }
      return;
    }

    window._fbReceivendo = true;
    try {
      const localStr = localStorage.getItem('previaMateriais');
      let localPrev = null;
      try { localPrev = localStr ? JSON.parse(localStr) : null; } catch (_) {}
      const localTs = localPrev ? (localPrev._ts || 0) : 0;
      const remoteTs = dados._ts || 0;
      const mesmoPrev = remoteTs === localTs && remoteTs > 0;
      const prevSalvouHaPouco = window._previaSalvouTs && (Date.now() - window._previaSalvouTs < 30000);

      if (!mesmoPrev && (prevSalvouHaPouco || remoteTs < localTs) && localStr) {
        console.log('🛡️ Prévia: protegendo dados locais, enviando para Firebase');
        try {
          const payload = (localPrev && localPrev._ts) ? localPrev : { dados: localPrev, _ts: Date.now() };
          salvarNoDatabase('dados/previaMateriais', payload);
        } catch (e) { /* ignora */ }
      } else if (!mesmoPrev) {
        localStorage.setItem('previaMateriais', JSON.stringify(dados));
        _fbDebouncedUI('previaMateriais', () => {
          if (typeof carregarPreviaMateriais === 'function') carregarPreviaMateriais();
          if (typeof _mostrarListaPrevia === 'function') _mostrarListaPrevia();
        });
        console.log('🔄 Prévia atualizada do Firebase');
      }
    } finally {
      window._fbReceivendo = false;
    }
  });

  // ── Pedidos Pendentes ─────────────────────────────────────────────
  // Merge por item — NUNCA reescreve o Firebase se os dados já são iguais
  // (evita loop de sync que travava Android com vários dispositivos abertos)
  database.ref('dados/pedidosPendentes').on('value', (snapshot) => {
    const remoto = snapshot.val();

    function _hashPedidos(lista, deletados) {
      const norm = (lista || []).map(p => ({
        n: (typeof p === 'object' ? p.numero : p) || '',
        t: (typeof p === 'object' && p.tipo) || 'nome',
        v: (typeof p === 'object' && p.valor) || '',
        ts: (typeof p === 'object' && p._ts) || 0
      })).sort((a, b) => a.n.localeCompare(b.n));
      return JSON.stringify({ lista: norm, del: deletados || {} });
    }

    if (!remoto) {
      const localStr = localStorage.getItem('pedidosPendentes');
      if (localStr) {
        try {
          const local = JSON.parse(localStr);
          const lista = Array.isArray(local) ? local : (local.lista || []);
          if (lista.length > 0) {
            const payload = Array.isArray(local)
              ? { lista: local, _deletados: {}, _ts: Date.now() }
              : { ...local, _ts: local._ts || Date.now() };
            salvarNoDatabase('dados/pedidosPendentes', payload);
            console.log('📤 Pedidos pendentes locais enviados para Firebase');
          }
        } catch (e) { /* ignora */ }
      }
      return;
    }

    const listaRemota = Array.isArray(remoto.lista) ? remoto.lista : [];
    const delRemoto   = remoto._deletados || {};

    // Detecta novos ANTES de merge (compara snapshot remoto anterior → atual)
    const novosSnapshot = _pedidosDetectarNovosSnapshot(listaRemota, delRemoto);

    const ecoLocal = window._pedidosSalvouTs && (Date.now() - window._pedidosSalvouTs < 4000);
    if (ecoLocal && remoto._ts && remoto._ts === window._pedidosSalvouTs) {
      _pedidosAtualizarSnapshotRemoto(listaRemota, delRemoto);
      return;
    }

    window._fbReceivendo = true;
    try {
      const localStr = localStorage.getItem('pedidosPendentes');
      let localPed = null;
      try { localPed = localStr ? JSON.parse(localStr) : null; } catch (_) {}

      const listaLocal  = localPed ? (Array.isArray(localPed) ? localPed : (localPed.lista || [])) : [];
      const delLocal    = (localPed && !Array.isArray(localPed)) ? (localPed._deletados || {}) : {};

      const hashAntes   = _hashPedidos(listaLocal, delLocal);
      const hashRemoto  = _hashPedidos(listaRemota, delRemoto);

      if (hashAntes === hashRemoto) {
        if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('pedidosPendentes', remoto._ts || 0);
      } else {
        const merged = typeof window._mesclarPedidos === 'function'
          ? window._mesclarPedidos(listaLocal, delLocal, listaRemota, delRemoto)
          : { lista: listaRemota, _deletados: delRemoto };

        const hashMerged = _hashPedidos(merged.lista, merged._deletados);
        const mudouLocal = hashMerged !== hashAntes;
        const precisaSubir = hashMerged !== hashRemoto;

        if (mudouLocal || precisaSubir) {
          const novoTs = precisaSubir ? Date.now() : (remoto._ts || Date.now());
          const payload = { lista: merged.lista, _deletados: merged._deletados, _ts: novoTs };

          if (typeof pedidosPendentes !== 'undefined') {
            pedidosPendentes.length = 0;
            merged.lista.forEach(p => pedidosPendentes.push(p));
          }
          if (typeof _deletadosPedidos !== 'undefined') {
            Object.keys(_deletadosPedidos).forEach(k => delete _deletadosPedidos[k]);
            Object.assign(_deletadosPedidos, merged._deletados);
          }

          localStorage.setItem('pedidosPendentes', JSON.stringify(payload));

          if (precisaSubir && !ecoLocal) {
            salvarNoDatabase('dados/pedidosPendentes', payload)
              .then(() => { if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('pedidosPendentes', payload._ts); })
              .catch(() => {});
          } else if (typeof window._fbMarcarEnviado === 'function') {
            window._fbMarcarEnviado('pedidosPendentes', remoto._ts || 0);
          }

          if (mudouLocal) {
            _fbDebouncedUI('pedidosPendentes', () => {
              if (typeof renderizarPedidosPendentes === 'function') renderizarPedidosPendentes();
            });
          }
          console.log('🔄 Pedidos:', merged.lista.length, 'itens', precisaSubir ? '(sync)' : '(local)');
        }
      }
    } finally {
      window._fbReceivendo = false;
      _pedidosAtualizarSnapshotRemoto(listaRemota, delRemoto);
      if (novosSnapshot.length > 0) {
        console.log('🔔 Novo(s) pedido(s):', novosSnapshot.map(p => p.numero).join(', '));
        novosSnapshot.forEach(p => window._alertarNovoPedido(p));
      }
    }
  });

  // Backup a cada 12s: Opera pode não disparar o listener em tempo real
  setInterval(() => {
    if (!firebaseDisponivel || !database || document.visibilityState === 'hidden') return;
    if (!window._pedidosSnapNumeros) return;
    database.ref('dados/pedidosPendentes').once('value').then(snap => {
      const remoto = snap.val();
      if (!remoto) return;
      const listaRemota = Array.isArray(remoto.lista) ? remoto.lista : [];
      const delRemoto = remoto._deletados || {};
      const novos = _pedidosDetectarNovosSnapshot(listaRemota, delRemoto);
      _pedidosAtualizarSnapshotRemoto(listaRemota, delRemoto);
      if (novos.length === 0) return;
      console.log('🔔 [poll] Novo(s) pedido(s):', novos.map(p => p.numero).join(', '));
      novos.forEach(p => window._alertarNovoPedido(p));
      try {
        if (typeof window._mesclarPedidos === 'function') {
          const raw = localStorage.getItem('pedidosPendentes');
          const localPed = raw ? JSON.parse(raw) : {};
          const listaLocal = Array.isArray(localPed) ? localPed : (localPed.lista || []);
          const delLocal = localPed._deletados || {};
          const merged = window._mesclarPedidos(listaLocal, delLocal, listaRemota, delRemoto);
          const payload = { lista: merged.lista, _deletados: merged._deletados, _ts: remoto._ts || Date.now() };
          localStorage.setItem('pedidosPendentes', JSON.stringify(payload));
          if (typeof pedidosPendentes !== 'undefined') {
            pedidosPendentes.length = 0;
            merged.lista.forEach(p => pedidosPendentes.push(p));
          }
          if (typeof renderizarPedidosPendentes === 'function') renderizarPedidosPendentes();
        }
      } catch (_) {}
    }).catch(() => {});
  }, 12000);

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
    'pedidosPendentes':  'dados/pedidosPendentes',
    'previaMateriais':   'dados/previaMateriais',
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

// Garante que a sincronização inicie automaticamente assim que o DOM estiver pronto,
// independentemente de erros em outros scripts
document.addEventListener('DOMContentLoaded', () => {
  if (firebaseDisponivel && !_sincronizacaoIniciada) {
    iniciarSincronizacaoTempoReal();
    window._syncIniciado = true;
    console.log('🔄 Sync Firebase iniciado automaticamente pelo firebase-config.js');
  }
});
