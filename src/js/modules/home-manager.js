// =============================================
// GERENCIADOR DA HOME - PESQUISA DE IGREJAS
// Interface simples para buscar e ver status dos pedidos
// =============================================

// Retorna o status igual ao das Notas Fiscais (campo pendencia)
// arquivada: quando true e pendencia vazia, mostra "ARQUIVADA" em vez de "—"
function obterStatusNF(igreja, arquivada) {
    if (!igreja) return { texto: '—', cor: '#64748b' };
    const pendencia = String(igreja.pendencia || '').trim().toUpperCase();
    let texto = pendencia || (arquivada ? 'ARQUIVADA' : '—');
    const cores = {
        'ASSINATURA': '#f59e0b',
        'EXECUÇÃO': '#0ea5e9',
        'RELATÓRIO': '#8b5cf6',
        'LOGIX': '#8b5cf6',
        'NFE': '#ec4899',
        'PAGAMENTO': '#6366f1',
        'PAGO': '#10b981',
        'ARQUIVADA': '#64748b'
    };
    return { texto, cor: cores[texto] || '#64748b' };
}

// Abre modal com checklist da igreja (somente leitura, igual ao de edição NF)
function abrirModalChecklistHome(igreja) {
    if (!igreja) return;
    const ch = igreja.checklist || {};
    const arquivada = typeof nfData !== 'undefined' && (nfData.arquivadas || []).some(ar => ar.nome === igreja.nome && ar.id === igreja.id);
    const pendenciaExibir = (igreja.pendencia || (arquivada ? 'ARQUIVADA' : '—')).toString().toUpperCase();
    const sim = (v) => v ? '<span class="home-chk-sim"><i class="fas fa-check"></i> SIM</span>' : '<span class="home-chk-nao"><i class="fas fa-times"></i> NÃO</span>';

    const modal = document.createElement('div');
    modal.className = 'nf-modal home-checklist-modal';
    modal.innerHTML = `
        <div class="nf-modal-content nf-modal-lg home-checklist-content">
            <div class="home-checklist-header">
                <h3><i class="fas fa-clipboard-check"></i> Checklist - ${(igreja.nome || '').replace(/</g, '&lt;')}</h3>
                <button type="button" class="home-checklist-close" onclick="this.closest('.nf-modal').remove()">×</button>
            </div>
            <div class="home-checklist-body">
                <div class="home-checklist-info">
                    <span><i class="fas fa-hashtag"></i> Código: ${igreja.codigo || '—'}</span>
                    <span><i class="fas fa-barcode"></i> Pedido: ${igreja.id || '—'}</span>
                    <span><i class="fas fa-tag"></i> Pendência: ${pendenciaExibir}</span>
                </div>
                <div class="home-checklist-section">
                    <h4>1º passo - Assinaturas</h4>
                    <div class="home-chk-grid">
                        <div class="home-chk-row"><span class="home-chk-label">SANDRO</span>${sim(ch.assinatura_sandro)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">FILIPPI</span>${sim(ch.assinatura_filippi)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">RODRIGO</span>${sim(ch.assinatura_rodrigo)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">ANDRÉ</span>${sim(ch.assinatura_andre)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">FERNANDO</span>${sim(ch.assinatura_fernando)}</div>
                    </div>
                </div>
                <div class="home-checklist-section">
                    <h4>2º passo - Pedido e Assinatura</h4>
                    <div class="home-chk-grid">
                        <div class="home-chk-row"><span class="home-chk-label">PEDIDO</span>${sim(ch.doc_pedido)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">ASSINATURA</span>${sim(ch.doc_assinatura)}</div>
                    </div>
                </div>
                <div class="home-checklist-section">
                    <h4>3º passo - Relatório, NF e Execução</h4>
                    <div class="home-chk-grid">
                        <div class="home-chk-row"><span class="home-chk-label">RELATÓRIO</span>${sim(ch.doc_relatorio)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">NF</span>${sim(ch.doc_nf)}</div>
                        <div class="home-chk-row"><span class="home-chk-label">EXECUÇÃO</span>${sim(ch.execucao_feito)}</div>
                    </div>
                </div>
            </div>
            <div class="nf-modal-buttons">
                <button type="button" class="btn-secondary" onclick="this.closest('.nf-modal').remove()">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Busca igrejas por nome, código ou número do pedido (pesquisa parcial)
// Retorna [{ igreja, arquivada }, ...]
function buscarIgrejas(termo) {
    const t = String(termo || '').trim().toLowerCase();

    const comTipo = [];
    if (typeof nfData !== 'undefined') {
        (nfData.igrejas || []).forEach(ig => { if (ig && ig.nome && ig.empresa && ig.valor) comTipo.push({ igreja: ig, arquivada: false }); });
        (nfData.arquivadas || []).forEach(ig => { if (ig && ig.nome && ig.empresa && ig.valor) comTipo.push({ igreja: ig, arquivada: true }); });
        (nfData.especiais || []).forEach(ig => { if (ig && ig.nome && ig.empresa && ig.valor) comTipo.push({ igreja: ig, arquivada: false }); });
    }

    if (!t) return comTipo;

    return comTipo.filter(({ igreja }) => {
        const nome = String(igreja.nome || '').toLowerCase();
        const codigo = String(igreja.codigo || '').toLowerCase();
        const id = String(igreja.id || '').toLowerCase();
        return nome.includes(t) || codigo.includes(t) || id.includes(t);
    });
}

// Renderiza a aba Home
function renderizarAbaHome() {
    const container = document.getElementById('homeContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="home-section">
            <div class="home-hero">
                <h3 class="home-title"><i class="fas fa-search"></i> Buscar Igreja</h3>
                <p class="home-subtitle">Digite para buscar em tempo real (nome, código ou pedido)</p>
                <div class="home-search-container">
                    <input type="text" id="homeSearchInput" class="home-search-input" 
                           placeholder="Ex: SÃO FRANCISCO, 060883 ou 93581" 
                           autocomplete="off">
                </div>
            </div>

            <div id="homeSearchResults" class="home-results">
                <div class="home-results-placeholder">
                    <i class="fas fa-church"></i>
                    <p>Digite o nome, código ou número do pedido para buscar</p>
                </div>
            </div>
        </div>
    `;

    const input = document.getElementById('homeSearchInput');
    const results = document.getElementById('homeSearchResults');
    let _debounceTimer = null;

    const executarBusca = () => {
        const termo = (input && input.value) ? input.value.trim() : '';
        const encontradas = buscarIgrejas(termo);

        if (!termo) {
            results.innerHTML = `
                <div class="home-results-placeholder">
                    <i class="fas fa-church"></i>
                    <p>Digite o nome, código ou número do pedido para buscar</p>
                </div>
            `;
            return;
        }

        if (encontradas.length === 0) {
            results.innerHTML = `
                <div class="home-results-empty">
                    <i class="fas fa-search"></i>
                    <p>Nenhuma igreja encontrada para "<strong>${termo.replace(/</g, '&lt;')}</strong>"</p>
                    <p class="home-results-hint">Tente buscar por outro nome, código ou número do pedido</p>
                </div>
            `;
            return;
        }

        window._ultimaBuscaHome = encontradas.map(x => x.igreja);
        const cards = encontradas.map((item, idx) => {
            const ig = item.igreja;
            const status = obterStatusNF(ig, item.arquivada);
            const link = ig.link ? ig.link : '';
            return `
                <div class="home-results-card home-results-card-clickable" data-idx="${idx}">
                    <div class="home-card-header">
                        <h4 class="home-card-nome">${ig.nome}</h4>
                        <span class="home-card-status" style="background:${status.cor}20;color:${status.cor};border:1px solid ${status.cor}40;">
                            ${status.texto}
                        </span>
                    </div>
                    <div class="home-card-info">
                        <span><i class="fas fa-hashtag"></i> Código: ${ig.codigo || '—'}</span>
                        <span><i class="fas fa-barcode"></i> Pedido: ${ig.id || '—'}</span>
                        <span><i class="fas fa-building"></i> ${ig.empresa || '—'}</span>
                        <span><i class="fas fa-dollar-sign"></i> ${ig.valor || '—'}</span>
                    </div>
                    ${link ? `<a href="${link}" target="_blank" rel="noopener" class="home-card-link" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> Abrir no portal</a>` : ''}
                </div>
            `;
        }).join('');

        results.innerHTML = `<div class="home-results-list">${cards}</div>`;

        // Clique no card abre modal do checklist
        results.querySelectorAll('.home-results-card-clickable').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.home-card-link')) return;
                const idx = parseInt(card.getAttribute('data-idx'), 10);
                const lista = window._ultimaBuscaHome;
                if (lista && lista[idx]) abrirModalChecklistHome(lista[idx]);
            });
        });
    };

    // Busca em tempo real ao digitar (com debounce de 150ms)
    if (input) {
        input.addEventListener('input', () => {
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(executarBusca, 150);
        });
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') { clearTimeout(_debounceTimer); executarBusca(); } });
        input.focus();
    }
}

// Inicializa a Home
function inicializarHome() {
    const tabBtn = document.querySelector('[data-tab="home"]');
    if (tabBtn) {
        tabBtn.addEventListener('click', () => setTimeout(renderizarAbaHome, 80));
    }
    renderizarAbaHome();
}

window.renderizarAbaHome = renderizarAbaHome;
window.inicializarHome = inicializarHome;
window.buscarIgrejas = buscarIgrejas;
window.obterStatusNF = obterStatusNF;
window.abrirModalChecklistHome = abrirModalChecklistHome;
