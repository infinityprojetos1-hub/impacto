// Gerenciador de Material para Igrejas

// Estrutura de dados para materiais
let materialData = {
    pendentes: [], // Igrejas com status "Não Enviado"
    enviadas: [],  // Igrejas com status "Enviado"
    pedidosSandro: [] // Pedidos do Sandro
};

// Flag: impede salvar no Firebase durante o carregamento inicial
let _materialCarregando = false;

// Carrega os dados do localStorage
function carregarDadosMaterial() {
    _materialCarregando = true;
    try {
        const dadosSalvos = localStorage.getItem('materiaisIgrejas');
        if (dadosSalvos) {
            materialData = JSON.parse(dadosSalvos);

            // Garante que a estrutura básica existe
            if (!materialData.pendentes) materialData.pendentes = [];
            if (!materialData.enviadas) materialData.enviadas = [];
            if (!materialData.pedidosSandro) materialData.pedidosSandro = [];

            console.log('Dados de material carregados:', materialData);

            // Migra dados antigos para o JSON das Notas Fiscais
            migrarDadosParaNF();
        } else {
            materialData = { pendentes: [], enviadas: [], pedidosSandro: [] };
        }

        // Sincroniza com as igrejas das Notas Fiscais
        sincronizarIgrejasNF();
        atualizarListaMaterial();
    } catch (error) {
        console.error('Erro ao carregar dados de material:', error);
        materialData = { pendentes: [], enviadas: [], pedidosSandro: [] };
    } finally {
        _materialCarregando = false;
    }
}

// Migra dados antigos para o JSON das Notas Fiscais (executa uma vez)
function migrarDadosParaNF() {
    try {
        const nfDataStr = localStorage.getItem('notasFiscais');
        if (!nfDataStr) return;

        const nfData = JSON.parse(nfDataStr);
        if (!nfData.igrejas) return;

        let houveAlteracao = false;

        // Percorre todas as igrejas do NF
        nfData.igrejas.forEach(igrejaNF => {
            // Procura a igreja nas abas de material
            let igrejaComMaterial = null;
            let statusMaterial = null;

            const pendente = materialData.pendentes.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);
            const enviada = materialData.enviadas.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);
            const sandro = materialData.pedidosSandro.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);

            if (pendente) {
                igrejaComMaterial = pendente;
                statusMaterial = 'pendente';
            } else if (enviada) {
                igrejaComMaterial = enviada;
                statusMaterial = 'enviado';
            } else if (sandro) {
                igrejaComMaterial = sandro;
                statusMaterial = 'sandro';
            }

            // Se encontrou e tem materiais, migra para o NF
            if (igrejaComMaterial && igrejaComMaterial.materiais && igrejaComMaterial.materiais.length > 0) {
                // Só migra se ainda não tiver materiais salvos no NF
                if (!igrejaNF.materiais || igrejaNF.materiais.length === 0) {
                    igrejaNF.materiais = igrejaComMaterial.materiais;
                    igrejaNF.statusMaterial = statusMaterial;
                    houveAlteracao = true;
                    console.log('Migrado materiais de:', igrejaNF.nome);
                }
            }
        });

        // Salva o JSON atualizado se houve migração
        if (houveAlteracao) {
            localStorage.setItem('notasFiscais', JSON.stringify(nfData));
            console.log('Migração de dados concluída!');
        }
    } catch (error) {
        console.error('Erro ao migrar dados:', error);
    }
}

// Salva os dados no localStorage E integra com Notas Fiscais
function salvarDadosMaterial() {
    try {
        // Marca timestamp para resolver conflitos
        materialData._ts = Date.now();
        if (typeof window !== 'undefined') window._materialSalvouTs = Date.now();

        // Salva no localStorage próprio
        localStorage.setItem('materiaisIgrejas', JSON.stringify(materialData));

        // Salva no Firebase imediatamente (sempre automático, exceto no carregamento inicial)
        if (!_materialCarregando && typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            if (typeof window._piscarBadgeSync === 'function') window._piscarBadgeSync();
            const _ts = materialData._ts;
            salvarNoDatabase('dados/materiais', materialData)
                .then(() => {
                    console.log('✅ Material salvo no Firebase');
                    if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('materiaisIgrejas', _ts);
                })
                .catch(err => console.warn('⚠️ Material não salvo no Firebase:', err));
        }

        // Integra com o JSON das Notas Fiscais
        const nfDataStr = localStorage.getItem('notasFiscais');
        if (nfDataStr) {
            const nfLocal = JSON.parse(nfDataStr);

            // Atualiza cada igreja no NF com os dados de material
            if (nfLocal.igrejas) {
                nfLocal.igrejas.forEach(igrejaNF => {
                    let igrejaComMaterial = null;
                    let statusMaterial = 'pendente';

                    const pendente = materialData.pendentes.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);
                    const enviada = materialData.enviadas.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);
                    const sandro = materialData.pedidosSandro.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);

                    if (pendente) { igrejaComMaterial = pendente; statusMaterial = 'pendente'; }
                    else if (enviada) { igrejaComMaterial = enviada; statusMaterial = 'enviado'; }
                    else if (sandro) { igrejaComMaterial = sandro; statusMaterial = 'sandro'; }

                    if (igrejaComMaterial) {
                        igrejaNF.materiais = igrejaComMaterial.materiais || [];
                        igrejaNF.statusMaterial = statusMaterial;
                    }
                });
            }

            // Mantém o _ts original do NF para não interferir no conflito de sincronização entre dispositivos
            // O NF tem seu próprio controle de versão via salvarDadosNF() e forcarSyncParaFirebase()

            // Salva o NF atualizado no localStorage e sincroniza o objeto global em memória
            localStorage.setItem('notasFiscais', JSON.stringify(nfLocal));
            if (typeof nfData !== 'undefined' && nfData && nfLocal.igrejas) {
                nfData.igrejas    = nfLocal.igrejas;
                nfData.arquivadas = nfLocal.arquivadas || nfData.arquivadas;
                nfData.especiais  = nfLocal.especiais  || nfData.especiais;
                nfData._ts        = nfLocal._ts;
            }
            // NF no Firebase é sincronizado via forcarSyncParaFirebase() (automático a cada 15s)
            // Não salvamos NF no Firebase aqui para não sobrescrever com timestamp de material
        }
    } catch (error) {
        console.error('❌ Erro ao salvar dados de material:', error);
    }
}

// Sincroniza a lista de igrejas com as Notas Fiscais
function sincronizarIgrejasNF() {
    try {
        const nfDataStr = localStorage.getItem('notasFiscais');
        if (!nfDataStr) return;

        const nfData = JSON.parse(nfDataStr);
        const igrejasNF = nfData.igrejas || [];
        // Inclui arquivadas e especiais para não remover do Material ao arquivar
        const todasIgrejasNF = [
            ...igrejasNF,
            ...(nfData.arquivadas || []),
            ...(nfData.especiais || [])
        ];

        let houveMudanca = false;

        // PASSO 1: Remover igrejas do Material apenas quando forem excluídas de todas as listas NF
        ['pendentes', 'enviadas', 'pedidosSandro'].forEach(categoria => {
            const antes = materialData[categoria].length;
            materialData[categoria] = materialData[categoria].filter(igrejaMat => {
                const aindaExiste = todasIgrejasNF.some(igrejaNF =>
                    igrejaNF.nome === igrejaMat.nome && igrejaNF.id === igrejaMat.id
                );
                if (!aindaExiste) {
                    console.log(`🗑️ Removendo igreja "${igrejaMat.nome}" (ID: ${igrejaMat.id}) do Material - excluída das NFs`);
                }
                return aindaExiste;
            });
            if (materialData[categoria].length !== antes) houveMudanca = true;
        });

        // PASSO 2: Adiciona igrejas ativas e especiais que estão em NF mas não em Material
        const igrejasParaMaterial = [...igrejasNF, ...(nfData.especiais || [])];
        igrejasParaMaterial.forEach(igrejaNF => {
            const jaExistePendente = materialData.pendentes.find(
                ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id
            );
            const jaExisteEnviada = materialData.enviadas.find(
                ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id
            );
            const jaExisteSandro = materialData.pedidosSandro.find(
                ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id
            );

            if (!jaExistePendente && !jaExisteEnviada && !jaExisteSandro) {
                const statusMaterial = igrejaNF.statusMaterial || 'pendente';
                const materiaisSalvos = igrejaNF.materiais || [];
                const novaIgreja = {
                    nome: igrejaNF.nome,
                    id: igrejaNF.id || '',
                    link: igrejaNF.link || '',
                    materiais: materiaisSalvos
                };
                if (statusMaterial === 'enviado') {
                    materialData.enviadas.push(novaIgreja);
                } else if (statusMaterial === 'sandro') {
                    materialData.pedidosSandro.push(novaIgreja);
                } else {
                    materialData.pendentes.push(novaIgreja);
                }
                console.log(`➕ Nova igreja adicionada ao Material: "${novaIgreja.nome}" (ID: ${novaIgreja.id})`);
                houveMudanca = true;
            }
        });

        // Só persiste e envia ao Firebase se algo realmente mudou
        if (houveMudanca) salvarDadosMaterial();
    } catch (error) {
        console.error('Erro ao sincronizar igrejas:', error);
    }
}

// Variável para rastrear a aba ativa atual
let abaAtivaMaterial = 'pendentes';

// Evita re-render desnecessário (mantém hover, reduz custo)
let _materialLastRenderHash = '';
function atualizarListaMaterial() {
    const container = document.getElementById('materialList');
    if (!container) return;
    const hash = (materialData._ts || 0) + '-' + (materialData.pendentes||[]).length + ':' + (materialData.enviadas||[]).length + ':' + (materialData.pedidosSandro||[]).length;
    if (hash === _materialLastRenderHash) return;
    _materialLastRenderHash = hash;

    container.innerHTML = '';

    // Conta as igrejas em cada categoria
    const countPendentes = (materialData.pendentes || []).length;
    const countEnviadas = (materialData.enviadas || []).length;
    const countSandro = (materialData.pedidosSandro || []).length;

    // Cria as tabs com botão de atualizar
    const tabsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div class="material-tabs">
                <button class="material-tab-button ${abaAtivaMaterial === 'pendentes' ? 'active' : ''}" data-tipo="pendentes">
                    <i class="fas fa-clock"></i> Pendentes (${countPendentes})
                </button>
                <button class="material-tab-button ${abaAtivaMaterial === 'enviadas' ? 'active' : ''}" data-tipo="enviadas">
                    <i class="fas fa-check-circle"></i> Enviadas (${countEnviadas})
                </button>
                <button class="material-tab-button ${abaAtivaMaterial === 'pedidosSandro' ? 'active' : ''}" data-tipo="pedidosSandro">
                    <i class="fas fa-user"></i> Sandro (${countSandro})
                </button>
            </div>
            <button onclick="recarregarMateriais()" class="btn-primary" title="Atualizar lista de igrejas">
                <i class="fas fa-sync-alt"></i> Atualizar
            </button>
        </div>
        <div class="material-content-container"></div>
    `;

    container.innerHTML = tabsHTML;

    // Adiciona eventos aos botões de tabs (com touchend para Android/MIUI)
    const tabButtons = container.querySelectorAll('.material-tab-button');
    tabButtons.forEach(btn => {
        function ativarTabMaterial() {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tipo = btn.getAttribute('data-tipo');
            abaAtivaMaterial = tipo;
            mostrarListaTipo(tipo);
        }

        let _touchHandled = false;
        let _tx = 0, _ty = 0;
        btn.addEventListener('touchstart', (e) => { _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; _touchHandled = false; }, { passive: true });
        btn.addEventListener('touchend', (e) => {
            const dx = Math.abs(e.changedTouches[0].clientX - _tx);
            const dy = Math.abs(e.changedTouches[0].clientY - _ty);
            if (dx < 15 && dy < 15) { _touchHandled = true; ativarTabMaterial(); setTimeout(() => { _touchHandled = false; }, 500); }
        }, { passive: true });
        btn.addEventListener('click', () => { if (_touchHandled) return; ativarTabMaterial(); });
    });

    // Mostra a lista da aba ativa atual
    mostrarListaTipo(abaAtivaMaterial);
}

// Mostra a lista de um tipo específico
function mostrarListaTipo(tipo) {
    const contentContainer = document.querySelector('.material-content-container');
    if (!contentContainer) return;

    contentContainer.innerHTML = '';

    const dados = materialData[tipo] || [];

    if (dados.length === 0) {
        contentContainer.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Nenhuma igreja nesta categoria</h3><p>Adicione igrejas através das Notas Fiscais</p></div>';
        return;
    }

    // Cria a tabela
    const tabela = document.createElement('div');
    tabela.className = 'material-table';
    tabela.innerHTML = `
        <div class="material-header">
            <div class="material-col-igreja"><i class="fas fa-church"></i> Igreja</div>
            <div class="material-col-status-header"><i class="fas fa-clipboard-check"></i> Status</div>
            <div class="material-col-acoes"><i class="fas fa-cog"></i> Ações</div>
        </div>
    `;

    dados.forEach((igreja, index) => {
        const linha = document.createElement('div');
        linha.className = 'material-row material-row-clicavel';
        linha.style.cursor = 'pointer';
        linha.setAttribute('role', 'button');
        linha.setAttribute('tabindex', '0');
        linha.setAttribute('title', 'Clique para gerenciar material');
        linha.addEventListener('click', (e) => {
            if (!e.target.closest('.material-col-acoes')) {
                e.preventDefault();
                abrirModalMaterial(tipo, index);
            }
        });
        linha.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!e.target.closest('.material-col-acoes')) abrirModalMaterial(tipo, index);
            }
        });

        const totalItens = igreja.materiais ? igreja.materiais.length : 0;

        // Define o status baseado na categoria
        let statusClass, statusText;
        if (tipo === 'pendentes') {
            statusClass = 'status-nao-enviado';
            statusText = 'Não Enviado';
        } else if (tipo === 'enviadas') {
            statusClass = 'status-enviado';
            statusText = 'Enviado';
        } else {
            statusClass = 'status-sandro';
            statusText = 'Sandro';
        }

        linha.innerHTML = `
            <div class="material-col-igreja">
                <strong><i class="fas fa-church" style="margin-right: 8px; color: var(--gradient-start);"></i>${igreja.nome}</strong>
                ${igreja.id ? `<span class="material-id"><i class="fas fa-tag"></i> ID: ${igreja.id}</span>` : ''}
                ${totalItens > 0 ? `<span class="material-count"><i class="fas fa-boxes"></i> ${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</span>` : ''}
            </div>
            <div class="material-col-status">
                <span class="material-status ${statusClass}">${statusText}</span>
            </div>
            <div class="material-col-acoes" onclick="event.stopPropagation()">
                ${tipo !== 'pendentes' ? `<button class="btn-icon btn-warning" onclick="event.stopPropagation(); moverParaPendentes('${tipo}', ${index})" title="Mover para Pendentes" data-label-mobile="Pendentes">
                    <i class="fas fa-clock"></i>
                </button>` : ''}
                ${tipo !== 'enviadas' ? `<button class="btn-icon btn-success" onclick="event.stopPropagation(); moverParaEnviadas('${tipo}', ${index})" title="Mover para Enviadas" data-label-mobile="Enviadas">
                    <i class="fas fa-check"></i>
                </button>` : ''}
                ${tipo !== 'pedidosSandro' ? `<button class="btn-icon btn-secondary" onclick="event.stopPropagation(); moverParaSandro('${tipo}', ${index})" title="Mover para Sandro" data-label-mobile="Sandro">
                    <i class="fas fa-user"></i>
                </button>` : ''}
                <button class="btn-icon" onclick="event.stopPropagation(); compartilharWhatsApp('${tipo}', ${index})" title="Compartilhar no WhatsApp" style="background:#25D366; color:#fff; border:none; border-radius:8px; padding:8px 12px; cursor:pointer;">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn-primary" onclick="event.stopPropagation(); abrirModalMaterial('${tipo}', ${index})">
                    <i class="fas fa-box"></i> Gerenciar Material
                </button>
            </div>
        `;

        tabela.appendChild(linha);
    });

    contentContainer.appendChild(tabela);
}

// Funções para mover igrejas entre categorias
function moverParaPendentes(tipoOrigem, index) {
    const igreja = materialData[tipoOrigem][index];
    if (!igreja) return;

    materialData[tipoOrigem].splice(index, 1);
    materialData.pendentes.push(igreja);

    salvarDadosMaterial();
    atualizarListaMaterial();
}

function moverParaEnviadas(tipoOrigem, index) {
    const igreja = materialData[tipoOrigem][index];
    if (!igreja) return;

    materialData[tipoOrigem].splice(index, 1);
    materialData.enviadas.push(igreja);

    salvarDadosMaterial();
    atualizarListaMaterial();
}

function moverParaSandro(tipoOrigem, index) {
    const igreja = materialData[tipoOrigem][index];
    if (!igreja) return;

    materialData[tipoOrigem].splice(index, 1);
    materialData.pedidosSandro.push(igreja);

    salvarDadosMaterial();
    atualizarListaMaterial();
}

// Abre o modal principal para gerenciar materiais de uma igreja
function abrirModalMaterial(tipo, index) {
    const igreja = materialData[tipo][index];
    if (!igreja) return;

    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.innerHTML = `
        <div class="material-modal-content" style="animation: modalSlideIn 0.3s ease;">
            <div class="material-modal-header">
                <h3><i class="fas fa-box" style="margin-right: 10px;"></i>Gerenciar Material - ${igreja.nome}</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>

            <div class="material-modal-body">
                <!-- Sugestões da Prévia -->
                <div id="listaSugestoes_${tipo}_${index}"></div>

                <div class="material-actions">
                    <button class="btn-success" onclick="abrirModalAdicionarItem('${tipo}', ${index})">
                        <i class="fas fa-plus"></i> Adicionar Item
                    </button>
                    <button onclick="compartilharWhatsApp('${tipo}', ${index})"
                            style="background:#25D366; color:#fff; border:none; border-radius:8px;
                                   padding:10px 18px; font-size:0.9em; font-weight:600;
                                   cursor:pointer; display:flex; align-items:center; gap:8px;">
                        <i class="fab fa-whatsapp"></i> Compartilhar no WhatsApp
                    </button>
                </div>

                <div id="listaMateriais_${tipo}_${index}" class="material-lista">
                    <!-- Lista de materiais será inserida aqui -->
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    atualizarSugestoesModal(tipo, index);
    atualizarListaMaterialModal(tipo, index);
}

// Atualiza sugestões + lista de materiais dentro do modal
function atualizarListaMaterialModal(tipo, igrejaIndex) {
    const igreja = materialData[tipo][igrejaIndex];
    const lista = document.getElementById(`listaMateriais_${tipo}_${igrejaIndex}`);

    if (!lista) return;

    if (!igreja.materiais || igreja.materiais.length === 0) {
        lista.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>Nenhum material adicionado</h3><p>Clique em "Adicionar Item" para começar</p></div>';
        return;
    }

    lista.innerHTML = '<h4 style="color: var(--gradient-start); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--gradient-start);"><i class="fas fa-list"></i> Materiais Adicionados:</h4>';

    const tabelaMateriais = document.createElement('div');
    tabelaMateriais.className = 'material-items-table';

    igreja.materiais.forEach((material, materialIndex) => {
        const item = document.createElement('div');
        item.className = 'material-item';
        item.innerHTML = `
            <div class="material-item-info" onclick="editarMaterial('${tipo}', ${igrejaIndex}, ${materialIndex})" style="cursor: pointer;" title="Clique para editar">
                <span class="material-item-nome"><i class="fas fa-box" style="margin-right: 8px; color: var(--gradient-start);"></i>${material.item}</span>
                <span class="material-item-qtd"><i class="fas fa-hashtag" style="margin-right: 5px;"></i>Quantidade: ${material.quantidade}</span>
            </div>
            <button class="btn-danger" onclick="removerMaterial('${tipo}', ${igrejaIndex}, ${materialIndex})" title="Remover">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tabelaMateriais.appendChild(item);
    });

    lista.appendChild(tabelaMateriais);
}

// Abre o modal secundário para adicionar um item
function abrirModalAdicionarItem(tipo, igrejaIndex) {
    const itensEstoque = typeof obterItensEstoque === 'function' ? obterItensEstoque() : [];
    const optsEstoque = itensEstoque.map((it, i) =>
        `<option value="${(it.nome || '').replace(/"/g, '&quot;')}" data-qtd="${it.quantidade}">${it.nome} (${it.quantidade} disp.)</option>`
    ).join('');
    const temEstoque = optsEstoque.length > 0;

    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small" style="animation: modalSlideIn 0.3s ease;">
            <div class="material-modal-header">
                <h3><i class="fas fa-plus-circle" style="margin-right: 10px;"></i>Adicionar Item</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            
            <div class="material-modal-form-body">
                <form id="formAdicionarItem" onsubmit="adicionarItem(event, '${tipo}', ${igrejaIndex})">
                    ${temEstoque ? `<div class="form-group" id="grupoOrigemItem">
                        <label><i class="fas fa-boxes"></i> Origem:</label>
                        <select id="itemOrigem" onchange="toggleItemOrigem(this.value)">
                            <option value="estoque">Do estoque</option>
                            <option value="livre">Digitar manualmente</option>
                        </select>
                    </div>` : ''}
                    <div class="form-group" id="grupoItemEstoque" style="${temEstoque ? '' : 'display:none'}">
                        <label><i class="fas fa-tag"></i> Item do estoque:</label>
                        <select id="itemEstoqueSelect">
                            <option value="">Selecione...</option>
                            ${optsEstoque}
                        </select>
                    </div>
                    <div class="form-group" id="grupoItemLivre" style="${temEstoque ? 'display:none' : ''}">
                        <label><i class="fas fa-tag"></i> Item:</label>
                        <input type="text" id="itemNome" placeholder="Ex: Cabo HDMI">
                    </div>
                    <div class="form-group">
                        <label for="itemQuantidade"><i class="fas fa-sort-numeric-up"></i> Quantidade:</label>
                        <input type="number" id="itemQuantidade" placeholder="Ex: 5" min="1" required>
                    </div>
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-check"></i> Adicionar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()"><i class="fas fa-times"></i> Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        const origem = document.getElementById('itemOrigem');
        if (origem && origem.value === 'estoque') document.getElementById('itemEstoqueSelect').focus();
        else document.getElementById('itemNome').focus();
    }, 100);
}

function toggleItemOrigem(valor) {
    const grupoEstoque = document.getElementById('grupoItemEstoque');
    const grupoLivre = document.getElementById('grupoItemLivre');
    const selEstoque = document.getElementById('itemEstoqueSelect');
    const inpLivre = document.getElementById('itemNome');
    if (valor === 'estoque') {
        if (grupoEstoque) grupoEstoque.style.display = '';
        if (grupoLivre) grupoLivre.style.display = 'none';
        if (selEstoque) { selEstoque.required = true; selEstoque.value = selEstoque.options[1] ? selEstoque.options[1].value : ''; }
        if (inpLivre) { inpLivre.required = false; inpLivre.value = ''; }
    } else {
        if (grupoEstoque) grupoEstoque.style.display = 'none';
        if (grupoLivre) grupoLivre.style.display = '';
        if (selEstoque) { selEstoque.required = false; selEstoque.value = ''; }
        if (inpLivre) inpLivre.required = true;
    }
}

// Adiciona um item à lista de materiais
function adicionarItem(event, tipo, igrejaIndex) {
    event.preventDefault();

    const origem = document.getElementById('itemOrigem');
    let item = '';
    const quantidade = document.getElementById('itemQuantidade').value.trim();
    if (!quantidade) return;

    if (origem && origem.value === 'estoque') {
        const sel = document.getElementById('itemEstoqueSelect');
        item = sel ? sel.value.trim() : '';
        if (!item) return;
        if (typeof temEstoqueSuficiente === 'function' && !temEstoqueSuficiente(item, quantidade)) {
            alert('Quantidade insuficiente no estoque.');
            return;
        }
    } else {
        item = document.getElementById('itemNome').value.trim();
        if (!item) return;
    }

    const igreja = materialData[tipo][igrejaIndex];
    if (!igreja.materiais) igreja.materiais = [];

    igreja.materiais.push({ item, quantidade });

    if (origem && origem.value === 'estoque' && typeof deduzirEstoque === 'function') {
        deduzirEstoque(item, quantidade);
    }

    salvarDadosMaterial();
    atualizarListaMaterialModal(tipo, igrejaIndex);
    atualizarListaMaterial();
    event.target.closest('.material-modal').remove();
}

// Edita um material da lista
function editarMaterial(tipo, igrejaIndex, materialIndex) {
    const igreja = materialData[tipo][igrejaIndex];
    const material = igreja.materiais[materialIndex];

    const modal = document.createElement('div');
    modal.className = 'material-modal material-modal-small';
    modal.innerHTML = `
        <div class="material-modal-content material-modal-content-small" style="animation: modalSlideIn 0.3s ease;">
            <div class="material-modal-header">
                <h3><i class="fas fa-edit" style="margin-right: 10px;"></i>Editar Item</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            
            <div class="material-modal-form-body">
                <form id="formEditarItem" onsubmit="salvarEdicaoMaterial(event, '${tipo}', ${igrejaIndex}, ${materialIndex})">
                    <div class="form-group">
                        <label for="itemNomeEdit"><i class="fas fa-tag"></i> Item:</label>
                        <input type="text" id="itemNomeEdit" value="${material.item}" placeholder="Ex: Cabo HDMI" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="itemQuantidadeEdit"><i class="fas fa-sort-numeric-up"></i> Quantidade:</label>
                        <input type="number" id="itemQuantidadeEdit" value="${material.quantidade}" placeholder="Ex: 5" min="1" required>
                    </div>
                    
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Salvar</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()"><i class="fas fa-times"></i> Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Foca no primeiro campo
    setTimeout(() => {
        document.getElementById('itemNomeEdit').focus();
        document.getElementById('itemNomeEdit').select();
    }, 100);
}

// Salva a edição de um material
function salvarEdicaoMaterial(event, tipo, igrejaIndex, materialIndex) {
    event.preventDefault();

    const itemNovo = document.getElementById('itemNomeEdit').value.trim();
    const quantidadeNova = document.getElementById('itemQuantidadeEdit').value.trim();
    if (!itemNovo || !quantidadeNova) return;

    const igreja = materialData[tipo][igrejaIndex];
    const materialAntigo = igreja.materiais[materialIndex];

    if (materialAntigo && typeof devolverEstoque === 'function') {
        devolverEstoque(materialAntigo.item, materialAntigo.quantidade);
    }
    if (typeof deduzirEstoque === 'function') {
        deduzirEstoque(itemNovo, quantidadeNova);
    }

    igreja.materiais[materialIndex] = { item: itemNovo, quantidade: quantidadeNova };

    salvarDadosMaterial();
    atualizarListaMaterialModal(tipo, igrejaIndex);
    atualizarListaMaterial();
    event.target.closest('.material-modal').remove();
}

// Remove um material da lista
function removerMaterial(tipo, igrejaIndex, materialIndex) {
    if (!confirm('Deseja remover este item?')) return;

    const igreja = materialData[tipo][igrejaIndex];
    if (!igreja || !igreja.materiais) return;
    const material = igreja.materiais[materialIndex];
    igreja.materiais.splice(materialIndex, 1);

    if (material && typeof devolverEstoque === 'function') {
        devolverEstoque(material.item, material.quantidade);
    }

    // Salva imediatamente (localStorage + Firebase)
    salvarDadosMaterial();
    atualizarListaMaterialModal(tipo, igrejaIndex);
    atualizarListaMaterial();
}

// Compartilha a lista de materiais via WhatsApp
function compartilharWhatsApp(tipo, igrejaIndex) {
    const igreja = materialData[tipo][igrejaIndex];
    if (!igreja) return;

    if (!igreja.materiais || igreja.materiais.length === 0) {
        alert('Adicione pelo menos um material antes de compartilhar.');
        return;
    }

    // Monta mensagem: nome - id\n\nitem - qtd.\n...
    const id = (igreja.id || '').toString().trim();
    let mensagem = (igreja.nome || '');
    if (id) mensagem += ' - ' + id;
    mensagem += '\n\n';
    igreja.materiais.forEach(m => {
        mensagem += m.quantidade + ' - ' + m.item + '\n';
    });
    mensagem = mensagem.trim();
    const encoded = encodeURIComponent(mensagem);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
        // Celular: share nativo ou deep link direto
        if (navigator.share) {
            navigator.share({ text: mensagem }).catch(() => {
                window.location.href = 'whatsapp://send?text=' + encoded;
            });
        } else {
            window.location.href = 'whatsapp://send?text=' + encoded;
        }
    } else {
        // PC: abre WhatsApp Web direto (chamado de click = não é bloqueado)
        window.open('https://web.whatsapp.com/send?text=' + encoded, '_blank');
    }

    // Move para "Enviadas" automaticamente e fecha o modal
    if (tipo !== 'enviadas') {
        const igrejaCopy = Object.assign({}, igreja);
        materialData[tipo].splice(igrejaIndex, 1);
        materialData.enviadas.push(igrejaCopy);
        salvarDadosMaterial();
        atualizarListaMaterial();
    }
    const modal = document.querySelector('.material-modal');
    if (modal) modal.remove();
}

// Função para recarregar/atualizar a lista de materiais
function recarregarMateriais() {
    try {
        console.log('🔄 Recarregando materiais...');

        // Força a sincronização com as Notas Fiscais
        sincronizarIgrejasNF();

        // Atualiza a interface
        atualizarListaMaterial();

        // Feedback visual
        const btnAtualizar = document.querySelector('button[onclick="recarregarMateriais()"]');
        if (btnAtualizar) {
            const iconAtualizar = btnAtualizar.querySelector('i');
            if (iconAtualizar) {
                iconAtualizar.classList.add('fa-spin');
                setTimeout(() => {
                    iconAtualizar.classList.remove('fa-spin');
                }, 500);
            }
        }

        console.log('✅ Materiais recarregados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao recarregar materiais:', error);
        alert('Erro ao atualizar a lista de materiais. Verifique o console para mais detalhes.');
    }
}

// ── Sugestões da Prévia dentro do modal de Material ──────────────────────────
function atualizarSugestoesModal(tipo, igrejaIndex) {
    const container = document.getElementById(`listaSugestoes_${tipo}_${igrejaIndex}`);
    if (!container) return;

    if (typeof window.obterSugestoesPrevia !== 'function' || typeof window.chavePrevia !== 'function') {
        container.innerHTML = '';
        return;
    }

    const igreja     = materialData[tipo][igrejaIndex];
    const chave      = window.chavePrevia(igreja);
    const sugestoes  = window.obterSugestoesPrevia(chave);

    if (sugestoes.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div style="background:#fff8e1;border:1px solid #f9a825;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
                <h4 style="margin:0;color:#e65100;font-size:14px;">
                    <i class="fas fa-clipboard-list"></i> Sugestões da Prévia
                    <span style="font-size:12px;color:#888;font-weight:normal;margin-left:6px;">(pré-lista pendente de confirmação)</span>
                </h4>
                <button onclick="confirmarTodasSugestoes('${tipo}', ${igrejaIndex})"
                    style="background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:bold;">
                    <i class="fas fa-check-double"></i> Confirmar Todas
                </button>
            </div>
            <div id="sugestoesItens_${tipo}_${igrejaIndex}"></div>
        </div>`;

    _renderizarItensSugestoes(tipo, igrejaIndex, chave, sugestoes);
}

function _renderizarItensSugestoes(tipo, igrejaIndex, chave, sugestoes) {
    const container = document.getElementById(`sugestoesItens_${tipo}_${igrejaIndex}`);
    if (!container) return;

    container.innerHTML = sugestoes.map((s, i) => `
        <div style="display:grid;grid-template-columns:1fr 80px auto auto;gap:8px;align-items:center;
                    padding:8px 10px;background:#fff;border-radius:6px;margin-bottom:6px;
                    border:1px solid #ffe082;">
            <span style="font-size:13px;font-weight:500;">
                <i class="fas fa-box" style="color:#f57f17;margin-right:6px;"></i>${s.nome}
            </span>
            <input type="number" min="1" value="${s.quantidade}"
                id="sugestaoQtd_${tipo}_${igrejaIndex}_${i}"
                style="padding:5px 8px;border:1px solid #ddd;border-radius:5px;font-size:13px;text-align:center;">
            <button onclick="confirmarSugestao('${tipo}', ${igrejaIndex}, ${s._idx})"
                style="background:#2e7d32;color:#fff;border:none;border-radius:6px;
                       padding:6px 12px;cursor:pointer;font-size:12px;white-space:nowrap;"
                title="Confirmar este item para a lista de material">
                <i class="fas fa-check"></i> Confirmar
            </button>
            <button onclick="removerSugestaoMaterial('${tipo}', ${igrejaIndex}, ${s._idx})"
                style="background:#ffebee;color:#e53935;border:1px solid #ffcdd2;border-radius:6px;
                       padding:6px 10px;cursor:pointer;font-size:12px;"
                title="Remover da Prévia">
                <i class="fas fa-trash"></i>
            </button>
        </div>`).join('');
}

function confirmarSugestao(tipo, igrejaIndex, sugestaoIdx) {
    if (typeof window.obterSugestoesPrevia !== 'function' || typeof window.chavePrevia !== 'function') return;

    const igreja   = materialData[tipo][igrejaIndex];
    const chave    = window.chavePrevia(igreja);
    const lista    = window.obterSugestoesPrevia(chave);
    const sugestao = lista.find(s => s._idx === sugestaoIdx);
    if (!sugestao) return;

    // Lê a quantidade editada no input (pode ter sido modificada pelo usuário)
    const inputs = document.querySelectorAll(`[id^="sugestaoQtd_${tipo}_${igrejaIndex}_"]`);
    let qtdFinal = sugestao.quantidade;
    inputs.forEach(inp => {
        const partes = inp.id.split('_');
        // O índice visual pode diferir do _idx original após remoções — usamos posição no array renderizado
        // Identifica pelo valor padrão coincidente ou pelo texto ao lado (usamos o índice da lista renderizada)
    });
    // Abordagem mais segura: lê pelo ID fixo se existir
    const inputDireto = document.getElementById(`sugestaoQtd_${tipo}_${igrejaIndex}_${lista.indexOf(sugestao)}`);
    if (inputDireto) qtdFinal = parseInt(inputDireto.value, 10) || sugestao.quantidade;

    if (!qtdFinal || qtdFinal < 1) { alert('Informe uma quantidade válida.'); return; }

    // Adiciona ao material da igreja
    if (!igreja.materiais) igreja.materiais = [];
    igreja.materiais.push({ item: sugestao.nome, quantidade: String(qtdFinal) });

    // Deduz do estoque se disponível
    if (typeof deduzirEstoque === 'function') {
        deduzirEstoque(sugestao.nome, qtdFinal);
    }

    // Remove da Prévia
    window.removerSugestaoPrevia(chave, sugestaoIdx);

    salvarDadosMaterial();
    atualizarSugestoesModal(tipo, igrejaIndex);
    atualizarListaMaterialModal(tipo, igrejaIndex);
    atualizarListaMaterial();
}

function confirmarTodasSugestoes(tipo, igrejaIndex) {
    if (typeof window.obterSugestoesPrevia !== 'function' || typeof window.chavePrevia !== 'function') return;

    const igreja  = materialData[tipo][igrejaIndex];
    const chave   = window.chavePrevia(igreja);
    const lista   = window.obterSugestoesPrevia(chave);
    if (lista.length === 0) return;

    if (!igreja.materiais) igreja.materiais = [];

    // Coleta quantidades editadas (posição visual = índice no array atual)
    lista.forEach((s, posVisual) => {
        const inp = document.getElementById(`sugestaoQtd_${tipo}_${igrejaIndex}_${posVisual}`);
        const qtd = inp ? (parseInt(inp.value, 10) || s.quantidade) : s.quantidade;
        igreja.materiais.push({ item: s.nome, quantidade: String(qtd) });
        if (typeof deduzirEstoque === 'function') deduzirEstoque(s.nome, qtd);
    });

    // Limpa toda a Prévia para esta igreja
    if (typeof window.chavePrevia === 'function') {
        if (typeof previaMateriais !== 'undefined') {
            // Acessa via função pública
        }
    }
    // Remove todas as sugestões da Prévia (do maior índice para o menor para não deslocar)
    const indicesOriginais = lista.map(s => s._idx).sort((a, b) => b - a);
    indicesOriginais.forEach(idx => window.removerSugestaoPrevia(chave, idx));

    salvarDadosMaterial();
    atualizarSugestoesModal(tipo, igrejaIndex);
    atualizarListaMaterialModal(tipo, igrejaIndex);
    atualizarListaMaterial();
}

function removerSugestaoMaterial(tipo, igrejaIndex, sugestaoIdx) {
    if (typeof window.removerSugestaoPrevia !== 'function' || typeof window.chavePrevia !== 'function') return;
    const chave = window.chavePrevia(materialData[tipo][igrejaIndex]);
    window.removerSugestaoPrevia(chave, sugestaoIdx);
    atualizarSugestoesModal(tipo, igrejaIndex);
}

// Expõe funções globalmente
window.abrirModalMaterial = abrirModalMaterial;
window.abrirModalAdicionarItem = abrirModalAdicionarItem;
window.adicionarItem = adicionarItem;
window.editarMaterial = editarMaterial;
window.salvarEdicaoMaterial = salvarEdicaoMaterial;
window.removerMaterial = removerMaterial;
window.compartilharWhatsApp = compartilharWhatsApp;
window.moverParaPendentes = moverParaPendentes;
window.moverParaEnviadas = moverParaEnviadas;
window.moverParaSandro = moverParaSandro;
window.sincronizarIgrejasNF = sincronizarIgrejasNF;
window.recarregarMateriais = recarregarMateriais;
window.confirmarSugestao = confirmarSugestao;
window.confirmarTodasSugestoes = confirmarTodasSugestoes;
window.removerSugestaoMaterial = removerSugestaoMaterial;

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de Material...');
    carregarDadosMaterial();
});

