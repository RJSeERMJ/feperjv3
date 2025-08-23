import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import barraProntaReducer, { initialState } from '../reducers/barraProntaReducers';

// Configuração do persist
const persistConfig = {
  key: 'barra-pronta-root',
  storage,
  whitelist: ['meet', 'registration', 'lifting'] // Persistir apenas os estados necessários
};

const persistedReducer = persistReducer(persistConfig, barraProntaReducer);

// Estado inicial
const initialLiftingState = {
  day: 1,
  platform: 1,
  flight: 'A',
  lift: 'S' as const,
  attemptOneIndexed: 1,
  overrideEntryId: null,
  overrideAttempt: null
};

// Store principal
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['persist']
      }
    })
});

export const persistor = persistStore(store);

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
