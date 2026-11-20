import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf';

export default function Uploader({ onFilesSelected }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    if (arr.length) onFilesSelected(arr);
  };

  return (
    <div
      className={`dropzone ${drag ? 'drag' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <UploadCloud size={34} color="#a99bff" />
      <div style={{ fontWeight: 700, marginTop: 8, fontSize: '1rem' }}>
        Click to upload or drag & drop bills here
      </div>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
        Supports JPG, PNG, WEBP, and PDF — multiple files allowed
      </div>
    </div>
  );
}