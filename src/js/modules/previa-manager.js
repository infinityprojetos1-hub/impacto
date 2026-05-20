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

function obterMateriaisIniciais(igreja) {
    const chave = _chaveIgreja(igreja);
    return previaMateriais[chave] || [];
}

function salvarMateriaisIniciais(igreja, lista) {
    const chave = _chaveIgreja(igreja);
    previaMateriais[chave] = lista;
    salvarPreviaMateriais();
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
        return {
            nome: item.nome,
            necessario,
            emEstoque,
            pedirFornecedor
        };
    });
}

// Renderiza a aba de prévia
function renderizarAbaPrevia() {
    const container = document.getElementById('previaContainer');
    if (!container) return;

    carregarPreviaMateriais();
    const igrejas = obterIgrejasParaPrevia();

    if (igrejas.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888;">
                <i class="fas fa-church" style="font-size:40px;margin-bottom:16px;display:block;"></i>
                <p>Nenhuma igreja encontrada. Cadastre igrejas na aba <strong>Notas Fiscais</strong>.</p>
            </div>`;
        return;
    }

    container.innerHTML = igrejas.map(ig => {
        const chave = _chaveIgreja(ig);
        const materiais = previaMateriais[chave] || [];
        const necessidade = calcularNecessidade(materiais);
        const totalPedir = necessidade.reduce((s, i) => s + i.pedirFornecedor, 0);
        const badge = totalPedir > 0
            ? `<span style="background:#e53935;color:#fff;border-radius:12px;padding:2px 10px;font-size:12px;margin-left:8px;">${totalPedir} itens necessários</span>`
            : materiais.length > 0
                ? `<span style="background:#2e7d32;color:#fff;border-radius:12px;padding:2px 10px;font-size:12px;margin-left:8px;">Estoque OK</span>`
                : '';

        return `
        <div class="previa-card" data-chave="${chave}" style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;margin-bottom:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#f8f8f8;border-bottom:1px solid #eee;cursor:pointer;" onclick="togglePreviaCard('${chave}')">
                <div>
                    <strong style="font-size:15px;">${ig.nome}</strong>
                    ${badge}
                    <span style="color:#888;font-size:12px;margin-left:8px;">${materiais.length} material(is) cadastrado(s)</span>
                </div>
                <i class="fas fa-chevron-down previa-chevron" id="chevron_${chave}" style="color:#666;transition:transform 0.2s;"></i>
            </div>
            <div class="previa-body" id="body_${chave}" style="display:none;padding:16px;">
                ${renderizarCorpoPrevia(ig, necessidade)}
            </div>
        </div>`;
    }).join('');
}

function renderizarCorpoPrevia(ig, necessidade) {
    const chave = _chaveIgreja(ig);
    const materiais = previaMateriais[chave] || [];

    const tabelaHTML = necessidade.length > 0 ? `
        <div style="overflow-x:auto;margin-bottom:16px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="background:#f0f0f0;">
                        <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Material</th>
                        <th style="padding:8px 10px;text-align:center;border-bottom:2px solid #ddd;">Necessário</th>
                        <th style="padding:8px 10px;text-align:center;border-bottom:2px solid #ddd;">Em Estoque</th>
                        <th style="padding:8px 10px;text-align:center;border-bottom:2px solid #ddd;">Pedir Fornecedor</th>
                    </tr>
                </thead>
                <tbody>
                    ${necessidade.map(item => `
                        <tr style="border-bottom:1px solid #f0f0f0;">
                            <td style="padding:8px 10px;">${item.nome}</td>
                            <td style="padding:8px 10px;text-align:center;">${item.necessario}</td>
                            <td style="padding:8px 10px;text-align:center;color:${item.emEstoque >= item.necessario ? '#2e7d32' : '#e53935'};">${item.emEstoque}</td>
                            <td style="padding:8px 10px;text-align:center;font-weight:bold;color:${item.pedirFornecedor > 0 ? '#e53935' : '#2e7d32'};">${item.pedirFornecedor > 0 ? item.pedirFornecedor : '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : `<p style="color:#aaa;font-size:13px;margin-bottom:12px;">Nenhum material inicial cadastrado.</p>`;

    return `
        ${tabelaHTML}
        <button onclick="abrirModalEditarMateriaisIniciais('${chave}', '${ig.nome.replace(/'/g, "\\'")}')"
            style="background:#4A6FDC;color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:13px;">
            <i class="fas fa-edit"></i> Editar Materiais Iniciais
        </button>`;
}

window.togglePreviaCard = function(chave) {
    const body = document.getElementById('body_' + chave);
    const chevron = document.getElementById('chevron_' + chave);
    if (!body) return;
    const aberto = body.style.display !== 'none';
    body.style.display = aberto ? 'none' : 'block';
    if (chevron) chevron.style.transform = aberto ? '' : 'rotate(180deg)';
};

window.abrirModalEditarMateriaisIniciais = function(chave, nomeIgreja) {
    const materiais = previaMateriais[chave] ? [...previaMateriais[chave]] : [];

    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:95%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;">
                <h3 style="margin:0;font-size:16px;">Materiais Iniciais — ${nomeIgreja}</h3>
                <button onclick="this.closest('.material-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#666;">&times;</button>
            </div>
            <div style="padding:20px;">
                <p style="font-size:13px;color:#666;margin-bottom:16px;">
                    Lista de materiais que esta igreja precisa na instalação inicial. O sistema irá comparar com o estoque e mostrar o que precisa ser pedido ao fornecedor.
                </p>
                <div id="previaListaItens" style="margin-bottom:16px;"></div>
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
                        style="background:#f0f0f0;color:#333;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;">Cancelar</button>
                    <button onclick="_previasSalvar('${chave}')"
                        style="background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:10px 20px;cursor:pointer;font-weight:bold;">Salvar</button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(modal);
    window._previaItensTemp = [...materiais];
    _previaRenderizarItens();

    document.getElementById('previaNovoNome').addEventListener('keydown', e => {
        if (e.key === 'Enter') _previaAdicionarItem();
    });
};

window._previaRenderizarItens = function() {
    const container = document.getElementById('previaListaItens');
    if (!container) return;
    if (!window._previaItensTemp || window._previaItensTemp.length === 0) {
        container.innerHTML = '<p style="color:#aaa;font-size:13px;">Nenhum item adicionado.</p>';
        return;
    }
    container.innerHTML = window._previaItensTemp.map((item, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#f9f9f9;border-radius:6px;margin-bottom:6px;">
            <span style="font-size:13px;flex:1;">${item.nome}</span>
            <span style="font-size:13px;font-weight:bold;margin:0 12px;">x${item.quantidade}</span>
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
    document.querySelector('.material-modal').remove();
    renderizarAbaPrevia();
};

function inicializarPrevia() {
    carregarPreviaMateriais();
}

window.renderizarAbaPrevia = renderizarAbaPrevia;
window.inicializarPrevia = inicializarPrevia;
