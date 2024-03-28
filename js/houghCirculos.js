let rMax = 0;
let rMin = 1;
let aMax = 0;
let bMax = 0;

export function criarAcumulador(w, h) {
    if(w>h) rMax = Math.round(h/5);
    else rMax = Math.round(w/5);

    aMax = w;
    bMax = h;

    return Array.from({ length: rMax-rMin+1 }, () =>
        Array.from({ length: bMax }, () =>
            Array.from({ length: aMax }, () => 0)
        )
    );
}

export function votacao(acumulador, imageData) {
    let valorMaximo = 0;
    const data = imageData.data;

    for (let y = 0; y < bMax; y++) {
        for (let x = 0; x < aMax; x++) {
            const px = (y * aMax + x) * 4;
            if (data[px] == 255) {
                
                for (let b = 0; b < bMax; b++) {
                    for (let a = 0; a < aMax; a++) {
                        let r = Math.round(Math.sqrt((x - a) * (x - a) + (y - b) * (y - b)));
                        if (r <= rMax && r >= rMin) {
                            acumulador[r-rMin][b][a]++;
                            let atual = acumulador[r-rMin][b][a];
                            if(atual > valorMaximo) valorMaximo = atual;
                        }
                    }
                }
            }
        }
    }
    return [acumulador,valorMaximo];
}

export function picosNMS(acumulador, valorMaximo) {
    let picos = [];

    let limiar = Math.round(valorMaximo * 0.3);
    let tamanhoVizinhanca = Math.ceil(0.015 * Math.sqrt(aMax*aMax + bMax*bMax));

    for (let r = 0; r < rMax-rMin+1; r++) {
        for (let b = 0; b < bMax; b++) {
            for (let a = 0; a < aMax; a++) {

                if (acumulador[r][b][a] < limiar + r) {
                    continue;
                }

                let isMax = true;
                let empate = false;
                for (let di = -tamanhoVizinhanca; di <= tamanhoVizinhanca && isMax; di++) {
                    for (let dj = -tamanhoVizinhanca; dj <= tamanhoVizinhanca && isMax; dj++) {
                        for (let dk = -tamanhoVizinhanca; dk <= tamanhoVizinhanca; dk++) {
                            if (di == 0 && dj == 0 && dk == 0) {
                                continue;
                            }
                            let ni = r + di;
                            let nj = b + dj;
                            let nk = a + dk;

                            if (ni >= 0 && ni < rMax-rMin+1 && nj >= 0 && nj < bMax && nk >= 0 && nk < aMax) {
                                if (acumulador[ni][nj][nk] > acumulador[r][b][a]) {
                                    isMax = false;
                                    break;
                                }
                                if (acumulador[ni][nj][nk] == acumulador[r][b][a]) {
                                    empate = true;
                                }
                            }
                        }
                    }
                }

                if (isMax) {
                    picos.push([r+rMin, b, a]);
                    if(empate) acumulador[r][b][a]++;
                }
            }
        }
    }

    return picos;
}
