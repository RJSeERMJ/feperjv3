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

// Função principal: obter a ordem de levantamentos
export const getLiftingOrder = (
  entriesInFlight: Array<Entry>,
  lifting: LiftingState,
): LiftingOrder => {
  const attemptOneIndexed = getActiveAttemptNumber(entriesInFlight, lifting);
  const currentEntryId = getCurrentEntryId(entriesInFlight, lifting);
  const nextEntryId = getNextEntryId(entriesInFlight, lifting);

  // Determinar a próxima tentativa para o próximo atleta
  let nextAttemptOneIndexed: number | null = null;
  if (nextEntryId !== null) {
    const nextEntry = entriesInFlight.find(e => e.id === nextEntryId);
    if (nextEntry) {
      nextAttemptOneIndexed = getNextAttemptNumberForEntry(nextEntry, lifting.lift);
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
