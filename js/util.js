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

export function inverterImgBinaria(imageData, w, h) {
    let data = imageData.data;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let px = (y * w + x) * 4;
            if (data[px] == 0) data[px] = data[px + 1] = data[px + 2] = 255;
            else data[px] = data[px + 1] = data[px + 2] = 0;
        }
    }
}
