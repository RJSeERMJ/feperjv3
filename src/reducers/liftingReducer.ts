import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiftingState, Lift } from '../types/barraProntaTypes';

// Estado inicial
const initialState: LiftingState = {
  day: 1,
  platform: 1,
  flight: 'A',
  lift: 'S',
  attemptOneIndexed: 1,
  overrideEntryId: null,
  overrideAttempt: null,
  selectedEntryId: null, // ID do atleta selecionado
  selectedAttempt: 1, // Tentativa selecionada (1, 2 ou 3)
  isAttemptActive: false, // Se a tentativa está ativa para marcação
};

const liftingSlice = createSlice({
  name: 'lifting',
  initialState,
  reducers: {
    // Definir dia da competição
    setDay: (state: LiftingState, action: PayloadAction<number>) => {
      state.day = action.payload;
    },

    // Definir plataforma
    setPlatform: (state: LiftingState, action: PayloadAction<number>) => {
      state.platform = action.payload;
    },

    // Definir grupo de atletas
    setFlight: (state: LiftingState, action: PayloadAction<string>) => {
      state.flight = action.payload;
    },

    // Definir movimento atual
    setLift: (state: LiftingState, action: PayloadAction<Lift>) => {
      state.lift = action.payload;
      // CORREÇÃO: Não resetar sempre para primeira tentativa
      // state.attemptOneIndexed = 1; // Resetar para primeira tentativa
    },

    // Definir tentativa atual
    setAttemptOneIndexed: (state: LiftingState, action: PayloadAction<number>) => {
      state.attemptOneIndexed = action.payload;
    },

    // Override manual de atleta
    setOverrideEntryId: (state: LiftingState, action: PayloadAction<number | null>) => {
      state.overrideEntryId = action.payload;
    },

    // Override manual de tentativa
    setOverrideAttempt: (state: LiftingState, action: PayloadAction<number | null>) => {
      state.overrideAttempt = action.payload;
    },

    // Selecionar atleta específico
    setSelectedEntryId: (state: LiftingState, action: PayloadAction<number | null>) => {
      state.selectedEntryId = action.payload;
    },

    // Selecionar tentativa específica
    setSelectedAttempt: (state: LiftingState, action: PayloadAction<number>) => {
      state.selectedAttempt = action.payload;
    },

    // Ativar/desativar tentativa para marcação
    setAttemptActive: (state: LiftingState, action: PayloadAction<boolean>) => {
      state.isAttemptActive = action.payload;
    },

    // Selecionar atleta e tentativa (ação combinada)
    selectAthleteAndAttempt: (state: LiftingState, action: PayloadAction<{ entryId: number; attempt: number }>) => {
      state.selectedEntryId = action.payload.entryId;
      state.selectedAttempt = action.payload.attempt;
      state.isAttemptActive = true;
    },

    // Resetar estado de levantamentos
    resetLifting: (state: LiftingState) => {
      state.day = 1;
      state.platform = 1;
      state.flight = 'A';
      state.lift = 'S';
      state.attemptOneIndexed = 1;
      state.overrideEntryId = null;
      state.overrideAttempt = null;
      state.selectedEntryId = null;
      state.selectedAttempt = 1;
      state.isAttemptActive = false;
    },

    // Próximo movimento (S -> B -> D -> S...)
    nextLift: (state: LiftingState) => {
      switch (state.lift) {
        case 'S':
          state.lift = 'B';
          break;
        case 'B':
          state.lift = 'D';
          break;
        case 'D':
          state.lift = 'S';
          break;
      }
      // CORREÇÃO: Não resetar sempre para primeira tentativa
      // state.attemptOneIndexed = 1; // Resetar para primeira tentativa
    },

    // Movimento anterior (D -> B -> S -> D...)
    previousLift: (state: LiftingState) => {
      switch (state.lift) {
        case 'S':
          state.lift = 'D';
          break;
        case 'B':
          state.lift = 'S';
          break;
        case 'D':
          state.lift = 'B';
          break;
      }
      // CORREÇÃO: Não resetar sempre para primeira tentativa
      // state.attemptOneIndexed = 1; // Resetar para primeira tentativa
    },
  },
});

export const {
  setDay,
  setPlatform,
  setFlight,
  setLift,
  setAttemptOneIndexed,
  setOverrideEntryId,
  setOverrideAttempt,
  setSelectedEntryId,
  setSelectedAttempt,
  setAttemptActive,
  selectAthleteAndAttempt,
  resetLifting,
  nextLift,
  previousLift,
} = liftingSlice.actions;

export default liftingSlice.reducer;
