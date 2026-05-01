// Module 15: Smart Training Plan — TypeScript-типы (зеркальные Pydantic-схемам)

export type EventType =
  | 'offline_training'
  | 'online_block'
  | 'pulse_check'
  | 'attestation'
  | 'championship'
  | 'field_trip';

export type EventStatus =
  | 'planned'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type Readiness = 'ready' | 'created' | 'template';

export type TargetRole =
  | 'sales_rep'
  | 'supervisor'
  | 'regional_manager'
  | 'commercial_dir'
  | 'all';

export type Urgency = 'low' | 'normal' | 'high' | 'urgent';

export type RequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'cancelled';

// ---------------------------------------------------------------------------
// Calendar event
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  event_code: string;
  event_type: EventType;
  program_id: string | null;
  title_ru: string;
  title_uz: string | null;
  target_role: TargetRole;
  target_region: string | null;
  target_user_ids: string[] | null;
  start_date: string; // ISO date
  end_date: string | null;
  week_number: number | null;
  half_of_month: 'first' | 'second' | null;
  duration_minutes: number | null;
  location: string | null;
  status: EventStatus;
  readiness: Readiness | null;
  competencies: string[] | null;
  notes: string | null;
  actual_participants_count: number | null;
  pre_avg_score: number | null;
  post_avg_score: number | null;
  growth_pct: number | null;
  linked_session_id: string | null;
  linked_request_id: string | null;
  rescheduled_to_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreateIn {
  event_code: string;
  event_type: EventType;
  program_id?: string | null;
  title_ru: string;
  title_uz?: string | null;
  target_role: TargetRole;
  target_region?: string | null;
  target_user_ids?: string[] | null;
  start_date: string;
  end_date?: string | null;
  week_number?: number | null;
  half_of_month?: 'first' | 'second' | null;
  duration_minutes?: number | null;
  location?: string | null;
  readiness?: Readiness | null;
  competencies?: string[] | null;
  notes?: string | null;
}

export interface CalendarEventUpdateIn {
  title_ru?: string;
  title_uz?: string | null;
  target_region?: string | null;
  target_user_ids?: string[] | null;
  start_date?: string;
  end_date?: string | null;
  duration_minutes?: number | null;
  location?: string | null;
  status?: EventStatus;
  readiness?: Readiness | null;
  competencies?: string[] | null;
  notes?: string | null;
}

export interface CalendarEventCompleteIn {
  actual_participants_count: number;
  pre_avg_score?: number | null;
  post_avg_score?: number | null;
  notes?: string | null;
  linked_session_id?: string | null;
}

export interface CalendarEventRescheduleIn {
  new_start_date: string;
  new_end_date?: string | null;
  reason?: string | null;
}

// ---------------------------------------------------------------------------
// Pulse-check
// ---------------------------------------------------------------------------

export interface PulseSnapshot {
  self_pulse: number | null;
  team_avg_pulse: number | null;
  team_size: number | null;
  weakest_competencies: string[] | null;
  rule_id: string | null;
  rule_passed: boolean;
  captured_at: string;
  override_used: boolean;
}

export interface PulseCheckOut {
  passed: boolean;
  snapshot: PulseSnapshot;
  missing: string[];
  can_override_with_urgency: boolean;
}

// ---------------------------------------------------------------------------
// Training requests
// ---------------------------------------------------------------------------

export interface TrainingRequest {
  id: string;
  requester_id: string;
  requester_role: string;
  program_id: string | null;
  custom_topic: string | null;
  target_role: TargetRole;
  target_user_ids: string[] | null;
  target_region: string | null;
  reason: string;
  urgency: Urgency;
  proposed_dates: Array<{ date: string; preference?: number }> | null;
  pulse_snapshot: PulseSnapshot;
  approval_path: Array<{
    role: string;
    user_id: string;
    decision: string;
    comment: string | null;
    decided_at: string;
  }>;
  status: RequestStatus;
  linked_event_id: string | null;
  decision_comment: string | null;
  submitted_at: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingRequestCreateIn {
  program_id?: string | null;
  custom_topic?: string | null;
  target_role: TargetRole;
  target_user_ids?: string[] | null;
  target_region?: string | null;
  reason: string;
  urgency?: Urgency;
  proposed_dates?: Array<{ date: string; preference?: number }> | null;
}

export interface ApprovalDecisionIn {
  decision: 'approved' | 'rejected';
  comment?: string | null;
}

export interface ScheduleRequestIn {
  event_code: string;
  start_date: string;
  end_date?: string | null;
  duration_minutes?: number | null;
  location?: string | null;
  title_ru_override?: string | null;
}

// ---------------------------------------------------------------------------
// Field trips
// ---------------------------------------------------------------------------

export interface FieldTripReport {
  id: string;
  trip_code: string;
  start_date: string;
  end_date: string;
  cities: string[];
  transport: Array<Record<string, unknown>> | null;
  total_cost_uzs: number | null;
  participants_summary: Record<string, number>;
  pre_avg: number | null;
  post_avg: number | null;
  narrative: string | null;
  next_steps: string | null;
  linked_event_ids: string[] | null;
  trainer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldTripCreateIn {
  trip_code: string;
  start_date: string;
  end_date: string;
  cities: string[];
  transport?: Array<Record<string, unknown>> | null;
  total_cost_uzs?: number | null;
  participants_summary?: Record<string, number>;
  pre_avg?: number | null;
  post_avg?: number | null;
  narrative?: string | null;
  next_steps?: string | null;
  linked_event_ids?: string[] | null;
  trainer_id?: string | null;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface PlanVsFact {
  from_date: string;
  to_date: string;
  target_role: string;
  planned_count: number;
  completed_count: number;
  cancelled_count: number;
  completion_pct: number;
  avg_growth_pct: number | null;
  total_participants: number;
}
