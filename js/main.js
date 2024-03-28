import { escalaCinza, suavizacaoGaussiana, filtroSobel, binarizar, removerRotulos } from './preprocessamento.js';
import { fechamento, afinar } from './op_morfologico.js';
import { aumentarBorda } from './util.js'


const maxTamanhoImagem = 380;
const limiarBinarizacao = 128;

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

            let cor = ctx.getImageData(0, 0, canvas.width, canvas.height).data[0];
            aumentarBorda(canvas, `rgb(${cor},${cor},${cor})`);

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
    let imageData = ctx.getImageData(0, 0, w, h);

    //Pré-processamento
    escalaCinza(imageData);
    removerRotulos(imageData, w, h);
    suavizacaoGaussiana(imageData, w, h);
    filtroSobel(imageData, w, h);
    binarizar(imageData, limiarBinarizacao);
    fechamento(imageData, w, h);
    afinar(imageData, w, h);
    //
    ctxPre.putImageData(imageData, 0, 0);
}
