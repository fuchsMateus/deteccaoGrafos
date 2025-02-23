//preprocessamento.js
import { detectarComponentesConectados, corContornoImgBinaria } from "./util.js";

export function escalaCinza(imageData) {
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        //ITU BT.709
        //Normalizar os valores RGB para 0-1, aplicar o expoente 2.2, multiplicar pelo coeficiente, somar, aplicar o expoente reverso, reverter a normalização.
        let cinza = Math.min(255, ((data[i] / 255.0) ** 2.2 * 0.2126 + (data[i + 1] / 255.0) ** 2.2 * 0.7152 + (data[i + 2] / 255.0) ** 2.2 * 0.0722) ** 0.4545 * 255);
        data[i] = data[i + 1] = data[i + 2] = cinza;
    }
}

export function suavizacaoGaussiana(imageData, w, h) {
    let data = imageData.data;
    let gaussData = new Uint8ClampedArray(w * h * 4);

    //desvio padrão = 1.4
    let kernel = [
        [2, 4, 5, 4, 2],
        [4, 9, 12, 9, 4],
        [5, 12, 15, 12, 5],
        [4, 9, 12, 9, 4],
        [2, 4, 5, 4, 2]
    ]
    let den = 159;
    //Tamanho da vizinhança do kernel a partir do ponto central
    let dViz = 2;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let px = (y * w + x) * 4;
            if (y < dViz || y >= h - dViz || x < dViz || x >= w - dViz) {
                gaussData[px] = gaussData[px + 1] = gaussData[px + 2] = imageData.data[px];
                gaussData[px + 3] = 255;
                continue;
            }
            let soma = 0;

            for (let ky = -dViz; ky <= dViz; ky++) {
                for (let kx = -dViz; kx <= dViz; kx++) {
                    let p = ((y + ky) * w + (x + kx)) * 4;
                    soma += data[p] * kernel[ky + dViz][kx + dViz];
                }
            }

            let novoValor = soma / den;

            gaussData[px] = gaussData[px + 1] = gaussData[px + 2] = novoValor;
            gaussData[px + 3] = 255;
        }
    }

    for (let i = 0; i < gaussData.length; i++) {
        data[i] = gaussData[i];
    }
}

export function filtroSobel(imageData, w, h) {
    let data = imageData.data;
    let sobelData = new Uint8ClampedArray(w * h * 4);

    let kernelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];
    let kernelY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ];

    let dViz = 1;

    for (let y = dViz; y < h - dViz; y++) {
        for (let x = dViz; x < w - dViz; x++) {
            let px = (y * w + x) * 4;
            let gx = 0;
            let gy = 0;

            for (let ky = -dViz; ky <= dViz; ky++) {
                for (let kx = -dViz; kx <= dViz; kx++) {
                    let p = ((y + ky) * w + (x + kx)) * 4;
                    gx += imageData.data[p] * kernelX[ky + dViz][kx + dViz];
                    gy += imageData.data[p] * kernelY[ky + dViz][kx + dViz];
                }
            }

            let magnitude = Math.round(Math.sqrt(gx * gx + gy * gy));

            sobelData[px] = sobelData[px + 1] = sobelData[px + 2] = magnitude;
            sobelData[px + 3] = 255;
        }
    }

    for (let i = 0; i < sobelData.length; i++) {
        data[i] = sobelData[i];
    }
}

export function binarizar(imageData, w, h) {
    const limiar = otsuThreshold(imageData, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] >= limiar) {
            data[i] = data[i + 1] = data[i + 2] = 255;
        } else {
            data[i] = data[i + 1] = data[i + 2] = 0;
        }
    }
}

export function inverterCores(imageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] == 0) {
            data[i] = data[i + 1] = data[i + 2] = 255;
        }
        else {
            data[i] = data[i + 1] = data[i + 2] = 0;
        }
    }
}

export function removerRotulos(imageData, w, h) {
    let cor = corContornoImgBinaria(imageData);
    let rotulos = detectarComponentesConectados(imageData, w, h, cor);
    let contagemRotulos = {};
    rotulos.forEach(rotulo => {
        contagemRotulos[rotulo] = (contagemRotulos[rotulo] || 0) + 1;
    });

    let rotulosOrdenados = Object.entries(contagemRotulos).sort((a, b) => b[1] - a[1]);
    let rotuloMaisFrequente = rotulosOrdenados[1][0];


    let data = imageData.data;
    for (let i = 0; i < w * h; i++) {
        if (rotulos[i] != rotuloMaisFrequente) {
            data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 255 - cor;
            data[i * 4 + 3] = 255;
        }
    }
}

function limiarGlobal(imageData, w, h) {
    const data = imageData.data;
    let t = 128;
    const maxIterations = 100;
    let iterations = 0;

    while (true) {
        let g1 = 0, g2 = 0;
        let sg1 = 0, sg2 = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const index = (y * w + x) * 4;
                const tData = data[index]; 
                if (tData > t) {
                    g1 += tData;
                    sg1++;
                } else {
                    g2 += tData;
                    sg2++;
                }
            }
        }

        const media1 = sg1 > 0 ? g1 / sg1 : 0;
        const media2 = sg2 > 0 ? g2 / sg2 : 0;
        const novoT = Math.round((media1 + media2) / 2);

        if (Math.abs(novoT - t) <= 3) {
            return novoT;
        } else {
            t = novoT;
        }

        iterations++;
        if (iterations >= maxIterations) {
            return t;
        }
    }
}

function otsuThreshold(imageData, w, h) {
    const data = imageData.data;
    const totalPixels = w * h;
  
    const hist = new Array(256).fill(0);
  
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      hist[gray]++;
    }

    let sum = 0;
    for (let t = 0; t < 256; t++) {
      sum += t * hist[t];
    }
  
    let sumB = 0;       
    let wB = 0;         
    let wF = 0;         
    let varMax = 0;     
    let threshold = 0;  
  
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) {
        continue;
      }
  
      wF = totalPixels - wB;
      if (wF === 0) {
        break;
      }
  
      sumB += t * hist[t];
  
      const mB = sumB / wB;
  
      const mF = (sum - sumB) / wF;
  
      const varBetween = wB * wF * Math.pow(mB - mF, 2);
  
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
    if (threshold === 0 || threshold === 255) return 128;
    return threshold;
}


