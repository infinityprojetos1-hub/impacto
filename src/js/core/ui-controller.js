// Funções para controle da interface do usuário

// Índice da igreja em edição na lista (null = modo adicionar)
let _indiceEdicaoIgreja = null;

function atualizarRotuloBotaoAdicionarIgreja() {
    const btn = document.getElementById('adicionarIgreja');
    if (!btn) return;
    if (_indiceEdicaoIgreja !== null) {
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar alterações';
    } else {
        btn.innerHTML = '<i class="fas fa-plus-circle"></i> Adicionar Igreja';
    }
}

// Controle de tabs com animação do fundo roxo
function inicializarTabs() {
    const tabsContainer = document.querySelector('.tabs');
    const isMobile = window.innerWidth <= 768;
    let rafPending = false;

    // Função para atualizar a posição do fundo roxo animado
    function updateTabIndicator(activeTab) {
        if (isMobile) return; // Não usar indicador animado no mobile (performance)
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            const tabRect = activeTab.getBoundingClientRect();
            const containerRect = tabsContainer.getBoundingClientRect();
            const left = tabRect.left - containerRect.left + tabsContainer.scrollLeft;
            const width = tabRect.width;
            const height = tabRect.height;
            tabsContainer.style.setProperty('--tab-indicator-left', `${left}px`);
            tabsContainer.style.setProperty('--tab-indicator-width', `${width}px`);
            tabsContainer.style.setProperty('--tab-indicator-height', `${height}px`);
        });
    }

    // Inicializa indicador
    const activeTabInit = document.querySelector('.tab-button.active');
    if (activeTabInit) {
        updateTabIndicator(activeTabInit);
    }

    document.querySelectorAll('.tab-button').forEach(tab => {
        // touch-action:manipulation diz ao browser que este elemento responde a tap, não a scroll
        tab.style.touchAction = 'manipulation';

        function ativarAba() {
            document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            updateTabIndicator(tab);

            const tabId = tab.getAttribute('data-tab');
            const allContents = document.querySelectorAll('.tab-content');
            allContents.forEach(content => content.classList.remove('active'));
            const content = document.getElementById(tabId);
            if (content) content.classList.add('active');

            if (tabId === 'pagamento' && typeof window.renderizarAbaPagamento === 'function') {
                setTimeout(window.renderizarAbaPagamento, 80);
            }
            if (tabId === 'estoque' && typeof window.renderizarAbaEstoque === 'function') {
                setTimeout(window.renderizarAbaEstoque, 80);
            }
            if (tabId === 'notasFiscais' && typeof window.atualizarListaNF === 'function') {
                setTimeout(window.atualizarListaNF, 50);
            }
            if (tabId === 'checklist' && typeof window.sincronizarIgrejasChecklistNF === 'function') {
                setTimeout(() => {
                    window.sincronizarIgrejasChecklistNF();
                    if (typeof window.atualizarListaChecklist === 'function') window.atualizarListaChecklist();
                }, 80);
            }
            if (tabId === 'previaMaterial' && typeof window.renderizarAbaPrevia === 'function') {
                setTimeout(window.renderizarAbaPrevia, 80);
            }

            if (window.innerWidth <= 768) {
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
            }
        }

        // Flag para evitar duplo disparo touchend + click no mobile
        let _touchHandled = false;
        let _touchStartX = 0;
        let _touchStartY = 0;

        tab.addEventListener('touchstart', (e) => {
            _touchStartX = e.touches[0].clientX;
            _touchStartY = e.touches[0].clientY;
            _touchHandled = false;
        }, { passive: true });

        tab.addEventListener('touchend', (e) => {
            const dx = Math.abs(e.changedTouches[0].clientX - _touchStartX);
            const dy = Math.abs(e.changedTouches[0].clientY - _touchStartY);
            if (dx < 15 && dy < 15) {
                _touchHandled = true;
                ativarAba();
                // Limpa flag após o click sintético do browser (que deve ser ignorado)
                setTimeout(() => { _touchHandled = false; }, 500);
            }
        }, { passive: true });

        // Click só ativa se não foi tratado pelo touchend (desktop ou touch sem touchend)
        tab.addEventListener('click', () => {
            if (_touchHandled) return;
            ativarAba();
        });
    });

    // Atualiza ao redimensionar (debounced)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const active = document.querySelector('.tab-button.active');
            if (active) updateTabIndicator(active);
        }, 150);
    }, { passive: true });

    // Inicializa a posição do fundo
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        setTimeout(() => updateTabIndicator(activeTab), 100);
    }
}

// Salvar configurações
function inicializarConfigForm() {
    document.getElementById('salvarConfig').addEventListener('click', () => {
        // Obtém a lista de serviços do textarea e filtra as linhas vazias
        const servicosTexto = document.getElementById('servicos').value;
        const servicosLista = servicosTexto.split('\n').filter(s => s.trim() !== '');

        // Se houver menos de 10 itens, usa a lista predefinida como fallback
        if (servicosLista.length < 10) {
            console.warn("A lista de serviços tem menos de 10 itens. Usando lista predefinida.");
            configuracao.servicos = [
                "Confecção de cabeamento de microfone",
                "Confecção de cabeamento de periféricos de som",
                "Confecção de Cabos para instrumentos e Mics",
                "Instalação de cabeamento de caixas de som",
                "Manutenção de cabos de som",
                "Manutenção do periférico",
                "Manutenção e intstalação do Sistema do Projeção",
                "Reposicionamento das caixas de PA",
                "Reposicionamento das caixas de retorno",
                "Reposicionamento dos microfones sem fio"
            ];
        } else {
            configuracao.servicos = servicosLista;
        }

        configuracao.valorMinimo = parseFloat(document.getElementById('valorMinimo').value);
        configuracao.valorMaximo = parseFloat(document.getElementById('valorMaximo').value);
        configuracao.margemConcorrente1 = parseFloat(document.getElementById('margemConcorrente1').value);
        configuracao.margemConcorrente2 = parseFloat(document.getElementById('margemConcorrente2').value);
        configuracao.suaEmpresa1 = document.getElementById('suaEmpresa1').value;
        configuracao.suaEmpresa2 = document.getElementById('suaEmpresa2').value;
        configuracao.concorrente1 = document.getElementById('concorrente1').value;
        configuracao.concorrente2 = document.getElementById('concorrente2').value;

        alert('Configurações salvas com sucesso!');

        // Muda para a próxima tab
        document.querySelector('[data-tab="gerarOrcamentos"]').click();
    });
}

// Adicionar igreja à lista
function inicializarGerenciamentoIgrejas() {
    document.getElementById('adicionarIgreja').addEventListener('click', () => {
        const nomeIgreja = document.getElementById('nomeIgreja').value.trim();
        const idIgreja = document.getElementById('idIgreja').value.trim();
        const linkIgreja = document.getElementById('linkIgreja').value.trim();
        const codigoIgreja = document.getElementById('codigoIgreja').value.trim();
        const empresaSelecionada = document.getElementById('empresaSelecionada').value;
        const tipoValorOrcamento = document.getElementById('tipoValorOrcamento').value;
        const valorManual = parseFloat(document.getElementById('valorManual').value);
        const tipoIgreja = document.getElementById('tipoIgreja').value;
        const tipoTexto = (document.getElementById('tipoTexto') && document.getElementById('tipoTexto').value) || 'padrao';
        const tipoPedido = (document.getElementById('tipoPedido') && document.getElementById('tipoPedido').value) || 'padrao';

        if (!nomeIgreja || !idIgreja) {
            alert('Por favor, preencha pelo menos o nome e o ID da igreja.');
            return;
        }

        // Validação obrigatória dos campos tipoValorOrcamento e tipoIgreja
        if (!tipoValorOrcamento) {
            alert('Por favor, selecione o Tipo de Valor do Orçamento.');
            return;
        }
        if (!tipoIgreja) {
            alert('Por favor, selecione o Tipo de igreja.');
            return;
        }

        // Captura textos personalizados (quando tipoTexto = 'personalizado')
        const txtSua = (document.getElementById('textoOrcamentoSuaEmpresa') && document.getElementById('textoOrcamentoSuaEmpresa').value) || '';
        const txtConc = (document.getElementById('textoOrcamentoConcorrente') && document.getElementById('textoOrcamentoConcorrente').value) || '';

        // Verifica se deve usar texto personalizado
        const usarTextoPersonalizado = tipoTexto === 'personalizado';

        // Adiciona ou atualiza na lista de igrejas
        const igreja = {
            nome: nomeIgreja,
            id: idIgreja,
            link: linkIgreja,
            codigo: codigoIgreja,
            empresa: empresaSelecionada,
            tipoValorOrcamento: tipoValorOrcamento,
            valorManual: tipoValorOrcamento === 'manual' && !isNaN(valorManual) ? valorManual : null,
            tipoIgreja: tipoIgreja,
            tipoTexto: tipoTexto,
            textoSuaEmpresa: usarTextoPersonalizado ? txtSua : '',
            textoConcorrente: usarTextoPersonalizado ? txtConc : '',
            tipoPedido: tipoPedido
        };

        if (_indiceEdicaoIgreja !== null && _indiceEdicaoIgreja >= 0 && _indiceEdicaoIgreja < igrejasAdicionadas.length) {
            igrejasAdicionadas[_indiceEdicaoIgreja] = igreja;
            _indiceEdicaoIgreja = null;
        } else {
            igrejasAdicionadas.push(igreja);
        }

        atualizarRotuloBotaoAdicionarIgreja();

        // Atualiza a interface
        atualizarListaIgrejas();

        // Resetar campos de texto personalizado para a próxima igreja
        try {
            const chk = document.getElementById('usarTextoPersonalizadoOrcamento');
            const bloco = document.getElementById('blocoTextoOrcamento');
            const txtSua = document.getElementById('textoOrcamentoSuaEmpresa');
            const txtConc = document.getElementById('textoOrcamentoConcorrente');
            if (chk) chk.checked = false;
            if (bloco) bloco.style.display = 'none';
            if (txtSua) txtSua.value = '';
            if (txtConc) txtConc.value = '';
        } catch (_) { }

        // Limpa os campos do formulário
        document.getElementById('nomeIgreja').value = '';
        document.getElementById('idIgreja').value = '';
        document.getElementById('linkIgreja').value = '';
        document.getElementById('codigoIgreja').value = '';
        document.getElementById('tipoValorOrcamento').selectedIndex = 0;
        document.getElementById('tipoIgreja').selectedIndex = 0;
        document.getElementById('tipoTexto').selectedIndex = 0;
        if (document.getElementById('tipoPedido')) document.getElementById('tipoPedido').value = 'padrao';
        const grupoValorManual = document.getElementById('grupoValorManual');
        if (grupoValorManual) grupoValorManual.style.display = 'none';
    });

    // Limpar a lista de igrejas
    document.getElementById('limparIgrejas').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar a lista de igrejas?')) {
            igrejasAdicionadas.length = 0; // Limpa o array
            _indiceEdicaoIgreja = null;
            atualizarRotuloBotaoAdicionarIgreja();
            atualizarListaIgrejas();
        }
    });
}

// Atualizar a lista de igrejas na interface
function atualizarListaIgrejas() {
    const listaIgrejas = document.getElementById('listaIgrejas');
    listaIgrejas.innerHTML = '';

    if (igrejasAdicionadas.length === 0) {
        listaIgrejas.innerHTML = '<p class="text-muted">Nenhuma igreja adicionada.</p>';
        return;
    }

    igrejasAdicionadas.forEach((igreja, index) => {
        const itemIgreja = document.createElement('div');
        itemIgreja.className = 'igreja-item';
        itemIgreja.innerHTML = `
            <h4>${igreja.nome}</h4>
            <p><strong>ID:</strong> ${igreja.id}</p>
            <p><strong>Código:</strong> ${igreja.codigo || '-'}</p>
            <p><strong>Empresa:</strong> ${igreja.empresa}</p>
            <p><strong>Tipo de igreja:</strong> ${igreja.tipoIgreja === 'padrao' ? 'Padrão' :
                igreja.tipoIgreja === 'som_para_tras' ? 'Som para trás' :
                    igreja.tipoIgreja === 'longe_2' ? 'Longe (Até 2 igrejas)' :
                        igreja.tipoIgreja === 'longe_3' ? 'Longe (Acima de 3 igrejas)' :
                            igreja.tipoIgreja === 'longe_bruno' ? 'Longe (Bruno)' : '-'
            }</p>
            <p><strong>Tipo de texto:</strong> ${igreja.tipoTexto === 'forro' ? 'Forro' :
                igreja.tipoTexto === 'tenda' ? 'Tenda' :
                    igreja.tipoTexto === 'vidro' ? 'Vidro' :
                        igreja.tipoTexto === 'personalizado' ? 'Personalizado' : 'Padrão'
            }</p>
            <p><strong>Tipo de pedido:</strong> ${igreja.tipoPedido === 'especial' ? 'Especial' : 'Padrão'}</p>
            ${igreja.tipoValorOrcamento === 'manual' && igreja.valorManual !== null && !isNaN(igreja.valorManual) ? `<p><strong>Valor Manual:</strong> R$ ${igreja.valorManual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ''}
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                <button type="button" class="btn-secondary editar-igreja" data-index="${index}" style="padding:6px 12px; font-size:13px;">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button type="button" class="remover-igreja" data-index="${index}" style="padding:6px 12px;">× Remover</button>
            </div>
        `;

        listaIgrejas.appendChild(itemIgreja);
    });

    // Adiciona eventos aos botões de remover
    document.querySelectorAll('.remover-igreja').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (_indiceEdicaoIgreja === index) {
                _indiceEdicaoIgreja = null;
                atualizarRotuloBotaoAdicionarIgreja();
            } else if (_indiceEdicaoIgreja !== null && _indiceEdicaoIgreja > index) {
                _indiceEdicaoIgreja -= 1;
            }
            igrejasAdicionadas.splice(index, 1);
            atualizarListaIgrejas();
        });
    });

    document.querySelectorAll('.editar-igreja').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'), 10);
            const ig = igrejasAdicionadas[index];
            if (!ig) return;
            _indiceEdicaoIgreja = index;
            atualizarRotuloBotaoAdicionarIgreja();

            document.getElementById('nomeIgreja').value = ig.nome || '';
            document.getElementById('idIgreja').value = ig.id || '';
            document.getElementById('linkIgreja').value = ig.link || '';
            document.getElementById('codigoIgreja').value = ig.codigo || '';
            const selEmp = document.getElementById('empresaSelecionada');
            if (selEmp) {
                const opt = Array.from(selEmp.options).find(o => o.value === ig.empresa);
                selEmp.selectedIndex = opt ? opt.index : 0;
            }
            const selTipoVal = document.getElementById('tipoValorOrcamento');
            if (selTipoVal) {
                selTipoVal.value = ig.tipoValorOrcamento === 'manual' ? 'manual' : 'auto';
                if (!selTipoVal.value) selTipoVal.value = 'auto';
                selTipoVal.dispatchEvent(new Event('change'));
            }
            const grupoValorManual = document.getElementById('grupoValorManual');
            const elValorManual = document.getElementById('valorManual');
            if (ig.tipoValorOrcamento === 'manual' && ig.valorManual != null && !isNaN(ig.valorManual)) {
                if (grupoValorManual) grupoValorManual.style.display = '';
                if (elValorManual) elValorManual.value = String(ig.valorManual);
            } else {
                if (grupoValorManual) grupoValorManual.style.display = 'none';
                if (elValorManual) elValorManual.value = '';
            }
            const selTipoIgreja = document.getElementById('tipoIgreja');
            if (selTipoIgreja && ig.tipoIgreja) {
                selTipoIgreja.value = ig.tipoIgreja;
                if (!selTipoIgreja.value) selTipoIgreja.selectedIndex = 0;
            }
            const selTipoTexto = document.getElementById('tipoTexto');
            const blocoTxt = document.getElementById('blocoTextoOrcamento');
            if (selTipoTexto) {
                selTipoTexto.value = ig.tipoTexto || 'padrao';
                if (blocoTxt) blocoTxt.style.display = (ig.tipoTexto === 'personalizado') ? '' : 'none';
            }
            const txtSuaEl = document.getElementById('textoOrcamentoSuaEmpresa');
            const txtConcEl = document.getElementById('textoOrcamentoConcorrente');
            if (txtSuaEl) txtSuaEl.value = ig.textoSuaEmpresa || '';
            if (txtConcEl) txtConcEl.value = ig.textoConcorrente || '';

            const selPedido = document.getElementById('tipoPedido');
            if (selPedido) selPedido.value = ig.tipoPedido || 'padrao';

            const nomeEl = document.getElementById('nomeIgreja');
            if (nomeEl && nomeEl.scrollIntoView) nomeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

// Inicializa a interface quando a página carrega
function inicializarInterface() {
    inicializarTabs();
    inicializarGerenciamentoIgrejas();

    // Resetar selects ao abrir a página
    document.getElementById('tipoValorOrcamento').selectedIndex = 0;
    document.getElementById('tipoIgreja').selectedIndex = 0;
    if (document.getElementById('tipoTexto')) {
        document.getElementById('tipoTexto').value = 'padrao';
    }
    if (document.getElementById('tipoPedido')) {
        document.getElementById('tipoPedido').value = 'padrao';
    }
    // Preencher data do orçamento com a data atual
    const inputDataOrcamento = document.getElementById('dataOrcamento');
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    inputDataOrcamento.value = `${yyyy}-${mm}-${dd}`;

    // Limpar resultados
    document.getElementById('limparResultados').addEventListener('click', function () {
        document.getElementById('pdfsDisplay').innerHTML = '';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('statusMessage').innerHTML = '';
        document.getElementById('downloadAllBtn').disabled = true;
    });

    // Inicializar a lista vazia quando a página carregar
    atualizarRotuloBotaoAdicionarIgreja();
    atualizarListaIgrejas();
    inicializarPedidosPendentes();
}

// Disponibiliza as funções globalmente
window.inicializarInterface = inicializarInterface;
window.atualizarListaIgrejas = atualizarListaIgrejas;

// =============================================
// SISTEMA DE PEDIDOS PENDENTES
// =============================================

// Cada pedido: { numero: string, tipo: 'nome'|'orcamento', valor?: string }
let pedidosPendentes = [];

function _normalizarListaPedidos(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(p => typeof p === 'string' ? { numero: p, tipo: 'nome' } : p);
}

function carregarPedidosPendentes() {
    try {
        const salvo = localStorage.getItem('pedidosPendentes');
        if (!salvo) { pedidosPendentes = []; return; }
        const parsed = JSON.parse(salvo);
        // Formato antigo: array puro  |  Formato novo: { lista: [], _ts: N }
        if (Array.isArray(parsed)) {
            pedidosPendentes = _normalizarListaPedidos(parsed);
        } else if (parsed && Array.isArray(parsed.lista)) {
            pedidosPendentes = _normalizarListaPedidos(parsed.lista);
        } else {
            pedidosPendentes = [];
        }
    } catch (e) {
        pedidosPendentes = [];
    }
}

function salvarPedidosPendentes() {
    try {
        const payload = { lista: pedidosPendentes, _ts: Date.now() };
        window._pedidosSalvouTs = payload._ts;
        localStorage.setItem('pedidosPendentes', JSON.stringify(payload));
        // Envia ao Firebase imediatamente (se disponível)
        if (typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            if (typeof window._piscarBadgeSync === 'function') window._piscarBadgeSync();
            salvarNoDatabase('dados/pedidosPendentes', payload)
                .then(() => { if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('pedidosPendentes', payload._ts); })
                .catch(err => console.warn('⚠️ Pedidos pendentes não salvos no Firebase:', err));
        }
    } catch (e) {}
}

function _numeroPedido(p) {
    return typeof p === 'object' ? (p.numero || '') : String(p || '');
}

function renderizarPedidosPendentes() {
    const container = document.getElementById('listaPedidosPendentes');
    if (!container) return;

    if (pedidosPendentes.length === 0) {
        container.innerHTML = '<p style="color:#aaa;font-size:13px;margin:0;">Nenhum pedido pendente.</p>';
        return;
    }

    container.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;">` +
        pedidosPendentes.map((p, idx) => {
            const num = _numeroPedido(p);
            const tipo = (typeof p === 'object' && p.tipo) || 'nome';
            const valor = (typeof p === 'object' && p.valor) ? p.valor : null;
            const isOrc = tipo === 'orcamento';
            const label = isOrc
                ? `${num} · R$ ${valor || '—'}`
                : `${num} · Nome`;
            const bg   = isOrc ? '#e8f5e9' : '#fff3e0';
            const brd  = isOrc ? '#43a047' : '#f9a825';
            const clr  = isOrc ? '#2e7d32' : '#e65100';
            return `<span style="display:inline-flex;align-items:center;gap:6px;background:${bg};border:1px solid ${brd};border-radius:20px;padding:4px 12px;font-size:13px;font-weight:bold;color:${clr};cursor:pointer;"
                onclick="editarPedidoPendente(${idx})">
                ${label}
                <button onclick="event.stopPropagation();removerPedidoPendente(${idx})"
                    style="background:none;border:none;cursor:pointer;color:${clr};font-size:14px;line-height:1;padding:0;margin:0;">&times;</button>
            </span>`;
        }).join('') +
        `</div>`;
}

window.abrirModalAdicionarPedido = function() {
    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:95%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;">
                <h3 style="margin:0;font-size:16px;"><i class="fas fa-list-ol"></i> Adicionar Pedido Pendente</h3>
                <button onclick="this.closest('.material-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#666;">&times;</button>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Número do Pedido</label>
                    <input type="text" id="inputNovoPedidoPendente" placeholder="Ex: OP-001"
                        style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Tipo</label>
                    <div style="display:flex;gap:10px;">
                        <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px solid #f9a825;border-radius:8px;cursor:pointer;background:#fff3e0;">
                            <input type="radio" name="tipoPedido" value="nome" checked
                                style="accent-color:#f57f17;" onchange="_pedidoTipoChange(this)">
                            <span style="font-size:13px;font-weight:600;color:#e65100;">Passar nome</span>
                        </label>
                        <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px solid #ddd;border-radius:8px;cursor:pointer;">
                            <input type="radio" name="tipoPedido" value="orcamento"
                                style="accent-color:#43a047;" onchange="_pedidoTipoChange(this)">
                            <span style="font-size:13px;font-weight:600;color:#555;">Orçamento</span>
                        </label>
                    </div>
                </div>
                <div id="campoPedidoValor" style="display:none;">
                    <label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Valor do Orçamento</label>
                    <input type="text" id="inputPedidoValor" placeholder="Ex: 1.500,00"
                        style="width:100%;padding:10px 12px;border:1px solid #43a047;border-radius:6px;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px;">
                    <button onclick="this.closest('.material-modal').remove()"
                        style="background:#f0f0f0;color:#333;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;">Cancelar</button>
                    <button onclick="_confirmarAdicionarPedido()"
                        style="background:#f57f17;color:#fff;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;font-weight:bold;">Adicionar</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const input = document.getElementById('inputNovoPedidoPendente');
    if (input) {
        input.focus();
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') _confirmarAdicionarPedido();
        });
    }

    // Estilo dinâmico nos radio buttons ao clicar
    modal.querySelectorAll('label').forEach(lbl => {
        lbl.addEventListener('click', () => {
            modal.querySelectorAll('[name=tipoPedido]').forEach(r => {
                const parentLabel = r.closest('label');
                if (r.checked) {
                    if (r.value === 'nome') {
                        parentLabel.style.borderColor = '#f9a825';
                        parentLabel.style.background  = '#fff3e0';
                    } else {
                        parentLabel.style.borderColor = '#43a047';
                        parentLabel.style.background  = '#e8f5e9';
                    }
                } else {
                    parentLabel.style.borderColor = '#ddd';
                    parentLabel.style.background  = '#fff';
                }
            });
        });
    });
};

window._pedidoTipoChange = function(radio) {
    const campo = document.getElementById('campoPedidoValor');
    if (!campo) return;
    campo.style.display = radio.value === 'orcamento' ? 'block' : 'none';
    if (radio.value === 'orcamento') {
        const v = document.getElementById('inputPedidoValor');
        if (v) v.focus();
    }
};

window._confirmarAdicionarPedido = function() {
    const input = document.getElementById('inputNovoPedidoPendente');
    if (!input) return;
    const numero = input.value.trim();
    if (!numero) { input.focus(); return; }

    const tipoEl = document.querySelector('[name=tipoPedido]:checked');
    const tipo = tipoEl ? tipoEl.value : 'nome';

    if (pedidosPendentes.some(p => _numeroPedido(p).toLowerCase() === numero.toLowerCase())) {
        alert('Este número de pedido já está na lista.');
        return;
    }

    const novoPedido = { numero, tipo };
    if (tipo === 'orcamento') {
        const valEl = document.getElementById('inputPedidoValor');
        novoPedido.valor = valEl ? valEl.value.trim() : '';
    }

    pedidosPendentes.push(novoPedido);
    salvarPedidosPendentes();
    renderizarPedidosPendentes();
    document.querySelector('.material-modal').remove();
};

window.removerPedidoPendente = function(idx) {
    pedidosPendentes.splice(idx, 1);
    salvarPedidosPendentes();
    renderizarPedidosPendentes();
};

window.editarPedidoPendente = function(idx) {
    const pedido = pedidosPendentes[idx];
    if (!pedido) return;
    const num   = _numeroPedido(pedido);
    const tipo  = (typeof pedido === 'object' && pedido.tipo) || 'nome';
    const valor = (typeof pedido === 'object' && pedido.valor) || '';
    const isOrc = tipo === 'orcamento';

    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:95%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;">
                <h3 style="margin:0;font-size:16px;"><i class="fas fa-edit"></i> Editar Pedido Pendente</h3>
                <button onclick="this.closest('.material-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#666;">&times;</button>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Número do Pedido</label>
                    <input type="text" id="inputEditarPedido" value="${num}"
                        style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Tipo</label>
                    <div style="display:flex;gap:10px;">
                        <label id="lblEditNome" style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px solid ${!isOrc ? '#f9a825' : '#ddd'};border-radius:8px;cursor:pointer;background:${!isOrc ? '#fff3e0' : '#fff'};">
                            <input type="radio" name="tipoEditPedido" value="nome" ${!isOrc ? 'checked' : ''}
                                style="accent-color:#f57f17;" onchange="_pedidoEditTipoChange(this)">
                            <span style="font-size:13px;font-weight:600;color:#e65100;">Passar nome</span>
                        </label>
                        <label id="lblEditOrc" style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px solid ${isOrc ? '#43a047' : '#ddd'};border-radius:8px;cursor:pointer;background:${isOrc ? '#e8f5e9' : '#fff'};">
                            <input type="radio" name="tipoEditPedido" value="orcamento" ${isOrc ? 'checked' : ''}
                                style="accent-color:#43a047;" onchange="_pedidoEditTipoChange(this)">
                            <span style="font-size:13px;font-weight:600;color:#555;">Orçamento</span>
                        </label>
                    </div>
                </div>
                <div id="campoEditarValor" style="display:${isOrc ? 'block' : 'none'};">
                    <label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Valor do Orçamento</label>
                    <input type="text" id="inputEditarValor" value="${valor}" placeholder="Ex: 1.500,00"
                        style="width:100%;padding:10px 12px;border:1px solid #43a047;border-radius:6px;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px;">
                    <button onclick="this.closest('.material-modal').remove()"
                        style="background:#f0f0f0;color:#333;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;">Cancelar</button>
                    <button onclick="_salvarEdicaoPedido(${idx})"
                        style="background:#f57f17;color:#fff;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;font-weight:bold;">Salvar</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('inputEditarPedido').focus();
};

window._pedidoEditTipoChange = function(radio) {
    const campo = document.getElementById('campoEditarValor');
    if (!campo) return;
    campo.style.display = radio.value === 'orcamento' ? 'block' : 'none';
    const lblNome = document.getElementById('lblEditNome');
    const lblOrc  = document.getElementById('lblEditOrc');
    if (lblNome) { lblNome.style.borderColor = radio.value === 'nome' ? '#f9a825' : '#ddd'; lblNome.style.background = radio.value === 'nome' ? '#fff3e0' : '#fff'; }
    if (lblOrc)  { lblOrc.style.borderColor  = radio.value === 'orcamento' ? '#43a047' : '#ddd'; lblOrc.style.background  = radio.value === 'orcamento' ? '#e8f5e9' : '#fff'; }
    if (radio.value === 'orcamento') { const v = document.getElementById('inputEditarValor'); if (v) v.focus(); }
};

window._salvarEdicaoPedido = function(idx) {
    const input = document.getElementById('inputEditarPedido');
    if (!input) return;
    const numero = input.value.trim();
    if (!numero) { input.focus(); return; }

    const tipoEl = document.querySelector('[name=tipoEditPedido]:checked');
    const tipo   = tipoEl ? tipoEl.value : 'nome';

    // Verifica duplicata ignorando o próprio índice
    const duplicado = pedidosPendentes.some((p, i) =>
        i !== idx && _numeroPedido(p).toLowerCase() === numero.toLowerCase()
    );
    if (duplicado) { alert('Já existe um pedido com esse número.'); return; }

    const atualizado = { numero, tipo };
    if (tipo === 'orcamento') {
        const valEl = document.getElementById('inputEditarValor');
        atualizado.valor = valEl ? valEl.value.trim() : '';
    }

    pedidosPendentes[idx] = atualizado;
    salvarPedidosPendentes();
    renderizarPedidosPendentes();
    document.querySelector('.material-modal').remove();
};

// Remove pedido da lista pelo número (chamado após geração de orçamento)
window.removerPedidoPendenteByNumero = function(numero) {
    if (!numero) return;
    const val = String(numero).trim().toLowerCase();
    const idx = pedidosPendentes.findIndex(p => _numeroPedido(p).trim().toLowerCase() === val);
    if (idx >= 0) {
        pedidosPendentes.splice(idx, 1);
        salvarPedidosPendentes();
        renderizarPedidosPendentes();
    }
};

function inicializarPedidosPendentes() {
    carregarPedidosPendentes();
    renderizarPedidosPendentes();
}

window.obterPedidosPendentes = function() { return pedidosPendentes; };