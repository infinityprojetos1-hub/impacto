// Função para gerar PDF da empresa SENA AUDIOVISUAL PRODUÇÕES
function gerarPDFSena(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margemEsquerda = 20;
    let posicaoY = 30;

    try {
        // Garantir que os dados existam
        if (!dadosOrcamento) {
            dadosOrcamento = {
                igreja: { nome: "Igreja", codigo: "N/A" },
                dataOrcamento: "N/A",
                prazoExecucao: "30"
            };
        }

        if (!dadosConcorrente) {
            dadosConcorrente = {
                nome: "SENA AUDIOVISUAL",
                itens: [{ servico: "Serviços de sonorização" }],
                totalFormatado: "R$ 0,00",
                totalPorExtenso: "zero reais"
            };
        }

        // Adiciona logo se disponível
        if (logos && logos.sena) {
            try {
                pdf.addImage(logos.sena, 'PNG', 75, 10, 60, 20);
                posicaoY = 40;
                console.log("Logo SENA AUDIOVISUAL adicionada ao PDF com sucesso!");
            } catch (e) {
                console.error("Erro ao adicionar logo SENA:", e);
                useFallbackHeader();
            }
        } else {
            useFallbackHeader();
        }

        function useFallbackHeader() {
            // Cabeçalho alternativo
            pdf.setFillColor(120, 20, 20); // Vermelho escuro
            pdf.rect(0, 0, 210, 35, 'F');

            pdf.setTextColor(255, 255, 255); // Branco
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.text("SENA AUDIOVISUAL PRODUÇÕES", 105, 20, { align: "center" });

            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(12);
            pdf.text("CNPJ: 23.456.789/0001-12", 105, 28, { align: "center" });

            posicaoY = 45;
        }

        // Número do orçamento
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);

        // Gera um número de orçamento baseado na data e nome da igreja
        // Verificar existência de dadosOrcamento.igreja.nome
        const nomeIgreja = textoSeguro(dadosOrcamento.igreja && dadosOrcamento.igreja.nome ? dadosOrcamento.igreja.nome : "Igreja");
        const numOrcamento = `${new Date().getFullYear()}-${(nomeIgreja.length % 1000) + 100}`;
        pdf.text(`ORÇAMENTO Nº ${numOrcamento}`, 105, posicaoY, { align: "center" });
        posicaoY += 10;

        // Data
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        // Verificar se existe dadosOrcamento.dataOrcamento
        const dataOrcamento = textoSeguro(dadosOrcamento.dataOrcamento || "N/A");
        pdf.text(`Data: ${dataOrcamento}`, 170, posicaoY, { align: "right" });
        posicaoY += 10;

        // Informações do cliente
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margemEsquerda, posicaoY, 170, 10, 'F');

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("DADOS DO CLIENTE", margemEsquerda + 5, posicaoY + 7);
        posicaoY += 15;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("Cliente:", margemEsquerda, posicaoY);
        pdf.setFont("helvetica", "normal");
        pdf.text("Igreja Cristã Maranata", margemEsquerda + 40, posicaoY);
        posicaoY += 7;

        pdf.setFont("helvetica", "bold");
        pdf.text("Local:", margemEsquerda, posicaoY);
        pdf.setFont("helvetica", "normal");
        pdf.text(textoSeguro(nomeIgreja), margemEsquerda + 40, posicaoY);
        posicaoY += 7;

        pdf.setFont("helvetica", "bold");
        pdf.text("Código:", margemEsquerda, posicaoY);
        pdf.setFont("helvetica", "normal");
        // Verificar existência de dadosOrcamento.igreja.codigo
        const codigoIgreja = textoSeguro(dadosOrcamento.igreja && dadosOrcamento.igreja.codigo ? dadosOrcamento.igreja.codigo : "N/A");
        pdf.text(codigoIgreja, margemEsquerda + 40, posicaoY);
        posicaoY += 15;

        // Descrição do serviço
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margemEsquerda, posicaoY, 170, 10, 'F');

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("DESCRIÇÃO DO SERVIÇO", margemEsquerda + 5, posicaoY + 7);
        posicaoY += 15;

        // Texto introdutório - personalizado, especial OU padrão + tabela (nunca os dois)
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
                    if (posicaoY > 250) { pdf.addPage(); posicaoY = 20; }
                    if (linha.trim() === '') { posicaoY += 3; }
                    else if (linha.startsWith('ORÇAMENTO') || linha.startsWith('Orçamento') || linha.match(/^\d+\.\s/)) {
                        pdf.setFont("helvetica", "bold");
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, margemEsquerda, posicaoY); posicaoY += 5; });
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const lq = pdf.splitTextToSize(linha, 160);
                        lq.forEach(l => { pdf.text(l, margemEsquerda + 5, posicaoY); posicaoY += 5; });
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
                        pdf.line(margemEsquerda, posicaoY, 185, posicaoY); posicaoY += 5;
                    } else {
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, margemEsquerda, posicaoY); posicaoY += 5; });
                    }
                }
                posicaoY += 10;
            } catch (_) { console.error('Erro texto especial Sena:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem tabela de serviços)
            const linhasIntro = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 165);
            linhasIntro.forEach(l => {
                if (posicaoY > 250) { pdf.addPage(); posicaoY = 20; }
                pdf.text(l, margemEsquerda, posicaoY);
                posicaoY += 5;
            });
            posicaoY += 10;
        } else {
            // Se não houver texto personalizado, usa o padrão + tabela (exceto em Pedido Especial)
            if (!(dadosOrcamento && dadosOrcamento.especialSemPadrao)) {
                const textoIntro = "Conforme solicitado, apresentamos nossa proposta comercial para os serviços de som e audiovisual conforme especificações abaixo:";
                const linhasIntro = pdf.splitTextToSize(textoIntro, 165);
                pdf.text(linhasIntro, margemEsquerda, posicaoY);
                posicaoY += (linhasIntro.length * 5) + 5;
            } else {
                posicaoY += 5;
            }

            // Tabela de serviços
            pdf.setFillColor(120, 20, 20);
            pdf.rect(margemEsquerda, posicaoY, 170, 10, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.text("ITEM", margemEsquerda + 10, posicaoY + 7);
            pdf.text("DESCRIÇÃO", margemEsquerda + 85, posicaoY + 7, { align: "center" });
            posicaoY += 15;

            // Itens da tabela
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);

            const itens = dadosConcorrente && dadosConcorrente.itens ? dadosConcorrente.itens : [];
            for (let i = 0; i < itens.length; i++) {
                if (posicaoY > 250) {
                    pdf.addPage();
                    posicaoY = 20;
                }

                if (i % 2 === 0) {
                    pdf.setFillColor(245, 245, 245);
                    pdf.rect(margemEsquerda, posicaoY - 5, 170, 8, 'F');
                }

                pdf.text(`${i + 1}`, margemEsquerda + 10, posicaoY);
                const servico = textoSeguro(itens[i] && itens[i].servico ? itens[i].servico : "Serviço de áudio e vídeo");

                const linhasServico = pdf.splitTextToSize(servico, 140);
                pdf.text(linhasServico, margemEsquerda + 25, posicaoY);

                const linhasAdicionais = linhasServico.length > 1 ? linhasServico.length - 1 : 0;
                posicaoY += 8 + (linhasAdicionais * 5);
            }
        }

        posicaoY += 10;

        // Valor total
        pdf.setFillColor(120, 20, 20);
        pdf.rect(margemEsquerda, posicaoY, 170, 12, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("VALOR TOTAL:", margemEsquerda + 40, posicaoY + 8);

        // Verificar existência de dadosConcorrente.totalFormatado
        const totalFormatado = textoSeguro(dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00");
        pdf.text(totalFormatado, margemEsquerda + 140, posicaoY + 8);
        posicaoY += 20;

        // Observações
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text("Observações:", margemEsquerda, posicaoY);
        posicaoY += 8;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        // Verificar existência de dadosOrcamento.prazoExecucao e dadosConcorrente.totalPorExtenso
        const prazoExecucao = textoSeguro(dadosOrcamento.prazoExecucao || "30");
        const totalPorExtenso = textoSeguro(dadosConcorrente && dadosConcorrente.totalPorExtenso ? dadosConcorrente.totalPorExtenso : "zero reais");

        const observacoes = [
            `• Prazo de execução: ${prazoExecucao} dias úteis após aprovação`,
            "• Forma de pagamento: 40% de entrada e 60% na conclusão",
            "• Validade da proposta: 30 dias",
            `• Valor por extenso: ${totalPorExtenso}`
        ];

        for (const obs of observacoes) {
            const linhasObs = pdf.splitTextToSize(obs, 165);
            pdf.text(linhasObs, margemEsquerda + 5, posicaoY);
            posicaoY += 7 + ((linhasObs.length - 1) * 5);
        }

        posicaoY += 10;

        // Assinatura
        pdf.line(70, posicaoY, 140, posicaoY);
        posicaoY += 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("SENA AUDIOVISUAL PRODUÇÕES", 105, posicaoY, { align: "center" });
        posicaoY += 7;
        pdf.setFont("helvetica", "normal");
        pdf.text("Tel: (27) 3345-6789 | contato@senaaudiovisual.com.br", 105, posicaoY, { align: "center" });

        // Rodapé
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.text("SENA AUDIOVISUAL PRODUÇÕES LTDA - CNPJ: 23.456.789/0001-12", 105, 285, { align: "center" });
    } catch (error) {
        console.error("Erro ao gerar PDF da SENA AUDIOVISUAL:", error);
        // Fallback simples em caso de erro
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("SENA AUDIOVISUAL PRODUÇÕES", 105, 20, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text("Ocorreu um erro na geração do orçamento.", 105, 40, { align: "center" });

        // Verificar existência de dadosConcorrente.totalFormatado
        const totalFormatado = dadosConcorrente && dadosConcorrente.totalFormatado ? dadosConcorrente.totalFormatado : "R$ 0,00";
        pdf.text("Valor: " + totalFormatado, 105, 50, { align: "center" });
    }

    return pdf;
}

// Função auxiliar para texto seguro
function textoSeguro(texto) {
    if (texto === undefined || texto === null) return "";
    return texto.toString();
}

// Disponibiliza a função globalmente
window.gerarPDFSena = gerarPDFSena; 