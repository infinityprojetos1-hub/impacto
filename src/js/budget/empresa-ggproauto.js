// Função para gerar PDF da empresa GG PROAUTO LTDA
function gerarPDFGGProauto(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margemEsquerda = 20;
    let posicaoY = 20;

    try {
        // Garantir que dadosOrcamento e dadosConcorrente existam
        if (!dadosOrcamento) {
            dadosOrcamento = { igreja: { nome: "Igreja", codigo: "N/A" }, dataOrcamento: "N/A", prazoExecucao: "30" };
        }

        if (!dadosOrcamento.igreja) {
            dadosOrcamento.igreja = { nome: "Igreja", codigo: "N/A" };
        }

        if (!dadosConcorrente) {
            dadosConcorrente = {
                nome: "GG PROAUTO LTDA",
                itens: [{ servico: "Serviço de manutenção de som" }],
                totalFormatado: "R$ 0,00"
            };
        }

        if (!dadosConcorrente.itens || !Array.isArray(dadosConcorrente.itens) || dadosConcorrente.itens.length === 0) {
            dadosConcorrente.itens = [{ servico: "Serviço de manutenção de som" }];
        }

        // Obter o ano atual dinamicamente
        const anoAtual = new Date().getFullYear();

        // Desenha a borda externa do documento
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(1);
        pdf.rect(20, 20, 170, 250);

        // Cabeçalho com informações da empresa e do orçamento
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("GG PROAUTO LTDA - 08.859.526/0001-33", 105, 30, { align: 'center' });

        // Informações do orçamento à direita com ano atual atualizado dinamicamente
        pdf.text(`ORÇAMENTO ${anoAtual}`, 175, 30, { align: 'right' });

        // Linha divisória
        pdf.setLineWidth(0.5);
        pdf.line(20, 35, 190, 35);

        // Informações do cliente
        pdf.setFont("helvetica", "bold");
        pdf.text("CLIENTE", 25, 45);
        pdf.text("LOCAL", 25, 55);

        pdf.setFont("helvetica", "normal");
        pdf.text(`Igreja Crista Maranata`, 90, 45);

        // Verificar se código da igreja existe
        const codigoIgreja = dadosOrcamento.igreja && dadosOrcamento.igreja.codigo ? dadosOrcamento.igreja.codigo : "N/A";
        pdf.text(`ICM - ${codigoIgreja}`, 90, 55);

        // Linha divisória
        pdf.line(20, 60, 190, 60);

        // Título ORÇAMENTO SOM
        pdf.text("ORÇAMENTO SOM", 105, 70, { align: 'center' });

        // Linha divisória
        pdf.line(20, 75, 190, 75);

        // Texto personalizado, especial OU tabela (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

        if (usandoTextoEspecial) {
            // Textos especiais (Forro ou Tenda)
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            let yTxt = 82;
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
                    if (yTxt > 220) { pdf.addPage(); yTxt = 30; pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(1); pdf.rect(20, 20, 170, 250); }
                    if (linha.trim() === '') { yTxt += 3; }
                    else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        pdf.setFont("helvetica", "bold");
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, 22, yTxt); yTxt += 6; });
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const lq = pdf.splitTextToSize(linha, 160);
                        lq.forEach(l => { pdf.text(l, 27, yTxt); yTxt += 6; });
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
                        pdf.line(22, yTxt, 188, yTxt); yTxt += 5;
                    } else {
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, 22, yTxt); yTxt += 6; });
                    }
                }
            } catch (_) { console.error('Erro texto especial GG:', _); }
            posicaoY = yTxt + 10;
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem tabela de equipamentos)
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            const linhas = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 165);
            let yTxt = 82;
            linhas.forEach(l => {
                if (yTxt > 220) { pdf.addPage(); yTxt = 30; pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(1); pdf.rect(20, 20, 170, 250); }
                pdf.text(l, 22, yTxt);
                yTxt += 6;
            });
            posicaoY = yTxt + 10;
        } else {
            // Se não houver texto personalizado, renderiza a tabela de equipamentos
            // Título EQUIPAMENTOS
            pdf.text("EQUIPAMENTOS", 105, 85, { align: 'center' });

            // Linha divisória
            pdf.line(20, 90, 190, 90);

            // Cabeçalho da tabela
            pdf.setFont("helvetica", "bold");
            pdf.text("Descrição", 105, 100, { align: 'center' });

            // Linha divisória
            pdf.line(20, 105, 190, 105);

            // Itens do orçamento
            posicaoY = 115;

            for (let i = 0; i < dadosConcorrente.itens.length; i++) {
                if (posicaoY > 220) {
                    pdf.addPage();
                    posicaoY = 30;

                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(1);
                    pdf.rect(20, 20, 170, 250);
                }

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(10);

                const item = dadosConcorrente.itens[i];
                const servico = item && item.servico ? item.servico : "Serviço não especificado";

                pdf.text(`${i + 1} - ${servico}`, 25, posicaoY);
                posicaoY += 10;
            }
        }

        // Linha divisória antes do valor total
        pdf.line(20, posicaoY + 5, 190, posicaoY + 5);

        // Valor total
        pdf.setFont("helvetica", "bold");
        pdf.text("VALOR TOTAL", 110, posicaoY + 15);

        // Verificar se totalFormatado existe
        const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
        pdf.text(totalFormatado, 180, posicaoY + 15, { align: 'right' });

        // Linha divisória após o valor total
        pdf.line(20, posicaoY + 20, 190, posicaoY + 20);

        // Informações de contato
        pdf.setFont("helvetica", "normal");
        posicaoY += 30;
        pdf.text("Validade de orçamento: 10 dd", 25, posicaoY);
        posicaoY += 10;
        pdf.text("Telefone Para Contato:", 25, posicaoY);
        posicaoY += 10;
        pdf.text("(027) 99926-1513", 25, posicaoY);
        posicaoY += 10;
        pdf.text("Email: Comercial@grupoabbavix.com.br", 25, posicaoY);

        // Assinatura
        posicaoY += 30;
        pdf.line(70, posicaoY, 140, posicaoY);
        posicaoY += 10;
        pdf.text("Vendedor Responsável", 105, posicaoY, { align: 'center' });
        posicaoY += 10;
        pdf.text("Gabriel Batista de Oliveira", 105, posicaoY, { align: 'center' });
    } catch (error) {
        console.error("Erro ao gerar PDF da GG PROAUTO:", error);
        // Fallback simples em caso de erro
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("GG PROAUTO LTDA", 105, 20, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text("Ocorreu um erro na geração do orçamento.", 105, 40, { align: "center" });

        // Verificar existência de dadosConcorrente.totalFormatado
        const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
        pdf.text("Valor: " + totalFormatado, 105, 50, { align: "center" });
    }

    return pdf;
}

// Disponibiliza a função globalmente
window.gerarPDFGGProauto = gerarPDFGGProauto; 