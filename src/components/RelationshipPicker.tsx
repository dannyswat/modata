import React, { useState } from 'react';
import { type RelationType, RELATION_LABELS } from '../types/schema';
import './RelationshipPicker.css';

interface RelationshipPickerProps {
  position: { x: number; y: number };
  onSelect: (type: RelationType) => void;
  onCancel: () => void;
}

const options: { type: RelationType; description: string }[] = [
  { type: 'oneToOne', description: 'Each record relates to exactly one record' },
  { type: 'oneToMany', description: 'One record relates to many records' },
  { type: 'manyToMany', description: 'Many records relate to many records' },
];

const RelationshipPicker: React.FC<RelationshipPickerProps> = ({
  position,
  onSelect,
  onCancel,
}) => {
  return (
    <>
      <div className="relationship-picker__overlay" onClick={onCancel} />
      <div
        className="relationship-picker"
        style={{ left: position.x, top: position.y }}
      >
        <div className="relationship-picker__title">Relationship Type</div>
        {options.map((opt) => (
          <button
            key={opt.type}
            className="relationship-picker__option"
            onClick={() => onSelect(opt.type)}
          >
            <span className="relationship-picker__label">
              {RELATION_LABELS[opt.type]}
            </span>
            <span className="relationship-picker__desc">{opt.description}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default RelationshipPicker;
