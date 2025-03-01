//main.js
import { escalaCinza, suavizacaoGaussiana, filtroSobel, binarizar, removerRotulos, inverterCores } from './preprocessamento.js';
import { fechamento, afinar } from './op_morfologico.js';
import { criarAcumulador, votacao, picosNMS } from './houghCirculos.js';
import { aumentarBorda, corFundoImg, corContornoImgBinaria } from './util.js'
import { detectarLinhas} from './detectar_linhas.js'


const maxTamanhoImagem = 480;

const radioMin = document.getElementById('radio-min');
const radioPeq = document.getElementById('radio-peq');
const radioMed = document.getElementById('radio-med');

const canvas = document.getElementById('imagem-canvas');
const canvasBin = document.getElementById('escala-cinza-canvas')
const canvasAfinado = document.getElementById('afinado-canvas')
const canvasPre = document.getElementById('preprocessamento-canvas')
const ctx = canvas.getContext('2d');
const ctxBin = canvasBin.getContext('2d');
const ctxAfinado = canvasAfinado.getContext('2d');
const ctxPre = canvasPre.getContext('2d');

const btnProcessar = document.getElementById('btn-processar');
const listaAdjacencias = document.getElementById('lista-adjacencias');


let img;
let nome_imagem
let tamanhoVertice;
let desenhado;

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

            canvasBin.width = canvas.width;
            canvasBin.height = canvas.height;
            ctxBin.clearRect(0, 0, canvas.width, canvas.height);

            canvasAfinado.width = canvas.width;
            canvasAfinado.height = canvas.height;
            ctxAfinado.clearRect(0, 0, canvas.width, canvas.height);

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
    nome_imagem = e.target.files[0].name;
});

document.addEventListener('paste', function(e) {
    const clipboardItems = e.clipboardData.items;
    for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf("image") !== -1) {
            const file = clipboardItems[i].getAsFile();
            if (file) {
                let reader = new FileReader();
                reader.onload = function(event) {
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

                        canvasBin.width = canvas.width;
                        canvasBin.height = canvas.height;
                        ctxBin.clearRect(0, 0, canvas.width, canvas.height);

                        canvasAfinado.width = canvas.width;
                        canvasAfinado.height = canvas.height;
                        ctxAfinado.clearRect(0, 0, canvas.width, canvas.height);

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
                reader.readAsDataURL(file);
            }
        }
    }
});

async function processar() {
    const w = canvas.width;
    const h = canvas.height;
    ctxPre.clearRect(0, 0, w, h);
    let imageData = ctx.getImageData(0, 0, w, h);
    //Pré-processamento
    escalaCinza(imageData);
    binarizar(imageData, w, h);
    ctxBin.putImageData(imageData, 0, 0);
    removerRotulos(imageData, w, h);
    let imageDataArestas = new ImageData(new Uint8ClampedArray(imageData.data), w, h);
    suavizacaoGaussiana(imageData, w, h);
    filtroSobel(imageData, w, h);
    binarizar(imageData, w, h);
    fechamento(imageData, w, h);
    afinar(imageData, w, h);
    ctxAfinado.putImageData(imageData, 0, 0);
    //

    if (corContornoImgBinaria(imageDataArestas) == 0) inverterCores(imageDataArestas);
    afinar(imageDataArestas, w, h);
    //ctx.putImageData(imageDataArestas, 0, 0);


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
    if (radioMin.checked) {
         razaoRaioMax = 19;
         tamanhoVertice = "Minúsculo";
    }
    else if (radioPeq.checked) {
        razaoRaioMax = 13;
        tamanhoVertice = "Pequeno";
    }
    else if (radioMed.checked) {
        razaoRaioMax = 9;
        tamanhoVertice = "Médio";
    }
    else {
        razaoRaioMax = 6;
        tamanhoVertice = "Grande";
    }
    const [acumulador, valorMaximo] = votacao(criarAcumulador(w, h, razaoRaioMax), imageData);
    let fatorLimiar
    desenhado = document.getElementById('desenhado').checked
    if (desenhado) fatorLimiar=0.25
    else fatorLimiar = 0.4
    let picos = picosNMS(acumulador, valorMaximo, fatorLimiar);
    
    if (picos.length == 0) return;
    let circulos = [];
    let valoresRaios = {}
    let somaRaios = 0
    picos.forEach(pico => {
        let [r, b, a] = pico;
        if (valoresRaios[r] == null) valoresRaios[r] = 1;
        else valoresRaios[r]++
        somaRaios+=r
        circulos.push({ r, b, a });
    });
    let mediaRaios = somaRaios/circulos.length
    let raiosOrdenados = Object.entries(valoresRaios).sort((a, b) => b[1] - a[1]);

    function circulosSeInterceptam(c1, c2) {
        const distanciaCentros = Math.sqrt((c2.a - c1.a) ** 2 + (c2.b - c1.b) ** 2);
        return distanciaCentros < (c1.r + c2.r);
    }

    for (let [r, quant] of raiosOrdenados) {
        let rInt = parseInt(r);
        let tol
        //console.log(mediaRaios, raiosOrdenados)
        if(quant==1) tol = rInt+2
        else if((mediaRaios>r+0.06*r || mediaRaios<r-0.06*r) && quant<=circulos.length/2) tol = (rInt/2)+1
        else tol = Math.ceil(rInt/8)+1
        let candidatos = circulos.filter(c => c.r >= rInt - tol  && c.r <= rInt + tol);

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

    let resultado = '<code> "' + nome_imagem + '" : <i>{</i>\n';
    resultado += '  <i>"tamanhoVertice"</i>: <b>"' + tamanhoVertice + '"</b>,\n';
    resultado += '  <i>"toleranciaAumentada"</i>: <b>' + desenhado + '</b>,\n';
    resultado += '  <i>"listaAdj"</i>: <i>{</i>\n';
    
    let tamChaves = Object.keys(listaAdjacencias).length;
    for (const chave in listaAdjacencias) {
        const valores = listaAdjacencias[chave].map((e) => "<b>\"" + e + "\"</b>").join(', ');
        tamChaves--;
        if (tamChaves != 0) {
            resultado += `    <i>"${chave}"</i>: <u>[</u>${valores}<u>]</u>,\n`;
        } else {
            resultado += `    <i>"${chave}"</i>: <u>[</u>${valores}<u>]</u>\n`;
        }
    }
    resultado += '  <i>}</i>\n';
    resultado += '<i>}</i> </code>';
    
    document.getElementById('lista-adjacencias').innerHTML = resultado;
    
}