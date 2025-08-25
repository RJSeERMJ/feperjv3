import { Entry, Lift, LiftStatus, LiftingState, LiftingOrder } from '../types/barraProntaTypes';

const MAX_ATTEMPTS = 3;

// Função auxiliar: para uma entrada dada, ver qual número de tentativa seria a próxima
const getNextAttemptNumberForEntry = (entry: Entry, lift: Lift): number => {
  let fieldKg: (keyof Entry)[];
  let fieldStatus: (keyof Entry)[];

  switch (lift) {
    case 'S':
      fieldKg = ['squat1', 'squat2', 'squat3'];
      fieldStatus = ['squatStatus'];
      break;
    case 'B':
      fieldKg = ['bench1', 'bench2', 'bench3'];
      fieldStatus = ['benchStatus'];
      break;
    case 'D':
      fieldKg = ['deadlift1', 'deadlift2', 'deadlift3'];
      fieldStatus = ['deadliftStatus'];
      break;
    default:
      return 0;
  }

  // Levantadores só definem a próxima tentativa, então loop para trás,
  // procurando pela primeira tentativa que atenda aos critérios
  for (let i = MAX_ATTEMPTS - 1; i >= 0; i--) {
    const weight = entry[fieldKg[i] as keyof Entry] as number;
    const status = entry[fieldStatus[0] as keyof Entry] as LiftStatus[];
    
    if (weight !== null && weight !== 0 && status && status[i] === 0) {
      return i + 1;
    }
  }
  return 0;
};

// Função auxiliar: para uma entrada dada, ver o número máximo de tentativa feita
const getMaxAttemptNumberForEntry = (entry: Entry, lift: Lift): number => {
  let fieldKg: (keyof Entry)[];
  let fieldStatus: (keyof Entry)[];

  switch (lift) {
    case 'S':
      fieldKg = ['squat1', 'squat2', 'squat3'];
      fieldStatus = ['squatStatus'];
      break;
    case 'B':
      fieldKg = ['bench1', 'bench2', 'bench3'];
      fieldStatus = ['benchStatus'];
      break;
    case 'D':
      fieldKg = ['deadlift1', 'deadlift2', 'deadlift3'];
      fieldStatus = ['deadliftStatus'];
      break;
    default:
      return 0;
  }

  for (let i = MAX_ATTEMPTS - 1; i >= 0; i--) {
    const weight = entry[fieldKg[i] as keyof Entry] as number;
    const status = entry[fieldStatus[0] as keyof Entry] as LiftStatus[];
    
    if (weight !== null && weight !== 0 && status && status[i] !== 0) {
      return i + 1;
    }
  }
  return 0;
};

// Determinar a tentativa ativa atual para o levantamento atual
const getActiveAttemptNumber = (entriesInFlight: Array<Entry>, lifting: LiftingState): number => {
  const lift = lifting.lift;

  // Permitir override manual
  if (lifting.overrideAttempt !== null) {
    return lifting.overrideAttempt;
  }

  // Iterar ao contrário, procurando pela tentativa mais cedo que não foi levantada
  let earliestAttemptOneIndexed = MAX_ATTEMPTS + 1;
  for (let i = 0; i < entriesInFlight.length; i++) {
    const entry = entriesInFlight[i];
    const next = getNextAttemptNumberForEntry(entry, lift);
    // Valor de retorno zero significa "sem tentativas pendentes para esta entrada"
    if (next > 0 && next < earliestAttemptOneIndexed) {
      earliestAttemptOneIndexed = next;
    }
  }

  // O número de tentativa pendente mais baixo é o atual
  if (earliestAttemptOneIndexed < MAX_ATTEMPTS + 1) {
    return earliestAttemptOneIndexed;
  }

  // No caso de nenhuma tentativa pendente, tentar inferir a próxima tentativa
  let latestAttemptOneIndexed = 0;
  for (let i = 0; i < entriesInFlight.length; i++) {
    const entry = entriesInFlight[i];
    const max = getMaxAttemptNumberForEntry(entry, lift);
    // Valor de retorno zero significa "sem tentativas tentadas para esta entrada"
    if (max > latestAttemptOneIndexed) {
      latestAttemptOneIndexed = max;
    }
  }

  // Se todos os levantadores terminaram suas tentativas, voltar para a primeira
  if (latestAttemptOneIndexed >= MAX_ATTEMPTS) {
    return 1;
  }

  // Caso contrário, a próxima tentativa é a próxima após a mais alta
  return latestAttemptOneIndexed + 1;
};

// Determinar qual entrada deve estar levantando atualmente
const getCurrentEntryId = (entriesInFlight: Array<Entry>, lifting: LiftingState): number | null => {
  const lift = lifting.lift;
  const attemptOneIndexed = getActiveAttemptNumber(entriesInFlight, lifting);

  // Permitir override manual
  if (lifting.overrideEntryId !== null) {
    return lifting.overrideEntryId;
  }

  // Procurar pela primeira entrada que tem uma tentativa pendente deste número
  for (let i = 0; i < entriesInFlight.length; i++) {
    const entry = entriesInFlight[i];
    const next = getNextAttemptNumberForEntry(entry, lift);
    if (next === attemptOneIndexed) {
      return entry.id;
    }
  }

  return null;
};

// Determinar qual entrada deve ser a próxima
const getNextEntryId = (entriesInFlight: Array<Entry>, lifting: LiftingState): number | null => {
  const lift = lifting.lift;
  const currentAttemptOneIndexed = getActiveAttemptNumber(entriesInFlight, lifting);

  // Se ainda há tentativas pendentes para o atleta atual, ele continua
  const currentEntryId = getCurrentEntryId(entriesInFlight, lifting);
  if (currentEntryId !== null) {
    const currentEntry = entriesInFlight.find(e => e.id === currentEntryId);
    if (currentEntry) {
      const next = getNextAttemptNumberForEntry(currentEntry, lift);
      if (next > currentAttemptOneIndexed) {
        return currentEntryId; // Mesmo atleta, próxima tentativa
      }
    }
  }

  // Procurar pelo próximo atleta com tentativas pendentes
  for (let i = 0; i < entriesInFlight.length; i++) {
    const entry = entriesInFlight[i];
    const next = getNextAttemptNumberForEntry(entry, lift);
    if (next > 0) {
      return entry.id;
    }
  }

  return null;
};

// Função para organizar tentativas por peso crescente seguindo as regras de competição:
// 1. Primeiro critério: peso (menor peso levanta primeiro)
// 2. Segundo critério: lot number (menor lot number desempata quando pesos são iguais)
// 3. Terceiro critério: preservar ordem relativa (índice na lista) quando não há lot numbers
const organizeAttemptsByWeight = (entriesInFlight: Array<Entry>, lift: Lift, attemptNumber: number): Array<{ entryId: number; weight: number; entry: Entry }> => {
  const weightField = lift === 'S' ? `squat${attemptNumber}` : lift === 'B' ? `bench${attemptNumber}` : `deadlift${attemptNumber}`;
  
  const attemptsWithWeight: Array<{ entryId: number; weight: number; entry: Entry }> = [];
  
  entriesInFlight.forEach(entry => {
    const weight = entry[weightField as keyof Entry] as number;
    
    // Só incluir se tem peso definido (independente do status)
    if (weight && weight > 0) {
      attemptsWithWeight.push({
        entryId: entry.id,
        weight: weight,
        entry: entry
      });
    }
  });
  
  // Ordenar por peso crescente, com desempate por lot number
  return attemptsWithWeight.sort((a, b) => {
    // Primeiro critério: peso (menor primeiro)
    if (a.weight !== b.weight) {
      return a.weight - b.weight;
    }
    
    // Segundo critério: lot number (menor primeiro) quando ambos têm lot number
    if (a.entry.lotNumber !== null && a.entry.lotNumber !== undefined && 
        b.entry.lotNumber !== null && b.entry.lotNumber !== undefined) {
      return a.entry.lotNumber - b.entry.lotNumber;
    }
    
    // Terceiro critério: preservar ordem relativa quando um ou ambos não têm lot number
    // Usar o índice original na lista para manter a ordem anterior
    const aIndex = entriesInFlight.findIndex(e => e.id === a.entryId);
    const bIndex = entriesInFlight.findIndex(e => e.id === b.entryId);
    
    return aIndex - bIndex;
  });
};

// Função para obter a ordem estável baseada no peso cadastrado
export const getStableOrderByWeight = (entriesInFlight: Array<Entry>, lift: Lift, attemptNumber: number): Array<{ entryId: number; weight: number; entry: Entry }> => {
  return organizeAttemptsByWeight(entriesInFlight, lift, attemptNumber);
};

// Função para obter a próxima tentativa disponível baseada no peso (independente do status)
const getNextAttemptByWeight = (entriesInFlight: Array<Entry>, lift: Lift, attemptNumber: number): { entryId: number; weight: number } | null => {
  const organizedAttempts = organizeAttemptsByWeight(entriesInFlight, lift, attemptNumber);
  
  if (organizedAttempts.length > 0) {
    // Retornar a tentativa com menor peso
    return {
      entryId: organizedAttempts[0].entryId,
      weight: organizedAttempts[0].weight
    };
  }
  
  return null;
};

// Função principal: obter a ordem de levantamentos
export const getLiftingOrder = (
  entriesInFlight: Array<Entry>,
  lifting: LiftingState,
): LiftingOrder => {
  const attemptOneIndexed = getActiveAttemptNumber(entriesInFlight, lifting);
  
  // Organizar tentativas por peso para a tentativa atual
  const attemptsOrdered = organizeAttemptsByWeight(entriesInFlight, lifting.lift, attemptOneIndexed);
  
  // Determinar o atleta atual baseado na ordem de peso
  let currentEntryId: number | null = null;
  if (attemptsOrdered.length > 0) {
    currentEntryId = attemptsOrdered[0].entryId;
  }
  
  // CORREÇÃO: Usar selectedEntryId se disponível para calcular o próximo atleta
  const activeEntryId = lifting.selectedEntryId || currentEntryId;
  
  // Determinar o próximo atleta baseado na ordem de peso
  let nextEntryId: number | null = null;
  let nextAttemptOneIndexed: number | null = null;
  
  if (activeEntryId) {
    // Verificar se o atleta ativo tem próxima tentativa
    const activeEntry = entriesInFlight.find(e => e.id === activeEntryId);
    if (activeEntry) {
      const nextAttempt = getNextAttemptNumberForEntry(activeEntry, lifting.lift);
      if (nextAttempt > attemptOneIndexed) {
        // Mesmo atleta, próxima tentativa
        nextEntryId = activeEntryId;
        nextAttemptOneIndexed = nextAttempt;
      } else {
        // Procurar próximo atleta na ordem de peso
        const currentIndex = attemptsOrdered.findIndex(a => a.entryId === activeEntryId);
        if (currentIndex !== -1 && currentIndex < attemptsOrdered.length - 1) {
          // Há próximo atleta na mesma tentativa
          nextEntryId = attemptsOrdered[currentIndex + 1].entryId;
          nextAttemptOneIndexed = attemptOneIndexed;
        } else {
          // Se não há mais atletas nesta tentativa, procurar próxima tentativa
          if (attemptOneIndexed < MAX_ATTEMPTS) {
            const nextAttemptOrdered = organizeAttemptsByWeight(entriesInFlight, lifting.lift, attemptOneIndexed + 1);
            if (nextAttemptOrdered.length > 0) {
              nextEntryId = nextAttemptOrdered[0].entryId;
              nextAttemptOneIndexed = attemptOneIndexed + 1;
            }
          }
        }
      }
    }
  } else {
    // Se não há atleta ativo, procurar pela primeira tentativa disponível
    if (attemptsOrdered.length > 0) {
      nextEntryId = attemptsOrdered[0].entryId;
      nextAttemptOneIndexed = attemptOneIndexed;
    } else if (attemptOneIndexed < MAX_ATTEMPTS) {
      const firstAttemptOrdered = organizeAttemptsByWeight(entriesInFlight, lifting.lift, 1);
      if (firstAttemptOrdered.length > 0) {
        nextEntryId = firstAttemptOrdered[0].entryId;
        nextAttemptOneIndexed = 1;
      }
    }
  }

  return {
    attemptOneIndexed,
    orderedEntries: entriesInFlight,
    currentEntryId,
    nextEntryId,
    nextAttemptOneIndexed,
  };
};
