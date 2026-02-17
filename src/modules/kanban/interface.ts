import { ReactNode } from 'react';

type ID = string;
type DropPosition = 'before' | 'after';

/**
 * Représente une carte dans le tableau Kanban
 */
interface Card {
  /** Identifiant unique de la carte */
  id: ID;
  /** Titre de la carte */
  title: string;
  /** Description détaillée de la carte */
  description: string;
  /** Date de création de la carte */
  createdAt?: Date;
  /** Date de dernière modification */
  updatedAt?: Date;
  /** Étiquettes ou tags associés à la carte */
  tags?: string[];
  /** Priorité de la carte (optionnelle) */
  priority?: 'low' | 'medium' | 'high';
  /** Identifiant de l'utilisateur assigné */
  assigneeId?: ID;
}

/**
 * État de survol lors du glisser-déposer
 */
interface DraggedOverState {
  cardId: ID;
  columnId: ID;
}

/**
 * Position de dépôt cible
 */
interface DropPositionState {
  columnId: ID;
  cardId: ID | null;
  position: DropPosition;
}

/**
 * Propriétés du composant KanbanCard
 */
interface KanbanCardProps {
  /** Données de la carte à afficher */
  card: Card;
  /** Identifiant de la colonne parente */
  columnId: ID;
  /** Indique si la carte est la première de la colonne */
  isFirst: boolean;
  /** Indique si la carte est la dernière de la colonne */
  isLast: boolean;
  /** État de la carte survolée lors du glisser-déposer */
  draggedOverCard: DraggedOverState | null;
  /** Position de dépôt actuelle */
  dropPosition: DropPositionState | null;
  /** Gestionnaire de début de glisser */
  onDragStart: (e: React.DragEvent, card: Card, columnId: ID) => void;
  /** Gestionnaire de survol pendant le glisser */
  onDragOver: (e: React.DragEvent, columnId: string, cardId?: string | null, position?: 'before' | 'after') => void;
  /** Gestionnaire de sortie de zone de dépôt */
  onDragLeave: () => void;
  /** Gestionnaire de dépôt */
  onDrop: (e: React.DragEvent,
     targetColumnId: ID,
     targetCardId?: ID,
     position?: 'before' | 'after') => void;
  /** Contenu optionnel à afficher dans la carte */
  children?: ReactNode;
}

/**
 * Représente une colonne dans le tableau Kanban
 */
interface Column {
  /** Identifiant unique de la colonne */
  id: ID;
  /** Titre de la colonne */
  title: string;
  /** Liste des cartes dans la colonne */
  cards: Card[];
  /** Indique si la colonne est déverrouillée pour édition */
  isLocked?: boolean;
  /** Limite optionnelle du nombre de cartes */
  cardLimit?: number;
}

/**
 * Événements du Kanban
 */
interface KanbanEvents {
  onCardAdd?: (card: Card, columnId: ID) => void;
  onCardUpdate?: (card: Card, columnId: ID) => void;
  onCardDelete?: (cardId: ID, columnId: ID) => void;
  onCardMove?: (cardId: ID, fromColumnId: ID, toColumnId: ID) => void;
  onColumnAdd?: (column: Column) => void;
  onColumnUpdate?: (column: Column) => void;
  onColumnDelete?: (columnId: ID) => void;
}

export type { Card, KanbanCardProps, Column, KanbanEvents, DropPosition, DraggedOverState, DropPositionState };