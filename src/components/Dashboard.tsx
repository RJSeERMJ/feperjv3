import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
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
import { Bar, Pie } from 'react-chartjs-2';
import { FaUsers, FaTrophy, FaUserFriends, FaChartLine } from 'react-icons/fa';
import { dashboardService } from '../services/firebaseService';
import { DashboardStats } from '../types';

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

  const pieData = {
    labels: ['Masculino', 'Feminino'],
    datasets: [
      {
        data: [stats.atletasPorSexo.masculino, stats.atletasPorSexo.feminino],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

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

  const topTotaisData = {
    labels: stats.maioresTotais.map(item => item.atleta),
    datasets: [
      {
        label: 'Maior Total (kg)',
        data: stats.maioresTotais.map(item => item.total),
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
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
      <h2 className="mb-4">🏋️ Dashboard FEPERJ</h2>
      
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

      {/* Gráficos */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Distribuição por Sexo</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Pie data={pieData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
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
      </Row>

      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Top 10 Maiores Totais</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                <Bar 
                  data={topTotaisData} 
                  options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
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
    </div>
  );
};

export default Dashboard;
