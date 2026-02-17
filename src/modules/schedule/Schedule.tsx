// Importations des dépendances React et des composants nécessaires
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SelectionActions } from './SelectionActions';
import './schedule.css';
import ConfirmDelete from './ConfirmDelete';
import EventList from './EventList';
import ScheduleView from './ScheduleView';
import { EventCell } from './ScheduleInterface';

// Définition des jours de la semaine
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
// Types pour typer les données de l'application
type Schedule = { [day: string]: { [hour: string]: EventCell; }; };

/**
 * Vérifie si un événement est de type "Free event"
 * @param event L'événement à vérifier
 * @returns true si l'événement est un Free event, false sinon
 */
function isFreeEvent(event: { id?: string; start?: string } | undefined): boolean {
  if (!event) return true;
  return event.start ? false : true;
}

/**
 * Génère une clé unique pour un free event
 * @param day Le jour de l'événement (pour le hachage)
 * @returns Une clé unique pour le free event
 */
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const baseKey = `${timestamp}_${random}`;

  return baseKey;
}

/**
 * Affiche l'heure de fin ou une chaîne vide si c'est un Free event
 * @param start Heure de début de l'événement
 * @param end Heure de fin de l'événement
 * @returns L'heure de fin ou une chaîne vide
 */

/**
 * Convertit une heure en minutes depuis minuit
 * @param timeStr Chaîne de temps au format HH:MM ou HH:MM AM/PM
 * @returns Le nombre de minutes depuis minuit ou null si le format est invalide
 */
function toMinutes(timeStr: string): number | null {
  if (!timeStr) return null;

  // Détection du format 12h avec AM/PM
  const time12h = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(timeStr);
  
  if (time12h) {
    // Extraction des composants de l'heure
    const [, hoursStr, minutesStr, period = ''] = time12h;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Vérification de la validité des nombres
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    // Conversion en format 24h si nécessaire
    if (period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  }
  
  // Traitement du format 24h
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Vérifie si l'heure de fin est valide par rapport à l'heure de début
 * @param startTime Heure de début au format HH:MM
 * @param endTime Heure de fin au format HH:MM
 * @returns true si l'heure de fin est valide, false sinon
 */
function isEndTimeValid(startTime: string, endTime: string): boolean {
  // Si l'une des heures n'est pas définie, on considère que c'est valide
  if (!startTime || !endTime) return true;
  
  // Conversion en minutes pour la comparaison
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  
  // En cas d'erreur de conversion, on considère que c'est valide
  if (start === null || end === null) return true;
  
  // L'heure de fin doit être strictement supérieure à l'heure de début
  return end > start;
}

export default function Schedule() {
  // Initialisation optimisée du state
  const initialSchedule = useMemo(() => 
    Object.fromEntries(days.map(day => [day, {}])), 
    []
  );
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  // Initialisation optimisée du state des événements sélectionnés
  const initialSelectedEvents = useMemo(
    () => Object.fromEntries(days.map(day => [day, {}])),
    []
  );
  const [selectedEvents, setSelectedEvents] = 
    useState<{[day: string]: {[hour: string]: boolean}}>(initialSelectedEvents);

  const [actionMode, setActionMode] = useState<'move' | 'copy' | 'delete' | null>(null);
  const [targetDay, setTargetDay] = useState<string | null>(null);

  // State pour le mode de vue
  const [viewMode, setViewMode] = useState<'schedule' | 'eventlist'>('schedule');

  // --- FOCUS MANAGEMENT ---
  // Référence pour stocker les boutons "Ajouter une heure" de chaque jour.
  const addButtonsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Réinitialiser le mode d'action quand la sélection change
  useEffect(() => {
    const hasSelection = Object.values(selectedEvents).some(day => 
      Object.values(day).some(selected => selected)
    );
    if (!hasSelection) {
      setActionMode(null);
      setTargetDay(null);
    }
  }, [selectedEvents]);
  
  // Gestion de l'ajout d'un nouvel événement
  const [newEvent, setNewEvent] = useState<{ [day: string]: EventCell }>(
    Object.fromEntries(days.map(day =>
      [day, { subject: '', start: '', end: '', id: '', tagColor: '' }]))
  );
  
  const [addingHour, setAddingHour] = useState<{ [day: string]: boolean }>(
    Object.fromEntries(days.map(day => [day, false]))
  );
  //TODO unused variable
  addingHour;
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Fonction utilitaire pour gérer les alertes
  const showAlert = useCallback((message: string) => {
    setAlertMessage(message);
    setAlertOpen(true);
  }, [setAlertMessage, setAlertOpen]);

  // Ajout d'un événement
  const handleAddHour = (day: string, subject: string = '') => {
    const { start, end } = newEvent[day];
    const eventSubject = subject || newEvent[day].subject || '';
    
    if (start && end && !isEndTimeValid(start, end)) {
      showAlert("L'heure de fin doit être postérieure à l'heure de début !");
      return;
    }
  
    // Si c'est un free event, on utilise son ID unique comme clé
    const eventId = generateEventId();
    
    // Vérifier si un événement existe déjà à cette heure
    const hasEventAtSameTime = Object.values(schedule[day] || {}).some(event => 
      event.start === start
    );
    
    // Afficher un avertissement si un événement existe à la même heure
    if (hasEventAtSameTime) {
      showAlert("Attention : Un événement existe déjà à cette heure ! L'événement a tout de même été ajouté.");
    }
  
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [eventId]: {
          subject: eventSubject,
          start: start, // Utiliser l'heure de début si fournie, sinon utiliser l'ID
          end: isFreeEvent({ id: eventId }) ? undefined : (end ? end : undefined),
          id: eventId,
          tagColor: ''
        }
      }
    }));
  
    // Réinitialiser le formulaire
    setNewEvent(prev => ({
      ...prev,
      [day]: { subject: '', start: '', end: '', id: '', tagColor: ''}
    }));
    setAddingHour(prev => ({ ...prev, [day]: false }));

    // Redonne le focus au bouton "Ajouter"
    setTimeout(() => {
      addButtonsRef.current[day]?.focus();
    }, 0);
  };

  // Modification inline - Mémoïsée avec useCallback
  const handleInlineChange = useCallback((day: string, hour: string, values: EventCell) => {
    // Vérification de la validité des heures
    if (values.start && values.end && !isEndTimeValid(values.start, values.end)) {
      showAlert("L'heure de fin doit être postérieure à l'heure de début !");
      return;
    }

    const newHourKey: string = values.start || values.id;
    const isTimeChanged = newHourKey !== hour;

    // Vérifier si un événement existe déjà à la même heure (sauf si c'est le même événement)
    const existingEventAtSameTime = Object.entries(schedule[day] || {}).find(
      ([h, event]) => h === newHourKey && event.id !== values.id
    );
    
    // Afficher un avertissement si un événement existe à la même heure
    if (existingEventAtSameTime) {
      showAlert("Attention : Un événement existe déjà à cette heure ! Un nouvel événement a été créé.");
    }

    setSchedule(prev => {
      const newSchedule = { ...prev };
      const daySchedule = { ...newSchedule[day] };

      // Créer le nouvel événement avec un nouvel ID si nécessaire
      const eventId = existingEventAtSameTime ? generateEventId() : values.id;

      const newEvent = {
        subject: values.subject,
        start: values.start,
        end: isFreeEvent(values) ? undefined : (values.end || undefined),
        id: eventId,
        tagColor: values.tagColor
      };

      // Si l'heure a changé, supprimer l'ancien événement
      if (isTimeChanged) {
        delete daySchedule[hour];
      }

      // Si un événement existe déjà à cette heure, on le conserve et on ajoute le nouveau
      if (existingEventAtSameTime) {
        daySchedule[eventId] = newEvent;
      } else {
        // Sinon, on met à jour l'événement existant
        daySchedule[newHourKey] = newEvent;
      }

      return {
        ...newSchedule,
        [day]: daySchedule
      };
    });
  }, [schedule, showAlert]);

  const [confirmDelete, setConfirmDelete] = useState<{ day: string; hour: string; open: boolean }>({ day: '', hour: '', open: false });
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showBulkDeletePopover, setShowBulkDeletePopover] = useState(false);

  const handleDeleteSchedule = (day: string, hour: string) => {
    setShowDeletePopover(true);
    setConfirmDelete({ day, hour, open: true });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.open) {
      const { day, hour } = confirmDelete;
      setSchedule(prev => {
        const newSchedule = { ...prev[day] };
        delete newSchedule[hour];
        return { ...prev, [day]: newSchedule };
      });
      setConfirmDelete({ day: '', hour: '', open: false });

      // Redonne le focus au bouton "Ajouter" du jour concerné après la suppression.
      setTimeout(() => {
        addButtonsRef.current[confirmDelete.day]?.focus();
      }, 0);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ day: '', hour: '', open: false });
    setShowDeletePopover(false);
  };

  const handleBulkDelete = () => {
    setActionMode('delete');
    setShowBulkDeletePopover(true);
  };

  const handleConfirmBulkDelete = () => {
    deleteSelectedEvents();
    setShowBulkDeletePopover(false);
    setActionMode(null);
  };

  const handleCancelBulkDelete = () => {
    setShowBulkDeletePopover(false);
    setActionMode(null);
  };

  // Toggle event selection
  const toggleEventSelection = (day: string, hour: string) => {
    setSelectedEvents(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: !prev[day][hour]
      }
    }));
  };

  // Compte le nombre d'événements sélectionnés
  const countSelectedEvents = useCallback(() => {
    return Object.values(selectedEvents).reduce(
      (total, day) => total + Object.values(day).filter(selected => selected).length,
      0
    );
  }, [selectedEvents]);

  // Réinitialise la sélection
  const clearSelection = () => {
    setSelectedEvents(Object.fromEntries(days.map(day => [day, {}])));
    setActionMode(null);
    setTargetDay(null);
  };

  // Supprime les événements sélectionnés
  const deleteSelectedEvents = () => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      Object.entries(selectedEvents).forEach(([day, hours]) => {
        newSchedule[day] = { ...prev[day] };
        Object.keys(hours).forEach(hour => {
          if (hours[hour]) {
            delete newSchedule[day][hour];
          }
        });
      });
      return newSchedule;
    });
    clearSelection();
  };

  // Déplace ou copie les événements sélectionnés vers un jour cible
  const moveOrCopySelectedEvents = 
  (targetDay: string, actionMode: string, eventsToMove: {day: string; hour: string; event: EventCell}[]) => {
    // Si aucun événement à déplacer/copier (ou si c'est le même jour en mode déplacement), on ne fait rien
    if (eventsToMove.length === 0) {
      clearSelection();
      return;
    }

    // Vérifier s'il y a des conflits d'horaire
    const hasConflicts = eventsToMove.some(({ event }) => {
      const hourKey = isFreeEvent(event) ? event.id : event.start;
      return schedule[targetDay]?.[hourKey] !== undefined;
    });

    // Avertir l'utilisateur des conflits potentiels
    if (hasConflicts) {
      showAlert("Attention : Un ou plusieurs événements existent déjà aux mêmes heures. Les événements en conflit ont été dupliqués avec de nouveaux identifiants.");
    }

    setSchedule(prev => {
      const newSchedule = { ...prev };
      
      // Si c'est un déplacement, supprimer d'abord les anciens événements
      if (actionMode === 'move') {
        eventsToMove.forEach(({day, hour}) => {
          if (newSchedule[day]?.[hour]) {
            const { [hour]: _, ...rest } = newSchedule[day];
            newSchedule[day] = rest;
          }
        });
      }
      
      // Ajouter les événements au jour cible
      eventsToMove.forEach(({ event }) => {
        const hourKey = isFreeEvent(event) ? event.id : event.start;
        
        // Créer un nouvel événement avec un ID unique si nécessaire
        const newEvent = {
          ...event,
          start: hourKey,
          // Générer un nouvel ID si c'est une copie ou s'il y a un conflit
          id: (actionMode === 'copy' || hasConflicts) 
            ? generateEventId() 
            : event.id
        };
        
        // Utiliser l'ID comme clé pour éviter les conflits
        const eventKey = newEvent.id;
        
        // Ajouter l'événement au jour cible
        newSchedule[targetDay] = {
          ...newSchedule[targetDay],
          [eventKey]: newEvent
        };
      });
      
      return newSchedule;
    });
    
    clearSelection();
  };

  // Gère le clic sur un jour cible
  const handleDayClick = (day: string) => {
    // Ne rien faire si on est en mode suppression
    if (actionMode === 'delete') {
      return;
    }
    
    if (actionMode && targetDay === null) {
      setTargetDay(day);
      if (actionMode === 'move' || actionMode === 'copy') {

        const eventsToMove: {day: string; hour: string; event: EventCell}[] = [];
        Object.entries(selectedEvents).forEach(([fromDay, hours]) => {
          // Si on essaie de déplacer/copier vers le même jour, on ne fait rien
          if (actionMode === 'move' && fromDay === day) {
            clearSelection();
            return;
          }
          // Récupérer les événements sélectionnés
          // TODO : utiliser id plutot que hour pour
          // identifier les element a deplacer
          Object.entries(hours).forEach(([hour, isSelected]) => {
            if (isSelected && schedule[fromDay]?.[hour]) {
              eventsToMove.push({
                day: fromDay,
                hour: hour,
                event: schedule[fromDay][hour]
              });
            }
          });
        });
        moveOrCopySelectedEvents(day, actionMode, eventsToMove);
      }
    } else {
      setTargetDay(null);
    }
  };

  // Fonction pour trier les heures
  const sortHours = (day: string) => {
    return Object.keys(schedule[day])
      .filter((hourKey: string) => {
        const event = schedule[day][hourKey];
        if (isFreeEvent(event) || !event.end) return true;
        const startMin = toMinutes(event.start);
        const endMin = toMinutes(event.end);
        if (startMin === null || endMin === null) return true;
        return endMin > startMin;
      })
      .sort((a: string, b: string) => {
        const aEvent = schedule[day][a];
        const bEvent = schedule[day][b];
        const aMin = toMinutes(aEvent.start);
        const bMin = toMinutes(bEvent.start);
        
        if (aMin === null && bMin === null) return 0;
        if (aMin === null) return 1;
        if (bMin === null) return -1;
        return aMin - bMin;
      });
  };

  //inserer la nouvelle couleur dans eventcell
  const handleTagColorChange = (day: string, hour: string, color: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: {
          ...prev[day][hour],
          tagColor: color
        }
      }
    }));
  };

  const getTagColor = (day: string, hour: string) => {
    return schedule[day][hour].tagColor;
  }

  const selectedCount = countSelectedEvents();
  const isAnyActionActive = actionMode !== null;

  return (
    <div className="schedule-container">
      {confirmDelete.open && (
        <ConfirmDelete
          message="Voulez-vous vraiment supprimer cet événement ?"
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          open={showDeletePopover}
          onOpenChange={setShowDeletePopover}
        >
          <div style={{ display: 'none' }} />
        </ConfirmDelete>
      )}

      <ConfirmDelete
        message="Voulez-vous vraiment supprimer les événements sélectionnés ?"
        onCancel={handleCancelBulkDelete}
        onConfirm={handleConfirmBulkDelete}
        open={showBulkDeletePopover && actionMode === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkDeletePopover(false);
            setActionMode(null);
          } else {
            setShowBulkDeletePopover(true);
          }
        }}
      >
        <div style={{ display: 'none' }} />
      </ConfirmDelete>
      
      <div className="schedule-header">
        <h2>Emploi du temps</h2>
        <SelectionActions 
          selectedCount={selectedCount}
          actionMode={actionMode}
          onActionModeChange={setActionMode}
          onClearSelection={clearSelection}
          onDeleteSelected={handleBulkDelete}
        />
      </div>
      <div className="view-mode-tabs">
        <button
          className={`tab ${viewMode === 'schedule' ? 'active' : ''}`}
          onClick={() => setViewMode('schedule')}
        >
          Schedule
        </button>
        <button
          className={`tab ${viewMode === 'eventlist' ? 'active' : ''}`}
          onClick={() => setViewMode('eventlist')}
        >
          Liste des événements
        </button>
      </div>
      
      {viewMode === 'schedule' ? (
        <ScheduleView
          showAlert={showAlert}
          days={days}
          schedule={schedule}
          selectedEvents={selectedEvents}
          actionMode={actionMode}
          targetDay={targetDay}
          isAnyActionActive={isAnyActionActive}
          onDayClick={handleDayClick}
          onInlineChange={handleInlineChange}
          onDeleteSchedule={handleDeleteSchedule}
          toggleEventSelection={toggleEventSelection}
          sortHours={sortHours}
          tagColors={getTagColor}
          onTagColorChange={handleTagColorChange}
          handleAddHour={handleAddHour}
          addButtonsRef={addButtonsRef}
          onEventMoved={moveOrCopySelectedEvents}
        />
       ) : (
        <EventList
          days={days}
          handleAddHour={handleAddHour}
          schedule={schedule}
          onEventUpdate={handleInlineChange}
          onEventDelete={handleDeleteSchedule}
          tagColors={getTagColor}
          onTagColorChange={handleTagColorChange}
          selectedEvents={selectedEvents}
          onToggleSelect={toggleEventSelection}
          addButtonsRef={addButtonsRef}
          onDayClick={handleDayClick}
          targetDay={targetDay}
          onEventMove={moveOrCopySelectedEvents}
          showAlert={showAlert}
        />
      )}
      <Popover open={alertOpen} onOpenChange={setAlertOpen}>
        <PopoverTrigger asChild>
          <button style={{ display: "none" }} aria-hidden />
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="max-w-xs"
          style={{ minWidth: 0, maxWidth: 220, padding: 12 }}
        >
          <div className="font-semibold mb-1" style={{ fontSize: 15 }}>Attention</div>
          <div className="text-center" style={{ fontSize: 14 }}>{alertMessage}</div>
        </PopoverContent>
      </Popover>
    </div>
  );
}