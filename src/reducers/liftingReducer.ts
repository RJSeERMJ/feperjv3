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
      state.attemptOneIndexed = 1; // Resetar para primeira tentativa
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

    // Resetar estado de levantamentos
    resetLifting: (state: LiftingState) => {
      state.day = 1;
      state.platform = 1;
      state.flight = 'A';
      state.lift = 'S';
      state.attemptOneIndexed = 1;
      state.overrideEntryId = null;
      state.overrideAttempt = null;
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
      state.attemptOneIndexed = 1; // Resetar para primeira tentativa
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
      state.attemptOneIndexed = 1; // Resetar para primeira tentativa
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
  resetLifting,
  nextLift,
  previousLift,
} = liftingSlice.actions;

export default liftingSlice.reducer;
