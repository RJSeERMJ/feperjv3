import React from 'react';
import { ProgressBar } from 'react-bootstrap';

interface DownloadProgressProps {
  progress: number;
  fileName: string;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ progress, fileName }) => {
  return (
    <div className="download-progress">
      <div className="mb-2">
        <small className="text-muted">Baixando: {fileName}</small>
      </div>
      <ProgressBar 
        now={progress} 
        label={`${progress}%`}
        variant={progress === 100 ? 'success' : 'primary'}
      />
    </div>
  );
};

export default DownloadProgress;
