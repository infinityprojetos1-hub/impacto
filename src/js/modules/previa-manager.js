// =============================================
// GERENCIADOR DE PRÉVIA DE MATERIAL POR IGREJA
// =============================================

// Materiais iniciais por igreja: { "id_nome": [{nome, quantidade}] }
let previaMateriais = {};
let abaAtivaPrevia = 'pendentes';

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

// Retorna igrejas por categoria (espelha as listas do Material)
function _obterIgrejasPrevia(tipo) {
    if (typeof materialData === 'undefined') return [];
    if (tipo === 'pendentes')     return materialData.pendentes     || [];
    if (tipo === 'arquivados')    return materialData.enviadas      || [];
    if (tipo === 'pedidosSandro') return materialData.pedidosSandro || [];
    return [];
}

// Converte tipo da Prévia para o tipo interno do Material
function _tipoMaterial(tipoPreviа) {
    return tipoPreviа === 'arquivados' ? 'enviadas' : tipoPreviа;
}

// Wrappers de mover que atualizam a Prévia após a ação
window._previaMoverParaPendentes = function(tipo, index) {
    if (typeof moverParaPendentes === 'function') moverParaPendentes(_tipoMaterial(tipo), index);
    _mostrarListaPrevia(abaAtivaPrevia);
};
window._previaMoverParaArquivados = function(tipo, index) {
    if (typeof moverParaEnviadas === 'function') moverParaEnviadas(_tipoMaterial(tipo), index);
    _mostrarListaPrevia(abaAtivaPrevia);
};
window._previaMoverParaSandro = function(tipo, index) {
    if (typeof moverParaSandro === 'function') moverParaSandro(_tipoMaterial(tipo), index);
    _mostrarListaPrevia(abaAtivaPrevia);
};

// Gera lista de necessidade: o que falta no estoque
function calcularNecessidade(materiaisIniciais) {
    const itensEstoque = (typeof obterItensEstoque === 'function') ? obterItensEstoque() : [];

    return materiaisIniciais.map(item => {
        const nomeLower = String(item.nome || '').trim().toLowerCase();
        const itemEstoque = itensEstoque.find(e => String(e.nome || '').trim().toLowerCase() === nomeLower);
        const emEstoque   = itemEstoque ? (parseInt(itemEstoque.quantidade, 10) || 0) : 0;
        const necessario  = parseInt(item.quantidade, 10) || 0;
        return { nome: item.nome, necessario, emEstoque, pedirFornecedor: Math.max(0, necessario - emEstoque) };
    });
}

// ── Renderização principal ────────────────────────────────────────────────────
function renderizarAbaPrevia() {
    const container = document.getElementById('previaContainer');
    if (!container) return;

    carregarPreviaMateriais();

    const countPendentes  = (materialData && materialData.pendentes     ? materialData.pendentes.length     : 0);
    const countArquivados = (materialData && materialData.enviadas       ? materialData.enviadas.length       : 0);
    const countSandro     = (materialData && materialData.pedidosSandro  ? materialData.pedidosSandro.length  : 0);

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
            <div class="material-tabs">
                <button class="material-tab-button ${abaAtivaPrevia === 'pendentes' ? 'active' : ''}" data-previa-tipo="pendentes">
                    <i class="fas fa-clock"></i> Pendentes (${countPendentes})
                </button>
                <button class="material-tab-button ${abaAtivaPrevia === 'arquivados' ? 'active' : ''}" data-previa-tipo="arquivados">
                    <i class="fas fa-archive"></i> Arquivados (${countArquivados})
                </button>
                <button class="material-tab-button ${abaAtivaPrevia === 'pedidosSandro' ? 'active' : ''}" data-previa-tipo="pedidosSandro">
                    <i class="fas fa-user"></i> Sandro (${countSandro})
                </button>
            </div>
            <button onclick="renderizarAbaPrevia()" class="btn-primary" title="Atualizar lista">
                <i class="fas fa-sync-alt"></i> Atualizar
            </button>
        </div>
        <div class="previa-content-container"></div>`;

    // Eventos das sub-abas (com suporte a touch igual ao Material)
    const tabBtns = container.querySelectorAll('.material-tab-button[data-previa-tipo]');
    tabBtns.forEach(btn => {
        function ativar() {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            abaAtivaPrevia = btn.getAttribute('data-previa-tipo');
            _mostrarListaPrevia(abaAtivaPrevia);
        }
        let _th = false, _tx = 0, _ty = 0;
        btn.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; _th = false; }, { passive: true });
        btn.addEventListener('touchend', e => {
            if (Math.abs(e.changedTouches[0].clientX - _tx) < 15 && Math.abs(e.changedTouches[0].clientY - _ty) < 15) {
                _th = true; ativar(); setTimeout(() => { _th = false; }, 500);
            }
        }, { passive: true });
        btn.addEventListener('click', () => { if (_th) return; ativar(); });
    });

    _mostrarListaPrevia(abaAtivaPrevia);
}

// ── Lista de igrejas por sub-aba ──────────────────────────────────────────────
function _mostrarListaPrevia(tipo) {
    const contentContainer = document.querySelector('.previa-content-container');
    if (!contentContainer) return;

    const igrejas = _obterIgrejasPrevia(tipo);

    if (igrejas.length === 0) {
        contentContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhuma igreja nesta categoria</h3>
                <p>As igrejas aparecem aqui conforme o status na aba <strong>Material</strong>.</p>
            </div>`;
        return;
    }

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
        const materiais   = previaMateriais[chave] || [];
        const necessidade = calcularNecessidade(materiais);
        const totalPedir  = necessidade.reduce((s, i) => s + i.pedirFornecedor, 0);
        const totalItens  = materiais.length;

        let statusClass, statusText;
        if (totalItens === 0) {
            statusClass = 'status-nao-enviado';
            statusText  = 'Sem lista';
        } else if (totalPedir > 0) {
            statusClass = 'status-nao-enviado';
            statusText  = `${totalPedir} a pedir`;
        } else {
            statusClass = 'status-enviado';
            statusText  = 'Estoque OK';
        }

        const linha = document.createElement('div');
        linha.className = 'material-row material-row-clicavel';
        linha.style.cursor = 'pointer';
        linha.setAttribute('role', 'button');
        linha.setAttribute('tabindex', '0');

        const chaveEsc = chave.replace(/'/g, "\\'");
        const nomeEsc  = (ig.nome || '').replace(/'/g, "\\'");
        const idxNum   = igrejas.indexOf(ig);

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
                ${tipo !== 'pendentes' ? `
                <button class="btn-icon btn-warning"
                    onclick="event.stopPropagation(); _previaMoverParaPendentes('${tipo}', ${idxNum})"
                    title="Mover para Pendentes" data-label-mobile="Pendentes">
                    <i class="fas fa-clock"></i>
                </button>` : ''}
                ${tipo !== 'arquivados' ? `
                <button class="btn-icon btn-success"
                    onclick="event.stopPropagation(); _previaMoverParaArquivados('${tipo}', ${idxNum})"
                    title="Mover para Arquivados" data-label-mobile="Arquivados">
                    <i class="fas fa-archive"></i>
                </button>` : ''}
                ${tipo !== 'pedidosSandro' ? `
                <button class="btn-icon btn-secondary"
                    onclick="event.stopPropagation(); _previaMoverParaSandro('${tipo}', ${idxNum})"
                    title="Mover para Sandro" data-label-mobile="Sandro">
                    <i class="fas fa-user"></i>
                </button>` : ''}
                <button class="btn-primary"
                    onclick="event.stopPropagation(); abrirModalPrevia('${chaveEsc}','${nomeEsc}')">
                    <i class="fas fa-clipboard-list"></i> Ver Prévia
                </button>
            </div>`;

        linha.addEventListener('click', e => {
            if (!e.target.closest('.material-col-acoes')) abrirModalPrevia(chave, ig.nome);
        });
        linha.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.material-col-acoes')) {
                e.preventDefault(); abrirModalPrevia(chave, ig.nome);
            }
        });

        tabela.appendChild(linha);
    });

    contentContainer.innerHTML = '';
    contentContainer.appendChild(tabela);
}

// ── Modal principal (igual ao abrirModalMaterial) ────────────────────────────
window.abrirModalPrevia = function(chave, nomeIgreja) {
    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.id = 'previaModalPrincipal';
    modal.innerHTML = `
        <div class="material-modal-content" style="animation: modalSlideIn 0.3s ease;">
            <div class="material-modal-header">
                <h3><i class="fas fa-clipboard-list" style="margin-right:10px;"></i>Prévia de Material — ${nomeIgreja}</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-body">
                <div id="previaComparacaoContainer"></div>
                <div class="material-actions">
                    <button class="btn-success" onclick="_previaAbrirAdicionarItem('${chave.replace(/'/g,"\\'")}')">
                        <i class="fas fa-plus"></i> Adicionar Item
                    </button>
                </div>
                <div id="previaListaItensModal_${chave.replace(/[^a-z0-9]/gi,'_')}" class="material-lista"></div>
            </div>
        </div>`;

    document.body.appendChild(modal);
    _previaAtualizarComparacao(chave);
    _previaAtualizarListaModal(chave);
};

// Tabela de comparação com estoque (dentro do modal principal)
function _previaAtualizarComparacao(chave) {
    const container = document.getElementById('previaComparacaoContainer');
    if (!container) return;

    const materiais   = previaMateriais[chave] || [];
    const necessidade = calcularNecessidade(materiais);
    const totalPedir  = necessidade.reduce((s, i) => s + i.pedirFornecedor, 0);

    if (necessidade.length === 0) {
        container.innerHTML = '';
        return;
    }

    const badge = totalPedir > 0
        ? `<div style="background:#ffebee;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#c62828;"><i class="fas fa-exclamation-triangle"></i> <strong>${totalPedir} item(s)</strong> precisam ser pedidos ao fornecedor.</div>`
        : `<div style="background:#e8f5e9;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#2e7d32;"><i class="fas fa-check-circle"></i> Estoque suficiente para todos os itens.</div>`;

    container.innerHTML = badge + `
        <div style="overflow-x:auto;margin-bottom:16px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="background:linear-gradient(90deg,#667eea,#764ba2);color:#fff;">
                        <th style="padding:10px;text-align:left;">Material</th>
                        <th style="padding:10px;text-align:center;">Necessário</th>
                        <th style="padding:10px;text-align:center;">Em Estoque</th>
                        <th style="padding:10px;text-align:center;">Pedir Fornecedor</th>
                    </tr>
                </thead>
                <tbody>
                    ${necessidade.map(item => `
                        <tr style="border-bottom:1px solid #f0f0f0;">
                            <td style="padding:8px 10px;">${item.nome}</td>
                            <td style="padding:8px 10px;text-align:center;">${item.necessario}</td>
                            <td style="padding:8px 10px;text-align:center;font-weight:bold;color:${item.emEstoque >= item.necessario ? '#2e7d32' : '#e53935'};">${item.emEstoque}</td>
                            <td style="padding:8px 10px;text-align:center;font-weight:bold;color:${item.pedirFornecedor > 0 ? '#e53935' : '#2e7d32'};">${item.pedirFornecedor > 0 ? item.pedirFornecedor : '—'}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// Lista de itens editável dentro do modal principal
function _previaAtualizarListaModal(chave) {
    const listaId  = `previaListaItensModal_${chave.replace(/[^a-z0-9]/gi,'_')}`;
    const lista    = document.getElementById(listaId);
    if (!lista) return;

    const materiais = previaMateriais[chave] || [];

    if (materiais.length === 0) {
        lista.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>Nenhum material inicial cadastrado</h3><p>Clique em "Adicionar Item" para começar</p></div>';
        return;
    }

    lista.innerHTML = '<h4 style="color:var(--gradient-start);margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid var(--gradient-start);"><i class="fas fa-list"></i> Materiais Iniciais:</h4>';

    const tabela = document.createElement('div');
    tabela.className = 'material-items-table';

    materiais.forEach((mat, idx) => {
        const item = document.createElement('div');
        item.className = 'material-item';
        item.innerHTML = `
            <div class="material-item-info" onclick="_previaEditarItem('${chave.replace(/'/g,"\\'")}', ${idx})" style="cursor:pointer;" title="Clique para editar">
                <span class="material-item-nome"><i class="fas fa-box" style="margin-right:8px;color:var(--gradient-start);"></i>${mat.nome}</span>
                <span class="material-item-qtd"><i class="fas fa-hashtag" style="margin-right:5px;"></i>Quantidade: ${mat.quantidade}</span>
            </div>
            <button class="btn-danger" onclick="_previaRemoverItemModal('${chave.replace(/'/g,"\\'")}', ${idx})" title="Remover">
                <i class="fas fa-trash"></i>
            </button>`;
        tabela.appendChild(item);
    });

    lista.appendChild(tabela);
}

// ── Sub-modal: Adicionar Item (sem limite de estoque) ─────────────────────────
window._previaAbrirAdicionarItem = function(chave) {
    const itensEstoque = typeof obterItensEstoque === 'function' ? obterItensEstoque() : [];
    const optsEstoque  = itensEstoque.map(it =>
        `<option value="${(it.nome || '').replace(/"/g,'&quot;')}">${it.nome} (${it.quantidade} disp.)</option>`
    ).join('');
    const temEstoque = optsEstoque.length > 0;

    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small" style="animation: modalSlideIn 0.3s ease;">
            <div class="material-modal-header">
                <h3><i class="fas fa-plus-circle" style="margin-right:10px;"></i>Adicionar Item</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-form-body">
                <form id="formPreviaAdicionarItem" onsubmit="_previaConfirmarAdicionarItem(event, '${chave.replace(/'/g,"\\'")}')">
                    ${temEstoque ? `
                    <div class="form-group">
                        <label><i class="fas fa-boxes"></i> Origem:</label>
                        <select id="previaItemOrigem" onchange="_previaToggleOrigem(this.value)">
                            <option value="estoque">Do estoque (sugestão)</option>
                            <option value="livre">Digitar manualmente</option>
                        </select>
                    </div>` : ''}
                    <div class="form-group" id="previGrupoEstoque" style="${temEstoque ? '' : 'display:none'}">
                        <label><i class="fas fa-tag"></i> Item do estoque:</label>
                        <select id="previaItemEstoqueSelect">
                            <option value="">Selecione...</option>
                            ${optsEstoque}
                        </select>
                    </div>
                    <div class="form-group" id="previaGrupoLivre" style="${temEstoque ? 'display:none' : ''}">
                        <label><i class="fas fa-tag"></i> Item:</label>
                        <input type="text" id="previaItemNome" placeholder="Ex: Cabo HDMI">
                    </div>
                    <div class="form-group">
                        <label for="previaItemQtd"><i class="fas fa-sort-numeric-up"></i> Quantidade necessária:</label>
                        <input type="number" id="previaItemQtd" placeholder="Ex: 5" min="1" required>
                    </div>
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-check"></i> Adicionar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()"><i class="fas fa-times"></i> Cancelar</button>
                    </div>
                </form>
            </div>
        </div>`;

    document.body.appendChild(modal);
    setTimeout(() => {
        const sel = document.getElementById('previaItemEstoqueSelect');
        const inp = document.getElementById('previaItemNome');
        if (sel && sel.closest('[style]') && !sel.closest('[style]').style.display.includes('none')) sel.focus();
        else if (inp) inp.focus();
    }, 100);
};

window._previaToggleOrigem = function(valor) {
    const grupoEstoque = document.getElementById('previGrupoEstoque');
    const grupoLivre   = document.getElementById('previaGrupoLivre');
    const selEstoque   = document.getElementById('previaItemEstoqueSelect');
    const inpLivre     = document.getElementById('previaItemNome');
    if (valor === 'estoque') {
        if (grupoEstoque) grupoEstoque.style.display = '';
        if (grupoLivre)   grupoLivre.style.display   = 'none';
        if (selEstoque)   { selEstoque.required = true;  selEstoque.focus(); }
        if (inpLivre)     { inpLivre.required = false;   inpLivre.value = ''; }
    } else {
        if (grupoEstoque) grupoEstoque.style.display = 'none';
        if (grupoLivre)   grupoLivre.style.display   = '';
        if (selEstoque)   { selEstoque.required = false; selEstoque.value = ''; }
        if (inpLivre)     { inpLivre.required = true;    inpLivre.focus(); }
    }
};

window._previaConfirmarAdicionarItem = function(event, chave) {
    event.preventDefault();
    const origemEl = document.getElementById('previaItemOrigem');
    const qtd      = parseInt(document.getElementById('previaItemQtd').value, 10) || 0;
    if (qtd < 1) return;

    let nome = '';
    if (origemEl && origemEl.value === 'estoque') {
        const sel = document.getElementById('previaItemEstoqueSelect');
        nome = sel ? sel.value.trim() : '';
    } else {
        const inp = document.getElementById('previaItemNome');
        nome = inp ? inp.value.trim() : '';
    }
    if (!nome) return;

    if (!previaMateriais[chave]) previaMateriais[chave] = [];
    const existente = previaMateriais[chave].findIndex(i => i.nome.toLowerCase() === nome.toLowerCase());
    if (existente >= 0) {
        previaMateriais[chave][existente].quantidade = (parseInt(previaMateriais[chave][existente].quantidade, 10) || 0) + qtd;
    } else {
        previaMateriais[chave].push({ nome, quantidade: qtd });
    }

    salvarPreviaMateriais();
    event.target.closest('.material-modal').remove();
    _previaAtualizarComparacao(chave);
    _previaAtualizarListaModal(chave);
    _mostrarListaPrevia(abaAtivaPrevia);
};

// ── Sub-modal: Editar Item ─────────────────────────────────────────────────────
window._previaEditarItem = function(chave, idx) {
    const mat = (previaMateriais[chave] || [])[idx];
    if (!mat) return;

    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small" style="animation: modalSlideIn 0.3s ease;">
            <div class="material-modal-header">
                <h3><i class="fas fa-edit" style="margin-right:10px;"></i>Editar Item</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            <div class="material-modal-form-body">
                <form id="formPreviaEditarItem" onsubmit="_previaConfirmarEditar(event, '${chave.replace(/'/g,"\\'")}', ${idx})">
                    <div class="form-group">
                        <label for="previaEditNome"><i class="fas fa-tag"></i> Item:</label>
                        <input type="text" id="previaEditNome" value="${mat.nome}" placeholder="Ex: Cabo HDMI" required>
                    </div>
                    <div class="form-group">
                        <label for="previaEditQtd"><i class="fas fa-sort-numeric-up"></i> Quantidade necessária:</label>
                        <input type="number" id="previaEditQtd" value="${mat.quantidade}" min="1" required>
                    </div>
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Salvar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()"><i class="fas fa-times"></i> Cancelar</button>
                    </div>
                </form>
            </div>
        </div>`;

    document.body.appendChild(modal);
    setTimeout(() => {
        const el = document.getElementById('previaEditNome');
        if (el) { el.focus(); el.select(); }
    }, 100);
};

window._previaConfirmarEditar = function(event, chave, idx) {
    event.preventDefault();
    const nome = document.getElementById('previaEditNome').value.trim();
    const qtd  = parseInt(document.getElementById('previaEditQtd').value, 10) || 0;
    if (!nome || qtd < 1) return;

    if (!previaMateriais[chave]) previaMateriais[chave] = [];
    previaMateriais[chave][idx] = { nome, quantidade: qtd };

    salvarPreviaMateriais();
    event.target.closest('.material-modal').remove();
    _previaAtualizarComparacao(chave);
    _previaAtualizarListaModal(chave);
    _mostrarListaPrevia(abaAtivaPrevia);
};

window._previaRemoverItemModal = function(chave, idx) {
    if (!confirm('Deseja remover este item?')) return;
    if (!previaMateriais[chave]) return;
    previaMateriais[chave].splice(idx, 1);
    salvarPreviaMateriais();
    _previaAtualizarComparacao(chave);
    _previaAtualizarListaModal(chave);
    _mostrarListaPrevia(abaAtivaPrevia);
};

// ── Helpers expostos para o Material Manager ─────────────────────────────────
// Retorna sugestões da Prévia para uma igreja (chave = "id_nome")
window.obterSugestoesPrevia = function(chave) {
    return (previaMateriais[chave] || []).map((item, idx) => ({ ...item, _idx: idx }));
};

// Remove uma sugestão da Prévia pelo índice
window.removerSugestaoPrevia = function(chave, idx) {
    if (!previaMateriais[chave]) return;
    previaMateriais[chave].splice(idx, 1);
    salvarPreviaMateriais();
};

// Constrói a chave da Prévia a partir de um objeto igreja (igual ao _chaveIgreja)
window.chavePrevia = function(igreja) {
    return `${igreja.id}_${igreja.nome}`;
};

function inicializarPrevia() {
    carregarPreviaMateriais();
}

window.renderizarAbaPrevia = renderizarAbaPrevia;
window.inicializarPrevia   = inicializarPrevia;
