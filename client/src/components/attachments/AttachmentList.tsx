import React, { useEffect, useState } from 'react';

// Componente React per lista allegati

interface Attachment {
  filename: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  description?: string;
  [key: string]: any;
}

interface AttachmentListProps {
  taskId?: string;
  onDownload?: (filename: string) => void;
}

const AttachmentList: React.FC<AttachmentListProps> = ({ taskId, onDownload }) => {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = taskId ? `/api/attachments?taskId=${encodeURIComponent(taskId)}` : '/api/attachments';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Errore caricamento lista');
        const data = await res.json();
        setFiles(data);
      } catch (err: any) {
        setError(err.message || 'Errore caricamento lista');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [taskId]);

  const handleDelete = async (filename: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo allegato?')) return;
    try {
      const res = await fetch(`/api/attachments/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore eliminazione');
      setFiles(prev => prev.filter(f => f.filename !== filename));
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione');
    }
  };

  if (loading) return <div>Caricamento allegati...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (files.length === 0) return <div>Nessun allegato presente.</div>;

  return (
    <ul>
      {files.map(f => (
        <li key={f.filename} style={{ marginBottom: 12 }}>
          {/* Preview immagini */}
          {f.mimetype && f.mimetype.startsWith('image/') && (
            <img src={`/api/attachments/${f.filename}`} alt={f.originalname} style={{ maxWidth: 120, maxHeight: 80, display: 'block', marginBottom: 4 }} />
          )}
          {/* Preview PDF */}
          {f.mimetype === 'application/pdf' && (
            <a href={`/api/attachments/${f.filename}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>
              [Anteprima PDF]
            </a>
          )}
          {/* Nome file e descrizione */}
          <div>
            <a href={`/api/attachments/${f.filename}`} target="_blank" rel="noopener noreferrer">
              {f.originalname || f.filename}
            </a>
            {f.description && <span style={{ marginLeft: 8, color: '#666' }}>({f.description})</span>}
          </div>
          {/* Info tipo e dimensione */}
          <div style={{ fontSize: 12, color: '#888' }}>
            {f.mimetype} {f.size ? `- ${(f.size/1024).toFixed(1)} KB` : ''}
          </div>
          {onDownload && (
            <button onClick={() => onDownload(f.filename)} style={{ marginLeft: 8 }}>
              Scarica
            </button>
          )}
          <button onClick={() => handleDelete(f.filename)} style={{ marginLeft: 8, color: 'red' }}>
            Elimina
          </button>
        </li>
      ))}
    </ul>
  );
};

export default AttachmentList;
