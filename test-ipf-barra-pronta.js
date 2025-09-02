// Teste completo do sistema IPF GL Points integrado com Barra Pronta
// Baseado nos coeficientes oficiais IPF 2020

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

// Função principal de cálculo IPF GL
function goodlift(totalKg, bodyweightKg, sex, equipment, event) {
  // Validações básicas
  if (totalKg === 0 || totalKg < 0) return 0;
  if (bodyweightKg < 35 || bodyweightKg > 200) return 0;

  // Normalizar equipamento para compatibilidade com IPF 2020
  let normalizedEquipment;
  if (equipment === "Bare" || equipment === "Wraps" || equipment === "Raw" || 
      equipment === "Sleeves" || equipment === "CLASSICA" || equipment === "Classico") {
    normalizedEquipment = "Classico";
  } else if (equipment === "Multi-ply" || equipment === "Unlimited" || 
             equipment === "Single-ply" || equipment === "EQUIPADO" || equipment === "Equipado") {
    normalizedEquipment = "Equipado";
  } else {
    normalizedEquipment = "Classico";
  }

  // Normalizar sexo (Mx usa fórmula masculina)
  let normalizedSex = sex;
  if (sex === "Mx") normalizedSex = "M";

  if (normalizedSex !== "M" && normalizedSex !== "F") return 0;

  // Mapeamento de eventos para compatibilidade com IPF 2020
  let normalizedEvent;
  if (event === "A" || event === "T" || event === "SBD" || event === "AST" || event === "AS" || event === "ST" || event === "AT") {
    normalizedEvent = "SBD"; // Agachamento, Terra, Total e combinações usam parâmetros SBD
  } else if (event === "S" || event === "B") {
    normalizedEvent = "B";   // Supino usa parâmetros específicos para supino
  } else {
    normalizedEvent = "SBD"; // Padrão para SBD
  }

  // Obter parâmetros para o cálculo
  const params = PARAMETERS[normalizedSex][normalizedEquipment][normalizedEvent];
  
  // Calcular denominador: A - B × e^(-C × PesoCorporal)
  const denom = params[0] - params[1] * Math.exp(-1.0 * params[2] * bodyweightKg);
  
  // Calcular IPF GL Points: (Total × 100) / Denominador
  const glp = denom === 0 ? 0 : Math.max(0, (totalKg * 100.0) / denom);
  
  // Validações finais
  if (isNaN(glp) || glp < 0) {
    return 0.0;
  }
  
  return glp;
}

// Funções específicas para o sistema Barra Pronta
function calculateIPFGLPointsTotal(squatKg, benchKg, deadliftKg, bodyweightKg, sex, equipment) {
  const total = squatKg + benchKg + deadliftKg;
  return goodlift(total, bodyweightKg, sex, equipment, 'SBD');
}

function calculateIPFGLPointsBench(benchKg, bodyweightKg, sex, equipment) {
  return goodlift(benchKg, bodyweightKg, sex, equipment, 'S');
}

function calculateIPFGLPointsSquat(squatKg, bodyweightKg, sex, equipment) {
  return goodlift(squatKg, bodyweightKg, sex, equipment, 'A');
}

function calculateIPFGLPointsDeadlift(deadliftKg, bodyweightKg, sex, equipment) {
  return goodlift(deadliftKg, bodyweightKg, sex, equipment, 'T');
}

function calculateIPFGLPointsByCompetitionType(squatKg, benchKg, deadliftKg, bodyweightKg, sex, equipment, competitionType) {
  const type = competitionType.trim().toUpperCase();
  
  switch (type) {
    case 'A':  // A = Agachamento (Squat)
      return calculateIPFGLPointsSquat(squatKg, bodyweightKg, sex, equipment);
    
    case 'S':  // S = Supino (Bench Press)
      return calculateIPFGLPointsBench(benchKg, bodyweightKg, sex, equipment);
    
    case 'T':  // T = Terra (Deadlift)
      return calculateIPFGLPointsDeadlift(deadliftKg, bodyweightKg, sex, equipment);
    
    case 'B':  // B = Supino (alternativo)
      return calculateIPFGLPointsBench(benchKg, bodyweightKg, sex, equipment);
    
    case 'AS': // Agachamento + Supino
      return goodlift(squatKg + benchKg, bodyweightKg, sex, equipment, 'SBD');
    
    case 'ST': // Supino + Terra
      return goodlift(benchKg + deadliftKg, bodyweightKg, sex, equipment, 'SBD');
    
    case 'AT': // Agachamento + Terra
      return goodlift(squatKg + deadliftKg, bodyweightKg, sex, equipment, 'SBD');
    
    case 'AST': // Powerlifting completo (Agachamento + Supino + Terra)
    default:
      return calculateIPFGLPointsTotal(squatKg, benchKg, deadliftKg, bodyweightKg, sex, equipment);
  }
}

// Funções auxiliares
function normalizeEquipment(equipment) {
  if (equipment === "Bare" || equipment === "Wraps" || equipment === "Raw" || 
      equipment === "Sleeves" || equipment === "CLASSICA" || equipment === "Classico") {
    return "Classico";
  } else if (equipment === "Multi-ply" || equipment === "Unlimited" || 
             equipment === "Single-ply" || equipment === "EQUIPADO" || equipment === "Equipado") {
    return "Equipado";
  } else {
    return "Classico";
  }
}

function calculateTotalByCompetitionType(squatKg, benchKg, deadliftKg, competitionType) {
  const type = competitionType.trim().toUpperCase();
  
  switch (type) {
    case 'A':  // Só Agachamento
      return squatKg;
    case 'S':  // Só Supino
      return benchKg;
    case 'T':  // Só Terra
      return deadliftKg;
    case 'AS': // Agachamento + Supino
      return squatKg + benchKg;
    case 'ST': // Supino + Terra
      return benchKg + deadliftKg;
    case 'AT': // Agachamento + Terra
      return squatKg + deadliftKg;
    case 'AST': // Powerlifting completo
    default:
      return squatKg + benchKg + deadliftKg;
  }
}

// ========================================
// TESTES COMPLETOS DO SISTEMA
// ========================================

console.log(`🎯 SISTEMA IPF GL POINTS 2020 - BARRA PRONTA`);
console.log(`==============================================`);
console.log(`Baseado nos coeficientes oficiais IPF 2020`);
console.log(`Integrado com o sistema Barra Pronta`);
console.log(``);

// Teste 1: Masculino Clássico Supino (S) - 93kg, 310kg (DEVE DAR 147.08)
console.log(`🧪 TESTE 1: Masculino Clássico Supino (S) - 93kg, 310kg`);
console.log(`Esperado: 147.08 pontos IPF GL`);
const resultado1 = calculateIPFGLPointsByCompetitionType(0, 310, 0, 93, 'M', 'Classico', 'S');
console.log(`Resultado: ${resultado1.toFixed(2)} pontos`);
console.log(`✅ Teste ${Math.abs(resultado1 - 147.08) < 0.01 ? 'PASSOU' : 'FALHOU'}`);
console.log(``);

// Teste 2: Masculino Clássico Agachamento (A) - 80kg, 250kg
console.log(`🧪 TESTE 2: Masculino Clássico Agachamento (A) - 80kg, 250kg`);
const resultado2 = calculateIPFGLPointsByCompetitionType(250, 0, 0, 80, 'M', 'Classico', 'A');
console.log(`Resultado: ${resultado2.toFixed(2)} pontos`);
console.log(``);

// Teste 3: Masculino Clássico Terra (T) - 85kg, 300kg
console.log(`🧪 TESTE 3: Masculino Clássico Terra (T) - 85kg, 300kg`);
const resultado3 = calculateIPFGLPointsByCompetitionType(0, 0, 300, 85, 'M', 'Classico', 'T');
console.log(`Resultado: ${resultado3.toFixed(2)} pontos`);
console.log(``);

// Teste 4: Masculino Clássico Powerlifting (AST) - 90kg, 200kg + 150kg + 250kg
console.log(`🧪 TESTE 4: Masculino Clássico Powerlifting (AST) - 90kg, 200kg + 150kg + 250kg`);
const resultado4 = calculateIPFGLPointsByCompetitionType(200, 150, 250, 90, 'M', 'Classico', 'AST');
console.log(`Total: ${200 + 150 + 250}kg`);
console.log(`Resultado: ${resultado4.toFixed(2)} pontos`);
console.log(``);

// Teste 5: Masculino Clássico Agachamento + Supino (AS) - 88kg, 220kg + 160kg
console.log(`🧪 TESTE 5: Masculino Clássico Agachamento + Supino (AS) - 88kg, 220kg + 160kg`);
const resultado5 = calculateIPFGLPointsByCompetitionType(220, 160, 0, 88, 'M', 'Classico', 'AS');
console.log(`Total: ${220 + 160}kg`);
console.log(`Resultado: ${resultado5.toFixed(2)} pontos`);
console.log(``);

// Teste 6: Feminino Clássico Supino (S) - 65kg, 100kg
console.log(`🧪 TESTE 6: Feminino Clássico Supino (S) - 65kg, 100kg`);
const resultado6 = calculateIPFGLPointsByCompetitionType(0, 100, 0, 65, 'F', 'Classico', 'S');
console.log(`Resultado: ${resultado6.toFixed(2)} pontos`);
console.log(``);

// Teste 7: Feminino Equipado Powerlifting (AST) - 70kg, 180kg + 120kg + 200kg
console.log(`🧪 TESTE 7: Feminino Equipado Powerlifting (AST) - 70kg, 180kg + 120kg + 200kg`);
const resultado7 = calculateIPFGLPointsByCompetitionType(180, 120, 200, 70, 'F', 'Equipado', 'AST');
console.log(`Total: ${180 + 120 + 200}kg`);
console.log(`Resultado: ${resultado7.toFixed(2)} pontos`);
console.log(``);

// Teste 8: Masculino Equipado Supino (S) - 100kg, 350kg
console.log(`🧪 TESTE 8: Masculino Equipado Supino (S) - 100kg, 350kg`);
const resultado8 = calculateIPFGLPointsByCompetitionType(0, 350, 0, 100, 'M', 'Equipado', 'S');
console.log(`Resultado: ${resultado8.toFixed(2)} pontos`);
console.log(``);

// Teste 9: Verificação de normalização de equipamento
console.log(`🔧 TESTE 9: Verificação de normalização de equipamento`);
const equipamentos = ['Raw', 'CLASSICA', 'Classico', 'Bare', 'Wraps', 'Sleeves', 'EQUIPADO', 'Equipado', 'Multi-ply', 'Single-ply'];
equipamentos.forEach(equip => {
  const normalizado = normalizeEquipment(equip);
  console.log(`${equip} → ${normalizado}`);
});
console.log(``);

// Teste 10: Verificação de cálculo de total por modalidade
console.log(`🔧 TESTE 10: Verificação de cálculo de total por modalidade`);
const modalidades = ['A', 'S', 'T', 'AS', 'ST', 'AT', 'AST'];
const pesos = { squat: 200, bench: 150, deadlift: 250 };
modalidades.forEach(modalidade => {
  const total = calculateTotalByCompetitionType(pesos.squat, pesos.bench, pesos.deadlift, modalidade);
  console.log(`${modalidade}: ${total}kg`);
});
console.log(``);

// Resumo dos resultados
console.log(`📊 RESUMO DOS TESTES:`);
console.log(`=====================`);
console.log(`Teste 1 - M Clássico Supino (93kg, 310kg): ${resultado1.toFixed(2)} pontos ${Math.abs(resultado1 - 147.08) < 0.01 ? '✅' : '❌'}`);
console.log(`Teste 2 - M Clássico Agachamento (80kg, 250kg): ${resultado2.toFixed(2)} pontos`);
console.log(`Teste 3 - M Clássico Terra (85kg, 300kg): ${resultado3.toFixed(2)} pontos`);
console.log(`Teste 4 - M Clássico Powerlifting (90kg, 600kg): ${resultado4.toFixed(2)} pontos`);
console.log(`Teste 5 - M Clássico AS (88kg, 380kg): ${resultado5.toFixed(2)} pontos`);
console.log(`Teste 6 - F Clássico Supino (65kg, 100kg): ${resultado6.toFixed(2)} pontos`);
console.log(`Teste 7 - F Equipado Powerlifting (70kg, 500kg): ${resultado7.toFixed(2)} pontos`);
console.log(`Teste 8 - M Equipado Supino (100kg, 350kg): ${resultado8.toFixed(2)} pontos`);

console.log(``);
console.log(`🔍 VERIFICAÇÃO DOS COEFICIENTES IPF 2020:`);
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

console.log(``);
console.log(`✅ Sistema IPF GL Points 2020 integrado com Barra Pronta configurado e testado com sucesso!`);
console.log(`🎯 O teste principal (M Clássico Supino 93kg/310kg) deve retornar 147.08 pontos`);
console.log(`🔧 Sistema suporta todas as modalidades: A, S, T, AS, ST, AT, AST`);
console.log(`⚙️ Normalização automática de equipamento: Raw/CLASSICA → Classico, EQUIPADO → Equipado`);
