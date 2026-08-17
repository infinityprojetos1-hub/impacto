// Função para gerar dados do orçamento
function gerarDadosOrcamento(igreja, dataOrcamento, prazoExecucao, config, empresaEscolhida) {
    // Validação e valores padrão para os parâmetros
    if (!igreja || typeof igreja !== 'object') {
        igreja = { nome: "Igreja sem nome", codigo: "000000" };
    }

    if (!igreja.nome) igreja.nome = "Igreja sem nome";
    if (!igreja.codigo) igreja.codigo = "000000";

    if (!dataOrcamento) {
        // Data padrão caso não seja fornecida: hoje + 5 dias
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 5);
        dataOrcamento = hoje.toISOString().split('T')[0]; // formato YYYY-MM-DD
    }

    if (!prazoExecucao || isNaN(parseInt(prazoExecucao))) {
        prazoExecucao = "30";
    } else {
        prazoExecucao = prazoExecucao.toString();
    }

    if (!empresaEscolhida || typeof empresaEscolhida !== 'string') {
        empresaEscolhida = "Impacto Soluções";
    }

    if (!config || !config.servicos || !Array.isArray(config.servicos) || config.servicos.length === 0) {
        config = {
            servicos: [
                "Manutenção de sistema de som",
                "Instalação de cabeamento de áudio",
                "Reparo de equipamentos",
                "Ajustes de sonorização",
                "Afinação do sistema de som"
            ],
            valorMinimo: 3000,
            valorMaximo: 5000
        };
    }

    // Valores conforme o tipo de igreja (configuráveis nas Configurações)
    const valoresConfig = typeof obterValoresIgreja === 'function' ? obterValoresIgreja() : {};
    const tipo = igreja.tipoIgreja || 'padrao';
    const intervalo = valoresConfig[tipo] || { min: 3200, max: 4000 };
    let valorMinimoBase = intervalo.min;
    let valorMaximoBase = intervalo.max;

    // Cria um valor específico para cada igreja usando uma seed mais variada
    const semente = (igreja.nome.length * igreja.codigo.length) +
        (igreja.nome.charCodeAt(0) || 0) +
        (igreja.codigo.charCodeAt(0) || 0) +
        Date.now() % 10000;

    const aleatorio = new Math.seedrandom(semente.toString());

    // Define um intervalo efetivo com maior variação para evitar valores semelhantes.
    // A margem é limitada para não ultrapassar 20% da metade do range configurado,
    // evitando inversão de min/max em faixas estreitas (ex: 3850–3900).
    const rangeConfigurado = valorMaximoBase - valorMinimoBase;
    const margemMaxPermitida = rangeConfigurado > 0 ? Math.min(0.08, (rangeConfigurado * 0.4) / valorMinimoBase) : 0;
    const margem = margemMaxPermitida > 0 ? (0.03 + (aleatorio() * (margemMaxPermitida - 0.03))) : 0;

    // Aplica a margem para evitar valores exatos nos limites
    const valorMinimo = valorMinimoBase + (valorMinimoBase * margem * aleatorio());
    const valorMaximo = valorMaximoBase - (valorMaximoBase * margem * aleatorio());

    // Se a igreja tiver valor manual, usa ele como valor principal
    let valorAlvoComCentavos;
    let valorUsadoComoBase;
    if (igreja.tipoValorOrcamento === 'manual' && igreja.valorManual !== null && !isNaN(igreja.valorManual)) {
        valorAlvoComCentavos = igreja.valorManual;
        valorUsadoComoBase = igreja.valorManual;
    } else {
        // Gera valor normalmente (automático)
        const rangeEfetivo = Math.max(valorMinimo, valorMinimoBase);
        const limiteEfetivo = Math.min(Math.max(valorMaximo, rangeEfetivo), valorMaximoBase);
        const fatorDistribuicao = Math.pow(aleatorio(), 0.7);
        const valorAlvoTotal = rangeEfetivo + (fatorDistribuicao * (limiteEfetivo - rangeEfetivo));
        // Garante que o valor tenha centavos aleatórios
        const centavosAleatorios = Math.floor(aleatorio() * 99) + 1;
        valorAlvoComCentavos = Math.floor(valorAlvoTotal) + (centavosAleatorios / 100);
        // Clamp final: garante que o valor sempre fique dentro do range configurado
        valorAlvoComCentavos = Math.max(valorMinimoBase, Math.min(valorMaximoBase, valorAlvoComCentavos));
        valorUsadoComoBase = valorAlvoComCentavos;
    }

    // Determina quantidade de itens com base no valor alvo
    const percentualValor = (valorAlvoComCentavos - valorMinimo) / (valorMaximo - valorMinimo);
    const minItens = 5;
    const maxItens = 10;
    const rangeItens = maxItens - minItens;

    let quantidadeBase = Math.floor(minItens + (percentualValor * rangeItens));
    const ajuste = Math.floor(aleatorio() * 5) - 2;
    let quantidadeItens = Math.max(minItens, Math.min(maxItens, quantidadeBase + ajuste));

    // Seleciona aleatoriamente os itens baseado na seed da igreja
    function selecionarItensAleatoriosComSeed(array, quantidade, seed) {
        const arrayCopia = [...array];
        const resultado = [];

        for (let i = 0; i < quantidade && arrayCopia.length > 0; i++) {
            const indice = Math.floor(seed() * arrayCopia.length);
            resultado.push(arrayCopia.splice(indice, 1)[0]);
        }

        return resultado;
    }

    // Seleciona itens aleatórios para esta igreja específica
    const itensServico = selecionarItensAleatoriosComSeed(config.servicos, quantidadeItens, aleatorio);

    // ALTERAÇÃO: Agora apenas criamos um array com os serviços sem valores individuais
    const itensDescritivos = itensServico.map(servico => ({
        servico: servico
    }));

    // Formatamos o valor total
    const totalFormatado = formatarMoeda(valorAlvoComCentavos);
    const totalPorExtenso = valorPorExtenso(valorAlvoComCentavos);

    // Dados da sua empresa
    const dadosSuaEmpresa = {
        nome: empresaEscolhida,
        itens: itensDescritivos,
        total: valorAlvoComCentavos,
        totalFormatado: totalFormatado,
        totalPorExtenso: totalPorExtenso
    };

    // ALTERAÇÃO: Seleciona as empresas concorrentes aleatoriamente sem repetição
    // Lista de todas as empresas concorrentes disponíveis
    const empresasConcorrentes = [
        "Virtual Guitar Shop",
        "GG PROAUTO LTDA",
        "STV IMAGEM E SOM",
        "UP SERVIÇOS",
        "SENA AUDIOVISUAL PRODUÇÕES",
        "INSTALASSOM",
        "GLAUBER SISTEMAS CONSTRUTIVOS"
    ];

    // Filtra para remover a empresa escolhida (caso seja uma das concorrentes)
    const empresasDisponíveis = empresasConcorrentes.filter(emp => !empresaEscolhida.includes(emp));

    // Embaralha o array para aleatoriedade
    const empresasEmbaralhadas = embaralharArray(empresasDisponíveis);

    // Seleciona duas empresas concorrentes diferentes
    // Se não houver empresas suficientes, usa nomes genéricos
    const concorrente1Nome = empresasEmbaralhadas.length > 0 ?
        empresasEmbaralhadas[0] : "Concorrente Genérico 1";
    const concorrente2Nome = empresasEmbaralhadas.length > 1 ?
        empresasEmbaralhadas[1] : "Concorrente Genérico 2";

    // Gera valores para os concorrentes (superiores ao valor da sua empresa)
    const valorConcorrente1 = valorUsadoComoBase * (1.05 + (aleatorio() * 0.2)); // 5-25% maior
    const valorConcorrente2 = valorUsadoComoBase * (1.15 + (aleatorio() * 0.3)); // 15-45% maior

    // Dados dos concorrentes
    const dadosConcorrente1 = {
        nome: concorrente1Nome,
        itens: itensDescritivos, // Usa os mesmos itens descritivos
        total: valorConcorrente1,
        totalFormatado: formatarMoeda(valorConcorrente1),
        totalPorExtenso: valorPorExtenso(valorConcorrente1)
    };

    const dadosConcorrente2 = {
        nome: concorrente2Nome,
        itens: itensDescritivos, // Usa os mesmos itens descritivos
        total: valorConcorrente2,
        totalFormatado: formatarMoeda(valorConcorrente2),
        totalPorExtenso: valorPorExtenso(valorConcorrente2)
    };

    // Retorna todos os dados necessários para gerar os PDFs
    return {
        igreja: igreja,
        dataOrcamento: dataOrcamento,
        prazoExecucao: prazoExecucao,
        suaEmpresa: dadosSuaEmpresa,
        concorrente1: dadosConcorrente1,
        concorrente2: dadosConcorrente2
    };
}

window.gerarDadosOrcamento = gerarDadosOrcamento; 