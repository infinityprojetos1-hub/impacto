// Função para geração de PDFs para empresas concorrentes

// Função para gerar PDF dos concorrentes
async function gerarPDFConcorrente(dadosOrcamento, dadosConcorrente, tipo) {
    try {
        const { jsPDF } = window.jspdf;

        // Recupera as logos salvas (global ou através da função window.obterLogos se disponível)
        let logos = typeof window.obterLogos === 'function' ? window.obterLogos() : window.logosBase64 || {};

        // Verifica se há itens no orçamento
        if (!dadosConcorrente.itens || dadosConcorrente.itens.length === 0) {
            console.error("Erro: Orçamento concorrente sem itens", dadosConcorrente);
            // Em caso de erro, vamos gerar pelo menos um item fictício
            dadosConcorrente.itens = [{
                servico: "Serviço de manutenção geral"
            }];
            dadosConcorrente.total = 3850;
            dadosConcorrente.totalFormatado = "R$ 3.850,00";
            dadosConcorrente.totalPorExtenso = "três mil, oitocentos e cinquenta reais";
        }

        // Verificar se dadosConcorrente e dadosConcorrente.nome existem
        if (!dadosConcorrente || !dadosConcorrente.nome) {
            console.error("Erro: Dados do concorrente inválidos", dadosConcorrente);
            return gerarPDFBasico(dadosOrcamento, dadosConcorrente || { nome: "Empresa Concorrente" });
        }

        // Log para debug
        console.log(`Gerando PDF concorrente para:`, dadosOrcamento.igreja && dadosOrcamento.igreja.nome ? dadosOrcamento.igreja.nome : "Igreja desconhecida");
        console.log("Empresa:", dadosConcorrente.nome);
        console.log("Total:", dadosConcorrente.totalFormatado || "N/A");
        console.log("Número de itens:", dadosConcorrente.itens ? dadosConcorrente.itens.length : 0);

        // Prepara data do concorrente: aleatória entre 1 e 5 dias antes
        let dadosOrcamentoParaConcorrente = dadosOrcamento;
        try {
            const iso = (dadosOrcamento && dadosOrcamento.dataOrcamento) ? dadosOrcamento.dataOrcamento : null;
            if (iso) {
                const partes = iso.split('-');
                if (partes.length === 3) {
                    const ano = parseInt(partes[0]);
                    const mes = parseInt(partes[1]);
                    const dia = parseInt(partes[2]);
                    const base = new Date(Date.UTC(ano, mes - 1, dia));
                    const delta = 1 + Math.floor(Math.random() * 5);
                    base.setUTCDate(base.getUTCDate() - delta);
                    const yyyy = base.getUTCFullYear();
                    const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(base.getUTCDate()).padStart(2, '0');
                    const isoAnterior = `${yyyy}-${mm}-${dd}`;
                    const dataFormatada = (typeof window.formatarData === 'function') ? window.formatarData(isoAnterior) : isoAnterior;
                    dadosOrcamentoParaConcorrente = { ...dadosOrcamento, dataOrcamento: dataFormatada };
                }
            }
        } catch (e) {
            // Em caso de erro, mantém dados originais
        }

        // Escolhe o modelo de PDF baseado no nome da empresa
        switch (dadosConcorrente.nome) {
            case "GG PROAUTO LTDA":
                if (typeof gerarPDFGGProauto === 'function') {
                    return gerarPDFGGProauto(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "STV IMAGEM E SOM":
                if (typeof gerarPDFSTV === 'function') {
                    return gerarPDFSTV(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "UP SERVIÇOS":
                if (typeof gerarPDFUPServicos === 'function') {
                    return gerarPDFUPServicos(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "SENA AUDIOVISUAL PRODUÇÕES":
                if (typeof gerarPDFSena === 'function') {
                    return gerarPDFSena(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "INSTALASSOM":
                if (typeof gerarPDFInstalassom === 'function') {
                    return gerarPDFInstalassom(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "Virtual Guitar Shop":
                if (typeof gerarPDFVirtualGuitar === 'function') {
                    return gerarPDFVirtualGuitar(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "MEGA EVENTOS":
                if (typeof gerarPDFMegaEventos === 'function') {
                    return gerarPDFMegaEventos(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "TELLA VIDEO":
                if (typeof gerarPDFTellaVideo === 'function') {
                    return gerarPDFTellaVideo(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            case "GLAUBER SISTEMAS CONSTRUTIVOS":
                if (typeof gerarPDFGlauber === 'function') {
                    return gerarPDFGlauber(dadosOrcamentoParaConcorrente, dadosConcorrente, logos);
                }
                break;
            default:
                // Fallback: gerar um PDF básico
                console.warn("Modelo de PDF não encontrado para: " + dadosConcorrente.nome);
                return gerarPDFBasico(dadosOrcamentoParaConcorrente, dadosConcorrente);
        }

        // Fallback: gerar um PDF básico se a função específica não estiver disponível
        return gerarPDFBasico(dadosOrcamentoParaConcorrente, dadosConcorrente);
    } catch (error) {
        console.error("Erro ao gerar PDF concorrente:", error);
        // Em caso de erro, tentamos criar um PDF básico de emergência
        try {
            return gerarPDFBasico(dadosOrcamento, dadosConcorrente || { nome: "Empresa Concorrente" });
        } catch (fallbackError) {
            console.error("Erro ao gerar PDF básico fallback:", fallbackError);
            // Último recurso: retornar um PDF muito simples sem depender dos dados
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.text("Orçamento de Emergência", 105, 20, { align: 'center' });
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            pdf.text("Não foi possível gerar o orçamento completo.", 105, 40, { align: 'center' });
            pdf.text("Por favor, tente novamente.", 105, 50, { align: 'center' });
            return pdf;
        }
    }
}

// Função de fallback para gerar um PDF básico
function gerarPDFBasico(dadosOrcamento, dadosConcorrente) {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Cabeçalho simples
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        const nomeEmpresa = dadosConcorrente && dadosConcorrente.nome ? dadosConcorrente.nome : "Empresa Concorrente";
        pdf.text(nomeEmpresa, 105, 20, { align: 'center' });

        // Data e igreja
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        const dataOrcamento = dadosOrcamento && dadosOrcamento.dataOrcamento ? dadosOrcamento.dataOrcamento : "N/A";
        pdf.text(`Data: ${dataOrcamento}`, 20, 40);

        // Verificar existência de dadosOrcamento.igreja.nome e .codigo
        const nomeIgreja = dadosOrcamento && dadosOrcamento.igreja && dadosOrcamento.igreja.nome ? dadosOrcamento.igreja.nome : "N/A";
        const codigoIgreja = dadosOrcamento && dadosOrcamento.igreja && dadosOrcamento.igreja.codigo ? dadosOrcamento.igreja.codigo : "N/A";

        pdf.text(`Igreja: ${nomeIgreja}`, 20, 50);
        pdf.text(`Código: ${codigoIgreja}`, 20, 60);

        // Texto de observação/explicativo (personalizado ou padrão do concorrente)
        try {
            const txtConc = (dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim())
                ? dadosOrcamento.textoPersonalizadoConcorrente.trim()
                : "Este orçamento contempla a execução dos serviços descritos, considerando mão de obra e materiais necessários, conforme especificações fornecidas. Prazos e condições seguem a política da empresa.";
            const linhasTxt = pdf.splitTextToSize(txtConc, 175);
            let yTexto = 70;
            linhasTxt.forEach(l => { pdf.text(l, 20, yTexto); yTexto += 6; });
        } catch (_) { }

        // Serviços
        pdf.setFont("helvetica", "bold");
        pdf.text("Serviços:", 20, 90);

        let posY = 100;
        // Verificar existência de dadosConcorrente.itens
        const itens = dadosConcorrente && dadosConcorrente.itens ? dadosConcorrente.itens : [];
        itens.forEach((item, index) => {
            pdf.setFont("helvetica", "normal");
            const servico = item && item.servico ? item.servico : "Serviço não especificado";
            pdf.text(`${index + 1}. ${servico}`, 25, posY);
            posY += 10;
        });

        // Total
        pdf.setFont("helvetica", "bold");
        pdf.text("Valor Total:", 20, posY + 20);
        const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
        pdf.text(totalFormatado, 70, posY + 20);

        return pdf;
    } catch (error) {
        console.error("Erro ao gerar PDF básico:", error);
        // Último recurso: PDF ultra simples
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        pdf.setFont("helvetica", "bold");
        pdf.text("Orçamento Simplificado", 105, 20, { align: 'center' });
        return pdf;
    }
}

// Disponibiliza a função globalmente
window.gerarPDFConcorrente = gerarPDFConcorrente; 