import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useDiagramStore } from '../store/diagramStore';
import { autoLayout, type LayoutDirection } from '../utils/layout';
import { generatePngBlob, generateSvgBlob, downloadBlob } from '../utils/exportImage';
import {
  copySchemaPlainTextToClipboard,
  exportSchemaJSON,
  importSchemaJSON,
  serializeSchemaToPlainText,
} from '../utils/serialization';
import {
  saveDiagram,
  loadDiagram,
  loadLastDiagram,
  listSavedDiagrams,
  deleteDiagram,
  type SavedDiagramMeta,
} from '../store/persistence';
import { useModataProps } from '../context/ModataContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const {
    data,
    onChange,
    onSave,
    onExportImage,
    onExportSvg,
    onExportJSON,
    onExportClipboard,
    onImport,
    persistInLocalStorage = true,
    readOnly = false,
  } = useModataProps();

  const diagramName = useDiagramStore((s) => s.diagramName);
  const setDiagramName = useDiagramStore((s) => s.setDiagramName);
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const addEntity = useDiagramStore((s) => s.addEntity);
  const setNodes = useDiagramStore((s) => s.setNodes);
  const loadDiagramToStore = useDiagramStore((s) => s.loadDiagram);
  const clearDiagram = useDiagramStore((s) => s.clearDiagram);
  const toDiagramSchema = useDiagramStore((s) => s.toDiagramSchema);

  const { fitView } = useReactFlow();
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagramMeta[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);
  const initialDataLoaded = useRef(false);
  const clipboardStatusTimer = useRef<number | null>(null);

  const showClipboardStatus = useCallback((message: string) => {
    setClipboardStatus(message);
    if (clipboardStatusTimer.current !== null) {
      window.clearTimeout(clipboardStatusTimer.current);
    }
    clipboardStatusTimer.current = window.setTimeout(() => {
      setClipboardStatus(null);
      clipboardStatusTimer.current = null;
    }, 2400);
  }, []);

  /* refresh saved list */
  const refreshSaved = useCallback(() => {
    if (persistInLocalStorage) {
      setSavedDiagrams(listSavedDiagrams());
    }
  }, [persistInLocalStorage]);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  useEffect(() => {
    return () => {
      if (clipboardStatusTimer.current !== null) {
        window.clearTimeout(clipboardStatusTimer.current);
      }
    };
  }, []);

  /* Auto-save on changes (debounced) */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0) {
        const schema = toDiagramSchema();

        // Persist to localStorage if enabled
        if (persistInLocalStorage) {
          saveDiagram(schema);
          refreshSaved();
        }

        // Call onChange callback
        onChange?.(schema);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [nodes, edges, diagramName, toDiagramSchema, refreshSaved, persistInLocalStorage, onChange]);

  /* Load initial data on mount */
  useEffect(() => {
    if (initialDataLoaded.current) return;
    initialDataLoaded.current = true;

    // If `data` prop is provided, use it
    if (data && data.nodes.length > 0) {
      loadDiagramToStore(data);
      setTimeout(() => fitView({ padding: 0.2 }), 100);
      return;
    }

    // Otherwise, try loading from localStorage if enabled
    if (persistInLocalStorage) {
      const last = loadLastDiagram();
      if (last && last.nodes.length > 0) {
        loadDiagramToStore(last);
        setTimeout(() => fitView({ padding: 0.2 }), 100);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ── */
  const handleAutoLayout = useCallback(
    (direction: LayoutDirection = 'TB') => {
      const layouted = autoLayout(nodes, edges, direction);
      setNodes(layouted);
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    },
    [nodes, edges, setNodes, fitView],
  );

  const handleExportJSON = useCallback(() => {
    const schema = toDiagramSchema();
    const filename = `${diagramName.replace(/\s+/g, '-').toLowerCase()}.modata.json`;
    if (onExportJSON) {
      onExportJSON(schema, filename);
    } else {
      exportSchemaJSON(schema);
    }
  }, [toDiagramSchema, diagramName, onExportJSON]);

  const handleExportClipboard = useCallback(async () => {
    const schema = toDiagramSchema();
    const text = serializeSchemaToPlainText(schema);

    try {
      if (onExportClipboard) {
        await onExportClipboard(text);
      } else {
        await copySchemaPlainTextToClipboard(schema);
      }

      showClipboardStatus('Plain text copied to clipboard');
    } catch (e: any) {
      showClipboardStatus('Clipboard export failed');
      alert('Failed to copy plain text: ' + (e?.message ?? 'Unknown error'));
    }
  }, [toDiagramSchema, onExportClipboard, showClipboardStatus]);

  const handleImportJSON = useCallback(async () => {
    try {
      let schema;
      if (onImport) {
        schema = await onImport();
      } else {
        schema = await importSchemaJSON();
      }
      loadDiagramToStore(schema);
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch (e: any) {
      if (e.message !== 'No file selected') {
        alert('Failed to import: ' + e.message);
      }
    }
  }, [loadDiagramToStore, fitView, onImport]);

  const handleExportPng = useCallback(async () => {
    const filename = `${diagramName.replace(/\s+/g, '-').toLowerCase()}.png`;
    const blob = await generatePngBlob(nodes);
    if (onExportImage) {
      onExportImage(blob, filename);
    } else {
      downloadBlob(blob, filename);
    }
  }, [diagramName, nodes, onExportImage]);

  const handleExportSvg = useCallback(async () => {
    const filename = `${diagramName.replace(/\s+/g, '-').toLowerCase()}.svg`;
    const blob = await generateSvgBlob(nodes);
    if (onExportSvg) {
      onExportSvg(blob, filename);
    } else {
      downloadBlob(blob, filename);
    }
  }, [diagramName, nodes, onExportSvg]);

  const handleSave = useCallback(() => {
    const schema = toDiagramSchema();
    if (persistInLocalStorage) {
      saveDiagram(schema);
      refreshSaved();
    }
    onSave?.(schema);
  }, [toDiagramSchema, refreshSaved, persistInLocalStorage, onSave]);

  const handleLoadSaved = useCallback(
    (name: string) => {
      const schema = loadDiagram(name);
      if (schema) {
        loadDiagramToStore(schema);
        setTimeout(() => fitView({ padding: 0.2 }), 100);
      }
      setShowSaved(false);
    },
    [loadDiagramToStore, fitView],
  );

  const handleDeleteSaved = useCallback(
    (name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`Delete "${name}"?`)) {
        deleteDiagram(name);
        refreshSaved();
      }
    },
    [refreshSaved],
  );

  const handleNewDiagram = useCallback(() => {
    if (nodes.length > 0 && !confirm('Start a new diagram? Unsaved changes will be lost.')) {
      return;
    }
    clearDiagram();
  }, [nodes, clearDiagram]);

  return (
    <aside className="sidebar">
      {/* Logo / Title */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">◇</span>
        <span className="sidebar__logo-text">modata</span>
      </div>

      {/* Diagram name */}
      <div className="sidebar__section">
        <label className="sidebar__label">Diagram Name</label>
        <input
          className="sidebar__input"
          value={diagramName}
          onChange={(e) => setDiagramName(e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="sidebar__section">
          <label className="sidebar__label">Entities</label>
          <button className="sidebar__btn sidebar__btn--primary" onClick={() => addEntity()}>
            + Add Entity
          </button>
          <p className="sidebar__hint">or double-click the canvas</p>
        </div>
      )}

      <div className="sidebar__section">
        <label className="sidebar__label">Layout</label>
        <div className="sidebar__btn-row">
          <button className="sidebar__btn" onClick={() => handleAutoLayout('TB')}>
            ↕ Top-Down
          </button>
          <button className="sidebar__btn" onClick={() => handleAutoLayout('LR')}>
            ↔ Left-Right
          </button>
        </div>
      </div>

      <div className="sidebar__section">
        <label className="sidebar__label">File</label>
        {!readOnly && (
          <button className="sidebar__btn" onClick={handleNewDiagram}>
            📄 New Diagram
          </button>
        )}
        <button className="sidebar__btn" onClick={handleSave}>
          💾 Save
        </button>
        {persistInLocalStorage && (
          <>
            <button className="sidebar__btn" onClick={() => setShowSaved(!showSaved)}>
              📂 Saved Diagrams ({savedDiagrams.length})
            </button>

            {showSaved && (
              <div className="sidebar__saved-list">
                {savedDiagrams.length === 0 && (
                  <p className="sidebar__hint">No saved diagrams yet</p>
                )}
                {savedDiagrams.map((m) => (
                  <div
                    key={m.name}
                    className="sidebar__saved-item"
                    onClick={() => handleLoadSaved(m.name)}
                  >
                    <span className="sidebar__saved-name">{m.name}</span>
                    <button
                      className="sidebar__saved-delete"
                      onClick={(e) => handleDeleteSaved(m.name, e)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sidebar__section">
        <label className="sidebar__label">Export</label>
        <button className="sidebar__btn" onClick={handleExportJSON}>
          📋 Export JSON
        </button>
        <button className="sidebar__btn" onClick={handleImportJSON}>
          📥 Import JSON
        </button>
        <button className="sidebar__btn" onClick={handleExportClipboard}>
          📋 Export to Clipboard
        </button>
        <button className="sidebar__btn" onClick={handleExportPng}>
          🖼 Export PNG
        </button>
        <button className="sidebar__btn" onClick={handleExportSvg}>
          📐 Export SVG
        </button>
        {clipboardStatus && <p className="sidebar__hint">{clipboardStatus}</p>}
      </div>

      {/* Entity list */}
      <div className="sidebar__section sidebar__section--grow">
        <label className="sidebar__label">
          Entities ({nodes.length})
        </label>
        <div className="sidebar__entity-list">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="sidebar__entity-item"
              onClick={() =>
                fitView({ nodes: [{ id: node.id }], padding: 0.5, duration: 300 })
              }
            >
              <span
                className="sidebar__entity-dot"
                style={{ backgroundColor: (node.data as any)?.color ?? '#4f6df5' }}
              />
              <span>{(node.data as any)?.name ?? 'Entity'}</span>
              <span className="sidebar__entity-fields">
                {(node.data as any)?.fields?.length ?? 0} fields
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar__footer">
        <span>modata v1.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
