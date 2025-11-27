// Type definitions for scheduler components

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  created_at?: string
}

export interface Location {
  id: number
  name: string
  description?: string
  is_active: boolean
}

export interface TimeSlot {
  id: number
  day_of_week: number // 0 = Monday, 6 = Sunday
  start_time: string // HH:MM:SS format
  end_time: string
}

export interface DaySchedule {
  id: number
  day_of_week: number // 0 = Monday, 6 = Sunday
  start_time: string // HH:MM format
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
  slot_count?: number
  day_name?: string
}

export interface Assignment {
  id: number
  user_id: number
  location_id: number
  time_slot_id: number
  week_start_date: string // YYYY-MM-DD
  assigned_by?: number
  user_name?: string
  location_name?: string
  time_slot?: TimeSlot
  start?: string
  end?: string
  title?: string
}

export interface UserAvailability {
  id?: number
  user_id: number
  location_id: number
  time_slot_id: number
  week_start_date: string
  preference_level: number // 1 = neutral, 2 = preferred
}

export interface GlobalSettings {
  max_workers_per_shift: number
  max_hours_per_user_per_week?: number
}

export interface ScheduleData {
  users: User[]
  assignments: Assignment[]
  locations: Location[]
  timeSlots: TimeSlot[]
  weekStart: string
  settings?: GlobalSettings
}

export interface DragItem {
  type: 'shift' | 'unassigned'
  assignmentId?: number
  locationId: number
  timeSlotId: number
  userId?: number
}

export interface DropTarget {
  userId: number
  locationId: number
  timeSlotId: number
  dayOfWeek: number
}

