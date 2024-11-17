//houghCirculos.js
let rMax = 0;
let rMin = 1;
let aMax = 0;
let bMax = 0;

export function criarAcumulador(w, h, razaoRaioMax) {
    //Aqui já estou limitando o número máximo do raio de acordo
    //com a escolha do usuário, assim reduzindo um pouco o processamento
    if(w>h) rMax = Math.round(h/razaoRaioMax);
    else rMax = Math.round(w/razaoRaioMax);

    //a é a coordenada x do centro do possível círculo
    //b é a y
    aMax = w;
    bMax = h;

    //perceba que a primeira dimensão tem tamanho definido de acordo com o raio máximo
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
            //se o pixel é branco, então é possivelmente parte de um círculo.
            if (data[px] == 255) {
                
                //checa os possíveis centros de círculos e soma no acumulador.
                for (let b = y-rMax; b < y+rMax; b++) {
                    if(b<0 || b>=bMax) continue;

                    for (let a = x-rMax; a < x+rMax; a++) {
                        if(a<0 || a>=aMax) continue;
                        
                        let r = Math.round(Math.sqrt((x - a) * (x - a) + (y - b) * (y - b)));
                        if (r <= rMax && r >= rMin) {
                            acumulador[r-rMin][b][a]++;
                            let atual = acumulador[r-rMin][b][a];
                            //salva o valor máximo da votação para ser usado posteriormente
                            if(atual > valorMaximo) valorMaximo = atual;
                        }
                    }
                }
            }
        }
    }
    return [acumulador,valorMaximo];
}

export function picosNMS(acumulador, valorMaximo, fatorLimiar) {
    let picos = [];

    //Este valor do limiar foi calculado empiricamente e funciona na maioria dos casos
    //O usuário pode ativar uma opção que aumenta o "fatorLimiar", assim aumentando a tolerância da detecção de círculos
    let limiar = Math.round(valorMaximo * fatorLimiar);

    //Este valor também é empírico, e refere-se ao Non_Maximum Supression
    //O tamanho da vizinhança é uma constante multiplicada pela diagonal da imagem
    let tamanhoVizinhanca = Math.ceil(0.02 * Math.sqrt(aMax*aMax + bMax*bMax));

    for (let r = 0; r < rMax-rMin+1; r++) {
        for (let b = 0; b < bMax; b++) {
            for (let a = 0; a < aMax; a++) {

                //Aqui, além do limiar, também é considerado o raio
                //pois quanto maior o círculo, mais votos ele tem
                //então aqui foi uma forma que eu achei de deixar mais justo
                //pois mesmo que na imagem tenha um círculo pequeno,
                //detecções de círculos maiores na mesma posição seriam favorecidas.
                if (acumulador[r][b][a] < limiar + r) {
                    continue;
                }

                let isMax = true;
                let empate = false;

                //para cada posição do acumulador, checa sua vizinhança
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
