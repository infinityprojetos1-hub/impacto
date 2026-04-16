// Utilitários
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function valorPorExtenso(valor) {
    if (isNaN(valor)) return "";

    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const dezenasEspeciais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    // Arredonda para 2 casas decimais e separa parte inteira e decimal
    const valorFormatado = valor.toFixed(2);
    const partes = valorFormatado.split('.');
    const parteInteira = parseInt(partes[0]);
    const parteDecimal = parseInt(partes[1]);

    // Converte milhar
    function converterGrupo(numero) {
        if (numero === 0) return "";

        const centena = Math.floor(numero / 100);
        const dezena = Math.floor((numero % 100) / 10);
        const unidade = numero % 10;

        let resultado = "";

        // Centena
        if (centena > 0) {
            if (centena === 1 && dezena === 0 && unidade === 0) {
                resultado += "cem";
            } else {
                resultado += centenas[centena];
            }
        }

        // Dezena e unidade
        if (dezena > 0 || unidade > 0) {
            if (centena > 0) resultado += " e ";

            if (dezena === 1) {
                resultado += dezenasEspeciais[unidade];
            } else {
                if (dezena > 0) {
                    resultado += dezenas[dezena];
                    if (unidade > 0) resultado += " e ";
                }
                if (unidade > 0 || (dezena === 0 && centena === 0)) {
                    resultado += unidades[unidade];
                }
            }
        }

        return resultado;
    }

    // Processa parte inteira
    let resultado = "";

    if (parteInteira === 0) {
        resultado = "zero";
    } else {
        const milhoes = Math.floor(parteInteira / 1000000);
        const milhares = Math.floor((parteInteira % 1000000) / 1000);
        const resto = parteInteira % 1000;

        // Milhões
        if (milhoes > 0) {
            resultado += converterGrupo(milhoes);
            resultado += milhoes === 1 ? " milhão" : " milhões";
            if (milhares > 0 || resto > 0) resultado += ", ";
        }

        // Milhares
        if (milhares > 0) {
            resultado += converterGrupo(milhares);
            resultado += " mil";
            if (resto > 0) resultado += ", ";
        }

        // Resto
        if (resto > 0) {
            resultado += converterGrupo(resto);
        }
    }

    resultado += " reais";

    // Processa parte decimal
    if (parteDecimal > 0) {
        resultado += " e " + converterGrupo(parteDecimal);
        resultado += parteDecimal === 1 ? " centavo" : " centavos";
    }

    return resultado;
}

function gerarNumeroAleatorio(min, max, decimais = 2) {
    // Converte os valores para números para garantir que são números válidos
    min = Number(min);
    max = Number(max);

    // Verifica se os valores são válidos
    if (isNaN(min) || isNaN(max) || min >= max) {
        console.error('Valores inválidos para gerarNumeroAleatorio:', { min, max });
        // Valores padrão em caso de erro
        min = 150;
        max = 500;
    }

    // Gera um número verdadeiramente aleatório entre min e max
    // Reduz um pouco o valor máximo para garantir espaço para adicionar centavos
    max = max - 0.01;
    const valorInteiro = min + (Math.random() * (max - min));

    // Gera centavos aleatórios que não sejam zero (1-99)
    const centavos = Math.floor(Math.random() * 99) + 1;

    // Combina o valor inteiro com os centavos
    const valorFinal = Math.floor(valorInteiro) + (centavos / 100);

    // Verifica se o valor está dentro dos limites
    if (valorFinal > max) {
        // Se ultrapassar o máximo, ajusta para o máximo menos um centavo aleatório
        const centavosAjuste = Math.floor(Math.random() * 99) + 1;
        return Number((max - (centavosAjuste / 100)).toFixed(decimais));
    }

    return Number(valorFinal.toFixed(decimais));
}

function embaralharArray(array) {
    const novoArray = [...array];
    for (let i = novoArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [novoArray[i], novoArray[j]] = [novoArray[j], novoArray[i]];
    }
    return novoArray;
}

function selecionarItensAleatorios(array, minItems, maxItems) {
    const quantidade = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
    const arrayEmbaralhado = embaralharArray(array);
    return arrayEmbaralhado.slice(0, quantidade);
}

function formatarData(data) {
    if (!data) return "";

    // Corrige problema do fuso horário tratando a data como UTC para evitar desconto de um dia
    // Extrai os componentes da data de forma manual para evitar conversões de timezone
    const partes = data.split('-'); // Formato esperado: YYYY-MM-DD

    if (partes.length === 3) {
        // Se a data estiver no formato YYYY-MM-DD
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]);
        const dia = parseInt(partes[2]);

        // Formata com zero à esquerda se necessário
        const diaFormatado = String(dia).padStart(2, '0');
        const mesFormatado = String(mes).padStart(2, '0');

        return `${diaFormatado}/${mesFormatado}/${ano}`;
    } else {
        // Fallback para o método anterior, mas usando timezone UTC para evitar problemas
        const dataObj = new Date(data);
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        const ano = dataObj.getUTCFullYear();

        return `${dia}/${mes}/${ano}`;
    }
}

// Funções para persistência das logos
function salvarLogosNoLocalStorage(logos) {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('logosAppIgreja', JSON.stringify(logos));
            console.log('Logos salvas no localStorage com sucesso!');
            return true;
        } catch (e) {
            console.error('Erro ao salvar logos no localStorage:', e);
            return false;
        }
    }
    return false;
}

function carregarLogosDoLocalStorage() {
    if (typeof localStorage !== 'undefined') {
        try {
            const logosString = localStorage.getItem('logosAppIgreja');
            if (logosString) {
                return JSON.parse(logosString);
            }
        } catch (e) {
            console.error('Erro ao carregar logos do localStorage:', e);
        }
    }
    return null;
}

// Não precisamos mais exportar as funções pois elas estarão no escopo global
// quando o arquivo for carregado diretamente 