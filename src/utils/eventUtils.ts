import { EventCell } from "@/types/schedule";

// Préfixe pour les événements libres
export const FREE_EVENT_ID_PREFIX = 'free-event';

/**
 * Vérifie si un événement est un événement libre
 */
export function isFreeEvent(event: { id?: string; start?: string } | undefined): boolean {
  if (!event) return true;
  return event.start?.startsWith(FREE_EVENT_ID_PREFIX) || false;
}

/**
 * Affiche l'heure de fin d'un événement
 */
export function displayEnd(event: { id?: string; start?: string; end?: string } | undefined): string {
  return isFreeEvent(event) ? "" : (event?.end || "");
}

/**
 * Convertit une chaîne de temps en minutes
 */
function toMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  
  // Gestion du format 12h (AM/PM)
  const time12h = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(timeStr);
  if (time12h) {
    const [, hoursStr, minutesStr, period = ''] = time12h;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    // Conversion en format 24h
    if (period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  }
  
  // Gestion du format 24h
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  return hours * 60 + minutes;
}

/**
 * Vérifie si l'heure de fin est valide par rapport à l'heure de début
 */
function isEndTimeValid(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true;
  
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  
  if (start === null || end === null) return true;
  return end > start;
}

/**
 * Met à jour un événement avec une nouvelle valeur pour un champ donné
 */
export function getUpdatedEvent(values: EventCell, field: keyof EventCell, value: string): EventCell {
  // Mise à jour de l'heure de début
  if (field === "start") {
    const newValues = { ...values, start: value };
    
    // Réinitialiser l'heure de fin si elle n'est plus valide
    if (values.end && !isEndTimeValid(value, values.end)) {
      newValues.end = "";
    }
    
    return newValues;
  } 
  
  // Mise à jour de l'heure de fin
  if (field === "end") {
    // Si l'heure de fin est vide ou égale à l'heure de début, on la vide
    if (!value || value === values.start) {
      return { ...values, end: "" };
    }
    
    // Vérifier que l'heure de fin est valide par rapport à l'heure de début
    if (values.start && !isEndTimeValid(values.start, value)) {
      return values;
    }
  }
  
  // Pour tous les autres champs, on met simplement à jour la valeur
  return { ...values, [field]: value };
}

/**
 * Génère un ID unique pour un nouvel événement
 */
export function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vérifie si deux événements se chevauchent
 */
export function eventsOverlap(event1: EventCell, event2: EventCell): boolean {
  if (!event1.start || !event2.start) return false;
  
  const start1 = toMinutes(event1.start);
  const end1 = event1.end ? toMinutes(event1.end) : null;
  const start2 = toMinutes(event2.start);
  const end2 = event2.end ? toMinutes(event2.end) : null;
  
  if (start1 === null || start2 === null) return false;
  
  // Si l'un des événements n'a pas d'heure de fin, on considère qu'il dure 1h
  const end1Val = end1 || start1 + 60;
  const end2Val = end2 || start2 + 60;
  
  return start1 < end2Val && end1Val > start2;
}
