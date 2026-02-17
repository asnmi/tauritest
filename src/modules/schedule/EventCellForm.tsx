import React, { useRef, useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import TimePicker from "../timepicker/Timepicker";
import './EventCellForm.css';
import Tag from "./Tag";

// Types pour typer les données de l'application
type EventCell = { subject: string; start: string; end?: string; id?: string };

type EventCellFormProps = {
  values: EventCell;
  setValues: (v: EventCell) => void;
  onValidate?: (subject: string) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isAdd?: boolean;
  // Pour l'édition inline
  inlineEdit?: boolean;
  isEditing?: boolean;
  setEditingEvent?: (event: { day: string; hour: string } | null) => void;
  day?: string;
  hour?: string;
  onToggleSelect?: () => void;
  tagColor?: string;
  onTagColorChange?: (color: string) => void;
  summaryMode?: (isSummary: boolean, day: string, hour: string) => void;
};

// Fonction utilitaire pour déterminer si un événement est un créneau libre
function isFreeEvent(event: { id?: string; start?: string } | undefined): boolean {
  return !event?.start || event.start.trim() === '';
}

function displayEnd(event: { id?: string; start?: string; end?: string } | undefined) {
  return isFreeEvent(event) ? "" : (event?.end || "");
}

function getUpdatedEvent(values: EventCell, field: keyof EventCell, value: string): EventCell {
  function toMinutes(timeStr: string): number | null {
    if (!timeStr) return null;
    const time12h = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(timeStr);
    if (time12h) {
      const [, hoursStr, minutesStr, period = ''] = time12h;
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (isNaN(hours) || isNaN(minutes)) return null;
      if (period.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }
  function isEndTimeValid(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return true;
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (start === null || end === null) return true;
    return end > start;
  }
  if (field === "start") {
    const newValues = { ...values, start: value };
    if (values.end && !isEndTimeValid(value, values.end)) {
      newValues.end = "";
    }
    return newValues;
  } else if (field === "end") {
    if (!value || value === values.start) {
      return { ...values, end: "" };
    }
    if (values.start && !isEndTimeValid(values.start, value)) {
      return values;
    }
  }
  return { ...values, [field]: value };
}

const EventCellForm = React.memo(({
  values,
  setValues,
  onValidate,
  onDelete,
  inlineEdit = false,
  isEditing = false,
  setEditingEvent,
  day,
  hour,
  tagColor,
  onTagColorChange,
  summaryMode,
}: EventCellFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValues, setLocalValues] = useState<EventCell>({ ...values });
  const [localSubject, setLocalSubject] = useState(values.subject);
  const [isEndTimeValid, setIsEndTimeValid] = useState(false);

  useEffect(() => {
    setLocalValues({ ...values });
    setLocalSubject(values.subject);
  }, [values]);

  useEffect(() => {
    setLocalSubject(localValues.subject);
  }, [localValues.subject]);

  useEffect(() => {
    const hasStartTime = localValues.start && localValues.start.trim() !== '';
    setIsEndTimeValid(!hasStartTime);
  }, [localValues.start]);

  const handleSave = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const finalValues = {
      ...localValues,
      subject: localSubject.trim() || '',
    };
    setValues(finalValues);
    onValidate?.(finalValues.subject);
    if (day && hour) {
      summaryMode?.(true, day, hour);
    }
  }, [localValues, localSubject, onValidate, setValues, day, hour, summaryMode]);

  const handleFieldChange = useCallback((field: keyof EventCell, value: string) => {
    setLocalValues(prev => {
      const updated = getUpdatedEvent(prev, field, value);
      
      // Si le champ modifié est 'start', on met à jour l'état de validation du temps de fin
      if (field === 'start') {
        const hasStartTime = value && value.trim() !== '';
        setIsEndTimeValid(!hasStartTime);
        
        // Si on efface l'heure de début, on efface aussi l'heure de fin
        if (!hasStartTime) {
          updated.end = '';
        }
      }
      
      if (field === 'subject') {
        setLocalSubject(value);
      }
      return updated;
    });
  }, []);

  const handleCancel = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLocalValues({ ...values });
    setLocalSubject(values.subject);
    if (day && hour) {
      summaryMode?.(true, day, hour);
    }
  }, [values, day, hour, summaryMode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  }, [handleSave]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Ne pas déclencher l'enregistrement si le focus passe sur un élément du formulaire
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    
    // Si on est en mode inline edit, on enregistre automatiquement
    if (inlineEdit) {
      handleSave();
    }
  }, [handleSave]);

  const subjectInput = inlineEdit && day && hour && setEditingEvent ? (
    <Popover
      open={isEditing}
      onOpenChange={open => {
        if (!open) handleSave();
        setEditingEvent(open ? { day, hour } : null);
      }}
    >
      <PopoverTrigger asChild>
        <span
          className="event-subject"
          style={{ cursor: "pointer", minWidth: 80, display: "inline-block" }}
          onClick={() => setEditingEvent({ day, hour })}
        >
          {values.subject || <span style={{ color: "#aaa" }}>Sans titre</span>}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        style={{ minWidth: 180 }}
        onBlur={handleBlur}
      >
        <Input
          value={localSubject}
          onChange={e => {
            const newValue = e.target.value;
            setLocalSubject(newValue);
            handleFieldChange('subject', newValue);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          placeholder="Cours ou activité"
          className="schedule-input"
        />
      </PopoverContent>
    </Popover>
  ) : (
    <Input
      type="text"
      ref={inputRef}
      value={localSubject}
      onChange={e => {
        const newValue = e.target.value;
        setLocalSubject(newValue);
        handleFieldChange('subject', newValue);
      }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="Cours ou activité"
      className="schedule-input"
    />
  );

  return (
    <div className="event-cell-form">
          <div className="event-cell-header">
              {inlineEdit && (
                <>
                  {onTagColorChange && (
                    <Tag 
                      initialColor={tagColor}
                      onColorChange={onTagColorChange}
                      className="event-cell-tag"
                    />
                  )}
                </>
              )}
            {onDelete && (
              <button 
                className="delete-btn"
                title="Supprimer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <span role="img" aria-label="Supprimer">🗑️</span>
              </button>
            )}
          </div>
          {subjectInput}
          <div className="schedule-time-range">
            <TimePicker
              key="start-time"
              value={localValues.start ?? ''}
              onChange={v => handleFieldChange('start', v)}
              placeholder=""
            />
            <span>-</span>
            <TimePicker
              key="end-time"
              value={displayEnd(localValues) ?? ''}
              onChange={v => handleFieldChange('end', v)}
              disabled={isEndTimeValid}
              placeholder=""
              startTime={localValues.start}
            />
          </div>
          <div className="validation-buttons">
            <button 
              className="cancel-button"
              onClick={(e) => {
                handleCancel(e);
              }}
            >
              Annuler
            </button>
            <button 
              className="save-button"
              onClick={(e) => {
                handleSave(e);
                if (inlineEdit && setEditingEvent) setEditingEvent(null);
              }}
            >
              Valider
            </button>
          </div>
    </div>
  );
});

export default EventCellForm;