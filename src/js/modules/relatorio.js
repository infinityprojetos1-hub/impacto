// Texto padrão para igreja nova
const TEXTO_IGREJA_NOVA = `Relatório Técnico Detalhado
1. Caixas de Som
Foram instaladas novas caixas de som em pontos estratégicos, visando uma distribuição sonora uniforme em todo o ambiente. Os suportes foram fixados com segurança e os cabos de áudio foram devidamente canalizados e organizados. Conexões foram testadas e protegidas contra interferências. O sistema foi calibrado para evitar distorções e garantir clareza sonora.

2. Amplificadores
Novos amplificadores foram integrados ao sistema, com ligação direta à mesa de som. A instalação seguiu as especificações técnicas dos equipamentos, com atenção especial à ventilação e dissipação de calor. Foram realizados testes de potência e resposta de frequência, assegurando o desempenho ideal para o espaço.

3. Mesa de Som
A mesa de som foi instalada em local de fácil acesso e visibilidade. Todos os canais foram configurados e equalizados conforme os equipamentos conectados. Entradas e saídas foram devidamente organizadas e identificadas. O sistema foi testado em conjunto com os demais dispositivos para garantir total compatibilidade e operação fluida.

4. Microfones sem Fio
Foram instalados microfones sem fio com receptores fixos ligados à mesa. A disposição dos equipamentos levou em consideração o alcance e a mobilidade dos usuários. Foram feitos testes de frequência e captação, com ajustes finos para evitar interferência e perda de sinal.

5. Microfone Gooseneck (de púlpito)
O microfone gooseneck foi instalado no púlpito com base fixa e conexão direta à mesa. Foram realizados testes de posicionamento e captação para assegurar clareza e presença vocal. A instalação buscou máxima discrição visual sem comprometer a performance.

6. Caixa de Retorno
Caixas de retorno foram posicionadas na área dos músicos e vocalistas, com foco na inteligibilidade e equilíbrio de volume. Foram conectadas diretamente à mesa via canais auxiliares. Equalizações específicas foram aplicadas conforme as necessidades de palco.

Conclusão
Foi realizada a instalação completa de um novo sistema de som na igreja, contemplando caixas acústicas, amplificadores, mesa de som, microfones com e sem fio e caixas de retorno. Todo o cabeamento foi feito com materiais de qualidade, seguindo padrões técnicos e de segurança. O sistema foi testado, ajustado e entregue em pleno funcionamento, oferecendo qualidade sonora e confiabilidade para os eventos da igreja.`;

// Função para atualizar o texto do relatório com base no tipo selecionado
function atualizarTextoRelatorio() {
    const tipoRelatorio = document.getElementById('tipoRelatorio').value;
    const textoRelatorio = document.getElementById('textoRelatorio');

    if (tipoRelatorio === 'igreja_nova') {
        textoRelatorio.value = TEXTO_IGREJA_NOVA;
    } else {
        // Mantém o texto atual para manutenção
        if (!textoRelatorio.value) {
            textoRelatorio.value = 'Descreva aqui o relatório de manutenção...';
        }
    }
}

// Adiciona o evento de mudança ao select
document.addEventListener('DOMContentLoaded', function () {
    const tipoRelatorio = document.getElementById('tipoRelatorio');
    if (tipoRelatorio) {
        tipoRelatorio.addEventListener('change', atualizarTextoRelatorio);
        // Inicializa o texto do relatório
        atualizarTextoRelatorio();
    }
}); 