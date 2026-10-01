// Importação de orçamento em PDF: extrai texto/valores e preenche o formulário

function _pdfImportStatus(msg, isErro) {
    const el = document.getElementById('statusPdfOrcamentoImportar');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isErro ? '#c41e3a' : '#64748b';
}

function _pdfLibPronto() {
    return typeof window.pdfjsLib !== 'undefined' && window.pdfjsLib.getDocument;
}

function _configurarPdfJsWorker() {
    if (!_pdfLibPronto()) return false;
    try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return true;
    } catch (_) {
        return false;
    }
}

async function extrairTextoDePdfArquivo(file) {
    if (!_configurarPdfJsWorker()) {
        throw new Error('Biblioteca de PDF não carregou. Recarregue a página e tente de novo.');
    }
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const paginas = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let linha = '';
        const linhas = [];
        (content.items || []).forEach((it) => {
            linha += (it.str || '');
            if (it.hasEOL) {
                linhas.push(linha.trim());
                linha = '';
            } else {
                linha += ' ';
            }
        });
        if (linha.trim()) linhas.push(linha.trim());
        paginas.push(linhas.filter(Boolean).join('\n'));
    }
    return paginas.join('\n\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function extrairValoresMonetariosDoTexto(texto) {
    const re = /R\$\s*\d{1,3}(?:[.\s\u00a0]\d{3})*(?:,\d{2})?|R\$\s*\d+(?:,\d{2})?|\d{1,3}(?:\.\d{3})+,\d{2}/gi;
    const vals = [];
    const visto = new Set();
    let m;
    const blob = String(texto || '');
    while ((m = re.exec(blob))) {
        const raw = m[0];
        const n = (typeof parseValorManualBR === 'function') ? parseValorManualBR(raw) : NaN;
        if (isNaN(n) || n <= 0) continue;
        const chave = n.toFixed(2);
        if (visto.has(chave)) continue;
        visto.add(chave);
        vals.push({ raw, valor: n });
    }
    vals.sort((a, b) => b.valor - a.valor);
    return vals;
}

function _preencherSelect(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = valor;
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function aplicarTextoPdfNoFormulario(texto, valorTotal) {
    const txtSua = document.getElementById('textoOrcamentoSuaEmpresa');
    if (txtSua) txtSua.value = texto;

    _preencherSelect('tipoTexto', 'personalizado');
    _preencherSelect('tipoPedido', 'especial');
    _preencherSelect('tipoValorOrcamento', 'manual');

    const elValor = document.getElementById('valorManual');
    if (elValor && valorTotal != null && !isNaN(valorTotal)) {
        elValor.value = Number(valorTotal).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    const txtConc = document.getElementById('textoOrcamentoConcorrente');
    const txtConc2 = document.getElementById('textoOrcamentoConcorrente2');
    if (typeof gerarTextoConcorrenteAuto === 'function' && texto) {
        if (txtConc) txtConc.value = gerarTextoConcorrenteAuto(texto, 0);
        if (txtConc2) txtConc2.value = gerarTextoConcorrenteAuto(texto, 1);
    }

    if (typeof atualizarVisibilidadeTextoOrcamento === 'function') {
        atualizarVisibilidadeTextoOrcamento();
    }
    if (typeof aplicarPadraoPedidoEspecial === 'function') {
        aplicarPadraoPedidoEspecial();
    }
}

async function importarOrcamentoPdf(file) {
    if (!file) return;
    _pdfImportStatus('Lendo PDF...');
    try {
        const texto = await extrairTextoDePdfArquivo(file);
        if (!texto || texto.length < 20) {
            throw new Error('Não foi possível ler texto neste PDF. Use um arquivo com texto selecionável, não uma imagem escaneada.');
        }
        const valores = extrairValoresMonetariosDoTexto(texto);
        const total = valores.length ? valores[0].valor : null;
        aplicarTextoPdfNoFormulario(texto, total);
        const fmt = (typeof formatarMoeda === 'function' && total != null)
            ? formatarMoeda(total)
            : (total != null ? ('R$ ' + total.toFixed(2)) : 'não encontrado');
        _pdfImportStatus('PDF importado. Valor detectado: ' + fmt + '. Confira os campos e clique em Adicionar Igreja.');
    } catch (e) {
        console.error('Erro ao importar PDF de orçamento:', e);
        _pdfImportStatus(e && e.message ? e.message : 'Falha ao ler o PDF.', true);
    }
}

function inicializarImportacaoPdfOrcamento() {
    const input = document.getElementById('pdfOrcamentoImportar');
    if (!input || input.dataset.init) return;
    input.dataset.init = '1';
    input.addEventListener('change', function () {
        const file = this.files && this.files[0];
        if (!file) return;
        importarOrcamentoPdf(file);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarImportacaoPdfOrcamento);
} else {
    inicializarImportacaoPdfOrcamento();
}

window.importarOrcamentoPdf = importarOrcamentoPdf;
window.inicializarImportacaoPdfOrcamento = inicializarImportacaoPdfOrcamento;
