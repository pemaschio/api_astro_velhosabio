const express = require('express');
const sweph = require('sweph');
const cors = require('cors');

// Criar aplicação web
const app = express();
app.use(express.json());
app.use(cors());

// Lista dos planetas
const PLANETAS = {
  0: 'Sol',
  1: 'Lua', 
  2: 'Mercúrio',
  3: 'Vênus',
  4: 'Marte',
  5: 'Júpiter',
  6: 'Saturno',
  7: 'Urano',
  8: 'Netuno',
  9: 'Plutão'
};

// Função que calcula astrologia
app.post('/calcular', (req, res) => {
  try {
    // Pegar dados enviados
    const { ano, mes, dia, hora = 12, minuto = 0, latitude, longitude } = req.body;
    
    // Calcular dia juliano (formato que a astrologia usa)
    const diaJuliano = sweph.swe_julday(ano, mes, dia, hora + minuto/60, sweph.SE_GREG_CAL);
    
    const planetas = [];
    
    // Calcular cada planeta
    for (let i = 0; i <= 9; i++) {
      try {
        const resultado = sweph.swe_calc_ut(diaJuliano, i, sweph.SEFLG_SPEED);
        if (resultado && !resultado.error) {
          planetas.push({
            nome: PLANETAS[i],
            graus: resultado.longitude,
            signo: obterSigno(resultado.longitude),
            grauNoSigno: resultado.longitude % 30
          });
        }
      } catch (erro) {
        console.log(`Erro no planeta ${i}:`, erro.message);
      }
    }
    
    // Calcular Ascendente (se tiver coordenadas)
    let ascendente = null;
    if (latitude !== undefined && longitude !== undefined) {
      try {
        const casas = sweph.swe_houses(diaJuliano, latitude, longitude, 'P');
        if (casas && !casas.error) {
          ascendente = {
            graus: casas.ascendant,
            signo: obterSigno(casas.ascendant),
            grauNoSigno: casas.ascendant % 30
          };
        }
      } catch (erro) {
        console.log('Erro no ascendente:', erro.message);
      }
    }
    
    // Enviar resposta
    res.json({
      sucesso: true,
      planetas: planetas,
      ascendente: ascendente,
      calculadoEm: new Date().toLocaleString('pt-BR')
    });
    
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      erro: erro.message
    });
  }
});

// Função para descobrir o signo
function obterSigno(graus) {
  const signos = [
    'Áries', 'Touro', 'Gêmeos', 'Câncer', 
    'Leão', 'Virgem', 'Libra', 'Escorpião',
    'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
  ];
  return signos[Math.floor(graus / 30)];
}

// Página de teste
app.get('/', (req, res) => {
  res.json({ 
    mensagem: 'API de Astrologia funcionando!',
    uso: 'Envie POST para /calcular com dados de nascimento'
  });
});

// Rodar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});