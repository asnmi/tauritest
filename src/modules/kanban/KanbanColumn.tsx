import React, { memo, useCallback, useState } from 'react';
import KanbanCard from './KanbanCard';
import { Column, Card } from './interface';

interface KanbanColumnProps {
  column: Column;
  onAddCard: (columnId: string, title: string) => void;
  onDragStart: (e: React.DragEvent, card: Card, columnId: string) => void;
  onDragOver: (e: React.DragEvent, columnId: string, cardId?: string | null) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, columnId: string, cardId?: string) => void;
  draggedOverColumn: string | null;
  draggedOverCard: { cardId: string; columnId: string } | null;
  dropPosition: { columnId: string; cardId: string | null; position: 'before' | 'after' } | null;
}

const KanbanColumn: React.FC<KanbanColumnProps> = memo(({
  column,
  onAddCard,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedOverColumn,
  draggedOverCard,
  dropPosition,
}) => {
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = useCallback(() => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle);
      setNewCardTitle('');
    }
  }, [newCardTitle, column.id, onAddCard]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    }
  }, [handleAddCard]);

  return (
    <div
      className={`column relative ${draggedOverColumn === column.id ? 'drag-over' : ''}`}
      style={{
        minWidth: '300px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        border: draggedOverColumn === column.id ? '2px dashed #4a90e2' : '1px solid #ddd',
      }}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <h3 style={{ margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid #ddd' }}>
        {column.title}
      </h3>
      
      <div className="add-card">
        <input
          type="text"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nouvelle carte"
          style={{ width: '100%', padding: '0.5rem' }}
        />
        <button 
          onClick={handleAddCard}
          style={{ marginTop: '0.5rem', width: '100%' }}
        >
          Ajouter une carte
        </button>
      </div>
      
      <div 
        className="cards-drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(e, column.id);
        }}
        onDrop={(e) => {
          e.stopPropagation();
          onDrop(e, column.id);
        }}
        onDragLeave={onDragLeave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '0.5rem',
          minHeight: '100px',
          backgroundColor: draggedOverColumn === column.id ? 'rgba(74, 144, 226, 0.05)' : 'transparent',
          borderRadius: '8px',
          padding: '0.5rem',
          transition: 'background-color 0.2s ease',
        }}
      >
        {column.cards.length > 0 ? (
          <div className="cards" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {column.cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                columnId={column.id}
                isFirst={index === 0}
                isLast={index === column.cards.length - 1}
                draggedOverCard={draggedOverCard}
                dropPosition={dropPosition}
                onDragStart={onDragStart}
                onDragOver={(e) => onDragOver(e, column.id, card.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, column.id, card.id)}
              />
            ))}
          </div>
        ) : (
          <div 
            style={{
              border: '2px dashed #ccc',
              borderRadius: '4px',
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#666',
              backgroundColor: 'rgba(0,0,0,0.02)',
            }}
          >
            Déposez une carte ici
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.column.id === nextProps.column.id &&
    prevProps.column.cards.length === nextProps.column.cards.length &&
    JSON.stringify(prevProps.column) === JSON.stringify(nextProps.column) &&
    prevProps.draggedOverColumn === nextProps.draggedOverColumn &&
    prevProps.draggedOverCard?.cardId === nextProps.draggedOverCard?.cardId &&
    prevProps.dropPosition?.cardId === nextProps.dropPosition?.cardId
  );
});

export default KanbanColumn;