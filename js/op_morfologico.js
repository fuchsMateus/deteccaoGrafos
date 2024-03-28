import { subtracaoImgBinaria, dadosIguais, rotacionarMatrizQuadrada } from './util.js';

function dilatar(imageData, w, h, elementoEstruturante) {
    const data = imageData.data;
    let dData = new Uint8ClampedArray(w * h * 4);

    let dVizY = (elementoEstruturante.length - 1) / 2;
    let dVizX = (elementoEstruturante[0].length - 1) / 2;

    for (let y = dVizY; y < h - dVizY; y++) {
        for (let x = dVizX; x < w - dVizX; x++) {
            let px = (y * w + x) * 4;
            dData[px] = dData[px + 1] = dData[px + 2] = 0;
            dData[px + 3] = 255;

            if (data[px] == 255) {

                for (let ky = -dVizY; ky <= dVizY; ky++) {
                    for (let kx = -dVizX; kx <= dVizX; kx++) {
                        if (elementoEstruturante[ky + dVizY][kx + dVizX] == 0) {
                            continue;
                        }
                        
                        let p = ((y + ky) * w + (x + kx)) * 4;

                        if (elementoEstruturante[ky + dVizY][kx + dVizX] == 1) {
                            dData[p] = dData[p + 1] = dData[p + 2] = 255;
                            dData[p + 3] = 255;
                        }
                    }
                }
            }

        }
    }

    for (let i = 0; i < dData.length; i++) {
        data[i] = dData[i];
    }
}

function erodir(imageData, w, h, elementoEstruturante){
    const data = imageData.data;
    let eData = new Uint8ClampedArray(w * h * 4);

    let dVizY = (elementoEstruturante.length-1)/2
    let dVizX = (elementoEstruturante[0].length-1)/2

    for (let y = dVizY; y < h-dVizY; y++) {
        for (let x = dVizX; x < w-dVizX; x++) {
            let px = (y * w + x) * 4;
            eData[px] = eData[px + 1] = eData[px + 2] = 0;
            eData[px + 3] = 255;

            if(data[px] == 255){
                let b = true;

                for (let ky = -dVizY; ky <= dVizY; ky++) {
                    if(!b) break;
                    for (let kx = -dVizX; kx <= dVizX; kx++) {

                        if (elementoEstruturante[ky + dVizY][kx + dVizX] == 0) {
                            continue; 
                        }
                        
                        let p = ((y + ky) * w + (x + kx)) * 4;

                        if (data[p] == 0) {
                           b = false;
                           break;
                        } 
                    }
                }

                if(b){
                    eData[px] = eData[px + 1] = eData[px + 2] = 255;
                    eData[px + 3] = 255;
                }
            }

        }
    }

    for (let i = 0; i < eData.length; i++) {
        data[i] = eData[i];
    }
}

export function fechamento(imageData, w, h){

    let elementoEstruturante = [
        [1,1,1,1,1],
        [1,1,1,1,1],
        [1,1,1,1,1],
        [1,1,1,1,1],
        [1,1,1,1,1]
    ]

    dilatar(imageData, w, h, elementoEstruturante);
    erodir(imageData, w, h, elementoEstruturante);
}

function transformadaHitOrMiss(data, w, h, elementoEstruturante) {
    let homData = new Uint8ClampedArray(w * h * 4);
    
    let dVizY = (elementoEstruturante.length-1)/2
    let dVizX = (elementoEstruturante[0].length-1)/2

    for (let y = dVizY; y < h - dVizY; y++) {
        for (let x = dVizX; x < w - dVizX; x++) {
            let px = (y * w + x) * 4;
            let b = true;

            for (let ky = -dVizY; ky <= dVizY; ky++) {
                if(!b) break;
                for (let kx = -dVizX; kx <= dVizX; kx++) {
                    if (elementoEstruturante[ky + dVizY][kx + dVizX] == -1) {
                        continue; 
                    }

                    let p = ((y + ky) * w + (x + kx)) * 4;
               
                    if ((elementoEstruturante[ky + dVizY][kx + dVizX] == 1 && data[p] == 0) ||
                        (elementoEstruturante[ky + dVizY][kx + dVizX] == 0 && data[p] == 255)) {
                        b = false;
                        break;
                    }
                }
            }

            if (b) {
                homData[px] = homData[px + 1] = homData[px + 2] = 255;
            } else {
                homData[px] = homData[px + 1] = homData[px + 2] = 0;
            }
            homData[px + 3] = 255; 
        }
    }

    return homData;
}

export function afinar(imageData, w, h) {
    let data = imageData.data;

    const elementosBase = [
        [
            [0, -1, 1],
            [0, -1, 1],
            [0, -1, 1]
        ],

        [
            [0, 0, -1],
            [0, -1, 1],
            [-1, 1, -1]
        ]
    ]

    let elementosERotacoes = [];
    elementosBase.forEach(el => {
        let r1 = rotacionarMatrizQuadrada(el);
        let r2 = rotacionarMatrizQuadrada(r1);
        let r3 = rotacionarMatrizQuadrada(r2)
        elementosERotacoes.push(el, r1, r2, r3);
    });

    let dataAtual;
    let dataAnterior;

    dataAnterior = dataAtual = data;
    
    let convergencia = 0;
    while(convergencia<10) {
        elementosERotacoes.forEach(el => {
            let homData = transformadaHitOrMiss(dataAtual, w, h, el);
            dataAtual = subtracaoImgBinaria(dataAtual, homData);
            if(dadosIguais(dataAtual,dataAnterior)) convergencia+=1;
            else convergencia = 0;
            dataAnterior = dataAtual;
        });
    }

    for (let i = 0; i < dataAtual.length; i++) {
        data[i] = dataAtual[i];
    }
}