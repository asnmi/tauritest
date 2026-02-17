"use client"

import * as React from "react"
import { format, isBefore, isAfter, isValid, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import "./datepicker.css"

export interface DatePickerProps {
  selected?: Date
  onChange?: (date: Date | undefined) => void
  onClose?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  dateFormat?: string
  showIcon?: boolean
  required?: boolean
}

export function DatePicker({
  selected,
  onChange,
  onClose,
  placeholder = "Sélectionner une date",
  className,
  disabled = false,
  minDate,
  maxDate,
  dateFormat = "PPP",
  showIcon = true,
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(selected)
  
  const handleSelect = (date: Date | undefined) => {
    if (!date || !isValid(date)) {
      setSelectedDate(undefined)
      onChange?.(undefined)
      return
    }
    
    setSelectedDate(date)
    onChange?.(date)
    setOpen(false)
    onClose?.()
  }

  const isDateDisabled = React.useCallback((date: Date): boolean => {
    if (!isValid(date)) return true;
    if (minDate && isBefore(date, subDays(minDate, 1))) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  }, [minDate, maxDate]);

  const displayValue = selectedDate && isValid(selectedDate) 
    ? format(selectedDate, dateFormat, { locale: fr })
    : ''

  return (
    <div className="datepicker-container">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "datepicker-button",
              className
            )}
            type="button"
            aria-required={required}
            aria-label={selectedDate ? `Date sélectionnée: ${displayValue}` : placeholder}
            data-empty={!selectedDate}
          >
            {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
            {selectedDate && isValid(selectedDate) ? (
              <span>{displayValue}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="datepicker-content" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            initialFocus
            locale={fr}
            weekStartsOn={1} // Monday
            required={required}
            captionLayout="dropdown"
            fromYear={minDate?.getFullYear() || 2020}
            toYear={maxDate?.getFullYear() || 2030}
          />
          <div className="datepicker-footer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="clear-button"
              onClick={() => handleSelect(undefined)}
            >
              Aucune date
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}