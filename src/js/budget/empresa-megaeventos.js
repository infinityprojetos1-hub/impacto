// Modelo de PDF para MEGA EVENTOS
function gerarPDFMegaEventos(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margem = 14;
    let y = 20;

    try {
        // Cabeçalho com logo (centralizado e com largura limitada)
        if (logos && (logos.megaLogo || logos.megaEventos || logos.mega)) {
            const img = logos.megaLogo || logos.megaEventos || logos.mega;
            try {
                // Preenche praticamente toda a largura útil da página
                const x = 15; const w = 180; const h = 25;
                pdf.addImage(img, 'PNG', x, 8, w, h);
            } catch (_) { }
        }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
        // Posiciona o título abaixo da logo (sem sobreposição)
        pdf.text('Proposta Comercial', 105, 38, { align: 'center' });
        y = 46;

        // Cliente e dados (sem código da igreja)
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
        pdf.text(`Data: ${dadosOrcamento.dataOrcamento || ''}`, 195 - margem, y, { align: 'right' }); y += 5;
        pdf.text(`Igreja: ${dadosOrcamento.igreja && dadosOrcamento.igreja.nome ? dadosOrcamento.igreja.nome : ''}`, margem, y); y += 8;

        // Texto personalizado, especial OU tabela de itens (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

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
                    if (y > 270) { pdf.addPage(); y = 20; }

                    if (linha.trim() === '') {
                        y += 3;
                    } else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        pdf.setFont("helvetica", "bold");
                        const linhasQuebradas = pdf.splitTextToSize(linha, 170);
                        linhasQuebradas.forEach(lq => { pdf.text(lq, margem, y); y += 5; });
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const linhasQuebradas = pdf.splitTextToSize(linha, 165);
                        linhasQuebradas.forEach(lq => { pdf.text(lq, margem + 5, y); y += 5; });
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150);
                        pdf.setLineWidth(0.3);
                        pdf.line(margem, y, 196 - margem, y);
                        y += 5;
                    } else {
                        const linhasQuebradas = pdf.splitTextToSize(linha, 170);
                        linhasQuebradas.forEach(lq => { pdf.text(lq, margem, y); y += 5; });
                    }
                }
                y += 8;
            } catch (_) { console.error('Erro ao renderizar texto especial:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem tabela)
            try {
                const linhasPers = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 170);
                linhasPers.forEach(l => {
                    if (y > 250) { pdf.addPage(); y = 20; }
                    pdf.text(l, margem, y);
                    y += 5;
                });
                y += 8;
            } catch (_) { }
        } else {
            // Se não houver texto personalizado, renderiza a tabela de itens
            const xItem = margem;
            const wItem = 20;
            const xDesc = xItem + wItem;
            const wDesc = 196 - margem - xDesc;

            // Cabeçalho
            pdf.setFont('helvetica', 'bold');
            pdf.rect(xItem, y, wItem, 8);
            pdf.rect(xDesc, y, wDesc, 8);
            pdf.text('ITEM', xItem + wItem / 2, y + 5, { align: 'center' });
            pdf.text('DESCRIÇÃO', xDesc + wDesc / 2, y + 5, { align: 'center' });
            y += 8;

            // Linhas
            pdf.setFont('helvetica', 'normal');
            (dadosConcorrente.itens || []).forEach((it, idx) => {
                const num = String(idx + 1).padStart(2, '0');
                const linhas = pdf.splitTextToSize(it.servico || 'Serviço', wDesc - 4);
                const altura = Math.max(8, linhas.length * 6 + 2);

                pdf.rect(xItem, y, wItem, altura);
                pdf.rect(xDesc, y, wDesc, altura);

                pdf.text(num, xItem + wItem / 2, y + 5, { align: 'center' });
                let yy = y + 5;
                linhas.forEach(l => { pdf.text(l, xDesc + 2, yy); yy += 6; });

                y += altura;
                if (y > 250) { pdf.addPage(); y = 20; }
            });
            y += 10;
        }

        // ORDEM: Texto (já renderizado) -> Total -> Carimbo -> Texto Final

        // 1. TOTAL
        pdf.setFont('helvetica', 'bold');
        const totalFmt = dadosConcorrente.totalFormatado || 'R$ 0,00';
        pdf.text('TOTAL', 150, y);
        pdf.text(totalFmt, 196 - margem, y, { align: 'right' });
        y += 12;

        // Verifica se há espaço para carimbo + rodapé (~85mm necessários)
        if (y > 165) {
            pdf.addPage();
            y = 20;
        }

        // 2. CARIMBO (após o total, com espaçamento)
        try {
            if (logos && (logos.megaCarimbo)) {
                pdf.addImage(logos.megaCarimbo, 'PNG', 60, y, 80, 45);
            }
        } catch (_) { }
        y += 48; // Espaço do carimbo + margem

        // 3. TEXTO FINAL (rodapé com dados da empresa)
        try {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Mega Eventos e Estruturas Ltda', 105, y, { align: 'center' });
            y += 5;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text('Eduardo da Costa Viana', 105, y, { align: 'center' });
            y += 5;
            pdf.text('1.129.598/071.382.657-60', 105, y, { align: 'center' });
            y += 6;

            pdf.setTextColor(200, 0, 0);
            pdf.setFont('times', 'italic');
            pdf.setFontSize(9);
            const frase = '"SOMOS COMPETITIVOS E VENCEDORES PORQUE TEMOS QUALIDADE E GARANTIMOS A CONTINUIDADE, FIDELIDADE E HONESTIDADE AOS CLIENTES"';
            const linhasFrase = pdf.splitTextToSize(frase, 180);
            linhasFrase.forEach(l => { pdf.text(l, 105, y, { align: 'center' }); y += 4; });

            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            const linhas1 = pdf.splitTextToSize('Vitória: Rua Antonio Ribeiro, 41, M. da Praia/ES - CEP 29065-260', 180);
            linhas1.forEach(l => { pdf.text(l, 105, y, { align: 'center' }); y += 4; });
            const linhas2 = pdf.splitTextToSize('Serra: Rua Presidente Janio Quadros, 464, Jardim Carapina/ES - CNPJ: 13.452.945/0001-96', 180);
            linhas2.forEach(l => { pdf.text(l, 105, y, { align: 'center' }); y += 4; });
            const linhas3 = pdf.splitTextToSize('Site: www.megaeventos.com.br  /  E-mail: mega@megaeventos.com.br', 180);
            linhas3.forEach(l => { pdf.text(l, 105, y, { align: 'center' }); y += 4; });
            const linhas4 = pdf.splitTextToSize('Telefones: (27) 3314 1484  /  9981 0232  /  99716053', 180);
            linhas4.forEach(l => { pdf.text(l, 105, y, { align: 'center' }); y += 4; });
        } catch (_) { }
    } catch (e) {
        console.error('Erro PDF MEGA EVENTOS', e);
    }
    return pdf;
}

window.gerarPDFMegaEventos = gerarPDFMegaEventos;

