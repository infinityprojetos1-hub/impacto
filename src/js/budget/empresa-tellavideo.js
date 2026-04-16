// Modelo de PDF para TELLA VIDEO
function gerarPDFTellaVideo(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margem = 14;
    let y = 20;

    try {
        // Logo e título no topo
        if (logos && (logos.tellaLogo)) {
            try { pdf.addImage(logos.tellaLogo, 'PNG', 75, 8, 60, 20); } catch (_) { }
        }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
        // Posiciona o título abaixo da logo para não sobrepor
        pdf.text('PROPOSTA DE ORÇAMENTO', 105, 32, { align: 'center' });
        y = 40;

        // Data à direita (como no original)
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
        pdf.text(`Data: ${dadosOrcamento.dataOrcamento || ''}`, 195 - margem, y, { align: 'right' });
        y += 10;

        // Texto introdutório: personalizado, especial OU padrão (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

        if (usandoTextoEspecial) {
            // Textos especiais (Forro ou Tenda)
            try {
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
                const valorTotal = dadosConcorrente.valorTotal || '';
                const valorFormatado = typeof valorTotal === 'number'
                    ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : valorTotal;
                const textoEspecial = typeof obterTextoOrcamento === 'function'
                    ? obterTextoOrcamento(tipoTexto, dadosOrcamento.igreja.nome, valorFormatado, true)
                    : '';
                const linhasTexto = textoEspecial.split('\n');

                for (const linha of linhasTexto) {
                    if (y > 260) { pdf.addPage(); y = 20; }
                    if (linha.trim() === '') { y += 3; }
                    else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        pdf.setFont("helvetica", "bold");
                        const lq = pdf.splitTextToSize(linha, 170);
                        lq.forEach(l => { pdf.text(l, margem, y); y += 5; });
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, margem + 5, y); y += 5; });
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
                        pdf.line(margem, y, 195 - margem, y); y += 5;
                    } else {
                        const lq = pdf.splitTextToSize(linha, 170);
                        lq.forEach(l => { pdf.text(l, margem, y); y += 5; });
                    }
                }
                y += 8;
            } catch (_) { console.error('Erro texto especial Tella:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem lista de itens)
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
            const linhas = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 170);
            linhas.forEach(l => {
                if (y > 260) { pdf.addPage(); y = 20; }
                pdf.text(l, margem, y);
                y += 5;
            });
            y += 8;
        } else {
            // Se não houver texto personalizado, usa o padrão (exceto em Pedido Especial)
            if (!(dadosOrcamento && dadosOrcamento.especialSemPadrao)) {
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
                pdf.text('Detalhamento dos Itens', margem, y);
                y += 8;
            }

            // Lista numerada apenas quando NÃO houver texto personalizado
            (dadosConcorrente.itens || []).forEach((it, idx) => {
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${idx + 1}. -`, margem, y);
                pdf.setFont('helvetica', 'normal');
                const linhas = pdf.splitTextToSize(it.servico || 'Serviço', 170);
                linhas.forEach(l => { pdf.text(l, margem + 8, y); y += 5; });
                y += 2;
                if (y > 260) { pdf.addPage(); y = 20; }
            });
        }

        y += 6;
        pdf.setFont('helvetica', 'bold');
        const totalFmt = dadosConcorrente.totalFormatado || 'R$ 0,00';
        pdf.text(`VALOR: ${totalFmt}`, margem, y);
        y += 15;

        // Carimbo após o texto (verifica se precisa de nova página)
        try {
            if (logos && (logos.tellaCarimbo)) {
                // Verifica se há espaço para o carimbo (45mm de altura)
                if (y + 45 > 280) {
                    pdf.addPage();
                    y = 20;
                }
                pdf.addImage(logos.tellaCarimbo, 'PNG', 60, y, 90, 45);
                y += 50;
            }
        } catch (_) { }
    } catch (e) {
        console.error('Erro PDF TELLA VIDEO', e);
    }
    return pdf;
}

window.gerarPDFTellaVideo = gerarPDFTellaVideo;

