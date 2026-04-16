// =============================================
// GERENCIADOR DE PAGAMENTOS
// =============================================

const MESES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

let pagamentoState = {
    mesSelecionado: new Date().getMonth(),
    anoSelecionado: new Date().getFullYear(),
    igrejasSelecionadas: {},   // { chave: { nome, id, valor } }
    itensExtras: [],           // [{ nome, valor }]
    igrejasArquivadas: new Set(), // Set de chaves arquivadas
    mostrarArquivadas: false
};

// Flag para evitar loop de sincronização Firebase ↔ local
let _pagCarregando = false;
// Cooldown após salvar para não re-renderizar do próprio eco do Firebase
let _pagSalvandoTs = 0;
// Timer do debounce para salvar valores digitados
let _pagValorDebounce = null;

// Carrega todos os dados do pagamento do localStorage
function carregarDadosPagamento() {
    try {
        const salvo = localStorage.getItem('pagamentoData');
        if (salvo) {
            const dados = JSON.parse(salvo);
            pagamentoState.igrejasArquivadas   = new Set(Array.isArray(dados.igrejasArquivadas) ? dados.igrejasArquivadas : []);
            pagamentoState.igrejasSelecionadas = dados.igrejasSelecionadas  || {};
            pagamentoState.itensExtras         = Array.isArray(dados.itensExtras) ? dados.itensExtras : [];
            if (dados.mesSelecionado  !== undefined) pagamentoState.mesSelecionado  = dados.mesSelecionado;
            if (dados.anoSelecionado  !== undefined) pagamentoState.anoSelecionado  = dados.anoSelecionado;
        } else {
            // Compatibilidade com chave antiga (apenas arquivadas)
            const arquivadas = localStorage.getItem('pagamento_arquivadas');
            if (arquivadas) {
                const arr = JSON.parse(arquivadas);
                pagamentoState.igrejasArquivadas = new Set(Array.isArray(arr) ? arr : []);
            }
        }
    } catch (e) {
        console.error('[Pagamento] Erro ao carregar dados:', e);
    }
}

// Serializa o estado para objeto salvo
function _serializarEstadoPagamento() {
    return {
        igrejasArquivadas:   Array.from(pagamentoState.igrejasArquivadas),
        igrejasSelecionadas: pagamentoState.igrejasSelecionadas,
        itensExtras:         pagamentoState.itensExtras,
        mesSelecionado:      pagamentoState.mesSelecionado,
        anoSelecionado:      pagamentoState.anoSelecionado,
        _ts:                 Date.now()
    };
}

// Salva estado completo no localStorage e no Firebase
function salvarDadosPagamento() {
    if (_pagCarregando) return; // evita loop durante sync do Firebase
    try {
        const dados = _serializarEstadoPagamento();
        localStorage.setItem('pagamentoData', JSON.stringify(dados));
        if (typeof salvarNoDatabase === 'function') {
            _pagSalvandoTs = Date.now(); // marca que acabamos de salvar (cooldown 3s)
            const _ts = dados._ts;
            salvarNoDatabase('dados/pagamento', dados).then(() => {
                if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('pagamentoData', _ts);
            });
            if (typeof window._piscarBadgeSync === 'function') window._piscarBadgeSync();
        }
    } catch (e) {
        console.error('[Pagamento] Erro ao salvar dados:', e);
    }
}

// Versão debounced — aguarda 800ms sem digitação antes de salvar (evita re-render a cada tecla)
function salvarDadosPagamentoDebounced() {
    if (_pagValorDebounce) clearTimeout(_pagValorDebounce);
    _pagValorDebounce = setTimeout(salvarDadosPagamento, 800);
}

// Mantém compatibilidade com chamadas antigas
function carregarArquivadasPagamento() { carregarDadosPagamento(); }
function salvarArquivadasPagamento()   { salvarDadosPagamento(); }

// =============================================
// HELPERS DE DADOS
// =============================================

function obterIgrejasPagamento() {
    try {
        let lista = [];

        // Combina igrejas de TODAS as categorias do NF: ativas + arquivadas + especiais
        if (typeof nfData !== 'undefined') {
            const ativas   = Array.isArray(nfData.igrejas)    ? nfData.igrejas    : [];
            const arquiv   = Array.isArray(nfData.arquivadas) ? nfData.arquivadas : [];
            const especiais = Array.isArray(nfData.especiais)  ? nfData.especiais  : [];
            lista = [...ativas, ...arquiv, ...especiais];
        } else {
            // Fallback: localStorage
            const nfStr = localStorage.getItem('notasFiscais');
            if (!nfStr) return [];
            const parsed = JSON.parse(nfStr);
            const ativas    = parsed.igrejas    || [];
            const arquiv    = parsed.arquivadas  || [];
            const especiais = parsed.especiais   || [];
            lista = [...ativas, ...arquiv, ...especiais];
        }

        // Filtra inválidas e remove duplicatas por nome+id
        const vistas = new Set();
        return lista.filter(ig => {
            if (!ig || !ig.nome) return false;
            const chave = ig.nome + '_' + (ig.id || '');
            if (vistas.has(chave)) return false;
            vistas.add(chave);
            return true;
        });
    } catch (e) {
        console.error('[Pagamento] Erro ao obter igrejas:', e);
        return [];
    }
}

function chaveIgreja(ig) {
    return ig.nome + '_' + (ig.id || '');
}

function gerarOpcoesAno(anoAtual) {
    let html = '';
    for (let a = anoAtual - 2; a <= anoAtual + 2; a++) {
        html += '<option value="' + a + '"' + (a === anoAtual ? ' selected' : '') + '>' + a + '</option>';
    }
    return html;
}

// =============================================
// RENDERIZAÇÃO PRINCIPAL
// =============================================

function renderizarAbaPagamento() {
    try {
        const container = document.getElementById('pagamentoContainer');
        if (!container) {
            console.warn('[Pagamento] Container não encontrado');
            return;
        }

        var todasIgrejas = obterIgrejasPagamento();
        var mesAtual = pagamentoState.mesSelecionado;
        var anoAtual = pagamentoState.anoSelecionado;
        var mostrarArq = pagamentoState.mostrarArquivadas;

        var igrejasAtivas = todasIgrejas.filter(function(ig) {
            return !pagamentoState.igrejasArquivadas.has(chaveIgreja(ig));
        });
        var igrejasArq = todasIgrejas.filter(function(ig) {
            return pagamentoState.igrejasArquivadas.has(chaveIgreja(ig));
        });

        // HTML do painel de igrejas
        var listaIgrejasHTML = '';
        if (todasIgrejas.length === 0) {
            listaIgrejasHTML = '<div class="pag-empty"><i class="fas fa-church"></i><p>Nenhuma igreja encontrada.<br>Adicione igrejas nas Notas Fiscais.</p></div>';
        } else {
            // Abas Ativas / Arquivadas
            listaIgrejasHTML =
                '<div class="pag-subtabs">' +
                '<button class="pag-subtab' + (!mostrarArq ? ' pag-subtab-ativa' : '') + '" onclick="alternarAbaPagamento(false)">' +
                '<i class="fas fa-church"></i> Ativas <span class="pag-subtab-count">' + igrejasAtivas.length + '</span>' +
                '</button>' +
                '<button class="pag-subtab' + (mostrarArq ? ' pag-subtab-ativa' : '') + '" onclick="alternarAbaPagamento(true)">' +
                '<i class="fas fa-archive"></i> Arquivadas <span class="pag-subtab-count">' + igrejasArq.length + '</span>' +
                '</button>' +
                '</div>';

            if (!mostrarArq) {
                // Lista ativas
                listaIgrejasHTML +=
                    '<div class="pag-busca-wrapper"><i class="fas fa-search"></i>' +
                    '<input type="text" id="pagBusca" placeholder="Buscar igreja..." oninput="filtrarIgrejasPagamento(this.value)" class="pag-busca-input">' +
                    '</div>' +
                    '<div id="pagIgrejaLista" class="pag-igreja-lista">' +
                    (igrejasAtivas.length === 0
                        ? '<div class="pag-empty-busca">Todas as igrejas estão arquivadas.</div>'
                        : renderizarListaIgrejas(igrejasAtivas, '', false)
                    ) +
                    '</div>';
            } else {
                // Lista arquivadas
                listaIgrejasHTML +=
                    '<div id="pagIgrejaLista" class="pag-igreja-lista">' +
                    (igrejasArq.length === 0
                        ? '<div class="pag-empty-busca">Nenhuma igreja arquivada.</div>'
                        : renderizarListaIgrejas(igrejasArq, '', true)
                    ) +
                    '</div>';
            }
        }

        container.innerHTML =
            '<div class="pag-layout">' +

            // ===== COLUNA ESQUERDA =====
            '<div class="pag-coluna-esq">' +

            // Seletor de mês/ano
            '<div class="pag-card">' +
            '<h3 class="pag-card-titulo"><i class="fas fa-calendar-alt"></i> Período de Pagamento</h3>' +
            '<div class="pag-mes-grid">' +
            '<div class="pag-field"><label>Mês</label><select id="pagMes" onchange="alterarMesPagamento(this.value)">' + MESES_PT.map(function(m, i) { return '<option value="' + i + '"' + (i === mesAtual ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div>' +
            '<div class="pag-field"><label>Ano</label><select id="pagAno" onchange="alterarAnoPagamento(this.value)">' + gerarOpcoesAno(anoAtual) + '</select></div>' +
            '</div></div>' +

            // Lista de igrejas
            '<div class="pag-card">' +
            '<div class="pag-card-header"><h3 class="pag-card-titulo"><i class="fas fa-church"></i> Igrejas</h3><span class="pag-badge">' + igrejasAtivas.length + ' ativas</span></div>' +
            listaIgrejasHTML +
            '</div>' +

            // Itens extras
            '<div class="pag-card">' +
            '<div class="pag-card-header"><h3 class="pag-card-titulo"><i class="fas fa-plus-circle"></i> Itens Extras</h3></div>' +
            '<div id="pagItensExtras" class="pag-extras-lista">' + renderizarItensExtras() + '</div>' +
            '<div class="pag-extra-form">' +
            '<input type="text" id="pagExtraNome" placeholder="Descrição do item..." class="pag-input">' +
            '<input type="text" id="pagExtraValor" placeholder="R$ 0,00" class="pag-input pag-input-valor" oninput="mascararValorInput(this)">' +
            '<button class="pag-btn pag-btn-add" onclick="adicionarItemExtra()"><i class="fas fa-plus"></i> Adicionar</button>' +
            '</div></div>' +

            '</div>' + // fim coluna esq

            // ===== COLUNA DIREITA =====
            '<div class="pag-coluna-dir">' +

            // Resumo
            '<div class="pag-card pag-card-resumo">' +
            '<h3 class="pag-card-titulo"><i class="fas fa-receipt"></i> Resumo</h3>' +
            '<div id="pagResumo" class="pag-resumo-lista">' + renderizarResumo() + '</div>' +
            '<div class="pag-total-box" id="pagTotalBox">' + renderizarTotal() + '</div>' +
            '</div>' +

            // Preview & Gerar
            '<div class="pag-card">' +
            '<h3 class="pag-card-titulo"><i class="fas fa-image"></i> Imagem de Pagamento</h3>' +
            '<canvas id="pagCanvas" class="pag-canvas-preview"></canvas>' +
            '<div class="pag-acoes">' +
            '<button class="pag-btn pag-btn-gerar" onclick="gerarImagemPagamento()"><i class="fas fa-magic"></i> Gerar Imagem</button>' +
            '<button class="pag-btn pag-btn-baixar" id="pagBtnBaixar" onclick="baixarImagemPagamento()" style="display:none"><i class="fas fa-download"></i> Baixar</button>' +
            '<button class="pag-btn pag-btn-whatsapp" id="pagBtnWhats" onclick="compartilharWhatsApp()" style="display:none"><i class="fab fa-whatsapp"></i> Compartilhar</button>' +
            '</div>' +
            '<p class="pag-hint" id="pagHint">Selecione as igrejas e clique em "Gerar Imagem"</p>' +
            '</div>' +

            '</div>' + // fim coluna dir

            '</div>'; // fim pag-layout

        console.log('[Pagamento] Renderizado com ' + todasIgrejas.length + ' igrejas');
    } catch (e) {
        console.error('[Pagamento] Erro ao renderizar aba:', e);
    }
}

// =============================================
// RENDERIZADORES PARCIAIS
// =============================================

function renderizarListaIgrejas(igrejas, busca, modoArquivadas) {
    try {
        var termo = busca ? busca.toLowerCase().trim() : '';
        var filtradas = termo ? igrejas.filter(function(ig) { return ig.nome.toLowerCase().indexOf(termo) !== -1; }) : igrejas;

        if (filtradas.length === 0) {
            return '<div class="pag-empty-busca">Nenhuma igreja encontrada' + (termo ? ' para "' + busca + '"' : '') + '.</div>';
        }

        return filtradas.map(function(ig) {
            var chave = chaveIgreja(ig);
            var selecionada = !modoArquivadas && !!pagamentoState.igrejasSelecionadas[chave];
            var valorAtual = selecionada ? pagamentoState.igrejasSelecionadas[chave].valor : '';
            var chaveEsc = chave.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            var nomeEsc = ig.nome.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            var idEsc = (ig.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            var inputValor = selecionada
                ? '<input type="text" class="pag-valor-input" placeholder="R$ 0,00" value="' + valorAtual + '" oninput="mascararValorInput(this); atualizarValorIgreja(\'' + chaveEsc + '\', this.value)" onfocus="this.select()">'
                : '';

            // Botão de arquivar / desarquivar
            var btnArquivo = modoArquivadas
                ? '<button class="pag-btn-arquivo pag-btn-desarquivar" onclick="desarquivarIgrejaPagamento(\'' + chaveEsc + '\')" title="Desarquivar"><i class="fas fa-box-open"></i></button>'
                : '<button class="pag-btn-arquivo" onclick="arquivarIgrejaPagamento(\'' + chaveEsc + '\')" title="Arquivar"><i class="fas fa-archive"></i></button>';

            if (modoArquivadas) {
                // Modo arquivadas: mostra item simples (sem checkbox) + botão desarquivar
                return '<div class="pag-igreja-item pag-igreja-arquivada" data-chave="' + chave.replace(/"/g, '&quot;') + '">' +
                    '<div class="pag-igreja-info pag-info-arq">' +
                    '<strong>' + ig.nome + '</strong>' +
                    (ig.id ? '<span class="pag-ig-id">ID: ' + ig.id + '</span>' : '') +
                    '</div>' +
                    btnArquivo +
                    '</div>';
            }

            // Modo ativas: checkbox + campo de valor + botão arquivar
            return '<div class="pag-igreja-item' + (selecionada ? ' pag-selecionada' : '') + '" data-chave="' + chave.replace(/"/g, '&quot;') + '">' +
                '<div class="pag-item-row">' +
                '<label class="pag-check-label">' +
                '<input type="checkbox" class="pag-checkbox"' + (selecionada ? ' checked' : '') +
                ' onchange="toggleIgrejaPagamento(\'' + chaveEsc + '\', this.checked, \'' + nomeEsc + '\', \'' + idEsc + '\')">' +
                '<span class="pag-check-box"></span>' +
                '<div class="pag-igreja-info">' +
                '<strong>' + ig.nome + '</strong>' +
                (ig.id ? '<span class="pag-ig-id">ID: ' + ig.id + '</span>' : '') +
                '</div>' +
                '</label>' +
                btnArquivo +
                '</div>' +
                inputValor +
                '</div>';
        }).join('');
    } catch (e) {
        console.error('[Pagamento] Erro ao renderizar lista de igrejas:', e);
        return '';
    }
}

function renderizarItensExtras() {
    if (pagamentoState.itensExtras.length === 0) {
        return '<p class="pag-extras-vazio">Nenhum item extra adicionado.</p>';
    }
    return pagamentoState.itensExtras.map(function(item, i) {
        return '<div class="pag-extra-item">' +
            '<div class="pag-extra-info">' +
            '<span class="pag-extra-nome">' + item.nome + '</span>' +
            '<span class="pag-extra-val">' + (item.valor || '—') + '</span>' +
            '</div>' +
            '<button class="pag-btn-remover" onclick="removerItemExtra(' + i + ')" title="Remover"><i class="fas fa-times"></i></button>' +
            '</div>';
    }).join('');
}

function renderizarResumo() {
    var selecionadas = Object.values(pagamentoState.igrejasSelecionadas);
    var extras = pagamentoState.itensExtras;

    if (selecionadas.length === 0 && extras.length === 0) {
        return '<p class="pag-resumo-vazio">Selecione igrejas para ver o resumo.</p>';
    }

    var html = '';
    selecionadas.forEach(function(ig) {
        var val = parsearValor(ig.valor);
        var chaveEsc = chaveIgreja(ig).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += '<div class="pag-resumo-item">' +
            '<button class="pag-resumo-remover" onclick="desselecionarIgrejaResumo(\'' + chaveEsc + '\')" title="Remover do resumo"><i class="fas fa-times"></i></button>' +
            '<span class="pag-resumo-nome"><i class="fas fa-church"></i> ' + ig.nome + '</span>' +
            '<span class="pag-resumo-val' + (val > 0 ? '' : ' pag-sem-valor') + '">' + (val > 0 ? formatarMoeda(val) : '—') + '</span>' +
            '</div>';
    });
    extras.forEach(function(item, i) {
        var val = parsearValor(item.valor);
        html += '<div class="pag-resumo-item pag-resumo-extra">' +
            '<button class="pag-resumo-remover" onclick="removerItemExtra(' + i + ')" title="Remover item extra"><i class="fas fa-times"></i></button>' +
            '<span class="pag-resumo-nome"><i class="fas fa-plus-circle"></i> ' + item.nome + '</span>' +
            '<span class="pag-resumo-val' + (val > 0 ? '' : ' pag-sem-valor') + '">' + (val > 0 ? formatarMoeda(val) : '—') + '</span>' +
            '</div>';
    });
    return html;
}

// Remove uma igreja da seleção diretamente pelo Resumo
function desselecionarIgrejaResumo(chave) {
    if (pagamentoState.igrejasSelecionadas[chave]) {
        delete pagamentoState.igrejasSelecionadas[chave];
        // Sincroniza visualmente o checkbox na lista (se visível)
        var item = document.querySelector('[data-chave="' + chave.replace(/"/g, '&quot;') + '"]');
        if (item) {
            item.classList.remove('pag-selecionada');
            var chk = item.querySelector('.pag-checkbox');
            if (chk) chk.checked = false;
            var inputValor = item.querySelector('.pag-valor-input');
            if (inputValor) inputValor.remove();
        }
        atualizarResumoPagamento();
        salvarDadosPagamento();
    }
}

function renderizarTotal() {
    var total = calcularTotal();
    return '<div class="pag-total-label">Total</div><div class="pag-total-valor">' + formatarMoeda(total) + '</div>';
}

// =============================================
// AÇÕES DO USUÁRIO
// =============================================

function alterarMesPagamento(valor) {
    pagamentoState.mesSelecionado = parseInt(valor, 10);
    salvarDadosPagamento();
}

function alterarAnoPagamento(valor) {
    pagamentoState.anoSelecionado = parseInt(valor, 10);
    salvarDadosPagamento();
}

function filtrarIgrejasPagamento(busca) {
    var todasIgrejas = obterIgrejasPagamento();
    var igrejasAtivas = todasIgrejas.filter(function(ig) {
        return !pagamentoState.igrejasArquivadas.has(chaveIgreja(ig));
    });
    var lista = document.getElementById('pagIgrejaLista');
    if (lista) lista.innerHTML = renderizarListaIgrejas(igrejasAtivas, busca, false);
}

function toggleIgrejaPagamento(chave, marcada, nome, id) {
    if (marcada) {
        pagamentoState.igrejasSelecionadas[chave] = { nome: nome, id: id, valor: '' };
    } else {
        delete pagamentoState.igrejasSelecionadas[chave];
    }
    atualizarItemVisualPagamento(chave, marcada);
    atualizarResumoPagamento();
    salvarDadosPagamento();
}

function atualizarItemVisualPagamento(chave, selecionada) {
    // Encontra o item pelo data-chave
    var item = document.querySelector('[data-chave="' + chave.replace(/"/g, '&quot;') + '"]');
    if (!item) return;

    item.classList.toggle('pag-selecionada', selecionada);

    var existente = item.querySelector('.pag-valor-input');
    if (selecionada && !existente) {
        var chaveEsc = chave.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'pag-valor-input';
        input.placeholder = 'R$ 0,00';
        input.setAttribute('oninput', 'mascararValorInput(this); atualizarValorIgreja(\'' + chaveEsc + '\', this.value)');
        input.setAttribute('onfocus', 'this.select()');
        item.appendChild(input);
        setTimeout(function() { input.focus(); }, 10);
    } else if (!selecionada && existente) {
        existente.remove();
    }
}

function atualizarValorIgreja(chave, valor) {
    if (pagamentoState.igrejasSelecionadas[chave]) {
        pagamentoState.igrejasSelecionadas[chave].valor = valor;
    }
    atualizarResumoPagamento();
    salvarDadosPagamentoDebounced(); // debounce: não salva a cada tecla
}

function adicionarItemExtra() {
    var nomeEl = document.getElementById('pagExtraNome');
    var valorEl = document.getElementById('pagExtraValor');
    var nome = nomeEl ? nomeEl.value.trim() : '';
    var valor = valorEl ? valorEl.value.trim() : '';

    if (!nome) {
        if (nomeEl) nomeEl.focus();
        return;
    }

    pagamentoState.itensExtras.push({ nome: nome, valor: valor });
    if (nomeEl) nomeEl.value = '';
    if (valorEl) valorEl.value = '';

    var lista = document.getElementById('pagItensExtras');
    if (lista) lista.innerHTML = renderizarItensExtras();
    atualizarResumoPagamento();
    salvarDadosPagamento();
}

function removerItemExtra(index) {
    pagamentoState.itensExtras.splice(index, 1);
    var lista = document.getElementById('pagItensExtras');
    if (lista) lista.innerHTML = renderizarItensExtras();
    atualizarResumoPagamento();
    salvarDadosPagamento();
}

function atualizarResumoPagamento() {
    var resumo = document.getElementById('pagResumo');
    var totalBox = document.getElementById('pagTotalBox');
    if (resumo) resumo.innerHTML = renderizarResumo();
    if (totalBox) totalBox.innerHTML = renderizarTotal();
}

// =============================================
// ARQUIVAMENTO
// =============================================

function alternarAbaPagamento(mostrarArquivadas) {
    pagamentoState.mostrarArquivadas = mostrarArquivadas;
    atualizarPainelIgrejas();
}

function arquivarIgrejaPagamento(chave) {
    pagamentoState.igrejasArquivadas.add(chave);
    if (pagamentoState.igrejasSelecionadas[chave]) {
        delete pagamentoState.igrejasSelecionadas[chave];
        atualizarResumoPagamento();
    }
    salvarDadosPagamento();
    atualizarPainelIgrejas();
}

function desarquivarIgrejaPagamento(chave) {
    pagamentoState.igrejasArquivadas.delete(chave);
    salvarDadosPagamento();
    atualizarPainelIgrejas();
}

// Atualiza apenas o painel de lista de igrejas (sem re-renderizar tudo)
function atualizarPainelIgrejas() {
    var todasIgrejas = obterIgrejasPagamento();
    var mostrarArq = pagamentoState.mostrarArquivadas;

    var igrejasAtivas = todasIgrejas.filter(function(ig) {
        return !pagamentoState.igrejasArquivadas.has(chaveIgreja(ig));
    });
    var igrejasArq = todasIgrejas.filter(function(ig) {
        return pagamentoState.igrejasArquivadas.has(chaveIgreja(ig));
    });

    // Atualiza abas (contagem)
    var subtabs = document.querySelectorAll('.pag-subtab');
    if (subtabs.length === 2) {
        subtabs[0].className = 'pag-subtab' + (!mostrarArq ? ' pag-subtab-ativa' : '');
        subtabs[0].innerHTML = '<i class="fas fa-church"></i> Ativas <span class="pag-subtab-count">' + igrejasAtivas.length + '</span>';
        subtabs[1].className = 'pag-subtab' + (mostrarArq ? ' pag-subtab-ativa' : '');
        subtabs[1].innerHTML = '<i class="fas fa-archive"></i> Arquivadas <span class="pag-subtab-count">' + igrejasArq.length + '</span>';
    }

    // Atualiza badge do card
    var badge = document.querySelector('.pag-card-header .pag-badge');
    if (badge) badge.textContent = igrejasAtivas.length + ' ativas';

    // Preserva o scroll da lista antes de atualizar
    var lista = document.getElementById('pagIgrejaLista');
    var scrollAntes = lista ? lista.scrollTop : 0;
    var buscaWrapper = document.querySelector('.pag-busca-wrapper');

    if (!mostrarArq) {
        // Mostra campo de busca
        if (!buscaWrapper) {
            var subTabsEl = document.querySelector('.pag-subtabs');
            if (subTabsEl) {
                var div = document.createElement('div');
                div.className = 'pag-busca-wrapper';
                div.innerHTML = '<i class="fas fa-search"></i><input type="text" id="pagBusca" placeholder="Buscar igreja..." oninput="filtrarIgrejasPagamento(this.value)" class="pag-busca-input">';
                subTabsEl.parentNode.insertBefore(div, lista);
            }
        }
        if (lista) {
            lista.innerHTML = igrejasAtivas.length === 0
                ? '<div class="pag-empty-busca">Todas as igrejas estão arquivadas.</div>'
                : renderizarListaIgrejas(igrejasAtivas, '', false);
            lista.scrollTop = scrollAntes; // restaura posição do scroll
        }
    } else {
        // Esconde campo de busca
        if (buscaWrapper) buscaWrapper.remove();
        if (lista) {
            lista.innerHTML = igrejasArq.length === 0
                ? '<div class="pag-empty-busca">Nenhuma igreja arquivada.</div>'
                : renderizarListaIgrejas(igrejasArq, '', true);
            lista.scrollTop = scrollAntes;
        }
    }
}

// =============================================
// FORMATAÇÃO
// =============================================

function mascararValorInput(input) {
    var v = input.value.replace(/\D/g, '');
    if (v === '') { input.value = ''; return; }
    var n = parseInt(v, 10);
    input.value = 'R$ ' + (n / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsearValor(str) {
    if (!str) return 0;
    var num = parseFloat(String(str).replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularTotal() {
    var total = 0;
    Object.values(pagamentoState.igrejasSelecionadas).forEach(function(ig) {
        total += parsearValor(ig.valor);
    });
    pagamentoState.itensExtras.forEach(function(item) {
        total += parsearValor(item.valor);
    });
    return total;
}

// =============================================
// GERAÇÃO DE IMAGEM (CANVAS)
// =============================================

function gerarImagemPagamento() {
    try {
        var canvas = document.getElementById('pagCanvas');
        if (!canvas) return;

        var selecionadas = Object.values(pagamentoState.igrejasSelecionadas);
        var extras = pagamentoState.itensExtras;
        var total = calcularTotal();
        var mes = MESES_PT[pagamentoState.mesSelecionado];
        var ano = pagamentoState.anoSelecionado;

        var todosItens = [];
        selecionadas.forEach(function(ig) {
            todosItens.push({ nome: ig.nome, valor: parsearValor(ig.valor), tipo: 'igreja' });
        });
        extras.forEach(function(it) {
            todosItens.push({ nome: it.nome, valor: parsearValor(it.valor), tipo: 'extra' });
        });

        if (todosItens.length === 0) {
            mostrarHintPagamento('Selecione pelo menos uma igreja para gerar a imagem.');
            return;
        }

        var LARGURA = 800;
        var PADDING = 40;
        var HEADER_H = 130;
        var ITEM_H = 52;
        var FOOTER_H = 110;
        var altura = HEADER_H + todosItens.length * ITEM_H + FOOTER_H + PADDING;

        canvas.width = LARGURA;
        canvas.height = altura;
        canvas.style.display = 'block';

        var ctx = canvas.getContext('2d');

        // Fundo gradiente escuro
        var grad = ctx.createLinearGradient(0, 0, LARGURA, altura);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#16213e');
        grad.addColorStop(1, '#0f3460');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, LARGURA, altura);

        // Bordas arredondadas simuladas (clip)
        ctx.save();
        ctx.beginPath();
        var r = 20;
        ctx.moveTo(r, 0);
        ctx.lineTo(LARGURA - r, 0);
        ctx.quadraticCurveTo(LARGURA, 0, LARGURA, r);
        ctx.lineTo(LARGURA, altura - r);
        ctx.quadraticCurveTo(LARGURA, altura, LARGURA - r, altura);
        ctx.lineTo(r, altura);
        ctx.quadraticCurveTo(0, altura, 0, altura - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();

        // Fundo de novo (com clip)
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, LARGURA, altura);

        // Brilho radial superior
        var brilho = ctx.createRadialGradient(LARGURA / 2, 0, 10, LARGURA / 2, 0, 400);
        brilho.addColorStop(0, 'rgba(100,100,255,0.12)');
        brilho.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = brilho;
        ctx.fillRect(0, 0, LARGURA, altura);

        // Linha decorativa topo
        var linhaTopo = ctx.createLinearGradient(PADDING, 0, LARGURA - PADDING, 0);
        linhaTopo.addColorStop(0, 'rgba(99,102,241,0)');
        linhaTopo.addColorStop(0.5, '#6366f1');
        linhaTopo.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.strokeStyle = linhaTopo;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PADDING, 28);
        ctx.lineTo(LARGURA - PADDING, 28);
        ctx.stroke();

        // Marca do sistema
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'rgba(150,150,255,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('INPACTO · SISTEMA DE GESTÃO', LARGURA / 2, 22);

        // Título mês/ano
        ctx.font = 'bold 40px Arial';
        var gradTitulo = ctx.createLinearGradient(200, 0, 600, 0);
        gradTitulo.addColorStop(0, '#a78bfa');
        gradTitulo.addColorStop(1, '#f472b6');
        ctx.fillStyle = gradTitulo;
        ctx.textAlign = 'center';
        ctx.fillText(mes + ' / ' + ano, LARGURA / 2, 80);

        // Subtítulo
        ctx.font = '15px Arial';
        ctx.fillStyle = 'rgba(200,200,255,0.55)';
        ctx.fillText('Relatório de Pagamentos', LARGURA / 2, 106);

        // Linha separadora header
        var linhaH = ctx.createLinearGradient(PADDING, 0, LARGURA - PADDING, 0);
        linhaH.addColorStop(0, 'rgba(99,102,241,0)');
        linhaH.addColorStop(0.3, '#6366f1');
        linhaH.addColorStop(0.7, '#ec4899');
        linhaH.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.strokeStyle = linhaH;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(PADDING, HEADER_H - 5);
        ctx.lineTo(LARGURA - PADDING, HEADER_H - 5);
        ctx.stroke();

        // Itens
        todosItens.forEach(function(item, i) {
            var y = HEADER_H + i * ITEM_H;
            var isAlternado = i % 2 === 0;

            if (isAlternado) {
                ctx.fillStyle = 'rgba(255,255,255,0.025)';
                ctx.fillRect(PADDING, y + 6, LARGURA - PADDING * 2, ITEM_H - 6);
            }

            // Bolinha colorida
            ctx.fillStyle = item.tipo === 'extra' ? '#f472b6' : '#818cf8';
            ctx.beginPath();
            ctx.arc(PADDING + 10, y + ITEM_H / 2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Nome
            ctx.font = (item.tipo === 'extra' ? 'italic ' : '') + '15px Arial';
            ctx.fillStyle = item.valor > 0 ? 'rgba(230,230,255,0.92)' : 'rgba(180,180,220,0.5)';
            ctx.textAlign = 'left';
            // Truncar nome longo
            var nomeExib = item.nome;
            while (ctx.measureText(nomeExib).width > 460 && nomeExib.length > 1) {
                nomeExib = nomeExib.slice(0, -1);
            }
            if (nomeExib !== item.nome) nomeExib += '...';
            ctx.fillText(nomeExib, PADDING + 24, y + ITEM_H / 2 + 6);

            // Valor
            if (item.valor > 0) {
                var gradVal = ctx.createLinearGradient(LARGURA - PADDING - 160, 0, LARGURA - PADDING, 0);
                gradVal.addColorStop(0, '#a78bfa');
                gradVal.addColorStop(1, '#f472b6');
                ctx.fillStyle = gradVal;
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(formatarMoeda(item.valor), LARGURA - PADDING, y + ITEM_H / 2 + 6);
            } else {
                ctx.fillStyle = 'rgba(150,150,200,0.35)';
                ctx.font = '14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText('—', LARGURA - PADDING, y + ITEM_H / 2 + 6);
            }

            // Divisória leve
            if (i < todosItens.length - 1) {
                ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(PADDING + 20, y + ITEM_H);
                ctx.lineTo(LARGURA - PADDING, y + ITEM_H);
                ctx.stroke();
            }
        });

        // Linha separadora rodapé
        var yFooter = HEADER_H + todosItens.length * ITEM_H;
        var linhaTot = ctx.createLinearGradient(PADDING, 0, LARGURA - PADDING, 0);
        linhaTot.addColorStop(0, 'rgba(99,102,241,0)');
        linhaTot.addColorStop(0.3, '#6366f1');
        linhaTot.addColorStop(0.7, '#ec4899');
        linhaTot.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.strokeStyle = linhaTot;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(PADDING, yFooter + 14);
        ctx.lineTo(LARGURA - PADDING, yFooter + 14);
        ctx.stroke();

        // Caixa total — fundo com gradiente
        var totalGrad = ctx.createLinearGradient(PADDING, yFooter + 24, LARGURA - PADDING, yFooter + 84);
        totalGrad.addColorStop(0, 'rgba(99,102,241,0.18)');
        totalGrad.addColorStop(1, 'rgba(236,72,153,0.18)');
        ctx.fillStyle = totalGrad;
        // Retângulo com cantos arredondados manual
        var bx = PADDING, by = yFooter + 24, bw = LARGURA - PADDING * 2, bh = 60, br = 12;
        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
        ctx.lineTo(bx + bw, by + bh - br);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
        ctx.lineTo(bx + br, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
        ctx.lineTo(bx, by + br);
        ctx.quadraticCurveTo(bx, by, bx + br, by);
        ctx.closePath();
        ctx.fill();

        // Borda caixa total
        ctx.strokeStyle = 'rgba(99,102,241,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label TOTAL
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = 'rgba(167,139,250,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText('TOTAL', PADDING + 20, yFooter + 59);

        // Valor total
        var gradTotalVal = ctx.createLinearGradient(LARGURA / 2, 0, LARGURA, 0);
        gradTotalVal.addColorStop(0, '#a78bfa');
        gradTotalVal.addColorStop(1, '#f472b6');
        ctx.fillStyle = gradTotalVal;
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(formatarMoeda(total), LARGURA - PADDING - 20, yFooter + 62);

        // Assinatura rodapé
        ctx.font = '11px Arial';
        ctx.fillStyle = 'rgba(150,150,200,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('Gerado em ' + new Date().toLocaleDateString('pt-BR') + ' · Inpacto Sistema de Gestão', LARGURA / 2, altura - 12);

        ctx.restore();

        exibirBotoesImagemPagamento();
        esconderHintPagamento();
    } catch (e) {
        console.error('[Pagamento] Erro ao gerar imagem:', e);
        mostrarHintPagamento('Erro ao gerar imagem. Verifique o console.');
    }
}

// =============================================
// COMPARTILHAMENTO
// =============================================

function exibirBotoesImagemPagamento() {
    var btnBaixar = document.getElementById('pagBtnBaixar');
    var btnWhats = document.getElementById('pagBtnWhats');
    if (btnBaixar) btnBaixar.style.display = 'inline-flex';
    if (btnWhats) btnWhats.style.display = 'inline-flex';
}

function esconderHintPagamento() {
    var hint = document.getElementById('pagHint');
    if (hint) hint.style.display = 'none';
}

function mostrarHintPagamento(msg) {
    var hint = document.getElementById('pagHint');
    if (hint) { hint.textContent = msg; hint.style.display = 'block'; }
}

function obterNomeArquivoPagamento() {
    return 'Pagamento_' + MESES_PT[pagamentoState.mesSelecionado] + '_' + pagamentoState.anoSelecionado + '.png';
}

function baixarImagemPagamento() {
    var canvas = document.getElementById('pagCanvas');
    if (!canvas) return;
    var link = document.createElement('a');
    link.download = obterNomeArquivoPagamento();
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function compartilharWhatsApp() {
    var canvas = document.getElementById('pagCanvas');
    if (!canvas) return;

    var mes = MESES_PT[pagamentoState.mesSelecionado];
    var ano = pagamentoState.anoSelecionado;
    var total = calcularTotal();
    var nomeArq = obterNomeArquivoPagamento();
    var textoMensagem = 'Relatório de Pagamentos - ' + mes + '/' + ano + '\nTotal: ' + formatarMoeda(total);

    canvas.toBlob(function(blob) {

        // ── TENTATIVA 1: Web Share API com arquivo
        // Funciona em: celular (todos), Chrome/Edge no Windows (abre painel nativo do SO
        // onde o usuário seleciona WhatsApp e a imagem vai direto)
        if (navigator.share && navigator.canShare) {
            try {
                var file = new File([blob], nomeArq, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    navigator.share({
                        title: 'Pagamento ' + mes + '/' + ano,
                        text: textoMensagem,
                        files: [file]
                    }).then(function() {
                        // Compartilhado com sucesso via painel do SO
                    }).catch(function(err) {
                        if (err.name !== 'AbortError') {
                            // Usuário não cancelou mas falhou — tenta clipboard
                            compartilharViaClipboard(blob, mes, ano, total);
                        }
                    });
                    return; // Saiu pelo Web Share API
                }
            } catch (e) {
                console.warn('[Pagamento] Web Share API indisponível:', e);
            }
        }

        // ── TENTATIVA 2: Copia para clipboard + abre WhatsApp Web
        // (Firefox, Safari desktop, browsers sem Web Share API)
        compartilharViaClipboard(blob, mes, ano, total);

    }, 'image/png');
}

function compartilharViaClipboard(blob, mes, ano, total) {
    if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function() {
            window.open('https://web.whatsapp.com/', '_blank');
            mostrarToastPagamento(
                '<i class="fab fa-whatsapp"></i> WhatsApp Web aberto!<br>' +
                'Abra um chat e cole com <strong>Ctrl+V</strong> — a imagem já está na área de transferência.'
            );
        }).catch(function() {
            window.open('https://web.whatsapp.com/', '_blank');
            mostrarToastPagamento(
                '<i class="fas fa-info-circle"></i> WhatsApp Web aberto.<br>' +
                'Use o botão de clipe para anexar a imagem manualmente.'
            );
        });
    } else {
        window.open('https://web.whatsapp.com/', '_blank');
        mostrarToastPagamento(
            '<i class="fas fa-info-circle"></i> WhatsApp Web aberto.<br>' +
            'Use o botão de clipe para anexar a imagem.'
        );
    }
}

// Toast de instrução (aparece na tela por alguns segundos)
function mostrarToastPagamento(htmlMsg) {
    var existente = document.getElementById('pagToast');
    if (existente) existente.remove();

    var toast = document.createElement('div');
    toast.id = 'pagToast';
    toast.className = 'pag-toast';
    toast.innerHTML = htmlMsg;
    document.body.appendChild(toast);

    // Anima entrada
    requestAnimationFrame(function() {
        toast.classList.add('pag-toast-visivel');
    });

    // Remove após 5 segundos
    setTimeout(function() {
        toast.classList.remove('pag-toast-visivel');
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400);
    }, 5000);
}

// =============================================
// INICIALIZAÇÃO
// =============================================

function inicializarPagamento() {
    // Carrega todos os dados persistidos (localStorage)
    carregarDadosPagamento();

    // Dispara o render quando o usuário clica na aba
    document.querySelectorAll('.tab-button').forEach(function(btn) {
        if (btn.getAttribute('data-tab') === 'pagamento') {
            btn.addEventListener('click', function() {
                setTimeout(renderizarAbaPagamento, 80);
            });
        }
    });
    console.log('[Pagamento] Módulo inicializado');
}

// Aplica dados recebidos do Firebase no estado local e re-renderiza
function _aplicarDadosFirebasePagamento(dados) {
    // Ignora o eco por 8s após qualquer save local para não desfazer edições recentes
    if (Date.now() - _pagSalvandoTs < 8000) {
        console.log('[Pagamento] Eco ignorado (cooldown pós-save)');
        return;
    }
    _pagCarregando = true;
    try {
        pagamentoState.igrejasArquivadas   = new Set(Array.isArray(dados.igrejasArquivadas) ? dados.igrejasArquivadas : []);
        pagamentoState.igrejasSelecionadas = dados.igrejasSelecionadas  || {};
        pagamentoState.itensExtras         = Array.isArray(dados.itensExtras) ? dados.itensExtras : [];
        if (dados.mesSelecionado  !== undefined) pagamentoState.mesSelecionado  = dados.mesSelecionado;
        if (dados.anoSelecionado  !== undefined) pagamentoState.anoSelecionado  = dados.anoSelecionado;
        localStorage.setItem('pagamentoData', JSON.stringify(dados));
        // Re-renderiza somente se a aba estiver visível e não houver input com foco
        const abaPag = document.getElementById('pagamento');
        const inputFocado = document.activeElement && document.activeElement.classList.contains('pag-valor-input');
        if (abaPag && abaPag.classList.contains('active') && !inputFocado) {
            renderizarAbaPagamento();
        }
        console.log('[Pagamento] Dados sincronizados do Firebase');
    } finally {
        _pagCarregando = false;
    }
}
window._aplicarDadosFirebasePagamento = _aplicarDadosFirebasePagamento;

// Expõe explicitamente no window para uso via main.js e handlers inline (onclick)
window.renderizarAbaPagamento = renderizarAbaPagamento;
window.inicializarPagamento = inicializarPagamento;
window.removerItemExtra = removerItemExtra;
window.desselecionarIgrejaResumo = desselecionarIgrejaResumo;
window.adicionarItemExtra = adicionarItemExtra;
window.toggleIgrejaPagamento = toggleIgrejaPagamento;
window.atualizarValorIgreja = atualizarValorIgreja;
window.arquivarIgrejaPagamento = arquivarIgrejaPagamento;
window.desarquivarIgrejaPagamento = desarquivarIgrejaPagamento;
window.alternarAbaPagamento = alternarAbaPagamento;
window.filtrarIgrejasPagamento = filtrarIgrejasPagamento;
window.alterarMesPagamento = alterarMesPagamento;
window.alterarAnoPagamento = alterarAnoPagamento;
window.mascararValorInput = mascararValorInput;
window.gerarImagemPagamento = gerarImagemPagamento;
window.baixarImagemPagamento = baixarImagemPagamento;
window.compartilharWhatsApp = compartilharWhatsApp;
