import React, { memo } from 'react';
import DropIndicator from './DropIndicator';
import {KanbanCardProps} from './interface';

const KanbanCard: React.FC<KanbanCardProps> = memo(({
  card,
  columnId,
  draggedOverCard,
  dropPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const showBefore = dropPosition?.columnId === columnId && 
                    dropPosition.cardId === card.id && 
                    dropPosition.position === 'before';
  
  const showAfter = dropPosition?.columnId === columnId && 
                   dropPosition.cardId === card.id && 
                   dropPosition.position === 'after';

  return (
    <div 
      className="card-container"
      onDragOver={(e) => onDragOver(e, columnId, card.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, columnId, card.id)}
      style={{
        position: 'relative',
        margin: '4px 0',
        minHeight: '20px',
      }}
    >
      {/* Zone de dépôt avant la carte */}
      <div 
        className="drop-zone before"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          zIndex: 2,
          backgroundColor: showBefore ? 'rgba(74, 144, 226, 0.1)' : 'transparent',
          pointerEvents: 'none',
        }}
      >
        {showBefore && <DropIndicator isVisible={true} position="before" />}
      </div>

      {/* La carte elle-même */}
      <div
        className={`card ${draggedOverCard?.cardId === card.id && draggedOverCard?.columnId === columnId ? 'drag-over' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, card, columnId)}
        style={{
          backgroundColor: 'white',
          padding: '0.75rem',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          cursor: 'grab',
          border: '1px solid #e0e0e0',
          transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0' }}>{card.title}</h4>
        {card.description && (
          <p style={{ margin: '0', fontSize: '0.875rem', color: '#555' }}>
            {card.description}
          </p>
        )}
      </div>

      {/* Zone de dépôt après la carte */}
      <div 
        className="drop-zone after"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          zIndex: 2,
          backgroundColor: showAfter ? 'rgba(74, 144, 226, 0.1)' : 'transparent',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {showAfter && <DropIndicator isVisible={true} position="after" />}
      </div>
    </div>
  );

}, (prevProps, nextProps) => {
  // Ne re-rendre que si les props pertinentes changent
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.isFirst === nextProps.isFirst &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.draggedOverCard?.cardId === nextProps.draggedOverCard?.cardId &&
    prevProps.dropPosition?.cardId === nextProps.dropPosition?.cardId &&
    prevProps.dropPosition?.position === nextProps.dropPosition?.position
  );
});

export default KanbanCard;