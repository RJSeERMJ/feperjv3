import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase - Usando variáveis de ambiente para segurança
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBS9GFGozx63RbbvjddDCpLa2URaLAgDuw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "feperj-2025.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "feperj-2025",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "feperj-2025.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "721836250240",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:721836250240:web:58130a417da4d0ebee0265",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-ET67R4Q4Y4"
};

// Verificar se as configurações estão definidas
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Variáveis de ambiente do Firebase não configuradas:', missingEnvVars);
  console.warn('📝 Usando configurações padrão para desenvolvimento');
}

// Verificar se as configurações estão corretas
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "sua-api-key-aqui";

if (isConfigValid) {
  console.log('✅ Configurações do Firebase carregadas com sucesso!');
} else {
  console.warn('⚠️ Configurações do Firebase não estão definidas!');
  console.warn('📝 Usando configurações padrão para desenvolvimento');
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Inicializar Analytics apenas no browser
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics não disponível:', error);
  }
}

export { analytics };
export default app;
