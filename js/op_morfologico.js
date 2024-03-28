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

                for (let ky = -dVizY; ky < dVizY; ky++) {
                    for (let kx = -dVizX; kx < dVizX; kx++) {
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

                for (let ky = -dVizY; ky < dVizY; ky++) {
                    if(!b) break;
                    for (let kx = -dVizX; kx < dVizX; kx++) {

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

export function fechamento(imageData, w, h, elementoEstruturante){
    dilatar(imageData, w, h, elementoEstruturante);
    erodir(imageData, w, h, elementoEstruturante);
}