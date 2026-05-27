// ===== BACKUP MANAGER =====
// Gerencia backup e restauração de todos os dados do sistema

const BACKUP_VERSION = 1;
const BACKUP_KEYS = [
  'notasFiscais',
  'materiaisIgrejas',
  'checklistsIgrejas',
  'checklistAssinaturas',
  'estoqueData',
  'pagamentoData',
  'configValoresIgreja',
  'relatoriosData',
  'pagamento_arquivadas',
  'logosAppIgreja'
];

/**
 * Gera backup completo de todos os dados e dispara download do arquivo JSON
 */
function executarBackupCompleto() {
  try {
    // Garante que dados em memória sejam salvos no localStorage antes do backup
    if (typeof window.salvarDadosNF === 'function') window.salvarDadosNF();
    if (typeof window.salvarDadosMaterial === 'function') window.salvarDadosMaterial();
    if (typeof window.salvarDadosChecklist === 'function') window.salvarDadosChecklist();
    if (typeof window.salvarDadosEstoque === 'function') window.salvarDadosEstoque();
    if (typeof window.salvarDadosPagamento === 'function') window.salvarDadosPagamento();
    if (typeof window.salvarDadosRelatorios === 'function') window.salvarDadosRelatorios();
  } catch (e) {
    console.warn('Erro ao salvar dados antes do backup:', e);
  }

  try {
    const backup = {
      _versao: BACKUP_VERSION,
      _data: new Date().toISOString(),
      _ts: Date.now()
    };

    for (const key of BACKUP_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          backup[key] = JSON.parse(raw);
        } catch (_) {
          backup[key] = raw;
        }
      }
    }

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const nome = `backup-impacto-${new Date().toISOString().slice(0, 10)}.json`;

    if (typeof saveAs !== 'undefined') {
      saveAs(blob, nome);
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nome;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    console.log('✅ Backup gerado com sucesso:', nome);
    if (typeof alert === 'function') {
      alert('Backup baixado com sucesso!');
    }
  } catch (e) {
    console.error('Erro ao gerar backup:', e);
    if (typeof alert === 'function') {
      alert('Erro ao gerar backup: ' + (e.message || 'Erro desconhecido'));
    }
  }
}

/**
 * Restaura backup a partir de JSON e envia para o Firebase
 * @param {HTMLInputElement} input - Input de arquivo
 */
function restaurarDoBackup(input) {
  if (!input || !input.files || !input.files[0]) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    try {
      const json = JSON.parse(reader.result);
      if (!json || typeof json !== 'object') {
        throw new Error('Arquivo inválido');
      }

      const keys = Object.keys(json).filter(k => !k.startsWith('_'));
      if (keys.length === 0) {
        throw new Error('Arquivo de backup vazio ou sem dados reconhecidos');
      }

      for (const key of keys) {
        if (!BACKUP_KEYS.includes(key)) continue;
        const val = json[key];
        if (val !== undefined && val !== null) {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        }
      }

      // Atualiza variáveis globais e recarrega dados da UI
      if (typeof window.carregarDadosNF === 'function') window.carregarDadosNF();
      if (typeof window.carregarDadosMaterial === 'function') window.carregarDadosMaterial();
      if (typeof window.carregarDadosChecklist === 'function') window.carregarDadosChecklist();
      if (typeof window.carregarDadosEstoque === 'function') window.carregarDadosEstoque();
      if (typeof window.carregarDadosPagamento === 'function') window.carregarDadosPagamento();
      if (typeof window.carregarDadosRelatorios === 'function') window.carregarDadosRelatorios();

      // Envia para o Firebase
      if (typeof window.forcarSyncParaFirebase === 'function') {
        window.forcarSyncParaFirebase();
      }

      // Atualiza listas e abas
      if (typeof window.atualizarListaNF === 'function') window.atualizarListaNF();
      if (typeof window.atualizarListaMaterial === 'function') window.atualizarListaMaterial();
      if (typeof window.atualizarListaChecklist === 'function') window.atualizarListaChecklist();
      if (typeof window.atualizarListaEstoque === 'function') window.atualizarListaEstoque();
      if (typeof window.atualizarListaPagamento === 'function') window.atualizarListaPagamento();
      if (typeof window.carregarConfigValores === 'function') window.carregarConfigValores();
      if (typeof window.atualizarListaRelatoriosNovo === 'function') window.atualizarListaRelatoriosNovo();

      // Restaura logos em memória e atualiza UI
      const logos = json.logosAppIgreja;
      if (logos && typeof logos === 'object' && typeof window.logosBase64 === 'object') {
        Object.assign(window.logosBase64, logos);
        if (typeof window.exibirLogosCarregadas === 'function') window.exibirLogosCarregadas();
      }

      console.log('✅ Backup restaurado com sucesso');
      if (typeof alert === 'function') {
        alert('Backup restaurado com sucesso! Os dados foram salvos localmente e enviados para o Firebase.');
      }

      // Atualiza abas visíveis
      if (typeof window.mostrarAba === 'function') {
        const btnAtivo = document.querySelector('.tab-button.active');
        const abaAtiva = btnAtivo?.getAttribute('data-tab');
        if (abaAtiva) window.mostrarAba(abaAtiva);
      }
    } catch (e) {
      console.error('Erro ao restaurar backup:', e);
      if (typeof alert === 'function') {
        alert('Erro ao restaurar backup: ' + (e.message || 'Arquivo inválido ou corrompido'));
      }
    } finally {
      input.value = '';
    }
  };

  reader.onerror = function () {
    if (typeof alert === 'function') alert('Erro ao ler o arquivo');
    input.value = '';
  };

  reader.readAsText(file, 'UTF-8');
}

window.executarBackupCompleto = executarBackupCompleto;
window.restaurarDoBackup = restaurarDoBackup;
