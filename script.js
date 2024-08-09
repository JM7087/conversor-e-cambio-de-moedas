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
            resultados[moeda] = valor * taxa; // se for dolar a moeda multiplicar
        } else {
            const taxaParaUSD = parseFloat(dados[`${moedaPrincipal}USD`].bid);
            const taxaDeUSD = parseFloat(dados[`${moeda}USD`].bid);
            resultados[moeda] = (valor * taxaParaUSD) / taxaDeUSD; // se for outra moeda multiplicar antes de dividir
        }
    });
    return resultados;
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

    // Atualiza a data e hora da última atualização
    const agora = new Date();

    // Extrai a data e a hora separadamente
    const data = agora.toLocaleDateString('pt-BR', {
        dateStyle: 'short'
    });
    const hora = agora.toLocaleTimeString('pt-BR', {
        timeStyle: 'short'
    });

    // Define o texto no formato desejado
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
    } catch (erro) {
        moedas.forEach(moeda => {
            const elementoId = `cotacao-${moeda.toLowerCase()}`;
            document.getElementById(elementoId).textContent = 'Erro ao carregar';
        });
    }
}

document.getElementById('moeda-principal').addEventListener('change', atualizarCotacoes);
document.getElementById('valor').addEventListener('input', atualizarCotacoes);

// Inicializar
atualizarCotacoes();

// Atualiza as cotações a cada 30 segundos
setInterval(atualizarCotacoes, 30000);
