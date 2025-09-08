import React from 'react';
import { Container, Navbar, Nav, NavDropdown, Image } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaTrophy, 
  FaUserCog, 
  FaSignOutAlt,
  FaHome,
  FaUserFriends,
  FaClipboardList,
  FaFileAlt,
  FaHistory,
  FaMoneyBillWave,
  FaWeightHanging,
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🏗️ Layout - User:', user, 'Location:', location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <FaHome /> },
    { path: '/atletas', label: 'Atletas', icon: <FaUsers /> },
    // Equipes apenas para administradores
    ...(user?.tipo === 'admin' ? [
      { path: '/equipes', label: 'Equipes', icon: <FaUserFriends /> }
    ] : []),
    { path: '/competicoes', label: 'Competições', icon: <FaTrophy /> },
    { path: '/financeiro', label: 'Financeiro', icon: <FaMoneyBillWave /> },
    // Barra Pronta apenas para administradores
    ...(user?.tipo === 'admin' ? [
      { path: '/barra-pronta', label: 'Barra Pronta', icon: <FaWeightHanging /> }
    ] : []),
    ...(user?.tipo === 'admin' ? [
      { path: '/usuarios', label: 'Usuários', icon: <FaUserCog /> },
      { path: '/log', label: 'Log de Atividades', icon: <FaHistory /> }
    ] : [])
  ];

  return (
    <div className="layout">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="navbar-custom">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <Image src="/feperj-logo.png" alt="FEPERJ Logo" className="me-2" style={{ height: '30px' }} />
            FEPERJ
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.icon}
                  <span className="ms-1">{item.label}</span>
                </Nav.Link>
              ))}
            </Nav>

            <Nav>
              <NavDropdown 
                title={
                  <span>
                    <FaUserCog className="me-1" />
                    {user?.nome}
                  </span>
                } 
                id="user-dropdown"
              >
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  Sair
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Conteúdo principal */}
      <main className="main-content">
        <Container fluid className="py-4">
          {children}
        </Container>
      </main>
    </div>
  );
};

export default Layout;
