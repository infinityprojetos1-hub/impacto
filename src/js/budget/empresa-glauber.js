// Função para gerar PDF da empresa GLAUBER SISTEMAS CONSTRUTIVOS
function gerarPDFGlauber(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margemEsquerda = 20;
    let posicaoY = 35;

    try {
        // Adiciona logo se disponível
        if (logos && logos.glauber) {
            try {
                // Ajuste da logo para manter proporção (largura x altura)
                pdf.addImage(logos.glauber, 'PNG', 70, 10, 70, 25);
                posicaoY = 40;
                console.log("Logo GLAUBER adicionada ao PDF com sucesso!");
            } catch (e) {
                console.error("Erro ao adicionar logo GLAUBER:", e);
                useFallbackHeader();
            }
        } else {
            useFallbackHeader();
        }

        function useFallbackHeader() {
            // Cabeçalho alternativo
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(20);
            pdf.setTextColor(33, 78, 118); // Azul escuro
            pdf.text("GLAUBER", 105, 20, { align: "center" });
            
            pdf.setFontSize(14);
            pdf.setTextColor(128, 128, 128); // Cinza
            pdf.text("SISTEMAS CONSTRUTIVOS", 105, 28, { align: "center" });

            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(10);
            pdf.text("Instalação e Manutenção Elétrica", 105, 34, { align: "center" });

            pdf.setDrawColor(33, 78, 118);
            pdf.setLineWidth(0.5);
            pdf.line(40, 37, 170, 37);
        }

        // Informações da igreja
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`CLIENTE: Igreja Cristã Maranata`, margemEsquerda, posicaoY);

        // Verificar se existe dadosOrcamento.dataOrcamento
        const dataOrcamento = dadosOrcamento.dataOrcamento || "N/A";
        pdf.text(`DATA: ${dataOrcamento}`, 150, posicaoY);
        posicaoY += 8;

        // Verificar existência de dadosOrcamento.prazoExecucao
        const prazoExecucao = dadosOrcamento.prazoExecucao || "30";
        pdf.text(`PRAZO: ${prazoExecucao} dias`, 150, posicaoY);
        posicaoY += 8;

        // Verificar existência de dadosOrcamento.igreja.codigo
        const codigoIgreja = dadosOrcamento.igreja && dadosOrcamento.igreja.codigo ? dadosOrcamento.igreja.codigo : "N/A";
        pdf.text(`CÓDIGO: ${codigoIgreja}`, margemEsquerda, posicaoY);
        posicaoY += 15;

        // Título do orçamento
        pdf.setFillColor(33, 78, 118);
        pdf.rect(margemEsquerda, posicaoY - 5, 170, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text("ORÇAMENTO DE SERVIÇOS", 105, posicaoY, { align: "center" });
        posicaoY += 15;

        // Descrição - personalizado, especial OU padrão + lista (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        if (usandoTextoEspecial) {
            // Textos especiais (Forro, Tenda ou Vidro)
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
                    if (posicaoY > 270) { pdf.addPage(); posicaoY = 20; }
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
                posicaoY += 10;
            } catch (_) { console.error('Erro texto especial Glauber:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem lista de serviços)
            const linhas = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 170);
            linhas.forEach(l => {
                if (posicaoY > 260) { pdf.addPage(); posicaoY = 20; }
                pdf.text(l, margemEsquerda, posicaoY);
                posicaoY += 6;
            });
            posicaoY += 10;
        } else {
            // Se não houver texto personalizado, usa o padrão + lista (exceto em Pedido Especial)
            if (!(dadosOrcamento && dadosOrcamento.especialSemPadrao)) {
                const textoDescritivo = "Conforme solicitado, apresentamos nossa proposta para prestação dos serviços abaixo relacionados:";
                pdf.text(textoDescritivo, margemEsquerda, posicaoY);
                posicaoY += 10;
            }

            // Cabeçalho da tabela
            pdf.setFillColor(220, 220, 220);
            pdf.rect(margemEsquerda, posicaoY, 170, 8, 'F');
            pdf.setFont("helvetica", "bold");
            pdf.text("DESCRIÇÃO DOS SERVIÇOS", 105, posicaoY + 5, { align: "center" });
            posicaoY += 12;

            // Lista de serviços
            pdf.setFont("helvetica", "normal");
            let contador = 1;

            const itens = dadosConcorrente && dadosConcorrente.itens ? dadosConcorrente.itens : [];
            for (const item of itens) {
                const servico = item && item.servico ? item.servico : "Serviço de instalação e manutenção";
                pdf.text(`${contador}. ${servico}`, margemEsquerda + 5, posicaoY);
                posicaoY += 8;

                if (posicaoY > 270) {
                    pdf.addPage();
                    posicaoY = 20;
                }

                contador++;
            }
        }

        posicaoY += 5;

        // Verificar se há espaço suficiente para valor total e rodapé (mínimo 40mm antes do fim)
        if (posicaoY > 240) {
            pdf.addPage();
            posicaoY = 20;
        }

        // Valor total
        pdf.setFillColor(33, 78, 118);
        pdf.rect(margemEsquerda, posicaoY, 170, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("VALOR TOTAL:", 80, posicaoY + 7);

        // Verificar existência de dadosConcorrente.totalFormatado
        const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
        pdf.text(totalFormatado, 145, posicaoY + 7);
        posicaoY += 15;

        // Valor por extenso
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);

        // Verificar existência de dadosConcorrente.totalPorExtenso
        const totalPorExtenso = dadosConcorrente && dadosConcorrente.totalPorExtenso ? dadosConcorrente.totalPorExtenso : "zero reais";
        const linhasExtenso = pdf.splitTextToSize(`Valor por extenso: ${totalPorExtenso}`, 170);
        linhasExtenso.forEach(linha => {
            pdf.text(linha, margemEsquerda, posicaoY);
            posicaoY += 5;
        });

        // Rodapé (posicionamento fixo no final da página)
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text("GLAUBER SISTEMAS CONSTRUTIVOS", 105, 270, { align: "center" });
        pdf.setFontSize(7);
        pdf.text("CNPJ: 31.592.072/0001-07", 105, 275, { align: "center" });
        pdf.text("Tel: (27) 97770-0141 | E-mail: glauberimpactusp@hotmail.com", 105, 280, { align: "center" });
        pdf.text("R. Padre Bento Dias Pacheco, 135 - Solon Borges - Vitória/ES - CEP: 29.072-015", 105, 285, { align: "center" });
    } catch (error) {
        console.error("Erro ao gerar PDF da GLAUBER:", error);
        // Fallback simples em caso de erro
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("GLAUBER SISTEMAS CONSTRUTIVOS", 105, 20, { align: "center" });
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
window.gerarPDFGlauber = gerarPDFGlauber;
