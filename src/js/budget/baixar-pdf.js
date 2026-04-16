// Função otimizada para baixar todos os PDFs com um delay entre downloads
async function baixarTodosPDFs(pdfsGerados) {
    // Mostra feedback visual para o usuário
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'pdf-download-feedback';
    feedbackElement.style.position = 'fixed';
    feedbackElement.style.top = '50%';
    feedbackElement.style.left = '50%';
    feedbackElement.style.transform = 'translate(-50%, -50%)';
    feedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    feedbackElement.style.color = 'white';
    feedbackElement.style.padding = '20px';
    feedbackElement.style.borderRadius = '10px';
    feedbackElement.style.zIndex = '9999';
    feedbackElement.innerHTML = 'Iniciando os downloads...';
    document.body.appendChild(feedbackElement);

    // Conta quantos PDFs serão baixados para feedback
    const totalIgrejas = Object.keys(pdfsGerados).length;
    const totalPDFs = totalIgrejas * 2; // Agora são 2 PDFs por igreja (empresa principal e um concorrente)
    let pdfsBaixados = 0;

    // Função auxiliar para atualizar o feedback
    const atualizarFeedback = (mensagem) => {
        pdfsBaixados++;
        const porcentagem = Math.round((pdfsBaixados / totalPDFs) * 100);
        feedbackElement.innerHTML = `${mensagem}<br>Progresso: ${porcentagem}% (${pdfsBaixados}/${totalPDFs})`;
    };

    try {
        // Processamento em lotes, com um delay entre downloads
        for (const key in pdfsGerados) {
            if (pdfsGerados.hasOwnProperty(key)) {
                const index = key.split('_')[1];
                const dadosIgreja = pdfsGerados[key];
                const nomeIgreja = dadosIgreja.igreja.nome;
                const codigoIgreja = dadosIgreja.igreja.codigo;

                // Formata o nome da igreja para uso no nome do arquivo
                const nomeFormatado = nomeIgreja.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

                // Download do PDF da sua empresa
                try {
                    const empresaNome = dadosIgreja.orcamento.suaEmpresa.nome.replace(/[^a-zA-Z0-9]/g, '_');
                    await baixarPDF(dadosIgreja.pdfSuaEmpresa, `${codigoIgreja}_${nomeFormatado}_${empresaNome}`);
                    atualizarFeedback(`Baixado: ${nomeIgreja} - ${dadosIgreja.orcamento.suaEmpresa.nome}`);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay entre downloads
                } catch (e) {
                    console.error(`Erro ao baixar PDF principal para ${nomeIgreja}:`, e);
                }

                // Download do PDF do concorrente
                try {
                    const concorrenteNome = dadosIgreja.empresaConcorrente.replace(/[^a-zA-Z0-9]/g, '_');
                    await baixarPDF(dadosIgreja.pdfConcorrente, `${codigoIgreja}_${nomeFormatado}_${concorrenteNome}`);
                    atualizarFeedback(`Baixado: ${nomeIgreja} - ${dadosIgreja.empresaConcorrente}`);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay entre downloads
                } catch (e) {
                    console.error(`Erro ao baixar PDF concorrente para ${nomeIgreja}:`, e);
                }
            }
        }

        // Feedback final de sucesso
        feedbackElement.innerHTML = `Downloads concluídos!<br>${totalPDFs} PDFs baixados com sucesso.`;
        feedbackElement.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';

        // Remove o feedback após 3 segundos
        setTimeout(() => {
            document.body.removeChild(feedbackElement);
        }, 3000);
    } catch (error) {
        console.error("Erro durante o download dos PDFs:", error);

        // Feedback de erro
        feedbackElement.innerHTML = `Erro nos downloads: ${error.message}`;
        feedbackElement.style.backgroundColor = 'rgba(220, 0, 0, 0.8)';

        // Remove o feedback após 5 segundos
        setTimeout(() => {
            document.body.removeChild(feedbackElement);
        }, 5000);
    }
}

// Função auxiliar para baixar um PDF específico
async function baixarPDF(pdf, nomeArquivo) {
    return new Promise((resolve, reject) => {
        try {
            // Garante que o nome do arquivo é válido e não muito longo
            const nomeArquivoSeguro = nomeArquivo.substring(0, 50);

            // Gera o arquivo PDF
            const blob = pdf.output('blob');

            // Cria um link de download invisível
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${nomeArquivoSeguro}.pdf`;
            link.style.display = 'none';

            // Adiciona o link ao documento, clica nele e depois remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Libera o objeto URL
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
                resolve();
            }, 100);
        } catch (error) {
            reject(error);
        }
    });
}

// Disponibiliza as funções globalmente
window.baixarTodosPDFs = baixarTodosPDFs;
window.baixarPDF = baixarPDF; 