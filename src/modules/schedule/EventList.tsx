// src/component/schedule/EventList.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import EventCellForm from "./EventCellForm";
import { EventCell } from './ScheduleInterface';
import './EventList.css';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { useDragAndDrop } from './useDragAndDrop';

interface EventListProps {
  days: string[];
  schedule: { [day: string]: { [hour: string]: EventCell } };
  onEventUpdate: (day: string, hour: string, values: EventCell) => void;
  onEventDelete: (day: string, hour: string) => void;
  handleAddHour: (day: string, subject: string) => void;
  onEventMove: (targetDay: string, actionMode: string, eventsToMove: {day: string; hour: string; event: EventCell}[]) => void; 
  tagColors: (day: string, hour: string) => string;
  onTagColorChange: (day: string, hour: string, color: string) => void;
  selectedEvents: { [day: string]: { [hour: string]: boolean } };
  onToggleSelect: (day: string, hour: string) => void;
  addButtonsRef: React.RefObject<Record<string, HTMLButtonElement | null>>;
  onDayClick: (day: string) => void;
  targetDay: string | null;
  showAlert: (message: string) => void;
}

export default function EventList({ 
  days,
  schedule, 
  onEventUpdate, 
  onEventDelete,
  handleAddHour,
  onEventMove, 
  tagColors,
  onTagColorChange,
  selectedEvents,
  onToggleSelect,
  addButtonsRef,
  onDayClick,
  targetDay,
  showAlert
}: EventListProps) {
  const [activeDay, setActiveDay] = useState(days[0]);
  const [editingEvent, setEditingEvent] = useState<{day: string; hour: string} | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<{day: string; hour: string} | null>(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  //TODO unused variable
  editingEvent;
  targetDay;

  const {
    dragOverDay,
    handleDragOver,
    handleDragLeave,
    handleDrop: handleDropHook,
    handleDragEnd: handleDragEndHook,
    handleDragStart: handleDragStartHook
  } = useDragAndDrop({
    schedule,
    selectedEvents,
    isDraggingMultiple,
    onEventMoved: (targetDay, actionMode, eventsToMove) => {
      onEventMove(targetDay, actionMode, eventsToMove);
    },
    showAlert,
    setIsDraggingMultiple,
    setDraggedEvent
  });

  // Gestion du début du drag avec gestion supplémentaire spécifique à EventList
  const handleDragStart = useCallback((e: React.DragEvent, day: string, hour: string) => {
    handleDragStartHook(e, day, hour);
    e.currentTarget.classList.add('dragging');
  }, [handleDragStartHook]);

  // Gestion de la fin du drag avec nettoyage spécifique à EventList
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
    handleDragEndHook();
  }, [handleDragEndHook]);

  // Gestion du drop avec comportement spécifique à EventList
  const handleDrop = useCallback((e: React.DragEvent, day: string) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    handleDropHook(e, day);
  }, [handleDropHook]);

  // Gestion du clic sur un événement
  const handleEventClick = useCallback((day: string, hour: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent({ day, hour });
  }, []);

  // Effet pour gérer le clic en dehors de la liste
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setEditingEvent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Trier les événements par heure
  const sortedEvents = Object.entries(schedule[activeDay] || {})
    .sort(([aKey, aEvent], [bKey, bEvent]) => {
      const aStart = aEvent.start || aKey;
      const bStart = bEvent.start || bKey;
      return aStart.localeCompare(bStart);
    });

  return (
    <div className="event-list-container" ref={listRef}>
      <div className="tabs-container">
        {days.map(day => (
          <button
            key={day}
            className={`tab ${day === activeDay ? 'active' : ''} ${dragOverDay === day ? 'drag-over' : ''}`}
            onClick={() => {
              setActiveDay(day);
              onDayClick(day);
            }}
            onDragOver={(e) => handleDragOver(e, day, draggedEvent?.day || '')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day)}
          >
            {day.substring(0, 3)}
            {dragOverDay === day && (
              <span className="drop-indicator"></span>
            )}
          </button>
        ))}
      </div>
      
      <div 
        className="tab-content"
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, activeDay)}
      >
        {sortedEvents.length === 0 ? (
          <div className="no-events-message">
            Aucun événement prévu ce jour
          </div>
        ) : (
          <div className="events-scroll-container">
            {sortedEvents.map(([hour, event]) => (
              <div 
                key={hour} 
                className={`event-item ${selectedEvents[activeDay]?.[hour] ? 'selected' : ''} ${draggedEvent?.hour === hour && draggedEvent?.day === activeDay ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, activeDay, hour)}
                onDragEnd={handleDragEnd}
                onClick={(e) => handleEventClick(activeDay, hour, e)}
              >
                <EventCellForm
                  values={event}
                  setValues={(values) => onEventUpdate(activeDay, hour, values as EventCell)}
                  onDelete={() => onEventDelete(activeDay, hour)}
                  inlineEdit={true}
                  day={activeDay}
                  hour={hour}
                  onToggleSelect={() => onToggleSelect(activeDay, hour)}
                  tagColor={tagColors(activeDay, hour)}
                  onTagColorChange={(color) => onTagColorChange(activeDay, hour, color)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="p-2 border-b">
          <Button 
            ref={(el) => {
              if (el) {
                addButtonsRef.current[activeDay] = el;
              }
            }}
            variant="outline" 
            size="sm" 
            className="w-full mb-2 gap-2"
            onClick={() => handleAddHour(activeDay, '')}
          >
            <PlusCircle className="h-4 w-4" />
            Créer un événement
          </Button>
        </div>
      </div>
    </div>
  );
}