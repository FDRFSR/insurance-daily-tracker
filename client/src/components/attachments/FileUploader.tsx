import React, { useRef, useState } from 'react';

// Componente React per upload file allegati

interface FileUploaderProps {
  taskId?: string;
  onUploadSuccess?: (file: any) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ taskId, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    if (taskId) formData.append('taskId', taskId);
    if (description) formData.append('description', description);
    try {
      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Errore upload');
      }
      const data = await res.json();
      onUploadSuccess?.(data);
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Errore upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-2"
        accept="image/*,application/pdf,.docx,.xlsx"
      />
      <input
        type="text"
        placeholder="Descrizione (opzionale)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={uploading}
        className="mb-2 ml-2 px-2 py-1 border rounded"
        style={{ minWidth: 180 }}
      />
      {uploading && <span>Caricamento...</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
};

export default FileUploader;
