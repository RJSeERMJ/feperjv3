import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componente de teste muito simples
const SimpleLogin: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>🔐 FEPERJ Login</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Sistema de Gestão de Atletas</p>
        
        <form style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Login" 
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="password" 
              placeholder="Senha" 
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Entrar
          </button>
        </form>
        
        <p style={{ fontSize: '14px', color: '#999' }}>
          Se você está vendo esta página, o React está funcionando!
        </p>
      </div>
    </div>
  );
};

const AppSimple: React.FC = () => {
  console.log('🚀 AppSimple renderizando...');
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SimpleLogin />} />
          <Route path="/login" element={<SimpleLogin />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppSimple;
