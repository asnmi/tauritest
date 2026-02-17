import React, { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

type Item = {
  id: string;
  content: React.ReactNode;
};

type ReorderableListProps<T extends Item> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging?: boolean) => React.ReactNode;
  itemClassName?: string;
  containerClassName?: string;
};

export function ReorderableList<T extends Item>({
  items,
  onReorder,
  renderItem,
  itemClassName = '',
  containerClassName = '',
}: ReorderableListProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeItem = React.useMemo(
    () => items.find((item) => item.id === activeId),
    [activeId, items]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          onReorder(arrayMove(items, oldIndex, newIndex));
        }
      }
      
      setActiveId(null);
    },
    [items, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={`space-y-2 ${containerClassName}`}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} className={itemClassName}>
              {renderItem(item, item.id === activeId)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-50">
            {renderItem(activeItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}