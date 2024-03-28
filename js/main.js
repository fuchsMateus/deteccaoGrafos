const maxTamanhoImagem = 400;
let img;
let canvas = document.getElementById('imagem-canvas');
let ctx = canvas.getContext('2d');

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
      document.getElementById('msg').hidden = true;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      btnProcessar.onclick = () => {
        btnProcessar.setAttribute('aria-busy', 'true');
        setTimeout(() => {
          processar(img, ctx, canvas.width, canvas.height)
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

async function processar() {}