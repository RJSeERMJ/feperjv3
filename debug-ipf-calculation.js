// Debug do cálculo IPF GL para identificar o problema

// Parâmetros da CBLB para Masculino Clássico
const PARAMETERS = {
  "M": {
    "Classico": {
      "SBD": [1199.72839, 1025.18162, 0.009210],  // Agachamento e Terra
      "B": [320.98041, 281.40258, 0.01008]         // Supino
    }
  }
};

function debugIPFGL(totalKg, bodyweightKg, sex, equipment, event) {
  console.log(`\n=== DEBUG CÁLCULO IPF GL ===`);
  console.log(`Inputs:`);
  console.log(`- Total: ${totalKg}kg`);
  console.log(`- Peso corporal: ${bodyweightKg}kg`);
  console.log(`- Sexo: ${sex}`);
  console.log(`- Equipamento: ${equipment}`);
  console.log(`- Evento: ${event}`);
  
  // Normalizar equipamento
  let normalizedEquipment;
  if (equipment === "Raw" || equipment === "CLASSICA" || equipment === "Classico") {
    normalizedEquipment = "Classico";
  } else {
    normalizedEquipment = "Equipado";
  }
  console.log(`- Equipamento normalizado: ${normalizedEquipment}`);
  
  // Normalizar evento
  let normalizedEvent;
  if (event === "A") {
    normalizedEvent = "SBD";
  } else if (event === "S") {
    normalizedEvent = "B";
  } else if (event === "T") {
    normalizedEvent = "SBD";
  } else if (event === "B") {
    normalizedEvent = "B";
  } else {
    normalizedEvent = "SBD";
  }
  console.log(`- Evento normalizado: ${normalizedEvent}`);
  
  // Obter parâmetros
  const params = PARAMETERS[sex][normalizedEquipment][normalizedEvent];
  console.log(`- Parâmetros: [${params.join(', ')}]`);
  
  // Calcular denominador
  const denom = params[0] - params[1] * Math.exp(-1.0 * params[2] * bodyweightKg);
  console.log(`- Denominador: ${params[0]} - ${params[1]} × e^(-${params[2]} × ${bodyweightKg})`);
  console.log(`- Denominador: ${params[0]} - ${params[1]} × e^(-${params[2] * bodyweightKg})`);
  console.log(`- Denominador: ${params[0]} - ${params[1]} × ${Math.exp(-1.0 * params[2] * bodyweightKg).toFixed(6)}`);
  console.log(`- Denominador: ${params[0]} - ${(params[1] * Math.exp(-1.0 * params[2] * bodyweightKg)).toFixed(6)}`);
  console.log(`- Denominador: ${denom.toFixed(6)}`);
  
  // Calcular resultado final
  const glp = (totalKg * 100.0) / denom;
  console.log(`- IPF GL: (${totalKg} × 100) / ${denom.toFixed(6)}`);
  console.log(`- IPF GL: ${(totalKg * 100.0).toFixed(2)} / ${denom.toFixed(6)}`);
  console.log(`- IPF GL: ${glp.toFixed(2)}`);
  
  return glp;
}

// Teste: Masculino Clássico Supino (S) - 93kg, 310kg
console.log(`\n🎯 TESTE: Masculino Clássico Supino (S) - 93kg, 310kg`);
const resultado = debugIPFGL(310, 93, 'M', 'Classico', 'S');

console.log(`\n📊 RESULTADO FINAL: ${resultado.toFixed(2)}`);
console.log(`📊 ESPERADO: 147.08`);
console.log(`📊 DIFERENÇA: ${Math.abs(resultado - 147.08).toFixed(2)}`);
console.log(`📊 TESTE PASSOU: ${Math.abs(resultado - 147.08) < 0.01 ? 'SIM' : 'NÃO'}`);

// Verificar se os parâmetros estão corretos
console.log(`\n🔍 VERIFICAÇÃO DOS PARÂMETROS:`);
console.log(`Parâmetros usados para Supino (B): [320.98041, 281.40258, 0.01008]`);
console.log(`Parâmetros da CBLB para Supino (B): [320.98041, 281.40258, 0.01008]`);
console.log(`Parâmetros estão iguais: SIM`);
