export function escalaCinza(imageData) {
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        //ITU BT.709
        //Normalizar os valores RGB para 0-1, aplicar o expoente 2.2, multiplicar pelo coeficiente, somar, aplicar o expoente reverso, reverter a normalização.
        let cinza = Math.min(255,((data[i]/255.0)**2.2*0.2126+(data[i + 1]/255.0)**2.2*0.7152+(data[i + 2]/255.0)**2.2*0.0722)**0.4545*255);
        data[i] = data[i + 1] = data[i + 2] = cinza;
    }
}