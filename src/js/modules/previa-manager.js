// =============================================
// GERENCIADOR DE PRÉVIA DE MATERIAL POR IGREJA
// =============================================

// Materiais iniciais por igreja: { "id_nome": [{nome, quantidade}] }
let previaMateriais = {};

function carregarPreviaMateriais() {
    try {
        const salvo = localStorage.getItem('previaMateriais');
        if (salvo) previaMateriais = JSON.parse(salvo);
    } catch (e) {
        previaMateriais = {};
    }
}

function salvarPreviaMateriais() {
    try {
        localStorage.setItem('previaMateriais', JSON.stringify(previaMateriais));
    } catch (e) {
        console.error('[Prévia] Erro ao salvar:', e);
    }
}

function _chaveIgreja(igreja) {
    return `${igreja.id}_${igreja.nome}`;
}

// Retorna lista de igrejas ativas do NF
function obterIgrejasParaPrevia() {
    if (typeof nfData === 'undefined') return [];
    return (nfData.igrejas || []).concat(nfData.especiais || []);
}

// Gera a lista de necessidade: o que precisa pegar do fornecedor
function calcularNecessidade(materiaisIniciais) {
    const itensEstoque = (typeof obterItensEstoque === 'function') ? obterItensEstoque() : [];

    return materiaisIniciais.map(item => {
        const nomeLower = String(item.nome || '').trim().toLowerCase();
        const itemEstoque = itensEstoque.find(e => String(e.nome || '').trim().toLowerCase() === nomeLower);
        const emEstoque = itemEstoque ? (parseInt(itemEstoque.quantidade, 10) || 0) : 0;
        const necessario = parseInt(item.quantidade, 10) || 0;
        const pedirFornecedor = Math.max(0, necessario - emEstoque);
        return { nome: item.nome, necessario, emEstoque, pedirFornecedor };
    });
}

// Renderiza a aba de prévia no estilo da aba Material
function renderizarAbaPrevia() {
    const container = document.getElementById('previaContainer');
    if (!container) return;

    carregarPreviaMateriais();
    const igrejas = obterIgrejasParaPrevia();

    if (igrejas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-church"></i>
                <h3>Nenhuma igreja encontrada</h3>
                <p>Cadastre igrejas na aba <strong>NF</strong> para gerenciar as prévias de material.</p>
            </div>`;
        return;
    }

    // Botão atualizar no topo
    container.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
            <button onclick="renderizarAbaPrevia()" class="btn-primary" title="Atualizar lista">
                <i class="fas fa-sync-alt"></i> Atualizar
            </button>
        </div>
        <div id="previaTabela"></div>`;

    const tabela = document.createElement('div');
    tabela.className = 'material-table';
    tabela.innerHTML = `
        <div class="material-header">
            <div class="material-col-igreja"><i class="fas fa-church"></i> Igreja</div>
            <div class="material-col-status-header"><i class="fas fa-boxes"></i> Situação</div>
            <div class="material-col-acoes"><i class="fas fa-cog"></i> Ações</div>
        </div>`;

    igrejas.forEach((ig) => {
        const chave = _chaveIgreja(ig);
        const materiais = previaMateriais[chave] || [];
        const necessidade = calcularNecessidade(materiais);
        const totalPedir = necessidade.reduce((s, i) => s + i.pedirFornecedor, 0);
        const totalItens = materiais.length;

        let statusClass, statusText;
        if (totalItens === 0) {
            statusClass = 'status-nao-enviado';
            statusText = 'Sem lista';
        } else if (totalPedir > 0) {
            statusClass = 'status-nao-enviado';
            statusText = `${totalPedir} a pedir`;
        } else {
            statusClass = 'status-enviado';
            statusText = 'Estoque OK';
        }

        const linha = document.createElement('div');
        linha.className = 'material-row material-row-clicavel';
        linha.style.cursor = 'pointer';
        linha.setAttribute('role', 'button');
        linha.setAttribute('tabindex', '0');
        linha.setAttribute('title', 'Clique para ver prévia de material');

        linha.innerHTML = `
            <div class="material-col-igreja">
                <strong><i class="fas fa-church" style="margin-right:8px;color:var(--gradient-start);"></i>${ig.nome}</strong>
                ${ig.id ? `<span class="material-id"><i class="fas fa-tag"></i> ID: ${ig.id}</span>` : ''}
                ${totalItens > 0 ? `<span class="material-count"><i class="fas fa-boxes"></i> ${totalItens} material(is)</span>` : ''}
            </div>
            <div class="material-col-status">
                <span class="material-status ${statusClass}">${statusText}</span>
            </div>
            <div class="material-col-acoes" onclick="event.stopPropagation()">
                <button class="btn-primary" onclick="event.stopPropagation(); abrirModalPrevia('${chave}', '${ig.nome.replace(/'/g, "\\'")}')">
                    <i class="fas fa-clipboard-list"></i> Ver Prévia
                </button>
            </div>`;

        linha.addEventListener('click', (e) => {
            if (!e.target.closest('.material-col-acoes')) {
                abrirModalPrevia(chave, ig.nome);
            }
        });
        linha.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!e.target.closest('.material-col-acoes')) abrirModalPrevia(chave, ig.nome);
            }
        });

        tabela.appendChild(linha);
    });

    document.getElementById('previaTabela').appendChild(tabela);
}

// Abre modal de prévia/edição para uma igreja
window.abrirModalPrevia = function(chave, nomeIgreja) {
    const materiais = previaMateriais[chave] ? [...previaMateriais[chave]] : [];
    const necessidade = calcularNecessidade(materiais);
    const totalPedir = necessidade.reduce((s, i) => s + i.pedirFornecedor, 0);

    const tabelaHTML = necessidade.length > 0 ? `
        <div style="overflow-x:auto;margin-bottom:16px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="background:linear-gradient(90deg,#667eea,#764ba2);color:#fff;">
                        <th style="padding:10px;text-align:left;border-radius:6px 0 0 0;">Material</th>
                        <th style="padding:10px;text-align:center;">Necessário</th>
                        <th style="padding:10px;text-align:center;">Em Estoque</th>
                        <th style="padding:10px;text-align:center;border-radius:0 6px 0 0;">Pedir Fornecedor</th>
                    </tr>
                </thead>
                <tbody>
                    ${necessidade.map(item => `
                        <tr style="border-bottom:1px solid #f0f0f0;">
                            <td style="padding:8px 10px;">${item.nome}</td>
                            <td style="padding:8px 10px;text-align:center;">${item.necessario}</td>
                            <td style="padding:8px 10px;text-align:center;color:${item.emEstoque >= item.necessario ? '#2e7d32' : '#e53935'};font-weight:bold;">${item.emEstoque}</td>
                            <td style="padding:8px 10px;text-align:center;font-weight:bold;color:${item.pedirFornecedor > 0 ? '#e53935' : '#2e7d32'};">${item.pedirFornecedor > 0 ? item.pedirFornecedor : '—'}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
        ${totalPedir > 0 ? `<div style="background:#ffebee;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#c62828;"><i class="fas fa-exclamation-triangle"></i> <strong>${totalPedir} item(s)</strong> precisam ser pedidos ao fornecedor.</div>` : `<div style="background:#e8f5e9;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#2e7d32;"><i class="fas fa-check-circle"></i> Estoque suficiente para todos os itens.</div>`}`
        : `<div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;color:#aaa;margin-bottom:16px;font-size:13px;"><i class="fas fa-clipboard" style="display:block;font-size:24px;margin-bottom:8px;"></i>Nenhum material inicial cadastrado para esta igreja.</div>`;

    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:95%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:12px 12px 0 0;">
                <h3 style="margin:0;font-size:16px;color:#fff;"><i class="fas fa-clipboard-list"></i> ${nomeIgreja}</h3>
                <button onclick="this.closest('.material-modal').remove()" style="background:rgba(255,255,255,0.2);border:none;font-size:18px;cursor:pointer;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;">&times;</button>
            </div>
            <div style="padding:20px;">
                <p style="font-size:13px;color:#666;margin-bottom:16px;">Materiais iniciais necessários e comparação com o estoque atual.</p>
                ${tabelaHTML}

                <div style="border-top:1px solid #eee;padding-top:16px;">
                    <h4 style="margin:0 0 12px;font-size:14px;color:#444;"><i class="fas fa-edit"></i> Editar Lista de Materiais Iniciais</h4>
                    <div id="previaListaItens" style="margin-bottom:12px;"></div>
                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
                        <input type="text" id="previaNovoNome" placeholder="Nome do material"
                            style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
                        <input type="number" id="previaNovaQtd" placeholder="Qtd" min="1" value="1"
                            style="width:70px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
                        <button onclick="_previaAdicionarItem()"
                            style="background:#4A6FDC;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:13px;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:10px;">
                        <button onclick="this.closest('.material-modal').remove()"
                            style="background:#f0f0f0;color:#333;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;">Fechar</button>
                        <button onclick="_previasSalvar('${chave}')"
                            style="background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;font-weight:bold;"><i class="fas fa-save"></i> Salvar</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.appendChild(modal);
    window._previaItensTemp = [...materiais];
    _previaRenderizarItens();

    const inputNome = document.getElementById('previaNovoNome');
    if (inputNome) inputNome.addEventListener('keydown', e => { if (e.key === 'Enter') _previaAdicionarItem(); });
};

window._previaRenderizarItens = function() {
    const container = document.getElementById('previaListaItens');
    if (!container) return;
    if (!window._previaItensTemp || window._previaItensTemp.length === 0) {
        container.innerHTML = '<p style="color:#aaa;font-size:13px;">Nenhum item na lista.</p>';
        return;
    }
    container.innerHTML = window._previaItensTemp.map((item, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:#f9f9f9;border-radius:6px;margin-bottom:5px;">
            <span style="font-size:13px;flex:1;">${item.nome}</span>
            <span style="font-size:13px;font-weight:bold;margin:0 12px;color:#555;">x${item.quantidade}</span>
            <button onclick="_previaRemoverItem(${idx})"
                style="background:#ffebee;color:#e53935;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>`).join('');
};

window._previaAdicionarItem = function() {
    const nomeEl = document.getElementById('previaNovoNome');
    const qtdEl = document.getElementById('previaNovaQtd');
    if (!nomeEl || !qtdEl) return;
    const nome = nomeEl.value.trim();
    const qtd = parseInt(qtdEl.value, 10) || 1;
    if (!nome) { nomeEl.focus(); return; }
    if (!window._previaItensTemp) window._previaItensTemp = [];
    const existente = window._previaItensTemp.findIndex(i => i.nome.toLowerCase() === nome.toLowerCase());
    if (existente >= 0) {
        window._previaItensTemp[existente].quantidade += qtd;
    } else {
        window._previaItensTemp.push({ nome, quantidade: qtd });
    }
    nomeEl.value = '';
    qtdEl.value = '1';
    nomeEl.focus();
    _previaRenderizarItens();
};

window._previaRemoverItem = function(idx) {
    if (!window._previaItensTemp) return;
    window._previaItensTemp.splice(idx, 1);
    _previaRenderizarItens();
};

window._previasSalvar = function(chave) {
    previaMateriais[chave] = [...(window._previaItensTemp || [])];
    salvarPreviaMateriais();
    const modal = document.querySelector('.material-modal');
    if (modal) modal.remove();
    renderizarAbaPrevia();
};

function inicializarPrevia() {
    carregarPreviaMateriais();
}

window.renderizarAbaPrevia = renderizarAbaPrevia;
window.inicializarPrevia = inicializarPrevia;
