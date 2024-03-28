export function subtracaoImgBinaria(data1,data2){
    let subData = new Uint8ClampedArray(data1.length);

    for (let i = 0; i < data1.length; i+=4) {
        let resultado = data1[i]-data2[i];
        if(resultado<0) resultado = 0;

        subData[i] = subData[i+1] = subData[i+2] = resultado;
        subData[i+3] = 255
        
    }
    return subData;
}

export function dadosIguais(data1,data2){
    for (let i = 0; i < data1.length; i++) {
        if (data1[i] !== data2[i]) {
            return false;
        }
    }
    return true;
}

export function rotacionarMatrizQuadrada(matriz){
    let novaMatriz =[];
    let d = matriz.length;
    for (let i = 0; i < d; i++) {
        novaMatriz.push([]);
        for (let j = d-1; j >= 0; j--) {
            novaMatriz[i].push(matriz[j][d-(1+i)])
        }
    }
    novaMatriz.reverse();
   return novaMatriz;
}