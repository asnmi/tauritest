import React from 'react';
import './EventSummary.css';

type EventSummaryProps = {
  subject: string;
  start: string;
  end?: string;
  tagColor?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
};

export const EventSummary: React.FC<EventSummaryProps> = ({
  subject,
  start,
  end,
  tagColor,
  isSelected,
  onToggleSelect
}) => {
  return (
    <div 
      className={`event-summary ${isSelected ? 'selected' : ''}`}
      style={tagColor ? { 
        backgroundColor: `${tagColor}20`, 
        borderLeft: `3px solid ${tagColor}`
      } : {}}
    >{onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="event-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <span className="event-subject">{subject}</span>
      <span className="event-time">{start} - {end}</span>
    </div>
  );
};

export default EventSummary;
