import { useState, useRef, useCallback } from 'react';
import { EventCell } from './ScheduleInterface';

interface UseDragAndDropProps {
  schedule: { [day: string]: { [hour: string]: EventCell } };
  selectedEvents: { [day: string]: { [hour: string]: boolean } };
  isDraggingMultiple: boolean;
  onEventMoved: (targetDay: string, actionMode: string, eventsToMove: {day: string; hour: string; event: EventCell}[]) => void;
  showAlert: (message: string) => void;
  setIsDraggingMultiple: (value: boolean) => void;
  setDraggedEvent: (value: {day: string; hour: string} | null) => void;
}

export const useDragAndDrop = ({
  schedule,
  selectedEvents,
  isDraggingMultiple,
  onEventMoved,
  showAlert,
  setIsDraggingMultiple,
  setDraggedEvent
}: UseDragAndDropProps) => {
  showAlert;
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const lastHoveredDay = useRef<string | null>(null);

  // Gestion du survol pendant le drag
  const handleDragOver = useCallback((e: React.DragEvent, day: string, sourceDay: string) => {
    e.preventDefault();
    
    // Ne pas appliquer le style de survol si c'est le jour d'origine
    if (day === sourceDay) return;
    
    // Mettre à jour le jour survolé après un court délai
    if (hoverTimer.current === null) {
      hoverTimer.current = window.setTimeout(() => {
        setDragOverDay(day);
        lastHoveredDay.current = day;
      }, 30);
    }
  }, []);

  // Gestion de la sortie de la zone de drop
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    
    // Vérifier si la souris est toujours sur un jour
    if (!target.closest('.schedule-day') || !e.currentTarget.contains(e.relatedTarget as Node)) {
      // Nettoyer tout timer en attente
      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      setDragOverDay(null);
      lastHoveredDay.current = null;
    }
  }, []);

  // Gestion du drop
  const handleDrop = useCallback((e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    
    // Nettoyer les timers
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    
    setDragOverDay(null);
    document.body.classList.remove('dragging');
    
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    
    try {
      const { day: sourceDay, hour: sourceHour } = JSON.parse(data);
      
      // Ne rien faire si le jour cible est le même que le jour source
      if (sourceDay === targetDay) return;
      
      const eventsToMove: {day: string; hour: string; event: EventCell}[] = [];
      
      if (isDraggingMultiple) {
        // Ajouter tous les événements sélectionnés au déplacement
        Object.entries(selectedEvents).forEach(([day, hours]) => {
          Object.entries(hours).forEach(([hour, isSelected]) => {
            if (isSelected && schedule[day]?.[hour]) {
              eventsToMove.push({
                day,
                hour,
                event: schedule[day][hour]
              });
            }
          });
        });
      } else {
        // Comportement normal pour un seul événement
        if (schedule[sourceDay]?.[sourceHour]) {
          eventsToMove.push({
            day: sourceDay,
            hour: sourceHour,
            event: schedule[sourceDay][sourceHour]
          });
        }
      }
      
      // Vérifier s'il y a des conflits d'horaire
      const targetDayEvents = Object.values(schedule[targetDay] || {});
      const hasConflicts = eventsToMove.some(({ event }) => {
        const hourKey = event.start || event.id;
        return targetDayEvents.some(e => (e.start || e.id) === hourKey);
      });
      
      // Avertir l'utilisateur des conflits potentiels
      if (hasConflicts) {
        // Le message d'alerte est commenté selon la dernière modification
        // showAlert("Attention : Un ou plusieurs événements existent déjà aux mêmes heures. Les événements en conflit ont été dupliqués avec de nouveaux identifiants.");
      }
      
      // Appeler le callback parent pour le déplacement
      if (onEventMoved && eventsToMove.length > 0) {
        onEventMoved(targetDay, 'move', eventsToMove);
      }
    } catch (error) {
      console.error('Erreur lors du déplacement de l\'événement:', error);
    } finally {
      setDraggedEvent(null);
      setIsDraggingMultiple(false);
    }
  }, [schedule, selectedEvents, isDraggingMultiple, onEventMoved, setIsDraggingMultiple, setDraggedEvent]);

  // Gestion de la fin du drag
  const handleDragEnd = useCallback(() => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setDragOverDay(null);
    setDraggedEvent(null);
    setIsDraggingMultiple(false);
  }, [setDraggedEvent, setIsDraggingMultiple]);

  // Gestion du début du drag
  const handleDragStart = useCallback((e: React.DragEvent, day: string, hour: string) => {
    // Vérifier si on a des événements sélectionnés
    const hasSelectedEvents = Object.values(selectedEvents).some(dayEvents => 
      Object.values(dayEvents).some(selected => selected)
    );
    
    if (hasSelectedEvents && !selectedEvents[day]?.[hour]) {
      // Si on a des événements sélectionnés mais pas celui-ci, annuler le drag
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('text/plain', JSON.stringify({ day, hour }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEvent({ day, hour });
    setIsDraggingMultiple(hasSelectedEvents);
    document.body.classList.add('dragging');
  }, [selectedEvents, setDraggedEvent, setIsDraggingMultiple]);

  return {
    dragOverDay,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleDragStart
  };
};
