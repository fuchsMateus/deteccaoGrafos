import { escalaCinza, suavizacaoGaussiana, filtroSobel, binarizar, removerRotulos } from './preprocessamento.js';
import { fechamento, afinar } from './op_morfologico.js';
import { criarAcumulador, votacao, picosNMS } from './houghCirculos.js';
import { aumentarBorda, detectarLinhas, corFundoImg } from './util.js'


const maxTamanhoImagem = 480;

const radioMin = document.getElementById('radio-min');
const radioPeq = document.getElementById('radio-peq');
const radioMed = document.getElementById('radio-med');

const canvas = document.getElementById('imagem-canvas');
const canvasPre = document.getElementById('preprocessamento-canvas')
const ctx = canvas.getContext('2d');
const ctxPre = canvasPre.getContext('2d');

const btnProcessar = document.getElementById('btn-processar');

let img;
let limiar;
const inputLb = document.getElementById('input-lb');

function rangeListener() {
    document.getElementById('label-lb').innerText = `Limiar de Binarização = ${inputLb.value}`;
}
rangeListener();
inputLb.addEventListener('input', rangeListener);

document.getElementById('input-imagem').addEventListener('change', function (e) {
    let reader = new FileReader();

    reader.onload = function (event) {
        img = new Image();
        img.onload = function () {
            let razao = img.height / img.width;
            if (img.height > maxTamanhoImagem || img.width > maxTamanhoImagem) {
                if (razao > 1) {
                    canvas.height = maxTamanhoImagem;
                    canvas.width = maxTamanhoImagem / razao;
                } else {
                    canvas.width = maxTamanhoImagem;
                    canvas.height = maxTamanhoImagem * razao;
                }
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            document.getElementById('msg').hidden = true;
            document.getElementById('lista-adjacencias').innerHTML = '';


            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let cor = corFundoImg(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height);
            aumentarBorda(canvas, `rgb(${cor[0]},${cor[1]},${cor[2]})`);

            canvasPre.width = canvas.width;
            canvasPre.height = canvas.height;
            ctxPre.clearRect(0, 0, canvas.width, canvas.height);

            btnProcessar.onclick = () => {
                btnProcessar.setAttribute('aria-busy', 'true');
                setTimeout(() => {
                    processar()
                        .finally(() => {
                            btnProcessar.removeAttribute('aria-busy');
                        });
                }, 10);
            };

        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

async function processar() {
    const w = canvas.width;
    const h = canvas.height;
    ctxPre.clearRect(0, 0, w, h);
    let imageData = ctx.getImageData(0, 0, w, h);
    limiar = inputLb.value;
    //Pré-processamento
    escalaCinza(imageData);
    binarizar(imageData, limiar);
    removerRotulos(imageData, w, h);
    suavizacaoGaussiana(imageData, w, h);
    filtroSobel(imageData, w, h);
    binarizar(imageData, limiar);
    fechamento(imageData, w, h);
    afinar(imageData, w, h);
    //

    let circulos = getCirculos(imageData, w, h);
    if (circulos) {
        const rotulosPromises = circulos.map(extrairRotuloDeCirculo);
        const rotulos = await Promise.all(rotulosPromises);
        const vertices = circulos.map((circulo, index) => ({ ...circulo, rotulo: rotulos[index] }));

        if (vertices.every((v) => v.rotulo.length == 0)) {
            vertices.forEach((v, indice) => {
                v.rotulo = ''+indice;
            });
        }

        let arestas = getArestas(imageData, w, h, vertices);
        ctxPre.strokeStyle = 'red';
        ctxPre.lineWidth = 1;

        vertices.forEach(v => {
            ctxPre.beginPath();
            ctxPre.arc(v.a, v.b, v.r, 0, 2 * Math.PI);
            
            ctxPre.fillStyle = "black";
            let tamanhoRotulo = Math.floor(v.r) - 1;
            ctxPre.font = tamanhoRotulo + "px Arial";
            ctxPre.fillText(v.rotulo, v.a - (tamanhoRotulo * v.rotulo.length) / 4, v.b + (tamanhoRotulo) / 3);
            
            ctxPre.stroke();
        });

        arestas.forEach(l => {
            ctxPre.strokeStyle = `rgb(${(Math.abs(l[0].x - l[1].x)) * 2},${(Math.abs(l[0].y - l[1].y)) * 2},
            ${255 - Math.sqrt((l[0].x - l[1].x) ** 2 + (l[0].y - l[1].y) ** 2)})`;
            ctxPre.beginPath();
            ctxPre.moveTo(l[0].x, l[0].y);
            ctxPre.lineTo(l[1].x, l[1].y);
            ctxPre.stroke();
        });

        gerarGrafo(arestas);
    }
    else {
        ctxPre.fillStyle = "red";
        ctxPre.font = "10px Arial";
        ctxPre.fillText("Nenhum vértice encontrado.", (w / 2) - 17, (h / 2) + 8);
    }

}

function getCirculos(imageData, w, h) {
    let razaoRaioMax;
    if (radioMin.checked) razaoRaioMax = 19;
    else if (radioPeq.checked) razaoRaioMax = 13;
    else if (radioMed.checked) razaoRaioMax = 9;
    else razaoRaioMax = 6;

    const [acumulador, valorMaximo] = votacao(criarAcumulador(w, h, razaoRaioMax), imageData);
    let picos = picosNMS(acumulador, valorMaximo);

    if (picos.length == 0) return;
    let circulos = [];
    let valoresRaios = {}
    picos.forEach(pico => {
        let [r, b, a] = pico;

        if (valoresRaios[r] == null) valoresRaios[r] = 1;
        else valoresRaios[r]++

        circulos.push({ r, b, a });
    });

    let raiosOrdenados = Object.entries(valoresRaios).sort((a, b) => b[1] - a[1]);

    function circulosSeInterceptam(c1, c2) {
        const distanciaCentros = Math.sqrt((c2.a - c1.a) ** 2 + (c2.b - c1.b) ** 2);
        return distanciaCentros < (c1.r + c2.r);
    }

    for (let [r, _] of raiosOrdenados) {
        let rInt = parseInt(r);
        let candidatos = circulos.filter(c => c.r >= rInt - 2 && c.r <= rInt + 2);

        let semSobreposicao = candidatos.filter((circulo, _, arr) =>
            !arr.some(outro => circulo !== outro && circulosSeInterceptam(circulo, outro) && circulo.r == outro.r)
        );

        if (semSobreposicao.length > 0) {
            return semSobreposicao;
        }
    }
}

function getArestas(imageData, w, h, vertices) {
    const canvasTemp = document.createElement('canvas');
    const ctxTemp = canvasTemp.getContext('2d');
    canvasTemp.width = w;
    canvasTemp.height = h;

    ctxTemp.putImageData(imageData, 0, 0);

    ctxTemp.strokeStyle = "black";
    ctxTemp.fillStyle = "black";
    ctxTemp.lineWidth = 1;

    vertices.forEach(v => {
        ctxTemp.beginPath();
        ctxTemp.arc(v.a, v.b, v.r + 50 / v.r, 0, 2 * Math.PI);
        ctxTemp.fill();
        ctxTemp.stroke();
    });

    let lData = ctxTemp.getImageData(0, 0, w, h);
    binarizar(lData, limiar);
    let linhas = detectarLinhas(lData, w, h);
    let arestas = [];
    let historicoArestas = new Set();

    linhas.forEach((linha) => {
        let menorDistanciaInicio = Infinity;
        let menorDistanciaFim = Infinity;
        let vInicio = -1;
        let vFim = -1;

        vertices.forEach((v, indice) => {
            const distInicio = Math.sqrt(Math.pow(v.a - linha[0].x, 2) + Math.pow(v.b - linha[0].y, 2));
            const distFim = Math.sqrt(Math.pow(v.a - linha[1].x, 2) + Math.pow(v.b - linha[1].y, 2));

            if (distInicio < menorDistanciaInicio) {
                menorDistanciaInicio = distInicio;
                vInicio = indice;
            }

            if (distFim < menorDistanciaFim) {
                menorDistanciaFim = distFim;
                vFim = indice;
            }
        });

        if (vInicio !== vFim) {
                let chaveAresta = [vertices[vInicio].rotulo, vertices[vFim].rotulo].sort().join('-');
                if (!historicoArestas.has(chaveAresta)) {
                    historicoArestas.add(chaveAresta);
                    arestas.push([linha[0], linha[1], vertices[vInicio].rotulo, vertices[vFim].rotulo]);
                }
            
            
        }
    });

    return arestas;
}

async function extrairRotuloDeCirculo(circulo) {
    const lado = circulo.r * Math.sqrt(2) * 0.9;
    const canvasTesseract = document.createElement('canvas');
    const ctxTesseract = canvasTesseract.getContext('2d');

    canvasTesseract.width = lado;
    canvasTesseract.height = lado;

    ctxTesseract.drawImage(canvas, circulo.a - lado / 2, circulo.b - lado / 2, lado, lado, 0, 0, lado, lado);

    const imgUrl = canvasTesseract.toDataURL();
    const worker = await Tesseract.createWorker('eng');

    await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
    });

    const { data: { text } } = await worker.recognize(imgUrl);
    await worker.terminate();

    return text.trim();
}

function gerarGrafo(arestas) {
    const listaAdjacencias = {};

    arestas.forEach(([_, __, vInicio, vFim]) => {
        if (!listaAdjacencias[vInicio]) {
            listaAdjacencias[vInicio] = [];
        }
        listaAdjacencias[vInicio].push(vFim);

        if (!listaAdjacencias[vFim]) {
            listaAdjacencias[vFim] = [];
        }
        listaAdjacencias[vFim].push(vInicio);
    });

    const grafoJson = JSON.stringify(listaAdjacencias, null, 2);
    document.getElementById('lista-adjacencias').innerHTML = "Lista de Adjacências " + grafoJson;
}