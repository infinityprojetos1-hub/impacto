// Configurações e variáveis globais

// Valores min/max por tipo de igreja (editáveis nas configurações)
const VALORES_IGREJA_DEFAULT = {
    padrao: { min: 3200, max: 4000 },
    som_para_tras: { min: 4500, max: 5500 },
    longe_2: { min: 4500, max: 5000 },
    longe_3: { min: 4000, max: 4500 },
    longe_bruno: { min: 3850, max: 3900 }
};
const CONFIG_VALORES_KEY = 'configValoresIgreja';

function obterValoresIgreja() {
    try {
        const salvo = localStorage.getItem(CONFIG_VALORES_KEY);
        if (salvo) {
            const parsed = JSON.parse(salvo);
            return { ...VALORES_IGREJA_DEFAULT, ...parsed };
        }
    } catch (e) { console.warn('Erro ao carregar valores:', e); }
    return { ...VALORES_IGREJA_DEFAULT };
}

function salvarValoresIgreja(valores) {
    try {
        const tsAgora = Date.now();
        const dadosComTs = { ...valores, _ts: tsAgora };
        localStorage.setItem(CONFIG_VALORES_KEY, JSON.stringify(dadosComTs));
        if (typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            salvarNoDatabase('dados/valoresIgreja', dadosComTs).then(() => {
                if (typeof window._fbMarcarEnviado === 'function') {
                    window._fbMarcarEnviado('configValoresIgreja', tsAgora);
                }
            });
        }
        return true;
    } catch (e) {
        console.error('Erro ao salvar valores:', e);
        return false;
    }
}

function carregarConfigValores() {
    const v = obterValoresIgreja();
    ['padrao', 'som_para_tras', 'longe_2', 'longe_3', 'longe_bruno'].forEach(tipo => {
        const elMin = document.getElementById('valMin_' + tipo);
        const elMax = document.getElementById('valMax_' + tipo);
        if (elMin) elMin.value = v[tipo] ? v[tipo].min : '';
        if (elMax) elMax.value = v[tipo] ? v[tipo].max : '';
    });
}

function salvarConfigValores() {
    const v = {};
    ['padrao', 'som_para_tras', 'longe_2', 'longe_3', 'longe_bruno'].forEach(tipo => {
        const elMin = document.getElementById('valMin_' + tipo);
        const elMax = document.getElementById('valMax_' + tipo);
        const min = parseFloat(elMin && elMin.value) || 0;
        const max = parseFloat(elMax && elMax.value) || 0;
        if (min > max) {
            const nomes = { padrao: 'Padrão', som_para_tras: 'Som para trás', longe_2: 'Longe (Até 2 igrejas)', longe_3: 'Longe (Acima de 3 igrejas)', longe_bruno: 'Longe (Bruno)' };
            alert(`Em "${nomes[tipo] || tipo}": o valor mínimo não pode ser maior que o máximo.`);
            return;
        }
        v[tipo] = { min, max };
    });
    if (salvarValoresIgreja(v)) {
        alert('Valores salvos com sucesso!');
    } else {
        alert('Erro ao salvar. Tente novamente.');
    }
}

window.obterValoresIgreja = obterValoresIgreja;
window.carregarConfigValores = carregarConfigValores;
window.salvarConfigValores = salvarConfigValores;

const configuracao = {
    servicos: [
        "Confecção de cabeamento de microfone",
        "Confecção de cabeamento de periféricos de som",
        "Confecção de Cabos para instrumentos e Mics",
        "Instalação de cabeamento de caixas de som",
        "Manutenção de cabos de som",
        "Manutenção do periférico",
        "Manutenção e intstalação do Sistema do Projeção",
        "Reposicionamento das caixas de PA",
        "Reposicionamento das caixas de retorno",
        "Reposicionamento dos microfones sem fio"
    ],
    valorMinimo: 3200,
    valorMaximo: 4000,
    margemConcorrente1: 10,
    margemConcorrente2: 15,
    suaEmpresa1: "Impacto Soluções",
    suaEmpresa2: "SPG da Silva Sonorização e Iluminação",
    concorrente1: "Virtual Guitar Shop",
    concorrente2: "GG PROAUTO LTDA"
};

let orcamentosGerados = [];
let pdfsGerados = {};
let igrejasAdicionadas = [];

// Não precisamos mais exportar as configurações pois elas estarão no escopo global
// quando o arquivo for carregado diretamente

// Disponibiliza as configurações globalmente (opcional, já que já estarão no escopo global)
window.configuracao = configuracao;
window.orcamentosGerados = orcamentosGerados;
window.pdfsGerados = pdfsGerados;
window.igrejasAdicionadas = igrejasAdicionadas; 