import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';
import barraProntaReducer, { initialState } from '../reducers/barraProntaReducers';
import { GlobalState } from '../types/barraProntaTypes';

// Configuração do persist
const persistConfig = {
  key: 'barra-pronta-root',
  storage,
  whitelist: ['meet', 'registration', 'lifting'] // Persistir apenas estes estados
};

const persistedReducer = persistReducer(persistConfig, barraProntaReducer);

// Configuração do Redux DevTools
const composeEnhancers = (typeof window !== 'undefined' && 
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

// Criar store
const store = createStore(
  persistedReducer,
  undefined, // Não passar initialState para o persistReducer
  composeEnhancers(applyMiddleware(thunk))
);

// Criar persistor
const persistor = persistStore(store);

// Tipos para o store
export type RootState = GlobalState;
export type AppDispatch = typeof store.dispatch;

export { store, persistor };
