// Função para gerar PDF da empresa UP SERVIÇOS
function gerarPDFUPServicos(dadosOrcamento, dadosConcorrente, logos) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margemEsquerda = 20;
    let posicaoY = 30;

    try {
        // Garantir que dadosOrcamento e dadosConcorrente existam
        if (!dadosOrcamento) {
            dadosOrcamento = {
                igreja: { nome: "Igreja", codigo: "N/A" },
                dataOrcamento: "N/A",
                prazoExecucao: "30"
            };
        }

        if (!dadosConcorrente) {
            dadosConcorrente = {
                nome: "UP SERVIÇOS",
                itens: [{ servico: "Serviços de sonorização" }],
                totalFormatado: "R$ 0,00",
                totalPorExtenso: "zero reais"
            };
        }

        // Adiciona logo se disponível - ajustando proporções para evitar distorção
        if (logos && logos.upServicos) {
            try {
                // Ajustando dimensões para manter proporção (largura:altura = 2.3:1)
                // Largura original: 70, altura fixa em 30 para melhor proporção
                const logoLargura = 70;
                const logoAltura = 30;

                // Centraliza horizontalmente (210 - largura)/2
                const logoX = (210 - logoLargura) / 2;

                pdf.addImage(logos.upServicos, 'PNG', logoX, 15, logoLargura, logoAltura);
                posicaoY = 50;
                console.log("Logo UP SERVIÇOS adicionada ao PDF com sucesso!");
            } catch (e) {
                console.error("Erro ao adicionar logo UP SERVIÇOS:", e);
                useFallbackHeader();
            }
        } else {
            useFallbackHeader();
        }

        function useFallbackHeader() {
            // Cabeçalho alternativo
            pdf.setFillColor(0, 128, 0); // Verde
            pdf.rect(0, 0, 210, 40, 'F');

            pdf.setTextColor(255, 255, 255); // Branco
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(24);
            pdf.text("UP SERVIÇOS", 105, 25, { align: "center" });

            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(14);
            pdf.text("Tecnologia e Solução", 105, 35, { align: "center" });

            posicaoY = 50;
        }

        // Título do documento
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margemEsquerda, posicaoY, 170, 12, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("ORÇAMENTO DE SERVIÇOS", 105, posicaoY + 8, { align: "center" });
        posicaoY += 20;

        // Informações do cliente
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("INFORMAÇÕES DO CLIENTE", margemEsquerda, posicaoY);
        posicaoY += 8;

        // Tabela com informações
        pdf.setDrawColor(0, 128, 0);
        pdf.setLineWidth(0.3);

        // Linhas horizontais
        pdf.line(margemEsquerda, posicaoY, 190, posicaoY);
        pdf.line(margemEsquerda, posicaoY + 10, 190, posicaoY + 10);
        pdf.line(margemEsquerda, posicaoY + 20, 190, posicaoY + 20);
        pdf.line(margemEsquerda, posicaoY + 30, 190, posicaoY + 30);

        // Linhas verticais
        pdf.line(margemEsquerda, posicaoY, margemEsquerda, posicaoY + 30);
        pdf.line(70, posicaoY, 70, posicaoY + 30);
        pdf.line(190, posicaoY, 190, posicaoY + 30);

        // Conteúdo da tabela
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("Cliente:", margemEsquerda + 2, posicaoY + 7);
        pdf.text("Data:", margemEsquerda + 2, posicaoY + 17);
        pdf.text("Código:", margemEsquerda + 2, posicaoY + 27);

        pdf.setFont("helvetica", "normal");
        pdf.text("Igreja Cristã Maranata", 72, posicaoY + 7);

        // Garantir valores seguros para textos
        const dataOrcamento = textoSeguro(dadosOrcamento.dataOrcamento);
        const codigoIgreja = textoSeguro(dadosOrcamento.igreja && dadosOrcamento.igreja.codigo);

        pdf.text(dataOrcamento, 72, posicaoY + 17);
        pdf.text(codigoIgreja, 72, posicaoY + 27);

        posicaoY += 40;

        // Descrição do orçamento - personalizado, especial OU padrão + lista (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        if (usandoTextoEspecial) {
            // Textos especiais (Forro ou Tenda)
            try {
                pdf.setFontSize(10);
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
                        lq.forEach(l => { pdf.text(l, margemEsquerda, posicaoY); posicaoY += 7; });
                        pdf.setFont("helvetica", "normal");
                    } else if (linha.startsWith('•')) {
                        const lq = pdf.splitTextToSize(linha, 165);
                        lq.forEach(l => { pdf.text(l, margemEsquerda + 5, posicaoY); posicaoY += 7; });
                    } else if (linha.startsWith('---')) {
                        pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
                        pdf.line(margemEsquerda, posicaoY, 190, posicaoY); posicaoY += 5;
                    } else {
                        const lq = pdf.splitTextToSize(linha, 170);
                        lq.forEach(l => { pdf.text(l, margemEsquerda, posicaoY); posicaoY += 7; });
                    }
                }
                posicaoY += 10;
            } catch (_) { console.error('Erro texto especial UP:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem lista de serviços)
            const linhasDescricao = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 170);
            linhasDescricao.forEach(l => {
                if (posicaoY > 260) { pdf.addPage(); posicaoY = 20; }
                pdf.text(l, margemEsquerda, posicaoY);
                posicaoY += 7;
            });
            posicaoY += 10;
        } else {
            // Se não houver texto personalizado, usa o padrão + lista (exceto em Pedido Especial)
            if (!(dadosOrcamento && dadosOrcamento.especialSemPadrao)) {
                const nomeIgreja = textoSeguro(dadosOrcamento.igreja && dadosOrcamento.igreja.nome);
                const prazoExecucao = textoSeguro(dadosOrcamento.prazoExecucao);
                const descricao = `Apresentamos nossa proposta para execução dos serviços de sonorização conforme solicitado para a igreja ${nomeIgreja}, a serem executados no prazo de ${prazoExecucao} dias após aprovação.`;
                const linhasDescricao = pdf.splitTextToSize(descricao, 170);
                pdf.text(linhasDescricao, margemEsquerda, posicaoY);
                posicaoY += linhasDescricao.length * 7 + 10;
            } else {
                posicaoY += 10;
            }

            // Título dos serviços
            pdf.setFillColor(0, 128, 0);
            pdf.rect(margemEsquerda, posicaoY, 170, 10, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.text("DESCRIÇÃO DOS SERVIÇOS", 105, posicaoY + 7, { align: "center" });
            posicaoY += 15;

            // Lista de serviços
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);

            const itens = dadosConcorrente.itens || [];

            for (let i = 0; i < itens.length; i++) {
                if (posicaoY > 260) {
                    pdf.addPage();
                    posicaoY = 20;
                }

                if (i % 2 === 0) {
                    pdf.setFillColor(245, 245, 245);
                    pdf.rect(margemEsquerda, posicaoY - 5, 170, 10, 'F');
                }

                const item = itens[i] || { servico: "Serviço não especificado" };
                const servico = textoSeguro(item.servico);

                pdf.text(`${i + 1}. ${servico}`, margemEsquerda + 5, posicaoY);
                posicaoY += 10;
            }
        }

        posicaoY += 5;

        // Valor total
        pdf.setFillColor(0, 128, 0);
        pdf.rect(margemEsquerda, posicaoY, 170, 12, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("VALOR TOTAL:", margemEsquerda + 5, posicaoY + 8);

        // Garantir valor seguro
        const totalFormatado = textoSeguro(dadosConcorrente.totalFormatado);
        pdf.text(totalFormatado, 180, posicaoY + 8, { align: "right" });

        // Avança posição Y (removendo o valor por extenso)
        posicaoY += 20;

        // Validade
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Validade da proposta: 30 dias", margemEsquerda, posicaoY);

        // Rodapé
        pdf.setFillColor(0, 128, 0);
        pdf.rect(0, 270, 210, 27, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("UP SERVIÇOS", 105, 280, { align: "center" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("Tel: (27) 3222-1234 | upservicos@contato.com.br", 105, 287, { align: "center" });
        pdf.text("CNPJ: 12.345.678/0001-90", 105, 293, { align: "center" });
    } catch (error) {
        console.error("Erro ao gerar PDF da UP SERVIÇOS:", error);
        // Fallback simples em caso de erro
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("UP SERVIÇOS", 105, 20, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text("Ocorreu um erro na geração do orçamento.", 105, 40, { align: "center" });
    }

    return pdf;
}

// Função auxiliar para texto seguro
function textoSeguro(texto) {
    if (texto === undefined || texto === null) return "";
    return texto.toString();
}

// Disponibiliza a função globalmente
window.gerarPDFUPServicos = gerarPDFUPServicos; 