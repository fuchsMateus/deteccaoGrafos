import { escalaCinza } from './preprocessamento.js';

const maxTamanhoImagem = 400;
let img;

const canvas = document.getElementById('imagem-canvas');
const canvasGrafo = document.getElementById('grafo-canvas')
const ctx = canvas.getContext('2d');
const ctxGrafo = canvasGrafo.getContext('2d');


const btnProcessar = document.getElementById('btn-processar');

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
      canvasGrafo.width = canvas.width;
      canvasGrafo.height = canvas.height;

      document.getElementById('msg').hidden = true;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctxGrafo.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

    escalaCinza(imageData);

    /////
    ctxGrafo.putImageData(imageData, 0, 0);
}