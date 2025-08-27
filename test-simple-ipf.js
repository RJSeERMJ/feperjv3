// Teste simples do sistema IPF GL Points
// Verificar se está calculando 147.08 para M Clássico Supino 93kg/310kg

// Coeficientes oficiais IPF 2020
const PARAMETERS = {
  "M": {
    "Classico": {
      "SBD": [1199.72839, 1025.18162, 0.009210],  // Agachamento, Terra e Total
      "B": [320.98041, 281.40258, 0.01008]         // Supino
    }
  }
};

// Função de cálculo IPF GL
function goodlift(totalKg, bodyweightKg, sex, equipment, event) {
  console.log(`\n=== CÁLCULO IPF GL ===`);
  console.log(`Inputs: Total=${totalKg}kg, Peso=${bodyweightKg}kg, Sexo=${sex}, Equipamento=${equipment}, Evento=${event}`);
  
  // Normalizar equipamento
  let normalizedEquipment;
  if (equipment === "Raw" || equipment === "CLASSICA" || equipment === "Classico") {
    normalizedEquipment = "Classico";
  } else {
    normalizedEquipment = "Equipado";
  }
  console.log(`Equipamento normalizado: ${normalizedEquipment}`);
  
  // Normalizar evento
  let normalizedEvent;
  if (event === "S" || event === "B") {
    normalizedEvent = "B";   // Supino usa parâmetros B
  } else {
    normalizedEvent = "SBD"; // Outros usam parâmetros SBD
  }
  console.log(`Evento normalizado: ${normalizedEvent}`);
  
  // Obter parâmetros
  const params = PARAMETERS[sex][normalizedEquipment][normalizedEvent];
  console.log(`Parâmetros: [${params.join(', ')}]`);
  
  // Calcular denominador
  const denom = params[0] - params[1] * Math.exp(-1.0 * params[2] * bodyweightKg);
  console.log(`Denominador: ${params[0]} - ${params[1]} × e^(-${params[2]} × ${bodyweightKg})`);
  console.log(`Denominador: ${denom.toFixed(6)}`);
  
  // Calcular resultado
  const glp = (totalKg * 100.0) / denom;
  console.log(`IPF GL: (${totalKg} × 100) / ${denom.toFixed(6)} = ${glp.toFixed(2)}`);
  
  return glp;
}

// Teste principal
console.log(`🎯 TESTE: Masculino Clássico Supino (S) - 93kg, 310kg`);
console.log(`Esperado: 147.08 pontos IPF GL`);
console.log(`========================================`);

const resultado = goodlift(310, 93, 'M', 'Classico', 'S');

console.log(`\n📊 RESULTADO FINAL: ${resultado.toFixed(2)} pontos`);
console.log(`📊 ESPERADO: 147.08 pontos`);
console.log(`🎯 TESTE ${Math.abs(resultado - 147.08) < 0.01 ? 'PASSOU ✅' : 'FALHOU ❌'}`);

if (Math.abs(resultado - 147.08) < 0.01) {
  console.log(`\n🎉 SUCESSO! O sistema está calculando corretamente!`);
} else {
  console.log(`\n🚨 PROBLEMA! O sistema não está calculando corretamente.`);
  console.log(`Diferença: ${Math.abs(resultado - 147.08).toFixed(2)} pontos`);
}
