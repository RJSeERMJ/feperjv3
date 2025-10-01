import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FaUsers, FaTrophy, FaUserFriends, FaChartLine, FaCog } from 'react-icons/fa';
import { dashboardService } from '../services/firebaseService';
import { DashboardStats } from '../types';
import MuralAvisos from './MuralAvisos';
import UserManagement from './UserManagement';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert variant="warning">
        Nenhum dado disponível
      </Alert>
    );
  }

  // Removido o gráfico de distribuição por sexo

  const barData = {
    labels: stats.atletasPorEquipe.map(item => item.equipe),
    datasets: [
      {
        label: 'Atletas por Equipe',
        data: stats.atletasPorEquipe.map(item => item.quantidade),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
    ],
  };


  const melhoresIPFPointsDataMasculino = {
    labels: stats.melhoresIPFPointsMasculino.map(item => `${item.atleta} (${item.pontos.toFixed(2)})`),
    datasets: [
      {
        label: 'IPF GL Points',
        data: stats.melhoresIPFPointsMasculino.map(item => item.pontos),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const melhoresIPFPointsDataFeminino = {
    labels: stats.melhoresIPFPointsFeminino.map(item => `${item.atleta} (${item.pontos.toFixed(2)})`),
    datasets: [
      {
        label: 'IPF GL Points',
        data: stats.melhoresIPFPointsFeminino.map(item => item.pontos),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏋️ Dashboard FEPERJ</h2>
        {user?.tipo === 'admin' && (
          <Button 
            variant="outline-primary" 
            onClick={() => setShowUserManagement(true)}
            className="d-flex align-items-center gap-2"
          >
            <FaCog />
            Gerenciar Usuários
          </Button>
        )}
      </div>
      
      {/* Cards de estatísticas */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers className="text-primary mb-2" size={30} />
              <h3>{stats.totalAtletas}</h3>
              <p className="text-muted mb-0">Total de Atletas</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaUserFriends className="text-success mb-2" size={30} />
              <h3>{stats.totalEquipes}</h3>
              <p className="text-muted mb-0">Total de Equipes</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaTrophy className="text-warning mb-2" size={30} />
              <h3>{stats.totalCompeticoes}</h3>
              <p className="text-muted mb-0">Competições</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaChartLine className="text-info mb-2" size={30} />
              <h3>{stats.atletasAtivos}</h3>
              <p className="text-muted mb-0">Atletas Ativos</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos e Mural de Avisos */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Atletas por Equipe</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Bar data={barData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <MuralAvisos idEquipe={user?.tipo !== 'admin' ? user?.idEquipe : undefined} />
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">🏆 Melhores IPF Points - Masculino</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                <Bar 
                  data={melhoresIPFPointsDataMasculino} 
                  options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const item = stats.melhoresIPFPointsMasculino[dataIndex];
                            return [
                              `Total: ${item.total}kg`,
                              `Competição: ${item.competicao}`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 0.5,
                          callback: function(value: any) {
                            return value.toFixed(1);
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">🏆 Melhores IPF Points - Feminino</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                <Bar 
                  data={melhoresIPFPointsDataFeminino} 
                  options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const item = stats.melhoresIPFPointsFeminino[dataIndex];
                            return [
                              `Total: ${item.total}kg`,
                              `Competição: ${item.competicao}`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 0.5,
                          callback: function(value: any) {
                            return value.toFixed(1);
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

   

      {/* Estatísticas detalhadas */}
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Status dos Atletas</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Ativos:</span>
                <span className="badge bg-success">{stats.atletasAtivos}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Inativos:</span>
                <span className="badge bg-secondary">{stats.atletasInativos}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Distribuição por Sexo</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Masculino:</span>
                <span className="badge bg-primary">{stats.atletasPorSexo.masculino}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Feminino:</span>
                <span className="badge bg-danger">{stats.atletasPorSexo.feminino}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Modal de Gerenciamento de Usuários */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
    </div>
  );
};

export default Dashboard;
