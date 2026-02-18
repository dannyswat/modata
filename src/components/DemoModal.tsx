import React, { useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import './DemoModal.css';

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ open, onClose }) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="demo-modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="demo-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="demo-modal-header">
          <div className="demo-modal-title">
            <span className="demo-modal-logo">mo</span>
            <span className="demo-modal-logo-accent">data</span>
            <span className="demo-modal-subtitle">— Interactive Demo</span>
          </div>
          <div className="demo-modal-hint">
            Double-click the canvas to add an entity · Drag handles to connect
          </div>
          <button className="demo-modal-close" onClick={onClose} aria-label="Close demo">
            ✕
          </button>
        </div>
        <div className="demo-modal-body">
          <Canvas />
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
