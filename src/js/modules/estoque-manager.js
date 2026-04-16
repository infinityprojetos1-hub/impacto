// =============================================
// GERENCIADOR DE ESTOQUE
// =============================================

let estoqueData = {
    itens: []  // [{ nome: string, quantidade: number }]
};

window._estoqueCarregando = false;

// Carrega do localStorage
function carregarDadosEstoque() {
    try {
        const salvo = localStorage.getItem('estoqueData');
        if (salvo) {
            const dados = JSON.parse(salvo);
            estoqueData.itens = Array.isArray(dados.itens) ? dados.itens : [];
            _ordenarItensEstoque();
        }
    } catch (e) {
        console.error('[Estoque] Erro ao carregar:', e);
    }
}

// Ordena itens alfabeticamente por nome
function _ordenarItensEstoque() {
    estoqueData.itens.sort((a, b) => {
        const na = String(a.nome || '').trim().toLowerCase();
        const nb = String(b.nome || '').trim().toLowerCase();
        return na.localeCompare(nb);
    });
}

// Salva no localStorage e Firebase
function salvarDadosEstoque() {
    if (window._estoqueCarregando) return;
    try {
        _ordenarItensEstoque();
        const dados = { itens: estoqueData.itens, _ts: Date.now() };
        localStorage.setItem('estoqueData', JSON.stringify(dados));
        if (typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            const _ts = dados._ts;
            salvarNoDatabase('dados/estoque', dados).then(() => {
                if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('estoqueData', _ts);
            });
            if (typeof window._piscarBadgeSync === 'function') window._piscarBadgeSync();
        }
    } catch (e) {
        console.error('[Estoque] Erro ao salvar:', e);
    }
}

// Retorna lista de itens do estoque (para dropdown)
function obterItensEstoque() {
    return estoqueData.itens || [];
}

// Encontra item por nome (case insensitive)
function _encontrarItemEstoque(nome) {
    const n = String(nome || '').trim().toLowerCase();
    return estoqueData.itens.findIndex(it => String(it.nome || '').trim().toLowerCase() === n);
}

// Deduz quantidade do estoque (ao adicionar material na igreja)
function deduzirEstoque(nome, quantidade) {
    const qtd = parseInt(quantidade, 10) || 0;
    if (qtd <= 0) return true;
    const idx = _encontrarItemEstoque(nome);
    if (idx < 0) return false; // item não está no estoque
    const item = estoqueData.itens[idx];
    const atual = parseInt(item.quantidade, 10) || 0;
    const novo = Math.max(0, atual - qtd);
    item.quantidade = novo;
    // Mantém item na lista mesmo com quantidade 0 (não remove)
    salvarDadosEstoque();
    return true;
}

// Devolve quantidade ao estoque (ao remover material da igreja)
function devolverEstoque(nome, quantidade) {
    const qtd = parseInt(quantidade, 10) || 0;
    if (qtd <= 0) return;
    const idx = _encontrarItemEstoque(nome);
    if (idx >= 0) {
        const item = estoqueData.itens[idx];
        item.quantidade = (parseInt(item.quantidade, 10) || 0) + qtd;
    } else {
        estoqueData.itens.push({ nome: String(nome).trim(), quantidade: qtd });
    }
    salvarDadosEstoque();
}

// Verifica se há quantidade suficiente no estoque
function temEstoqueSuficiente(nome, quantidade) {
    const idx = _encontrarItemEstoque(nome);
    if (idx < 0) return false;
    const disp = parseInt(estoqueData.itens[idx].quantidade, 10) || 0;
    return disp >= (parseInt(quantidade, 10) || 0);
}

// =============================================
// UI DA ABA ESTOQUE
// =============================================

function renderizarAbaEstoque() {
    const container = document.getElementById('estoqueContainer');
    if (!container) return;

    const itens = obterItensEstoque();

    container.innerHTML = `
        <div class="section">
            <h2><i class="fas fa-boxes"></i> Controle de Estoque</h2>
            <p>Cadastre os materiais que você tem. Ao adicionar um item na aba Material (para uma igreja), a quantidade será deduzida automaticamente.</p>

            <div class="estoque-actions">
                <button class="btn-primary" onclick="abrirModalAdicionarEstoque()">
                    <i class="fas fa-plus"></i> Adicionar Item ao Estoque
                </button>
                ${itens.length > 0 ? `
                <button class="btn-success" onclick="abrirModalAdicionarAExistente()">
                    <i class="fas fa-boxes-stacked"></i> Adicionar a Item Existente
                </button>
                ` : ''}
            </div>

            <div class="estoque-lista" id="estoqueLista">
                ${itens.length === 0
                    ? '<div class="estoque-empty"><i class="fas fa-box-open"></i><p>Nenhum item no estoque.</p><p>Clique em "Adicionar Item ao Estoque" para começar.</p></div>'
                    : itens.map((it, i) => `
                        <div class="estoque-item" data-index="${i}" onclick="editarItemEstoque(${i})" role="button" tabindex="0">
                            <div class="estoque-item-info">
                                <strong>${it.nome}</strong>
                                <span class="estoque-item-qtd">${it.quantidade} un.</span>
                            </div>
                            <div class="estoque-item-acoes" onclick="event.stopPropagation()">
                                <button class="btn-secondary btn-icon" onclick="editarItemEstoque(${i})" title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="btn-danger btn-icon" onclick="removerItemEstoque(${i})" title="Remover"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}

function abrirModalAdicionarAExistente() {
    const itens = obterItensEstoque();
    if (itens.length === 0) return;

    const opts = itens.map((it, i) =>
        `<option value="${i}">${(it.nome || '').replace(/"/g, '&quot;')} (${it.quantidade} un. atual)</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small">
            <div class="material-modal-header">
                <h3><i class="fas fa-boxes-stacked"></i> Adicionar Quantidade a Item Existente</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-form-body">
                <form onsubmit="adicionarAItemExistente(event)">
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Item:</label>
                        <select id="estoqueItemExistenteSelect" required>
                            <option value="">Selecione o item...</option>
                            ${opts}
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-sort-numeric-up"></i> Quantidade a adicionar:</label>
                        <input type="number" id="estoqueItemExistenteQtd" placeholder="0" min="1" value="1" required>
                    </div>
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-plus"></i> Somar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('estoqueItemExistenteSelect').focus(), 100);
}

function adicionarAItemExistente(event) {
    event.preventDefault();
    const sel = document.getElementById('estoqueItemExistenteSelect');
    const qtd = parseInt(document.getElementById('estoqueItemExistenteQtd').value, 10) || 0;
    if (!sel || sel.value === '' || qtd < 1) return;

    const index = parseInt(sel.value, 10);
    const item = estoqueData.itens[index];
    if (!item) return;

    const atual = parseInt(item.quantidade, 10) || 0;
    item.quantidade = atual + qtd;
    salvarDadosEstoque();
    renderizarAbaEstoque();
    event.target.closest('.material-modal').remove();
}

function abrirModalAdicionarEstoque() {
    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small">
            <div class="material-modal-header">
                <h3><i class="fas fa-plus-circle"></i> Adicionar Item ao Estoque</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-form-body">
                <form onsubmit="adicionarItemEstoque(event)">
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Nome do item:</label>
                        <input type="text" id="estoqueItemNome" placeholder="Ex: Cabo HDMI 10m" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-sort-numeric-up"></i> Quantidade:</label>
                        <input type="number" id="estoqueItemQtd" placeholder="0" min="0" value="0" required>
                    </div>
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-check"></i> Adicionar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('estoqueItemNome').focus(), 100);
}

function adicionarItemEstoque(event) {
    event.preventDefault();
    const nome = document.getElementById('estoqueItemNome').value.trim();
    const qtd = parseInt(document.getElementById('estoqueItemQtd').value, 10) || 0;
    if (!nome || qtd < 0) return;

    const idx = _encontrarItemEstoque(nome);
    if (idx >= 0) {
        estoqueData.itens[idx].quantidade = (parseInt(estoqueData.itens[idx].quantidade, 10) || 0) + qtd;
    } else {
        estoqueData.itens.push({ nome, quantidade: qtd });
    }
    salvarDadosEstoque();
    renderizarAbaEstoque();
    event.target.closest('.material-modal').remove();
}

function editarItemEstoque(index) {
    const item = estoqueData.itens[index];
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small">
            <div class="material-modal-header">
                <h3><i class="fas fa-edit"></i> Editar Item</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-form-body">
                <form onsubmit="salvarEdicaoEstoque(event, ${index})">
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Nome do item:</label>
                        <input type="text" id="estoqueEditNome" value="${item.nome.replace(/"/g, '&quot;')}" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-sort-numeric-up"></i> Quantidade:</label>
                        <input type="number" id="estoqueEditQtd" value="${item.quantidade}" min="0" required>
                    </div>
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Salvar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function salvarEdicaoEstoque(event, index) {
    event.preventDefault();
    const nome = document.getElementById('estoqueEditNome').value.trim();
    const qtd = parseInt(document.getElementById('estoqueEditQtd').value, 10) || 0;
    if (!nome || qtd < 0) return;

    estoqueData.itens[index] = { nome, quantidade: qtd };
    salvarDadosEstoque();
    renderizarAbaEstoque();
    event.target.closest('.material-modal').remove();
}

function removerItemEstoque(index) {
    if (!confirm('Remover este item do estoque?')) return;
    estoqueData.itens.splice(index, 1);
    salvarDadosEstoque();
    renderizarAbaEstoque();
}

function inicializarEstoque() {
    carregarDadosEstoque();
    document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.getAttribute('data-tab') === 'estoque') {
            btn.addEventListener('click', () => setTimeout(renderizarAbaEstoque, 80));
        }
    });
}

// Expõe globalmente para material-manager e firebase-config
window.obterItensEstoque = obterItensEstoque;
window._ordenarItensEstoque = _ordenarItensEstoque;
window.deduzirEstoque = deduzirEstoque;
window.devolverEstoque = devolverEstoque;
window.temEstoqueSuficiente = temEstoqueSuficiente;
window.renderizarAbaEstoque = renderizarAbaEstoque;
window.inicializarEstoque = inicializarEstoque;
