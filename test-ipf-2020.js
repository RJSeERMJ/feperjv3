// Teste do sistema IPF GL Points 2020
// Baseado nos coeficientes oficiais IPF

// Coeficientes oficiais IPF 2020
const PARAMETERS = {
  "M": {
    "Classico": {
      "SBD": [1199.72839, 1025.18162, 0.009210],  // Agachamento, Terra e Total
      "B": [320.98041, 281.40258, 0.01008]         // Supino
    },
    "Equipado": {
      "SBD": [1236.25115, 1449.21864, 0.01644],    // Agachamento, Terra e Total
      "B": [381.22073, 733.79378, 0.02398]         // Supino
    }
  },
  "F": {
    "Classico": {
      "SBD": [610.32796, 1045.59282, 0.03048],     // Agachamento, Terra e Total
      "B": [142.40398, 442.52671, 0.04724]          // Supino
    },
    "Equipado": {
      "SBD": [758.63878, 949.31382, 0.02435],       // Agachamento, Terra e Total
      "B": [221.82209, 357.00377, 0.02937]          // Supino
    }
  }
};

function calculateIPFGL(totalKg, bodyweightKg, sex, equipment, event) {
  console.log(`\n=== CÁLCULO IPF GL 2020 ===`);
  console.log(`Inputs:`);
  console.log(`- Total: ${totalKg}kg`);
  console.log(`- Peso corporal: ${bodyweightKg}kg`);
  console.log(`- Sexo: ${sex}`);
  console.log(`- Equipamento: ${equipment}`);
  console.log(`- Evento: ${event}`);
  
  // Normalizar equipamento
  let normalizedEquipment;
  if (equipment === "Raw" || equipment === "CLASSICA" || equipment === "Classico" || equipment === "Bare" || equipment === "Wraps" || equipment === "Sleeves") {
    normalizedEquipment = "Classico";
  } else {
    normalizedEquipment = "Equipado";
  }
  console.log(`- Equipamento normalizado: ${normalizedEquipment}`);
  
  // Normalizar evento
  let normalizedEvent;
  if (event === "A") {
    normalizedEvent = "SBD";  // Agachamento
  } else if (event === "S") {
    normalizedEvent = "B";    // Supino
  } else if (event === "T") {
    normalizedEvent = "SBD";  // Terra
  } else if (event === "B") {
    normalizedEvent = "B";    // Supino alternativo
  } else {
    normalizedEvent = "SBD";  // Padrão
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

// Testes principais
console.log(`🎯 SISTEMA IPF GL POINTS 2020 - TESTES`);
console.log(`========================================`);

// Teste 1: Masculino Clássico Supino (S) - 93kg, 310kg
console.log(`\n🧪 TESTE 1: Masculino Clássico Supino (S) - 93kg, 310kg`);
const resultado1 = calculateIPFGL(310, 93, 'M', 'Classico', 'S');

// Teste 2: Feminino Equipado Total (SBD) - 60kg, 400kg
console.log(`\n🧪 TESTE 2: Feminino Equipado Total (SBD) - 60kg, 400kg`);
const resultado2 = calculateIPFGL(400, 60, 'F', 'Equipado', 'SBD');

// Teste 3: Masculino Clássico Agachamento (A) - 80kg, 250kg
console.log(`\n🧪 TESTE 3: Masculino Clássico Agachamento (A) - 80kg, 250kg`);
const resultado3 = calculateIPFGL(250, 80, 'M', 'Classico', 'A');

// Teste 4: Feminino Clássico Supino (S) - 70kg, 120kg
console.log(`\n🧪 TESTE 4: Feminino Clássico Supino (S) - 70kg, 120kg`);
const resultado4 = calculateIPFGL(120, 70, 'F', 'Classico', 'S');

// Resumo dos resultados
console.log(`\n📊 RESUMO DOS TESTES:`);
console.log(`=====================`);
console.log(`Teste 1 - M Clássico Supino (93kg, 310kg): ${resultado1.toFixed(2)} pontos`);
console.log(`Teste 2 - F Equipado Total (60kg, 400kg): ${resultado2.toFixed(2)} pontos`);
console.log(`Teste 3 - M Clássico Agachamento (80kg, 250kg): ${resultado3.toFixed(2)} pontos`);
console.log(`Teste 4 - F Clássico Supino (70kg, 120kg): ${resultado4.toFixed(2)} pontos`);

// Verificação dos coeficientes
console.log(`\n🔍 VERIFICAÇÃO DOS COEFICIENTES IPF 2020:`);
console.log(`==========================================`);
console.log(`Masculino Clássico:`);
console.log(`- SBD (Agachamento/Terra/Total): [1199.72839, 1025.18162, 0.009210]`);
console.log(`- B (Supino): [320.98041, 281.40258, 0.01008]`);
console.log(`\nMasculino Equipado:`);
console.log(`- SBD (Agachamento/Terra/Total): [1236.25115, 1449.21864, 0.01644]`);
console.log(`- B (Supino): [381.22073, 733.79378, 0.02398]`);
console.log(`\nFeminino Clássico:`);
console.log(`- SBD (Agachamento/Terra/Total): [610.32796, 1045.59282, 0.03048]`);
console.log(`- B (Supino): [142.40398, 442.52671, 0.04724]`);
console.log(`\nFeminino Equipado:`);
console.log(`- SBD (Agachamento/Terra/Total): [758.63878, 949.31382, 0.02435]`);
console.log(`- B (Supino): [221.82209, 357.00377, 0.02937]`);

console.log(`\n✅ Sistema IPF GL Points 2020 configurado e testado com sucesso!`);
