// Gerenciador de Notas Fiscais
let nfData = { igrejas: [], arquivadas: [], especiais: [] };

// Checklist padrão de cada igreja
function getDefaultChecklist() {
    return {
        assinatura_sandro: false,
        assinatura_filippi: false,
        assinatura_rodrigo: false,
        assinatura_andre: false,
        assinatura_fernando: false,
        doc_pedido: false,
        doc_assinatura: false,
        doc_relatorio: false,
        doc_nf: false,
        execucao_feito: false
    };
}

// Retorna somente a primeira pendência (primeiro passo com itens faltantes)
function obterPrimeiraPendencia(igreja) {
    if (!igreja) return null;
    const ch = igreja.checklist || getDefaultChecklist();

    // 1º passo - Assinaturas
    const faltandoAssinaturas = [];
    if (!ch.assinatura_sandro) faltandoAssinaturas.push('SANDRO');
    if (!ch.assinatura_filippi) faltandoAssinaturas.push('FILIPPI');
    if (!ch.assinatura_rodrigo) faltandoAssinaturas.push('RODRIGO');
    if (!ch.assinatura_andre) faltandoAssinaturas.push('ANDRÉ');
    if (!ch.assinatura_fernando) faltandoAssinaturas.push('FERNANDO');
    if (faltandoAssinaturas.length > 0) {
        return {
            passo: 1,
            titulo: '1º passo - Assinaturas',
            itens: faltandoAssinaturas.map(n => `Assinatura de ${n}`)
        };
    }

    // 2º passo - Pedido e Assinatura
    const faltandoDocs12 = [];
    if (!ch.doc_pedido) faltandoDocs12.push('PEDIDO');
    if (!ch.doc_assinatura) faltandoDocs12.push('ASSINATURA');
    if (faltandoDocs12.length > 0) {
        return {
            passo: 2,
            titulo: '2º passo - Pedido e Assinatura',
            itens: faltandoDocs12.map(d => `Documento pendente: ${d}`)
        };
    }

    // 3º passo - Relatório, NF e Execução
    const faltandoDocs3 = [];
    if (!ch.doc_relatorio) faltandoDocs3.push('RELATÓRIO');
    if (!ch.doc_nf) faltandoDocs3.push('NF');
    if (!ch.execucao_feito) faltandoDocs3.push('EXECUÇÃO');
    if (faltandoDocs3.length > 0) {
        return {
            passo: 3,
            titulo: '3º passo - Relatório, NF e Execução',
            itens: faltandoDocs3.map(d => `Documento pendente: ${d}`)
        };
    }

    // Sem pendências
    return {
        passo: null,
        titulo: 'Concluído',
        itens: []
    };
}

// Carrega os dados do localStorage
function carregarDadosNF() {
    try {
        const dadosSalvos = localStorage.getItem('notasFiscais');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);

            // Garante que as estruturas básicas existem
            nfData = {
                igrejas: Array.isArray(dados.igrejas) ? dados.igrejas : [],
                arquivadas: Array.isArray(dados.arquivadas) ? dados.arquivadas : [],
                especiais: Array.isArray(dados.especiais) ? dados.especiais : []
            };

            // Filtra dados inválidos
            const validar = ig => ig && ig.nome && ig.empresa && ig.valor;
            nfData.igrejas   = nfData.igrejas.filter(validar);
            nfData.arquivadas = nfData.arquivadas.filter(validar);
            nfData.especiais  = nfData.especiais.filter(validar);

            // Preenche checklist se ausente
            [...nfData.igrejas, ...nfData.arquivadas, ...nfData.especiais]
                .forEach(ig => { if (!ig.checklist) ig.checklist = getDefaultChecklist(); });

            console.log('Dados carregados e validados:', nfData);
        } else {
            nfData = { igrejas: [], arquivadas: [], especiais: [] };
        }
        atualizarListaNF();
    } catch (error) {
        console.error('Erro ao carregar dados das NFs:', error);
        nfData = { igrejas: [], arquivadas: [], especiais: [] };
    }
}

// Salva os dados no localStorage
function salvarDadosNF() {
    try {
        if (!nfData.igrejas) nfData.igrejas = [];
        if (!nfData.arquivadas) nfData.arquivadas = [];
        if (!nfData.especiais) nfData.especiais = [];

        const validar = ig => ig && ig.nome && ig.empresa && ig.valor;
        nfData.igrejas    = nfData.igrejas.filter(validar);
        nfData.arquivadas = nfData.arquivadas.filter(validar);
        nfData.especiais  = nfData.especiais.filter(validar);

        // Marca timestamp para resolver conflitos de concorrência
        nfData._ts = Date.now();
        if (typeof window !== 'undefined') window._nfSalvouTs = Date.now();

        const dadosParaSalvar = JSON.stringify(nfData);
        localStorage.setItem('notasFiscais', dadosParaSalvar);
        console.log('Dados NF salvos localmente');

        // Salva no Firebase imediatamente (sempre automático)
        if (typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            if (typeof window._piscarBadgeSync === 'function') window._piscarBadgeSync();
            const _ts = nfData._ts;
            salvarNoDatabase('dados/notasFiscais', nfData)
                .then(() => {
                    console.log('✅ NF salva no Firebase');
                    if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('notasFiscais', _ts);
                })
                .catch(err => console.warn('⚠️ NF não salva no Firebase:', err));
        }
    } catch (error) {
        console.error('Erro ao salvar dados das NFs:', error);
    }
}

// Formata a data para exibição
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Converte valor formatado (R$ X.XXX,XX) para número
function converterValorParaNumero(valorFormatado) {
    return parseFloat(valorFormatado.replace('R$', '').replace('.', '').replace(',', '.').trim());
}

// Formata número para valor em reais
function formatarValor(numero) {
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Retorna o valor sempre formatado em reais (aceita número ou string)
function obterValorFormatado(valor) {
    if (typeof valor === 'number' && !isNaN(valor)) {
        return formatarValor(valor);
    }
    if (typeof valor === 'string') {
        const numero = converterValorParaNumero(valor);
        if (!isNaN(numero)) {
            return formatarValor(numero);
        }
        // Se não conseguir converter, retorna original para não perder informação
        return valor;
    }
    return formatarValor(0);
}

// Adiciona uma nova igreja à lista
function adicionarIgrejaNF(nomeIgreja, empresa, valor, id, link, codigo, tipoTexto) {
    console.log('Função adicionarIgrejaNF chamada com:', { nomeIgreja, empresa, valor, id, link, codigo, tipoTexto });

    if (!nomeIgreja || !empresa || !valor) {
        console.error('Dados inválidos ao adicionar igreja:', { nomeIgreja, empresa, valor });
        return;
    }

    const valorFormatado = obterValorFormatado(valor);
    const ehEspecial = tipoTexto && tipoTexto !== 'padrao';

    const novaIgreja = {
        nome: nomeIgreja.trim(),
        empresa: empresa.trim(),
        valor: valorFormatado,
        data: new Date().toISOString(),
        checklist: getDefaultChecklist(),
        id: id || null,
        link: link || null,
        codigo: codigo || null,
        tipoTexto: tipoTexto || 'padrao'
    };

    if (!nfData.igrejas) nfData.igrejas = [];
    if (!nfData.especiais) nfData.especiais = [];

    if (ehEspecial) {
        nfData.especiais.push(novaIgreja);
        console.log('Igreja especial adicionada:', novaIgreja);
    } else {
        nfData.igrejas.push(novaIgreja);
        console.log('Igreja adicionada aos dados:', novaIgreja);
    }

    salvarDadosNF();
    atualizarListaNF();

    // Sincroniza com Checklist e Material para que as novas igrejas apareçam nessas abas
    if (typeof sincronizarIgrejasChecklistNF === 'function') {
        sincronizarIgrejasChecklistNF();
        if (typeof atualizarListaChecklist === 'function') atualizarListaChecklist();
    }
    if (typeof sincronizarIgrejasNF === 'function') {
        sincronizarIgrejasNF();
        if (typeof atualizarListaMaterial === 'function') atualizarListaMaterial();
    }
}

// Modal de checklist (visualização)
function abrirChecklistModal(index, tipo) {
    const lista = tipo === 'ativas' ? nfData.igrejas : nfData.arquivadas;
    const igreja = lista[index];
    if (!igreja) return;
    if (!igreja.checklist) igreja.checklist = getDefaultChecklist();

    const steps = [
        {
            titulo: '1º passo - Assinaturas',
            itens: [
                { label: 'SANDRO', key: 'assinatura_sandro' },
                { label: 'FILIPPI', key: 'assinatura_filippi' },
                { label: 'RODRIGO', key: 'assinatura_rodrigo' },
                { label: 'ANDRÉ', key: 'assinatura_andre' },
                { label: 'FERNANDO', key: 'assinatura_fernando' }
            ]
        },
        {
            titulo: '2º passo - Pedido e Assinatura',
            itens: [
                { label: 'PEDIDO', key: 'doc_pedido' },
                { label: 'ASSINATURA', key: 'doc_assinatura' }
            ]
        },
        {
            titulo: '3º passo - Relatório, NF e Execução',
            itens: [
                { label: 'RELATÓRIO', key: 'doc_relatorio' },
                { label: 'NF', key: 'doc_nf' },
                { label: 'EXECUÇÃO', key: 'execucao_feito' }
            ]
        }
    ];

    const modal = document.createElement('div');
    modal.className = 'nf-modal';
    modal.innerHTML = `
        <div class="nf-modal-content">
            <h3>Checklist - ${igreja.nome}</h3>
            <div class="nf-steps">
                ${steps.map(step => `
                    <div class="nf-step">
                        <h4>${step.titulo}</h4>
                        ${step.itens.map(item => {
        const isSim = !!igreja.checklist[item.key];
        return `
                                <div class="nf-item-row">
                                    <span class="nf-item-label">${item.label}</span>
                                    <span class="nf-badge ${isSim ? 'nf-badge--sim' : 'nf-badge--nao'}">${isSim ? 'SIM' : 'NÃO'}</span>
                                </div>
                            `;
    }).join('')}
                    </div>
                `).join('')}
            </div>
            <div class="nf-modal-buttons">
                <button type="button" class="btn-secondary" onclick="this.closest('.nf-modal').remove()">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Abre modal para adicionar uma nova igreja
function abrirModalAdicionarIgreja() {
    const modal = document.createElement('div');
    modal.className = 'nf-modal';
    modal.innerHTML = `
        <div class="nf-modal-content">
            <h3>Adicionar Igreja</h3>
            <form id="adicionarIgrejaForm">
                <div class="form-group">
                    <label for="novoNomeIgreja">Nome da Igreja:</label>
                    <input type="text" id="novoNomeIgreja" placeholder="Ex.: Igreja Batista Central" required>
                </div>
                <div class="form-group">
                    <label for="novoIdIgreja">ID da Igreja:</label>
                    <input type="text" id="novoIdIgreja" placeholder="Ex.: 83541">
                </div>
                <div class="form-group">
                    <label for="novaEmpresaIgreja">Empresa:</label>
                    <select id="novaEmpresaIgreja" required>
                        <option value="Impacto Soluções">Impacto Soluções</option>
                        <option value="SPG da Silva Sonorização e Iluminação">SPG da Silva Sonorização e Iluminação</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="novoValorIgreja">Valor:</label>
                    <input type="text" id="novoValorIgreja" placeholder="Ex.: R$ 3.500,00" required>
                </div>
                <div class="form-group">
                    <label for="novoLinkIgreja">Link:</label>
                    <input type="text" id="novoLinkIgreja" placeholder="Ex.: https://exemplo.com">
                </div>
                <div class="nf-modal-buttons">
                    <button type="submit" class="btn-primary">Salvar</button>
                    <button type="button" class="btn-secondary" id="cancelarAdicionarIgreja">Cancelar</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const form = document.getElementById('adicionarIgrejaForm');
    const btnCancelar = document.getElementById('cancelarAdicionarIgreja');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nome = document.getElementById('novoNomeIgreja').value.trim();
        const id = document.getElementById('novoIdIgreja').value.trim();
        const link = document.getElementById('novoLinkIgreja').value.trim();
        const empresa = document.getElementById('novaEmpresaIgreja').value;
        const valor = document.getElementById('novoValorIgreja').value.trim();

        if (!nome || !empresa || !valor) return;

        adicionarIgrejaNF(nome, empresa, valor, id, link);
        // Removido: exportação automática para JSON
        modal.remove();
    });

    btnCancelar.addEventListener('click', function () {
        modal.remove();
    });
}

// Gera o PDF com todas as notas fiscais
async function gerarPDFNF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    const empresas = {};

    // Configurações de estilo
    const cores = {
        'Impacto Soluções': {
            claro: [255, 235, 235], // Rosa claro
            escuro: [255, 220, 220], // Rosa mais escuro
            texto: [220, 20, 60] // Vermelho escuro (DC143C)
        },
        'SPG da Silva Sonorização e Iluminação': {
            claro: [235, 245, 255], // Azul claro
            escuro: [220, 235, 255], // Azul mais escuro
            texto: [0, 83, 155] // Azul escuro (00539B)
        }
    };
    const alturaLinha = 7;
    const margemEsquerda = 14;

    // Agrupa as igrejas por empresa
    nfData.igrejas.forEach(igreja => {
        if (!empresas[igreja.empresa]) {
            empresas[igreja.empresa] = [];
        }
        empresas[igreja.empresa].push(igreja);
    });

    // Título do relatório
    doc.setFontSize(16);
    doc.text('Relatório de Notas Fiscais', 105, y, { align: 'center' });
    y += 20;

    // Para cada empresa
    for (const [empresa, igrejas] of Object.entries(empresas)) {
        // Adiciona nova página se necessário
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        // Nome da empresa com cor e negrito
        doc.setFontSize(14);
        const corEmpresa = cores[empresa];
        doc.setTextColor(...corEmpresa.texto);
        doc.setFont('helvetica', 'bold');
        doc.text(empresa, margemEsquerda, y);
        y += 10;

        // Reseta cor do texto para preto e fonte normal
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        // Cabeçalho da tabela
        doc.setFontSize(12);
        doc.text('Igreja', margemEsquerda, y);
        doc.text('Nº Pedido', 80, y);
        doc.text('Pendência', 115, y);
        doc.text('Valor', 160, y);
        y += 5;

        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margemEsquerda, y, 196, y);
        y += 5;

        let linhaAlternada = false;

        // Lista as igrejas
        igrejas.forEach(igreja => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Adiciona cor de fundo alternada
            doc.setFillColor(...(linhaAlternada ? corEmpresa.escuro : corEmpresa.claro));
            doc.rect(margemEsquerda, y - 5, 182, alturaLinha, 'F');

            doc.setFontSize(10);
            doc.text(igreja.nome, margemEsquerda, y);
            doc.text(igreja.id ? String(igreja.id) : '—', 80, y);
            doc.text(igreja.pendencia ? String(igreja.pendencia).toUpperCase() : '—', 115, y);
            doc.text(igreja.valor, 160, y);
            y += alturaLinha;

            linhaAlternada = !linhaAlternada;
        });

        y += 15; // Espaço entre empresas
    }

    return doc;
}

// Gera o PDF simplificado com Código - Nome - Nº Pedido
async function gerarPDFListaSimples() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 25;
    const alturaLinha = 8;
    const margemEsquerda = 14;

    // Título do relatório
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('IGREJAS EM ANDAMENTO', 105, y, { align: 'center' });
    y += 15;

    // Linha separadora abaixo do título
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(margemEsquerda, y, 196, y);
    y += 10;

    // Reseta fonte
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    let linhaAlternada = false;

    // Lista todas as igrejas sem dividir por empresa
    nfData.igrejas.forEach(igreja => {
        if (y > 275) {
            doc.addPage();
            y = 20;
        }

        // Adiciona cor de fundo alternada (cinza claro / branco)
        doc.setFillColor(linhaAlternada ? 240 : 250, linhaAlternada ? 240 : 250, linhaAlternada ? 240 : 250);
        doc.rect(margemEsquerda, y - 5, 182, alturaLinha, 'F');

        // Monta a linha no formato: CODIGO - NOME - NUMERO DO PEDIDO
        const codigo = igreja.codigo ? String(igreja.codigo) : '—';
        const nome = igreja.nome || '—';
        const numPedido = igreja.id ? String(igreja.id) : '—';

        const linhaTexto = `${codigo} - ${nome} - ${numPedido}`;

        doc.setFontSize(11);
        doc.text(linhaTexto, margemEsquerda, y);
        y += alturaLinha;

        linhaAlternada = !linhaAlternada;
    });

    return doc;
}

// Gera o PDF de Relatório com pendências por igreja (mostra apenas o primeiro passo pendente)
async function gerarPDFRelatorioPendencias() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    const empresas = {};

    const cores = {
        'Impacto Soluções': {
            claro: [255, 235, 235],
            escuro: [255, 220, 220],
            texto: [220, 20, 60]
        },
        'SPG da Silva Sonorização e Iluminação': {
            claro: [235, 245, 255],
            escuro: [220, 235, 255],
            texto: [0, 83, 155]
        }
    };
    const alturaLinha = 7;
    const margemEsquerda = 14;

    // Agrupa as igrejas por empresa
    (nfData.igrejas || []).forEach(igreja => {
        if (!empresas[igreja.empresa]) empresas[igreja.empresa] = [];
        empresas[igreja.empresa].push(igreja);
    });

    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Pendências - Notas Fiscais', 105, y, { align: 'center' });
    y += 20;

    for (const [empresa, igrejas] of Object.entries(empresas)) {
        if (y > 250) { doc.addPage(); y = 20; }

        // Cabeçalho da empresa
        doc.setFontSize(14);
        const corEmpresa = cores[empresa] || { texto: [0, 0, 0] };
        doc.setTextColor(...corEmpresa.texto);
        doc.setFont('helvetica', 'bold');
        doc.text(empresa, margemEsquerda, y);
        y += 10;

        // Reset texto
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        // Cabeçalho da tabela
        doc.setFontSize(12);
        doc.text('Igreja', margemEsquerda, y);
        doc.text('Pendências (primeiro passo pendente)', 90, y);
        y += 5;

        // Separador
        doc.setDrawColor(200, 200, 200);
        doc.line(margemEsquerda, y, 196, y);
        y += 5;

        let linhaAlternada = false;

        igrejas.forEach(igreja => {
            // Calcula conteúdo e altura necessária antecipadamente
            const det = obterPrimeiraPendencia(igreja);
            const descricao = (!det || det.passo === null)
                ? 'Sem pendências'
                : `${det.titulo}: ${det.itens.join(', ')}`;
            const linhas = doc.splitTextToSize(descricao, 95);
            const numLinhas = Math.max(1, (Array.isArray(linhas) ? linhas.length : 1));
            const alturaNecessaria = Math.max(alturaLinha, numLinhas * alturaLinha);

            // Quebra de página se não couber a linha inteira
            if (y + alturaNecessaria > 270) { doc.addPage(); y = 20; }

            // Fundo alternado cobrindo toda a altura do bloco
            const corLinha = linhaAlternada ? (cores[empresa]?.escuro || [240, 240, 240]) : (cores[empresa]?.claro || [250, 250, 250]);
            doc.setFillColor(...corLinha);
            doc.rect(margemEsquerda, y - 5, 182, alturaNecessaria, 'F');

            // Nome da igreja (com ID se houver)
            doc.setFontSize(10);
            const nomeComId = igreja.id ? `${igreja.nome} - ${igreja.id}` : igreja.nome;
            doc.text(nomeComId, margemEsquerda, y);

            // Imprime as linhas de pendência com espaçamento controlado
            let linhaY = y;
            if (Array.isArray(linhas)) {
                linhas.forEach(l => {
                    doc.text(l, 90, linhaY);
                    linhaY += alturaLinha;
                });
            } else {
                doc.text(linhas, 90, linhaY);
            }

            // Avança Y pela altura utilizada
            y += alturaNecessaria;
            linhaAlternada = !linhaAlternada;
        });

        y += 12;
    }

    return doc;
}

// ===== Relatório como Imagem (Canvas) =====
function medirLinhas(ctx, texto, maxLargura) {
    if (!texto) return { linhas: [""], quantidade: 1 };
    const palavras = texto.split(' ');
    let linhaAtual = '';
    const linhas = [];
    for (let i = 0; i < palavras.length; i++) {
        const teste = linhaAtual ? (linhaAtual + ' ' + palavras[i]) : palavras[i];
        if (ctx.measureText(teste).width <= maxLargura) {
            linhaAtual = teste;
        } else {
            if (linhaAtual) linhas.push(linhaAtual);
            linhaAtual = palavras[i];
        }
    }
    if (linhaAtual) linhas.push(linhaAtual);
    return { linhas, quantidade: linhas.length };
}

function obterMapaEmpresasNF() {
    const mapa = {};
    (nfData.igrejas || []).forEach(igreja => {
        if (!mapa[igreja.empresa]) mapa[igreja.empresa] = [];
        mapa[igreja.empresa].push(igreja);
    });
    return mapa;
}

async function gerarImagemRelatorioPendencias() {
    // Configurações visuais
    const cores = {
        'Impacto Soluções': { claro: '#FFEBEB', escuro: '#FFDCDC', texto: '#DC143C' },
        'SPG da Silva Sonorização e Iluminação': { claro: '#EBF5FF', escuro: '#DCEBFF', texto: '#00539B' }
    };
    const largura = 1200; // px
    const margem = 28; // px
    const alturaBaseLinha = 22; // px
    const colunaIgrejaX = margem;
    const colunaPendX = 480; // onde inicia o texto de pendência
    const larguraPend = largura - colunaPendX - margem;

    // Fonte base para medir e desenhar
    const canvasMedida = document.createElement('canvas');
    const ctxM = canvasMedida.getContext('2d');
    ctxM.font = '12px Arial';

    // Pré-cálculo da altura total
    let altura = 60; // título
    const empresas = obterMapaEmpresasNF();
    Object.entries(empresas).forEach(([empresa, igrejas]) => {
        altura += 40; // cabeçalho da empresa + header da tabela
        igrejas.forEach(igreja => {
            const det = obterPrimeiraPendencia(igreja);
            const descricao = (!det || det.passo === null) ? 'Sem pendências' : `${det.titulo}: ${det.itens.join(', ')}`;
            const med = medirLinhas(ctxM, descricao, larguraPend);
            const linhas = Math.max(1, med.quantidade);
            altura += Math.max(alturaBaseLinha, linhas * alturaBaseLinha) + 4; // 4px espaçamento
        });
        altura += 12; // espaçamento após empresa
    });

    // Cria canvas definitivo
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = Math.max(altura, 400);
    const ctx = canvas.getContext('2d');

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 40;
    // Título
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Relatório de Pendências - Notas Fiscais', largura / 2, y);
    y += 30;

    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Arial';

    Object.entries(empresas).forEach(([empresa, igrejas]) => {
        // Quebra de página simples (inicia nova coluna vertical) – se faltar espaço, apenas aumenta canvas previsto acima
        const corEmpresa = cores[empresa] || { texto: '#000000', claro: '#F5F5F5', escuro: '#ECECEC' };
        ctx.fillStyle = corEmpresa.texto;
        ctx.fillText(empresa, margem, y);
        y += 26;

        // Cabeçalho da tabela
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Igreja', colunaIgrejaX, y);
        ctx.fillText('Pendências (primeiro passo pendente)', colunaPendX, y);
        y += 6;
        ctx.strokeStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.moveTo(margem, y);
        ctx.lineTo(largura - margem, y);
        ctx.stroke();
        y += 8;

        let alterna = false;
        ctx.font = '12px Arial';
        igrejas.forEach(igreja => {
            const det = obterPrimeiraPendencia(igreja);
            const descricao = (!det || det.passo === null) ? 'Sem pendências' : `${det.titulo}: ${det.itens.join(', ')}`;
            const med = medirLinhas(ctx, descricao, larguraPend);
            const linhas = med.linhas;
            const alturaNec = Math.max(alturaBaseLinha, linhas.length * alturaBaseLinha);

            // Fundo alternado
            ctx.fillStyle = alterna ? (cores[empresa]?.escuro || '#ECECEC') : (cores[empresa]?.claro || '#F5F5F5');
            ctx.fillRect(margem, y - (alturaBaseLinha - 6), largura - 2 * margem, alturaNec);

            // Nome da igreja
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            const nomeComId = igreja.id ? `${igreja.nome} - ${igreja.id}` : igreja.nome;
            ctx.fillText(nomeComId, colunaIgrejaX, y);

            // Pendências (múltiplas linhas)
            let yy = y;
            linhas.forEach(l => { ctx.fillText(l, colunaPendX, yy); yy += alturaBaseLinha; });

            y += alturaNec + 4;
            alterna = !alterna;
        });

        y += 12;
    });

    return canvas.toDataURL('image/png');
}

function dataURLParaBlob(dataURL) {
    const partes = dataURL.split(',');
    const mime = partes[0].match(/:(.*?);/)[1];
    const binStr = atob(partes[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

async function abrirModalRelatorioPendenciasImagem() {
    try {
        const dataURL = await gerarImagemRelatorioPendencias();
        const modal = document.createElement('div');
        modal.className = 'nf-modal';
        modal.innerHTML = `
			<div class="nf-modal-content nf-modal-lg">
				<h3 style="margin-top:0;">Relatório de Pendências (Imagem)</h3>
				<div style="max-height:60vh; overflow:auto; border:1px solid #e9ecef; border-radius:6px; padding:8px; background:#fff;">
					<img id="imgRelPend" src="${dataURL}" alt="Relatório de Pendências" style="width:100%; height:auto; display:block;" />
				</div>
				<div class="nf-modal-buttons">
					<button type="button" class="btn-secondary" id="btnFecharImgRel">Fechar</button>
					<button type="button" class="btn-secondary" id="btnBaixarImgRel">
						<i class="fas fa-download"></i> Baixar Imagem
					</button>
					<button type="button" class="btn-primary" id="btnShareWhats">
						<i class="fas fa-share"></i> Compartilhar WhatsApp
					</button>
				</div>
			</div>
		`;
        document.body.appendChild(modal);

        // Ações
        modal.querySelector('#btnFecharImgRel').addEventListener('click', () => modal.remove());
        modal.querySelector('#btnBaixarImgRel').addEventListener('click', () => {
            try {
                const blob = dataURLParaBlob(dataURL);
                if (typeof saveAs === 'function') {
                    saveAs(blob, 'relatorio_pendencias.png');
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'relatorio_pendencias.png'; a.click();
                    URL.revokeObjectURL(url);
                }
            } catch (e) { console.error('Falha ao baixar imagem', e); }
        });

        modal.querySelector('#btnShareWhats').addEventListener('click', async () => {
            try {
                const blob = dataURLParaBlob(dataURL);
                const arquivo = new File([blob], 'relatorio_pendencias.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [arquivo] }) && navigator.share) {
                    await navigator.share({ files: [arquivo], title: 'Relatório de Pendências', text: 'Segue o relatório de pendências.' });
                } else {
                    // Fallback: baixa a imagem e abre WhatsApp Web com mensagem pré-preenchida
                    if (typeof saveAs === 'function') saveAs(blob, 'relatorio_pendencias.png');
                    const msg = encodeURIComponent('Segue o relatório de pendências. A imagem foi baixada automaticamente; anexe no WhatsApp.');
                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                }
            } catch (e) {
                console.error('Erro ao compartilhar imagem:', e);
                alert('Não foi possível compartilhar. A imagem será baixada. Envie pelo WhatsApp anexando o arquivo.');
                try { const blob = dataURLParaBlob(dataURL); if (typeof saveAs === 'function') saveAs(blob, 'relatorio_pendencias.png'); } catch (_) { }
            }
        });
    } catch (error) {
        console.error('Erro ao gerar imagem de relatório:', error);
        alert('Falha ao gerar o relatório como imagem.');
    }
}

// Compartilha o PDF via WhatsApp
async function compartilharPDFWhatsApp() {
    try {
        const doc = await gerarPDFNF();
        const pdfBlob = doc.output('blob');

        // Salva o PDF localmente
        doc.save('notas_fiscais.pdf');

        // Abre o WhatsApp Web com uma mensagem
        const message = encodeURIComponent('Segue o relatório de notas fiscais em anexo.');
        window.open(`https://wa.me/?text=${message}`, '_blank');
    } catch (error) {
        console.error('Erro ao compartilhar PDF:', error);
        alert('Erro ao compartilhar o PDF. Por favor, tente novamente.');
    }
}

// Arquiva uma igreja
function arquivarIgreja(index) {
    const igreja = nfData.igrejas.splice(index, 1)[0];
    igreja.dataArquivamento = new Date().toISOString();
    nfData.arquivadas.push(igreja);
    salvarDadosNF();
    atualizarListaNF();
}

// Restaura uma igreja arquivada
function restaurarIgreja(index) {
    const igreja = nfData.arquivadas.splice(index, 1)[0];
    delete igreja.dataArquivamento;
    nfData.igrejas.push(igreja);
    salvarDadosNF();
    atualizarListaNF();
}

// Filtra as igrejas pelo termo de busca
function filtrarIgrejas(igrejas, termoBusca) {
    if (!termoBusca) return igrejas;

    const termo = termoBusca.toLowerCase();
    return igrejas.filter(igreja =>
        igreja.nome.toLowerCase().includes(termo) ||
        igreja.empresa.toLowerCase().includes(termo)
    );
}

// Evita re-render desnecessário (mantém hover, reduz custo)
let _nfLastRenderHash = '';
function atualizarListaNF() {
    const container = document.getElementById('nfList');
    if (!container) return;
    const hash = (nfData._ts || 0) + '-' + (nfData.igrejas||[]).length + ':' + (nfData.arquivadas||[]).length + ':' + (nfData.especiais||[]).length;
    if (hash === _nfLastRenderHash) return;
    _nfLastRenderHash = hash;

    container.innerHTML = '';

    // Cria as abas Ativas/Arquivadas/Especiais
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'nf-tabs';
    tabsContainer.innerHTML = `
        <button class="nf-tab-button active" data-tab="ativas">Igrejas Ativas</button>
        <button class="nf-tab-button" data-tab="arquivadas">Igrejas Arquivadas</button>
        <button class="nf-tab-button" data-tab="especiais">Igrejas Especiais</button>
    `;
    container.appendChild(tabsContainer);

    // Container para o conteúdo das abas
    const contentContainer = document.createElement('div');
    contentContainer.className = 'nf-content';
    container.appendChild(contentContainer);

    // Adiciona event listeners para as abas (com touchend para Android/MIUI)
    tabsContainer.querySelectorAll('.nf-tab-button').forEach(button => {
        function ativarTabNF() {
            tabsContainer.querySelectorAll('.nf-tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            mostrarLista(button.dataset.tab);
        }

        let _touchHandled = false;
        let _tx = 0, _ty = 0;
        button.addEventListener('touchstart', (e) => { _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; _touchHandled = false; }, { passive: true });
        button.addEventListener('touchend', (e) => {
            const dx = Math.abs(e.changedTouches[0].clientX - _tx);
            const dy = Math.abs(e.changedTouches[0].clientY - _ty);
            if (dx < 15 && dy < 15) { _touchHandled = true; ativarTabNF(); setTimeout(() => { _touchHandled = false; }, 500); }
        }, { passive: true });
        button.addEventListener('click', () => { if (_touchHandled) return; ativarTabNF(); });
    });

    // Função para mostrar a lista apropriada
    function mostrarLista(tipo) {
        contentContainer.innerHTML = '';

        // Adiciona campo de pesquisa + botão Adicionar
        const searchContainer = document.createElement('div');
        searchContainer.className = 'nf-search-container';
        searchContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div class="nf-search-box" style="flex: 1; min-width: 160px;">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Pesquisar igreja..." class="nf-search-input">
                </div>
                ${tipo === 'ativas' ? '<button class="btn-primary nf-add-button" style="white-space: nowrap;"><i class="fas fa-plus"></i> Adicionar</button>' : ''}
            </div>
        `;
        contentContainer.appendChild(searchContainer);

        // Função que atualiza a tabela com base na pesquisa
        function atualizarTabela(termoBusca = '') {
            const dados = tipo === 'ativas' ? nfData.igrejas
                        : tipo === 'arquivadas' ? nfData.arquivadas
                        : (nfData.especiais || []);
            const igrejasFiltradas = filtrarIgrejas(dados, termoBusca);

            // Remove tabela anterior se existir
            const tabelaAntiga = contentContainer.querySelector('.nf-table');
            if (tabelaAntiga) {
                tabelaAntiga.remove();
            }

            // Mensagem quando não há resultados
            if (igrejasFiltradas.length === 0) {
                const mensagem = document.createElement('div');
                mensagem.className = 'nf-no-results';
                mensagem.innerHTML = termoBusca
                    ? `Nenhuma igreja encontrada para "${termoBusca}"`
                    : 'Nenhuma igreja disponível';
                contentContainer.appendChild(mensagem);
                return;
            }

            // Agrupa as igrejas por empresa
            const empresas = {};
            igrejasFiltradas.forEach(igreja => {
                if (!empresas[igreja.empresa]) {
                    empresas[igreja.empresa] = [];
                }
                empresas[igreja.empresa].push(igreja);
            });

            // Cria a tabela
            const table = document.createElement('table');
            table.className = 'nf-table';

            // Cabeçalho da tabela
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Empresa</th>
                    <th>Igreja</th>
                    <th>Pendência</th>
                    <th>Valor</th>
                    <th>Ações</th>
                </tr>
            `;
            table.appendChild(thead);

            // Corpo da tabela
            const tbody = document.createElement('tbody');

            for (const [empresa, igrejas] of Object.entries(empresas)) {
                igrejas.forEach((igreja, index) => {
                    const tr = document.createElement('tr');
                    tr.className = empresa.includes('Impacto') ? 'nf-row-impacto' : 'nf-row-spg';

                    const idx = dados.indexOf(igreja);
                    const btnWhatsApp = `<button onclick="compartilharNFWhatsApp('${tipo}', ${idx})" class="btn-whatsapp-nf" title="Compartilhar via WhatsApp"><i class="fab fa-whatsapp"></i></button>`;

                    const acaoBotao = tipo === 'ativas'
                        ? `<button onclick="arquivarIgreja(${idx})" class="btn-archive" title="Arquivar igreja"><i class="fas fa-archive"></i></button>
                           <button onclick="moverParaEspeciais(${idx})" class="btn-especial" title="Mover para Igrejas Especiais"><i class="fas fa-star"></i></button>
                           ${btnWhatsApp}
                           <button onclick="editarIgreja(${idx}, '${tipo}')" class="btn-edit" title="Editar igreja"><i class="fas fa-edit"></i></button>
                           <button onclick="excluirIgreja(${idx}, '${tipo}')" class="btn-delete" title="Excluir igreja"><i class="fas fa-trash"></i></button>`
                        : tipo === 'especiais'
                        ? `<button onclick="moverEspecialParaAtiva(${idx})" class="btn-restore" title="Mover para Ativas"><i class="fas fa-undo"></i></button>
                           ${btnWhatsApp}
                           <button onclick="editarIgreja(${idx}, '${tipo}')" class="btn-edit" title="Editar igreja"><i class="fas fa-edit"></i></button>
                           <button onclick="excluirIgreja(${idx}, '${tipo}')" class="btn-delete" title="Excluir igreja"><i class="fas fa-trash"></i></button>`
                        : `<button onclick="restaurarIgreja(${idx})" class="btn-restore" title="Restaurar igreja"><i class="fas fa-undo"></i></button>
                           ${btnWhatsApp}
                           <button onclick="editarIgreja(${idx}, '${tipo}')" class="btn-edit" title="Editar igreja"><i class="fas fa-edit"></i></button>
                           <button onclick="excluirIgreja(${idx}, '${tipo}')" class="btn-delete" title="Excluir igreja"><i class="fas fa-trash"></i></button>`;

                    const pendAtual = (igreja.pendencia || '').toString().trim().toUpperCase();
                    const pendenciaOptions = `
                        <select class="nf-pendencia-select" onchange="atualizarPendencia(${dados.indexOf(igreja)}, '${tipo}', this.value)">
                            <option value="" ${!pendAtual ? 'selected' : ''}>—</option>
                            <option value="ASSINATURA" ${pendAtual === 'ASSINATURA' ? 'selected' : ''}>ASSINATURA</option>
                            <option value="EXECUÇÃO" ${pendAtual === 'EXECUÇÃO' ? 'selected' : ''}>EXECUÇÃO</option>
                            <option value="RELATÓRIO" ${pendAtual === 'RELATÓRIO' ? 'selected' : ''}>RELATÓRIO</option>
                            <option value="LOGIX" ${pendAtual === 'LOGIX' ? 'selected' : ''}>LOGIX</option>
                            <option value="NFE" ${pendAtual === 'NFE' ? 'selected' : ''}>NFE</option>
                            <option value="PAGAMENTO" ${pendAtual === 'PAGAMENTO' ? 'selected' : ''}>PAGAMENTO</option>
                            <option value="PAGO" ${pendAtual === 'PAGO' ? 'selected' : ''}>PAGO</option>
                        </select>
                    `;

                    const igrejaHTML = igreja.id
                        ? `<span class="nf-igreja-link" data-index="${idx}" data-tipo="${tipo}">${igreja.nome}</span> - <span class="nf-id-link" data-id="${igreja.id}" data-link="${igreja.link || ''}" title="Clique para copiar o número e abrir o link">${igreja.id}</span>`
                        : `<span class="nf-igreja-link" data-index="${idx}" data-tipo="${tipo}">${igreja.nome}</span>`;

                    tr.innerHTML = `
                        <td class="${index === 0 ? (empresa.includes('Impacto') ? 'nf-empresa-impacto' : 'nf-empresa-spg') : ''}">${index === 0 ? empresa : ''}</td>
                        <td data-label="Igreja">${igrejaHTML}</td>
                        <td data-label="Pendência">${pendenciaOptions}</td>
                        <td data-label="Valor">${igreja.valor}</td>
                        <td data-label="Ações" class="nf-acoes">${acaoBotao}</td>
                    `;

                    tbody.appendChild(tr);
                });
            }

            table.appendChild(tbody);
            contentContainer.appendChild(table);

            // Ativa clique no nome da igreja para abrir checklist
            contentContainer.querySelectorAll('.nf-igreja-link').forEach(el => {
                el.style.cursor = 'pointer';
                el.title = 'Ver checklist';
                el.addEventListener('click', () => {
                    const idx = parseInt(el.getAttribute('data-index'));
                    const tp = el.getAttribute('data-tipo');
                    abrirChecklistModal(idx, tp);
                });
            });

            // Ativa clique no número do pedido para copiar e abrir link
            contentContainer.querySelectorAll('.nf-id-link').forEach(el => {
                el.style.cursor = 'pointer';
                el.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Evita que o clique abra o modal
                    const id = el.getAttribute('data-id');
                    const link = el.getAttribute('data-link');

                    // Copia o número
                    try {
                        await navigator.clipboard.writeText(id);
                        // Feedback visual
                        const textoOriginal = el.textContent;
                        el.textContent = '✓ Copiado!';
                        el.style.color = '#28a745';
                        setTimeout(() => {
                            el.textContent = textoOriginal;
                            el.style.color = '';
                        }, 1500);
                    } catch (err) {
                        console.error('Erro ao copiar:', err);
                        alert('Não foi possível copiar o número.');
                    }

                    // Abre o link em nova aba (se existir)
                    if (link && link.trim()) {
                        window.open(link, '_blank');
                    }
                });
            });
        }

        // Adiciona listener para o campo de pesquisa
        const searchInput = searchContainer.querySelector('.nf-search-input');
        let timeoutId = null;
        searchInput.addEventListener('input', (e) => {
            // Cancela o timeout anterior se existir
            if (timeoutId) clearTimeout(timeoutId);

            // Cria um novo timeout para evitar muitas atualizações
            timeoutId = setTimeout(() => {
                atualizarTabela(e.target.value.trim());
            }, 300);
        });

        // Adiciona listener para o botão Adicionar (apenas em Ativas)
        const addButton = searchContainer.querySelector('.nf-add-button');
        if (addButton) {
            addButton.addEventListener('click', () => abrirModalAdicionarIgreja());
        }

        // Mostra a tabela inicial
        atualizarTabela();

        // Adiciona o botão de download para a aba ativa
        if (tipo === 'ativas') {
            const botoesContainer = document.createElement('div');
            botoesContainer.className = 'nf-botoes-container';
            botoesContainer.innerHTML = `
                <button onclick="gerarPDFNF().then(doc => doc.save('notas_fiscais.pdf'))" class="btn-primary">
                    <i class="fas fa-file-pdf"></i> Gerar PDF
                </button>
                <button onclick="gerarPDFListaSimples().then(doc => doc.save('lista_igrejas.pdf'))" class="btn-primary" style="background: #28a745;">
                    <i class="fas fa-list"></i> Lista Simples
                </button>
				<button onclick="abrirModalRelatorioPendenciasImagem()" class="btn-secondary">
					<i class="fas fa-clipboard-list"></i> Relatório
				</button>
            `;
            contentContainer.appendChild(botoesContainer);
        }
    }

    // Mostra a lista ativa por padrão
    mostrarLista('ativas');

    // Garante que os estilos existem apenas uma vez no head
    if (!document.getElementById('nf-dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'nf-dynamic-styles';
    style.textContent = `
        .nf-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 2px;
        }
        .nf-tabs::-webkit-scrollbar { display: none; }
        .nf-tab-button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #f0f0f0;
            color: #666;
            transition: all 0.2s ease;
        }
        .nf-tab-button.active {
            background: var(--primary-color);
            color: white;
        }
        .nf-search-container {
            margin-bottom: 20px;
        }
        .nf-search-box {
            display: flex;
            align-items: center;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            max-width: 300px;
        }
        .nf-search-box i {
            color: #666;
            margin-right: 8px;
        }
        .nf-search-input {
            border: none;
            outline: none;
            width: 100%;
            font-size: 16px; /* mínimo 16px evita zoom no iOS Safari */
        }
        .nf-search-input::placeholder {
            color: #999;
        }
        .nf-no-results {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
        }
        .nf-row-impacto {
            background-color: #ffe6e6 !important;
        }
        .nf-row-impacto:nth-child(even) {
            background-color: #ffcccc !important;
        }
        .nf-row-spg {
            background-color: #e6f0ff !important;
        }
        .nf-row-spg:nth-child(even) {
            background-color: #cce0ff !important;
        }
        .nf-empresa-impacto {
            color: #DC143C !important;
            font-weight: bold;
            font-size: 1.1em;
        }
        .nf-empresa-spg {
            color: #00539B !important;
            font-weight: bold;
            font-size: 1.1em;
        }
        .nf-acoes {
            text-align: center;
            white-space: nowrap;
        }
        .nf-pendencia-select {
            min-width: 130px;
            width: 130px;
            font-size: 0.82em;
            padding: 4px 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn-archive, .btn-restore {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #f0f0f0;
            color: #666;
            transition: all 0.2s ease;
        }
        .btn-archive:hover {
            background: #e0e0e0;
            color: #333;
        }
        .btn-especial {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #fff8e1;
            color: #f59e0b;
            transition: all 0.2s ease;
        }
        .btn-especial:hover {
            background: #fde68a;
            color: #d97706;
        }
        .btn-whatsapp-nf {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #e8f5e9;
            color: #25d366;
            transition: all 0.2s ease;
            font-size: 1em;
        }
        .btn-whatsapp-nf:hover {
            background: #25d366;
            color: #fff;
        }
        .btn-restore {
            background: var(--primary-color);
            color: white;
        }
        .btn-restore:hover {
            opacity: 0.9;
        }
        .nf-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .nf-modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .nf-modal-lg {
            max-width: 800px;
            max-height: 85vh;
            overflow-y: auto;
        }
        .nf-modal-content h3 {
            margin-top: 0;
            margin-bottom: 20px;
            color: var(--primary-color);
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #666;
        }
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px; /* mínimo 16px evita zoom no iOS Safari */
        }
        .nf-modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .btn-edit,
        .btn-delete {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-edit {
            background: #4CAF50;
            color: white;
        }
        .btn-edit:hover {
            background: #45a049;
        }
        .btn-delete {
            background: #f44336;
            color: white;
        }
        .btn-delete:hover {
            background: #da190b;
        }
        .btn-secondary {
            background: #f0f0f0;
            color: #666;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        .nf-steps { display: grid; gap: 16px; }
        .nf-step h4 { margin: 0 0 8px 0; color: #2c3e50; }
        .nf-item-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 6px; }
        .nf-item-label { font-weight: 600; color: #444; }
        .nf-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; color: #fff; min-width: 50px; text-align: center; }
        .nf-badge--sim { background: #28a745; }
        .nf-badge--nao { background: #dc3545; }
        .nf-igreja-link { color: var(--primary-color); text-decoration: underline; }
        .nf-igreja-id { margin-left: 8px; color: #6c757d; font-weight: 600; }
        .nf-id-link { 
            color: #007bff; 
            text-decoration: underline; 
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .nf-id-link:hover { 
            color: #0056b3; 
            text-decoration: none; 
        }
        /* Radios lado a lado no canto direito */
        .nf-radio-group { display: flex; gap: 14px; align-items: center; }
        .nf-radio-group label { display: inline-flex; align-items: center; gap: 6px; margin: 0; }
        .nf-radio-group input[type="radio"] { margin: 0; }
    `;
    document.head.appendChild(style);
    } // fim do guard de estilos
}

// Função para excluir uma igreja
function excluirIgreja(index, tipo) {
    if (!confirm('Tem certeza que deseja excluir esta igreja? Esta ação não pode ser desfeita.')) {
        return;
    }

    const lista = tipo === 'ativas' ? nfData.igrejas
                : tipo === 'especiais' ? (nfData.especiais || [])
                : nfData.arquivadas;
    lista.splice(index, 1);
    salvarDadosNF();
    atualizarListaNF();
}

function compartilharNFWhatsApp(tipo, index) {
    const lista = tipo === 'ativas' ? nfData.igrejas
                : tipo === 'especiais' ? (nfData.especiais || [])
                : nfData.arquivadas;
    const igreja = lista && lista[index];
    if (!igreja) return;

    const nome = (igreja.nome || '').trim();
    const id   = (igreja.id   || '').toString().trim();
    const mensagem = id ? `${nome} - ${id}` : nome;
    const encoded  = encodeURIComponent(mensagem);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        if (navigator.share) {
            navigator.share({ text: mensagem }).catch(() => {
                window.location.href = 'whatsapp://send?text=' + encoded;
            });
        } else {
            window.location.href = 'whatsapp://send?text=' + encoded;
        }
    } else {
        window.open('https://web.whatsapp.com/send?text=' + encoded, '_blank');
    }
}

function moverParaEspeciais(index) {
    if (!nfData.igrejas || !nfData.igrejas[index]) return;
    const igreja = nfData.igrejas.splice(index, 1)[0];
    if (!nfData.especiais) nfData.especiais = [];
    nfData.especiais.push(igreja);
    salvarDadosNF();
    atualizarListaNF();
}

function moverEspecialParaAtiva(index) {
    if (!nfData.especiais || !nfData.especiais[index]) return;
    const igreja = nfData.especiais.splice(index, 1)[0];
    delete igreja.dataArquivamento;
    if (!nfData.igrejas) nfData.igrejas = [];
    nfData.igrejas.push(igreja);
    salvarDadosNF();
    atualizarListaNF();
}

// Função para editar uma igreja
function editarIgreja(index, tipo) {
    if (typeof index !== 'number' || !tipo) {
        console.error('Parâmetros inválidos:', { index, tipo });
        return;
    }

    const lista = tipo === 'ativas' ? nfData.igrejas
                : tipo === 'especiais' ? (nfData.especiais || [])
                : nfData.arquivadas;
    if (!lista || !Array.isArray(lista)) {
        console.error('Lista inválida:', lista);
        return;
    }

    const igreja = lista[index];
    if (!igreja) {
        console.error('Igreja não encontrada no índice:', index);
        return;
    }

    console.log('Editando igreja:', igreja);

    if (!igreja.checklist) igreja.checklist = getDefaultChecklist();

    // Cria o modal de edição
    const modal = document.createElement('div');
    modal.className = 'nf-modal';
    modal.innerHTML = `
        <div class="nf-modal-content nf-modal-lg">
            <h3>Editar Igreja</h3>
            <form id="editarIgrejaForm">
                <div class="form-group">
                    <label for="nomeIgreja">Nome da Igreja:</label>
                    <input type="text" id="nomeIgreja" value="${igreja.nome || ''}" required>
                </div>
                <div class="form-group">
                    <label for="idIgrejaNF">Nº do Pedido:</label>
                    <input type="text" id="idIgrejaNF" value="${igreja.id || ''}">
                </div>
                <div class="form-group">
                    <label for="codigoIgrejaNF">Código da Igreja:</label>
                    <input type="text" id="codigoIgrejaNF" value="${igreja.codigo || ''}" placeholder="Ex: 060137">
                </div>
                <div class="form-group">
                    <label for="empresaIgreja">Empresa:</label>
                    <select id="empresaIgreja" required>
                        <option value="Impacto Soluções" ${igreja.empresa === 'Impacto Soluções' ? 'selected' : ''}>Impacto Soluções</option>
                        <option value="SPG da Silva Sonorização e Iluminação" ${igreja.empresa === 'SPG da Silva Sonorização e Iluminação' ? 'selected' : ''}>SPG da Silva Sonorização e Iluminação</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="valorIgreja">Valor:</label>
                    <input type="text" id="valorIgreja" value="${igreja.valor || ''}" required>
                </div>
                <div class="form-group">
                    <label for="linkIgrejaNF">Link:</label>
                    <input type="text" id="linkIgrejaNF" value="${igreja.link || ''}">
                </div>
                <div class="section" style="padding: 10px; border: 1px solid #e9ecef; border-radius: 6px;">
                    <h4 style="margin-top:0; color:#2c3e50;">Checklist</h4>
                    <div class="form-group">
                        <label>1º passo - Assinaturas</label>
                        <div class="nf-item-row"><span class="nf-item-label">SANDRO</span>
                            <div class="nf-radio-group">
                                <label style="margin-right:8px;"><input type="radio" name="ch_sandro" value="sim" ${igreja.checklist.assinatura_sandro ? 'checked' : ''}> SIM</label>
                                <label><input type="radio" name="ch_sandro" value="nao" ${!igreja.checklist.assinatura_sandro ? 'checked' : ''}> NÃO</label>
                            </div>
                        </div>
                        <div class="nf-item-row"><span class="nf-item-label">FILIPPI</span>
                            <div class="nf-radio-group">
                                <label style="margin-right:8px;"><input type="radio" name="ch_filippi" value="sim" ${igreja.checklist.assinatura_filippi ? 'checked' : ''}> SIM</label>
                                <label><input type="radio" name="ch_filippi" value="nao" ${!igreja.checklist.assinatura_filippi ? 'checked' : ''}> NÃO</label>
                            </div>
                        </div>
                        <div class="nf-item-row"><span class="nf-item-label">RODRIGO</span>
                            <div class="nf-radio-group">
                                <label style="margin-right:8px;"><input type="radio" name="ch_rodrigo" value="sim" ${igreja.checklist.assinatura_rodrigo ? 'checked' : ''}> SIM</label>
                                <label><input type="radio" name="ch_rodrigo" value="nao" ${!igreja.checklist.assinatura_rodrigo ? 'checked' : ''}> NÃO</label>
                            </div>
                        </div>
                        <div class="nf-item-row"><span class="nf-item-label">ANDRÉ</span>
                            <div class="nf-radio-group">
                                <label style="margin-right:8px;"><input type="radio" name="ch_andre" value="sim" ${igreja.checklist.assinatura_andre ? 'checked' : ''}> SIM</label>
                                <label><input type="radio" name="ch_andre" value="nao" ${!igreja.checklist.assinatura_andre ? 'checked' : ''}> NÃO</label>
                            </div>
                        </div>
                        <div class="nf-item-row"><span class="nf-item-label">FERNANDO</span>
                            <div class="nf-radio-group">
                                <label style="margin-right:8px;"><input type="radio" name="ch_fernando" value="sim" ${igreja.checklist.assinatura_fernando ? 'checked' : ''}> SIM</label>
                                <label><input type="radio" name="ch_fernando" value="nao" ${!igreja.checklist.assinatura_fernando ? 'checked' : ''}> NÃO</label>
                            </div>
                        </div>
                    </div>
                <div class="form-group">
                    <label>2º passo - Pedido e Assinatura</label>
                    <div class="nf-item-row"><span class="nf-item-label">PEDIDO</span>
                        <div class="nf-radio-group">
                            <label style="margin-right:8px;"><input type="radio" name="ch_pedido" value="sim" ${igreja.checklist.doc_pedido ? 'checked' : ''}> SIM</label>
                            <label><input type="radio" name="ch_pedido" value="nao" ${!igreja.checklist.doc_pedido ? 'checked' : ''}> NÃO</label>
                        </div>
                    </div>
                    <div class="nf-item-row"><span class="nf-item-label">ASSINATURA</span>
                        <div class="nf-radio-group">
                            <label style="margin-right:8px;"><input type="radio" name="ch_doc_assinatura" value="sim" ${igreja.checklist.doc_assinatura ? 'checked' : ''}> SIM</label>
                            <label><input type="radio" name="ch_doc_assinatura" value="nao" ${!igreja.checklist.doc_assinatura ? 'checked' : ''}> NÃO</label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>3º passo - Relatório, NF e Execução</label>
                    <div class="nf-item-row"><span class="nf-item-label">RELATÓRIO</span>
                        <div class="nf-radio-group">
                            <label style="margin-right:8px;"><input type="radio" name="ch_relatorio" value="sim" ${igreja.checklist.doc_relatorio ? 'checked' : ''}> SIM</label>
                            <label><input type="radio" name="ch_relatorio" value="nao" ${!igreja.checklist.doc_relatorio ? 'checked' : ''}> NÃO</label>
                        </div>
                    </div>
                    <div class="nf-item-row"><span class="nf-item-label">NF</span>
                        <div class="nf-radio-group">
                            <label style="margin-right:8px;"><input type="radio" name="ch_nf" value="sim" ${igreja.checklist.doc_nf ? 'checked' : ''}> SIM</label>
                            <label><input type="radio" name="ch_nf" value="nao" ${!igreja.checklist.doc_nf ? 'checked' : ''}> NÃO</label>
                        </div>
                    </div>
                    <div class="nf-item-row"><span class="nf-item-label">EXECUÇÃO</span>
                        <div class="nf-radio-group">
                            <label style="margin-right:8px;"><input type="radio" name="ch_feito" value="sim" ${igreja.checklist.execucao_feito ? 'checked' : ''}> SIM</label>
                            <label><input type="radio" name="ch_feito" value="nao" ${!igreja.checklist.execucao_feito ? 'checked' : ''}> NÃO</label>
                        </div>
                    </div>
                </div>
                </div>
                <div class="nf-modal-buttons">
                    <button type="submit" class="btn-primary">Salvar</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.nf-modal').remove()">Cancelar</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Adiciona o evento de submit ao formulário
    const form = document.getElementById('editarIgrejaForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Captura os novos valores
        const novoNome = document.getElementById('nomeIgreja').value.trim();
        const novoId = document.getElementById('idIgrejaNF').value.trim();
        const novoCodigo = document.getElementById('codigoIgrejaNF').value.trim();
        const novoLink = document.getElementById('linkIgrejaNF').value.trim();
        const novaEmpresa = document.getElementById('empresaIgreja').value;
        const novoValor = document.getElementById('valorIgreja').value.trim();

        // Lê checklist atualizado
        const checklistAtualizado = {
            assinatura_sandro: (document.querySelector('input[name="ch_sandro"]:checked') || {}).value === 'sim',
            assinatura_filippi: (document.querySelector('input[name="ch_filippi"]:checked') || {}).value === 'sim',
            assinatura_rodrigo: (document.querySelector('input[name="ch_rodrigo"]:checked') || {}).value === 'sim',
            assinatura_andre: (document.querySelector('input[name="ch_andre"]:checked') || {}).value === 'sim',
            assinatura_fernando: (document.querySelector('input[name="ch_fernando"]:checked') || {}).value === 'sim',
            doc_pedido: (document.querySelector('input[name="ch_pedido"]:checked') || {}).value === 'sim',
            doc_assinatura: (document.querySelector('input[name="ch_doc_assinatura"]:checked') || {}).value === 'sim',
            doc_relatorio: (document.querySelector('input[name="ch_relatorio"]:checked') || {}).value === 'sim',
            doc_nf: (document.querySelector('input[name="ch_nf"]:checked') || {}).value === 'sim',
            execucao_feito: (document.querySelector('input[name="ch_feito"]:checked') || {}).value === 'sim'
        };

        // Mantém os valores originais se os campos não foram alterados
        const igrejaAtualizada = {
            ...igreja, // Mantém todos os dados originais
            nome: novoNome || igreja.nome, // Se novoNome estiver vazio, mantém o original
            id: novoId || igreja.id,
            codigo: novoCodigo || igreja.codigo || null, // Código da igreja
            link: novoLink || igreja.link,
            empresa: novaEmpresa || igreja.empresa, // Se novaEmpresa estiver vazia, mantém a original
            valor: novoValor ? obterValorFormatado(novoValor) : igreja.valor, // Formata novo valor se fornecido
            checklist: checklistAtualizado
        };

        console.log('Igreja antes da atualização:', lista[index]);
        console.log('Valores do formulário:', { novoNome, novaEmpresa, novoValor });

        // Atualiza a igreja na lista
        lista[index] = igrejaAtualizada;

        console.log('Igreja após atualização:', lista[index]);
        console.log('Estado atual do nfData:', nfData);

        // Salva as alterações
        salvarDadosNF();

        // Atualiza a interface
        atualizarListaNF();

        // Fecha o modal
        modal.remove();
    });
}

// Atualiza e salva a pendência de uma igreja
function atualizarPendencia(index, tipo, pendencia) {
    const lista = tipo === 'ativas' ? nfData.igrejas
                : tipo === 'especiais' ? (nfData.especiais || [])
                : nfData.arquivadas;
    if (!lista || !lista[index]) return;
    lista[index].pendencia = (pendencia || '').toString().trim().toUpperCase();
    salvarDadosNF();
}

// Expõe funções globalmente
window.adicionarIgrejaNF = adicionarIgrejaNF;
window.gerarPDFNF = gerarPDFNF;
window.gerarPDFListaSimples = gerarPDFListaSimples;
window.gerarPDFRelatorioPendencias = gerarPDFRelatorioPendencias;
window.abrirModalRelatorioPendenciasImagem = abrirModalRelatorioPendenciasImagem;
window.arquivarIgreja = arquivarIgreja;
window.restaurarIgreja = restaurarIgreja;
window.compartilharNFWhatsApp = compartilharNFWhatsApp;
window.moverParaEspeciais     = moverParaEspeciais;
window.moverEspecialParaAtiva = moverEspecialParaAtiva;
window.atualizarPendencia = atualizarPendencia;
window.abrirChecklistModal = abrirChecklistModal;
window.salvarDadosNF = salvarDadosNF;

// Inicializa o módulo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de NFs...');
    carregarDadosNF();
}); 