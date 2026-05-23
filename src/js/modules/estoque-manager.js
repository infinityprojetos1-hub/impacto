// =============================================
// GERENCIADOR DE ESTOQUE
// =============================================

let estoqueData = {
    itens: []  // [{ nome, marca?, modelo?, unidade, quantidade }]
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
function devolverEstoque(nome, quantidade, extra) {
    const qtd = parseInt(quantidade, 10) || 0;
    if (qtd <= 0) return;
    const idx = _encontrarItemEstoque(nome);
    if (idx >= 0) {
        const item = estoqueData.itens[idx];
        item.quantidade = (parseInt(item.quantidade, 10) || 0) + qtd;
    } else {
        const novoItem = { nome: String(nome).trim(), quantidade: qtd, unidade: (extra && extra.unidade) || 'un' };
        if (extra && extra.marca) novoItem.marca = extra.marca;
        if (extra && extra.modelo) novoItem.modelo = extra.modelo;
        estoqueData.itens.push(novoItem);
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

function _badgeEstoque(it) {
    const m = it.marca ? `<span style="font-size:11px;background:#e8eaf6;color:#3949ab;padding:2px 8px;border-radius:4px;font-weight:500;margin-right:4px;">${it.marca}</span>` : '';
    const mod = it.modelo ? `<span style="font-size:11px;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:4px;font-weight:600;">${it.modelo}</span>` : '';
    return m + mod;
}

function renderizarAbaEstoque() {
    const container = document.getElementById('estoqueContainer');
    if (!container) return;

    const itens = obterItensEstoque();

    // Campo de busca: captura o valor antes de re-renderizar
    const buscaAtual = (document.getElementById('estoqueBusca') || {}).value || '';

    const itensFiltrados = buscaAtual.trim()
        ? itens.filter(it => [it.nome, it.marca, it.modelo].filter(Boolean).join(' ').toLowerCase().includes(buscaAtual.trim().toLowerCase()))
        : itens;

    container.innerHTML = `
        <div class="section">
            <h2><i class="fas fa-boxes"></i> Controle de Estoque</h2>
            <p>Cadastre os materiais que você tem. Ao adicionar um item na aba Material (para uma igreja), a quantidade será deduzida automaticamente.</p>

            <div class="estoque-actions">
                <button class="btn-primary" onclick="abrirModalAdicionarEstoque()">
                    <i class="fas fa-plus"></i> Novo Item
                </button>
                ${itens.length > 0 ? `
                <button class="btn-success" onclick="abrirModalAdicionarAExistente()">
                    <i class="fas fa-boxes-stacked"></i> Adicionar Quantidade
                </button>
                ` : ''}
            </div>

            ${itens.length > 0 ? `
            <div style="position:relative;margin:14px 0 10px;">
                <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#aaa;font-size:13px;"></i>
                <input type="text" id="estoqueBusca" value="${buscaAtual.replace(/"/g,'&quot;')}"
                    placeholder="Buscar por nome, marca ou modelo..."
                    oninput="renderizarAbaEstoque()"
                    style="width:100%;box-sizing:border-box;padding:10px 14px 10px 36px;border:1px solid var(--border-color);border-radius:10px;font-size:14px;background:var(--bg-light);color:var(--text-primary);">
            </div>` : ''}

            <div class="estoque-lista" id="estoqueLista" style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
                ${itensFiltrados.length === 0
                    ? '<div class="estoque-empty"><i class="fas fa-box-open"></i><p>Nenhum item encontrado.</p></div>'
                    : itensFiltrados.map((it) => {
                        const i = itens.indexOf(it);
                        const unidade = it.unidade || 'un';
                        const qtdNum = parseInt(it.quantidade, 10) || 0;
                        const qtdColor = qtdNum === 0 ? '#e53935' : qtdNum < 5 ? '#f57c00' : '#2e7d32';
                        const badges = _badgeEstoque(it);
                        return `
                        <div class="estoque-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--card-bg,#fff);border:1px solid var(--border-color);border-radius:14px;cursor:pointer;" onclick="editarItemEstoque(${i})" role="button" tabindex="0">
                            <div style="width:40px;height:40px;border-radius:10px;background:#e3f2fd;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <i class="fas fa-box" style="color:#1565c0;font-size:16px;"></i>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:15px;margin-bottom:3px;">${it.nome}</div>
                                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                    ${badges}
                                    ${!it.marca && !it.modelo ? `<span style="font-size:12px;color:#888;">Unidade: ${unidade}</span>` : `<span style="font-size:11px;color:#aaa;">Unid.: ${unidade}</span>`}
                                </div>
                            </div>
                            <div style="text-align:center;flex-shrink:0;min-width:48px;">
                                <div style="font-size:20px;font-weight:700;color:${qtdColor};line-height:1;">${qtdNum}</div>
                                <div style="font-size:11px;color:#aaa;">${unidade}</div>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;" onclick="event.stopPropagation()">
                                <button class="btn-secondary btn-icon" onclick="duplicarItemEstoque(${i})" title="Duplicar item" style="color:#2e7d32;border-color:#2e7d32;"><i class="fas fa-copy"></i></button>
                                <button class="btn-secondary btn-icon" onclick="editarItemEstoque(${i})" title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="btn-danger btn-icon" onclick="removerItemEstoque(${i})" title="Remover"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>`;
                    }).join('')
                }
            </div>
        </div>
    `;

    // Reaplica foco no campo de busca (evita perder o cursor ao redigitar)
    if (buscaAtual) {
        const inp = document.getElementById('estoqueBusca');
        if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
}

function abrirModalAdicionarAExistente() {
    const itens = obterItensEstoque();
    if (itens.length === 0) return;

    const opts = itens.map((it, i) => {
        const info = [it.marca, it.modelo].filter(Boolean).join(' — ');
        const label = (it.nome || '') + (info ? ` (${info})` : '') + ` — ${it.quantidade} ${it.unidade||'un'} atual`;
        return `<option value="${i}">${label.replace(/"/g,'&quot;')}</option>`;
    }).join('');

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
                <h3><i class="fas fa-plus-circle"></i> Novo Item no Estoque</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-form-body">
                <form onsubmit="adicionarItemEstoque(event)">
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Nome do Item: *</label>
                        <input type="text" id="estoqueItemNome" placeholder="Ex: Amplificador" required>
                    </div>
                    <div class="form-group">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div>
                                <label style="display:block;margin-bottom:4px;"><i class="fas fa-tag"></i> Marca:</label>
                                <input type="text" id="estoqueItemMarca" placeholder="Ex: LL Audio" style="width:100%;box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block;margin-bottom:4px;"><i class="fas fa-microchip"></i> Modelo:</label>
                                <input type="text" id="estoqueItemModelo" placeholder="Ex: 1600" style="width:100%;box-sizing:border-box;">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-ruler"></i> Unidade:</label>
                        <select id="estoqueItemUnidade">
                            <option value="un">Unidade (un)</option>
                            <option value="kg">Quilograma (kg)</option>
                            <option value="m">Metro (m)</option>
                            <option value="m²">Metro Quadrado (m²)</option>
                            <option value="l">Litro (l)</option>
                            <option value="cx">Caixa (cx)</option>
                            <option value="pc">Peça (pc)</option>
                            <option value="rolo">Rolo</option>
                            <option value="fardo">Fardo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-sort-numeric-up"></i> Quantidade em Estoque:</label>
                        <input type="number" id="estoqueItemQtd" placeholder="0" min="0" value="0" required>
                    </div>
                    <input type="hidden" id="estoqueItemForceNew" value="0">
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
    const marca = (document.getElementById('estoqueItemMarca') ? document.getElementById('estoqueItemMarca').value.trim() : '');
    const modelo = (document.getElementById('estoqueItemModelo') ? document.getElementById('estoqueItemModelo').value.trim() : '');
    const unidade = (document.getElementById('estoqueItemUnidade') ? document.getElementById('estoqueItemUnidade').value : 'un');
    const qtd = parseInt(document.getElementById('estoqueItemQtd').value, 10) || 0;
    const forceNew = document.getElementById('estoqueItemForceNew') && document.getElementById('estoqueItemForceNew').value === '1';
    if (!nome || qtd < 0) return;

    // Só mescla com item existente se NÃO for duplicação forçada
    const idx = forceNew ? -1 : _encontrarItemEstoque(nome);
    if (idx >= 0) {
        const it = estoqueData.itens[idx];
        it.quantidade = (parseInt(it.quantidade, 10) || 0) + qtd;
        if (marca) it.marca = marca;
        if (modelo) it.modelo = modelo;
        it.unidade = unidade;
    } else {
        const novoItem = { nome, quantidade: qtd, unidade };
        if (marca) novoItem.marca = marca;
        if (modelo) novoItem.modelo = modelo;
        estoqueData.itens.push(novoItem);
    }
    salvarDadosEstoque();
    renderizarAbaEstoque();
    event.target.closest('.material-modal').remove();
}

function editarItemEstoque(index) {
    const item = estoqueData.itens[index];
    if (!item) return;

    const un = item.unidade || 'un';
    const opts = ['un','kg','m','m²','l','cx','pc','rolo','fardo']
        .map(u => `<option value="${u}" ${un===u?'selected':''}>${u}</option>`).join('');

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
                        <label><i class="fas fa-tag"></i> Nome do Item: *</label>
                        <input type="text" id="estoqueEditNome" value="${(item.nome||'').replace(/"/g, '&quot;')}" required>
                    </div>
                    <div class="form-group">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div>
                                <label style="display:block;margin-bottom:4px;"><i class="fas fa-tag"></i> Marca:</label>
                                <input type="text" id="estoqueEditMarca" value="${(item.marca||'').replace(/"/g,'&quot;')}" placeholder="Ex: LL Audio" style="width:100%;box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block;margin-bottom:4px;"><i class="fas fa-microchip"></i> Modelo:</label>
                                <input type="text" id="estoqueEditModelo" value="${(item.modelo||'').replace(/"/g,'&quot;')}" placeholder="Ex: 1600" style="width:100%;box-sizing:border-box;">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-ruler"></i> Unidade:</label>
                        <select id="estoqueEditUnidade">${opts}</select>
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
    setTimeout(() => document.getElementById('estoqueEditNome').focus(), 100);
}

function salvarEdicaoEstoque(event, index) {
    event.preventDefault();
    const nome = document.getElementById('estoqueEditNome').value.trim();
    const marca = (document.getElementById('estoqueEditMarca') ? document.getElementById('estoqueEditMarca').value.trim() : '');
    const modelo = (document.getElementById('estoqueEditModelo') ? document.getElementById('estoqueEditModelo').value.trim() : '');
    const unidade = (document.getElementById('estoqueEditUnidade') ? document.getElementById('estoqueEditUnidade').value : 'un');
    const qtd = parseInt(document.getElementById('estoqueEditQtd').value, 10) || 0;
    if (!nome || qtd < 0) return;

    const itemAtualizado = { nome, quantidade: qtd, unidade };
    if (marca) itemAtualizado.marca = marca;
    if (modelo) itemAtualizado.modelo = modelo;
    estoqueData.itens[index] = itemAtualizado;
    salvarDadosEstoque();
    renderizarAbaEstoque();
    event.target.closest('.material-modal').remove();
}

// Abre o modal de novo item pré-preenchido com os dados de um existente (igual ao "Duplicar" do Gabriel)
function duplicarItemEstoque(index) {
    const origem = estoqueData.itens[index];
    if (!origem) return;

    // Abre o modal de adicionar e preenche os campos após a abertura
    abrirModalAdicionarEstoque();
    setTimeout(() => {
        const nomeEl    = document.getElementById('estoqueItemNome');
        const marcaEl   = document.getElementById('estoqueItemMarca');
        const modeloEl  = document.getElementById('estoqueItemModelo');
        const unidadeEl = document.getElementById('estoqueItemUnidade');
        const qtdEl     = document.getElementById('estoqueItemQtd');

        if (nomeEl)    nomeEl.value    = origem.nome || '';
        if (marcaEl)   marcaEl.value   = origem.marca || '';
        if (modeloEl)  modeloEl.value  = origem.modelo || '';
        if (unidadeEl) unidadeEl.value = origem.unidade || 'un';
        if (qtdEl)     qtdEl.value     = '0';

        // Marca como criação forçada (não mescla com item de mesmo nome)
        const forceEl = document.getElementById('estoqueItemForceNew');
        if (forceEl) forceEl.value = '1';

        // Muda o título do modal para indicar duplicação
        const titulo = document.querySelector('.material-modal-content-small .material-modal-header h3');
        if (titulo) titulo.innerHTML = '<i class="fas fa-copy" style="margin-right:8px;"></i>Duplicar Item';

        if (nomeEl) { nomeEl.select(); nomeEl.focus(); }
    }, 120);
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
window.duplicarItemEstoque = duplicarItemEstoque;
window.inicializarEstoque = inicializarEstoque;
