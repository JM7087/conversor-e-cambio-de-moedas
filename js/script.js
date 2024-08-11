const moedas = ['USD', 'BRL', 'EUR', 'GBP', 'JPY'];

async function obterCotacoes() {
    try {
        const pares = moedas.filter(m => m !== 'USD').map(m => `${m}-USD`);
        const resposta = await fetch(`https://economia.awesomeapi.com.br/json/last/${pares.join(',')}`);
        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error('Erro ao obter cotações:', erro);
        throw erro;
    }
}

async function obterCotacoesHistoricas(moeda, moedaPrincipal) {
    try {
        const resposta = await fetch(`https://economia.awesomeapi.com.br/json/daily/${moeda}-${moedaPrincipal}/7`);
        const dados = await resposta.json();
        return dados.reverse(); // Reverter para exibir os dados em ordem cronológica
    } catch (erro) {
        console.error(`Erro ao obter cotações históricas de ${moeda}:`, erro);
        throw erro;
    }
}

function calcularConversoes(dados, moedaPrincipal, valor) {
    const resultados = {};
    moedas.forEach(moeda => {
        if (moeda === moedaPrincipal) {
            resultados[moeda] = valor;
        } else if (moedaPrincipal === 'USD') {
            const taxa = parseFloat(dados[`${moeda}USD`].bid);
            resultados[moeda] = valor / taxa;
        } else if (moeda === 'USD') {
            const taxa = parseFloat(dados[`${moedaPrincipal}USD`].bid);
            resultados[moeda] = valor * taxa;
        } else {
            const taxaParaUSD = parseFloat(dados[`${moedaPrincipal}USD`].bid);
            const taxaDeUSD = parseFloat(dados[`${moeda}USD`].bid);
            resultados[moeda] = (valor * taxaParaUSD) / taxaDeUSD;
        }
    });
    return resultados;
}

function criarGrafico(cotacoes, moeda, moedaPrincipal) {
    const labels = cotacoes.map(item => new Date(item.timestamp * 1000).toLocaleDateString('pt-BR'));
    const data = cotacoes.map(item => parseFloat(item.bid));

    const canvasId = `grafico-${moeda.toLowerCase()}`;
    const canvasElement = document.getElementById(canvasId);
    const existingChart = Chart.getChart(canvasElement);

    // Se já existir um gráfico, destrua-o antes de criar um novo
    if (existingChart) {
        existingChart.destroy();
    }

    new Chart(canvasElement.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Cotação ${moeda}/${moedaPrincipal}`,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: false
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

async function atualizarInterfaceComGraficos(moedaPrincipal) {
    moedas.forEach(async moeda => {
        if (moeda !== moedaPrincipal) {
            const cotacoesHistoricas = await obterCotacoesHistoricas(moeda, moedaPrincipal);
            criarGrafico(cotacoesHistoricas, moeda, moedaPrincipal);
        }
    });
}

function atualizarInterface(resultados, moedaPrincipal) {
    moedas.forEach(moeda => {
        const elementoId = `cotacao-${moeda.toLowerCase()}`;
        const containerId = `container-${moeda.toLowerCase()}`;
        if (moeda === moedaPrincipal) {
            document.getElementById(containerId).style.display = 'none';
        } else {
            document.getElementById(containerId).style.display = 'block';
            document.getElementById(elementoId).textContent = resultados[moeda].toFixed(2);
        }
    });

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR', {
        dateStyle: 'short'
    });
    const hora = agora.toLocaleTimeString('pt-BR', {
        timeStyle: 'short'
    });

    const dataHoraFormatada = `${hora} de ${data}`;
    document.getElementById('ultima-atualizacao').textContent = `Última atualização: ${dataHoraFormatada}`;
}

async function atualizarCotacoes() {
    const moedaPrincipal = document.getElementById('moeda-principal').value;
    const valor = parseFloat(document.getElementById('valor').value);

    try {
        const dados = await obterCotacoes();
        const resultados = calcularConversoes(dados, moedaPrincipal, valor);
        atualizarInterface(resultados, moedaPrincipal);
        atualizarInterfaceComGraficos(moedaPrincipal);
    } catch (erro) {
        moedas.forEach(moeda => {
            const elementoId = `cotacao-${moeda.toLowerCase()}`;
            document.getElementById(elementoId).textContent = 'Erro ao carregar';
        });
    }
}

document.getElementById('moeda-principal').addEventListener('change', atualizarCotacoes);
document.getElementById('valor').addEventListener('input', atualizarCotacoes);

atualizarCotacoes();
setInterval(atualizarCotacoes, 30000);
