import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  FileCode,
  HardDrive
} from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadDocument: (name: string, title: string, status: any, description: string, content: string) => Promise<void>;
  isOnline?: boolean;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUploadDocument,
  isOnline = true
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<any>('draft');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [previewSnippet, setPreviewSnippet] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setTitle('');
    setStatus('draft');
    setDescription('');
    setContent('');
    setPreviewSnippet('');
    setError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const processFile = (file: File) => {
    setError(null);

    // Validate supported file extensions
    const lowerName = file.name.toLowerCase();
    const isMd = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');
    const isTxt = lowerName.endsWith('.txt');

    if (!isMd && !isTxt) {
      setError('Unsupported file type for SyncSafe synchronization. Only text-based documents (.md, .txt) are supported.');
      setSelectedFile(null);
      return;
    }

    // Size limit check (max 5MB for text documents)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large for collaborative synchronization (maximum 5 MB).');
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setSelectedFile(file);
      setFileName(file.name);
      
      const cleanTitle = file.name.replace(/\.(md|markdown|txt)$/i, '');
      setTitle(cleanTitle);
      setDescription(`Uploaded ${isMd ? 'Markdown' : 'Text'} document · ${(file.size / 1024).toFixed(1)} KB`);
      setContent(text);
      setPreviewSnippet(text.slice(0, 300));
    };

    reader.onerror = () => {
      setError('Failed to read local file content.');
      setSelectedFile(null);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileName.trim()) {
      setError('Please select a valid .md or .txt document to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUploadDocument(
        fileName.trim(),
        title.trim() || fileName.trim(),
        status,
        description.trim(),
        content
      );
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', padding: 0 }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Upload Document
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Import local document into SyncSafe Drive with Version 1 lineage
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#dc2626',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Offline Notice if offline */}
          {!isOnline && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#d97706',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <HardDrive size={14} />
              <span>Offline Mode: Document will be cached locally in IndexedDB and queued for sync on reconnect.</span>
            </div>
          )}

          {/* File Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #2563eb' : selectedFile ? '1.5px solid rgba(16, 185, 129, 0.4)' : '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              background: isDragging ? 'rgba(37, 99, 235, 0.05)' : selectedFile ? 'rgba(16, 185, 129, 0.04)' : 'rgba(248, 250, 252, 0.8)',
              padding: '24px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              style={{ display: 'none' }}
            />

            {selectedFile ? (
              <>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                  <span>{selectedFile.name.endsWith('.txt') ? 'Text File (.txt)' : 'Markdown File (.md)'}</span>
                  <span>·</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '4px' }}>
                  Click or drag to choose a different file
                </span>
              </>
            ) : (
              <>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}>
                  <UploadCloud size={24} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Click to select or drag and drop document
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Supported formats: <strong>.md, .markdown, .txt</strong> (Max 5 MB)
                </div>
              </>
            )}
          </div>

          {/* Form Fields: Only show when a file is selected */}
          {selectedFile && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Document Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Display title"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Initial Status
                  </label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="draft">draft</option>
                    <option value="in_review">in_review</option>
                    <option value="approved">approved</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Document purpose..."
                />
              </div>

              {/* Preview Snippet */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  <FileCode size={13} />
                  <span>Content Preview ({content.length} characters)</span>
                </div>
                <pre style={{
                  maxHeight: '100px',
                  overflowY: 'auto',
                  background: 'rgba(241, 245, 249, 0.8)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {previewSnippet}
                  {content.length > 300 ? '...' : ''}
                </pre>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!selectedFile || isUploading}
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              {isUploading ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Upload & Sync (V1)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
