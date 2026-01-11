'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, addDays, startOfDay, setHours, setMinutes, isBefore, isAfter } from 'date-fns'
import { nb } from 'date-fns/locale'

interface SchedulePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  maxDays?: number // Max days in future, default 60
  className?: string
}

// Quick schedule options
const QUICK_OPTIONS = [
  { label: 'I morgen kl. 09:00', getDays: () => 1, hour: 9, minute: 0 },
  { label: 'I morgen kl. 12:00', getDays: () => 1, hour: 12, minute: 0 },
  { label: 'I morgen kl. 18:00', getDays: () => 1, hour: 18, minute: 0 },
  { label: 'Om 2 dager kl. 09:00', getDays: () => 2, hour: 9, minute: 0 },
  { label: 'Neste uke kl. 09:00', getDays: () => 7, hour: 9, minute: 0 },
]

// Time slots for custom selection
const TIME_SLOTS = [
  { hour: 6, label: '06:00' },
  { hour: 7, label: '07:00' },
  { hour: 8, label: '08:00' },
  { hour: 9, label: '09:00' },
  { hour: 10, label: '10:00' },
  { hour: 11, label: '11:00' },
  { hour: 12, label: '12:00' },
  { hour: 13, label: '13:00' },
  { hour: 14, label: '14:00' },
  { hour: 15, label: '15:00' },
  { hour: 16, label: '16:00' },
  { hour: 17, label: '17:00' },
  { hour: 18, label: '18:00' },
  { hour: 19, label: '19:00' },
  { hour: 20, label: '20:00' },
  { hour: 21, label: '21:00' },
  { hour: 22, label: '22:00' },
]

export function SchedulePicker({
  value,
  onChange,
  maxDays = 60,
  className,
}: SchedulePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'quick' | 'custom'>('quick')
  const [selectedDate, setSelectedDate] = useState<Date | null>(value)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const minDate = startOfDay(addDays(new Date(), 1)) // Tomorrow
  const maxDate = startOfDay(addDays(new Date(), maxDays))

  useEffect(() => {
    setSelectedDate(value)
  }, [value])

  const handleQuickSelect = (option: typeof QUICK_OPTIONS[0]) => {
    const date = setMinutes(
      setHours(addDays(new Date(), option.getDays()), option.hour),
      option.minute
    )
    onChange(date)
    setIsOpen(false)
  }

  const handleDateSelect = (date: Date) => {
    // Keep the time if already selected, otherwise default to 09:00
    const hour = selectedDate?.getHours() ?? 9
    const minute = selectedDate?.getMinutes() ?? 0
    const newDate = setMinutes(setHours(date, hour), minute)
    setSelectedDate(newDate)
  }

  const handleTimeSelect = (hour: number) => {
    if (!selectedDate) return
    const newDate = setMinutes(setHours(selectedDate, hour), 0)
    setSelectedDate(newDate)
    onChange(newDate)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setSelectedDate(null)
    setIsOpen(false)
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday = 0

    const days: (Date | null)[] = []

    // Add padding for days before first of month
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    // Add actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }

    return days
  }

  const isDateDisabled = (date: Date) => {
    return isBefore(date, minDate) || isAfter(date, maxDate)
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Trigger button */}
      <Button
        type="button"
        variant={value ? 'default' : 'outline'}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'gap-2',
          value && 'bg-blue-600 hover:bg-blue-700 text-white'
        )}
      >
        <Calendar className="w-4 h-4" />
        {value ? (
          <span>{format(value, "d. MMM 'kl.' HH:mm", { locale: nb })}</span>
        ) : (
          <span>Planlegg</span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium text-gray-900">Planlegg publisering</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* View tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setView('quick')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                view === 'quick'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Hurtigvalg
            </button>
            <button
              type="button"
              onClick={() => setView('custom')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                view === 'custom'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Velg dato
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {view === 'quick' ? (
              <div className="space-y-2">
                {QUICK_OPTIONS.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickSelect(option)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Calendar header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
                      )
                    }
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-sm">
                    {format(calendarMonth, 'MMMM yyyy', { locale: nb })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
                      )
                    }
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                  {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((date, index) => (
                    <div key={index}>
                      {date ? (
                        <button
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          disabled={isDateDisabled(date)}
                          className={cn(
                            'w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors',
                            isDateDisabled(date)
                              ? 'text-gray-300 cursor-not-allowed'
                              : isDateSelected(date)
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100'
                          )}
                        >
                          {date.getDate()}
                        </button>
                      ) : (
                        <div className="w-full aspect-square" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Time selection */}
                {selectedDate && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Velg klokkeslett</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.hour}
                          type="button"
                          onClick={() => handleTimeSelect(slot.hour)}
                          className={cn(
                            'px-2 py-1.5 text-xs rounded transition-colors',
                            selectedDate.getHours() === slot.hour
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100'
                          )}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {value && (
            <div className="p-3 border-t bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {format(value, "EEEE d. MMMM 'kl.' HH:mm", { locale: nb })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Fjern
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
