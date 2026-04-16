// Funções para geração de PDFs para empresas principais

// Textos para diferentes tipos de orçamento - EMPRESA PRINCIPAL (Impacto/SPG)
const TEXTOS_ORCAMENTO = {
    padrao: "Para atender as especificações técnicas apresentadas, a relação da prestação de serviço visa sua execução considerando todos os itens descritos pelo seu valor no quadro abaixo.",

    forro: `ORÇAMENTO – IGREJA CRISTÃ MARANATA

Contratante: Igreja Cristã Maranata – {NOME_IGREJA}

Objeto: Serviços de instalação e revestimentos internos

1. Escopo dos Serviços

1.1 Instalação de Forro Mineral

Instalação completa de forro mineral na área definida pela igreja.

Observação: O material será fornecido pelo cliente final.

Inclui mão de obra especializada, ferramenta adequada e nivelamento.

1.2 Instalação de PVC Madeirado nas Colunas Laterais

Revestimento das colunas laterais em PVC padrão madeirado.

Serviço inclui corte, fixação, acabamento e limpeza.

1.3 Fechamento Interno das Colunas em Madeira Maciça

Execução do fechamento interno das colunas utilizando madeira maciça.

Inclui mão de obra para montagem, fixação e acabamento final.

---

2. Valor Total do Serviço

{VALOR_SERVICO}

— Valor referente exclusivamente à prestação dos serviços listados.

---

3. Condições Gerais

Prazo de execução: a definir conforme disponibilidade da equipe e da igreja.`,

    tenda: `Orçamento – Aluguel de Toldo

Prezados,

Apresentamos abaixo a proposta para locação de toldo para atendimento ao evento solicitado.

Serviço incluso:

• Fornecimento e instalação de toldo no modelo e dimensões adequadas ao espaço indicado;
• Estrutura reforçada, com material resistente e lona de alta durabilidade;
• Montagem e desmontagem realizadas por equipe especializada;
• Transporte de todos os materiais até o local do evento.

Observações:

• O prazo mínimo recomendado para reserva é de 48 horas de antecedência;
• O local deve estar desobstruído no momento da montagem;
• Em caso de necessidade de adequações adicionais, o orçamento poderá ser revisado.

Permanecemos à disposição para qualquer ajuste ou esclarecimento.`,

    vidro: `ORÇAMENTO – IGREJA CRISTÃ MARANATA

Contratante: Igreja Cristã Maranata – {NOME_IGREJA}

Serviço: Montagem, instalação e fechamento em vidro

1. Escopo dos Serviços

1.1 Remoção das Portas Antigas

Retirada completa das portas de madeira existentes.

Inclui:

Porta principal com duas bandeiras superiores.

Porta lateral dos obreiros.

Serviço inclui desmontagem, retirada, descarte e preparação do vão para os novos sistemas.

---

1.2 Fechamento das Aberturas com Parede de Vidro

Execução de fechamento de todas as áreas de vão com estrutura de vidro.

Objetivo: Isolamento acústico do ambiente interno, reduzindo ruídos externos.

Inclui:

Vidros temperados conforme padrão solicitado pela igreja.

Fixação, borrachas, perfis e acabamentos.

---

1.3 Instalação de Portas de Vidro

Portas instaladas com:

Puxador inox modelo tubular.

Mola hidráulica de retorno.

Alinhamento, regulagem e teste final.

---

2. Valor Total

{VALOR_SERVICO}

Valor referente à mão de obra + instalação, podendo incluir ou não o fornecimento dos vidros, conforme sua preferência (basta informar).

---

3. Condições Gerais

Prazo de execução: a definir conforme disponibilidade.`
};

// Textos para CONCORRENTES (versões diferentes)
const TEXTOS_ORCAMENTO_CONCORRENTE = {
    padrao: "Conforme solicitação, segue proposta para execução dos serviços técnicos especializados. Os valores apresentados contemplam todos os itens necessários para a realização do trabalho.",

    forro: `PROPOSTA COMERCIAL

Cliente: Igreja Cristã Maranata – {NOME_IGREJA}

Referência: Serviços de revestimento e acabamento interno

DESCRIÇÃO DOS SERVIÇOS:

1. Forro Mineral
Execução de instalação de forro mineral conforme área especificada.
Material a ser fornecido pelo contratante.
Inclui nivelamento e mão de obra técnica.

2. Revestimento em PVC nas Colunas
Aplicação de PVC madeirado nas colunas laterais.
Serviço completo com corte, instalação e acabamento.

3. Fechamento das Colunas em Madeira
Trabalho de fechamento interno utilizando madeira maciça.
Contempla montagem e acabamento.

---

INVESTIMENTO: {VALOR_SERVICO}

Valor total para execução de todos os serviços descritos.

---

OBSERVAÇÕES:
Prazo para execução será acordado conforme agenda.
Proposta válida por 30 dias.`,

    tenda: `PROPOSTA - LOCAÇÃO DE COBERTURA

Prezados Senhores,

Conforme contato, apresentamos proposta para locação de estrutura de cobertura.

SERVIÇOS CONTEMPLADOS:

• Disponibilização de toldo/cobertura nas dimensões necessárias;
• Estrutura metálica resistente com cobertura impermeável;
• Instalação e retirada por equipe técnica;
• Frete incluso até o local.

INFORMAÇÕES IMPORTANTES:

• Agendamento com mínimo de 48h de antecedência;
• Área de montagem deve estar livre e acessível;
• Ajustes podem alterar o valor final.

Ficamos no aguardo para esclarecimentos.`,

    vidro: `PROPOSTA COMERCIAL - SERVIÇOS EM VIDRO

Cliente: Igreja Cristã Maranata – {NOME_IGREJA}

Referência: Instalação e fechamento em vidro temperado

DESCRIÇÃO DOS SERVIÇOS:

1. Remoção de Portas Existentes
Retirada das portas atuais (principal e lateral).
Inclui desmontagem, descarte e preparação dos vãos.

2. Fechamento com Estrutura de Vidro
Instalação de painéis de vidro para fechamento dos vãos.
Objetivo: melhoria do isolamento acústico.
Contempla vidros temperados, fixações e acabamentos.

3. Portas de Vidro
Instalação de portas com puxadores e molas hidráulicas.
Inclui regulagem e teste de funcionamento.

---

INVESTIMENTO: {VALOR_SERVICO}

Valor contempla mão de obra e instalação.
Fornecimento de materiais sob consulta.

---

CONDIÇÕES:
Prazo de execução a combinar.
Proposta válida por 30 dias.`
};

// Função para obter o texto do orçamento baseado no tipo
function obterTextoOrcamento(tipoTexto, nomeIgreja, valorTotal, isConcorrente = false) {
    const textos = isConcorrente ? TEXTOS_ORCAMENTO_CONCORRENTE : TEXTOS_ORCAMENTO;
    let texto = textos[tipoTexto] || textos.padrao;

    // Substitui placeholders
    texto = texto.replace('{NOME_IGREJA}', nomeIgreja || '');
    texto = texto.replace('{VALOR_SERVICO}', valorTotal || '');

    return texto;
}

// Disponibiliza globalmente para os arquivos de concorrentes
window.obterTextoOrcamento = obterTextoOrcamento;

// Variável global para rastrear a frequência de uso de cada empresa concorrente
const contadorEmpresas = {
    'Virtual Guitar Shop': 0,
    'GG PROAUTO LTDA': 0,
    'STV IMAGEM E SOM': 0,
    'UP SERVIÇOS': 0,
    'SENA AUDIOVISUAL PRODUÇÕES': 0,
    'INSTALASSOM': 0,
    'GLAUBER SISTEMAS CONSTRUTIVOS': 0
};

// Limitador para evitar que uma empresa seja usada mais de X vezes (em caso de muitas igrejas)
const limiteMaximoRepeticao = 2;

// Conjunto global para evitar repetição de concorrentes dentro do mesmo lote (até 6 orçamentos)
let empresasUsadasNoLote = new Set();

// Lista canônica de empresas concorrentes (exposta para regenerar)
const EMPRESAS_CONCORRENTES = [
    'Virtual Guitar Shop',
    'GG PROAUTO LTDA',
    'STV IMAGEM E SOM',
    'UP SERVIÇOS',
    'SENA AUDIOVISUAL PRODUÇÕES',
    'INSTALASSOM',
    'GLAUBER SISTEMAS CONSTRUTIVOS'
];
window.EMPRESAS_CONCORRENTES = EMPRESAS_CONCORRENTES;

/** Opções de concorrente para o select na aba Resultados (alinha com gerarPDFs) */
function obterEmpresasConcorrentesParaSelectUI(dadosOrcamento) {
    const empresaPrincipal = (dadosOrcamento && dadosOrcamento.suaEmpresa && dadosOrcamento.suaEmpresa.nome) || '';
    const tipoTexto = ((dadosOrcamento && dadosOrcamento.tipoTexto) || '').toLowerCase();
    const tipoPermiteGlauber = (tipoTexto === 'forro' || tipoTexto === 'vidro' || tipoTexto === 'personalizado');
    let empresasPossiveis;
    if (tipoPermiteGlauber) {
        empresasPossiveis = ['Virtual Guitar Shop', 'GLAUBER SISTEMAS CONSTRUTIVOS'];
    } else {
        empresasPossiveis = EMPRESAS_CONCORRENTES
            .filter(e => !empresaPrincipal.includes(e))
            .filter(e => e !== 'GLAUBER SISTEMAS CONSTRUTIVOS');
    }
    if (empresasPossiveis.length === 0) empresasPossiveis = ['Virtual Guitar Shop'];
    return empresasPossiveis;
}

/** Pedido especial: duas empresas à escolha (inclui MEGA EVENTOS e TELLA VIDEO) */
function obterEmpresasConcorrentesPedidoEspecialUI(dadosOrcamento) {
    const empresaPrincipal = (dadosOrcamento && dadosOrcamento.suaEmpresa && dadosOrcamento.suaEmpresa.nome) || '';
    const base = [...EMPRESAS_CONCORRENTES, 'MEGA EVENTOS', 'TELLA VIDEO'];
    const visto = new Set();
    return base.filter(e => {
        if (!e || empresaPrincipal.includes(e) || visto.has(e)) return false;
        visto.add(e);
        return true;
    });
}

/** Nome do ficheiro na pasta ORÇAMENTO (mesmo padrão em gerar e regenerar) */
function nomePdfConcorrenteOrcamentoPasta(nomeEmpresa) {
    const base = String(nomeEmpresa || 'Concorrente')
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_');
    return `Orcamento_${base}.pdf`;
}

// Função para gerar os PDFs
async function gerarPDFs(dadosOrcamento, index, pdfsGerados) {
    try {
        const { jsPDF } = window.jspdf;

        // Reset do controle de repetição no início do lote
        if (index === 0) {
            empresasUsadasNoLote = new Set();
        }

        // Verifica se é um pedido especial: gera dois concorrentes fixos
        const isEspecial = (dadosOrcamento && dadosOrcamento.igreja && dadosOrcamento.igreja.tipoPedido === 'especial') ||
            (dadosOrcamento && dadosOrcamento.tipoPedido === 'especial');

        // Lista de possíveis concorrentes (todas as empresas canônicas menos a empresa principal)
        const empresaPrincipal = dadosOrcamento.suaEmpresa.nome;
        const tipoTexto = (dadosOrcamento.tipoTexto || '').toLowerCase();
        const tipoPermiteGlauber = (tipoTexto === 'forro' || tipoTexto === 'vidro' || tipoTexto === 'personalizado');

        let empresasPossiveis;
        if (tipoPermiteGlauber) {
            // Para forro, vidro e personalizados: apenas Virtual Guitar Shop e GLAUBER
            empresasPossiveis = ['Virtual Guitar Shop', 'GLAUBER SISTEMAS CONSTRUTIVOS'];
        } else {
            // Padrão e outros: todas exceto empresa principal E exceto Glauber (só em forro/vidro/personalizado)
            empresasPossiveis = isEspecial ? [] : EMPRESAS_CONCORRENTES
                .filter(e => !empresaPrincipal.includes(e))
                .filter(e => e !== 'GLAUBER SISTEMAS CONSTRUTIVOS');
        }

        if (empresasPossiveis.length === 0) {
            empresasPossiveis = ['Virtual Guitar Shop'];
        }

        // Em lotes de até 6 orçamentos, evita repetição até esgotar 6 opções
        const maxSemRepetir = Math.min(6, empresasPossiveis.length);
        let candidatasSemRepetir = empresasPossiveis.filter(e => !empresasUsadasNoLote.has(e));
        if (empresasUsadasNoLote.size >= maxSemRepetir || candidatasSemRepetir.length === 0) {
            // já usamos 6 distintas (ou todas as opções); permite repetir reiniciando o conjunto
            empresasUsadasNoLote = new Set();
            candidatasSemRepetir = empresasPossiveis;
        }

        // Calcular a média de uso para favorecer menos usadas
        const todasEmpresas = Object.keys(contadorEmpresas);
        const totalUsos = todasEmpresas.reduce((total, empresa) => total + (contadorEmpresas[empresa] || 0), 0);
        const mediaUsos = totalUsos / todasEmpresas.length || 0;

        const empresasSubrepresentadas = candidatasSemRepetir.filter(empresa => {
            const contagem = contadorEmpresas[empresa] || 0;
            return contagem < Math.min(mediaUsos, limiteMaximoRepeticao);
        });

        // Se houver empresas subrepresentadas, priorize-as
        let empresaSelecionada;
        if (empresasSubrepresentadas.length > 0) {
            // Escolha aleatoriamente entre as empresas subrepresentadas
            const indiceAleatorio = Math.floor(Math.random() * empresasSubrepresentadas.length);
            empresaSelecionada = empresasSubrepresentadas[indiceAleatorio];
        } else {
            // Se todas as empresas já estiverem representadas igualmente, escolha a que foi menos usada
            let menorContagem = Infinity;
            const empatadas = [];
            for (const empresa of candidatasSemRepetir) {
                const contagem = contadorEmpresas[empresa] || 0;
                if (contagem < menorContagem) {
                    menorContagem = contagem;
                }
            }
            for (const empresa of candidatasSemRepetir) {
                const contagem = contadorEmpresas[empresa] || 0;
                if (contagem === menorContagem) empatadas.push(empresa);
            }
            // Se houver empate, escolhe aleatoriamente entre as menos usadas
            const iRand = Math.floor(Math.random() * empatadas.length);
            empresaSelecionada = empatadas[iRand];
        }

        // Cria objetos de concorrente
        const valorSuaEmpresa = dadosOrcamento.suaEmpresa.total;
        let concorrenteAleatorio = null;
        let concorrenteMega = null;
        let concorrenteTella = null;

        if (isEspecial) {
            const itensBase = (dadosOrcamento.suaEmpresa.itens || []).map(it => ({ servico: it.servico }));
            const vMega = valorSuaEmpresa * 1.12;
            const vTella = valorSuaEmpresa * 1.15;
            concorrenteMega = {
                nome: 'MEGA EVENTOS',
                itens: itensBase,
                total: vMega,
                totalFormatado: (typeof window.formatarMoeda === 'function') ? window.formatarMoeda(vMega) : ("R$ " + vMega.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")),
                totalPorExtenso: (typeof window.valorPorExtenso === 'function') ? window.valorPorExtenso(vMega) : (vMega.toFixed(2).replace('.', ',') + " reais")
            };
            concorrenteTella = {
                nome: 'TELLA VIDEO',
                itens: itensBase,
                total: vTella,
                totalFormatado: (typeof window.formatarMoeda === 'function') ? window.formatarMoeda(vTella) : ("R$ " + vTella.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")),
                totalPorExtenso: (typeof window.valorPorExtenso === 'function') ? window.valorPorExtenso(vTella) : (vTella.toFixed(2).replace('.', ',') + " reais")
            };
        } else {
            const markup = 1.1 + (Math.random() * 0.05);
            const valorConcorrente = valorSuaEmpresa * markup;
            concorrenteAleatorio = {
                nome: empresaSelecionada,
                itens: (dadosOrcamento.suaEmpresa.itens || []).map(it => ({ servico: it.servico })),
                total: valorConcorrente,
                totalFormatado: (typeof window.formatarMoeda === 'function') ? window.formatarMoeda(valorConcorrente) : ("R$ " + valorConcorrente.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")),
                totalPorExtenso: (typeof window.valorPorExtenso === 'function') ? window.valorPorExtenso(valorConcorrente) : (valorConcorrente.toFixed(2).replace('.', ',') + " reais")
            };
        }

        // Incrementar o contador da empresa selecionada
        if (!isEspecial) {
            contadorEmpresas[concorrenteAleatorio.nome] = (contadorEmpresas[concorrenteAleatorio.nome] || 0) + 1;
            empresasUsadasNoLote.add(concorrenteAleatorio.nome);
            console.log("Contagem atual de empresas:", contadorEmpresas);
        }

        // Gera PDF da sua empresa
        const pdfSuaEmpresa = await gerarPDFSuaEmpresa(dadosOrcamento);

        // Adiciona à lista de NFs e garante que seja exibido
        try {
            console.log('Adicionando igreja à lista de NFs:', {
                nome: dadosOrcamento.igreja.nome,
                empresa: dadosOrcamento.suaEmpresa.nome,
                valor: dadosOrcamento.suaEmpresa.totalFormatado,
                link: dadosOrcamento.igreja.link
            });

            window.adicionarIgrejaNF(
                dadosOrcamento.igreja.nome,
                dadosOrcamento.suaEmpresa.nome,
                dadosOrcamento.suaEmpresa.totalFormatado,
                dadosOrcamento.igreja.id || null,
                dadosOrcamento.igreja.link,
                dadosOrcamento.igreja.codigo || null,
                dadosOrcamento.tipoTexto || 'padrao'
            );
        } catch (error) {
            console.error('Erro ao adicionar igreja à lista de NFs:', error);
        }

        // Gera PDFs de concorrentes
        let pdfConcorrente = null;
        let pdfConcorrenteMega = null;
        let pdfConcorrenteTella = null;
        if (isEspecial) {
            pdfConcorrenteMega = await gerarPDFConcorrente(dadosOrcamento, concorrenteMega, 1);
            pdfConcorrenteTella = await gerarPDFConcorrente(dadosOrcamento, concorrenteTella, 1);
        } else {
            pdfConcorrente = await gerarPDFConcorrente(dadosOrcamento, concorrenteAleatorio, 1);
        }

        // Armazena os PDFs gerados e os dados do orçamento
        const registro = {
            igreja: dadosOrcamento.igreja,
            orcamento: dadosOrcamento,
            pdfSuaEmpresa
        };
        if (isEspecial) {
            registro.pdfConcorrenteMega = pdfConcorrenteMega;
            registro.pdfConcorrenteTella = pdfConcorrenteTella;
            registro.empresaConcorrenteMega = concorrenteMega.nome;
            registro.empresaConcorrenteTella = concorrenteTella.nome;
        } else {
            registro.pdfConcorrente = pdfConcorrente;
            registro.empresaConcorrente = concorrenteAleatorio.nome;
        }
        pdfsGerados[`igreja_${index}`] = registro;

        // Salva automaticamente nas pastas se a opção estiver habilitada
        const checkboxSalvarAuto = document.getElementById('salvarAutomaticoPasta');
        if (checkboxSalvarAuto && checkboxSalvarAuto.checked && typeof window.criarPastasIgreja === 'function') {
            try {
                const nomeIgreja = dadosOrcamento.igreja.nome || 'IGREJA';
                const pastas = await window.criarPastasIgreja(nomeIgreja);

                if (pastas && pastas.orcamento) {
                    // Sanitiza o nome da empresa para o nome do arquivo
                    const empresaNome = dadosOrcamento.suaEmpresa.nome
                        .replace(/[<>:"/\\|?*]/g, '')
                        .replace(/\s+/g, '_');

                    // Salva o PDF da sua empresa
                    const blobPrincipal = pdfSuaEmpresa.output('blob');
                    await window.salvarPDFEmPasta(
                        pastas.orcamento,
                        `Orcamento_${empresaNome}.pdf`,
                        blobPrincipal
                    );

                    // Salva os PDFs dos concorrentes (nome alinhado ao usado na regeneração / substituição)
                    if (isEspecial) {
                        if (pdfConcorrenteMega) {
                            const blobMega = pdfConcorrenteMega.output('blob');
                            const nomeMega = nomePdfConcorrenteOrcamentoPasta(concorrenteMega.nome);
                            if (typeof window.salvarPDFEmPastaSubstituir === 'function') {
                                await window.salvarPDFEmPastaSubstituir(pastas.orcamento, nomeMega, blobMega);
                            } else {
                                await window.salvarPDFEmPasta(pastas.orcamento, nomeMega, blobMega);
                            }
                        }
                        if (pdfConcorrenteTella) {
                            const blobTella = pdfConcorrenteTella.output('blob');
                            const nomeTella = nomePdfConcorrenteOrcamentoPasta(concorrenteTella.nome);
                            if (typeof window.salvarPDFEmPastaSubstituir === 'function') {
                                await window.salvarPDFEmPastaSubstituir(pastas.orcamento, nomeTella, blobTella);
                            } else {
                                await window.salvarPDFEmPasta(pastas.orcamento, nomeTella, blobTella);
                            }
                        }
                    } else if (pdfConcorrente) {
                        const empresaConcNome = concorrenteAleatorio.nome
                            .replace(/[<>:"/\\|?*]/g, '')
                            .replace(/\s+/g, '_');
                        const blobConc = pdfConcorrente.output('blob');
                        const nomeConc = `Orcamento_${empresaConcNome}.pdf`;
                        if (typeof window.salvarPDFEmPastaSubstituir === 'function') {
                            await window.salvarPDFEmPastaSubstituir(pastas.orcamento, nomeConc, blobConc);
                        } else {
                            await window.salvarPDFEmPasta(pastas.orcamento, nomeConc, blobConc);
                        }
                    }

                    console.log(`✅ PDFs salvos automaticamente para: ${nomeIgreja}`);
                }
            } catch (error) {
                console.warn('⚠️ Não foi possível salvar automaticamente:', error);
            }
        }

        return pdfsGerados;
    } catch (error) {
        console.error("Erro durante a geração dos PDFs:", error);
        throw new Error(`Falha ao gerar PDFs para ${dadosOrcamento.igreja ? dadosOrcamento.igreja.nome : 'igreja desconhecida'}: ${error.message}`);
    }
}

// Função auxiliar para texto seguro
function textoSeguro(texto) {
    if (texto === undefined || texto === null) return "";
    return texto.toString();
}

// Função auxiliar para garantir número seguro para coordenadas
function coordenadaSegura(valor) {
    if (isNaN(valor) || valor === undefined || valor === null) return 0;
    return Number(valor);
}

// Função para formatar valor em moeda (caso não esteja disponível na janela global)
function formatarMoeda(valor) {
    // Implementação direta para evitar chamada circular
    return "R$ " + valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Função para converter valor para extenso (caso não esteja disponível na janela global)
function valorPorExtenso(valor) {
    // Implementação simplificada direta para evitar chamada circular
    return valor.toFixed(2).replace('.', ',') + " reais";
}

// Função para gerar PDF da sua empresa
async function gerarPDFSuaEmpresa(dadosOrcamento) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margemEsquerda = 20;
    let posicaoY = 30;

    try {
        // Garantir que dadosOrcamento e suas propriedades existam
        if (!dadosOrcamento) {
            throw new Error("Dados do orçamento indefinidos");
        }

        if (!dadosOrcamento.suaEmpresa) {
            dadosOrcamento.suaEmpresa = { nome: "Empresa", itens: [], total: 0, totalFormatado: "R$ 0,00", totalPorExtenso: "zero reais" };
        }

        if (!dadosOrcamento.igreja) {
            dadosOrcamento.igreja = { nome: "Igreja", codigo: "N/A" };
        }

        const empresa = textoSeguro(dadosOrcamento.suaEmpresa.nome);

        // Recupera as logos salvas (global ou através da função window.obterLogos se disponível)
        let logos = typeof window.obterLogos === 'function' ? window.obterLogos() : window.logosBase64 || {};

        // Verifica se há itens no orçamento
        if (!dadosOrcamento.suaEmpresa.itens || dadosOrcamento.suaEmpresa.itens.length === 0) {
            console.error("Erro: Orçamento sem itens", dadosOrcamento);
            // Em caso de erro, vamos gerar pelo menos um item fictício
            dadosOrcamento.suaEmpresa.itens = [{
                servico: "Serviço de manutenção geral",
                preco: 3500,
                precoFormatado: "R$ 3.500,00",
                precoPorExtenso: "três mil e quinhentos reais"
            }];
            dadosOrcamento.suaEmpresa.total = 3500;
            dadosOrcamento.suaEmpresa.totalFormatado = "R$ 3.500,00";
            dadosOrcamento.suaEmpresa.totalPorExtenso = "três mil e quinhentos reais";
        }

        // Log para debug
        console.log("Gerando PDF para:", textoSeguro(dadosOrcamento.igreja.nome));
        console.log("Total:", textoSeguro(dadosOrcamento.suaEmpresa.totalFormatado));
        console.log("Número de itens:", dadosOrcamento.suaEmpresa.itens.length);

        // Adiciona o logo e cabeçalho conforme a empresa
        if (empresa.includes("Impacto")) {
            // ------ PDF IMPACTO SOLUÇÕES (REDESENHADO) ------

            // Adiciona logo da Impacto Soluções (largura total da página)
            if (logos && logos.impactoSolucoes) {
                try {
                    const fmtLogo = (typeof logos.impactoSolucoes === 'string' && logos.impactoSolucoes.includes('jpeg')) ? 'JPEG' : 'PNG';
                    pdf.addImage(logos.impactoSolucoes, fmtLogo, 15, 5, 180, 22);
                    posicaoY = 32;
                    console.log("Logo Impacto Soluções adicionada ao PDF com sucesso!");
                } catch (e) {
                    console.error("Erro ao adicionar logo Impacto:", e);
                    // Fallback para texto em caso de erro
                    useFallbackHeaderImpacto();
                }
            } else {
                useFallbackHeaderImpacto();
                posicaoY = 40;
            }

            function useFallbackHeaderImpacto() {
                // Linha vermelha no topo (mais grossa e mais vermelha)
                pdf.setDrawColor(220, 0, 0); // Vermelho mais vivo
                pdf.setLineWidth(1);
                pdf.line(15, 15, 195, 15);

                // Nome da empresa com cor azul - centralizado
                pdf.setTextColor(30, 50, 120); // Azul mais forte
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(24);
                pdf.text("Impacto Soluções", coordenadaSegura(105), coordenadaSegura(25), { align: "center" });

                // Slogan em itálico - centralizado
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(12);
                pdf.text("Eventos e Estruturas", coordenadaSegura(105), coordenadaSegura(32), { align: "center" });

                // Linha fina abaixo do cabeçalho
                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.3);
                pdf.line(50, 35, 160, 35);
            }

            // Cabeçalho do orçamento - formatação melhorada
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);

            // Dados da igreja lado esquerdo
            pdf.text(`À Igreja: Igreja Cristã Maranata`, coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));

            // Dados de data do lado direito, alinhados
            const dataOrcamento = textoSeguro((typeof window.formatarData === 'function') ? window.formatarData(dadosOrcamento.dataOrcamento || "") : (dadosOrcamento.dataOrcamento || "N/A"));
            pdf.text(`Data: ${dataOrcamento}`, coordenadaSegura(155), coordenadaSegura(posicaoY));
            posicaoY += 10;

            // Certificar que o código da igreja não é muito longo para evitar corte
            const codigoIgreja = textoSeguro(dadosOrcamento.igreja.codigo || "");
            const nomeIgreja = textoSeguro(dadosOrcamento.igreja.nome || "");

            pdf.text(`Código: ${codigoIgreja} - ${nomeIgreja}`, coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));

            const prazoExecucao = textoSeguro(dadosOrcamento.prazoExecucao || "30");
            pdf.text(`Pedido: ${prazoExecucao} Dias`, coordenadaSegura(155), coordenadaSegura(posicaoY));
            posicaoY += 10;

            // Texto explicativo com formatação clara
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            const usandoPersonalizadoImpacto = !!(dadosOrcamento && dadosOrcamento.textoPersonalizadoSuaEmpresa && dadosOrcamento.textoPersonalizadoSuaEmpresa.trim());
            const deveOmitirPadrao = !!dadosOrcamento.especialSemPadrao;
            const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
            const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

            if (usandoTextoEspecial) {
                // Textos especiais (Forro ou Tenda) - substitui todo o conteúdo padrão
                const valorTotal = dadosOrcamento.suaEmpresa.valorTotal || '';
                const valorFormatado = typeof valorTotal === 'number'
                    ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : valorTotal;
                const textoEspecial = obterTextoOrcamento(tipoTexto, dadosOrcamento.igreja.nome, valorFormatado);
                const linhasTexto = textoEspecial.split('\n');

                for (const linha of linhasTexto) {
                    // Verifica se precisa de nova página
                    if (posicaoY > 270) {
                        pdf.addPage();
                        posicaoY = 25;
                    }

                    if (linha.trim() === '') {
                        posicaoY += 3; // Espaço menor para linhas vazias
                    } else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        // Títulos em negrito
                        pdf.setFont("helvetica", "bold");
                        const linhasQuebradas = pdf.splitTextToSize(linha, 175);
                        for (const lq of linhasQuebradas) {
                            pdf.text(textoSeguro(lq), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                            posicaoY += 6;
                        }
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        // Itens com bullet
                        const linhasQuebradas = pdf.splitTextToSize(linha, 170);
                        for (const lq of linhasQuebradas) {
                            pdf.text(textoSeguro(lq), coordenadaSegura(margemEsquerda + 5), coordenadaSegura(posicaoY));
                            posicaoY += 6;
                        }
                    } else if (linha.startsWith('---')) {
                        // Linha separadora
                        pdf.setDrawColor(150, 150, 150);
                        pdf.setLineWidth(0.3);
                        pdf.line(margemEsquerda, posicaoY, 190, posicaoY);
                        posicaoY += 5;
                    } else {
                        const linhasQuebradas = pdf.splitTextToSize(linha, 175);
                        for (const lq of linhasQuebradas) {
                            pdf.text(textoSeguro(lq), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                            posicaoY += 6;
                        }
                    }
                }
                posicaoY += 5;
            } else if (usandoPersonalizadoImpacto) {
                const explicativoLinhas = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoSuaEmpresa.trim(), 175);
                for (let i = 0; i < explicativoLinhas.length; i++) {
                    if (posicaoY > 260) { pdf.addPage(); posicaoY = 25; }
                    pdf.text(textoSeguro(explicativoLinhas[i]), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                    posicaoY += 6;
                }
                posicaoY += 5;
            } else if (!deveOmitirPadrao) {
                const explicativoTextoPadrao = "Para atender as especificações técnicas apresentadas, a relação da prestação de serviço visa sua execução considerando todos os itens descritos pelo seu valor no quadro abaixo.";
                const explicativoLinhas = pdf.splitTextToSize(explicativoTextoPadrao, 175);
                for (let i = 0; i < explicativoLinhas.length; i++) {
                    pdf.text(textoSeguro(explicativoLinhas[i]), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                    posicaoY += 6;
                }
                posicaoY += 5;
            }

            // Linha acima da tabela (apenas quando houver tabela)
            if (!usandoPersonalizadoImpacto && !usandoTextoEspecial) {
                pdf.setDrawColor(220, 0, 0); // Vermelho mais vivo
                pdf.setLineWidth(0.5);
                pdf.line(margemEsquerda, posicaoY, 190, posicaoY);
                posicaoY += 5;
            }

            if (!usandoPersonalizadoImpacto && !usandoTextoEspecial) {
                // Tabela de itens - cabeçalho compacto
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margemEsquerda, posicaoY - 4, 170, 10, 'F');

                // Centralizando a tabela melhor no documento - ajustada mais para a esquerda
                const larguraTabela = 170;
                // Ajustando o centro da tabela para a esquerda
                const centroTabela = 95; // Valor original: 105, agora mais para a esquerda
                const inicioTabela = centroTabela - (larguraTabela / 2);

                // Larguras fixas para as colunas - APENAS ITEM E DESCRIÇÃO AGORA
                const colunas = [
                    { titulo: "Item", x: inicioTabela + 5, largura: 10, align: "center" },
                    { titulo: "Descrição", x: inicioTabela + 20, largura: 150, align: "left" }
                ];

                // Títulos das colunas
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);

                for (const coluna of colunas) {
                    if (coluna.align === "right") {
                        pdf.text(textoSeguro(coluna.titulo), coordenadaSegura(coluna.x + coluna.largura), coordenadaSegura(posicaoY), { align: "right" });
                    } else if (coluna.align === "center") {
                        pdf.text(textoSeguro(coluna.titulo), coordenadaSegura(coluna.x + (coluna.largura / 2)), coordenadaSegura(posicaoY), { align: "center" });
                    } else {
                        pdf.text(textoSeguro(coluna.titulo), coordenadaSegura(coluna.x), coordenadaSegura(posicaoY));
                    }
                }

                posicaoY += 8;

                // Linha abaixo do cabeçalho da tabela
                pdf.setDrawColor(100, 100, 100);
                pdf.setLineWidth(0.3);
                pdf.line(inicioTabela, posicaoY - 2, inicioTabela + larguraTabela, posicaoY - 2);

                // Itens - com linhas alternadas para melhor legibilidade
                pdf.setFont("helvetica", "normal");
                let contador = 1;

                for (const item of dadosOrcamento.suaEmpresa.itens) {
                    const servico = textoSeguro(item && item.servico ? item.servico : "Serviço não especificado");
                    const descricaoLinhas = pdf.splitTextToSize(servico, colunas[1].largura);
                    const linhasAdicionais = descricaoLinhas.length - 1;
                    const altLinha = 8 + (linhasAdicionais * 4);

                    // Fundo alternado para linhas (compacto)
                    if (contador % 2 === 0) {
                        pdf.setFillColor(248, 248, 248);
                        pdf.rect(inicioTabela, posicaoY - 2, larguraTabela, altLinha, 'F');
                    }

                    // Verifica se precisa de nova página
                    if (posicaoY > 250) {
                        pdf.addPage();
                        posicaoY = 25;

                        // Repete o cabeçalho da tabela na nova página
                        pdf.setFillColor(240, 240, 240);
                        pdf.rect(inicioTabela, posicaoY - 5, larguraTabela, 12, 'F');

                        pdf.setFont("helvetica", "bold");
                        for (const coluna of colunas) {
                            if (coluna.align === "right") {
                                pdf.text(textoSeguro(coluna.titulo), coordenadaSegura(coluna.x + coluna.largura), coordenadaSegura(posicaoY), { align: "right" });
                            } else if (coluna.align === "center") {
                                pdf.text(textoSeguro(coluna.titulo), coordenadaSegura(coluna.x + (coluna.largura / 2)), coordenadaSegura(posicaoY), { align: "center" });
                            } else {
                                pdf.text(textoSeguro(coluna.titulo), coordenadaSegura(coluna.x), coordenadaSegura(posicaoY));
                            }
                        }

                        pdf.setDrawColor(100, 100, 100);
                        pdf.setLineWidth(0.3);
                        pdf.line(inicioTabela, posicaoY + 7, inicioTabela + larguraTabela, posicaoY + 7);

                        posicaoY += 15;
                        pdf.setFont("helvetica", "normal");
                    }

                    // Número do item (centralizado)
                    pdf.text(textoSeguro(`${contador}`), coordenadaSegura(colunas[0].x + (colunas[0].largura / 2)), coordenadaSegura(posicaoY), { align: "center" });

                    // Descrição do serviço
                    pdf.text(descricaoLinhas, coordenadaSegura(colunas[1].x), coordenadaSegura(posicaoY));

                    posicaoY += altLinha;
                    contador++;
                }

                // Linha acima do total
                pdf.setDrawColor(100, 100, 100);
                pdf.setLineWidth(0.5);
                pdf.line(inicioTabela, posicaoY, inicioTabela + larguraTabela, posicaoY);
                posicaoY += 10;

                // Total com destaque
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(11);
                pdf.text("TOTAL:", coordenadaSegura(inicioTabela + 125), coordenadaSegura(posicaoY));

                // Caixa para o valor total
                pdf.setDrawColor(0, 0, 0);
                pdf.setFillColor(240, 240, 240);
                pdf.rect(inicioTabela + 140, posicaoY - 10, 30, 12, 'F');
                pdf.rect(inicioTabela + 140, posicaoY - 10, 30, 12);

                // Valor total dentro da caixa, alinhado à direita
                const totalFormatado = textoSeguro(dadosOrcamento.suaEmpresa.totalFormatado || "R$ 0,00");
                const totalFormatadoSemR$ = totalFormatado.replace('R$', '').trim();
                pdf.text(totalFormatadoSemR$, coordenadaSegura(inicioTabela + 165), coordenadaSegura(posicaoY), { align: "right" });
            } else if (usandoTextoEspecial) {
                // Para textos especiais (forro/tenda): valor total em destaque após o texto
                posicaoY += 15;
                if (posicaoY > 250) { pdf.addPage(); posicaoY = 25; }
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(11);
                pdf.text("VALOR TOTAL:", coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                pdf.setDrawColor(0, 0, 0);
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margemEsquerda + 35, posicaoY - 7, 50, 12, 'F');
                pdf.rect(margemEsquerda + 35, posicaoY - 7, 50, 12);
                const totalFormatado = textoSeguro(dadosOrcamento.suaEmpresa.totalFormatado || "R$ 0,00");
                pdf.text(totalFormatado, coordenadaSegura(margemEsquerda + 60), coordenadaSegura(posicaoY), { align: "center" });
            } else {
                // Sem tabela quando houver texto personalizado: mostra apenas o total em destaque
                posicaoY += 15;
                if (posicaoY > 250) { pdf.addPage(); posicaoY = 25; }
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(11);
                // Reposiciona um pouco mais à esquerda para evitar sobreposição visual
                pdf.text("TOTAL:", coordenadaSegura(145), coordenadaSegura(posicaoY));
                pdf.setDrawColor(0, 0, 0);
                pdf.setFillColor(240, 240, 240);
                pdf.rect(165, posicaoY - 10, 32, 12, 'F');
                pdf.rect(165, posicaoY - 10, 32, 12);
                const totalFormatado = textoSeguro(dadosOrcamento.suaEmpresa.totalFormatado || "R$ 0,00");
                const totalFormatadoSemR$ = totalFormatado.replace('R$', '').trim();
                pdf.text(totalFormatadoSemR$, coordenadaSegura(195), coordenadaSegura(posicaoY), { align: "right" });
            }

            // Observações (compacto para caber em 1 folha)
            posicaoY += 12;
            if (posicaoY > 245) { pdf.addPage(); posicaoY = 25; }
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.text("Observações:", coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
            posicaoY += 4;

            const obsTexto = "Todos os impostos inclusos, além de despesas com: mão de obra, ferramentas, locação de escadas, andaimes, traslado, alimentação e hospedagem.";
            const obsLinhas = pdf.splitTextToSize(obsTexto, 165);
            const obsAltura = 5 + obsLinhas.length * 5;
            pdf.setFillColor(248, 248, 248);
            pdf.rect(margemEsquerda, posicaoY, 170, Math.min(obsAltura, 25), 'F');
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            posicaoY += 5;
            for (let i = 0; i < obsLinhas.length; i++) {
                pdf.text(textoSeguro(obsLinhas[i]), coordenadaSegura(margemEsquerda + 3), coordenadaSegura(posicaoY));
                posicaoY += 5;
            }

            // Validade (centralizada, estilo imagem 4)
            posicaoY += 4;
            pdf.setTextColor(100, 100, 100);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.text(`Validade da Proposta: ${prazoExecucao} dias.`, 105, posicaoY, { align: "center" });
            pdf.setTextColor(0, 0, 0);

            // Carimbo Impacto (na mesma página quando possível)
            posicaoY += 8;
            if (posicaoY > 230) {
                pdf.addPage();
                posicaoY = 20;
            }
            try {
                if (logos && logos.impactoSolucoesCarimbo) {
                    const fmt = (typeof logos.impactoSolucoesCarimbo === 'string' && logos.impactoSolucoesCarimbo.includes('jpeg')) ? 'JPEG' : 'PNG';
                    pdf.addImage(logos.impactoSolucoesCarimbo, fmt, 65, posicaoY, 80, 40);
                }
            } catch (_) {}
            posicaoY += 42;

            // Rodapé centralizado (formato imagem 4)
            if (posicaoY > 250) { pdf.addPage(); posicaoY = 20; }
            pdf.setDrawColor(220, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(15, posicaoY - 3, 195, posicaoY - 3);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.text("IMPACTO SOLUÇÕES", 105, posicaoY + 5, { align: "center" });

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.text("Rua Maria Dalla Brotto, nº 211 – Mata da Praia, Vitória/ES.", 105, posicaoY + 11, { align: "center" });
            pdf.text("CNPJ 23.480.575/0001-54 • Fone: 9.9868-3468 • s.impactosolucoes@gmail.com", 105, posicaoY + 17, { align: "center" });
        } else {
            // ------ PDF SPG DA SILVA ------

            // Adiciona logo SPG da Silva
            if (logos && logos.spgDaSilva) {
                try {
                    pdf.addImage(logos.spgDaSilva, 'PNG', 120, 15, 70, 30);
                } catch (e) {
                    console.error("Erro ao adicionar logo SPG da Silva:", e);
                    // Fallback para texto em caso de erro
                    useFallbackHeaderSPG();
                }
            } else {
                // Se não conseguir carregar a logo, usa o texto como fallback
                useFallbackHeaderSPG();
            }

            function useFallbackHeaderSPG() {
                pdf.setTextColor(80, 80, 80); // Cinza
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(16);
                pdf.text("SPG da Silva", coordenadaSegura(160), coordenadaSegura(30));
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(12);
                pdf.text("Sonorização e Iluminação", coordenadaSegura(160), coordenadaSegura(38));
            }

            // Linha divisória
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(20, 50, 190, 50);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.text("ORÇAMENTO", coordenadaSegura(100), coordenadaSegura(60));

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);

            // Bloco introdutório: usa texto personalizado se fornecido; caso contrário, usa referência padrão
            const usandoPersonalizadoSPG = !!(dadosOrcamento && dadosOrcamento.textoPersonalizadoSuaEmpresa && dadosOrcamento.textoPersonalizadoSuaEmpresa.trim());
            const tipoTextoSPG = dadosOrcamento.tipoTexto || 'padrao';
            const usandoTextoEspecialSPG = (tipoTextoSPG === 'forro' || tipoTextoSPG === 'tenda' || tipoTextoSPG === 'vidro');

            let alturaReferencia = 70;
            if (usandoTextoEspecialSPG) {
                // Textos especiais (Forro ou Tenda) para SPG
                const valorTotal = dadosOrcamento.suaEmpresa.valorTotal || '';
                const valorFormatado = typeof valorTotal === 'number'
                    ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : valorTotal;
                const textoEspecial = obterTextoOrcamento(tipoTextoSPG, dadosOrcamento.igreja.nome, valorFormatado);
                const linhasTexto = textoEspecial.split('\n');

                for (const linha of linhasTexto) {
                    // Verifica se precisa de nova página
                    if (alturaReferencia > 270) {
                        pdf.addPage();
                        alturaReferencia = 25;
                    }

                    if (linha.trim() === '') {
                        alturaReferencia += 3;
                    } else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        pdf.setFont("helvetica", "bold");
                        const linhasQuebradas = pdf.splitTextToSize(linha, 170);
                        for (const lq of linhasQuebradas) {
                            pdf.text(textoSeguro(lq), coordenadaSegura(20), coordenadaSegura(alturaReferencia));
                            alturaReferencia += 5;
                        }
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const linhasQuebradas = pdf.splitTextToSize(linha, 165);
                        for (const lq of linhasQuebradas) {
                            pdf.text(textoSeguro(lq), coordenadaSegura(25), coordenadaSegura(alturaReferencia));
                            alturaReferencia += 5;
                        }
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150);
                        pdf.setLineWidth(0.3);
                        pdf.line(20, alturaReferencia, 190, alturaReferencia);
                        alturaReferencia += 5;
                    } else {
                        const linhasQuebradas = pdf.splitTextToSize(linha, 170);
                        for (const lq of linhasQuebradas) {
                            pdf.text(textoSeguro(lq), coordenadaSegura(20), coordenadaSegura(alturaReferencia));
                            alturaReferencia += 5;
                        }
                    }
                }
                alturaReferencia += 8;
            } else if (usandoPersonalizadoSPG) {
                const linhasPers = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoSuaEmpresa.trim(), 170);
                for (let i = 0; i < linhasPers.length; i++) {
                    if (alturaReferencia > 260) { pdf.addPage(); alturaReferencia = 25; }
                    pdf.text(textoSeguro(linhasPers[i]), coordenadaSegura(20), coordenadaSegura(alturaReferencia));
                    alturaReferencia += 5;
                }
                // Adiciona espaçamento após o texto personalizado antes do "Pedido nº"
                alturaReferencia += 8;
            } else if (!dadosOrcamento.especialSemPadrao) {
                // Texto padrão
                const nomeIgreja = textoSeguro(dadosOrcamento.igreja.nome || "");
                const codigoIgreja = textoSeguro(dadosOrcamento.igreja.codigo || "");
                const referenciaTexto = `SEGUE ABAIXO O ORÇAMENTO REFERENTE À IGREJA ${codigoIgreja} - ${nomeIgreja}: CONFORME SOLICITADO`;
                const referenciaLinhas = pdf.splitTextToSize(referenciaTexto, 170);
                for (let i = 0; i < referenciaLinhas.length; i++) {
                    pdf.text(textoSeguro(referenciaLinhas[i]), coordenadaSegura(20), coordenadaSegura(alturaReferencia));
                    alturaReferencia += 5;
                }
                alturaReferencia += 8;
            }

            // Usa a alturaReferencia calculada dinamicamente em vez de posição fixa
            pdf.text(`Pedido nº`, coordenadaSegura(32), coordenadaSegura(alturaReferencia));
            const prazoExecucao = textoSeguro(dadosOrcamento.prazoExecucao || "30");
            pdf.text(`${prazoExecucao} Dias`, coordenadaSegura(65), coordenadaSegura(alturaReferencia));

            // Ajusta posicaoY baseado na altura do conteúdo anterior
            posicaoY = alturaReferencia + 8;

            // Configurações comuns
            pdf.setTextColor(0, 0, 0); // Volta para cor preta
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);

            // SPG da Silva - lista de itens sem tabela (somente quando NÃO estiver usando texto personalizado ou especial)
            if (!usandoPersonalizadoSPG && !usandoTextoEspecialSPG) {
                let contador = 1;
                for (const item of dadosOrcamento.suaEmpresa.itens) {
                    // Quebra textos longos em múltiplas linhas para evitar cortes
                    const servico = textoSeguro(item && item.servico ? item.servico : "Serviço não especificado");
                    const itemTexto = `${contador} - ${servico}`;
                    const itemLinhas = pdf.splitTextToSize(itemTexto, 170);  // Aumentando a largura para ocupar o espaço do valor

                    pdf.text(itemLinhas, coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));

                    // Ajusta a posição Y baseado no número de linhas
                    const linhasAdicionais = itemLinhas.length - 1;
                    posicaoY += 8 + (linhasAdicionais * 4);
                    contador++;

                    // Verifica se precisa de nova página
                    if (posicaoY > 230) {
                        pdf.addPage();
                        posicaoY = 20;
                    }
                }
            }

            // ORDEM: Texto (já renderizado - itens) -> Observações -> Total -> Texto Final

            // Adiciona espaçamento após os itens
            posicaoY += 15;

            // Verifica se há espaço suficiente para o restante (~90mm), senão adiciona nova página
            if (posicaoY > 180) {
                pdf.addPage();
                posicaoY = 30;
            }

            // 1. OBSERVAÇÕES
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.text("Observações:", coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
            posicaoY += 7;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            const obs1 = pdf.splitTextToSize("O prazo mínimo recomendado para reserva é de 48 horas de antecedência;", 170);
            obs1.forEach(linha => {
                pdf.text(textoSeguro(linha), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                posicaoY += 5;
            });
            posicaoY += 4;

            // 2. VALOR TOTAL
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.text(`Valor Total:`, coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));

            const totalFormatado = textoSeguro(dadosOrcamento.suaEmpresa.totalFormatado || "R$ 0,00");
            pdf.text(`${totalFormatado}`, coordenadaSegura(60), coordenadaSegura(posicaoY));
            posicaoY += 7;

            // Observação sobre o local
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            const localLinhas = pdf.splitTextToSize("O local deve estar desobstruído no momento da montagem;", 170);
            localLinhas.forEach(linha => {
                pdf.text(textoSeguro(linha), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                posicaoY += 5;
            });
            posicaoY += 8;

            const dataOrcamento = textoSeguro((typeof window.formatarData === 'function') ? window.formatarData(dadosOrcamento.dataOrcamento || "") : (dadosOrcamento.dataOrcamento || "N/A"));
            pdf.text(`Vitória, segunda-feira, ${dataOrcamento}`, coordenadaSegura(130), coordenadaSegura(posicaoY));
            posicaoY += 5;

            const revisoesLinhas = pdf.splitTextToSize("Em caso de necessidade de adequações adicionais, o orçamento poderá ser revisado.", 170);
            revisoesLinhas.forEach(linha => {
                pdf.text(textoSeguro(linha), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                posicaoY += 5;
            });
            posicaoY += 8;

            // 3. TEXTO FINAL (Rodapé com dados da empresa)
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text("SPG DA SILVA SONORIZAÇÃO E ILUMINAÇÃO", coordenadaSegura(105), coordenadaSegura(posicaoY), { align: 'center' });
            posicaoY += 5;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            const permanecemosLinhas = pdf.splitTextToSize("Permanecemos à disposição para qualquer ajuste ou esclarecimento.", 170);
            permanecemosLinhas.forEach(linha => {
                pdf.text(textoSeguro(linha), coordenadaSegura(margemEsquerda), coordenadaSegura(posicaoY));
                posicaoY += 4;
            });
            posicaoY += 5;

            pdf.text("CNPJ: 36.306.787/0001-61", coordenadaSegura(105), coordenadaSegura(posicaoY), { align: 'center' });
            posicaoY += 4;
            pdf.text("Rua: Furtado Abreu Gagno, 300 – Jardim Camburi - Vitória/ES", coordenadaSegura(105), coordenadaSegura(posicaoY), { align: 'center' });
            posicaoY += 4;
            pdf.text("CEP 29.090-290", coordenadaSegura(105), coordenadaSegura(posicaoY), { align: 'center' });
            posicaoY += 4;
            pdf.text("E-mail: spgsilva01@gmail.com", coordenadaSegura(105), coordenadaSegura(posicaoY), { align: 'center' });
        }

        return pdf;
    } catch (error) {
        console.error("Erro ao gerar PDF principal:", error);
        // Gerar um PDF de emergência simples
        const pdf = new jsPDF();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("Orçamento de Emergência", 105, 20, { align: 'center' });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text("Não foi possível gerar o orçamento completo.", 105, 40, { align: 'center' });
        pdf.text("Por favor, tente novamente.", 105, 50, { align: 'center' });
        pdf.text("Erro: " + error.message, 105, 70, { align: 'center' });
        return pdf;
    }
}

// Função para baixar um PDF específico
function baixarPDF(index, tipo, pdfsGerados) {
    const dadosIgreja = pdfsGerados[`igreja_${index}`];
    if (!dadosIgreja) {
        console.error(`Dados não encontrados para igreja_${index}`);
        return;
    }

    let nomeArquivo;
    if (tipo === 'principal' || tipo === 'suaEmpresa') {
        // Para orçamento da sua empresa
        nomeArquivo = `Orçamento - ${dadosIgreja.igreja.nome} - ${dadosIgreja.orcamento.suaEmpresa.nome}`;
        dadosIgreja.pdfSuaEmpresa.save(nomeArquivo + '.pdf');
    } else if (tipo === 'concorrente') {
        // Para orçamento do concorrente
        nomeArquivo = `Orçamento - ${dadosIgreja.igreja.nome} - ${dadosIgreja.empresaConcorrente}`;
        dadosIgreja.pdfConcorrente.save(nomeArquivo + '.pdf');
    } else if (tipo === 'concorrenteMega') {
        nomeArquivo = `Orçamento - ${dadosIgreja.igreja.nome} - ${dadosIgreja.empresaConcorrenteMega || 'MEGA EVENTOS'}`;
        dadosIgreja.pdfConcorrenteMega && dadosIgreja.pdfConcorrenteMega.save(nomeArquivo + '.pdf');
    } else if (tipo === 'concorrenteTella') {
        nomeArquivo = `Orçamento - ${dadosIgreja.igreja.nome} - ${dadosIgreja.empresaConcorrenteTella || 'TELLA VIDEO'}`;
        dadosIgreja.pdfConcorrenteTella && dadosIgreja.pdfConcorrenteTella.save(nomeArquivo + '.pdf');
    } else if (tipo === 'relatorio') {
        // Para relatório
        nomeArquivo = `Relatório - ${dadosIgreja.igreja.nome}`;
        dadosIgreja.pdfRelatorio.save(nomeArquivo + '.pdf');
    }
}

// Função para baixar todos os PDFs com a nova implementação otimizada
function baixarTodosPDFs(pdfsGerados) {
    // Utiliza a função otimizada que foi implementada em orcamentos.js
    if (typeof window.baixarTodosPDFs === 'function') {
        // Chama a função otimizada com feedback visual e delays
        window.baixarTodosPDFs(pdfsGerados);
    } else {
        // Fallback para o método antigo (menos eficiente) caso a função otimizada não esteja disponível
        console.warn("Função otimizada de download não encontrada, usando método padrão");

        // Mostra alerta para o usuário
        alert("Baixando todos os PDFs. Por favor, aguarde até que todos os downloads sejam concluídos.");

        for (const key in pdfsGerados) {
            const igreja = pdfsGerados[key].igreja;
            const orcamento = pdfsGerados[key].orcamento;

            // Baixa o PDF da sua empresa
            const pdfSuaEmpresa = pdfsGerados[key].pdfSuaEmpresa;
            const nomeSuaEmpresa = `Orçamento ${igreja.nome} - ${orcamento.suaEmpresa.nome}.pdf`;
            pdfSuaEmpresa.save(nomeSuaEmpresa);

            // Baixa o(s) PDF(s) do(s) concorrente(s)
            if (pdfsGerados[key].pdfConcorrente) {
                const pdfConcorrente = pdfsGerados[key].pdfConcorrente;
                const nomeConcorrente = `Orçamento ${igreja.nome} - ${pdfsGerados[key].empresaConcorrente}.pdf`;
                pdfConcorrente.save(nomeConcorrente);
            }
            if (pdfsGerados[key].pdfConcorrenteMega) {
                const pdfMega = pdfsGerados[key].pdfConcorrenteMega;
                const nomeMega = `Orçamento ${igreja.nome} - ${pdfsGerados[key].empresaConcorrenteMega}.pdf`;
                pdfMega.save(nomeMega);
            }
            if (pdfsGerados[key].pdfConcorrenteTella) {
                const pdfTella = pdfsGerados[key].pdfConcorrenteTella;
                const nomeTella = `Orçamento ${igreja.nome} - ${pdfsGerados[key].empresaConcorrenteTella}.pdf`;
                pdfTella.save(nomeTella);
            }
        }
    }
}

// Função para atualizar a interface com os resultados
function atualizarInterfaceResultados(dadosOrcamento, index, pdfsGerados) {
    const pdfsDisplay = document.getElementById('pdfsDisplay');

    // Formatação para exibir total e número de itens
    const qtdItens = dadosOrcamento.suaEmpresa.itens.length;
    const total = dadosOrcamento.suaEmpresa.totalFormatado;

    // Nome da empresa concorrente selecionada para esta igreja
    // Verificação direta sem usar window.pdfsGerados para evitar referências circulares
    let empresaConcorrente = "Empresa Concorrente";
    let temMega = false;
    let temTella = false;
    let empresaMegaNome = "MEGA EVENTOS";
    let empresaTellaNome = "TELLA VIDEO";

    // Usa o pdfsGerados que é passado como parâmetro para outras funções
    try {
        const pdfsGeradosKey = `igreja_${index}`;
        if (typeof pdfsGerados !== 'undefined' &&
            pdfsGerados[pdfsGeradosKey] &&
            pdfsGerados[pdfsGeradosKey].empresaConcorrente) {
            empresaConcorrente = pdfsGerados[pdfsGeradosKey].empresaConcorrente;
        }
        temMega = !!(pdfsGerados[pdfsGeradosKey] && pdfsGerados[pdfsGeradosKey].pdfConcorrenteMega);
        temTella = !!(pdfsGerados[pdfsGeradosKey] && pdfsGerados[pdfsGeradosKey].pdfConcorrenteTella);
        if (pdfsGerados[pdfsGeradosKey] && pdfsGerados[pdfsGeradosKey].empresaConcorrenteMega) {
            empresaMegaNome = pdfsGerados[pdfsGeradosKey].empresaConcorrenteMega;
        }
        if (pdfsGerados[pdfsGeradosKey] && pdfsGerados[pdfsGeradosKey].empresaConcorrenteTella) {
            empresaTellaNome = pdfsGerados[pdfsGeradosKey].empresaConcorrenteTella;
        }
    } catch (e) {
        console.warn("Não foi possível obter nome da empresa concorrente:", e);
    }

    const listaUmConcorrente = (!temMega || !temTella) ? obterEmpresasConcorrentesParaSelectUI(dadosOrcamento) : [];
    const optsConc = listaUmConcorrente.map(e => `<option value="${e.replace(/"/g, '&quot;')}" ${e === empresaConcorrente ? 'selected' : ''}>${e}</option>`).join('');

    const listaEspecial = (temMega && temTella) ? obterEmpresasConcorrentesPedidoEspecialUI(dadosOrcamento) : [];
    const optsE1 = listaEspecial.map(e => `<option value="${e.replace(/"/g, '&quot;')}" ${e === empresaMegaNome ? 'selected' : ''}>${e}</option>`).join('');
    const optsE2 = listaEspecial.map(e => `<option value="${e.replace(/"/g, '&quot;')}" ${e === empresaTellaNome ? 'selected' : ''}>${e}</option>`).join('');

    const pdfCard = document.createElement('div');
    pdfCard.className = 'pdf-card';
    pdfCard.dataset.index = index;
    pdfCard.innerHTML = `
        <div class="igreja-info">
            <h3>${dadosOrcamento.igreja.nome}</h3>
            <p><strong>Código:</strong> ${dadosOrcamento.igreja.codigo}</p>
            <p><strong>Data:</strong> ${(typeof window.formatarData === 'function') ? window.formatarData(dadosOrcamento.dataOrcamento || '') : (dadosOrcamento.dataOrcamento || '')}</p>
            <p><strong>Empresa selecionada:</strong> ${dadosOrcamento.suaEmpresa.nome}</p>
            <p><strong>Itens incluídos:</strong> ${qtdItens} serviços</p>
            <p><strong>Total:</strong> ${total}</p>
        </div>
        <div class="download-buttons">
            <button class="btn-download" onclick="baixarPDF('${index}', 'suaEmpresa')">
                Baixar PDF ${dadosOrcamento.suaEmpresa.nome}
            </button>
            ${temMega ? `<button class="btn-download" id="btnConcMega_${index}" onclick="baixarPDF('${index}', 'concorrenteMega')">Baixar PDF ${empresaMegaNome}</button>` : ''}
            ${temTella ? `<button class="btn-download" id="btnConcTella_${index}" onclick="baixarPDF('${index}', 'concorrenteTella')">Baixar PDF ${empresaTellaNome}</button>` : ''}
            ${(temMega && temTella) ? `
                <div class="regenerar-concorrente-especial" style="margin-top:10px; display:flex; flex-direction:column; gap:8px; align-items:flex-start; max-width:100%;">
                    <span style="font-size:12px; font-weight:600; color:#555;">Trocar os dois concorrentes (pedido especial):</span>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <label style="font-size:12px;">1º PDF:</label>
                        <select id="selectConcMega_${index}" style="padding:6px 10px; font-size:13px; min-width:200px;">${optsE1}</select>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <label style="font-size:12px;">2º PDF:</label>
                        <select id="selectConcTella_${index}" style="padding:6px 10px; font-size:13px; min-width:200px;">${optsE2}</select>
                    </div>
                    <button type="button" class="btn-secondary" id="btnRegEsp_${index}" onclick="regenerarPDFsConcorrentesEspecial('${index}')" style="padding:6px 12px; font-size:12px;">
                        <i class="fas fa-sync-alt"></i> Regenerar os dois PDFs
                    </button>
                </div>
            ` : ''}
            ${(!temMega && !temTella) ? `
                <button class="btn-download" id="btnConc_${index}" onclick="baixarPDF('${index}', 'concorrente')">Baixar PDF ${empresaConcorrente}</button>
                <div class="regenerar-concorrente" style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <label style="font-size:12px;">Trocar concorrente:</label>
                    <select id="selectConc_${index}" style="padding:6px 10px; font-size:13px; min-width:180px;">
                        ${optsConc}
                    </select>
                    <button type="button" class="btn-secondary" onclick="regenerarPDFConcorrente('${index}')" style="padding:6px 12px; font-size:12px;">
                        <i class="fas fa-sync-alt"></i> Regenerar PDF
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    pdfsDisplay.appendChild(pdfCard);
}

// Regenera o PDF do concorrente com outra empresa selecionada
async function regenerarPDFConcorrente(index) {
    const pdfsGerados = window.pdfsGerados || {};
    const key = `igreja_${index}`;
    const registro = pdfsGerados[key];
    if (!registro || !registro.pdfConcorrente) {
        console.warn('Regenerar: sem PDF concorrente para este orçamento');
        return;
    }
    const selectEl = document.getElementById(`selectConc_${index}`);
    const empresaNome = selectEl ? selectEl.value : null;
    if (!empresaNome) return;

    const dadosOrcamento = registro.orcamento;
    const nomeIgreja = (dadosOrcamento.igreja && dadosOrcamento.igreja.nome) || 'IGREJA';
    const empresaAnterior = registro.empresaConcorrente;
    const valorSuaEmpresa = dadosOrcamento.suaEmpresa.total || 0;
    const markup = 1.1 + (Math.random() * 0.05);
    const valorConcorrente = valorSuaEmpresa * markup;

    const novoConcorrente = {
        nome: empresaNome,
        itens: (dadosOrcamento.suaEmpresa.itens || []).map(it => ({ servico: it.servico })),
        total: valorConcorrente,
        totalFormatado: (typeof window.formatarMoeda === 'function') ? window.formatarMoeda(valorConcorrente) : ("R$ " + valorConcorrente.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")),
        totalPorExtenso: (typeof window.valorPorExtenso === 'function') ? window.valorPorExtenso(valorConcorrente) : (valorConcorrente.toFixed(2).replace('.', ',') + " reais")
    };

    try {
        const pdfNovo = await window.gerarPDFConcorrente(dadosOrcamento, novoConcorrente, 1);
        registro.pdfConcorrente = pdfNovo;
        registro.empresaConcorrente = empresaNome;
        const btn = document.getElementById(`btnConc_${index}`);
        if (btn) btn.textContent = `Baixar PDF ${empresaNome}`;
        console.log('PDF concorrente regenerado com sucesso para:', empresaNome);

        const checkboxSalvar = document.getElementById('salvarAutomaticoPasta');
        if (checkboxSalvar && checkboxSalvar.checked && typeof window.criarPastasIgreja === 'function' && typeof window.salvarPDFEmPastaSubstituir === 'function') {
            try {
                const pastas = await window.criarPastasIgreja(nomeIgreja);
                if (pastas && pastas.orcamento) {
                    const novoNomeArq = nomePdfConcorrenteOrcamentoPasta(empresaNome);
                    const antigoNomeArq = nomePdfConcorrenteOrcamentoPasta(empresaAnterior);
                    if (antigoNomeArq !== novoNomeArq) {
                        try { await pastas.orcamento.removeEntry(antigoNomeArq); } catch (_) { /* não existia */ }
                    }
                    await window.salvarPDFEmPastaSubstituir(pastas.orcamento, novoNomeArq, pdfNovo.output('blob'));
                }
            } catch (errPasta) {
                console.warn('Não foi possível atualizar PDF na pasta:', errPasta);
            }
        }

        setTimeout(() => {
            if (typeof window.baixarPDF === 'function') window.baixarPDF(String(index), 'concorrente');
        }, 200);
    } catch (e) {
        console.error('Erro ao regenerar PDF concorrente:', e);
        if (typeof alert === 'function') alert('Erro ao regenerar PDF: ' + (e.message || 'Tente novamente'));
    }
}

// Regenera os dois PDFs de concorrentes do pedido especial (MEGA/TELLA ou quaisquer duas empresas)
async function regenerarPDFsConcorrentesEspecial(indexStr) {
    const index = parseInt(indexStr, 10);
    const pdfsGerados = window.pdfsGerados || {};
    const key = `igreja_${index}`;
    const registro = pdfsGerados[key];
    if (!registro || !registro.orcamento) {
        console.warn('Regenerar especial: registro não encontrado');
        return;
    }
    const sel1 = document.getElementById(`selectConcMega_${index}`);
    const sel2 = document.getElementById(`selectConcTella_${index}`);
    const nome1 = sel1 ? sel1.value : null;
    const nome2 = sel2 ? sel2.value : null;
    if (!nome1 || !nome2) return;
    if (nome1 === nome2) {
        if (typeof alert === 'function') alert('Escolha duas empresas diferentes para os dois PDFs.');
        return;
    }

    const dadosOrcamento = registro.orcamento;
    const valorSuaEmpresa = dadosOrcamento.suaEmpresa.total || 0;
    const itensBase = (dadosOrcamento.suaEmpresa.itens || []).map(it => ({ servico: it.servico }));
    const fmt = typeof window.formatarMoeda === 'function' ? window.formatarMoeda : (v) => 'R$ ' + Number(v).toFixed(2);
    const ext = typeof window.valorPorExtenso === 'function' ? window.valorPorExtenso : () => '';

    const mkObj = (nome, markup) => {
        const t = valorSuaEmpresa * markup;
        return {
            nome,
            itens: itensBase,
            total: t,
            totalFormatado: fmt(t),
            totalPorExtenso: ext(t)
        };
    };

    const btnReg = document.getElementById(`btnRegEsp_${index}`);
    const origHtml = btnReg ? btnReg.innerHTML : '';
    if (btnReg) {
        btnReg.disabled = true;
        btnReg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    }

    const nomeIgreja = (dadosOrcamento.igreja && dadosOrcamento.igreja.nome) || 'IGREJA';
    const antigo1 = registro.empresaConcorrenteMega;
    const antigo2 = registro.empresaConcorrenteTella;

    try {
        registro.pdfConcorrenteMega = await window.gerarPDFConcorrente(dadosOrcamento, mkObj(nome1, 1.12), 1);
        registro.pdfConcorrenteTella = await window.gerarPDFConcorrente(dadosOrcamento, mkObj(nome2, 1.15), 1);
        registro.empresaConcorrenteMega = nome1;
        registro.empresaConcorrenteTella = nome2;

        const bMega = document.getElementById(`btnConcMega_${index}`);
        const bTella = document.getElementById(`btnConcTella_${index}`);
        if (bMega) bMega.textContent = `Baixar PDF ${nome1}`;
        if (bTella) bTella.textContent = `Baixar PDF ${nome2}`;
        console.log('PDFs concorrentes (especial) regenerados:', nome1, nome2);

        const checkboxSalvar = document.getElementById('salvarAutomaticoPasta');
        if (checkboxSalvar && checkboxSalvar.checked && typeof window.criarPastasIgreja === 'function' && typeof window.salvarPDFEmPastaSubstituir === 'function') {
            try {
                const pastas = await window.criarPastasIgreja(nomeIgreja);
                if (pastas && pastas.orcamento) {
                    const novoArq1 = nomePdfConcorrenteOrcamentoPasta(nome1);
                    const novoArq2 = nomePdfConcorrenteOrcamentoPasta(nome2);
                    const manter = new Set([novoArq1, novoArq2]);
                    const candidatosRemover = [
                        nomePdfConcorrenteOrcamentoPasta(antigo1),
                        nomePdfConcorrenteOrcamentoPasta(antigo2),
                        'Orcamento_MEGA_EVENTOS.pdf',
                        'Orcamento_TELLA_VIDEO.pdf'
                    ];
                    const visto = new Set();
                    for (const nome of candidatosRemover) {
                        if (!nome || visto.has(nome)) continue;
                        visto.add(nome);
                        if (manter.has(nome)) continue;
                        try { await pastas.orcamento.removeEntry(nome); } catch (_) { /* não existia */ }
                    }
                    await window.salvarPDFEmPastaSubstituir(pastas.orcamento, novoArq1, registro.pdfConcorrenteMega.output('blob'));
                    await window.salvarPDFEmPastaSubstituir(pastas.orcamento, novoArq2, registro.pdfConcorrenteTella.output('blob'));
                }
            } catch (errPasta) {
                console.warn('Não foi possível atualizar PDFs na pasta:', errPasta);
            }
        }

        setTimeout(() => {
            if (typeof window.baixarPDF === 'function') window.baixarPDF(String(index), 'concorrenteMega');
        }, 200);
        setTimeout(() => {
            if (typeof window.baixarPDF === 'function') window.baixarPDF(String(index), 'concorrenteTella');
        }, 700);
    } catch (e) {
        console.error('Erro ao regenerar PDFs especiais:', e);
        if (typeof alert === 'function') alert('Erro ao regenerar: ' + (e.message || 'Tente novamente'));
    } finally {
        if (btnReg) {
            btnReg.disabled = false;
            btnReg.innerHTML = origHtml || '<i class="fas fa-sync-alt"></i> Regenerar os dois PDFs';
        }
    }
}

// Disponibiliza as funções globalmente
window.gerarPDFs = gerarPDFs;
window.baixarPDF = baixarPDF;
window.baixarTodosPDFs = baixarTodosPDFs;
window.atualizarInterfaceResultados = atualizarInterfaceResultados;
window.regenerarPDFConcorrente = regenerarPDFConcorrente;
window.regenerarPDFsConcorrentesEspecial = regenerarPDFsConcorrentesEspecial; 