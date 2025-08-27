// Sistema IPF GL (GOODLIFT) Points
// Baseado nos coeficientes oficiais IPF 2020
// Integrado com o sistema Barra Pronta

// ----------------------
// Tipos exportados
// ----------------------
export type Sex = 'M' | 'F' | 'Mx';
export type Equipment = 'Sleeves' | 'Single-ply' | 'Bare' | 'Wraps' | 'Multi-ply' | 'Unlimited' | 'Raw' | 'CLASSICA' | 'EQUIPADO' | 'Classico' | 'Equipado';
export type Event = 'SBD' | 'S' | 'B' | 'D' | 'A' | 'T' | 'AST' | 'AS' | 'ST' | 'AT';

// Tipos internos para os coeficientes IPF 2020
type Coefficients = [number, number, number]; // [A, B, C]
type ByEvent = {
  SBD: Coefficients;  // Agachamento, Terra e Total
  B: Coefficients;    // Supino
};
type ByEquipment = {
  Classico: ByEvent;
  Equipado: ByEvent;
};
type BySex = {
  M: ByEquipment;
  F: ByEquipment;
};

// ----------------------
// Coeficientes oficiais IPF 2020
// ----------------------
const PARAMETERS: BySex = {
  M: {
    Classico: {
      SBD: [1199.72839, 1025.18162, 0.009210],  // Agachamento, Terra e Total
      B: [320.98041, 281.40258, 0.01008]         // Supino
    },
    Equipado: {
      SBD: [1236.25115, 1449.21864, 0.01644],    // Agachamento, Terra e Total
      B: [381.22073, 733.79378, 0.02398]         // Supino
    }
  },
  F: {
    Classico: {
      SBD: [610.32796, 1045.59282, 0.03048],     // Agachamento, Terra e Total
      B: [142.40398, 442.52671, 0.04724]          // Supino
    },
    Equipado: {
      SBD: [758.63878, 949.31382, 0.02435],       // Agachamento, Terra e Total
      B: [221.82209, 357.00377, 0.02937]          // Supino
    }
  }
};

// ----------------------
// Função principal de cálculo IPF GL
// ----------------------
export const goodlift = (
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment,
  event: Event,
): number => {
  // Validações básicas
  if (totalKg === 0 || totalKg < 0) return 0;
  if (bodyweightKg < 35 || bodyweightKg > 200) return 0;

  // Normalizar equipamento para compatibilidade com IPF 2020
  let normalizedEquipment: 'Classico' | 'Equipado';
  if (equipment === "Bare" || equipment === "Wraps" || equipment === "Raw" || 
      equipment === "Sleeves" || equipment === "CLASSICA" || equipment === "Classico") {
    normalizedEquipment = "Classico";
  } else if (equipment === "Multi-ply" || equipment === "Unlimited" || 
             equipment === "Single-ply" || equipment === "EQUIPADO" || equipment === "Equipado") {
    normalizedEquipment = "Equipado";
  } else {
    // Padrão para equipamento não reconhecido
    normalizedEquipment = "Classico";
  }

  // Normalizar sexo (Mx usa fórmula masculina)
  let normalizedSex = sex;
  if (sex === "Mx") normalizedSex = "M";

  if (normalizedSex !== "M" && normalizedSex !== "F") return 0;

  // Mapeamento de eventos para compatibilidade com IPF 2020
  let normalizedEvent: 'SBD' | 'B';
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
};

// ----------------------
// API Pública para compatibilidade
// ----------------------
export function calculateIPFGLPoints(
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment,
  event: Event = 'SBD'
): number {
  return goodlift(totalKg, bodyweightKg, sex, equipment, event);
}

// ----------------------
// Funções específicas para o sistema Barra Pronta
// ----------------------

/**
 * Calcula IPF GL Points para o total (Squat + Bench + Deadlift)
 */
export const calculateIPFGLPointsTotal = (
  squatKg: number,
  benchKg: number,
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  const total = squatKg + benchKg + deadliftKg;
  return goodlift(total, bodyweightKg, sex, equipment, 'SBD');
};

/**
 * Calcula IPF GL Points para o supino
 */
export const calculateIPFGLPointsBench = (
  benchKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  return goodlift(benchKg, bodyweightKg, sex, equipment, 'S');
};

/**
 * Calcula IPF GL Points para o agachamento
 */
export const calculateIPFGLPointsSquat = (
  squatKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  return goodlift(squatKg, bodyweightKg, sex, equipment, 'A');
};

/**
 * Calcula IPF GL Points para o terra
 */
export const calculateIPFGLPointsDeadlift = (
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number => {
  return goodlift(deadliftKg, bodyweightKg, sex, equipment, 'T');
};

/**
 * Calcula IPF GL Points baseado no tipo de competição
 * @param squatKg - Peso do agachamento em kg
 * @param benchKg - Peso do supino em kg
 * @param deadliftKg - Peso do terra em kg
 * @param bodyweightKg - Peso corporal em kg
 * @param sex - Sexo do atleta (M/F)
 * @param equipment - Equipamento usado
 * @param competitionType - Tipo de competição (S, B, T, AST, AS, ST, AT)
 * @returns Pontuação IPF GL para o tipo específico
 */
export const calculateIPFGLPointsByCompetitionType = (
  squatKg: number,
  benchKg: number,
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment,
  competitionType: string
): number => {
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
};

// ----------------------
// Funções auxiliares para o sistema Barra Pronta
// ----------------------

/**
 * Normaliza o equipamento para o formato IPF
 */
export const normalizeEquipment = (equipment: string): 'Classico' | 'Equipado' => {
  if (equipment === "Bare" || equipment === "Wraps" || equipment === "Raw" || 
      equipment === "Sleeves" || equipment === "CLASSICA" || equipment === "Classico") {
    return "Classico";
  } else if (equipment === "Multi-ply" || equipment === "Unlimited" || 
             equipment === "Single-ply" || equipment === "EQUIPADO" || equipment === "Equipado") {
    return "Equipado";
  } else {
    return "Classico";
  }
};

/**
 * Normaliza o evento para o formato IPF
 */
export const normalizeEvent = (event: string): 'SBD' | 'B' => {
  const normalizedEvent = event.trim().toUpperCase();
  
  if (normalizedEvent === "S" || normalizedEvent === "B") {
    return "B";   // Supino
  } else {
    return "SBD"; // Agachamento, Terra, Total e combinações
  }
};

/**
 * Calcula o total baseado no tipo de competição
 */
export const calculateTotalByCompetitionType = (
  squatKg: number,
  benchKg: number,
  deadliftKg: number,
  competitionType: string
): number => {
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
};

// ----------------------
// Validação de parâmetros
// ----------------------
export function validateParameters(
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment,
  event: Event
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (totalKg <= 0) {
    errors.push("Total deve ser maior que zero");
  }

  if (bodyweightKg < 35) {
    errors.push("Peso corporal deve ser pelo menos 35kg");
  }

  if (bodyweightKg > 200) {
    errors.push("Peso corporal deve ser no máximo 200kg");
  }

  if (!['M', 'F', 'Mx'].includes(sex)) {
    errors.push("Sexo deve ser M, F ou Mx");
  }

  if (!['Sleeves', 'Single-ply', 'Bare', 'Wraps', 'Multi-ply', 'Unlimited', 'Raw', 'CLASSICA', 'EQUIPADO', 'Classico', 'Equipado'].includes(equipment)) {
    errors.push("Equipamento não reconhecido");
  }

  if (!['SBD', 'S', 'B', 'D', 'A', 'T', 'AST', 'AS', 'ST', 'AT'].includes(event)) {
    errors.push("Evento não reconhecido");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ----------------------
// Testes e validação
// ----------------------
export function testIPFGLCalculation() {
  console.log("🧪 Testando cálculo IPF GL Points...");
  
  // Teste 1: Masculino Clássico Supino - 93kg, 310kg (deve dar 147.08)
  const test1 = goodlift(310, 93, 'M', 'Classico', 'S');
  console.log(`Teste 1 - M Clássico Supino (93kg, 310kg): ${test1.toFixed(2)}`);
  
  // Teste 2: Feminino Equipado Total - 60kg, 400kg
  const test2 = goodlift(400, 60, 'F', 'Equipado', 'SBD');
  console.log(`Teste 2 - F Equipado Total (60kg, 400kg): ${test2.toFixed(2)}`);
  
  // Teste 3: Masculino Clássico Agachamento - 80kg, 250kg
  const test3 = goodlift(250, 80, 'M', 'Classico', 'A');
  console.log(`Teste 3 - M Clássico Agachamento (80kg, 250kg): ${test3.toFixed(2)}`);
  
  return { test1, test2, test3 };
}

// ----------------------
// Documentação dos coeficientes
// ----------------------
export const IPF_COEFFICIENTS_DOCS = {
  version: "2020",
  source: "IPF Official GL Points Coefficients",
  description: "Coeficientes oficiais IPF para cálculo de GL Points",
  formula: "GL = (Total × 100) / (A - B × e^(-C × PesoCorporal))",
  parameters: {
    M: {
      Classico: {
        SBD: "Agachamento, Terra e Total - [1199.72839, 1025.18162, 0.009210]",
        B: "Supino - [320.98041, 281.40258, 0.01008]"
      },
      Equipado: {
        SBD: "Agachamento, Terra e Total - [1236.25115, 1449.21864, 0.01644]",
        B: "Supino - [381.22073, 733.79378, 0.02398]"
      }
    },
    F: {
      Classico: {
        SBD: "Agachamento, Terra e Total - [610.32796, 1045.59282, 0.03048]",
        B: "Supino - [142.40398, 442.52671, 0.04724]"
      },
      Equipado: {
        SBD: "Agachamento, Terra e Total - [758.63878, 949.31382, 0.02435]",
        B: "Supino - [221.82209, 357.00377, 0.02937]"
      }
    }
  }
};
