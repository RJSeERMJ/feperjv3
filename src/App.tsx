import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import PublicPage from './components/PublicPage';
import SecurityHeaders from './components/SecurityHeaders';
import AtletaDetalhesPage from './components/AtletaDetalhesPage';
import Dashboard from './components/Dashboard';
import AtletasPage from './pages/AtletasPage';
import EquipesPage from './pages/EquipesPage';
import CompeticoesPage from './pages/CompeticoesPage';
import InscricoesPage from './pages/InscricoesPage';
import FinanceiroPage from './pages/FinanceiroPage';
import InactivityManager from './components/InactivityManager';

import UsuariosPage from './pages/UsuariosPage';
import LogPage from './pages/LogPage';
import BarraProntaPage from './pages/BarraProntaPage';
import LiftingPopup from './components/barraPronta/LiftingPopup';
import DetalhesResultadoPage from './pages/DetalhesResultadoPage';


// Componente para proteger rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - User:', user, 'Loading:', loading);

  if (loading) {
    console.log('⏳ ProtectedRoute - Carregando...');
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute - Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ ProtectedRoute - Usuário autenticado, renderizando conteúdo');
  return <Layout>{children}</Layout>;
};

// Componente para rotas apenas de admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user?.tipo !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas protegidas sem Layout (standalone)
const ProtectedRouteStandalone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Headers de segurança - apenas no browser */}
          {typeof window !== 'undefined' && <SecurityHeaders />}
          
          {/* Gerenciador de inatividade - apenas no browser */}
          {typeof window !== 'undefined' && <InactivityManager />}
          
          <Routes>
            <Route path="/publico" element={<PublicPage />} />
            <Route path="/atleta/:id" element={<AtletaDetalhesPage />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/atletas" element={
              <ProtectedRoute>
                <AtletasPage />
              </ProtectedRoute>
            } />
            
            <Route path="/equipes" element={
              <ProtectedRoute>
                <EquipesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/competicoes" element={
              <ProtectedRoute>
                <CompeticoesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/inscricoes" element={
              <ProtectedRoute>
                <InscricoesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/financeiro" element={
              <ProtectedRoute>
                <FinanceiroPage />
              </ProtectedRoute>
            } />
            
            <Route path="/barra-pronta" element={
              <ProtectedRoute>
                <AdminRoute>
                  <BarraProntaPage />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            {/* Rota standalone para Barra Pronta sem menu de navegação */}
            <Route path="/barra-pronta-standalone" element={
              <ProtectedRouteStandalone>
                <AdminRoute>
                  <BarraProntaPage />
                </AdminRoute>
              </ProtectedRouteStandalone>
            } />
            
            <Route path="/lifting-popup" element={
              <ProtectedRoute>
                <AdminRoute>
                  <LiftingPopup />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/detalhes-resultado/:id" element={<DetalhesResultadoPage />} />
            

            
            
            <Route path="/usuarios" element={
              <ProtectedRoute>
                <AdminRoute>
                  <UsuariosPage />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/log" element={
              <ProtectedRoute>
                <AdminRoute>
                  <LogPage />
                </AdminRoute>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
