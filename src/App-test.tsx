import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componente de teste simples
const TestLogin: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1>🔐 Teste de Login</h1>
        <p>Se você está vendo esta página, o React está funcionando!</p>
        <button 
          onClick={() => alert('Botão funcionando!')}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Testar Botão
        </button>
      </div>
    </div>
  );
};

const AppTest: React.FC = () => {
  console.log('🚀 AppTest renderizando...');
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TestLogin />} />
          <Route path="/login" element={<TestLogin />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppTest;
