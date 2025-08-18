import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AtletasPage from './pages/AtletasPage';
import EquipesPage from './pages/EquipesPage';
import CompeticoesPage from './pages/CompeticoesPage';
import InscricoesPage from './pages/InscricoesPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import LogPage from './pages/LogPage';

// Componente para proteger rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
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
            
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <RelatoriosPage />
              </ProtectedRoute>
            } />
            
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
