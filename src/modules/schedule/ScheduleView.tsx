import React, { useState, RefObject, useCallback } from 'react';
import EventCellForm from './EventCellForm';
import { EventCell } from './ScheduleInterface';
import './scheduleview.css';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDragAndDrop } from './useDragAndDrop';
import EventSummary from './EventSummary';

// Types identical to parent component props
interface ScheduleViewProps {
  days: string[];
  schedule: { [day: string]: { [hour: string]: EventCell } };
  selectedEvents: { [day: string]: { [hour: string]: boolean } };
  actionMode: 'move' | 'copy' | 'delete' | null;
  targetDay: string | null;
  isAnyActionActive: boolean;
  onDayClick: (day: string) => void;
  onInlineChange: (day: string, hour: string, values: EventCell) => void;
  onDeleteSchedule: (day: string, hour: string) => void;
  toggleEventSelection: (day: string, hour: string) => void;
  sortHours: (day: string) => string[];
  tagColors: (day: string, hour: string) => string;
  onTagColorChange: (day: string, hour: string, color: string) => void;
  handleAddHour: (day: string, subject: string) => void;
  addButtonsRef: RefObject<Record<string, HTMLButtonElement | null>>;
  onEventMoved: (targetDay: string, actionMode: string, eventsToMove: {day: string; hour: string; event: EventCell}[]) => void;
  showAlert: (message: string) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  days,
  schedule,
  selectedEvents,
  actionMode,
  targetDay,
  isAnyActionActive,
  onDayClick,
  onInlineChange,
  onDeleteSchedule,
  toggleEventSelection,
  sortHours,
  tagColors,
  onTagColorChange,
  handleAddHour,
  addButtonsRef,
  onEventMoved,
  showAlert,
}) => {
  const [draggedEvent, setDraggedEvent] = useState<{day: string; hour: string} | null>(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const [summaryStates, setSummaryStates] = useState<Record<string, boolean>>({});
  
  const {
    dragOverDay,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleDragStart
  } = useDragAndDrop({
    schedule,
    selectedEvents,
    isDraggingMultiple,
    onEventMoved,
    showAlert,
    setIsDraggingMultiple,
    setDraggedEvent
  });

  const toggleView = useCallback((day: string, hour: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${day}-${hour}`;
    setSummaryStates(prev => ({
      ...prev,
      [key]: !(prev[key] ?? true) // Par défaut à true si non défini, puis on inverse
    }));
  }, []);

  const getIsSummary = useCallback((day: string, hour: string) => {
    const key = `${day}-${hour}`;
    return summaryStates[key] ?? true; // Par défaut à true si non défini
  }, [summaryStates]);

  const setSummaryMode = useCallback((isSummary: boolean, day: string, hour: string) => {
    const key = `${day}-${hour}`;
    setSummaryStates(prev => ({
      ...prev,
      [key]: isSummary
    }));
  }, []);

  return (
    <div className="schedule-view">
      <div className="schedule-days-row">
        {days.map((day) => {
          const isTargetDay = targetDay === day;
          const dayClassNames = [
            'schedule-day',
            isTargetDay ? 'target-day' : '',
            actionMode === 'copy' || actionMode === 'move' ? 'action-mode' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={day}
              className={`${dayClassNames} ${dragOverDay === day ? 'drag-over' : ''}`}
              onClick={() => isAnyActionActive && onDayClick(day)}
              onDragOver={(e) => handleDragOver(e, day, draggedEvent?.day || '')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="schedule-th-day">{day}</div>
              <table className="schedule-table">
                <tbody>
                  {Object.keys(schedule[day]).length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        style={{ textAlign: 'center', color: '#888', padding: '16px 0' }}
                      >
                        <div className="no-event-message">Aucun événement ce jour</div>
                      </td>
                    </tr>
                  ) : (
                    sortHours(day).map((hour) => (
                      <>
                      {getIsSummary(day, hour) ? (
                        <tr 
                        key={`${day}-${hour}`}
                        draggable={!isAnyActionActive}
                        onDragStart={(e) => handleDragStart(e, day, hour)}
                        onDragEnd={handleDragEnd}
                        className="event-row"
                      >
                        <td 
                        className={`event-cell-form ${!!selectedEvents[day]?.[hour] ? 'selected' : ''}`} 
                        onClick={(e) => toggleView(day, hour, e)}
                        style={{ cursor: 'pointer' }}
                        >
                        <EventSummary
                          subject={schedule[day][hour].subject || 'Sans titre'}
                          start={schedule[day][hour].start || ''}
                          end={schedule[day][hour].end}
                          tagColor={tagColors(day, hour)}
                          isSelected={!!selectedEvents[day]?.[hour]}
                          onToggleSelect={() => toggleEventSelection(day, hour)}
                          />
                        </td>
                        </tr>
                      ) : (
                        <tr 
                        key={`${day}-${hour}`}
                        className="event-row"
                      >
                        <td className="schedule-td-cell">
                          <EventCellForm
                            values={schedule[day][hour]}
                            setValues={(values) => onInlineChange(day, hour, values as EventCell)}
                            onDelete={() => onDeleteSchedule(day, hour)}
                            inlineEdit={true}
                            day={day}
                            hour={hour}
                            onToggleSelect={() => toggleEventSelection(day, hour)}
                            tagColor={tagColors(day, hour)}
                            onTagColorChange={(color) => onTagColorChange(day, hour, color)}
                            summaryMode={setSummaryMode}
                          />
                        </td>
                      </tr>)}
                      </>
                    ))
                  )}
                </tbody>
              </table>
              <div className="schedule-add-hour">
                {!isAnyActionActive && (
                  <Button 
                  ref={(el) => {
                    if (el) {
                      addButtonsRef.current[day] = el;
                    }
                  }}
                  variant="outline" 
                  size="sm" 
                  className="w-full mb-2 gap-2"
                  onClick={() => handleAddHour(day, '')}
                >
                  <PlusCircle className="h-4 w-4" />
                  Créer un événement
                </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
