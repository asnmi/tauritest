import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, JSX } from "react";
import "./timepicker.css";
import { Clock, Clock12 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export type TimeValue = `${string}:${string}` | '';

type TimeFormat = '12h' | '24h';

// Helper: Convertit une heure du format 12h vers 24h
const to24Hour = (hour12: string, ampm: string): string => {
  if (!hour12) return '';
  let hour = parseInt(hour12, 10);
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0; // 12 AM est 00h en 24h
  return hour.toString().padStart(2, '0');
};

// Helper: Convertit une heure du format 24h vers 12h avec AM/PM
const to12Hour = (hour24: string): { hour: string; ampm: string } => {
  if (!hour24) return { hour: '', ampm: '' };

  let hour = parseInt(hour24, 10);

  let ampm = '';
  //if hour is between 0-12 ampm= am, if betwween 13-23 ampm= pm
  if(hour >= 0 && hour <= 12){
    ampm = 'AM';
  }else if(hour >= 13 && hour <= 23){
    ampm = 'PM';
  }
  
  hour = hour % 12;
  if (hour === 0) hour = 12; // 00h ou 12h en 24h devient 12 en 12h
  return { hour: hour.toString().padStart(2, '0'), ampm };
};

// Formate l'heure pour l'affichage selon le format spécifié (12h ou 24h)
const formatTimeDisplay = (hour24: string, minute: string, format: TimeFormat): string => {
  if (!hour24 || !minute) return '';

  if (format === '12h') {
    const { hour, ampm } = to12Hour(hour24);
    return `${hour}:${minute} ${ampm}`;
  } else {
    return `${hour24}:${minute}`;
  }
};

// Heures pour le format 12h (12, 01, ..., 11)
const HOURS_12_DISPLAY = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
// Heures pour le format 24h (00 à 23)
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
// Minutes par incréments de 5 (00, 05, ..., 55)
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

interface TimePickerProps {
  value: string;
  onChange: (value: TimeValue) => void;
  placeholder?: string;
  timeFormat?: TimeFormat;
  allowFormatChange?: boolean;
  disabled?: boolean;
  startTime?: string;
  endTime?: string;
  maxTime?: { hour: string; minute: string; ampm?: string; };
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  closeOnClickOutside?: boolean;
  formref?: React.RefObject<HTMLDivElement | null>;
}

interface TimePickerRef {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const TimePicker = forwardRef<TimePickerRef, TimePickerProps>(({
  value = '',
  onChange,
  placeholder = "Sélectionner une heure",
  timeFormat = '12h',
  allowFormatChange = true,
  disabled = false,
  startTime,
  endTime,
  className = '',
  onBlur,
  closeOnClickOutside = true,
  formref
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<TimeFormat>(timeFormat);

  // Calculate dynamic minTime based on startTime if provided
  const minTime = useMemo(() => {
    // If no startTime, no minTime constraint
    if (!startTime) return undefined;
    
    // Conversion de l'heure de début en format 24h
    let hour24 = startTime;
    let minute = '00';
    
    // Traitement du format 12h AM/PM
    if (startTime.includes(' ')) {
      const [timePart, period] = startTime.split(' ');
      const [h, m] = timePart.split(':');
      let hNum = parseInt(h, 10);
      
      // Conversion en format 24h
      if (period === 'PM' && hNum < 12) {
        hNum += 12;
      } else if (period === 'AM' && hNum === 12) {
        hNum = 0;
      }
      
      hour24 = hNum.toString().padStart(2, '0');
      minute = m || '00';
    } 
    // Traitement du format 24h
    else if (startTime.includes(':')) {
      [hour24, minute = '00'] = startTime.split(':');
    }
    
    // Calcul de l'heure minimale (début + 1 minute)
    let minHour = parseInt(hour24, 10);
    let minMinute = parseInt(minute, 10) + 1;
    
    // Gestion du dépassement des minutes
    if (minMinute >= 60) {
      minMinute = 0;
      minHour = (minHour + 1) % 24;
    }
    
    // Conversion en format 12h pour l'affichage
    const ampm = minHour >= 12 ? 'PM' : 'AM';
    let displayHour = minHour % 12 || 12;
    
    return {
      hour: displayHour.toString().padStart(2, '0'),
      minute: minMinute.toString().padStart(2, '0'),
      ampm
    };
  }, [startTime]);

  // Calculate dynamic maxTime based on endTime if provided
  const maxTime = useMemo(() => {
    if (!endTime) return undefined;
    
    // Conversion de l'heure de fin en format 24h
    let hour24 = endTime;
    let minute = '00';
    
    // Traitement du format 12h AM/PM
    if (endTime.includes(' ')) {
      const [timePart, period] = endTime.split(' ');
      const [h, m] = timePart.split(':');
      let hNum = parseInt(h, 10);
      
      // Conversion en format 24h
      if (period === 'PM' && hNum < 12) {
        hNum += 12;
      } else if (period === 'AM' && hNum === 12) {
        hNum = 0;
      }
      
      hour24 = hNum.toString().padStart(2, '0');
      minute = m || '00';
    } 
    // Traitement du format 24h
    else if (endTime.includes(':')) {
      [hour24, minute = '00'] = endTime.split(':');
    }
    
    // Calcul de l'heure maximale (fin - 1 minute)
    let maxHour = parseInt(hour24, 10);
    let maxMinute = parseInt(minute, 10) - 1;
    
    // Gestion du dépassement des minutes
    if (maxMinute < 0) {
      maxMinute = 59;
      maxHour = (maxHour - 1 + 24) % 24; // Gestion du passage à l'heure précédente
    }
    
    // Conversion en format 12h pour l'affichage
    const ampm = maxHour >= 12 ? 'PM' : 'AM';
    let displayHour = maxHour % 12 || 12;
    
    return {
      hour: displayHour.toString().padStart(2, '0'),
      minute: maxMinute.toString().padStart(2, '0'),
      ampm
    };
  }, [endTime]);

  const [currentHour24, setCurrentHour24] = useState('');
  const [currentMinute, setCurrentMinute] = useState('');
  const [currentAmPm, setCurrentAmPm] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value) {
      const [hour24, minute] = value.split(':');
      setCurrentHour24(hour24);
      setCurrentMinute(minute);
      if(format === '12h'){
        setCurrentAmPm(to12Hour(hour24).ampm);
      }
      
    } else {
      setCurrentHour24('');
      setCurrentMinute('');
      setCurrentAmPm('');
    }
  }, [value]);

  useEffect(() => {
    setFormat(timeFormat);
  }, [timeFormat]);

  useImperativeHandle(ref, () => ({
    open: () => !disabled && setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => !disabled && setIsOpen(prev => !prev)
  }));

  const isHourDisabled = useCallback((hour24: string, ampm: string | null = null): boolean => {
    let hourToCheck24 = hour24;
    // Si ampm est fourni, cela signifie que nous vérifions une heure 12h spécifique (e.g., '01 AM')
    if (ampm && format === '12h') {
        hourToCheck24 = to24Hour(hour24, ampm);
    }

    const minHourNumeric = minTime ? parseInt(to24Hour(minTime.hour, minTime.ampm || 'AM'), 10) : -1;
    const maxHourNumeric = maxTime ? parseInt(to24Hour(maxTime.hour, maxTime.ampm || 'AM'), 10) : 24;
    const hourNumeric = parseInt(hourToCheck24, 10);

    if (hourNumeric < minHourNumeric || hourNumeric > maxHourNumeric) return true;

    // Vérifier les minutes si l'heure est la même que min/max
    if (hourNumeric === minHourNumeric && minTime && currentMinute) {
      const minMin = parseInt(minTime.minute || '00', 10);
      if (parseInt(currentMinute, 10) < minMin) return true;
    }
    if (hourNumeric === maxHourNumeric && maxTime && currentMinute) {
      const maxMin = parseInt(maxTime.minute || '59', 10);
      if (parseInt(currentMinute, 10) > maxMin) return true;
    }
    return false;
  }, [currentMinute, minTime, maxTime, format]);

  const isMinuteDisabled = useCallback((hour24: string, minute: string): boolean => {
    const minHourNumeric = minTime ? parseInt(to24Hour(minTime.hour, minTime.ampm || 'AM'), 10) : -1;
    const maxHourNumeric = maxTime ? parseInt(to24Hour(maxTime.hour, maxTime.ampm || 'AM'), 10) : 24;
    const hourNumeric = parseInt(hour24, 10);
    const minuteNumeric = parseInt(minute, 10);

    if (hourNumeric < minHourNumeric || hourNumeric > maxHourNumeric) return true;

    if (hourNumeric === minHourNumeric && minTime) {
      const minMin = parseInt(minTime.minute || '00', 10);
      if (minuteNumeric < minMin) return true;
    }
    if (hourNumeric === maxHourNumeric && maxTime) {
      const maxMin = parseInt(maxTime.minute || '59', 10);
      if (minuteNumeric > maxMin) return true;
    }
    return false;
  }, [minTime, maxTime]);

  const commitSelection = useCallback((hour24: string, minute: string) => {
    if (hour24 && minute) {
      const newValue: TimeValue = `${hour24}:${minute}`;
      onChange(newValue);
      setIsOpen(false);
    }
  }, [onChange]);

  // handleHourSelect va maintenant recevoir l'heure formatée (ex: "01 AM", "12 PM" ou "13")
  const handleHourSelect = useCallback((selectedHourFull: string) => {
    let newHour24: string;
    let newAmPm: string = ''; // N'est plus un état direct, mais sera dérivé

    if (format === '12h') {
        const parts = selectedHourFull.split(' '); // "01 AM" -> ["01", "AM"]
        const hour12 = parts[0];
        const ampm = parts[1];
        newHour24 = to24Hour(hour12, ampm);
        newAmPm = ampm; // Mettre à jour currentAmPm pour l'affichage de l'en-tête
    } else { // 24h
        newHour24 = selectedHourFull;
        newAmPm = to12Hour(newHour24).ampm; // Dériver AM/PM pour la cohérence
    }

    setCurrentHour24(newHour24);
    setCurrentAmPm(newAmPm); // Mise à jour de AM/PM

    // Réajuster la minute si l'heure sélectionnée la rend invalide
    const minutesAvailable = MINUTES.filter(m => !isMinuteDisabled(newHour24, m));
    if (!minutesAvailable.includes(currentMinute) && minutesAvailable.length > 0) {
      setCurrentMinute(minutesAvailable[0]);
    } else if (minutesAvailable.length === 0) {
      setCurrentMinute('');
    }
  }, [format, currentMinute, isMinuteDisabled]);

  const handleMinuteSelect = useCallback((minute: string) => {
    if (!currentHour24) return;
    setCurrentMinute(minute);
  }, [currentHour24]);

  const handleClearTime = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setCurrentHour24('');
    setCurrentMinute('');
    setCurrentAmPm('');
  }, [onChange]);

  const handleValidate = useCallback(() => {
    if (currentHour24 && currentMinute) {
      commitSelection(currentHour24, currentMinute);
    }
  }, [currentHour24, currentMinute, commitSelection]);

  // Fonction de rendu des heures, maintenant avec la logique pour 12h AM/PM séparé
  const renderHourSelector = useCallback((): JSX.Element => {
    const renderHourGroup = (hours: string[], ampmSuffix: 'AM' | 'PM' | null = null) => {
        return hours.map((hourDisplay: string) => {
            //const hour24ForLogic = ampmSuffix ? to24Hour(hourDisplay, ampmSuffix) : hourDisplay;
            const isDisabled = disabled || isHourDisabled(hourDisplay, ampmSuffix); // Utilise isHourDisabled avec ampm
            
            // Déterminer si cette cellule est sélectionnée
            let isSelected = false;
            if (currentHour24 && currentMinute) { // Vérifie qu'une heure est effectivement sélectionnée
                if (format === '12h' && ampmSuffix) {
                    const { hour: currentHour12, ampm: currentHourAmPm } = to12Hour(currentHour24);
                    isSelected = hourDisplay === currentHour12 && ampmSuffix === currentHourAmPm;
                } else if (format === '24h' && !ampmSuffix) {
                    isSelected = hourDisplay === currentHour24;
                }
            }
            
            const cellLabel = ampmSuffix ? `${hourDisplay} ${ampmSuffix}` : hourDisplay;

            return (
                <button
                    key={cellLabel} // Clé unique pour chaque bouton
                    type="button"
                    className={`timepicker-cell ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && handleHourSelect(cellLabel)}
                    disabled={isDisabled}
                    aria-selected={isSelected}
                    aria-label={`Heure ${cellLabel}${isDisabled ? ' (désactivée)' : ''}`}
                    aria-disabled={isDisabled}
                >
                    {hourDisplay}
                </button>
            );
        });
    };

    if (format === '12h') {
        return (
            <div className="timepicker-hours-group">
                <div className="timepicker-time-section timepicker-hours-am-pm">
                    <h4 className="timepicker-group-title">AM</h4>
                    <div className="timepicker-hours">
                        {renderHourGroup(HOURS_12_DISPLAY, 'AM')}
                    </div>
                </div>
                <div className="timepicker-separator"></div>
                <div className="timepicker-time-section timepicker-hours-am-pm">
                    <h4 className="timepicker-group-title">PM</h4>
                    <div className="timepicker-hours">
                        {renderHourGroup(HOURS_12_DISPLAY, 'PM')}
                    </div>
                </div>
            </div>
        );
    } else { // 24h format
        return (
            <div className="timepicker-time-section">
                <div className="timepicker-hours">
                    {renderHourGroup(HOURS_24, null)}
                </div>
            </div>
        );
    }
  }, [currentHour24, currentMinute, disabled, handleHourSelect, format, isHourDisabled]);

  // Fonction utilitaire pour valider une heure en fonction du format
  const isValidHour = (hour: string, format: TimeFormat): boolean => {
    const hourNum = Number(hour);
    if (isNaN(hourNum)) return false;
    
    return format === '24h' 
      ? hourNum >= 0 && hourNum < 24
      : hourNum > 0 && hourNum <= 12;
  };

  const renderMinuteSelector = useCallback(() => {
    const minutesToDisplay = MINUTES;

    return (
      <div className="timepicker-time-section">
        <div className="timepicker-separator"></div>
        <div className="timepicker-minutes">
          {minutesToDisplay.map((minute) => {
            const isDisabled = disabled || !currentHour24 || isMinuteDisabled(currentHour24, minute);

            return (
              <button
                key={minute}
                type="button"
                className={`timepicker-cell ${minute === currentMinute ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleMinuteSelect(minute)}
                disabled={isDisabled}
                aria-selected={minute === currentMinute}
                aria-label={`Minute ${minute}${isDisabled ? ' (désactivée)' : ''}`}
                aria-disabled={isDisabled}
              >
                {minute}
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [currentHour24, currentMinute, disabled, handleMinuteSelect, isMinuteDisabled]);

  const renderFormatSelector = useCallback(() => (
    <div className="timepicker-format-selector">
      <button
        type="button"
        className={`timepicker-format-btn ${format === '12h' ? 'active' : ''}`}
        onClick={() => setFormat('12h')}
        disabled={!allowFormatChange}
        aria-label="Format 12 heures"
        title="Format 12 heures"
      >
        <Clock12 size={16} />
      </button>
      <button
        type="button"
        className={`timepicker-format-btn ${format === '24h' ? 'active' : ''}`}
        onClick={() => setFormat('24h')}
        disabled={!allowFormatChange}
        aria-label="Format 24 heures"
        title="Format 24 heures"
      >
        <Clock size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    </div>
  ), [format, allowFormatChange]);

  const displayHour = format === '12h' && currentHour24 ? to12Hour(currentHour24).hour : currentHour24;
  
  const isValidateButtonDisabled = !currentHour24 || !currentMinute;

  const displayAmPm = currentAmPm;

  return (
    <div className={`timepicker-container ${className}`}
    ref={formref}
    onBlur={(e)=>{onBlur?.(e)}}>
      <Popover open={isOpen} onOpenChange={(o) => !disabled && setIsOpen(o)}>
        <PopoverTrigger asChild>
          <button
            ref={btnRef}
            type="button"
            className={`timepicker-btn ${disabled ? 'disabled' : ''}`}
            disabled={disabled}
            aria-label={value ? `Heure sélectionnée: ${formatTimeDisplay(currentHour24, currentMinute, format)}` : placeholder}
          >
            {value ? formatTimeDisplay(currentHour24, currentMinute, format) : placeholder}
            <span className="timepicker-icon">
              <Clock size={16} />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent 
          className="p-0 w-auto" 
          align="start" 
          onPointerDownOutside={(e) => {
            // Empêche la fermeture du popover lors d'un clic à l'extérieur
            if(closeOnClickOutside === false){
              e.preventDefault();
            }
          }}
        >
          <div className="timepicker-header">
            <div className="timepicker-time">
              {allowFormatChange && renderFormatSelector()}
              <span className="time-value">
                {isValidHour(displayHour, format) ? displayHour : '--'}
              </span>
              <span className="time-separator">:</span>
              <span className="time-value">{currentMinute || '--'}</span>
              {format === '12h' && (
                <span className="time-ampm">
                  {displayAmPm}
                </span>
              )}
            </div>
          </div>

          <div className="timepicker-grid">
            {renderHourSelector()} {/* Ce rendu gère maintenant le mode AM/PM séparé */}
            {renderMinuteSelector()}
            {/* Ancien emplacement de renderAmPmSelector, maintenant supprimé */}
          </div>

          <div className="timepicker-actions">
            <button
              type="button"
              className="timepicker-clear-btn"
              onClick={handleClearTime}
            >
              Aucune heure
            </button>
            <button
              type="button"
              className="timepicker-validate-btn"
              onClick={handleValidate}
              disabled={isValidateButtonDisabled}
            >
              Valider
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default React.memo(TimePicker);