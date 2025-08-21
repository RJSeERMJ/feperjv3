import React from 'react';
import { ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { FaDownload, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface DownloadProgressProps {
  fileName: string;
  progress: number;
  isDownloading: boolean;
  error?: string;
  onCancel?: () => void;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({
  fileName,
  progress,
  isDownloading,
  error,
  onCancel
}) => {
  if (error) {
    return (
      <Alert variant="danger" className="mb-3">
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <div>
            <strong>Erro no download:</strong> {fileName}
            <br />
            <small>{error}</small>
          </div>
        </div>
      </Alert>
    );
  }

  if (!isDownloading) {
    return null;
  }

  return (
    <Alert variant="info" className="mb-3">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <div>
            <strong>Baixando:</strong> {fileName}
            <br />
            <small>Progresso: {progress}%</small>
          </div>
        </div>
        {onCancel && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
            title="Cancelar download"
          >
            ✕
          </button>
        )}
      </div>
      <ProgressBar 
        now={progress} 
        variant="success"
        className="mt-2"
        style={{ height: '8px' }}
      />
    </Alert>
  );
};

export default DownloadProgress;
