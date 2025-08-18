const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBS9GFGozx63RbbvjddDCpLa2URaLAgDuw",
  authDomain: "feperj-2025.firebaseapp.com",
  projectId: "feperj-2025",
  storageBucket: "feperj-2025.firebasestorage.app",
  messagingSenderId: "721836250240",
  appId: "1:721836250240:web:58130a417da4d0ebee0265",
  measurementId: "G-ET67R4Q4Y4"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

console.log('Firebase inicializado com sucesso!');
console.log('Storage bucket:', storage.app.options.storageBucket);

// Configuração CORS
const corsConfig = [
  {
    "origin": ["https://feperjv3-uany.vercel.app", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
];

console.log('Configuração CORS:');
console.log(JSON.stringify(corsConfig, null, 2));

console.log('\nPara aplicar esta configuração CORS, você precisa:');
console.log('1. Instalar Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
console.log('2. Executar: gsutil cors set cors.json gs://feperj-2025.firebasestorage.app');
console.log('3. Ou usar o Firebase Console para configurar manualmente');
