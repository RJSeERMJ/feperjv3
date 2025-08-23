import { Plate, LoadedPlate } from '../types/barraProntaTypes';

// Converter KG para LBS com arredondamento para 2 casas decimais
const kg2lbs = (kg: number): number => {
  return Math.round(kg * 2.20462 * 100) / 100;
};

// Retorna uma lista de pesos de anilhas em ordem de carregamento.
// Qualquer resto não carregável é reportado como um número final com valor negativo.
export const selectPlates = (
  loadingKg: number,
  barAndCollarsWeightKg: number,
  plates: ReadonlyArray<Plate>,
  inKg: boolean,
): Array<LoadedPlate> => {
  // Converter para pounds se necessário, evitando erros de ponto flutuante
  let loadingAny = loadingKg;
  let barAndCollarsWeightAny = barAndCollarsWeightKg;
  let platesAny = plates;

  if (inKg === false) {
    loadingAny = kg2lbs(loadingKg);
    barAndCollarsWeightAny = kg2lbs(barAndCollarsWeightKg);
    platesAny = plates.map((x) => ({ ...x, weightKg: kg2lbs(x.weightKg) }));
  }

  // Ordenar uma cópia do array platesAny por peso decrescente
  const sortedPlates = platesAny.slice().sort((a, b) => {
    return b.weightKg - a.weightKg;
  });

  let sideWeightKg = (loadingAny - barAndCollarsWeightAny) / 2;
  const loading: Array<LoadedPlate> = [];

  // Percorrer cada anilha em ordem, aplicando quantas couberem
  for (let i = 0; i < sortedPlates.length; i++) {
    const weightKg = sortedPlates[i].weightKg;
    const color = sortedPlates[i].color;
    let pairCount = sortedPlates[i].pairCount;
    
    while (pairCount > 0 && weightKg <= sideWeightKg) {
      pairCount--;
      sideWeightKg -= weightKg;
      loading.push({ weightAny: weightKg, isAlreadyLoaded: false, color: color });
    }
  }

  // Reportar qualquer resto como um número negativo
  if (sideWeightKg > 0) {
    loading.push({ weightAny: -sideWeightKg, isAlreadyLoaded: false, color: '#FF0000' });
  }
  
  return loading;
};

// Função auxiliar: como Array.findIndex(), mas começando de um índice específico
const findWeightFrom = (loading: Array<LoadedPlate>, startFrom: number, weight: number): number => {
  for (let i = startFrom; i < loading.length; i++) {
    if (loading[i].weightAny === weight) return i;
  }
  return -1;
};

// Define a propriedade 'isAlreadyLoaded' de cada LoadedPlate em relação a outro carregamento.
// Ambos 'loading' e 'relativeTo' são ordenados em ordem não-crescente de peso.
export const makeLoadingRelative = (loading: Array<LoadedPlate>, relativeTo: Array<LoadedPlate>): void => {
  let finger = 0; // Índice crescente no array relativeTo

  // Para cada anilha no carregamento, procurar por uma anilha correspondente em relativeTo[finger..]
  // Quando encontrada, mover o dedo para além desse ponto
  for (let i = 0; i < loading.length; i++) {
    const loadedPlate = loading[i];
    const index = findWeightFrom(relativeTo, finger, loadedPlate.weightAny);
    if (index >= 0) {
      finger = index + 1;
      loadedPlate.isAlreadyLoaded = true;
    }
  }
};

// Função para obter a cor da anilha baseada no peso
export const getPlateColor = (weightKg: number, inKg: boolean = true): string => {
  if (inKg) {
    switch (weightKg) {
      case 25: return '#FF0000'; // Vermelho
      case 20: return '#0000FF'; // Azul
      case 15: return '#FFFF00'; // Amarelo
      case 10: return '#00FF00'; // Verde
      case 5: return '#FF8000';  // Laranja
      case 2.5: return '#800080'; // Roxo
      case 1.25: return '#FFC0CB'; // Rosa
      case 1: return '#FFFFFF';   // Branco
      case 0.5: return '#808080'; // Cinza
      case 0.25: return '#000000'; // Preto
      default: return '#808080';  // Cinza padrão
    }
  } else {
    const weightLbs = kg2lbs(weightKg);
    switch (weightLbs) {
      case 100: return '#FF0000'; // Vermelho
      case 55: return '#0000FF';  // Azul
      case 45: return '#FFFF00';  // Amarelo
      case 35: return '#00FF00';  // Verde
      case 25: return '#FF8000';  // Laranja
      case 10: return '#800080';  // Roxo
      case 5: return '#FFC0CB';   // Rosa
      case 2.5: return '#FFFFFF'; // Branco
      case 1.25: return '#808080'; // Cinza
      case 0.5: return '#000000';  // Preto
      default: return '#808080';   // Cinza padrão
    }
  }
};
