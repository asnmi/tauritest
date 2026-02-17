import React, { useState, useCallback, useMemo, memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import KanbanColumn from './KanbanColumn';
import { Column, Card } from './interface';

const KanbanBoard: React.FC = memo(() => {
  const [columns, setColumns] = useState<Column[]>(() => {
    // Initialisation avec une colonne par défaut
    return [
      {
        id: uuidv4(),
        title: 'À faire',
        cards: [
          { id: uuidv4(), title: 'Tâche 1', description: 'Description de la tâche 1' },
          { id: uuidv4(), title: 'Tâche 2', description: 'Description de la tâche 2' },
        ],
      },
      {
        id: uuidv4(),
        title: 'En cours',
        cards: [{ id: uuidv4(), title: 'Tâche 3', description: 'Description de la tâche 3' }],
      },
    ];
  });

  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [draggedCard, setDraggedCard] = useState<{ card: Card; sourceColumnId: string } | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [draggedOverCard, setDraggedOverCard] = useState<{ cardId: string; columnId: string } | null>(null);
  const [dropPosition, setDropPosition] = useState<{
    columnId: string;
    cardId: string | null;
    position: 'before' | 'after';
  } | null>(null);

  const handleAddColumn = useCallback(() => {
    if (!newColumnTitle.trim()) return;

    const newColumn: Column = {
      id: uuidv4(),
      title: newColumnTitle,
      cards: [],
    };

    setColumns(prevColumns => [...prevColumns, newColumn]);
    setNewColumnTitle('');
  }, [newColumnTitle]);

  const handleAddCard = useCallback((columnId: string, title: string) => {
    if (!title.trim()) return;

    const newCard: Card = {
      id: uuidv4(),
      title: title.trim(),
      description: '',
    };

    setColumns(prevColumns =>
      prevColumns.map((column) =>
        column.id === columnId
          ? { ...column, cards: [...column.cards, newCard] }
          : column
      )
    );
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, card: Card, columnId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    setDraggedCard({ card, sourceColumnId: columnId });
  }, []);

  const handleDragOver = useCallback((
    e: React.DragEvent,
    columnId: string,
    cardId?: string | null,
    position?: 'before' | 'after'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    //unused variables
    position;

    if (cardId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const isBefore = relativeY < rect.height / 2;

      setDropPosition({
        columnId,
        cardId,
        position: isBefore ? 'before' : 'after'
      });
    } else {
      setDropPosition({
        columnId,
        cardId: null,
        position: 'after'
      });
    }

    setDraggedOverColumn(columnId);
    if (cardId) {
      setDraggedOverCard({ cardId, columnId });
    } else {
      setDraggedOverCard(null);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback((
    e: React.DragEvent,
    targetColumnId: string,
    targetCardId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedCard) return;

    const { card, sourceColumnId } = draggedCard;
    const targetPosition = dropPosition?.position || 'after';

    // Empêcher le drop sur la même position
    if (sourceColumnId === targetColumnId && targetCardId === card.id) {
      setDropPosition(null);
      return;
    }

    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const sourceColumnIndex = newColumns.findIndex(col => col.id === sourceColumnId);
      const targetColumnIndex = newColumns.findIndex(col => col.id === targetColumnId);

      if (sourceColumnIndex === -1 || targetColumnIndex === -1) return prevColumns;

      const sourceCards = [...newColumns[sourceColumnIndex].cards];
      const targetCards = sourceColumnId === targetColumnId
        ? sourceCards
        : [...newColumns[targetColumnIndex].cards];

      const sourceCardIndex = sourceCards.findIndex(c => c.id === card.id);
      if (sourceCardIndex === -1) return prevColumns;

      const [movedCard] = sourceCards.splice(sourceCardIndex, 1);

      if (targetCardId) {
        let targetIndex = targetCards.findIndex(c => c.id === targetCardId);

        if (targetIndex !== -1) {
          if (targetPosition === 'after') {
            targetIndex += 1;
          }
        } else {
          targetIndex = targetCards.length;
        }

        targetCards.splice(targetIndex, 0, movedCard);
      } else {
        targetCards.push(movedCard);
      }

      newColumns[sourceColumnIndex] = {
        ...newColumns[sourceColumnIndex],
        cards: sourceCards
      };

      if (sourceColumnId !== targetColumnId || sourceColumnIndex !== targetColumnIndex) {
        newColumns[targetColumnIndex] = {
          ...newColumns[targetColumnIndex],
          cards: targetCards
        };
      } else {
        newColumns[sourceColumnIndex].cards = targetCards;
      }

      return newColumns;
    });

    // Réinitialisation des états
    setDraggedCard(null);
    setDraggedOverColumn(null);
    setDraggedOverCard(null);
    setDropPosition(null);
  }, [draggedCard, dropPosition]);

  /*const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDraggedOverColumn(null);
    setDraggedOverCard(null);
    setDropPosition(null);
  }, []);*/

  // Utilisation de useMemo pour éviter les rendus inutiles
  const columnsList = useMemo(() => columns, [columns]);

  return (
    <div className="kanban-board">
      <div className="add-column">
        <input
          type="text"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          placeholder="Nouvelle colonne"
          onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
        />
        <button onClick={handleAddColumn}>Ajouter une colonne</button>
      </div>

      <div
        className="columns-container"
        style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '1rem',
          gap: '1rem',
          willChange: 'transform' // Optimisation pour les animations
        }}
      >
        {columnsList.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onAddCard={handleAddCard}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            draggedOverColumn={draggedOverColumn}
            draggedOverCard={draggedOverCard}
            dropPosition={dropPosition}
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  //TODO unused variables
  prevProps;
  nextProps;
  // La fonction de comparaison personnalisée pour éviter les rendus inutiles
  return false;
});

export default KanbanBoard;