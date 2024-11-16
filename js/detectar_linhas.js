let imgW;
let imgH;
let data;
let vizinhos = [];
let visitadosLocais;
let placar;
let posicoesPodio = new Array(8).fill(null);

export function detectarLinhas(imageData, w, h) {
    imgW=w;
    imgH=h;

    //Cria um array unidimensional dos pixels (RGBA)
    data = imageData.data;

    let linhas = [];
    let visitados = new Set();

    //Percorre todos os pixels da imagem
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {

            //Calcula posicao do pixel atual no data[]
            let px = (y * w + x) * 4;
            //Checa se o pixel é branco e não foi visitado ainda
            if (data[px] === 255 && !visitados.has(px)) {

                visitadosLocais = new Set();

                //pixelAtual
                let pAtual = { x, y };

                //detecta quais vizinhos existem, excluindo os já visitados localmente
                detectarVizinhos(pAtual);

                //Se tiver mais de um vizinho, não é um extremo de linha.
                //Se tiver mais de um vizinho e tiver um vizinho ao sul, este pixel é um ruido
                //e deve ser pintado da cor do fundo.
                if (vizinhos.length > 1) {
                    if (vizinhos.includes('sul')) data[px] = data[px + 1] = data[px + 2] = 0;
                    continue;
                }

                //p0 é o começo de uma linha
                let p0 = pAtual;
                //p1 será o final da linha
                let p1;

                //Inicia um placar para saber quais as direções que mais foram seguidas.
                placar = zerarPlacar();

                //Atualiza o placar pela primeira vez com o vizinho do extremo de linha encontrado.
                let vizinhoEscolhido = vizinhos[0]
                atualizarPlacar(vizinhoEscolhido);

                //Atualiza o pódio, com as direções mais frequentes em ordem decrescente.
                atualizarPodio();

                //Adiciona a posição atual como visitada
                visitados.add((pAtual.y * w + pAtual.x) * 4);
                //Adiciona a posição atual como visitada local (referente à linha atual)
                visitadosLocais.add((pAtual.y * w + pAtual.x) * 4);
                //Atualiza a posição atual para a próxima
                pAtual = atualizarPAtual(vizinhoEscolhido, pAtual);

                //Percorre o resto da linha até encontrar o outro extremo
                while (true) {
                    detectarVizinhos(pAtual);

                    if (vizinhos.length == 0) {
                        p1 = pAtual;
                        visitados.add((pAtual.y * w + pAtual.x) * 4);
                        linhas.push([p0, p1]);
                        break;
                    }

                    else if (vizinhos.length == 1) {
                        vizinhoEscolhido = vizinhos[0];
                    }

                    else {
                        vizinhoEscolhido = null;

                        for (let i = 0; i < 8; i++) {
                            let p = posicoesPodio[i];
                            if (vizinhos.includes(p)) {
                                if(p==0) vizinhoEscolhido=null;
                                else vizinhoEscolhido = p;
                                break;
                            }
                        }
                    }

                    if(vizinhoEscolhido == null){
                        p1 = pAtual;
                        visitados.add((pAtual.y * w + pAtual.x) * 4);
                        linhas.push([p0, p1]);
                        break;
                    }

                    atualizarPlacar(vizinhoEscolhido);
                    atualizarPodio();
                    visitados.add((pAtual.y * w + pAtual.x) * 4);
                    visitadosLocais.add((pAtual.y * w + pAtual.x) * 4);
                    pAtual = atualizarPAtual(vizinhoEscolhido, pAtual);
                }

            }
        }
    }

    return linhas;
}

function detectarVizinhos(pAtual) {
    vizinhos = [];

    let sul = ((pAtual.y + 1) * imgW + pAtual.x) * 4;
    let norte = ((pAtual.y - 1) * imgW + pAtual.x) * 4;
    let leste = (pAtual.y * imgW + (pAtual.x + 1)) * 4;
    let oeste = (pAtual.y * imgW + (pAtual.x - 1)) * 4;
    let sudeste = ((pAtual.y + 1) * imgW + (pAtual.x + 1)) * 4;
    let sudoeste = ((pAtual.y + 1) * imgW + (pAtual.x - 1)) * 4;
    let nordeste = ((pAtual.y - 1) * imgW + (pAtual.x + 1)) * 4;
    let noroeste = ((pAtual.y - 1) * imgW + (pAtual.x - 1)) * 4;

    if (data[sul] === 255 && !visitadosLocais.has(sul)) vizinhos.push('sul');
    if (data[norte] === 255 && !visitadosLocais.has(norte)) vizinhos.push('norte');
    if (data[leste] === 255 && !visitadosLocais.has(leste)) vizinhos.push('leste');
    if (data[oeste] === 255 && !visitadosLocais.has(oeste)) vizinhos.push('oeste');
    if (data[sudeste] === 255 && !visitadosLocais.has(sudeste)) vizinhos.push('sudeste');
    if (data[sudoeste] === 255 && !visitadosLocais.has(sudoeste)) vizinhos.push('sudoeste');
    if (data[nordeste] === 255 && !visitadosLocais.has(nordeste)) vizinhos.push('nordeste');
    if (data[noroeste] === 255 && !visitadosLocais.has(noroeste)) vizinhos.push('noroeste');
}

function zerarPlacar(){
    return  {
        'sul': 0,
        'norte': 0,
        'leste': 0,
        'oeste': 0,
        'sudeste': 0,
        'sudoeste': 0,
        'nordeste': 0,
        'noroeste': 0,
    };
}

function atualizarPlacar(vizinhoEscolhido) {
    let incremento = 2;
    if (placar[vizinhoEscolhido] > 20) incremento+=2;
    else if (placar[vizinhoEscolhido] > 10) incremento+=1;
    if (vizinhoEscolhido === 'sudeste') {
        placar[vizinhoEscolhido] += incremento;
        placar['sul']++;
        placar['leste']++;
    }
    else if (vizinhoEscolhido === 'sudoeste') {
        placar[vizinhoEscolhido] += incremento;
        placar['sul']++;
        placar['oeste']++;
    }
    else if (vizinhoEscolhido === 'nordeste') {
        placar[vizinhoEscolhido] += incremento;
        placar['norte']++;
        placar['leste']++;
    }
    else if (vizinhoEscolhido === 'noroeste') {
        placar[vizinhoEscolhido] += incremento;
        placar['norte']++;
        placar['oeste']++;
    }
    else placar[vizinhoEscolhido] += incremento;
}

function atualizarPodio() {
    // Ordena o placar
    const placarOrdenado = Object.entries(placar).sort((a, b) => b[1] - a[1]);
    // Atualiza o pódio com as direções mais bem colocadas
    for (let i = 0; i < 8; i++) {
        posicoesPodio[i] = placarOrdenado[i][0];
    }
}

function atualizarPAtual(vizinhoEscolhido, pAtual) {
    if (vizinhoEscolhido === 'sul') pAtual = { x: pAtual.x, y: pAtual.y + 1 };
    else if (vizinhoEscolhido === 'norte') pAtual = { x: pAtual.x, y: pAtual.y - 1 };
    else if (vizinhoEscolhido === 'leste') pAtual = { x: pAtual.x + 1, y: pAtual.y };
    else if (vizinhoEscolhido === 'oeste') pAtual = { x: pAtual.x - 1, y: pAtual.y };
    else if (vizinhoEscolhido === 'sudeste') pAtual = { x: pAtual.x + 1, y: pAtual.y + 1 };
    else if (vizinhoEscolhido === 'sudoeste') pAtual = { x: pAtual.x - 1, y: pAtual.y + 1 };
    else if (vizinhoEscolhido === 'nordeste') pAtual = { x: pAtual.x + 1, y: pAtual.y - 1 };
    else pAtual = { x: pAtual.x - 1, y: pAtual.y - 1 };
    return pAtual;
}