export function subtracaoImgBinaria(data1, data2) {
    let subData = new Uint8ClampedArray(data1.length);

    for (let i = 0; i < data1.length; i += 4) {
        let resultado = data1[i] - data2[i];
        if (resultado < 0) resultado = 0;

        subData[i] = subData[i + 1] = subData[i + 2] = resultado;
        subData[i + 3] = 255

    }
    return subData;
}

export function dadosIguais(data1, data2) {
    for (let i = 0; i < data1.length; i++) {
        if (data1[i] !== data2[i]) {
            return false;
        }
    }
    return true;
}

export function rotacionarMatrizQuadrada(matriz) {
    let novaMatriz = [];
    let d = matriz.length;
    for (let i = 0; i < d; i++) {
        novaMatriz.push([]);
        for (let j = d - 1; j >= 0; j--) {
            novaMatriz[i].push(matriz[j][d - (1 + i)])
        }
    }
    novaMatriz.reverse();
    return novaMatriz;
}

export function aumentarBorda(canvas, corBorda) {
    const novaLargura = canvas.width + 20;
    const novaAltura = canvas.height + 20;

    const canvasTemp = document.createElement('canvas');
    const ctxTemp = canvasTemp.getContext('2d');
    canvasTemp.width = novaLargura;
    canvasTemp.height = novaAltura;

    ctxTemp.fillStyle = corBorda;
    ctxTemp.fillRect(0, 0, novaLargura, novaAltura);

    ctxTemp.drawImage(canvas, 10, 10);

    canvas.width = novaLargura;
    canvas.height = novaAltura;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(canvasTemp, 0, 0);
}


function dfs(x, y, w, h, data, rot, rotulos, cor) {
    let pilha = [{ x, y }];
    while (pilha.length > 0) {
        let { x, y } = pilha.pop();

        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        let px = (y * w + x) * 4;
        if (data[px] !== cor || rotulos[y * w + x] == rot) continue;

        rotulos[y * w + x] = rot;

        pilha.push({ x: x + 1, y });
        pilha.push({ x: x - 1, y });
        pilha.push({ x, y: y + 1 });
        pilha.push({ x, y: y - 1 });
        pilha.push({ x: x + 1, y: y + 1 });
        pilha.push({ x: x - 1, y: y - 1 });
        pilha.push({ x: x + 1, y: y - 1 });
        pilha.push({ x: x - 1, y: y + 1 });
    }
}



export function detectarComponentesConectados(imageData, w, h, cor) {
    let rot = 1;
    let rotulos = new Uint32Array(w * h);
    let data = imageData.data;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let px = (y * w + x) * 4;

            if (data[px] === cor && rotulos[y * w + x] === 0) {
                dfs(x, y, w, h, data, rot, rotulos, cor);
                rot++;
            }
        }
    }

    return rotulos;
}

export function corContornoImgBinaria(imageData) {
    let data = imageData.data;
    let cPreta = 0;
    let cBranca = 0;

    for (let i = 0; i < data.length; i += 4) {
        let p = data[i];

        if (p === 0) cPreta++;
        else cBranca++;
    }

    if (cPreta > cBranca) return 255
    else return 0

}

export function corFundoImg(imageData, w, h) {
    let data = imageData.data;
    let coresProeminentes = [];

    for (let i = 0; i < data.length / 4; i += 4) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        let px = (y * w + x) * 4;
        let cor = [data[px], data[px + 1], data[px + 2]];

        let encontrada = coresProeminentes.find(c => c.cor[0] === cor[0] && c.cor[1] === cor[1] && c.cor[2] === cor[2]);
        
        if (encontrada) {
            encontrada.contagem++;
        } else {
            coresProeminentes.push({ cor: cor, contagem: 1 });
        }
    }

    coresProeminentes.sort((a, b) => b.contagem - a.contagem);
    return coresProeminentes[0].cor;
}

export function detectarLinhas(imageData, w, h) {
    let data = imageData.data;
    let linhas = [];
    let visitados = new Set();


    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {

            let px = (y * w + x) * 4;
            if (data[px] === 255 && !visitados.has(px)) {
                let vizinhos = [];
                let visitadosLocais = new Set();

                function detectarVizinhos(pAtual) {
                    vizinhos = [];

                    let sul = ((pAtual.y + 1) * w + pAtual.x) * 4;
                    let norte = ((pAtual.y - 1) * w + pAtual.x) * 4;
                    let leste = (pAtual.y * w + (pAtual.x + 1)) * 4;
                    let oeste = (pAtual.y * w + (pAtual.x - 1)) * 4;
                    let sudeste = ((pAtual.y + 1) * w + (pAtual.x + 1)) * 4;
                    let sudoeste = ((pAtual.y + 1) * w + (pAtual.x - 1)) * 4;
                    let nordeste = ((pAtual.y - 1) * w + (pAtual.x + 1)) * 4;
                    let noroeste = ((pAtual.y - 1) * w + (pAtual.x - 1)) * 4;

                    if (data[sul] === 255 && !visitadosLocais.has(sul)) vizinhos.push('sul');
                    if (data[norte] === 255 && !visitadosLocais.has(norte)) vizinhos.push('norte');
                    if (data[leste] === 255 && !visitadosLocais.has(leste)) vizinhos.push('leste');
                    if (data[oeste] === 255 && !visitadosLocais.has(oeste)) vizinhos.push('oeste');
                    if (data[sudeste] === 255 && !visitadosLocais.has(sudeste)) vizinhos.push('sudeste');
                    if (data[sudoeste] === 255 && !visitadosLocais.has(sudoeste)) vizinhos.push('sudoeste');
                    if (data[nordeste] === 255 && !visitadosLocais.has(nordeste)) vizinhos.push('nordeste');
                    if (data[noroeste] === 255 && !visitadosLocais.has(noroeste)) vizinhos.push('noroeste');
                }

                let pAtual = { x, y };

                detectarVizinhos(pAtual, null);
                if (vizinhos.length > 1) {
                    if (vizinhos.includes('sul')) data[px] = data[px + 1] = data[px + 2] = 0;
                    continue;
                }

                let p0 = pAtual;
                let p1;

                let anterior = null;

                let placar = {
                    'sul': 0,
                    'norte': 0,
                    'leste': 0,
                    'oeste': 0,
                    'sudeste': 0,
                    'sudoeste': 0,
                    'nordeste': 0,
                    'noroeste': 0,
                }

                function atualizarPlacar(vizinhoEscolhido){
                    
                    if (vizinhoEscolhido === 'sudeste') {
                        placar[vizinhoEscolhido]+=2;
                        placar['sul']++;
                        placar['leste']++;
                    }
                    else if (vizinhoEscolhido === 'sudoeste') {
                        placar[vizinhoEscolhido]+=2;
                        placar['sul']++;
                        placar['oeste']++;
                    }
                    else if (vizinhoEscolhido === 'nordeste') {
                        placar[vizinhoEscolhido]+=2;
                        placar['norte']++;
                        placar['leste']++;
                    }
                    else if (vizinhoEscolhido === 'noroeste') {
                        placar[vizinhoEscolhido]+=2;
                        placar['norte']++;
                        placar['oeste']++;
                    }
                    else placar[vizinhoEscolhido]+=2;
                }

                
                let posicoesPodio = new Array(8).fill(null);

                function atualizarPodio() {
                    posicoesPodio.fill(null);

                    let placarOrdenado = Object.entries(placar).sort((a, b) => b[1] - a[1]);

                    for (let i = 0; i < posicoesPodio.length; i++) {
                        if (i < placarOrdenado.length && (i === 0 || placarOrdenado[i][1] !== placarOrdenado[i - 1][1])) {
                            posicoesPodio[i] = placarOrdenado[i][0];
                        } else {
                            break;
                        }
                    }
                }


                atualizarPlacar(vizinhos[0]);
                atualizarPodio();
                let vizinhoEscolhido = posicoesPodio[0];

                function atualizarPAtual() {
                    if (vizinhoEscolhido === 'sul') {
                        pAtual = { x: pAtual.x, y: pAtual.y + 1 };
                        anterior = 'norte';
                    }
                    else if (vizinhoEscolhido === 'norte') {
                        pAtual = { x: pAtual.x, y: pAtual.y - 1 };
                        anterior = 'sul';
                    }
                    else if (vizinhoEscolhido === 'leste') {
                        pAtual = { x: pAtual.x + 1, y: pAtual.y };
                        anterior = 'oeste';
                    }
                    else if (vizinhoEscolhido === 'oeste') {
                        pAtual = { x: pAtual.x - 1, y: pAtual.y };
                        anterior = 'leste';
                    }
                    else if (vizinhoEscolhido === 'sudeste') {
                        pAtual = { x: pAtual.x + 1, y: pAtual.y + 1 };
                        anterior = 'noroeste';
                    }
                    else if (vizinhoEscolhido === 'sudoeste') {
                        pAtual = { x: pAtual.x - 1, y: pAtual.y + 1 };
                        anterior = 'nordeste';
                    }
                    else if (vizinhoEscolhido === 'nordeste') {
                        pAtual = { x: pAtual.x + 1, y: pAtual.y - 1 };
                        anterior = 'sudoeste';
                    }
                    else if (vizinhoEscolhido === 'noroeste') {
                        pAtual = { x: pAtual.x - 1, y: pAtual.y - 1 };
                        anterior = 'sudeste';
                    }
                }

                visitados.add((pAtual.y * w + pAtual.x) * 4);
                visitadosLocais.add((pAtual.y * w + pAtual.x) * 4);

                atualizarPAtual();

                while (vizinhos.length != 0) {
                    detectarVizinhos(pAtual, anterior);

                    if (vizinhos.length == 0) {
                        p1 = pAtual;
                        visitados.add((pAtual.y * w + pAtual.x) * 4);
                        linhas.push([p0, p1]);
                        console.log(p0,p1);
                        break;
                    }

                    else if (vizinhos.length == 1) {
                        vizinhoEscolhido = vizinhos[0];
                    }
                    else {
                        let pEscolhida = false;
                        posicoesPodio.forEach((p) => {
                            if (!pEscolhida && vizinhos.includes(p)) {
                                vizinhoEscolhido = p;
                                pEscolhida = true;
                            }
                        });

                    }

                    atualizarPlacar(vizinhoEscolhido);
                    atualizarPodio();
                    visitados.add((pAtual.y * w + pAtual.x) * 4);
                    visitadosLocais.add((pAtual.y * w + pAtual.x) * 4);
                    atualizarPAtual();
                }

            }
        }
    }

    return linhas;
}
