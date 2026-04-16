// Função para gerar PDF da empresa Virtual Guitar Shop
function gerarPDFVirtualGuitar(dadosOrcamento, dadosConcorrente, logos) {
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
                nome: "Virtual Guitar Shop",
                itens: [{ servico: "Serviços de sonorização" }],
                totalFormatado: "R$ 0,00",
                totalPorExtenso: "zero reais"
            };
        }

        // Adiciona logo se disponível
        if (logos && logos.virtualGuitar) {
            try {
                pdf.addImage(logos.virtualGuitar, 'PNG', 75, 5, 60, 20);
                posicaoY = 35; // Posição reduzida para caber tudo em uma página
                console.log("Logo Virtual Guitar Shop adicionada ao PDF com sucesso!");
            } catch (e) {
                console.error("Erro ao adicionar logo Virtual Guitar Shop:", e);
                useFallbackHeader();
            }
        } else {
            useFallbackHeader();
        }

        function useFallbackHeader() {
            // Cabeçalho alternativo
            pdf.setFillColor(80, 40, 120); // Roxo
            pdf.rect(0, 0, 210, 30, 'F');

            pdf.setTextColor(255, 255, 255); // Branco
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(18);
            pdf.text("VIRTUAL GUITAR SHOP", 105, 15, { align: "center" });

            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(10);
            pdf.text("Equipamentos Profissionais de Áudio", 105, 23, { align: "center" });

            posicaoY = 35; // Reduzido para economizar espaço vertical
        }

        // Informações do documento
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("ORÇAMENTO DE SERVIÇOS", 105, posicaoY, { align: "center" });
        posicaoY += 8; // Reduzido para economizar espaço

        // Data e número
        const numOrcamento = `VGS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000) + 100}`;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`Data: ${textoSeguro(dadosOrcamento.dataOrcamento)}`, margemEsquerda, posicaoY);
        pdf.text(`Orçamento Nº: ${numOrcamento}`, 190, posicaoY, { align: "right" });
        posicaoY += 10; // Reduzido para economizar espaço

        // Caixa com dados do cliente - altura reduzida para economizar espaço
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margemEsquerda, posicaoY, 170, 30, 'F'); // Reduzido para 30

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("CLIENTE", margemEsquerda + 5, posicaoY + 8);
        pdf.setFont("helvetica", "normal");
        pdf.text("Igreja Cristã Maranata", margemEsquerda + 60, posicaoY + 8);

        pdf.setFont("helvetica", "bold");
        pdf.text("LOCAL", margemEsquerda + 5, posicaoY + 16);
        pdf.setFont("helvetica", "normal");
        pdf.text(textoSeguro(dadosOrcamento.igreja.nome), margemEsquerda + 60, posicaoY + 16);

        pdf.setFont("helvetica", "bold");
        pdf.text("CÓDIGO", margemEsquerda + 5, posicaoY + 24);
        pdf.setFont("helvetica", "normal");
        pdf.text(textoSeguro(dadosOrcamento.igreja.codigo), margemEsquerda + 60, posicaoY + 24);

        posicaoY += 35; // Ajustado para o novo tamanho da caixa

        // Descrição - personalizado, especial OU padrão + lista (nunca os dois)
        const usandoPersonalizado = dadosOrcamento && dadosOrcamento.textoPersonalizadoConcorrente && dadosOrcamento.textoPersonalizadoConcorrente.trim();
        const tipoTexto = dadosOrcamento.tipoTexto || 'padrao';
        const usandoTextoEspecial = (tipoTexto === 'forro' || tipoTexto === 'tenda' || tipoTexto === 'vidro');

        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        if (usandoTextoEspecial) {
            // Textos especiais (Forro ou Tenda)
            try {
                pdf.setFont("helvetica", "normal");
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
                posicaoY += 8;
            } catch (_) { console.error('Erro texto especial VirtualGuitar:', _); }
        } else if (usandoPersonalizado) {
            // Se houver texto personalizado, usa só ele (sem lista de serviços)
            const linhas = pdf.splitTextToSize(dadosOrcamento.textoPersonalizadoConcorrente.trim(), 170);
            linhas.forEach(l => { 
                if (posicaoY > 260) { pdf.addPage(); posicaoY = 20; }
                pdf.text(l, margemEsquerda, posicaoY); 
                posicaoY += 6; 
            });
            posicaoY += 8;
        } else {
            // Se não houver texto personalizado, usa o padrão + lista (exceto em Pedido Especial)
            if (!(dadosOrcamento && dadosOrcamento.especialSemPadrao)) {
                const textoIntro = "Conforme solicitado, apresentamos nossa proposta comercial para os serviços abaixo:";
                pdf.text(textoIntro, margemEsquerda, posicaoY);
                posicaoY += 8;
            }

            // Cabeçalho da tabela de serviços
            pdf.setFillColor(80, 40, 120); // Roxo
            pdf.rect(margemEsquerda, posicaoY, 170, 8, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.text("DESCRIÇÃO DOS SERVIÇOS", 105, posicaoY + 5.5, { align: "center" });
            posicaoY += 12;

            // Lista de serviços
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);

            const itens = dadosConcorrente.itens || [];
            for (let i = 0; i < itens.length; i++) {
                if (i % 2 === 0) {
                    pdf.setFillColor(245, 245, 245);
                    pdf.rect(margemEsquerda, posicaoY - 5, 170, 8, 'F');
                }

                const item = itens[i] || { servico: "Serviço não especificado" };
                const servico = textoSeguro(item.servico);

                pdf.text(`${i + 1}. ${servico}`, margemEsquerda + 5, posicaoY);
                posicaoY += 8;
            }
        }

        posicaoY += 5; // Reduzido para economizar espaço

        // Valor total com menos espaço vertical
        pdf.setFillColor(80, 40, 120);
        pdf.rect(margemEsquerda, posicaoY, 170, 12, 'F'); // Reduzido para 12
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("VALOR TOTAL:", margemEsquerda + 10, posicaoY + 8);

        // Verificar se totalFormatado existe
        const totalFormatado = textoSeguro(dadosConcorrente.totalFormatado || "R$ 0,00");
        pdf.text(totalFormatado, 180, posicaoY + 8, { align: "right" });
        posicaoY += 18; // Reduzido para economizar espaço

        // Valor por extenso - com fonte menor
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);

        // Verificar se totalPorExtenso existe
        const totalPorExtenso = textoSeguro(dadosConcorrente.totalPorExtenso || "zero reais");
        pdf.text(`Valor por extenso: ${totalPorExtenso}`, margemEsquerda, posicaoY);
        posicaoY += 12; // Reduzido para economizar espaço

        // Condições comerciais - com menos espaço vertical
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("CONDIÇÕES COMERCIAIS", margemEsquerda, posicaoY);
        posicaoY += 6; // Reduzido para economizar espaço

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        // Verificar se prazoExecucao existe
        const prazoExecucao = textoSeguro(dadosOrcamento.prazoExecucao || "30");

        const linhasCondicoes = [
            `• Prazo de execução: ${prazoExecucao} dias úteis após aprovação`,
            "• Forma de pagamento: 30% de entrada + 70% na conclusão",
            "• Garantia: 12 meses para os serviços executados",
            "• Validade da proposta: 30 dias"
        ];

        for (const linha of linhasCondicoes) {
            pdf.text(textoSeguro(linha), margemEsquerda + 5, posicaoY);
            posicaoY += 6; // Reduzido para economizar espaço
        }

        posicaoY += 8; // Reduzido para economizar espaço

        // Assinatura - com menor espaçamento
        pdf.line(60, posicaoY, 150, posicaoY);
        posicaoY += 6; // Reduzido para economizar espaço
        pdf.setFont("helvetica", "bold");
        pdf.text("Virtual Guitar Shop", 105, posicaoY, { align: "center" });
        posicaoY += 6; // Reduzido para economizar espaço
        pdf.setFont("helvetica", "normal");
        pdf.text("Atendimento especializado em sonorização", 105, posicaoY, { align: "center" });

        // Rodapé - posições fixas para evitar sobreposição
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text("Virtual Guitar Shop | CNPJ: 12.345.678/0001-90", 105, 280, { align: "center" });
        pdf.text("Av. Nossa Senhora da Penha, 1495 - Santa Lúcia, Vitória/ES", 105, 285, { align: "center" });
        pdf.text("Tel: (27) 3225-9876 | contato@virtualguitarshop.com.br", 105, 290, { align: "center" });
    } catch (error) {
        console.error("Erro ao gerar PDF da Virtual Guitar Shop:", error);
        // Fallback simples em caso de erro
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("Virtual Guitar Shop", 105, 20, { align: "center" });
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
window.gerarPDFVirtualGuitar = gerarPDFVirtualGuitar; 