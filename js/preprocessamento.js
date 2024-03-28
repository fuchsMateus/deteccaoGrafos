export function escalaCinza(imageData) {
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        //ITU BT.709
        //Normalizar os valores RGB para 0-1, aplicar o expoente 2.2, multiplicar pelo coeficiente, somar, aplicar o expoente reverso, reverter a normalização.
        let cinza = Math.min(255,((data[i]/255.0)**2.2*0.2126+(data[i + 1]/255.0)**2.2*0.7152+(data[i + 2]/255.0)**2.2*0.0722)**0.4545*255);
        data[i] = data[i + 1] = data[i + 2] = cinza;
    }
}

export function suavizacaoGaussiana(imageData, w ,h){
    let data = imageData.data;
    let gaussData = new Uint8ClampedArray(w * h *4 );
    
    //desvio padrão = 1.4
    let kernel = [
        [2, 4, 5, 4, 2],
        [4, 9, 12, 9, 4],
        [5, 12, 15, 12, 5],
        [4, 9, 12, 9, 4],
        [2, 4, 5, 4, 2]
    ]
    let den = 159;
    let dViz = 2;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {

            let px = (y * w + x) * 4;
            
            if(y<dViz || y >= h-dViz || x<dViz || x >= w-dViz){
                gaussData[px] = gaussData[px + 1] = gaussData[px + 2] = data[px];
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

            let novoValor = soma/den;

            gaussData[px] = gaussData[px + 1] = gaussData[px + 2] = novoValor; 
            gaussData[px + 3] = 255; 
        }
    }
    for (let i = 0; i < gaussData.length; i++) {
        data[i] = gaussData[i];
    }
}