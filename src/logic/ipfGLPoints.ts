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

// ----------------------
// Funções para Best Lifter (IPF Official Rules)
// ----------------------

/**
 * Calcula a divisão de idade IPF baseada na data de nascimento e sexo
 * @param birthDate - Data de nascimento (YYYY-MM-DD)
 * @param sex - Sexo do atleta (M/F)
 * @returns Divisão de idade IPF
 */
export const calculateIPFAgeDivision = (birthDate: string, sex: 'M' | 'F'): string => {
  if (!birthDate) return 'OP';
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  // Regras IPF oficiais para divisões de idade
  if (sex === 'M') {
    if (age < 18) return 'SJ';      // Sub-Junior
    if (age < 23) return 'JR';      // Junior
    if (age < 40) return 'OP';      // Open
    if (age < 50) return 'M1';      // Master I
    if (age < 60) return 'M2';      // Master II
    if (age < 70) return 'M3';      // Master III
    if (age < 80) return 'M4';      // Master IV
    return 'M4';                     // Master IV+
  } else { // Feminino
    if (age < 18) return 'SJ';      // Sub-Junior
    if (age < 23) return 'JR';      // Junior
    if (age < 40) return 'OP';      // Open
    if (age < 50) return 'M1';      // Master I
    if (age < 60) return 'M2';      // Master II
    if (age < 70) return 'M3';      // Master III
    if (age < 80) return 'M4';      // Master IV
    return 'M4';                     // Master IV+
  }
};

/**
 * Obtém o nome de exibição da divisão de idade
 * @param division - Código da divisão IPF
 * @returns Nome da divisão em português
 */
export const getAgeDivisionDisplayName = (division: string): string => {
  const divisionNames: { [key: string]: string } = {
    'SJ': 'Sub-Junior',
    'JR': 'Junior',
    'OP': 'Open',
    'M1': 'Master I',
    'M2': 'Master II',
    'M3': 'Master III',
    'M4': 'Master IV'
  };
  return divisionNames[division] || division;
};

/**
 * Determina o tipo de evento baseado nos movimentos da competição
 * @param movements - String de movimentos (ex: 'AST', 'S', 'A', etc.)
 * @returns Tipo de evento para usar nos parâmetros corretos
 */
export const getEventTypeFromMovements = (movements: string): 'SBD' | 'B' => {
  const normalizedMovements = movements.trim().toUpperCase();
  
  // Se é só supino, usar parâmetros de supino
  if (normalizedMovements === 'S' || normalizedMovements === 'B') {
    return 'B';
  }
  
  // Para todos os outros casos (SBD, A, T, AS, ST, AT, AST), usar parâmetros SBD
  return 'SBD';
};

/**
 * Interface para resultado de Best Lifter
 */
export interface BestLifterResult {
  position: number;
  entry: any; // Entry do atleta
  total: number;
  points: number;
  bodyweight: number;
  division: string;
  equipment: string;
  sex: string;
  eventType: 'SBD' | 'B';
}

/**
 * Interface para categoria de Best Lifter
 */
export interface BestLifterCategory {
  sex: string;
  equipment: string;
  ageDivision: string;
  eventType: Event; // Aceitar todos os tipos de evento (AST, S, T, AS, ST, AT)
  results: BestLifterResult[];
  hasMinimumAthletes: boolean;
}

/**
 * Calcula os resultados de Best Lifter seguindo as regras oficiais IPF
 * @param entries - Lista de inscrições dos atletas
 * @returns Categorias de Best Lifter com top 3
 */
export const calculateBestLifterResults = (entries: readonly any[]): BestLifterCategory[] => {
  console.log('🔍 calculateBestLifterResults - Entradas recebidas:', entries.length);
  
  const categories: { [key: string]: BestLifterCategory } = {};
  
  // Processar cada atleta
  entries.forEach((entry, index) => {
    console.log(`🏃 Processando atleta ${index + 1}: ${entry.name} - Movimentos: ${entry.movements}`);
    
    // CORREÇÃO: Usar a divisão registrada na inscrição em vez de calcular pela data de nascimento
    // Respeitar a escolha do atleta na inscrição
    const ageDivision = entry.division || 'OP'; // Usar divisão da inscrição, padrão 'OP' se não informado
    
    // Normalizar equipamento
    const normalizedEquipment = normalizeEquipment(entry.equipment);
    
    // Processar múltiplas modalidades se houver vírgulas
    const movementsList = entry.movements ? entry.movements.split(',').map((m: string) => m.trim()) : ['AST'];
    
    console.log(`📋 Modalidades detectadas para ${entry.name}:`, movementsList);
    
    // Processar cada modalidade separadamente
    movementsList.forEach((movement: string) => {
      if (!movement) return;
      
      console.log(`🎯 Processando modalidade "${movement}" para ${entry.name}`);
      
      // Determinar tipo de evento para esta modalidade
      const eventType = getEventTypeFromMovements(movement);
      
      // Calcular total baseado na modalidade específica
      const total = calculateTotalByCompetitionType(
        Math.max(entry.squat1 || 0, entry.squat2 || 0, entry.squat3 || 0),
        Math.max(entry.bench1 || 0, entry.bench2 || 0, entry.bench3 || 0),
        Math.max(entry.deadlift1 || 0, entry.deadlift2 || 0, entry.deadlift3 || 0),
        movement
      );
      
      console.log(`💪 Total para ${entry.name} - Modalidade ${movement}: ${total}kg`);
      
      // Calcular pontos IPF GL com parâmetros corretos para esta modalidade
      const points = goodlift(
        total,
        entry.bodyweightKg || 0,
        entry.sex,
        entry.equipment,
        eventType
      );
      
      console.log(`🏆 Pontos IPF GL para ${entry.name} - Modalidade ${movement}: ${points.toFixed(2)}`);
      
      // CORREÇÃO: Criar chave única para a categoria incluindo o tipo específico da competição
      // Manter AST, S, T, AS, ST, AT em vez de normalizar para SBD/B
      const categoryKey = `${entry.sex}_${normalizedEquipment}_${ageDivision}_${movement}`;
      
      console.log(`🔑 Chave da categoria: ${categoryKey}`);
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = {
          sex: entry.sex,
          equipment: normalizedEquipment,
          ageDivision,
          eventType: movement as Event, // Usar o tipo específico da competição
          results: [],
          hasMinimumAthletes: false
        };
        console.log(`✨ Nova categoria criada: ${categoryKey}`);
      }
      
      // Adicionar resultado do atleta para esta modalidade
      categories[categoryKey].results.push({
        position: 0, // Será calculado depois
        entry: {
          ...entry,
          movements: movement, // Usar apenas a modalidade específica
          originalMovements: entry.movements // Manter movimentos originais
        },
        total,
        points,
        bodyweight: entry.bodyweightKg || 0,
        division: ageDivision,
        equipment: normalizedEquipment,
        sex: entry.sex,
        eventType
      });
      
      console.log(`✅ ${entry.name} adicionado à categoria ${categoryKey} para modalidade ${movement}`);
    });
  });
  
  console.log('📋 Categorias criadas:', Object.keys(categories));
  
  // Processar cada categoria
  Object.values(categories).forEach((category, index) => {
    console.log(`🔍 Processando categoria ${index + 1}: ${category.sex} ${category.equipment} ${category.ageDivision} ${category.eventType} - ${category.results.length} atletas`);
    
    // Filtrar apenas atletas com total válido
    category.results = category.results.filter(result => result.total > 0);
    
    // CORREÇÃO: Contar atletas únicos para verificar se há pelo menos 3 atletas
    // Um atleta pode ter múltiplas modalidades, mas conta como um atleta por categoria
    const uniqueAthletes = new Set();
    category.results.forEach(result => {
      const athleteKey = `${result.entry.id}_${result.division}`;
      uniqueAthletes.add(athleteKey);
    });
    
    console.log(`👥 Atletas únicos na categoria ${category.sex} ${category.equipment} ${category.ageDivision} ${category.eventType}: ${uniqueAthletes.size}`);
    console.log(`📝 IDs dos atletas únicos:`, Array.from(uniqueAthletes));
    
    // Verificar se há pelo menos 3 atletas únicos (regra IPF)
    category.hasMinimumAthletes = uniqueAthletes.size >= 3;
    
    console.log(`🏆 Categoria ${category.ageDivision} ${category.equipment} ${category.eventType}: ${category.hasMinimumAthletes ? 'VÁLIDA' : 'INVÁLIDA'} (${category.results.length} atletas)`);
    
    if (category.hasMinimumAthletes) {
      // Ordenar por pontos IPF GL (decrescente)
      category.results.sort((a, b) => {
        // Primeiro critério: pontos IPF GL (decrescente)
        if (Math.abs(b.points - a.points) > 0.01) {
          return b.points - a.points;
        }
        
        // Segundo critério: peso corporal (crescente) - atleta mais leve fica à frente
        if (a.bodyweight !== b.bodyweight) {
          return a.bodyweight - b.bodyweight;
        }
        
        // Terceiro critério: ordem de inscrição (quem se inscreveu primeiro)
        return a.entry.id - b.entry.id;
      });
      
      // Atribuir posições apenas para top 3
      category.results.forEach((result, index) => {
        if (index < 3) {
          result.position = index + 1;
        }
      });
      
      // Manter apenas top 3
      category.results = category.results.slice(0, 3);
      
      console.log(`🥇 Top 3 da categoria ${category.ageDivision} ${category.equipment} ${category.eventType}:`, 
        category.results.map(r => `${r.position}º ${r.entry.name} (${r.points.toFixed(2)} pts)`));
    }
  });
  
  // Retornar apenas categorias com resultados válidos
  const finalCategories = Object.values(categories).filter(category => 
    category.hasMinimumAthletes && category.results.length > 0
  );
  
  console.log('🏁 Categorias finais retornadas:', finalCategories.length);
  finalCategories.forEach((category, index) => {
    console.log(`📊 Categoria ${index + 1}: ${category.sex} ${category.equipment} ${category.ageDivision} ${category.eventType} - ${category.results.length} atletas`);
  });
  
  return finalCategories;
};

/**
 * Obtém o nome de exibição do equipamento para Best Lifter
 * @param equipment - Equipamento normalizado
 * @returns Nome de exibição em português
 */
export const getEquipmentDisplayNameForBestLifter = (equipment: string): string => {
  return equipment === 'Classico' ? 'Clássico' : 'Equipado';
};

/**
 * Obtém o nome de exibição do tipo de evento para Best Lifter
 * @param eventType - Tipo de evento (AST, S, T, AS, ST, AT)
 * @returns Nome de exibição em português
 */
export const getEventTypeDisplayName = (eventType: Event): string => {
  switch (eventType) {
    case 'AST':
      return 'Powerlifting (AST)';
    case 'S':
      return 'Só Supino (S)';
    case 'T':
      return 'Só Terra (T)';
    case 'A':
      return 'Só Agachamento (A)';
    case 'AS':
      return 'Agachamento + Supino (AS)';
    case 'ST':
      return 'Supino + Terra (ST)';
    case 'AT':
      return 'Agachamento + Terra (AT)';
    case 'SBD':
      return 'Powerlifting (SBD)';
    case 'B':
      return 'Supino (B)';
    case 'D':
      return 'Terra (D)';
    default:
      return eventType;
  }
};
