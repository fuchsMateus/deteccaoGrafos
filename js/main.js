import { escalaCinza, suavizacaoGaussiana, filtroSobel, binarizar, removerRotulos, inverterCores } from './preprocessamento.js';
import { fechamento, afinar } from './op_morfologico.js';
import { criarAcumulador, votacao, picosNMS } from './houghCirculos.js';
import { aumentarBorda, detectarLinhas, corFundoImg, corContornoImgBinaria } from './util.js'


const maxTamanhoImagem = 480;

const radioMin = document.getElementById('radio-min');
const radioPeq = document.getElementById('radio-peq');
const radioMed = document.getElementById('radio-med');

const canvas = document.getElementById('imagem-canvas');
const canvasPre = document.getElementById('preprocessamento-canvas')
const ctx = canvas.getContext('2d');
const ctxPre = canvasPre.getContext('2d');

const btnProcessar = document.getElementById('btn-processar');
const listaAdjacencias = document.getElementById('lista-adjacencias');


let img;

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
            listaAdjacencias.hidden = true;


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
    //Pré-processamento
    escalaCinza(imageData);
    binarizar(imageData, w, h);
    removerRotulos(imageData, w, h);
    let imageDataArestas = new ImageData(new Uint8ClampedArray(imageData.data), w, h);
    suavizacaoGaussiana(imageData, w, h);
    filtroSobel(imageData, w, h);
    binarizar(imageData, w, h);
    fechamento(imageData, w, h);
    afinar(imageData, w, h);
    //


    if (corContornoImgBinaria(imageDataArestas) == 0) inverterCores(imageDataArestas);
    afinar(imageDataArestas, w, h);


    let vertices = getVertices(imageData, w, h);
    if (vertices) {
        let arestas = getArestas(imageDataArestas, w, h, vertices);
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
        listaAdjacencias.hidden = false;

    }
    else {
        ctxPre.fillStyle = "red";
        ctxPre.font = "10px Arial";
        ctxPre.fillText("Nenhum vértice encontrado.", (w / 2) - 17, (h / 2) + 8);
    }


}

function getVertices(imageData, w, h) {
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

        let vertices = candidatos.filter((circulo, _, arr) =>
            !arr.some(outro => circulo !== outro && circulosSeInterceptam(circulo, outro) && circulo.r == outro.r)
        );

        if (vertices.length > 0) {
            vertices.forEach((c, indice) => {
                c.rotulo = '' + indice;
            })
            return vertices;
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
        if (radioMin.checked) ctxTemp.arc(v.a, v.b, v.r + 35 / v.r, 0, 2 * Math.PI);
        else if (radioPeq.checked) ctxTemp.arc(v.a, v.b, v.r + 50 / v.r, 0, 2 * Math.PI);
        else if (radioMed.checked) ctxTemp.arc(v.a, v.b, v.r + 70 / v.r, 0, 2 * Math.PI);
        else ctxTemp.arc(v.a, v.b, v.r + 120 / v.r, 0, 2 * Math.PI);
        
        ctxTemp.fill();
        ctxTemp.stroke();
    });

    let lData = ctxTemp.getImageData(0, 0, w, h);
    binarizar(lData, w, h);
    //ctx.putImageData(lData, 0, 0);
    let linhas = detectarLinhas(lData, w, h);
    //console.log(linhas)
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

    let resultado = '<code> Lista de Adjacências <i>{</i>\n';
    for (const chave in listaAdjacencias) {
        const valores = listaAdjacencias[chave].map((e) => "<b>" + e + "</b>").join(', ');

        resultado += `  <i>"${chave}"</i>: <u>[</u>${valores}<u>]</u>,\n`;
    }
    resultado += '<i>}</i> </code>';

    document.getElementById('lista-adjacencias').innerHTML = resultado;
}