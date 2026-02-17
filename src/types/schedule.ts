// Types pour les événements de l'emploi du temps
export interface EventCell {
  subject: string;
  start: string;
  end?: string;
  id?: string;
  color?: string;
  // Ajoutez d'autres propriétés d'événement au besoin
}

// Type pour un événement avec son emplacement dans la grille
export interface GridEvent extends EventCell {
  day: string;
  hour: string;
  isSelected?: boolean;
}

// Type pour les options de configuration de la grille
export interface ScheduleGridOptions {
  startHour: number;
  endHour: number;
  hourHeight: number;
  days: string[];
  // Ajoutez d'autres options de configuration au besoin
}
