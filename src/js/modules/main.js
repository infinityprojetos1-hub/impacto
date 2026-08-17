// Arquivo principal que integra todas as funcionalidades

// ==========================================
// SISTEMA DE PASTA DE TRABALHO
// ==========================================
window.pastaTrabalhoHandle = null;

// Função para escolher pasta de trabalho
async function escolherPastaTrabalho() {
    try {
        if (!('showDirectoryPicker' in window)) {
            alert('Seu navegador não suporta a seleção de pastas. Use Chrome, Edge ou Opera GX.');
            return;
        }

        const handle = await window.showDirectoryPicker({
            mode: 'readwrite'
        });

        window.pastaTrabalhoHandle = handle;

        // Salva o handle no IndexedDB para persistir
        await salvarHandlePastaTrabalho(handle);

        // Atualiza o status na interface
        atualizarStatusPastaTrabalho(handle.name);

        console.log('✅ Pasta de trabalho selecionada:', handle.name);

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Erro ao selecionar pasta:', error);
            alert('Erro ao selecionar pasta: ' + error.message);
        }
    }
}

// Função para criar estrutura de pastas para uma igreja
async function criarPastasIgreja(nomeIgreja) {
    if (!window.pastaTrabalhoHandle) {
        console.log('⚠️ Nenhuma pasta de trabalho selecionada');
        return null;
    }

    try {
        // Verifica permissão
        const permissao = await window.pastaTrabalhoHandle.requestPermission({ mode: 'readwrite' });
        if (permissao !== 'granted') {
            console.error('❌ Permissão negada para a pasta de trabalho');
            return null;
        }

        // Sanitiza o nome da igreja (remove caracteres inválidos)
        const nomePastaSanitizado = nomeIgreja
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();

        // Cria pasta da igreja
        const pastaIgreja = await window.pastaTrabalhoHandle.getDirectoryHandle(nomePastaSanitizado, { create: true });

        // Cria subpastas
        const pastaFotos = await pastaIgreja.getDirectoryHandle('FOTOS', { create: true });
        const pastaImprimir = await pastaIgreja.getDirectoryHandle('IMPRIMIR', { create: true });
        const pastaOrcamento = await pastaIgreja.getDirectoryHandle('ORÇAMENTO', { create: true });

        console.log(`✅ Estrutura de pastas criada para: ${nomePastaSanitizado}`);

        return {
            igreja: pastaIgreja,
            fotos: pastaFotos,
            imprimir: pastaImprimir,
            orcamento: pastaOrcamento
        };
    } catch (error) {
        console.error('❌ Erro ao criar pastas:', error);
        return null;
    }
}

// Função para verificar se arquivo existe na pasta
async function arquivoExiste(pastaHandle, nomeArquivo) {
    try {
        await pastaHandle.getFileHandle(nomeArquivo, { create: false });
        return true;
    } catch {
        return false;
    }
}

// Função para gerar nome único (adiciona número sequencial se arquivo já existe)
async function gerarNomeUnico(pastaHandle, nomeArquivo) {
    // Separa nome e extensão
    const ultimoPonto = nomeArquivo.lastIndexOf('.');
    const nome = ultimoPonto > 0 ? nomeArquivo.substring(0, ultimoPonto) : nomeArquivo;
    const extensao = ultimoPonto > 0 ? nomeArquivo.substring(ultimoPonto) : '';

    // Se o arquivo não existe, retorna o nome original
    if (!(await arquivoExiste(pastaHandle, nomeArquivo))) {
        return nomeArquivo;
    }

    // Procura um número sequencial disponível
    let contador = 2;
    let novoNome = `${nome} (${contador})${extensao}`;

    while (await arquivoExiste(pastaHandle, novoNome)) {
        contador++;
        novoNome = `${nome} (${contador})${extensao}`;

        // Limite de segurança para evitar loop infinito
        if (contador > 100) {
            // Usa timestamp como fallback
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            novoNome = `${nome}_${timestamp}${extensao}`;
            break;
        }
    }

    console.log(`📁 Arquivo já existe, salvando como: ${novoNome}`);
    return novoNome;
}

// Função para salvar PDF em uma pasta específica (sem sobrescrever arquivos existentes)
async function salvarPDFEmPasta(pastaHandle, nomeArquivo, pdfBlob) {
    try {
        // Gera nome único se arquivo já existir
        const nomeUnico = await gerarNomeUnico(pastaHandle, nomeArquivo);

        const arquivoHandle = await pastaHandle.getFileHandle(nomeUnico, { create: true });
        const writable = await arquivoHandle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        console.log(`✅ PDF salvo: ${nomeUnico}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao salvar PDF ${nomeArquivo}:`, error);
        return false;
    }
}

/** Substitui arquivo com o mesmo nome (remove o existente e grava de novo). Usado após regenerar concorrente. */
async function salvarPDFEmPastaSubstituir(pastaHandle, nomeArquivo, pdfBlob) {
    try {
        try {
            await pastaHandle.removeEntry(nomeArquivo);
        } catch (_) {
            // Arquivo não existia — segue para criar
        }
        const arquivoHandle = await pastaHandle.getFileHandle(nomeArquivo, { create: true });
        const writable = await arquivoHandle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        console.log(`✅ PDF salvo (substituiu): ${nomeArquivo}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao substituir PDF ${nomeArquivo}:`, error);
        return false;
    }
}

// Funções para persistir o handle da pasta no IndexedDB
async function abrirBDPastaTrabalho() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PastaTrabalhooDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };
    });
}

async function salvarHandlePastaTrabalho(handle) {
    try {
        const db = await abrirBDPastaTrabalho();
        const transaction = db.transaction(['handles'], 'readwrite');
        const store = transaction.objectStore('handles');
        await store.put(handle, 'pastaTrabalho');
        console.log('✅ Handle da pasta salvo no IndexedDB');
    } catch (error) {
        console.error('Erro ao salvar handle da pasta:', error);
    }
}

async function obterHandlePastaTrabalho() {
    try {
        const db = await abrirBDPastaTrabalho();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['handles'], 'readonly');
            const store = transaction.objectStore('handles');
            const request = store.get('pastaTrabalho');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Erro ao obter handle da pasta:', error);
        return null;
    }
}

async function inicializarPastaTrabalho() {
    try {
        const handle = await obterHandlePastaTrabalho();
        if (handle) {
            window.pastaTrabalhoHandle = handle;
            atualizarStatusPastaTrabalho(handle.name);
            console.log('✅ Pasta de trabalho restaurada:', handle.name);
        }
    } catch (error) {
        console.warn('Sem pasta de trabalho salva:', error);
    }
}

function atualizarStatusPastaTrabalho(nomePasta) {
    const statusElement = document.getElementById('pastaTrabalhoStatus');
    if (statusElement) {
        statusElement.innerHTML = `<span style="color: #4ADC77;">✅ ${nomePasta}</span>`;
    }
}

// Expõe funções globalmente
window.escolherPastaTrabalho = escolherPastaTrabalho;
window.criarPastasIgreja = criarPastasIgreja;
window.salvarPDFEmPasta = salvarPDFEmPasta;
window.salvarPDFEmPastaSubstituir = salvarPDFEmPastaSubstituir;

// ==========================================
// FIM DO SISTEMA DE PASTA DE TRABALHO
// ==========================================

// Objeto global para armazenar as logos em base64
const logosBase64 = {
    impactoSolucoes: null,
    impactoSolucoesCarimbo: null,
    spgDaSilva: null,
    virtualGuitar: null,
    glauber: null,
    ggProauto: null,
    stv: null,
    upServicos: null,
    sena: null,
    instalassom: null,
    megaLogo: null,
    megaCarimbo: null,
    tellaLogo: null,
    tellaCarimbo: null
};

// Textos padrão para cada tipo de relatório
const TEXTOS_RELATORIO = {
    manutencao: `Relatório Técnico Detalhado

1. Caixas de Som
Foi realizada a verificação da integridade física. Testes de funcionamento confirmaram alguns ruídos, que foram eliminados após ajustes. Cabos e conexões foram revisados e substituídos onde necessário. O posicionamento das caixas foi otimizado para melhor distribuição sonora.

2. Amplificadores
Foi realizado teste de ligação e ajuste para melhor resposta de som. Inspeção dos cabos resultou na substituição de algumas conexões defeituosas. Configurações foram ajustadas para melhor desempenho.

3. Mesa de Som
Canais e equalizadores foram testados e corrigidos conforme necessidade. Saídas e entradas foram revisadas e alguns ruídos foram eliminados. Potenciômetros e sliders passaram por limpeza e lubrificação. Integração com os demais equipamentos foi otimizada.

4. Microfone sem Fio
Testes de captação e transmissão foram realizados com êxito. Limpeza e higienização foram efetuadas. Alcance foi testado e ampliado para maior mobilidade.

5. Microfone Gooseneck
Captação foi testada e melhorada através de ajustes finos. Conexões e cabos passaram por revisão e algumas substituições foram feitas. Flexibilidade e posicionamento foram ajustados para melhor usabilidade. Integração com a mesa de som foi otimizada.

6. Caixa de Retorno
Testes de funcionamento foram realizados e a qualidade do som foi aprimorada. Conexões e cabos foram revisados e substituídos onde necessário. Posicionamento foi ajustado para melhor aproveitamento do som pelos músicos. Limpeza externa e interna foi realizada. Equalização foi ajustada conforme as necessidades dos usuários.

Conclusão
A igreja apresentava algumas falhas no sistema de som, que foram devidamente identificadas e corrigidas. Foram tomadas as providências necessárias para garantir seu funcionamento adequado, incluindo substituição de cabos, ajustes de configuração, limpeza e melhorias na distribuição sonora. O sistema agora encontra-se em condições ideais para o uso.`,

    igreja_nova: `Relatório Técnico Detalhado

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
Foi realizada a instalação completa de um novo sistema de som na igreja, contemplando caixas acústicas, amplificadores, mesa de som, microfones com e sem fio e caixas de retorno. Todo o cabeamento foi feito com materiais de qualidade, seguindo padrões técnicos e de segurança. O sistema foi testado, ajustado e entregue em pleno funcionamento, oferecendo qualidade sonora e confiabilidade para os eventos da igreja.`
};

// Função para carregar imagens como base64
function carregarImagemComoBase64(imagem, callback) {
    const img = new Image();
    // Em file:// o crossOrigin bloqueia o carregamento; só usa em http(s)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        img.crossOrigin = 'Anonymous';
    }

    img.onload = function () {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            callback(dataURL);
        } catch (e) {
            // Em file:// o canvas pode ficar "tainted" e toDataURL falha
            console.warn('Erro ao converter imagem:', imagem, e);
            callback(null);
        }
    };

    img.onerror = function () {
        console.error('Erro ao carregar imagem:', imagem);
        callback(null);
    };

    // Inicia o carregamento da imagem
    img.src = imagem;
}

// Função para inicializar o sistema de uploads das logos
function inicializarUploadLogos() {
    function handleImageUpload(inputId, imageId, logoKey, statusId) {
        const input = document.getElementById(inputId);
        const image = document.getElementById(imageId);
        const statusEl = document.getElementById(statusId);

        input.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                // Atualiza o status para "Carregando..."
                if (statusEl) statusEl.textContent = "Status: Carregando...";

                const reader = new FileReader();
                reader.onload = function (e) {
                    const imageData = e.target.result;
                    image.src = imageData;
                    image.style.display = 'block';

                    // Armazena a imagem em base64 na configuração
                    logosBase64[logoKey] = imageData;
                    console.log(`Logo ${logoKey} carregada com sucesso!`);

                    // Atualiza o status para "Carregada com sucesso"
                    if (statusEl) statusEl.textContent = "Status: Carregada com sucesso!";

                    // Salva as logos atualizadas no localStorage
                    salvarLogosNoLocalStorage(logosBase64);
                };
                reader.onerror = function () {
                    console.error("Erro ao ler o arquivo");
                    if (statusEl) statusEl.textContent = "Status: Erro ao carregar a imagem";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Inicializa os uploads de cada logo
    handleImageUpload('inputLogoImpacto', 'logoImpacto', 'impactoSolucoes', 'statusLogoImpacto');
    handleImageUpload('inputCarimboImpacto', 'carimboImpacto', 'impactoSolucoesCarimbo', 'statusCarimboImpacto');
    handleImageUpload('inputLogoSPG', 'logoSPG', 'spgDaSilva', 'statusLogoSPG');
    handleImageUpload('inputLogoVirtualGuitar', 'logoVirtualGuitar', 'virtualGuitar', 'statusLogoVirtualGuitar');

    // Novas logos
    handleImageUpload('inputLogoGGProauto', 'logoGGProauto', 'ggProauto', 'statusLogoGGProauto');
    handleImageUpload('inputLogoSTV', 'logoSTV', 'stv', 'statusLogoSTV');
    handleImageUpload('inputLogoUPServicos', 'logoUPServicos', 'upServicos', 'statusLogoUPServicos');
    handleImageUpload('inputLogoSena', 'logoSena', 'sena', 'statusLogoSena');
    handleImageUpload('inputLogoInstalassom', 'logoInstalassom', 'instalassom', 'statusLogoInstalassom');
    handleImageUpload('inputLogoGlauber', 'logoGlauber', 'glauber', 'statusLogoGlauber');

    // Concorrentes Especiais
    handleImageUpload('inputLogoMegaEventos', 'logoMegaEventos', 'megaLogo', 'statusLogoMegaEventos');
    handleImageUpload('inputCarimboMegaEventos', 'carimboMegaEventos', 'megaCarimbo', 'statusCarimboMegaEventos');
    handleImageUpload('inputLogoTellaVideo', 'logoTellaVideo', 'tellaLogo', 'statusLogoTellaVideo');
    handleImageUpload('inputCarimboTellaVideo', 'carimboTellaVideo', 'tellaCarimbo', 'statusCarimboTellaVideo');
}

// Função para exibir as logos carregadas na interface
function exibirLogosCarregadas() {
    LOGOS_MAPA.forEach(entry => {
        if (logosBase64[entry.key]) {
            const img    = document.getElementById(entry.imgId);
            const status = document.getElementById(entry.statusId);
            if (img) { img.src = logosBase64[entry.key]; img.style.display = 'block'; }
            if (status) { status.textContent = 'Status: Carregada com sucesso!'; status.style.color = '#4caf50'; }
        }
    });
}

// Mapeamento: chave de logosBase64 → arquivo na pasta assets/logos/ e IDs no DOM
const LOGOS_MAPA = [
    { key: 'impactoSolucoes', arquivo: 'assets/logos/impacto - logo.jpeg',             imgId: 'logoImpacto',       statusId: 'statusLogoImpacto'       },
    { key: 'impactoSolucoesCarimbo', arquivo: 'assets/logos/impacto - Carimbo.png', imgId: 'carimboImpacto',    statusId: 'statusCarimboImpacto'    },
    { key: 'spgDaSilva',      arquivo: 'assets/logos/spg - logo.jpg',                  imgId: 'logoSPG',           statusId: 'statusLogoSPG'           },
    { key: 'virtualGuitar',   arquivo: 'assets/logos/virtualGuitarShop - logo.jpg',    imgId: 'logoVirtualGuitar', statusId: 'statusLogoVirtualGuitar' },
    { key: 'ggProauto',       arquivo: 'assets/logos/gg proauto - logo.jpg',           imgId: 'logoGGProauto',     statusId: 'statusLogoGGProauto'     },
    { key: 'stv',             arquivo: 'assets/logos/stv - logo.jpg',                  imgId: 'logoSTV',           statusId: 'statusLogoSTV'           },
    { key: 'upServicos',      arquivo: 'assets/logos/up - logo.jpg',                   imgId: 'logoUPServicos',    statusId: 'statusLogoUPServicos'    },
    { key: 'sena',            arquivo: 'assets/logos/sena - logo.jpg',                 imgId: 'logoSena',          statusId: 'statusLogoSena'          },
    { key: 'instalassom',     arquivo: 'assets/logos/instalasom - logo.jpg',           imgId: 'logoInstalassom',   statusId: 'statusLogoInstalassom'   },
    { key: 'glauber',         arquivo: 'assets/logos/glauber - logo.png',              imgId: 'logoGlauber',       statusId: 'statusLogoGlauber'       },
    { key: 'megaLogo',        arquivo: 'assets/logos/Mega Eventos - logo.jpg',         imgId: 'logoMegaEventos',   statusId: 'statusLogoMegaEventos'   },
    { key: 'megaCarimbo',     arquivo: 'assets/logos/Mega Eventos - Carimbo.jpg',      imgId: 'carimboMegaEventos',statusId: 'statusCarimboMegaEventos'},
    { key: 'tellaLogo',       arquivo: 'assets/logos/Tella video - logo.jpg',          imgId: 'logoTellaVideo',    statusId: 'statusLogoTellaVideo'    },
    { key: 'tellaCarimbo',    arquivo: 'assets/logos/Tella video - Carimbo.jpg',       imgId: 'carimboTellaVideo', statusId: 'statusCarimboTellaVideo' },
];

function _aplicarLogoNaUI(entry) {
    const img    = document.getElementById(entry.imgId);
    const status = document.getElementById(entry.statusId);
    if (img && logosBase64[entry.key]) {
        img.src = logosBase64[entry.key];
        img.style.display = 'block';
    }
    if (status) {
        status.textContent = 'Status: Carregada automaticamente ✓';
        status.style.color = '#4caf50';
    }
}

// Função para carregar logos das empresas que já estão no DOM
// 1. Carrega do localStorage primeiro (exibe imediatamente o que já foi salvo)
// 2. Para as que faltam, tenta da pasta assets/logos/ (funciona quando app está em servidor http)
// 3. Em file:// a pasta pode falhar; localStorage garante que logos continuem visíveis
function inicializarLogos() {
    const logosSalvas = carregarLogosDoLocalStorage();
    if (logosSalvas && Object.keys(logosSalvas).length > 0) {
        Object.assign(logosBase64, logosSalvas);
        exibirLogosCarregadas();
    }

    const pendentes = LOGOS_MAPA.filter(entry => !logosBase64[entry.key]);
    pendentes.forEach(entry => {
        const urlArquivo = entry.arquivo.replace(/ /g, '%20');
        carregarImagemComoBase64(urlArquivo, (base64) => {
            if (base64) {
                logosBase64[entry.key] = base64;
                _aplicarLogoNaUI(entry);
                console.log(`✅ Logo carregada da pasta: ${entry.key}`);
                salvarLogosNoLocalStorage(logosBase64);
            } else {
                console.warn(`⚠️ Logo não encontrada na pasta: ${entry.arquivo} (use upload ou servidor local)`);
            }
        });
    });
}

// Carrega da pasta assets/logos/ as imagens que ainda não estão em logosBase64
function _carregarLogosPendentesDaPasta() {
    const pendentes = LOGOS_MAPA.filter(entry => !logosBase64[entry.key]);
    if (pendentes.length === 0) return;

    pendentes.forEach(entry => {
        const urlArquivo = entry.arquivo.replace(/ /g, '%20');
        carregarImagemComoBase64(urlArquivo, (base64) => {
            if (base64) {
                logosBase64[entry.key] = base64;
                _aplicarLogoNaUI(entry);
                console.log(`✅ Logo auto-carregada da pasta: ${entry.key}`);
                salvarLogosNoLocalStorage(logosBase64);
            } else {
                const logosSalvas = carregarLogosDoLocalStorage() || {};
                if (logosSalvas[entry.key]) {
                    logosBase64[entry.key] = logosSalvas[entry.key];
                    _aplicarLogoNaUI(entry);
                } else {
                    console.warn(`⚠️ Logo não encontrada na pasta: ${entry.arquivo}`);
                }
            }
        });
    });
}

// Força recarregar todas as imagens da pasta assets/logos/ (substitui as do localStorage)
function recarregarLogosDaPasta() {
    LOGOS_MAPA.forEach(entry => {
        delete logosBase64[entry.key];
        const img = document.getElementById(entry.imgId);
        const status = document.getElementById(entry.statusId);
        if (img) { img.src = ''; img.style.display = 'none'; }
        if (status) { status.textContent = 'Status: Carregando...'; status.style.color = ''; }
    });
    _carregarLogosPendentesDaPasta();
    setTimeout(() => {
        if (typeof salvarLogosNoLocalStorage === 'function') salvarLogosNoLocalStorage(logosBase64);
        if (typeof alert === 'function') alert('Recarregamento concluído. Verifique o status de cada logo.');
    }, 1500);
}
window.recarregarLogosDaPasta = recarregarLogosDaPasta;

// Função para gerar orçamentos
async function iniciarGeracaoOrcamentos() {
    // Remover listener existente para evitar duplicação
    const gerarBtn = document.getElementById('gerarOrcamentosBtn');

    if (!gerarBtn) {
        console.error("Botão de gerar orçamentos não encontrado!");
        return;
    }

    const novoGerarBtn = gerarBtn.cloneNode(true);
    gerarBtn.parentNode.replaceChild(novoGerarBtn, gerarBtn);

    // Adiciona o event listener ao novo botão
    novoGerarBtn.addEventListener('click', async function () {
        console.log("Botão de gerar orçamentos clicado!");

        if (igrejasAdicionadas.length === 0) {
            alert('Por favor, adicione pelo menos uma igreja à lista.');
            return;
        }

        for (let i = 0; i < igrejasAdicionadas.length; i++) {
            const cfgIgreja = igrejasAdicionadas[i].configConcorrentes;
            if (cfgIgreja && cfgIgreja.modo === 'manual') {
                const qtd = cfgIgreja.qtd || 1;
                if ((cfgIgreja.empresas || []).length < qtd) {
                    alert('A igreja "' + igrejasAdicionadas[i].nome + '" precisa de pelo menos ' + qtd + ' empresa(s) concorrente(s).');
                    return;
                }
            }
        }

        const dataOrcamento = document.getElementById('dataOrcamento').value;
        const prazoExecucao = document.getElementById('prazoExecucao').value;
        // Textos personalizados agora vêm armazenados em cada igreja ao adicionar

        // Muda para a tab de resultados
        const tabResultados = document.querySelector('[data-tab="resultados"]');
        if (tabResultados) {
            tabResultados.click();
        } else {
            console.error("Tab de resultados não encontrada!");
        }

        // Limpa resultados anteriores
        orcamentosGerados.length = 0; // Limpa o array
        for (const key in pdfsGerados) {
            delete pdfsGerados[key];
        }

        const pdfsDisplay = document.getElementById('pdfsDisplay');
        if (pdfsDisplay) {
            pdfsDisplay.innerHTML = '';
        }

        const downloadAllBtn = document.getElementById('downloadAllBtn');
        if (downloadAllBtn) {
            downloadAllBtn.disabled = true;
        }

        // Inicializa barra de progresso
        const progressBar = document.getElementById('progressBar');
        const statusMessage = document.getElementById('statusMessage');

        if (progressBar) {
            progressBar.style.width = '0%';
        }

        if (statusMessage) {
            statusMessage.innerHTML = `<p>Gerando orçamentos para ${igrejasAdicionadas.length} igrejas...</p>`;
        }

        try {
            for (let i = 0; i < igrejasAdicionadas.length; i++) {
                const igreja = igrejasAdicionadas[i];
                const empresaSelecionada = igreja.empresa;

                if (progressBar) {
                    progressBar.style.width = `${(i / igrejasAdicionadas.length) * 100}%`;
                }

                if (statusMessage) {
                    statusMessage.innerHTML = `<p>Processando igreja ${i + 1}/${igrejasAdicionadas.length}: ${igreja.nome}</p>`;
                }

                // Gera dados dos orçamentos com a empresa específica
                const dadosOrcamento = gerarDadosOrcamento(
                    igreja,
                    dataOrcamento,
                    prazoExecucao,
                    configuracao,
                    empresaSelecionada
                );
                // Marca pedido especial para controle de textos
                if (igreja.tipoPedido === 'especial') {
                    dadosOrcamento.especialSemPadrao = true;
                }

                // Passa o tipo de texto para o orçamento
                dadosOrcamento.tipoTexto = igreja.tipoTexto || 'padrao';

                // Usa as empresas concorrentes salvas nesta igreja (não as do formulário atual)
                dadosOrcamento.configConcorrentes = igreja.configConcorrentes || obterConfigConcorrentes();

                // Anexa textos personalizados se tipoTexto for personalizado
                if (igreja.tipoTexto === 'personalizado') {
                    const sua = (igreja.textoSuaEmpresa || '').trim();
                    const isEspecialIgreja = igreja.tipoPedido === 'especial';
                    const qtdSalva = parseInt(dadosOrcamento.configConcorrentes && dadosOrcamento.configConcorrentes.qtd, 10);
                    const qtdConc = (isEspecialIgreja || qtdSalva === 2) ? 2 : 1;
                    const textosConc = [];
                    const manualConc = (igreja.textoConcorrente || '').trim();
                    const manualConc2 = (igreja.textoConcorrente2 || '').trim();

                    for (let v = 0; v < qtdConc; v++) {
                        const manual = v === 0 ? manualConc : manualConc2;
                        if (manual) {
                            textosConc.push(_sanitizarTextoOrcamento(manual));
                        } else {
                            textosConc.push(gerarTextoConcorrenteAuto(sua, v));
                        }
                    }

                    dadosOrcamento.textosConcorrentesGerados = textosConc;
                    dadosOrcamento.textoPersonalizadoSuaEmpresa = _sanitizarTextoOrcamento(sua);
                    dadosOrcamento.textoPersonalizadoConcorrente = textosConc[0] || '';
                    dadosOrcamento.textoPersonalizadoConcorrente2 = textosConc[1] || '';
                    dadosOrcamento.tipoTexto = 'personalizado';
                }

                orcamentosGerados.push(dadosOrcamento);

                // Gera os PDFs
                await gerarPDFs(dadosOrcamento, i, pdfsGerados);

                // Atualiza a interface - passando pdfsGerados como parâmetro
                if (typeof atualizarInterfaceResultados === 'function') {
                    atualizarInterfaceResultados(dadosOrcamento, i, pdfsGerados);
                } else {
                    console.error("Função atualizarInterfaceResultados não encontrada");
                }

                // Remove pedido pendente se o ID da igreja coincidir com algum item pendente
                if (igreja.id && typeof window.removerPedidoPendenteByNumero === 'function') {
                    window.removerPedidoPendenteByNumero(String(igreja.id).trim());
                }

                // Pausa breve para permitir que a UI atualize
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Completa a barra de progresso
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            if (statusMessage) {
                statusMessage.innerHTML = `<p>Todos os orçamentos foram gerados com sucesso!</p>`;
            }

            if (downloadAllBtn) {
                downloadAllBtn.disabled = false;
            }

            // Zera todas as opções do formulário após gerar
            try {
                if (typeof resetarCamposFormularioOrcamento === 'function') {
                    resetarCamposFormularioOrcamento(true);
                }
            } catch (_) { }

        } catch (error) {
            console.error('Erro ao gerar orçamentos:', error);
            if (statusMessage) {
                statusMessage.innerHTML = `<p class="alert alert-error">Erro ao gerar orçamentos: ${error.message}</p>`;
            }
        }
    });

    console.log("Evento de geração de orçamentos inicializado com sucesso!");
}

// Função para baixar todos os PDFs como ZIP
async function inicializarDownloadZip() {
    // Remover listener existente para evitar duplicação
    const downloadBtn = document.getElementById('downloadAllBtn');
    const novoDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(novoDownloadBtn, downloadBtn);

    novoDownloadBtn.addEventListener('click', async function () {
        const JSZip = window.JSZip;
        const zip = new JSZip();

        for (const key in pdfsGerados) {
            const dados = pdfsGerados[key];
            const igreja = dados.igreja;
            const orcamento = dados.orcamento;

            // Formatação do nome da igreja para evitar caracteres inválidos em nome de arquivo
            const nomeIgrejaSeguro = igreja.nome.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const codigoIgreja = igreja.codigo.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);

            // Nome da empresa formatado
            const empresaNome = orcamento.suaEmpresa.nome.replace(/[^a-zA-Z0-9]/g, '_');
            zip.file(`${codigoIgreja}_${nomeIgrejaSeguro}_${empresaNome}.pdf`,
                dados.pdfSuaEmpresa.output('blob'));

            // Adiciona concorrentes conforme existirem
            if (dados.pdfConcorrente && dados.empresaConcorrente) {
                const concorrenteNome = dados.empresaConcorrente.replace(/[^a-zA-Z0-9]/g, '_');
                zip.file(`${codigoIgreja}_${nomeIgrejaSeguro}_${concorrenteNome}.pdf`, dados.pdfConcorrente.output('blob'));
            }
            if (dados.pdfConcorrenteMega && dados.empresaConcorrenteMega) {
                const megaNome = dados.empresaConcorrenteMega.replace(/[^a-zA-Z0-9]/g, '_');
                zip.file(`${codigoIgreja}_${nomeIgrejaSeguro}_${megaNome}.pdf`, dados.pdfConcorrenteMega.output('blob'));
            }
            if (dados.pdfConcorrenteTella && dados.empresaConcorrenteTella) {
                const tellaNome = dados.empresaConcorrenteTella.replace(/[^a-zA-Z0-9]/g, '_');
                zip.file(`${codigoIgreja}_${nomeIgrejaSeguro}_${tellaNome}.pdf`, dados.pdfConcorrenteTella.output('blob'));
            }
        }

        // Gera e baixa o arquivo ZIP
        const zipContent = await zip.generateAsync({ type: 'blob' });
        saveAs(zipContent, 'Orçamentos_Igrejas.zip');
    });
}

// Expõe a função de baixar PDF para uso global
window.baixarPDF = function (index, tipo) {
    baixarPDF(index, tipo, pdfsGerados);
};

// Disponibilizar logos para outros scripts
window.obterLogos = function () {
    return logosBase64;
};

// --- Relatório Técnico (NOVO SISTEMA) ---
let relatoriosAdicionados = [];
let pdfsRelatoriosGerados = {};
let relatoriosData = {
    pendentes: [],      // Igrejas com relatório pendente
    gerados: [],        // Igrejas com relatório gerado
    pedidosSandro: []   // Pedidos do Sandro
};
let igrejaAtualRelatorio = null; // Igreja selecionada no modal
let abaAtivaRelatorio = 'pendentes'; // Aba ativa atual

// Carrega dados dos relatórios do localStorage
function carregarDadosRelatorios() {
    try {
        const salvo = localStorage.getItem('relatoriosData');
        if (salvo) {
            relatoriosData = JSON.parse(salvo);
            // Garante estrutura correta
            if (!relatoriosData.pendentes) relatoriosData.pendentes = [];
            if (!relatoriosData.gerados) relatoriosData.gerados = [];
            if (!relatoriosData.pedidosSandro) relatoriosData.pedidosSandro = [];

            // Migra dados antigos (se existir estrutura antiga com "igrejas")
            if (relatoriosData.igrejas && Array.isArray(relatoriosData.igrejas)) {
                relatoriosData.igrejas.forEach(ig => {
                    if (ig.status === 'gerado') {
                        if (!relatoriosData.gerados.find(g => g.nome === ig.nome && g.id === ig.id)) {
                            relatoriosData.gerados.push(ig);
                        }
                    } else {
                        if (!relatoriosData.pendentes.find(p => p.nome === ig.nome && p.id === ig.id)) {
                            relatoriosData.pendentes.push(ig);
                        }
                    }
                });
                delete relatoriosData.igrejas;
                salvarDadosRelatorios();
            }
        }
        const total = relatoriosData.pendentes.length + relatoriosData.gerados.length + relatoriosData.pedidosSandro.length;
        console.log('✅ Dados de relatórios carregados:', total, 'igrejas');
    } catch (e) {
        console.error('Erro ao carregar dados dos relatórios:', e);
        relatoriosData = { pendentes: [], gerados: [], pedidosSandro: [] };
    }
}

// Salva dados dos relatórios no localStorage e Firebase
function salvarDadosRelatorios() {
    try {
        relatoriosData._ts = Date.now();
        localStorage.setItem('relatoriosData', JSON.stringify(relatoriosData));
        if (typeof salvarNoDatabase === 'function' && typeof firebaseDisponivel !== 'undefined' && firebaseDisponivel) {
            const _ts = relatoriosData._ts;
            salvarNoDatabase('dados/relatorios', relatoriosData)
                .then(() => {
                    console.log('✅ Relatórios salvos no Firebase');
                    if (typeof window._fbMarcarEnviado === 'function') window._fbMarcarEnviado('relatoriosData', _ts);
                })
                .catch(err => console.warn('⚠️ Relatórios não salvos no Firebase:', err));
        }
        console.log('✅ Dados de relatórios salvos');
    } catch (e) {
        console.error('❌ Erro ao salvar dados dos relatórios:', e);
    }
}

// Sincroniza a lista de igrejas com as Notas Fiscais
function sincronizarIgrejasRelatorio() {
    try {
        const nfDataStr = localStorage.getItem('notasFiscais');
        if (!nfDataStr) return;

        const nfData = JSON.parse(nfDataStr);
        // Inclui igrejas ativas, arquivadas e especiais — arquivar no NF não remove do relatório
        const igrejasNF = [
            ...(Array.isArray(nfData.igrejas)    ? nfData.igrejas    : []),
            ...(Array.isArray(nfData.arquivadas) ? nfData.arquivadas : []),
            ...(Array.isArray(nfData.especiais)  ? nfData.especiais  : [])
        ];

        // PASSO 1: Remover igrejas que não existem mais nas Notas Fiscais
        ['pendentes', 'gerados', 'pedidosSandro'].forEach(categoria => {
            relatoriosData[categoria] = relatoriosData[categoria].filter(igrejaRel => {
                const aindaExiste = igrejasNF.some(igrejaNF =>
                    igrejaNF.nome === igrejaRel.nome && igrejaNF.id === igrejaRel.id
                );
                if (!aindaExiste) {
                    console.log(`🗑️ Removendo igreja do Relatório (${categoria}): "${igrejaRel.nome}"`);
                }
                return aindaExiste;
            });
        });

        // PASSO 2: Adicionar igrejas novas como pendentes
        igrejasNF.forEach(igrejaNF => {
            const jaPendente = relatoriosData.pendentes.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);
            const jaGerado = relatoriosData.gerados.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);
            const jaSandro = relatoriosData.pedidosSandro.find(ig => ig.nome === igrejaNF.nome && ig.id === igrejaNF.id);

            if (!jaPendente && !jaGerado && !jaSandro) {
                relatoriosData.pendentes.push({
                    nome: igrejaNF.nome,
                    id: igrejaNF.id,
                    dataGeracao: null
                });
                console.log(`➕ Nova igreja adicionada ao Relatório: "${igrejaNF.nome}"`);
            }
        });

        salvarDadosRelatorios();
    } catch (error) {
        console.error('Erro ao sincronizar igrejas para relatório:', error);
    }
}

// Move igreja para Pendentes
function moverParaPendentesRelatorio(tipoOrigem, index) {
    const igreja = relatoriosData[tipoOrigem][index];
    if (!igreja) return;

    relatoriosData[tipoOrigem].splice(index, 1);
    relatoriosData.pendentes.push(igreja);

    salvarDadosRelatorios();
    atualizarListaRelatoriosNovo();
}

// Move igreja para Gerados
function moverParaGeradosRelatorio(tipoOrigem, index) {
    const igreja = relatoriosData[tipoOrigem][index];
    if (!igreja) return;

    relatoriosData[tipoOrigem].splice(index, 1);
    igreja.dataGeracao = new Date().toISOString();
    relatoriosData.gerados.push(igreja);

    salvarDadosRelatorios();
    atualizarListaRelatoriosNovo();
}

// Move igreja para Sandro
function moverParaSandroRelatorio(tipoOrigem, index) {
    const igreja = relatoriosData[tipoOrigem][index];
    if (!igreja) return;

    relatoriosData[tipoOrigem].splice(index, 1);
    relatoriosData.pedidosSandro.push(igreja);

    salvarDadosRelatorios();
    atualizarListaRelatoriosNovo();
}

// Evita re-render desnecessário (mantém hover, reduz custo)
let _relatorioLastRenderHash = '';

function _initRelatorioListaDelegation() {
    const container = document.getElementById('relatorioIgrejasList');
    if (!container || container.dataset.delegationInit) return;
    container.dataset.delegationInit = '1';

    container.addEventListener('click', (e) => {
        const btnGerar = e.target.closest('.btn-relatorio-gerar');
        if (btnGerar) {
            const index = parseInt(btnGerar.dataset.index, 10);
            const tipo = btnGerar.dataset.tipo;
            const igreja = relatoriosData[tipo]?.[index];
            if (igreja) abrirModalRelatorio(igreja.nome, igreja.id || '', index, tipo);
            return;
        }

        const btnDownload = e.target.closest('.btn-relatorio-download');
        if (btnDownload) {
            const index = parseInt(btnDownload.dataset.index, 10);
            const tipo = btnDownload.dataset.tipo;
            const igreja = relatoriosData[tipo]?.[index];
            if (igreja) baixarRelatorioIndividual(`${igreja.nome}_${igreja.id}`);
        }
    });
}

function atualizarListaRelatoriosNovo() {
    const container = document.getElementById('relatorioIgrejasList');
    if (!container) return;
    _initRelatorioListaDelegation();
    // Sincroniza com NF antes de exibir
    sincronizarIgrejasRelatorio();
    const hash = (relatoriosData._ts || 0) + '-' + (relatoriosData.pendentes||[]).length + ':' + (relatoriosData.gerados||[]).length + ':' + (relatoriosData.pedidosSandro||[]).length + '-' + abaAtivaRelatorio;
    if (hash === _relatorioLastRenderHash) return;
    _relatorioLastRenderHash = hash;

    container.innerHTML = '';

    // Cria as tabs
    const tabsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div class="relatorio-tabs" style="display: flex; gap: 5px;">
                <button class="relatorio-tab-button ${abaAtivaRelatorio === 'pendentes' ? 'active' : ''}" onclick="mudarAbaRelatorio('pendentes')">
                    Pendentes (${relatoriosData.pendentes.length})
                </button>
                <button class="relatorio-tab-button ${abaAtivaRelatorio === 'gerados' ? 'active' : ''}" onclick="mudarAbaRelatorio('gerados')">
                    Gerados (${relatoriosData.gerados.length})
                </button>
                <button class="relatorio-tab-button ${abaAtivaRelatorio === 'pedidosSandro' ? 'active' : ''}" onclick="mudarAbaRelatorio('pedidosSandro')">
                    Sandro (${relatoriosData.pedidosSandro.length})
                </button>
            </div>
            <button onclick="recarregarRelatorios()" class="btn-secondary" style="padding: 8px 15px; font-size: 13px;">
                <i class="fas fa-sync-alt"></i> Atualizar
            </button>
        </div>
    `;
    container.innerHTML = tabsHTML;

    // Obtém lista da aba ativa
    const listaAtual = relatoriosData[abaAtivaRelatorio] || [];

    if (listaAtual.length === 0) {
        container.innerHTML += `
            <div style="text-align: center; padding: 40px; color: #666; border: 1px dashed #ddd; border-radius: 8px;">
                <i class="fas fa-inbox" style="font-size: 36px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>Nenhuma igreja nesta categoria.</p>
            </div>
        `;
    } else {
        // Tabela
        let tabelaHTML = `
            <div class="relatorio-tabela">
                <div class="relatorio-header">
                    <div>Igreja</div>
                    <div>Status</div>
                    <div>Ações</div>
                </div>
        `;

        listaAtual.forEach((igreja, index) => {
            const chave = `${igreja.nome}_${igreja.id}`;

            // Define status visual baseado na aba
            let statusClass, statusText;
            if (abaAtivaRelatorio === 'pendentes') {
                statusClass = 'status-pendente';
                statusText = 'Pendente';
            } else if (abaAtivaRelatorio === 'gerados') {
                statusClass = 'status-gerado';
                statusText = 'Gerado';
            } else {
                statusClass = 'status-sandro';
                statusText = 'Sandro';
            }

            const dataGeracao = igreja.dataGeracao ?
                new Date(igreja.dataGeracao).toLocaleDateString('pt-BR') : '';

            tabelaHTML += `
                <div class="relatorio-row">
                    <div class="relatorio-col-igreja">
                        <strong>${igreja.nome}</strong>
                        ${igreja.id ? `<span class="relatorio-id">ID: ${igreja.id}</span>` : ''}
                        ${dataGeracao ? `<span class="relatorio-id" style="color: #4ADC77;">Gerado em: ${dataGeracao}</span>` : ''}
                    </div>
                    <div>
                        <span class="relatorio-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="relatorio-col-acoes">
                        <button class="btn-relatorio btn-relatorio-gerar" data-index="${index}" data-tipo="${abaAtivaRelatorio}" type="button">
                            <i class="fas fa-file-pdf"></i> Gerar
                        </button>
                        ${abaAtivaRelatorio !== 'pendentes' ? `
                            <button class="btn-relatorio btn-relatorio-icon" onclick="moverParaPendentesRelatorio('${abaAtivaRelatorio}', ${index})" title="Mover para Pendentes">
                                <i class="fas fa-clock"></i>
                            </button>
                        ` : ''}
                        ${abaAtivaRelatorio !== 'gerados' ? `
                            <button class="btn-relatorio btn-relatorio-icon" onclick="moverParaGeradosRelatorio('${abaAtivaRelatorio}', ${index})" title="Mover para Gerados">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${abaAtivaRelatorio !== 'pedidosSandro' ? `
                            <button class="btn-relatorio btn-relatorio-icon" onclick="moverParaSandroRelatorio('${abaAtivaRelatorio}', ${index})" title="Mover para Sandro">
                                <i class="fas fa-user"></i>
                            </button>
                        ` : ''}
                        ${pdfsRelatoriosGerados[chave] ? `
                            <button class="btn-relatorio btn-relatorio-download" data-index="${index}" data-tipo="${abaAtivaRelatorio}" type="button" title="Baixar PDF">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        tabelaHTML += '</div>';
        container.innerHTML += tabelaHTML;
    }

}

// Muda aba ativa
function mudarAbaRelatorio(aba) {
    abaAtivaRelatorio = aba;
    atualizarListaRelatoriosNovo();
}

// Recarrega dados dos relatórios
function recarregarRelatorios() {
    sincronizarIgrejasRelatorio();
    atualizarListaRelatoriosNovo();
}

// Expõe funções de movimento globalmente
window.moverParaPendentesRelatorio = moverParaPendentesRelatorio;
window.moverParaGeradosRelatorio = moverParaGeradosRelatorio;
window.moverParaSandroRelatorio = moverParaSandroRelatorio;
window.mudarAbaRelatorio = mudarAbaRelatorio;
window.recarregarRelatorios = recarregarRelatorios;

// Abre o modal para gerar relatório
function abrirModalRelatorio(nome, id, index, tipoOrigem = 'pendentes') {
    igrejaAtualRelatorio = { nome, id, index, tipoOrigem };

    // Atualiza título do modal
    document.getElementById('modalRelatorioTitulo').textContent = `Gerar Relatório - ${nome}`;

    // Reseta campos do modal
    document.getElementById('modalTipoRelatorio').value = 'manutencao';
    document.getElementById('modalImagensRelatorio').value = '';
    document.getElementById('modalUsarTextoPersonalizado').checked = false;
    document.getElementById('modalTextoPersonalizado').value = '';
    document.getElementById('modalTextoPersonalizado').style.display = 'none';
    document.getElementById('modalSalvarPastaImprimir').checked = true;

    const modalEl = document.getElementById('modalRelatorio');
    if (!modalEl) {
        console.error('Elemento #modalRelatorio não encontrado');
        alert('Erro ao abrir o modal. Atualize a página e tente novamente.');
        return;
    }
    if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }

    // Mostra o modal
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Fecha o modal de relatório
function fecharModalRelatorio() {
    const modalEl = document.getElementById('modalRelatorio');
    if (modalEl) modalEl.style.display = 'none';
    document.body.style.overflow = '';
    igrejaAtualRelatorio = null;
}

// Toggle do texto personalizado no modal
function toggleTextoPersonalizadoModal() {
    const checkbox = document.getElementById('modalUsarTextoPersonalizado');
    const textarea = document.getElementById('modalTextoPersonalizado');
    textarea.style.display = checkbox.checked ? 'block' : 'none';
}

// Gera o relatório a partir do modal
async function gerarRelatorioDoModal() {
    if (!igrejaAtualRelatorio) {
        alert('Erro: Nenhuma igreja selecionada.');
        return;
    }

    const inputImagens = document.getElementById('modalImagensRelatorio');
    const imagens = Array.from(inputImagens.files);

    if (imagens.length === 0 || imagens.length > 5) {
        alert('Por favor, selecione de 1 a 5 imagens na ordem correta.');
        return;
    }

    const tipoRelatorio = document.getElementById('modalTipoRelatorio').value;
    const usarTexto = document.getElementById('modalUsarTextoPersonalizado').checked;
    const textoPersonalizado = usarTexto ? document.getElementById('modalTextoPersonalizado').value.trim() : '';
    const salvarPasta = document.getElementById('modalSalvarPastaImprimir').checked;

    // Monta dados do relatório
    const relatorio = {
        nome: igrejaAtualRelatorio.nome,
        id: igrejaAtualRelatorio.id,
        imagens,
        tipoRelatorio,
        textoPersonalizado,
        salvarPasta,
        tipoOrigem: igrejaAtualRelatorio.tipoOrigem
    };

    try {
        // Mostra loading
        const btnGerar = document.querySelector('#modalRelatorio .btn-success');
        const textoOriginal = btnGerar.innerHTML;
        btnGerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        btnGerar.disabled = true;

        // Gera o relatório
        const pdf = await gerarRelatorioTecnicoIndividual(relatorio);

        // Armazena o PDF
        const chave = `${relatorio.nome}_${relatorio.id}`;
        pdfsRelatoriosGerados[chave] = { nome: relatorio.nome, pdf };

        // Move para a aba "gerados" se estava em outra aba
        if (relatorio.tipoOrigem && relatorio.tipoOrigem !== 'gerados') {
            const index = igrejaAtualRelatorio.index;
            const igreja = relatoriosData[relatorio.tipoOrigem][index];
            if (igreja) {
                relatoriosData[relatorio.tipoOrigem].splice(index, 1);
                igreja.dataGeracao = new Date().toISOString();
                relatoriosData.gerados.push(igreja);
            }
        } else {
            // Atualiza data de geração se já estava em "gerados"
            const igreja = relatoriosData.gerados.find(ig => ig.nome === relatorio.nome && ig.id === relatorio.id);
            if (igreja) {
                igreja.dataGeracao = new Date().toISOString();
            }
        }
        salvarDadosRelatorios();

        // Salva na pasta IMPRIMIR se habilitado
        if (salvarPasta && typeof window.criarPastasIgreja === 'function') {
            try {
                const pastas = await window.criarPastasIgreja(relatorio.nome);
                if (pastas && pastas.imprimir) {
                    const pdfBlob = pdf.output('blob');
                    await window.salvarPDFEmPasta(
                        pastas.imprimir,
                        `Relatorio_Tecnico_${relatorio.nome.replace(/[<>:"/\\|?*]/g, '_')}.pdf`,
                        pdfBlob
                    );
                    console.log('✅ Relatório salvo na pasta IMPRIMIR');
                }
            } catch (err) {
                console.warn('⚠️ Não foi possível salvar na pasta:', err);
            }
        }

        // Restaura botão
        btnGerar.innerHTML = textoOriginal;
        btnGerar.disabled = false;

        // Fecha modal e atualiza lista
        fecharModalRelatorio();
        atualizarListaRelatoriosNovo();

        // Pergunta se quer baixar
        if (confirm('Relatório gerado com sucesso!\n\nDeseja fazer o download agora?')) {
            pdf.save(`Relatorio_Tecnico_${relatorio.nome}.pdf`);
        }

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + error.message);

        const btnGerar = document.querySelector('#modalRelatorio .btn-success');
        btnGerar.innerHTML = '<i class="fas fa-file-pdf"></i> Gerar Relatório';
        btnGerar.disabled = false;
    }
}

// Baixa relatório individual já gerado
function baixarRelatorioIndividual(chave) {
    const dados = pdfsRelatoriosGerados[chave];
    if (dados && dados.pdf) {
        dados.pdf.save(`Relatorio_Tecnico_${dados.nome}.pdf`);
    } else {
        alert('Relatório não encontrado. Por favor, gere novamente.');
    }
}

// Função para gerar um único relatório técnico
async function gerarRelatorioTecnicoIndividual(rel) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Primeira página - Texto
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`RELATÓRIO TÉCNICO - ${rel.nome.toUpperCase()}`, 105, 20, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    let y = 35;

    // Se houver texto personalizado, usa-o
    if (rel.textoPersonalizado && rel.textoPersonalizado.trim()) {
        const linhasPers = pdf.splitTextToSize(rel.textoPersonalizado.trim(), 185);
        for (const linha of linhasPers) {
            pdf.text(linha, 13, y);
            y += 5;
        }
    } else if (rel.tipoRelatorio === 'manutencao') {
        // Gera texto de manutenção com variações
        const secoes = ['Caixas de Som', 'Amplificadores', 'Mesa de Som', 'Microfone sem Fio', 'Microfone Gooseneck', 'Caixa de Retorno'];

        for (let j = 0; j < secoes.length; j++) {
            const secao = secoes[j];
            pdf.text(`${j + 1}. ${secao}`, 13, y);
            y += 7;
            const textoSecao = gerarVariacaoTexto(secao);
            const linhas = pdf.splitTextToSize(textoSecao, 185);
            for (const linha of linhas) {
                pdf.text(linha, 13, y);
                y += 5;
            }
            y += 3;
        }

        y += 2;
        pdf.text('Conclusão', 13, y);
        y += 7;
        const textoConclusao = gerarVariacaoTexto('Conclusão');
        const linhasConclusao = pdf.splitTextToSize(textoConclusao, 185);
        for (const linha of linhasConclusao) {
            pdf.text(linha, 13, y);
            y += 5;
        }
    } else {
        // Igreja nova
        const textoRelatorio = TEXTOS_RELATORIO[rel.tipoRelatorio] || TEXTOS_RELATORIO.igreja_nova;
        const linhas = pdf.splitTextToSize(textoRelatorio, 185);
        for (const linha of linhas) {
            pdf.text(linha, 13, y);
            y += 5;
        }
    }

    // Segunda página - Fotos
    pdf.addPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('FOTOS DA IGREJA', 105, 20, { align: 'center' });

    const margemLateral = 20;
    const margemSuperior = 40;
    const espacamento = 10;
    const larguraUtil = 170;
    const alturaUtil = 220;

    const totalImgs = Math.min(rel.imagens.length, 5);
    let larguraImagem, alturaImagem;

    if (totalImgs <= 2) {
        larguraImagem = (larguraUtil - espacamento) / 2;
        alturaImagem = alturaUtil / 2;
    } else if (totalImgs <= 4) {
        larguraImagem = (larguraUtil - espacamento) / 2;
        alturaImagem = (alturaUtil - espacamento) / 2;
    } else {
        larguraImagem = (larguraUtil - 2 * espacamento) / 3;
        alturaImagem = (alturaUtil - espacamento) / 2;
    }

    for (let idx = 0; idx < totalImgs; idx++) {
        let x, yImg;

        if (totalImgs <= 2) {
            x = margemLateral + idx * (larguraImagem + espacamento);
            yImg = margemSuperior + (alturaUtil - alturaImagem) / 2;
        } else if (totalImgs <= 4) {
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            x = margemLateral + col * (larguraImagem + espacamento);
            yImg = margemSuperior + row * (alturaImagem + espacamento);
        } else {
            if (idx < 2) {
                x = margemLateral + idx * (larguraUtil / 2 + espacamento / 2);
                yImg = margemSuperior;
                larguraImagem = (larguraUtil - espacamento) / 2;
            } else {
                x = margemLateral + (idx - 2) * (larguraUtil / 3 + espacamento / 2);
                yImg = margemSuperior + alturaUtil / 2 + espacamento;
                larguraImagem = (larguraUtil - 2 * espacamento) / 3;
            }
        }

        const imgData = await processarImagem(rel.imagens[idx]);
        const props = await getImageProps(imgData);

        const ratio = Math.min(larguraImagem / props.width, alturaImagem / props.height);
        const w = props.width * ratio;
        const h = props.height * ratio;

        const finalX = x + (larguraImagem - w) / 2;
        const finalY = yImg + (alturaImagem - h) / 2;

        pdf.addImage(imgData, 'JPEG', finalX, finalY, w, h, undefined, 'NONE');
    }

    return pdf;
}

async function inicializarRelatorioTecnico() {
    // Carrega dados salvos do localStorage
    carregarDadosRelatorios();

    // Atualiza a lista inicial (cria os elementos da interface)
    atualizarListaRelatoriosNovo();

}

// Expõe funções globalmente
window.abrirModalRelatorio = abrirModalRelatorio;
window.fecharModalRelatorio = fecharModalRelatorio;
window.toggleTextoPersonalizadoModal = toggleTextoPersonalizadoModal;
window.gerarRelatorioDoModal = gerarRelatorioDoModal;
window.baixarRelatorioIndividual = baixarRelatorioIndividual;
window.atualizarListaRelatoriosNovo = atualizarListaRelatoriosNovo;

// Mantém funções antigas para compatibilidade
function atualizarListaRelatorios() {
    // Função mantida para compatibilidade, mas não faz nada
    console.log('atualizarListaRelatorios chamada (compatibilidade)');
}

// Função para gerar variações de texto para cada item
function gerarVariacaoTexto(item) {
    const variacoes = {
        'Caixas de Som': [
            'Foi realizada a verificação da integridade física. Testes de funcionamento confirmaram alguns ruídos, que foram eliminados após ajustes. Cabos e conexões foram revisados e substituídos onde necessário. O posicionamento das caixas foi otimizado para melhor distribuição sonora.',
            'Realizamos inspeção completa do estado físico. Os testes operacionais identificaram interferências sonoras, posteriormente corrigidas com ajustes técnicos. Procedemos com a revisão e substituição de cabos e conexões conforme necessidade. Reposicionamos as caixas para distribuição acústica ideal.',
            'Executamos checagem detalhada da condição física. Durante os testes, foram detectados e corrigidos ruídos indesejados. Efetuamos manutenção em cabos e conexões, com substituições quando necessário. A disposição das caixas foi ajustada para otimizar a cobertura sonora.'
        ],
        'Amplificadores': [
            'Foi realizado teste de ligação e ajuste para melhor resposta de som. Inspeção dos cabos resultou na substituição de algumas conexões defeituosas. Configurações foram ajustadas para melhor desempenho.',
            'Executamos testes de funcionamento e calibração para otimizar a resposta sonora. A verificação da fiação levou à troca de conexões comprometidas. Realizamos ajustes nas configurações visando performance ideal.',
            'Procedemos com testes operacionais e regulagem para resposta acústica superior. Durante a inspeção, identificamos e substituímos conexões problemáticas. Os parâmetros foram recalibrados para máxima eficiência.'
        ],
        'Mesa de Som': [
            'Canais e equalizadores foram testados e corrigidos conforme necessidade. Saídas e entradas foram revisadas e alguns ruídos foram eliminados. Potenciômetros e sliders passaram por limpeza e lubrificação. Integração com os demais equipamentos foi otimizada.',
            'Realizamos testes em todos os canais e equalizadores, fazendo correções necessárias. Verificamos entradas e saídas, eliminando interferências. Executamos limpeza e lubrificação de potenciômetros e faders. Otimizamos a integração com o sistema completo.',
            'Procedemos com verificação completa de canais e equalização, aplicando ajustes quando necessário. Inspecionamos portas de entrada e saída, removendo ruídos. Efetuamos manutenção em potenciômetros e controles deslizantes. A comunicação com outros equipamentos foi aperfeiçoada.'
        ],
        'Microfone sem Fio': [
            'Testes de captação e transmissão foram realizados com êxito. Limpeza e higienização foram efetuadas. Alcance foi testado e ampliado para maior mobilidade.',
            'Executamos verificação completa dos sistemas de captação e transmissão. Procedemos com limpeza profunda e sanitização. O alcance do sinal foi otimizado para melhor mobilidade.',
            'Realizamos testes abrangentes de recepção e transmissão. Efetuamos procedimentos de limpeza e higiene. Ajustamos e ampliamos a área de cobertura do sinal.'
        ],
        'Microfone Gooseneck': [
            'Captação foi testada e melhorada através de ajustes finos. Conexões e cabos passaram por revisão e algumas substituições foram feitas. Flexibilidade e posicionamento foram ajustados para melhor usabilidade. Integração com a mesa de som foi otimizada.',
            'Realizamos testes e aprimoramentos na captação através de calibração precisa. Verificamos e renovamos conexões e cabeamento conforme necessidade. Ajustamos articulação e posição para uso ideal. Sincronização com a mesa foi refinada.',
            'Executamos verificação e otimização da captação com ajustes detalhados. Inspecionamos e atualizamos conexões e fiação quando necessário. Regulamos mobilidade e posicionamento para máxima eficiência. Alinhamos integração com o sistema de áudio.'
        ],
        'Caixa de Retorno': [
            'Testes de funcionamento foram realizados e a qualidade do som foi aprimorada. Conexões e cabos foram revisados e substituídos onde necessário. Posicionamento foi ajustado para melhor aproveitamento do som pelos músicos. Limpeza externa e interna foi realizada. Equalização foi ajustada conforme as necessidades dos usuários.',
            'Executamos verificação operacional completa e otimizamos a qualidade sonora. Inspecionamos e renovamos conexões e cabeamento conforme necessidade. Reposicionamos o equipamento para melhor monitoramento pelos músicos. Realizamos limpeza detalhada interna e externa. Personalizamos equalização segundo requisitos dos usuários.',
            'Procedemos com testes funcionais e melhorias na qualidade acústica. Revisamos e atualizamos conexões e fiação quando necessário. Ajustamos localização para retorno ideal aos músicos. Efetuamos limpeza completa do equipamento. Configuramos equalização de acordo com as preferências dos usuários.'
        ],
        'Conclusão': [
            'A igreja apresentava algumas falhas no sistema de som, que foram devidamente identificadas e corrigidas. Foram tomadas as providências necessárias para garantir seu funcionamento adequado, incluindo substituição de cabos, ajustes de configuração, limpeza e melhorias na distribuição sonora. O sistema agora encontra-se em condições ideais para o uso.',
            'O sistema de som da igreja exibia certas deficiências que foram identificadas e solucionadas. Implementamos todas as medidas necessárias para assegurar operação apropriada, incluindo renovação de cabeamento, calibração de equipamentos, procedimentos de limpeza e otimização acústica. O conjunto agora opera em condições ótimas.',
            'Foram detectadas e resolvidas diversas inconsistências no sistema sonoro da igreja. Executamos todos os procedimentos necessários para garantir funcionamento correto, incluindo atualização de conexões, ajustes técnicos, manutenção preventiva e melhorias na propagação do som. O sistema está agora em estado ideal de operação.'
        ]
    };

    // Seleciona aleatoriamente uma das variações para o item
    const opcoes = variacoes[item] || ['Texto não disponível para este item'];
    return opcoes[Math.floor(Math.random() * opcoes.length)];
}

// Lê configuração de empresas concorrentes do formulário
function obterConfigConcorrentes() {
    const modo = (document.getElementById('modoConcorrentes')?.value || 'aleatorio');
    const qtd = parseInt(document.getElementById('qtdConcorrentes')?.value || '1', 10);
    const empresas = [];
    if (modo === 'manual') {
        document.querySelectorAll('#listaConcorrentesManual input[type="checkbox"]:checked').forEach(cb => {
            if (cb.value) empresas.push(cb.value);
        });
    }
    return { modo, qtd: qtd === 2 ? 2 : 1, empresas };
}

function aplicarConfigConcorrentes(config) {
    if (typeof inicializarCheckboxesConcorrentes === 'function') {
        inicializarCheckboxesConcorrentes();
    }
    const cfg = config || { modo: 'aleatorio', qtd: 1, empresas: [] };
    const modo = document.getElementById('modoConcorrentes');
    const qtd = document.getElementById('qtdConcorrentes');
    const bloco = document.getElementById('blocoConcorrentesManual');
    if (modo) modo.value = cfg.modo || 'aleatorio';
    if (qtd) qtd.value = String(cfg.qtd === 2 ? 2 : 1);
    if (bloco) bloco.style.display = (cfg.modo === 'manual') ? '' : 'none';
    const selecionadas = new Set(Array.isArray(cfg.empresas) ? cfg.empresas : []);
    document.querySelectorAll('#listaConcorrentesManual input[type="checkbox"]').forEach(cb => {
        cb.checked = selecionadas.has(cb.value);
    });
    if (typeof atualizarCamposTextoConcorrentes === 'function') {
        atualizarCamposTextoConcorrentes();
    }
}

function inicializarCheckboxesConcorrentes() {
    const container = document.getElementById('listaConcorrentesManual');
    if (!container || container.dataset.init) return;
    container.dataset.init = '1';
    const lista = (typeof window.EMPRESAS_CONCORRENTES !== 'undefined')
        ? [...window.EMPRESAS_CONCORRENTES, 'MEGA EVENTOS', 'TELLA VIDEO']
        : ['Virtual Guitar Shop', 'GG PROAUTO LTDA', 'STV IMAGEM E SOM', 'UP SERVIÇOS', 'SENA AUDIOVISUAL PRODUÇÕES', 'INSTALASSOM', 'GLAUBER SISTEMAS CONSTRUTIVOS', 'MEGA EVENTOS', 'TELLA VIDEO'];
    const visto = new Set();
    container.innerHTML = lista.filter(n => {
        if (!n || visto.has(n)) return false;
        visto.add(n);
        return true;
    }).map(nome => `
        <label><input type="checkbox" value="${nome.replace(/"/g, '&quot;')}"> ${nome}</label>
    `).join('');
}

window.obterConfigConcorrentes = obterConfigConcorrentes;
window.aplicarConfigConcorrentes = aplicarConfigConcorrentes;
window.inicializarCheckboxesConcorrentes = inicializarCheckboxesConcorrentes;

function _sanitizarTextoOrcamento(texto) {
    return (typeof sanitizarTextoPDF === 'function')
        ? sanitizarTextoPDF(texto)
        : String(texto || '');
}

function _protegerFatosOrcamento(texto) {
    const fatos = [];
    const guardar = (m) => {
        const i = fatos.length;
        fatos.push(m);
        return `<<F${i}>>`;
    };
    let t = String(texto);
    t = t.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, guardar);
    t = t.replace(/\b\d{1,2}:\d{2}(?:h|\s*h)?\b/gi, guardar);
    t = t.replace(/\d+[.,]\d+\s*m(?:etros?)?\s*[xX×]\s*\d+[.,]\d+\s*m(?:etros?)?/gi, guardar);
    t = t.replace(/\b\d+[.,]\d+\s*(?:m|cm|mm|km|kg|metros?|metro)\b/gi, guardar);
    t = t.replace(/\b\d+\s*(?:m|cm|mm|km|kg|metros?|metro)\b/gi, guardar);
    t = t.replace(/(?:local|endere[cç]o|igreja|cliente|unidade)\s*:\s*(.+)/gi, (_, rest) => {
        return 'local: ' + guardar(rest.trim());
    });
    t = t.replace(/\b0\d+\b/g, guardar);
    t = t.replace(/\b\d+(?:[.,]\d+)?\b/g, guardar);
    t = t.replace(/\b[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+(?:\s+(?:d[aeo]s?|e)\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+|\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+){1,6}\b/g, guardar);
    return { texto: t, fatos };
}

function _restaurarFatosOrcamento(texto, fatos) {
    let t = String(texto);
    fatos.forEach((valor, i) => {
        t = t.split(`<<F${i}>>`).join(valor);
    });
    return t;
}

function _aplicarTrocas(texto, trocas) {
    let t = texto;
    trocas.forEach(([rgx, rep]) => { t = t.replace(rgx, rep); });
    return t.replace(/\s{2,}/g, ' ').trim();
}

function _capFrase(texto) {
    const t = String(texto || '').trim();
    if (!t) return '';
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function _analisarOrcamentoOriginal(texto) {
    const linhas = String(texto).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const itens = [];
    const paragrafos = [];
    const ignora = /^(servi[cç]os contemplados|escopo(?: da execu[cç][aã]o)?|observa[cç][oõ]es|condi[cç][oõ]es(?: do or[cç]amento)?|o que est[aá] inclu[ií]do|investimento)$/i;
    linhas.forEach((linha) => {
        if (ignora.test(linha.replace(/[:.]$/, ''))) return;
        const m = linha.match(/^(?:[-•*]\s+|\d+[\.\)]\s+)(.+)/);
        if (m) itens.push(m[1].replace(/[.;]\s*$/, '').trim());
        else paragrafos.push(linha);
    });
    let titulo = '';
    let intro = '';
    let fechamento = '';
    if (paragrafos.length) {
        titulo = paragrafos[0];
        const resto = paragrafos.slice(1);
        if (resto.length >= 2) {
            intro = resto.slice(0, -1).join(' ');
            fechamento = resto[resto.length - 1];
        } else if (resto.length === 1) {
            if (/valor|contempla|investimento|proposta|or[cç]amento/.test(resto[0].toLowerCase())) fechamento = resto[0];
            else intro = resto[0];
        }
    }
    const dimensoes = [];
    const reDim = /\d+[.,]\d+\s*m(?:etros?)?\s*[xX×]\s*\d+[.,]\d+\s*m(?:etros?)?/gi;
    let md;
    const blob = String(texto);
    while ((md = reDim.exec(blob))) dimensoes.push(md[0].replace(/\s+/g, ' '));
    const datas = blob.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || [];
    const localM = blob.match(/(?:local|endere[cç]o)\s*:\s*(.+)/i);
    return {
        titulo, intro, itens, fechamento, dimensoes, datas,
        local: localM ? localM[1].trim() : '',
        drywall: /drywall/i.test(blob),
        tenda: /tenda/i.test(blob),
        forro: /forro/i.test(blob),
        vidro: /vidro|esquadria/i.test(blob),
        porta: /porta/i.test(blob),
        janela: /janela/i.test(blob),
        locacao: /loca[cç][aã]o/i.test(blob),
        maoDeObra: /m[aã]o de obra/i.test(blob),
        incluiJanela: /fornecimento[\s\S]{0,80}janela|janela[\s\S]{0,80}fornecimento/i.test(blob)
    };
}

function _classificarItemEscopo(texto) {
    const t = String(texto).toLowerCase();
    if (/limp|organiza|res[ií]duo|t[eé]rmino|conclus[aã]o|entrega do local/.test(t)) return 'finalizacao';
    if (/fita|massa|junta|emenda|acabamento|arremate|tratamento/.test(t)) return 'acabamento';
    if (/v[aã]o|abertura|refor[cç]o|esquadro/.test(t)) return 'aberturas';
    if (/(porta|janela).{0,50}(instala|fornec)|(instala|fornec).{0,50}(porta|janela)/.test(t)) return 'instalacoes';
    if (/estrutura|placa|chapa|met[aá]lic|drywall|parede|nivelamento|alinhamento|fechamento/.test(t)) return 'estrutura';
    if (/tenda|lona|porta de acesso|infraestrutura/.test(t)) return 'estrutura';
    return 'outros';
}

function _reescreverItemCompleto(item, variante) {
    const { texto, fatos } = _protegerFatosOrcamento(item);
    const v0 = [
        [/montagem da estrutura met[aá]lica para paredes(?: em drywall)?/gi, 'Composicao e aprumo dos perfis metalicos que recebem o revestimento'],
        [/instala[cç][aã]o e fixa[cç][aã]o das placas de drywall/gi, 'Revestimento das faces com placas de gesso acartonado'],
        [/prepara[cç][aã]o e execu[cç][aã]o dos v[aã]os para porta e janela/gi, 'Abertura dos vaos nos pontos de porta e janela'],
        [/execu[cç][aã]o dos refor[cç]os estruturais necess[aá]rios para sustenta[cç][aã]o e fixa[cç][aã]o da porta e da janela/gi, 'Reforco dos perfis nos pontos de apoio da porta e da janela'],
        [/tratamento das juntas,?\s*aplica[cç][aã]o de fita e massa espec[ií]fica para drywall/gi, 'Emassamento das juntas com fita e composto proprio de gesso acartonado'],
        [/acabamentos necess[aá]rios ap[oó]s a montagem/gi, 'Arremates visuais apos o revestimento'],
        [/organiza[cç][aã]o e limpeza da [aá]rea ap[oó]s a conclus[aã]o dos servi[cç]os/gi, 'Recolhimento de sobras, arrumacao da area e liberacao do local'],
        [/fornecimento e instala[cç][aã]o de janela medindo/gi, 'Inclusao e colocacao de 1 janela nas medidas'],
        [/instala[cç][aã]o da porta/gi, 'Colocacao da folha de porta no vao preparado'],
        [/medindo\s+/gi, 'nas medidas '],
        [/espec[ií]fica para/gi, 'propria de'],
        [/foi confeccionada e preparada especificamente para/gi, 'chega pronta para receber'],
        [/fabrica[cç][aã]o e implementa[cç][aã]o no local/gi, 'producao e montagem em campo'],
        [/m[aã]o de obra especializada/gi, 'equipe tecnica contratada'],
        [/montagem e instala[cç][aã]o/gi, 'implantacao'],
    ];
    const v1 = [
        [/montagem da estrutura met[aá]lica para paredes(?: em drywall)?/gi, 'Instalacao da estrutura metalica'],
        [/instala[cç][aã]o e fixa[cç][aã]o das placas de drywall/gi, 'Montagem e fixacao das chapas de drywall'],
        [/prepara[cç][aã]o e execu[cç][aã]o dos v[aã]os para porta e janela/gi, 'Dimensionamento e execucao dos espacos destinados a porta e a janela'],
        [/execu[cç][aã]o dos refor[cç]os estruturais necess[aá]rios para sustenta[cç][aã]o e fixa[cç][aã]o da porta e da janela/gi, 'Reforco da estrutura metalica nos pontos de instalacao, para maior resistencia e estabilidade'],
        [/tratamento das juntas,?\s*aplica[cç][aã]o de fita e massa espec[ií]fica para drywall/gi, 'Aplicacao de fita nas juntas e massa propria para tratamento de drywall'],
        [/acabamentos necess[aá]rios ap[oó]s a montagem/gi, 'Correcoes e arremates necessarios apos a montagem, com acabamento das areas trabalhadas'],
        [/organiza[cç][aã]o e limpeza da [aá]rea ap[oó]s a conclus[aã]o dos servi[cç]os/gi, 'Organizacao dos materiais e ferramentas, limpeza da area utilizada e entrega do local organizado'],
        [/fornecimento e instala[cç][aã]o de janela medindo/gi, 'Fornecimento e instalacao de 01 janela de'],
        [/placas de drywall/gi, 'chapas de drywall'],
        [/medindo\s+/gi, 'de '],
        [/espec[ií]fica para/gi, 'propria para'],
        [/foi confeccionada e preparada especificamente para/gi, 'foi construida sob medida para'],
        [/fabrica[cç][aã]o e implementa[cç][aã]o no local/gi, 'execucao in loco'],
    ];
    let out = _aplicarTrocas(texto, variante % 2 === 0 ? v0 : v1);
    out = _restaurarFatosOrcamento(out || texto, fatos);
    return _capFrase(out.replace(/[.;]\s*$/, ''));
}

function _tituloVariante(info, variante) {
    if (variante % 2 === 0) {
        if (info.drywall) return 'ESPECIFICACAO TECNICA DE SERVICOS\n\nParede em drywall com porta e janela';
        if (info.tenda) return 'ESPECIFICACAO TECNICA DE SERVICOS\n\nTenda e infraestrutura no local';
        if (info.forro) return 'ESPECIFICACAO TECNICA DE SERVICOS\n\nExecucao de forro';
        if (info.vidro) return 'ESPECIFICACAO TECNICA DE SERVICOS\n\nEsquadrias e vidros';
        return 'ESPECIFICACAO TECNICA DE SERVICOS';
    }
    if (info.drywall) return 'PROPOSTA DE SERVICOS\n\nMONTAGEM DE PAREDE EM DRYWALL';
    if (info.tenda) return 'PROPOSTA DE SERVICOS\n\nLOCACAO DE TENDA E INFRAESTRUTURA';
    if (info.forro) return 'PROPOSTA DE SERVICOS\n\nEXECUCAO DE FORRO';
    if (info.vidro) return 'PROPOSTA DE SERVICOS\n\nESQUADRIAS E VIDROS';
    return 'PROPOSTA DE SERVICOS';
}

function _introVariante(info, variante) {
    let txt;
    if (variante % 2 === 0) {
        if (info.drywall) {
            txt = 'Trata-se da contratacao de equipe especializada para implantar o sistema de gesso acartonado no ambiente indicado';
            if (info.porta && info.janela) txt += ', com abertura e colocacao dos esquadros de porta e janela previstos';
            else if (info.porta) txt += ', com colocacao da porta prevista';
            else if (info.janela) txt += ', com colocacao da janela prevista';
            txt += '. O trabalho segue em etapas, da estruturacao ate a liberacao do local.';
        } else if (info.tenda) {
            txt = 'Contrato de fornecimento e montagem de tenda com a infraestrutura descrita, organizado por etapas de campo.';
        } else {
            txt = 'Contrato de execucao tecnica organizado por etapas, cobrindo o mesmo escopo, medidas e pecas informados no pedido.';
        }
    } else {
        const alvo = info.drywall
            ? 'implantacao de estrutura em drywall'
            : info.tenda
                ? 'fornecimento de tenda e infraestrutura no local'
                : 'execucao dos servicos previstos no pedido';
        txt = 'Apresentamos proposta para execucao completa dos servicos relacionados a ' + alvo;
        if (info.porta && info.janela) {
            txt += ', contemplando a montagem do sistema, preparacao das aberturas e instalacao dos elementos previstos';
        } else if (info.porta) {
            txt += ', contemplando a instalacao da porta prevista';
        } else if (info.janela) {
            txt += ', contemplando a instalacao da janela prevista';
        }
        txt += '.';
    }
    if (info.datas.length >= 2) txt += ' Periodo: ' + info.datas[0] + ' a ' + info.datas[1] + '.';
    else if (info.datas.length === 1) txt += ' Data de referencia: ' + info.datas[0] + '.';
    if (info.local) txt += ' Local: ' + info.local + '.';
    return txt;
}

function _fechamentoVariante(info, variante) {
    const dimJanela = info.dimensoes[0] || '';
    const janelaTxt = info.incluiJanela && dimJanela
        ? 'fornecimento da janela de ' + dimJanela
        : (info.incluiJanela ? 'fornecimento da janela prevista' : '');
    if (variante % 2 === 0) {
        let a = 'A composicao de preco cobre a equipe de execucao de todas as etapas';
        if (janelaTxt) a += ' e a peca de janela' + (dimJanela ? ' nas medidas ' + dimJanela : '');
        a += '.';
        return a + '\n\nO atendimento e integral, conforme a situacao encontrada em campo, sem alterar as medidas, pecas e quantitativos do pedido.';
    }
    let a = 'O orcamento contempla a mao de obra especializada para todos os servicos relacionados acima';
    if (janelaTxt) a += ', incluindo o fornecimento e instalacao da janela' + (dimJanela ? ' de ' + dimJanela : '');
    a += '.';
    return a + '\n\nEsta proposta considera a execucao integral do servico de acordo com as caracteristicas e necessidades da instalacao.';
}

function _montarTextoConcorrente(info, variante) {
    const itens = (info.itens && info.itens.length ? info.itens : [info.intro || info.titulo || 'Servicos conforme pedido'])
        .map((l) => _reescreverItemCompleto(l, variante));
    const titulo = _tituloVariante(info, variante);
    const intro = _introVariante(info, variante);
    const fecha = _fechamentoVariante(info, variante);

    if (variante % 2 === 0) {
        const etapas = [
            { chave: 'estrutura', titulo: 'Etapa 1 - Preparo e estruturacao' },
            { chave: 'aberturas', titulo: 'Etapa 2 - Aberturas e reforcos' },
            { chave: 'instalacoes', titulo: 'Etapa 3 - Esquadros e pecas' },
            { chave: 'acabamento', titulo: 'Etapa 4 - Tratamento superficial' },
            { chave: 'finalizacao', titulo: 'Etapa 5 - Entrega do ambiente' },
            { chave: 'outros', titulo: 'Etapa complementar' }
        ];
        const buckets = {};
        etapas.forEach((e) => { buckets[e.chave] = []; });
        itens.forEach((item, i) => {
            const chave = _classificarItemEscopo(info.itens[i] || item);
            (buckets[chave] || buckets.outros).push(item);
        });
        const bloco = [titulo, '', 'Resumo', '', intro, '', 'Cronograma de etapas'];
        let n = 1;
        etapas.forEach((e) => {
            const lista = buckets[e.chave];
            if (!lista.length) return;
            const rotulo = e.chave === 'outros' ? ('Etapa ' + n + ' - Demais atividades') : e.titulo.replace(/Etapa \d+/, 'Etapa ' + n);
            n += 1;
            bloco.push('', rotulo);
            bloco.push(lista.join('; ') + '.');
        });
        bloco.push('', 'Abrangencia comercial', '', fecha);
        return bloco.join('\n');
    }

    const grupos = {
        estrutura: { titulo: 'Estrutura e fechamento', itens: [] },
        aberturas: { titulo: 'Aberturas e reforcos', itens: [] },
        instalacoes: { titulo: 'Instalacoes', itens: [] },
        acabamento: { titulo: 'Tratamento e acabamento', itens: [] },
        finalizacao: { titulo: 'Finalizacao', itens: [] },
        outros: { titulo: 'Servicos previstos', itens: [] }
    };
    itens.forEach((item, i) => {
        const chave = _classificarItemEscopo(info.itens[i] || item);
        (grupos[chave] || grupos.outros).itens.push(item);
    });
    const bloco = [titulo, '', intro, '', 'O que esta incluido'];
    Object.keys(grupos).forEach((chave) => {
        const g = grupos[chave];
        if (!g.itens.length) return;
        bloco.push('', g.titulo, '');
        g.itens.forEach((item) => bloco.push('- ' + item));
    });
    bloco.push('', 'Investimento', '', fecha);
    return bloco.join('\n');
}

function gerarTextoConcorrenteAuto(textoBase, variante = 0) {
    try {
        const original = _sanitizarTextoOrcamento((textoBase || '').trim());
        if (!original) return '';
        const info = _analisarOrcamentoOriginal(original);
        return _montarTextoConcorrente(info, variante % 2);
    } catch (_) {
        return _sanitizarTextoOrcamento(textoBase || '');
    }
}

// Função para processar imagem e manter orientação original
async function processarImagem(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Determinar a orientação correta
                let width = img.width;
                let height = img.height;

                // Configurar canvas com as dimensões corretas
                canvas.width = width;
                canvas.height = height;

                // Desenhar a imagem mantendo a orientação original
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 1.0));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function gerarRelatoriosTecnicos(relatorios) {
    const { jsPDF } = window.jspdf;
    pdfsRelatoriosGerados = {};
    const progressBar = document.getElementById('progressBarRelatorio');
    const statusMessage = document.getElementById('statusMessageRelatorio');
    const pdfsDisplay = document.getElementById('pdfsRelatoriosDisplay');
    pdfsDisplay.innerHTML = '';
    if (progressBar) progressBar.style.width = '0%';
    if (statusMessage) statusMessage.innerHTML = `<p>Gerando relatórios para ${relatorios.length} igrejas...</p>`;

    for (let i = 0; i < relatorios.length; i++) {
        const rel = relatorios[i];
        if (progressBar) progressBar.style.width = `${(i / relatorios.length) * 100}%`;
        if (statusMessage) statusMessage.innerHTML = `<p>Processando relatório ${i + 1}/${relatorios.length}: ${rel.nome}</p>`;

        // Criar novo PDF
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Primeira página - Texto
        // Título centralizado e em negrito
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(`RELATÓRIO TÉCNICO - ${rel.nome.toUpperCase()}`, 105, 20, { align: 'center' });

        // Texto principal
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        let y = 35;

        // Se houver texto personalizado, usa-o e ignora as variações/padrões
        if (rel.textoPersonalizado && rel.textoPersonalizado.trim()) {
            const linhasPers = pdf.splitTextToSize(rel.textoPersonalizado.trim(), 185);
            for (const linha of linhasPers) {
                pdf.text(linha, 13, y);
                y += 5;
            }
        } else if (rel.tipoRelatorio === 'manutencao') {
            // Se for relatório de manutenção, gera texto com variações
            // Gera texto para cada seção com variações
            const secoes = [
                'Caixas de Som',
                'Amplificadores',
                'Mesa de Som',
                'Microfone sem Fio',
                'Microfone Gooseneck',
                'Caixa de Retorno'
            ];

            // Adiciona numeração e gera variação para cada seção
            for (let j = 0; j < secoes.length; j++) {
                const secao = secoes[j];
                const numero = j + 1;

                // Adiciona título da seção
                pdf.text(`${numero}. ${secao}`, 13, y);
                y += 7;

                // Gera e adiciona texto da seção
                const textoSecao = gerarVariacaoTexto(secao);
                const linhas = pdf.splitTextToSize(textoSecao, 185);
                for (const linha of linhas) {
                    pdf.text(linha, 13, y);
                    y += 5;
                }
                y += 3; // Espaço extra entre seções
            }

            // Adiciona conclusão
            y += 2;
            pdf.text('Conclusão', 13, y);
            y += 7;
            const textoConclusao = gerarVariacaoTexto('Conclusão');
            const linhasConclusao = pdf.splitTextToSize(textoConclusao, 185);
            for (const linha of linhasConclusao) {
                pdf.text(linha, 13, y);
                y += 5;
            }
        } else {
            // Se for igreja nova, usa o texto padrão
            const textoRelatorio = TEXTOS_RELATORIO[rel.tipoRelatorio];
            const linhas = pdf.splitTextToSize(textoRelatorio, 185);
            for (const linha of linhas) {
                pdf.text(linha, 13, y);
                y += 5;
            }
        }

        // Forçar nova página para as fotos (apenas um addPage)
        pdf.addPage();

        // Segunda página - Fotos
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('FOTOS DA IGREJA', 105, 20, { align: 'center' });

        // Configuração para o grid de imagens
        const margemLateral = 20;
        const margemSuperior = 40;
        const espacamento = 10;
        const larguraUtil = 170;
        const alturaUtil = 220; // Voltando para o tamanho original pois agora temos uma página inteira

        // Ajusta o layout baseado no número de imagens
        const totalImgs = Math.min(rel.imagens.length, 5); // Permite até 5 imagens
        let larguraImagem, alturaImagem;

        if (totalImgs <= 2) {
            // Para 1 ou 2 imagens: layout 1x2
            larguraImagem = (larguraUtil - espacamento) / 2;
            alturaImagem = alturaUtil / 2;
        } else if (totalImgs <= 4) {
            // Para 3 ou 4 imagens: layout 2x2
            larguraImagem = (larguraUtil - espacamento) / 2;
            alturaImagem = (alturaUtil - espacamento) / 2;
        } else {
            // Para 5 imagens: layout especial (2 em cima, 3 embaixo)
            larguraImagem = (larguraUtil - 2 * espacamento) / 3;
            alturaImagem = (alturaUtil - espacamento) / 2;
        }

        // Posiciona as imagens de acordo com o layout
        for (let idx = 0; idx < totalImgs; idx++) {
            let x, y;

            if (totalImgs <= 2) {
                // Layout 1x2
                x = margemLateral + idx * (larguraImagem + espacamento);
                y = margemSuperior + (alturaUtil - alturaImagem) / 2;
            } else if (totalImgs <= 4) {
                // Layout 2x2
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                x = margemLateral + col * (larguraImagem + espacamento);
                y = margemSuperior + row * (alturaImagem + espacamento);
            } else {
                // Layout especial para 5 imagens
                if (idx < 2) {
                    // Duas imagens maiores em cima
                    x = margemLateral + idx * (larguraUtil / 2 + espacamento / 2);
                    y = margemSuperior;
                    larguraImagem = (larguraUtil - espacamento) / 2;
                } else {
                    // Três imagens menores embaixo
                    x = margemLateral + (idx - 2) * (larguraUtil / 3 + espacamento / 2);
                    y = margemSuperior + alturaUtil / 2 + espacamento;
                    larguraImagem = (larguraUtil - 2 * espacamento) / 3;
                }
            }

            // Processa a imagem mantendo a orientação original
            const imgData = await processarImagem(rel.imagens[idx]);
            const props = await getImageProps(imgData);

            // Calcula as dimensões mantendo a proporção original
            const ratio = Math.min(
                larguraImagem / props.width,
                alturaImagem / props.height
            );

            const w = props.width * ratio;
            const h = props.height * ratio;

            // Centraliza a imagem no seu espaço
            const finalX = x + (larguraImagem - w) / 2;
            const finalY = y + (alturaImagem - h) / 2;

            // Adiciona a imagem sem compressão e mantendo a orientação original
            pdf.addImage(imgData, 'JPEG', finalX, finalY, w, h, undefined, 'NONE');
        }

        pdfsRelatoriosGerados[`relatorio_${i}`] = { nome: rel.nome, pdf };

        // Atualiza interface
        const card = document.createElement('div');
        card.className = 'pdf-card';
        card.innerHTML = `
            <div class='igreja-info'>
                <h3>${rel.nome}</h3>
                <p>Tipo: ${rel.tipoRelatorio === 'igreja_nova' ? 'Igreja Nova' : 'Manutenção'}</p>
            </div>
            <div class='download-buttons'>
                <button class='btn-download' onclick='baixarPDFRelatorio(${i})'>Baixar Relatório</button>
            </div>`;
        pdfsDisplay.appendChild(card);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (progressBar) progressBar.style.width = '100%';
    if (statusMessage) statusMessage.innerHTML = `<p>Todos os relatórios foram gerados com sucesso!</p>`;
    document.getElementById('downloadAllRelatoriosBtn').disabled = false;
}

function fitAspect(origW, origH, maxW, maxH) {
    let ratio = Math.min(maxW / origW, maxH / origH);
    return { w: origW * ratio, h: origH * ratio };
}

function getImageProps(dataUrl) {
    return new Promise(resolve => {
        const img = new window.Image();
        img.onload = function () {
            resolve({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

function baixarPDFRelatorio(idx) {
    const dados = pdfsRelatoriosGerados[`relatorio_${idx}`];
    if (dados && dados.pdf) {
        dados.pdf.save(`Relatorio_Tecnico_${dados.nome}.pdf`);
    }
}

async function baixarTodosRelatorios() {
    try {
        // Verifica se há relatórios para baixar
        const keys = Object.keys(pdfsRelatoriosGerados);
        if (keys.length === 0) {
            alert('Nenhum relatório foi gerado ainda!');
            return;
        }

        const JSZip = window.JSZip;
        if (!JSZip) {
            alert('Erro: Biblioteca JSZip não carregada.');
            return;
        }

        const zip = new JSZip();

        for (const key of keys) {
            const dados = pdfsRelatoriosGerados[key];
            if (dados && dados.pdf) {
                const pdfBlob = dados.pdf.output('blob');
                zip.file(`Relatorio_Tecnico_${dados.nome}.pdf`, pdfBlob);
            }
        }

        const zipContent = await zip.generateAsync({ type: 'blob' });
        saveAs(zipContent, 'Relatorios_Tecnicos.zip');

        console.log('✅ Relatórios baixados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao baixar relatórios:', error);
        alert('Erro ao baixar relatórios: ' + error.message);
    }
}

// Expõe a função globalmente
window.baixarTodosRelatorios = baixarTodosRelatorios;

// Adiciona o event listener quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
    const btnDownloadAll = document.getElementById('downloadAllRelatoriosBtn');
    if (btnDownloadAll) {
        btnDownloadAll.addEventListener('click', baixarTodosRelatorios);
    }
});

// Função para inicializar o sistema de abas
function inicializarAbas() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    function mostrarAba(tabId) {
        // Esconde todos os conteúdos
        contents.forEach(content => {
            content.style.display = 'none';
        });

        // Remove a classe active de todas as abas
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Mostra o conteúdo selecionado
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) {
            selectedContent.style.display = 'block';
        }

        // Adiciona a classe active na aba selecionada
        const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Se for a aba de Notas Fiscais, atualiza a lista
        if (tabId === 'notasFiscais' && window.atualizarListaNF) {
            window.atualizarListaNF();
        }

        // Se for a aba de Pagamento, renderiza
        if (tabId === 'pagamento' && window.renderizarAbaPagamento) {
            setTimeout(window.renderizarAbaPagamento, 50);
        }

        // Se for a aba de Prévia de Material, renderiza
        if (tabId === 'previaMaterial' && window.renderizarAbaPrevia) {
            setTimeout(window.renderizarAbaPrevia, 50);
        }
    }

    // Adiciona os event listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            mostrarAba(tabId);
        });
    });

    // Mostra a aba Home por padrão (tela inicial)
    mostrarAba('home');
}

// Inicializa tudo quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando sistema...");

    // Inicializa a interface e outros componentes
    if (typeof inicializarInterface === 'function') {
        inicializarInterface();
    } else {
        console.error("Função inicializarInterface não encontrada!");
    }

    // Inicializa o sistema de upload de logos
    inicializarUploadLogos();

    // Inicializa logos já existentes no DOM
    inicializarLogos();

    // Inicializa o gerador de orçamentos
    iniciarGeracaoOrcamentos();
    inicializarDownloadZip();

    inicializarRelatorioTecnico();

    if (typeof inicializarCheckboxesConcorrentes === 'function') {
        inicializarCheckboxesConcorrentes();
    }

    inicializarAbas();

    // Inicializa o gerenciador de pagamentos
    if (typeof inicializarPagamento === 'function') {
        inicializarPagamento();
    }

    // Inicializa o gerenciador de estoque
    if (typeof inicializarEstoque === 'function') {
        inicializarEstoque();
    }

    // Inicializa a Home (tela inicial com pesquisa)
    if (typeof inicializarHome === 'function') {
        inicializarHome();
    }

    // Inicializa o gerenciador de prévia de material
    if (typeof inicializarPrevia === 'function') {
        inicializarPrevia();
    }

    // Inicializa o sistema de pasta de trabalho
    inicializarPastaTrabalho();

    // Event listener para o botão de escolher pasta
    const btnEscolherPasta = document.getElementById('escolherPastaTrabalho');
    if (btnEscolherPasta) {
        btnEscolherPasta.addEventListener('click', escolherPastaTrabalho);
    }

    // Garante que o listener de sync do Firebase seja iniciado
    // (firebase-config.js já tenta auto-iniciar na conexão, mas chamamos aqui como fallback)
    if (typeof firebaseDB !== 'undefined' && typeof firebaseDB.disponivel === 'function' && firebaseDB.disponivel()) {
        if (!window._syncIniciado) {
            window._syncIniciado = true;
            if (typeof firebaseDB.iniciarSync === 'function') {
                firebaseDB.iniciarSync();
                console.log('🔄 Sincronização Firebase iniciada no DOMContentLoaded');
            }
        }
    }

    console.log("Sistema inicializado com sucesso!");
}); 