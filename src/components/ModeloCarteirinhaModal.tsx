import React, { useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Alert,
  Spinner,
  Card
} from 'react-bootstrap';
import { FaUpload, FaFilePdf, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { supabase, MODELO_CARTEIRINHA_CONFIG } from '../config/supabase';

interface ModeloCarteirinhaModalProps {
  show: boolean;
  onHide: () => void;
  onModeloImportado?: () => void;
}

const ModeloCarteirinhaModal: React.FC<ModeloCarteirinhaModalProps> = ({ 
  show, 
  onHide, 
  onModeloImportado 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é PDF
      if (file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são aceitos');
        return;
      }
      
      // Verificar tamanho (10MB)
      if (file.size > MODELO_CARTEIRINHA_CONFIG.MAX_FILE_SIZE) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      
      // Nome do arquivo no formato: modelo-carteirinha-YYYY-MM-DD.pdf
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      const fileName = `modelo-carteirinha-${timestamp}.pdf`;
      
      // Upload para o Supabase
      const { data, error } = await supabase.storage
        .from(MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME)
        .upload(fileName, selectedFile, {
          contentType: 'application/pdf',
          upsert: true // Substituir se já existir
        });

      if (error) {
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      toast.success('Modelo de carteirinha importado com sucesso!');
      setSelectedFile(null);
      
      // Notificar que o modelo foi importado
      if (onModeloImportado) {
        onModeloImportado();
      }
      
      onHide();
    } catch (error) {
      console.error('Erro ao importar modelo:', error);
      toast.error(`Erro ao importar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaFilePdf className="me-2" />
          Importar Modelo de Carteirinha
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          <strong>ℹ️ Informação:</strong> Importe o modelo PDF da carteirinha que será usado como base para gerar as carteirinhas dos atletas.
        </Alert>

        <Card>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Arquivo PDF *</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <Form.Text className="text-muted">
                Tamanho máximo: 10MB | Apenas arquivos PDF
              </Form.Text>
            </Form.Group>

            {selectedFile && (
              <div className="mb-3">
                <Alert variant="success" className="d-flex align-items-center">
                  <FaCheck className="me-2" />
                  <div>
                    <strong>Arquivo selecionado:</strong><br />
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                </Alert>
              </div>
            )}

            <Alert variant="warning">
              <strong>⚠️ Importante:</strong> O modelo será substituído se já existir um arquivo com o mesmo nome. 
              Certifique-se de que o modelo está no formato correto antes de importar.
            </Alert>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={uploading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Importando...
            </>
          ) : (
            <>
              <FaUpload className="me-2" />
              Importar Modelo
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModeloCarteirinhaModal;
