import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import { 
  FaDownload, 
  FaFileAlt, 
  FaImage, 
  FaIdCard,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { documentService, Documento } from '../services/documentService';
import { Atleta } from '../types';

interface MatriculaModalProps {
  show: boolean;
  onHide: () => void;
  atleta: Atleta | null;
}

const MatriculaModal: React.FC<MatriculaModalProps> = ({ show, onHide, atleta }) => {
  const [documentoMatricula, setDocumentoMatricula] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (show && atleta) {
      loadDocumentoMatricula();
    }
  }, [show, atleta]);

  const loadDocumentoMatricula = async () => {
    if (!atleta?.id) return;
    
    try {
      setLoading(true);
      const documentos = await documentService.listDocuments(atleta.id);
      const matriculaDoc = documentos.find(doc => doc.tipo === 'matricula');
      setDocumentoMatricula(matriculaDoc || null);
    } catch (error) {
      toast.error('Erro ao carregar documento da matrícula');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentoMatricula) return;

    try {
      setDownloading(true);
      await documentService.downloadWithTemporaryUrl(documentoMatricula);
      toast.success('Download da matrícula iniciado com sucesso!');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar matrícula');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(extension);
  };

  if (!atleta) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaIdCard className="me-2" />
          Matrícula do Atleta: {atleta.nome}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </Spinner>
          </div>
        ) : !documentoMatricula ? (
          <Alert variant="warning" className="text-center">
            <FaTimes className="me-2" />
            <strong>Nenhum documento de matrícula encontrado</strong>
            <br />
            Nenhum arquivo de matrícula foi enviado para este atleta ainda.
          </Alert>
        ) : (
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <FaIdCard className="me-2" />
                Documento da Matrícula
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <div className="mb-3">
                    <strong>Nome do Arquivo:</strong> {documentoMatricula.nomeArquivo}
                  </div>
                  <div className="mb-3">
                    <strong>Tamanho:</strong> {formatFileSize(documentoMatricula.tamanho)}
                  </div>
                  <div className="mb-3">
                    <strong>Data de Upload:</strong> {formatDate(documentoMatricula.dataUpload)}
                  </div>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="primary"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-100"
                  >
                    {downloading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <FaDownload className="me-2" />
                        Baixar Matrícula
                      </>
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Preview do arquivo se for imagem */}
              {isImageFile(documentoMatricula.nomeArquivo) && documentoMatricula.url && (
                <div className="mt-3">
                  <strong>Visualização:</strong>
                  <div className="mt-2">
                    <img 
                      src={documentoMatricula.url} 
                      alt="Preview da matrícula"
                      className="img-fluid border rounded"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                </div>
              )}

              {/* Informações adicionais */}
              <div className="mt-3">
                <Badge bg="info" className="me-2">
                  <FaFileAlt className="me-1" />
                  {documentoMatricula.contentType}
                </Badge>
                <Badge bg="success">
                  <FaIdCard className="me-1" />
                  Matrícula Válida
                </Badge>
              </div>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MatriculaModal;
