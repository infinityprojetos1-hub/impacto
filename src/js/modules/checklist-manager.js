// Gerenciador de Checklists para Igrejas

// Estrutura de dados para checklists
let checklistData = {
    igrejas: [],        // Lista geral de igrejas com seus checklists
    pedidosSandro: []   // Igrejas dos pedidos do Sandro
};

// ── Assinaturas em storage separado (nunca sobrescrito pelo Firebase) ──────────
const _ASSINATURAS_KEY = 'checklistAssinaturas';

function _salvarAssinatura(nome, id, dataUrl) {
    try {
        const mapa = JSON.parse(localStorage.getItem(_ASSINATURAS_KEY) || '{}');
        const key  = (nome || '') + '_' + (id || '');
        if (dataUrl) mapa[key] = dataUrl; else delete mapa[key];
        localStorage.setItem(_ASSINATURAS_KEY, JSON.stringify(mapa));
    } catch (e) { console.error('Erro ao salvar assinatura:', e); }
}

function _restaurarAssinaturas(igrejas) {
    try {
        const mapa = JSON.parse(localStorage.getItem(_ASSINATURAS_KEY) || '{}');
        (igrejas || []).forEach(ig => {
            const key = (ig.nome || '') + '_' + (ig.id || '');
            if (mapa[key]) {
                if (!ig.checklist) ig.checklist = {};
                ig.checklist.assinatura = mapa[key];
            }
        });
    } catch (e) { console.error('Erro ao restaurar assinaturas:', e); }
}

// Expõe restaurarAssinaturas para firebase-config.js usar
window._restaurarAssinaturas = _restaurarAssinaturas;

// Perguntas do checklist (baseadas nas imagens fornecidas)
const perguntasChecklist = {
    responsavel: [
        { id: 'data', label: 'Data', tipo: 'date' },
        { id: 'aprovadoPor', label: 'Aprovado por', tipo: 'text', placeholder: 'Digite o nome do aprovador' },
        { id: 'cpf', label: 'CPF', tipo: 'text', placeholder: '000.000.000-00' },
        { id: 'telefone', label: 'Telefone', tipo: 'tel', placeholder: '(00) 00000-0000' }
    ],
    itens: [
        'TODAS AS CAIXAS DO TEMPLO ESTÃO FUNCIONANDO PERFEITAMENTE?',
        'OS DIÂMETROS DOS CABOS DE LIGAÇÃO DAS CAIXAS ESTÃO DENTRO DAS NORMAS?',
        'TODOS OS RETORNOS ESTÃO FUNCIONANDO PERFEITAMENTE?',
        'OS CABOS DO RETORNO SÃO PP?',
        'AS CAIXAS DO TEMPLO ESTÃO ALINHADAS?',
        'TODOS OS CANAIS DA MESA FORAM TESTADOS?',
        'TODOS AS LIGAÇÕES DOS CANAIS DOS AMPLIFICADORES ESTÃO CORRETAS?',
        'O MICROFONE DO PÚLPITO ESTÁ FUNCIONANDO?',
        'TODOS OS CABOS FORAM TESTADOS E ESTÃO APTOS A UTILIZAR?',
        'OS CABOS ESTÃO ORGANIZADOS?',
        'OS EQUIPAMENTOS ESTÃO EM BOAS CONDIÇÕES OU CONSERVADO?',
        'OS MICROFONES ESPECÍFICOS (CORDAS, METAIS, GRUPO, ETC.) ESTÃO FUNCIONANDO?',
        'O SISTEMA DE SATÉLITE ESTÁ FUNCIONANDO CORRETAMENTE?',
        'O PROCESSADOR ESTÁ ALINHADO COM O LOCAL?',
        'TODAS AS VIAS DA MEDUSA ESTÃO FUNCIONANDO?',
        'A IGREJA POSSUI SISTEMA DE ATERRAMENTO PARA O SOM?',
        'A IGREJA POSSUI UM DISJUNTOR EXCLUSIVO PARA O SOM?',
        'A IGREJA POSSUI EQUIPAMENTOS EXCEDENTES?'
    ]
};

// Flag: impede salvar no Firebase durante o carregamento inicial
let _checklistCarregando = false;

// Migra assinaturas que existiam no localStorage antigo para o storage separado
function _migrarAssinaturasAntigas(igrejas) {
    try {
        const mapaAtual = JSON.parse(localStorage.getItem(_ASSINATURAS_KEY) || '{}');
        let houveMigracao = false;
        (igrejas || []).forEach(ig => {
            if (ig.checklist && ig.checklist.assinatura) {
                const key = (ig.nome || '') + '_' + (ig.id || '');
                if (!mapaAtual[key]) {
                    mapaAtual[key] = ig.checklist.assinatura;
                    houveMigracao = true;
                    console.log(`📦 Assinatura migrada para storage seguro: ${ig.nome}`);
                }
            }
        });
        if (houveMigracao) {
            localStorage.setItem(_ASSINATURAS_KEY, JSON.stringify(mapaAtual));
            console.log('✅ Migração de assinaturas concluída');
        }
    } catch (e) { console.error('Erro ao migrar assinaturas:', e); }
}

// Carrega os dados do localStorage
function carregarDadosChecklist() {
    _checklistCarregando = true;
    try {
        const dadosSalvos = localStorage.getItem('checklistsIgrejas');
        if (dadosSalvos) {
            checklistData = JSON.parse(dadosSalvos);
            if (!checklistData.igrejas) checklistData.igrejas = [];
            if (!checklistData.pedidosSandro) checklistData.pedidosSandro = [];
            // Migra assinaturas antigas para o storage separado (executa uma vez)
            _migrarAssinaturasAntigas([...checklistData.igrejas, ...checklistData.pedidosSandro]);
            // Restaura assinaturas do storage separado (proteção contra sync do Firebase)
            _restaurarAssinaturas([...checklistData.igrejas, ...checklistData.pedidosSandro]);
            console.log('Dados de checklist carregados:', checklistData);
        }
        sincronizarIgrejasChecklistNF();
        atualizarListaChecklist();
    } catch (error) {
        console.error('Erro ao carregar dados de checklist:', error);
        checklistData = { igrejas: [], pedidosSandro: [] };
    } finally {
        _checklistCarregando = false;
    }
}

// Salva os dados no localStorage e no Firebase (incluindo assinaturas)
function salvarDadosChecklist() {
    try {
        // Marca timestamp
        checklistData._ts = Date.now();

        localStorage.setItem('checklistsIgrejas', JSON.stringify(checklistData));
        console.log('✅ Dados de checklist salvos localmente');

        // Salva no Firebase completo (com assinaturas), fora do carregamento inicial
        if (!_checklistCarregando && typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            if (typeof window._piscarBadgeSync === 'function') window._piscarBadgeSync();
            const _ts = checklistData._ts;
            salvarNoDatabase('dados/checklists', checklistData)
                .then(() => {
                    console.log('✅ Checklist salvo no Firebase (com assinaturas)');
                    if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('checklistsIgrejas', _ts);
                })
                .catch(err => console.warn('⚠️ Checklist não salvo no Firebase:', err));
        }
    } catch (error) {
        console.error('❌ Erro ao salvar dados de checklist:', error);
    }
}

// Sincroniza a lista de igrejas com as Notas Fiscais
function sincronizarIgrejasChecklistNF() {
    try {
        const nfDataStr = localStorage.getItem('notasFiscais');
        if (!nfDataStr) return;

        const nfData = JSON.parse(nfDataStr);
        const igrejasNF = nfData.igrejas || [];
        // Inclui arquivadas e especiais para não remover do Checklist ao arquivar
        const todasIgrejasNF = [
            ...igrejasNF,
            ...(nfData.arquivadas || []),
            ...(nfData.especiais  || [])
        ];

        let houveMudanca = false;

        // Remove igrejas apenas quando excluídas de todas as listas NF
        const _filtrarExistentes = (lista) => lista.filter(igrejaCheck => {
            const aindaExiste = todasIgrejasNF.some(igrejaNF =>
                igrejaNF.nome === igrejaCheck.nome && igrejaNF.id === igrejaCheck.id
            );
            if (!aindaExiste) {
                console.log(`🗑️ Removendo igreja "${igrejaCheck.nome}" do Checklist - excluída das NFs`);
                houveMudanca = true;
            }
            return aindaExiste;
        });
        checklistData.igrejas = _filtrarExistentes(checklistData.igrejas || []);
        checklistData.pedidosSandro = _filtrarExistentes(checklistData.pedidosSandro || []);

        // Adiciona igrejas ativas e especiais que estão em NF mas não em Checklist (igual ao Material)
        const _jaExisteEmQualquer = (nome, id) =>
            (checklistData.igrejas || []).some(ig => ig.nome === nome && ig.id === id) ||
            (checklistData.pedidosSandro || []).some(ig => ig.nome === nome && ig.id === id);

        const igrejasParaChecklist = [...igrejasNF, ...(nfData.especiais || [])];
        igrejasParaChecklist.forEach(igrejaNF => {
            if (!_jaExisteEmQualquer(igrejaNF.nome, igrejaNF.id)) {
                const novaIgreja = {
                    nome: igrejaNF.nome,
                    id: igrejaNF.id || '',
                    link: igrejaNF.link || '',
                    checklist: null,
                    pdf: null
                };
                checklistData.igrejas.push(novaIgreja);
                console.log(`➕ Nova igreja adicionada ao Checklist: "${novaIgreja.nome}"`);
                houveMudanca = true;
            }
        });

        if (houveMudanca) salvarDadosChecklist();
    } catch (error) {
        console.error('Erro ao sincronizar igrejas do checklist:', error);
    }
}

// Variável para rastrear a aba ativa do checklist
let abaAtivaChecklist = 'igrejas';

// Evita re-render desnecessário (mantém hover, reduz custo)
let _checklistLastRenderHash = '';
function atualizarListaChecklist() {
    const container = document.getElementById('checklistList');
    if (!container) return;
    const hash = (checklistData._ts || 0) + '-' + (checklistData.igrejas||[]).length + ':' + (checklistData.pedidosSandro||[]).length;
    if (hash === _checklistLastRenderHash) return;
    _checklistLastRenderHash = hash;

    container.innerHTML = '';

    const igrejas = checklistData.igrejas || [];
    const sandro = checklistData.pedidosSandro || [];
    const total = igrejas.length + sandro.length;

    if (total === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard"></i><h3>Nenhuma igreja cadastrada</h3><p>Adicione igrejas através das Notas Fiscais</p></div>';
        return;
    }

    // Cria as sub-tabs (Geral e Sandro)
    const tabsHTML = `
        <div class="checklist-tabs">
            <button class="checklist-tab-button ${abaAtivaChecklist === 'igrejas' ? 'active' : ''}" data-tipo="igrejas">
                <i class="fas fa-list"></i> Geral (${igrejas.length})
            </button>
            <button class="checklist-tab-button ${abaAtivaChecklist === 'pedidosSandro' ? 'active' : ''}" data-tipo="pedidosSandro">
                <i class="fas fa-user"></i> Sandro (${sandro.length})
            </button>
        </div>
        <div class="checklist-content-container"></div>
    `;
    container.innerHTML = tabsHTML;

    // Eventos nas tabs
    container.querySelectorAll('.checklist-tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.checklist-tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            abaAtivaChecklist = btn.getAttribute('data-tipo');
            mostrarListaChecklistTipo(abaAtivaChecklist);
        });
    });

    mostrarListaChecklistTipo(abaAtivaChecklist);
}

// Mostra a lista de um tipo específico (igrejas ou pedidosSandro)
function mostrarListaChecklistTipo(tipo) {
    const contentContainer = document.querySelector('.checklist-content-container');
    if (!contentContainer) return;

    contentContainer.innerHTML = '';
    const dados = checklistData[tipo] || [];

    if (dados.length === 0) {
        contentContainer.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Nenhuma igreja nesta categoria</h3><p>Mova igrejas para cá usando o botão na aba Geral</p></div>';
        return;
    }

    const tabela = document.createElement('div');
    tabela.className = 'checklist-table';
    tabela.innerHTML = `
        <div class="checklist-header">
            <div><i class="fas fa-church"></i> Igreja</div>
            <div><i class="fas fa-clipboard-check"></i> Status</div>
            <div><i class="fas fa-cog"></i> Ações</div>
        </div>
    `;

    dados.forEach((igreja, index) => {
        const linha = document.createElement('div');
        linha.className = 'checklist-row';

        const temChecklist = igreja.checklist && igreja.checklist.respostas;
        const statusClass = temChecklist ? 'preenchido' : 'pendente';
        const statusText = temChecklist ? 'Preenchido' : 'Pendente';
        const statusSandroClass = tipo === 'pedidosSandro' ? 'status-sandro' : '';

        linha.innerHTML = `
            <div class="checklist-col-igreja">
                <strong><i class="fas fa-church" style="margin-right: 8px; color: var(--gradient-start);"></i>${igreja.nome}</strong>
                ${igreja.id ? `<span class="checklist-id"><i class="fas fa-tag"></i> ID: ${igreja.id}</span>` : ''}
            </div>
            <div>
                <span class="checklist-status ${statusClass} ${statusSandroClass}">${tipo === 'pedidosSandro' ? 'Sandro' : statusText}</span>
            </div>
            <div class="checklist-col-acoes">
                ${tipo !== 'pedidosSandro' ? `<button class="btn-icon btn-secondary" onclick="moverParaSandroChecklist(${index})" title="Mover para Sandro" data-label-mobile="Sandro">
                    <i class="fas fa-user"></i>
                </button>` : ''}
                ${tipo !== 'igrejas' ? `<button class="btn-icon btn-warning" onclick="moverParaGeralChecklist(${index})" title="Mover para Geral" data-label-mobile="Geral">
                    <i class="fas fa-list"></i>
                </button>` : ''}
                ${temChecklist ? `
                    <button class="btn-icon btn-primary" onclick="visualizarChecklist('${tipo}', ${index})" title="Visualizar Checklist" data-label-mobile="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-success" onclick="downloadChecklistPDF('${tipo}', ${index})" title="Baixar PDF" data-label-mobile="Compartilhar">
                        <i class="fas fa-download"></i>
                    </button>
                ` : ''}
                <button class="btn-primary" onclick="abrirModalChecklist('${tipo}', ${index})">
                    <i class="fas fa-clipboard-check"></i> ${temChecklist ? 'Editar' : 'Adicionar'} Checklist
                </button>
            </div>
        `;

        tabela.appendChild(linha);
    });

    contentContainer.appendChild(tabela);
}

// Move igreja para a aba Sandro
function moverParaSandroChecklist(index) {
    const igreja = checklistData.igrejas[index];
    if (!igreja) return;
    checklistData.igrejas.splice(index, 1);
    checklistData.pedidosSandro.push(igreja);
    salvarDadosChecklist();
    atualizarListaChecklist();
}

// Move igreja de volta para a aba Geral
function moverParaGeralChecklist(index) {
    const igreja = checklistData.pedidosSandro[index];
    if (!igreja) return;
    checklistData.pedidosSandro.splice(index, 1);
    checklistData.igrejas.push(igreja);
    salvarDadosChecklist();
    atualizarListaChecklist();
}

// Abre o modal para preencher/editar checklist
function abrirModalChecklist(tipo, igrejaIndex) {
    const igreja = checklistData[tipo] ? checklistData[tipo][igrejaIndex] : null;
    if (!igreja) return;

    const checklistExistente = igreja.checklist || {};
    const responsavel = checklistExistente.responsavel || {};
    const respostas = checklistExistente.respostas || {};

    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.style.overflowY = 'auto';
    
    let htmlResposavel = '';
    perguntasChecklist.responsavel.forEach(campo => {
        let valor = responsavel[campo.id] || '';
        
        // Se for o campo de data e não tiver valor, pega a data atual
        if (campo.id === 'data' && !valor) {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            valor = `${ano}-${mes}-${dia}`;
        }
        
        htmlResposavel += `
            <div class="form-group">
                <label for="resp_${campo.id}"><i class="fas fa-${campo.id === 'data' ? 'calendar' : campo.id === 'cpf' ? 'id-card' : campo.id === 'telefone' ? 'phone' : 'user'}"></i> ${campo.label}:</label>
                <input type="${campo.tipo}" id="resp_${campo.id}" value="${valor}" ${campo.placeholder ? `placeholder="${campo.placeholder}"` : ''} ${campo.id === 'data' ? 'readonly' : ''} required>
            </div>
        `;
    });

    let htmlItens = '';
    perguntasChecklist.itens.forEach((pergunta, index) => {
        const respostaAtual = respostas[`item_${index}`] || '';
        htmlItens += `
            <div class="checklist-question">
                <span class="checklist-question-text">${pergunta}</span>
                <div class="checklist-options">
                    <div class="checklist-option">
                        <input type="radio" id="item_${index}_sim" name="item_${index}" value="SIM" ${respostaAtual === 'SIM' ? 'checked' : ''} required>
                        <label for="item_${index}_sim">SIM</label>
                    </div>
                    <div class="checklist-option">
                        <input type="radio" id="item_${index}_nao" name="item_${index}" value="NÃO" ${respostaAtual === 'NÃO' ? 'checked' : ''}>
                        <label for="item_${index}_nao">NÃO</label>
                    </div>
                    <div class="checklist-option">
                        <input type="radio" id="item_${index}_na" name="item_${index}" value="N/A" ${respostaAtual === 'N/A' ? 'checked' : ''}>
                        <label for="item_${index}_na">N/A</label>
                    </div>
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="material-modal-content" style="animation: modalSlideIn 0.3s ease; max-width: 800px;">
            <div class="material-modal-header">
                <h3><i class="fas fa-clipboard-check" style="margin-right: 10px;"></i>Novo Checklist - ${igreja.nome}</h3>
                <button class="material-modal-close" onclick="this.closest('.material-modal').remove()">×</button>
            </div>
            
            <div class="material-modal-body">
                <form id="formChecklist" onsubmit="salvarChecklist(event, '${tipo}', ${igrejaIndex})">
                    <!-- Informações do Responsável -->
                    <div class="checklist-form-section">
                        <h4><i class="fas fa-user-tie"></i> Informações do Responsável</h4>
                        ${htmlResposavel}
                    </div>

                    <!-- Itens do Checklist -->
                    <div class="checklist-form-section">
                        <h4><i class="fas fa-tasks"></i> Itens do Checklist</h4>
                        ${htmlItens}
                    </div>

                    <!-- Assinatura Digital -->
                    <div class="checklist-form-section">
                        <h4><i class="fas fa-signature"></i> Assinatura Digital</h4>
                        <div class="signature-canvas-wrapper">
                            <canvas id="signatureCanvas" class="signature-canvas" width="600" height="200"></canvas>
                            <div class="signature-buttons">
                                <button type="button" class="btn-warning" onclick="limparAssinatura()">
                                    <i class="fas fa-eraser"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="material-modal-buttons">
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Salvar Checklist</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.material-modal').remove()"><i class="fas fa-times"></i> Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Inicializa o canvas de assinatura
    setTimeout(() => inicializarCanvasAssinatura(checklistExistente.assinatura), 100);
}

// Canvas de assinatura
let canvasAssinatura = null;
let isDrawing = false;

function inicializarCanvasAssinatura(assinaturaExistente) {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    canvasAssinatura = canvas;

    // Ajusta o bitmap do canvas para preencher seu tamanho CSS real,
    // compensando devicePixelRatio para nitidez em telas Retina/HiDPI.
    function redimensionarCanvas() {
        const dpr  = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width  = Math.round(rect.width  * dpr);
        canvas.height = Math.round(rect.height * dpr);
        const ctx2 = canvas.getContext('2d');
        ctx2.scale(dpr, dpr);
        ctx2.strokeStyle = '#000';
        ctx2.lineWidth   = 2;
        ctx2.lineCap     = 'round';
        if (assinaturaExistente) {
            const img = new Image();
            img.onload = () => ctx2.drawImage(img, 0, 0, rect.width, rect.height);
            img.src = assinaturaExistente;
        }
    }
    redimensionarCanvas();

    const ctx = canvas.getContext('2d');
    let lastX = 0;
    let lastY = 0;

    // Converte coordenadas de tela para coordenadas do canvas (considera escala CSS)
    function toCanvasCoords(clientX, clientY) {
        const rect   = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / (rect.width  * (window.devicePixelRatio || 1));
        const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top)  * scaleY
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const { x, y } = toCanvasCoords(e.clientX, e.clientY);
        lastX = x; lastY = y;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const { x, y } = toCanvasCoords(e.clientX, e.clientY);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x; lastY = y;
    });

    canvas.addEventListener('mouseup',  () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Touch events — passive:false para permitir preventDefault e bloquear scroll
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        const touch = e.touches[0];
        const { x, y } = toCanvasCoords(touch.clientX, touch.clientY);
        lastX = x; lastY = y;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const { x, y } = toCanvasCoords(touch.clientX, touch.clientY);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x; lastY = y;
    }, { passive: false });

    canvas.addEventListener('touchend', () => isDrawing = false);
}

function limparAssinatura() {
    if (!canvasAssinatura) return;
    const ctx = canvasAssinatura.getContext('2d');
    ctx.clearRect(0, 0, canvasAssinatura.width, canvasAssinatura.height);
}

// Salva o checklist
async function salvarChecklist(event, tipo, igrejaIndex) {
    event.preventDefault();

    const igreja = checklistData[tipo] ? checklistData[tipo][igrejaIndex] : null;
    if (!igreja) return;

    // Coleta dados do responsável
    const responsavel = {};
    perguntasChecklist.responsavel.forEach(campo => {
        responsavel[campo.id] = document.getElementById(`resp_${campo.id}`).value.trim();
    });

    // Coleta respostas dos itens
    const respostas = {};
    perguntasChecklist.itens.forEach((pergunta, index) => {
        const radioSelecionado = document.querySelector(`input[name="item_${index}"]:checked`);
        if (radioSelecionado) {
            respostas[`item_${index}`] = radioSelecionado.value;
        }
    });

    // Coleta assinatura
    const assinatura = canvasAssinatura ? canvasAssinatura.toDataURL() : null;

    // Salva assinatura em storage separado (isolado do Firebase sync)
    if (assinatura) _salvarAssinatura(igreja.nome, igreja.id, assinatura);

    // Salva no objeto
    igreja.checklist = {
        responsavel,
        respostas,
        assinatura,
        dataPreenchimento: new Date().toISOString()
    };

    // Salva via salvarDadosChecklist() que persiste em dados/checklists (fonte única de verdade)
    salvarDadosChecklist();
    
    atualizarListaChecklist();

    // Fecha o modal
    event.target.closest('.material-modal').remove();

    alert('✅ Checklist salvo com sucesso!');
}

// Visualiza um checklist existente
async function visualizarChecklist(tipo, igrejaIndex) {
    const igreja = checklistData[tipo] ? checklistData[tipo][igrejaIndex] : null;
    if (!igreja || !igreja.checklist) return;

    // Cria modal de loading imediatamente
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:min(95vw,860px);height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e2e8f0;flex-shrink:0;">
                <div>
                    <span style="font-weight:700;color:#1e293b;font-size:1em;">${igreja.nome}</span>
                    ${igreja.id ? `<span style="font-size:0.8em;color:#64748b;margin-left:8px;">ID: ${igreja.id}</span>` : ''}
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="_btnDownloadChecklist" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:0.85em;font-weight:600;">
                        <i class="fas fa-download"></i> Baixar PDF
                    </button>
                    <button onclick="this.closest('[style*=fixed]').remove()" style="background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:1.1em;font-weight:700;">✕</button>
                </div>
            </div>
            <div id="_checklistPreviewBody" style="flex:1;display:flex;align-items:center;justify-content:center;background:#f8fafc;">
                <div style="color:#94a3b8;font-size:0.9em;"><i class="fas fa-spinner fa-spin"></i> Gerando preview...</div>
            </div>
        </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    // Gera o PDF e exibe no iframe
    try {
        const pdf = await _gerarPDFChecklist(tipo, igrejaIndex);
        if (!pdf) { modal.remove(); return; }

        const dataUri = pdf.output('datauristring');
        const body    = modal.querySelector('#_checklistPreviewBody');

        body.innerHTML = `<iframe src="${dataUri}" style="width:100%;height:100%;border:none;background:#fff;"></iframe>`;

        // Botão de download
        modal.querySelector('#_btnDownloadChecklist').addEventListener('click', () => {
            downloadChecklistPDF(tipo, igrejaIndex);
        });
    } catch (e) {
        console.error('Erro ao gerar preview do checklist:', e);
        modal.remove();
        alert('Erro ao gerar preview. Tente baixar o PDF diretamente.');
    }
}

// Gera o objeto jsPDF do checklist (sem baixar)
async function _gerarPDFChecklist(tipo, igrejaIndex) {
    const igreja = checklistData[tipo] ? checklistData[tipo][igrejaIndex] : null;
    if (!igreja || !igreja.checklist) return null;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const responsavel = igreja.checklist.responsavel || {};
    const respostas   = igreja.checklist.respostas   || {};
    const assinatura  = igreja.checklist.assinatura  || null;

    let y = 20;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CHECKLIST TÉCNICO', 105, y, { align: 'center' });
    y += 10;

    pdf.setFontSize(14);
    pdf.text(igreja.nome, 105, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informações do Responsável', 20, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Data: ${responsavel.data || 'N/A'}`, 20, y);          y += 6;
    pdf.text(`Aprovado por: ${responsavel.aprovadoPor || 'N/A'}`, 20, y); y += 6;
    pdf.text(`CPF: ${responsavel.cpf || 'N/A'}`, 20, y);             y += 6;
    pdf.text(`Telefone: ${responsavel.telefone || 'N/A'}`, 20, y);   y += 12;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Itens do Checklist', 20, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    perguntasChecklist.itens.forEach((pergunta, index) => {
        if (y > 270) { pdf.addPage(); y = 20; }
        const resposta = respostas[`item_${index}`] || 'N/A';
        const linhas = pdf.splitTextToSize(`${index + 1}. ${pergunta}`, 150);
        linhas.forEach(linha => { pdf.text(linha, 20, y); y += 5; });
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Resposta: ${resposta}`, 25, y);
        pdf.setFont('helvetica', 'normal');
        y += 8;
    });

    if (assinatura) {
        if (y > 240) { pdf.addPage(); y = 20; }
        y += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Assinatura Digital:', 20, y);
        y += 8;

        // Pré-carrega a imagem num elemento para garantir compatibilidade com jsPDF
        try {
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        pdf.addImage(img, 'PNG', 20, y, 120, 45);
                    } catch (e) {
                        console.error('Erro ao adicionar assinatura (Image):', e);
                        // fallback: tenta direto com data URL
                        try { pdf.addImage(assinatura, 20, y, 120, 45); } catch (_) {}
                    }
                    resolve();
                };
                img.onerror = () => { console.error('Erro ao carregar imagem da assinatura'); resolve(); };
                img.src = assinatura;
            });
        } catch (e) {
            console.error('Erro ao processar assinatura para PDF:', e);
        }
    }

    return pdf;
}

// Detecta se está em dispositivo mobile
function _ehMobile() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// Gera e baixa o PDF do checklist (desktop: só baixa | mobile: compartilha via Web Share, incluindo WhatsApp)
async function downloadChecklistPDF(tipo, igrejaIndex) {
    const igreja = checklistData[tipo] ? checklistData[tipo][igrejaIndex] : null;
    if (!igreja || !igreja.checklist) {
        alert('Checklist não encontrado!');
        return;
    }

    const pdf = await _gerarPDFChecklist(tipo, igrejaIndex);
    if (!pdf) { alert('Checklist não encontrado!'); return; }

    const nomeArquivo = `Checklist_${igreja.nome.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfBlob = pdf.output('blob');
    const arquivo = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });

    const isMobile = _ehMobile();

    // ===== MOBILE: tenta compartilhar (inclui WhatsApp no menu de compartilhar) =====
    if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        try {
            await navigator.share({
                files: [arquivo],
                title: `Checklist - ${igreja.nome}`,
                text: `Checklist técnico - ${igreja.nome}${igreja.id ? ' (ID: ' + igreja.id + ')' : ''}`
            });
            return;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.warn('Share API falhou, fazendo download:', e);
                pdf.save(nomeArquivo);
            }
        }
        return;
    }

    // ===== DESKTOP ou fallback: salva na pasta IMPRIMIR ou faz download =====
    try {
        if (window.pastaTrabalhoHandle) {
            const igrejaId = igreja.id || igreja.nome.replace(/[^a-z0-9]/gi, '_');
            const pastaIgreja = await window.pastaTrabalhoHandle.getDirectoryHandle(igrejaId, { create: true });
            const pastaImprimir = await pastaIgreja.getDirectoryHandle('IMPRIMIR', { create: true });
            const fileHandle = await pastaImprimir.getFileHandle(nomeArquivo, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(pdfBlob);
            await writable.close();
            console.log(`✅ Checklist salvo em: ${igrejaId}/IMPRIMIR/${nomeArquivo}`);
            alert(`✅ Checklist salvo na pasta:\n${igrejaId}/IMPRIMIR/${nomeArquivo}`);
        } else {
            pdf.save(nomeArquivo);
            if (isMobile) {
                const msg = encodeURIComponent(`Segue o checklist - ${igreja.nome}. O arquivo foi baixado; anexe no WhatsApp.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao salvar checklist:', error);
        pdf.save(nomeArquivo);
        if (isMobile) {
            const msg = encodeURIComponent(`Segue o checklist - ${igreja.nome}. Anexe o PDF baixado.`);
            window.open(`https://wa.me/?text=${msg}`, '_blank');
        }
    }
}

// Expõe funções globalmente
window.abrirModalChecklist = abrirModalChecklist;
window.salvarChecklist = salvarChecklist;
window.visualizarChecklist = visualizarChecklist;
window.downloadChecklistPDF = downloadChecklistPDF;
window.limparAssinatura = limparAssinatura;
window.sincronizarIgrejasChecklistNF = sincronizarIgrejasChecklistNF;
window.moverParaSandroChecklist = moverParaSandroChecklist;
window.moverParaGeralChecklist = moverParaGeralChecklist;

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de Checklist...');
    carregarDadosChecklist();
});
