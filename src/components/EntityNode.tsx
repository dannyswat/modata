import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import { useDiagramStore } from '../store/diagramStore';
import {
  type EntityNodeData,
  type FieldDef,
  type PrimitiveType,
  PRIMITIVE_TYPES,
  ENTITY_COLORS,
} from '../types/schema';
import './EntityNode.css';

/* ─── Field type display helpers ─── */
const TYPE_ICONS: Record<PrimitiveType, string> = {
  uuid: '#',
  int: '123',
  decimal: '1.0',
  string: 'Aa',
  boolean: '✓✗',
};

function typeIcon(field: FieldDef): string {
  if (typeof field.type === 'string') {
    return TYPE_ICONS[field.type];
  }
  return '{ }';
}

/* ─── Sub-entity field row ─── */
const SubEntityFieldRow: React.FC<{
  nodeId: string;
  parentFieldId: string;
  field: FieldDef;
}> = ({ nodeId, parentFieldId, field }) => {
  const updateSubEntityField = useDiagramStore((s) => s.updateSubEntityField);
  const removeSubEntityField = useDiagramStore((s) => s.removeSubEntityField);

  return (
    <div className="entity-node__sub-field">
      <span className="entity-node__sub-field-icon">·</span>
      <input
        className="entity-node__field-name-input"
        value={field.name}
        onChange={(e) =>
          updateSubEntityField(nodeId, parentFieldId, field.id, {
            name: e.target.value,
          })
        }
        onMouseDown={(e) => e.stopPropagation()}
      />
      <select
        className="entity-node__field-type-select"
        value={typeof field.type === 'string' ? field.type : ''}
        onChange={(e) =>
          updateSubEntityField(nodeId, parentFieldId, field.id, {
            type: e.target.value as PrimitiveType,
          })
        }
        onMouseDown={(e) => e.stopPropagation()}
      >
        {PRIMITIVE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        className="entity-node__field-remove"
        onClick={() => removeSubEntityField(nodeId, parentFieldId, field.id)}
        title="Remove sub-field"
      >
        ×
      </button>
    </div>
  );
};

/* ─── Drag state type ─── */
interface DragState {
  fromIndex: number;
  toIndex: number;
}

/* ─── Field row component with drag reorder ─── */
const FieldRow: React.FC<{
  nodeId: string;
  field: FieldDef;
  index: number;
  dragState: DragState | null;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
}> = ({ nodeId, field, index, dragState, onDragStart, onDragOver, onDragEnd }) => {
  const updateField = useDiagramStore((s) => s.updateField);
  const removeField = useDiagramStore((s) => s.removeField);
  const addSubEntityField = useDiagramStore((s) => s.addSubEntityField);

  const isSubEntity = typeof field.type !== 'string';
  const isDragging = dragState?.fromIndex === index;
  const isDragOver = dragState !== null && dragState.toIndex === index && dragState.fromIndex !== index;

  const handleTypeChange = useCallback(
    (value: string) => {
      if (value === 'sub-entity') {
        updateField(nodeId, field.id, {
          type: { kind: 'sub-entity', name: field.name, fields: [] },
        });
      } else {
        updateField(nodeId, field.id, { type: value as PrimitiveType });
      }
    },
    [nodeId, field.id, field.name, updateField],
  );

  return (
    <>
      <div
        className={`entity-node__field${isDragging ? ' entity-node__field--dragging' : ''}${isDragOver ? ' entity-node__field--drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(index);
        }}
      >
        {/* Drag handle */}
        <span
          className="entity-node__field-drag"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            onDragStart(index);
          }}
          onDragEnd={onDragEnd}
          onMouseDown={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          ⠿
        </span>
        <Handle
          type="target"
          position={Position.Left}
          id={`${field.id}-target`}
          className="entity-node__handle entity-node__handle--left"
          style={{ top: 'auto' }}
        />
        <span className="entity-node__field-icon">{typeIcon(field)}</span>
        <input
          className="entity-node__field-name-input"
          value={field.name}
          onChange={(e) =>
            updateField(nodeId, field.id, { name: e.target.value })
          }
          onMouseDown={(e) => e.stopPropagation()}
        />
        <select
          className="entity-node__field-type-select"
          value={isSubEntity ? 'sub-entity' : field.type as string}
          onChange={(e) => handleTypeChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {PRIMITIVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value="sub-entity">sub-entity</option>
        </select>
        <button
          className="entity-node__field-remove"
          onClick={() => removeField(nodeId, field.id)}
          title="Remove field"
        >
          ×
        </button>
        <Handle
          type="source"
          position={Position.Right}
          id={`${field.id}-source`}
          className="entity-node__handle entity-node__handle--right"
          style={{ top: 'auto' }}
        />
      </div>
      {isSubEntity && typeof field.type !== 'string' && (
        <div className="entity-node__sub-fields">
          {field.type.fields.map((sf) => (
            <SubEntityFieldRow
              key={sf.id}
              nodeId={nodeId}
              parentFieldId={field.id}
              field={sf}
            />
          ))}
          <button
            className="entity-node__add-sub-field"
            onClick={() => addSubEntityField(nodeId, field.id)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            + sub-field
          </button>
        </div>
      )}
    </>
  );
};

/* ─── Color Picker Popover ─── */
const ColorPicker: React.FC<{
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}> = ({ currentColor, onSelect, onClose }) => {
  return (
    <>
      <div className="entity-node__color-overlay" onClick={onClose} />
      <div className="entity-node__color-picker">
        {ENTITY_COLORS.map((c) => (
          <button
            key={c}
            className={`entity-node__color-swatch${c === currentColor ? ' entity-node__color-swatch--active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => {
              onSelect(c);
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={c}
          />
        ))}
      </div>
    </>
  );
};

/* ─── Entity Node ─── */
interface EntityNodeProps {
  id: string;
  data: EntityNodeData;
  selected?: boolean;
}

const EntityNodeComponent: React.FC<EntityNodeProps> = ({ id, data, selected }) => {
  const updateEntityName = useDiagramStore((s) => s.updateEntityName);
  const updateEntityColor = useDiagramStore((s) => s.updateEntityColor);
  const addField = useDiagramStore((s) => s.addField);
  const removeEntity = useDiagramStore((s) => s.removeEntity);
  const reorderFields = useDiagramStore((s) => s.reorderFields);

  const [editing, setEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDragStart = useCallback((index: number) => {
    setDragState({ fromIndex: index, toIndex: index });
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragState((prev) => prev ? { ...prev, toIndex: index } : null);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragState && dragState.fromIndex !== dragState.toIndex) {
      reorderFields(id, dragState.fromIndex, dragState.toIndex);
    }
    setDragState(null);
  }, [dragState, id, reorderFields]);

  return (
    <div
      className={`entity-node ${selected ? 'entity-node--selected' : ''}`}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="entity-node__toolbar">
          <button onClick={() => removeEntity(id)} title="Delete entity">
            🗑 Delete
          </button>
        </div>
      </NodeToolbar>

      {/* Header */}
      <div
        className="entity-node__header"
        style={{ backgroundColor: data.color }}
        onDoubleClick={() => setEditing(true)}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="header-target"
          className="entity-node__handle entity-node__handle--top"
        />

        {/* Color picker button */}
        <button
          className="entity-node__color-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Change color"
        >
          ●
        </button>

        {editing ? (
          <input
            ref={inputRef}
            className="entity-node__name-input"
            value={data.name}
            onChange={(e) => updateEntityName(id, e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="entity-node__name">{data.name}</span>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          id="header-source"
          className="entity-node__handle entity-node__handle--bottom"
        />
      </div>

      {/* Color picker popover */}
      {showColorPicker && (
        <ColorPicker
          currentColor={data.color}
          onSelect={(color) => updateEntityColor(id, color)}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {/* Fields */}
      <div className="entity-node__fields">
        {data.fields.map((field, idx) => (
          <FieldRow
            key={field.id}
            nodeId={id}
            field={field}
            index={idx}
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Add field button */}
      <button
        className="entity-node__add-field"
        onClick={() => addField(id)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        + Add Field
      </button>
    </div>
  );
};

export default memo(EntityNodeComponent);
