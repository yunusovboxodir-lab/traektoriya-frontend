// API клиент Module 15: Smart Training Plan
import { api } from './client';
import type {
  ApprovalDecisionIn,
  CalendarEvent,
  CalendarEventCompleteIn,
  CalendarEventCreateIn,
  CalendarEventRescheduleIn,
  CalendarEventUpdateIn,
  EventStatus,
  EventType,
  FieldTripCreateIn,
  FieldTripReport,
  PlanVsFact,
  PulseCheckOut,
  ScheduleRequestIn,
  TargetRole,
  TrainingRequest,
  TrainingRequestCreateIn,
  Urgency,
} from '../types/trainingPlan';

const PREFIX = '/api/v1/training-plan';

export const trainingPlanApi = {
  // -------------------------- Calendar --------------------------
  listEvents: (params?: {
    from_date?: string;
    to_date?: string;
    target_role?: TargetRole;
    region?: string;
    event_type?: EventType;
    status?: EventStatus;
    skip?: number;
    limit?: number;
  }) => api.get<CalendarEvent[]>(`${PREFIX}/calendar`, { params }),

  getEvent: (id: string) => api.get<CalendarEvent>(`${PREFIX}/calendar/${id}`),

  createEvent: (data: CalendarEventCreateIn) =>
    api.post<CalendarEvent>(`${PREFIX}/calendar`, data),

  updateEvent: (id: string, data: CalendarEventUpdateIn) =>
    api.patch<CalendarEvent>(`${PREFIX}/calendar/${id}`, data),

  completeEvent: (id: string, data: CalendarEventCompleteIn) =>
    api.post<CalendarEvent>(`${PREFIX}/calendar/${id}/complete`, data),

  rescheduleEvent: (id: string, data: CalendarEventRescheduleIn) =>
    api.post<CalendarEvent>(`${PREFIX}/calendar/${id}/reschedule`, data),

  // -------------------------- Pulse-check --------------------------
  pulseCheck: (params: {
    target_role: TargetRole;
    program_id?: string;
    urgency?: Urgency;
  }) => api.get<PulseCheckOut>(`${PREFIX}/pulse-check`, { params }),

  // -------------------------- Requests --------------------------
  listRequests: (params?: { status?: string; requester_id?: string; skip?: number; limit?: number }) =>
    api.get<TrainingRequest[]>(`${PREFIX}/requests`, { params }),

  createRequest: (data: TrainingRequestCreateIn) =>
    api.post<TrainingRequest>(`${PREFIX}/requests`, data),

  approveRequest: (id: string, data: ApprovalDecisionIn) =>
    api.post<TrainingRequest>(`${PREFIX}/requests/${id}/approve`, data),

  rejectRequest: (id: string, data: ApprovalDecisionIn) =>
    api.post<TrainingRequest>(`${PREFIX}/requests/${id}/reject`, data),

  scheduleRequest: (id: string, data: ScheduleRequestIn) =>
    api.post<CalendarEvent>(`${PREFIX}/requests/${id}/schedule`, data),

  // -------------------------- Field trips --------------------------
  listFieldTrips: (params?: { from_date?: string; to_date?: string; skip?: number; limit?: number }) =>
    api.get<FieldTripReport[]>(`${PREFIX}/field-trips`, { params }),

  createFieldTrip: (data: FieldTripCreateIn) =>
    api.post<FieldTripReport>(`${PREFIX}/field-trips`, data),

  // -------------------------- Analytics --------------------------
  planVsFact: (params: { from_date: string; to_date: string; target_role?: TargetRole }) =>
    api.get<PlanVsFact>(`${PREFIX}/analytics/plan-vs-fact`, { params }),
};
