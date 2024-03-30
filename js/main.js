import { escalaCinza, suavizacaoGaussiana, filtroSobel, binarizar, removerRotulos } from './preprocessamento.js';
import { fechamento, afinar } from './op_morfologico.js';
import { criarAcumulador, votacao, picosNMS } from './houghCirculos.js';
import { aumentarBorda, detectarLinhas, corFundoImg } from './util.js'


const maxTamanhoImagem = 580;
const limiarBinarizacao = 128;

const radioMin = document.getElementById('radio-min');
const radioPeq = document.getElementById('radio-peq');
const radioMed = document.getElementById('radio-med');

const canvas = document.getElementById('imagem-canvas');
const canvasPre = document.getElementById('preprocessamento-canvas')
const ctx = canvas.getContext('2d');
const ctxPre = canvasPre.getContext('2d');

const btnProcessar = document.getElementById('btn-processar');

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
    binarizar(imageData, limiarBinarizacao);
    removerRotulos(imageData, w, h);
    suavizacaoGaussiana(imageData, w, h);
    filtroSobel(imageData, w, h);
    binarizar(imageData, limiarBinarizacao);
    fechamento(imageData, w, h);
    afinar(imageData, w, h);
    //

    let circulos = getCirculos(imageData, w, h);
    if (circulos) {
        let linhas = getLinhas(imageData, w, h, circulos);
        ctxPre.strokeStyle = 'red';
        ctxPre.lineWidth = 1;

        circulos.forEach(c => {
            ctxPre.beginPath();
            ctxPre.arc(c.a, c.b, c.r, 0, 2 * Math.PI);
            ctxPre.stroke();
        });

        linhas.forEach(l => {
            ctxPre.strokeStyle = `rgb(${(l[0].x + l[1].x) / 2},${(l[0].y + l[1].y) / 2},${0})`;
            ctxPre.beginPath();
            ctxPre.moveTo(l[0].x, l[0].y);
            ctxPre.lineTo(l[1].x, l[1].y);
            ctxPre.stroke();
        });
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

function getLinhas(imageData, w, h, circulos) {
    const canvasTemp = document.createElement('canvas');
    const ctxTemp = canvasTemp.getContext('2d');
    canvasTemp.width = w;
    canvasTemp.height = h;

    ctxTemp.putImageData(imageData, 0, 0);

    ctxTemp.strokeStyle = "black";
    ctxTemp.fillStyle = "black";
    ctxTemp.lineWidth = 1;

    circulos.forEach(c => {
        ctxTemp.beginPath();
        ctxTemp.arc(c.a, c.b, c.r + 50 / c.r + 4, 0, 2 * Math.PI);
        ctxTemp.fill();
        ctxTemp.stroke();
    });

    let lData = ctxTemp.getImageData(0, 0, w, h);
    binarizar(lData, limiarBinarizacao);
    //ctx.putImageData(lData,0,0);
    return detectarLinhas(lData, w, h);
}

