// Função para gerar PDF da empresa STV IMAGEM E SOM
function gerarPDFSTV(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margemEsquerda = 20;
    let posicaoY = 30;

    try {
        // Adiciona logo da STV baseada na imagem original
        if (logos && logos.stv) {
            pdf.addImage(logos.stv, 'PNG', 80, 20, 50, 40);
            posicaoY = 80;
        } else {
            // Cabeçalho alternativo se não tiver logo
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(24);
            pdf.setTextColor(50, 50, 120);
            pdf.text("S T V", 105, 35, { align: "center" });

            pdf.setTextColor(180, 0, 0);
            pdf.setFontSize(16);
            pdf.text("IMAGEM E SOM", 105, 45, { align: "center" });
            posicaoY = 65;
        }

        // CNPJ
        pdf.setTextColor(0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("CNPJ: 40.897.264/0001-04", margemEsquerda, posicaoY);
        posicaoY += 15;

        // Título ORÇAMENTO
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("ORÇAMENTO", margemEsquerda, posicaoY);
        posicaoY += 15;

        // Informações do cliente
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text("CLIENTE: Igreja Cristã Maranata", margemEsquerda, posicaoY);
        posicaoY += 10;

        // Verificar se existe dadosOrcamento.dataOrcamento
        const dataOrcamento = dadosOrcamento.dataOrcamento || "N/A";
        pdf.text(`DATA: ${dataOrcamento}`, margemEsquerda, posicaoY);
        posicaoY += 10;

        // Verificar existência de dadosOrcamento.igreja.nome
        const nomeIgreja = dadosOrcamento.igreja && dadosOrcamento.igreja.nome ? dadosOrcamento.igreja.nome : "N/A";
        pdf.text(`LOCAL: ICM ${nomeIgreja}`, margemEsquerda, posicaoY);
        posicaoY += 10;

        // Verificar existência de dadosOrcamento.igreja.codigo
        let codigoIgreja = "N/A";
        if (dadosOrcamento.igreja && dadosOrcamento.igreja.codigo) {
            const codigoParts = dadosOrcamento.igreja.codigo.split(" ");
            codigoIgreja = codigoParts.length > 0 ? codigoParts[0] : "N/A";
        }
        pdf.text(`COMBENS ID ${codigoIgreja}`, margemEsquerda, posicaoY);
        posicaoY += 20;

        // Descrição do serviço
        pdf.setFont("helvetica", "bold");
        pdf.text("DESCRIMINAÇÃO DO SERVIÇO:", margemEsquerda, posicaoY);
        posicaoY += 12;

        // Texto personalizado, especial ou padrão (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        if (usandoTextoEspecial) {
            // Textos especiais (Forro ou Tenda)
            try {
                const valorTotal = dadosConcorrente.valorTotal || '';
                const valorFormatado = typeof valorTotal === 'number'
                    ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : valorTotal;
                const textoEspecial = typeof obterTextoOrcamento === 'function'
                    ? obterTextoOrcamento(tipoTexto, dadosOrcamento.igreja.nome, valorFormatado, true)
                    : '';
                const linhasTexto = textoEspecial.split('\n');

                for (const linha of linhasTexto) {
                    if (posicaoY > 260) { pdf.addPage(); posicaoY = 20; }
                    if (linha.trim() === '') { posicaoY += 3; }
                    else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        pdf.setFont("helvetica", "bold");
                        const lq = pdf.splitTextToSize(linha, 170);
                        lq.forEach(l => { pdf.text(l, margemEsquerda, posicaoY); posicaoY += 6; });
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, margemEsquerda + 5, posicaoY); posicaoY += 6; });
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
                        pdf.line(margemEsquerda, posicaoY, 190, posicaoY); posicaoY += 5;
                    } else {
                        const lq = pdf.splitTextToSize(linha, 170);
                        lq.forEach(l => { pdf.text(l, margemEsquerda, posicaoY); posicaoY += 6; });
                    }
                }
                posicaoY += 6;
            } catch (_) { console.error('Erro texto especial STV:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele
            const linhas = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 170);
            linhas.forEach(l => {
                if (posicaoY > 260) { pdf.addPage(); posicaoY = 20; }
                pdf.text(l, margemEsquerda, posicaoY);
                posicaoY += 6;
            });
            posicaoY += 6;
        } else {
            // Se não houver texto personalizado, usa o padrão (exceto em Pedido Especial)
            if (!(dadosOrcamento && dadosOrcamento.especialSemPadrao)) {
                const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
                pdf.text("REFORMA E MANUTENÇÃO DE SOM: " + totalFormatado, margemEsquerda, posicaoY);
                posicaoY += 12;
            } else {
                posicaoY += 6;
            }
        }

        posicaoY += 35;

        // Validade
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.text("Orçamento válido por 30 dias após emissão.", margemEsquerda, posicaoY);

    } catch (error) {
        console.error("Erro ao gerar PDF da STV:", error);
        // Fallback simples em caso de erro
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("STV IMAGEM E SOM", 105, 20, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text("Ocorreu um erro na geração do orçamento.", 105, 40, { align: "center" });

        // Verificar existência de dadosConcorrente.totalFormatado
        const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
        pdf.text("Valor: " + totalFormatado, 105, 50, { align: "center" });
    }

    return pdf;
}

// Exporta a função globalmente
window.gerarPDFSTV = gerarPDFSTV; 