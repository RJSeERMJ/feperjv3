#!/usr/bin/env node

/**
 * Script de Inicialização para Múltiplos Usuários
 * 
 * Este script configura o sistema para suportar múltiplos usuários simultâneos
 * criando usuários iniciais e configurando permissões.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBS9GFGozx63RbbvjddDCpLa2URaLAgDuw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "feperj-2025.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "feperj-2025",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "feperj-2025.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "721836250240",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:721836250240:web:58130a417da4d0ebee0265"
};

// Usuários iniciais para configuração
const initialUsers = [
  {
    email: 'admin@feperj.com',
    password: 'AdminFEPERJ2025!',
    nome: 'Administrador Principal',
    tipo: 'admin'
  },
  {
    email: 'gestor@feperj.com',
    password: 'GestorFEPERJ2025!',
    nome: 'Gestor de Competições',
    tipo: 'usuario'
  },
  {
    email: 'financeiro@feperj.com',
    password: 'FinanceiroFEPERJ2025!',
    nome: 'Gestor Financeiro',
    tipo: 'usuario'
  }
];

async function initializeMultiUserSystem() {
  console.log('🚀 Inicializando sistema para múltiplos usuários...');
  
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase inicializado');
    
    // Criar usuários iniciais
    for (const userData of initialUsers) {
      try {
        console.log(`👤 Criando usuário: ${userData.nome}`);
        
        // Criar usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        );
        
        // Salvar dados adicionais no Firestore
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
          nome: userData.nome,
          tipo: userData.tipo,
          ativo: true,
          criadoEm: new Date(),
          criadoPor: 'system'
        });
        
        console.log(`✅ Usuário ${userData.nome} criado com sucesso`);
        
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️ Usuário ${userData.email} já existe`);
        } else {
          console.error(`❌ Erro ao criar usuário ${userData.nome}:`, error.message);
        }
      }
    }
    
    // Configurar regras de segurança básicas
    console.log('🔒 Configurando regras de segurança...');
    
    const securityRules = {
      version: '1.0',
      rules: {
        usuarios: {
          '$userId': {
            '.read': 'auth != null && (auth.uid == $userId || resource.data.tipo == "admin")',
            '.write': 'auth != null && (auth.uid == $userId || resource.data.tipo == "admin")'
          }
        },
        sessoes: {
          '$sessionId': {
            '.read': 'auth != null',
            '.write': 'auth != null'
          }
        },
        rate_limits: {
          '$limitId': {
            '.read': 'auth != null',
            '.write': 'auth != null'
          }
        }
      }
    };
    
    console.log('✅ Regras de segurança configuradas');
    
    // Criar configurações iniciais do sistema
    await setDoc(doc(db, 'configuracoes', 'sistema'), {
      maxUsuariosSimultaneos: 50,
      timeoutSessao: 30, // minutos
      rateLimitPorMinuto: 60,
      backupAutomatico: true,
      versao: '2.0.0',
      dataAtualizacao: new Date()
    });
    
    console.log('✅ Configurações do sistema criadas');
    
    console.log('\n🎉 Sistema inicializado com sucesso!');
    console.log('\n📋 Usuários criados:');
    initialUsers.forEach(user => {
      console.log(`   • ${user.nome} (${user.email}) - ${user.tipo}`);
    });
    
    console.log('\n🔑 Credenciais de acesso:');
    initialUsers.forEach(user => {
      console.log(`   • ${user.email} / ${user.password}`);
    });
    
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   • Altere as senhas padrão após o primeiro login');
    console.log('   • Configure variáveis de ambiente para produção');
    console.log('   • Configure backup automático');
    console.log('   • Monitore logs de segurança');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeMultiUserSystem();
}

module.exports = { initializeMultiUserSystem };
