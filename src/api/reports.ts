import { api } from './client';

export interface ScreenshotReport {
  id: string;
  user_id: string;
  user_name: string | null;
  user_role: string | null;
  user_region: string | null;
  comment: string;
  current_route: string | null;
  screen_name: string | null;
  context_data: Record<string, unknown> | null;
  device_info: Record<string, unknown> | null;
  screenshot_url: string | null;
  status: 'new' | 'reviewed' | 'resolved';
  admin_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ScreenshotReportList {
  items: ScreenshotReport[];
  total: number;
}

export const reportsApi = {
  /** Submit a screenshot report (any authenticated user) */
  submit: (data: {
    screenshot: Blob;
    comment: string;
    currentRoute?: string;
    screenName?: string;
  }) => {
    const formData = new FormData();
    formData.append('screenshot', data.screenshot, 'screenshot.png');
    formData.append('comment', data.comment);
    if (data.currentRoute) formData.append('current_route', data.currentRoute);
    if (data.screenName) formData.append('screen_name', data.screenName);
    return api.post('/api/v1/reports/screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  list: (params?: { skip?: number; limit?: number; status?: string; user_id?: string }) =>
    api.get<ScreenshotReportList>('/api/v1/reports/screenshots', { params }),

  getDetail: (id: string) =>
    api.get<ScreenshotReport>(`/api/v1/reports/screenshots/${id}`),

  updateStatus: (id: string, data: { status?: string; admin_comment?: string }) =>
    api.patch<ScreenshotReport>(`/api/v1/reports/screenshots/${id}`, data),
};
