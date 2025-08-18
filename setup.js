#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🏋️ FEPERJ - Setup do Sistema Web');
console.log('================================\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    console.log('📋 Configuração do Firebase\n');
    
    const apiKey = await question('Digite sua API Key do Firebase: ');
    const authDomain = await question('Digite o Auth Domain (ex: projeto.firebaseapp.com): ');
    const projectId = await question('Digite o Project ID: ');
    const storageBucket = await question('Digite o Storage Bucket (ex: projeto.appspot.com): ');
    const messagingSenderId = await question('Digite o Messaging Sender ID: ');
    const appId = await question('Digite o App ID: ');
    
    const firebaseConfig = `import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
`;

    const configPath = path.join(__dirname, 'src', 'config', 'firebase.ts');
    
    // Criar diretório se não existir
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, firebaseConfig);
    
    console.log('\n✅ Configuração do Firebase salva com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npm install');
    console.log('2. Execute: npm start');
    console.log('3. Acesse: http://localhost:3000');
    console.log('4. Faça login com as credenciais padrão:');
    console.log('   - Login: 15119236790');
    console.log('   - Senha: 49912170');
    
    console.log('\n🔧 Configurações do Firestore:');
    console.log('No console do Firebase, configure as regras do Firestore:');
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
    `);
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
  } finally {
    rl.close();
  }
}

setup();
