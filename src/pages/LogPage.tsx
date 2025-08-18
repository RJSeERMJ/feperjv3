import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Spinner, Button, Badge } from 'react-bootstrap';
import { FaTrash, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { logService } from '../services/firebaseService';
import { LogAtividade } from '../types';
import { useAuth } from '../contexts/AuthContext';

const LogPage: React.FC = () => {
  const [logs, setLogs] = useState<LogAtividade[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await logService.getAll();
      setLogs(data);
    } catch (error) {
      toast.error('Erro ao carregar log de atividades');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o log de atividades? Esta ação não pode ser desfeita.')) {
      try {
        await logService.clear();
        toast.success('Log de atividades limpo com sucesso!');
        
        // Registrar a limpeza do log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Limpou log de atividades',
          detalhes: 'Log de atividades foi limpo pelo administrador',
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadLogs();
      } catch (error) {
        toast.error('Erro ao limpar log de atividades');
      }
    }
  };

  const handleExportLogs = () => {
    try {
      const csvContent = [
        ['Data/Hora', 'Usuário', 'Ação', 'Detalhes', 'Tipo de Usuário'],
        ...logs.map(log => [
          new Date(log.dataHora).toLocaleString('pt-BR'),
          log.usuario,
          log.acao,
          log.detalhes || '',
          log.tipoUsuario || ''
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `log_atividades_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Log exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar log');
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Log de Atividades</h2>
        <div>
          <Button 
            variant="outline-success" 
            className="me-2"
            onClick={handleExportLogs}
          >
            <FaDownload className="me-2" />
            Exportar CSV
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={handleClearLogs}
          >
            <FaTrash className="me-2" />
            Limpar Log
          </Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {new Date(log.dataHora).toLocaleString('pt-BR')}
                  </td>
                  <td>{log.usuario}</td>
                  <td>{log.acao}</td>
                  <td>{log.detalhes || '-'}</td>
                  <td>
                    <Badge bg={log.tipoUsuario === 'admin' ? 'danger' : 'primary'}>
                      {log.tipoUsuario === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {logs.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhuma atividade registrada.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default LogPage;
