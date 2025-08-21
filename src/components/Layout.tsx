import React, { useState } from 'react';
import { Container, Navbar, Nav, NavDropdown, Offcanvas, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaDumbbell, 
  FaBars, 
  FaUsers, 
  FaTrophy, 
  FaChartBar, 
  FaUserCog, 
  FaSignOutAlt,
  FaHome,
  FaUserFriends,
  FaClipboardList,
  FaFileAlt,
  FaHistory,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(false);
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

    { path: '/relatorios', label: 'Relatórios', icon: <FaChartBar /> },
    ...(user?.tipo === 'admin' ? [
      { path: '/usuarios', label: 'Usuários', icon: <FaUserCog /> },
      { path: '/log', label: 'Log de Atividades', icon: <FaHistory /> }
    ] : [])
  ];

  const Sidebar = () => (
    <div className="sidebar">
      <div className="sidebar-header">
        <FaDumbbell className="sidebar-icon" />
        <h5 className="mb-0">FEPERJ</h5>
      </div>
      
      <Nav className="flex-column sidebar-nav">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => setShowSidebar(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );

  return (
    <div className="layout">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="navbar-custom">
        <Container fluid>
          <Button
            variant="link"
            className="sidebar-toggle d-lg-none"
            onClick={() => setShowSidebar(true)}
          >
            <FaBars />
          </Button>
          
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <FaDumbbell className="me-2" />
            FEPERJ
          </Navbar.Brand>

          <Nav className="ms-auto">
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
        </Container>
      </Navbar>

      <div className="layout-content">
        {/* Sidebar para desktop */}
        <div className="d-none d-lg-block sidebar-desktop">
          <Sidebar />
        </div>

        {/* Sidebar mobile */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          placement="start"
          className="sidebar-offcanvas"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              <FaDumbbell className="me-2" />
              FEPERJ
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <Sidebar />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Conteúdo principal */}
        <main className="main-content">
          <Container fluid className="py-4">
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Layout;
