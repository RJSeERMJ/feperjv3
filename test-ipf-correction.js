// Teste do mapeamento correto de eventos IPF GL

// Parâmetros da CBLB para Masculino Clássico
const PARAMETERS = {
  "M": {
    "Classico": {
      "SBD": [1199.72839, 1025.18162, 0.009210],  // Agachamento e Terra
      "B": [320.98041, 281.40258, 0.01008]         // Supino
    }
  }
};

function calculateIPFGL(totalKg, bodyweightKg, sex, equipment, event) {
  if (totalKg === 0) return 0;
  if (bodyweightKg < 35) return 0;

  // Mapeamento correto de eventos
  let normalizedEvent;
  if (event === "A") {
    normalizedEvent = "SBD"; // A (Agachamento) usa parâmetros SBD
  } else if (event === "S") {
    normalizedEvent = "B";   // S (Supino) usa parâmetros específicos para supino
  } else if (event === "T") {
    normalizedEvent = "SBD"; // T (Terra) usa parâmetros SBD
  } else if (event === "B") {
    normalizedEvent = "B";   // B (Supino alternativo) usa parâmetros específicos para supino
  } else {
    normalizedEvent = "SBD"; // Padrão para SBD
  }

  const params = PARAMETERS[sex][equipment][normalizedEvent];
  const denom = params[0] - (params[1] * Math.exp(-1.0 * params[2] * bodyweightKg));
  const resultado = (denom === 0) ? 0 : Math.max(0, totalKg * 100.0 / denom);

  if (isNaN(resultado) || bodyweightKg < 35) {
    return 0.0;
  }
  return resultado;
}

// Teste 1: Masculino Clássico Supino (S) - 93kg, 310kg
const resultadoSupino = calculateIPFGL(310, 93, 'M', 'Classico', 'S');
console.log(`\n=== TESTE SUPINO (S) ===`);
console.log(`Evento: S (Supino)`);
console.log(`Resultado: ${resultadoSupino.toFixed(2)}`);
console.log(`Esperado: 147.08`);
console.log(`Teste passou: ${Math.abs(resultadoSupino - 147.08) < 0.01 ? 'SIM' : 'NÃO'}`);

// Teste 2: Masculino Clássico Agachamento (A) - 93kg, 200kg
const resultadoAgachamento = calculateIPFGL(200, 93, 'M', 'Classico', 'A');
console.log(`\n=== TESTE AGACHAMENTO (A) ===`);
console.log(`Evento: A (Agachamento)`);
console.log(`Resultado: ${resultadoAgachamento.toFixed(2)}`);
console.log(`Usando parâmetros: SBD (não B)`);

// Teste 3: Masculino Clássico Terra (T) - 93kg, 250kg
const resultadoTerra = calculateIPFGL(250, 93, 'M', 'Classico', 'T');
console.log(`\n=== TESTE TERRA (T) ===`);
console.log(`Evento: T (Terra)`);
console.log(`Resultado: ${resultadoTerra.toFixed(2)}`);
console.log(`Usando parâmetros: SBD (não B)`);

console.log(`\n=== RESUMO ===`);
console.log(`✅ S (Supino) → Parâmetros B (supino específico)`);
console.log(`✅ A (Agachamento) → Parâmetros SBD (agachamento/terra)`);
console.log(`✅ T (Terra) → Parâmetros SBD (agachamento/terra)`);
console.log(`✅ B (Supino alternativo) → Parâmetros B (supino específico)`);
