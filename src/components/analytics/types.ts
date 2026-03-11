// ---------------------------------------------------------------------------
// Analytics shared types
// ---------------------------------------------------------------------------

export interface OverviewData {
  users?: { total?: number; active?: number; by_role?: Record<string, number> };
  courses?: { total?: number; published?: number; avg_completion_rate?: number };
  tasks?: { total?: number; completed?: number; overdue?: number; completion_rate?: number };
  learning?: { total_enrolled?: number; total_completed?: number; avg_progress?: number };
  products?: { total?: number; with_tests?: number; avg_test_score?: number };
  // Legacy flat fields (backward compat)
  total_users?: number;
  total_courses?: number;
  total_tasks?: number;
  total_products?: number;
}

export interface LearningMetrics {
  total_enrolled?: number;
  total_completed?: number;
  avg_completion_rate?: number;
  completion_rate?: number;
  average_score?: number;
  active_learners?: number;
  courses_completed?: number;
  by_territory?: TerritoryItem[];
  by_course?: CourseItem[];
  time_stats?: { avg_time_per_lesson?: number; total_learning_hours?: number };
  difficult_steps?: DifficultStep[];
}

export interface TerritoryItem {
  territory: string;
  enrolled: number;
  completed: number;
  avg_score: number;
}

export interface CourseItem {
  course_id: string;
  title: string;
  enrolled: number;
  completed: number;
  avg_score: number;
}

export interface DifficultStep {
  content_item_id: string;
  title: string;
  difficulty_level: number;
  path?: string;
}

export interface CategoryBreakdown {
  name: string;
  count: number;
}

export interface ProductStats {
  total_products?: number;
  products_with_tests?: number;
  products_with_hpv?: number;
  average_test_score?: number;
  tests_completed?: number;
  test_stats?: { total_attempts?: number; pass_rate?: number; avg_score?: number };
  categories_breakdown?: CategoryBreakdown[];
  by_product?: ProductItem[];
  popular_products?: ProductItem[];
  difficult_products?: ProductItem[];
}

export interface ProductItem {
  product_id: string;
  name: string;
  attempts: number;
  pass_rate: number;
  avg_score: number;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  employee_id: string;
  role: string;
  region?: string;
  tasks_completed: number;
}

// AI L&D types
export interface TrackInfo {
  id: string;
  label: string;
  roles: string;
}

export interface LmsDashboard {
  track?: string;
  available_tracks?: TrackInfo[];
  metrics?: {
    total_responses?: number;
    total_completions?: number;
    total_courses?: number;
    quiz_accuracy?: number;
    reflection_rate?: number;
    avg_quiz_score?: number;
    clusters_this_week?: number;
  };
  pain_clusters?: PainClusterItem[];
  category_distribution?: CategoryDistItem[];
  reflections?: ReflectionItem[];
  weekly_trend?: WeeklyTrendItem[];
  // KPI mapping from backend
  kpi_mapping?: KpiMappingSection[];
}

export interface KpiMappingSection {
  title: string;
  track: string;
  items: KpiMappingItem[];
}

export interface KpiMappingItem {
  category: string;
  label: string;
  kpi: string;
  weight: string;
}

export interface PainClusterItem {
  id: string;
  category: string;
  label: string;
  icon: string;
  count: number;
  trend_vs_prev_week: number | null;
  top_quotes: string[];
  affected_users: number;
  status: string;
  has_draft: boolean;
}

export interface CategoryDistItem {
  category: string;
  label: string;
  icon: string;
  count: number;
}

export interface ReflectionItem {
  user_id: string;
  user_name: string;
  answer: string;
  category: string | null;
  category_label: string | null;
  created_at: string | null;
}

export interface WeeklyTrendItem {
  week_start: string;
  total_mentions: number;
  cluster_count: number;
}

export interface InsightItem {
  id: string;
  course_id: string;
  course_title: string;
  cluster_category: string | null;
  target_user_count: number;
  completion_rate_7d: number | null;
  effectiveness_delta: number | null;
  cluster_freq_before: number | null;
  cluster_freq_after: number | null;
  measured_at: string | null;
  stats?: { completions?: number; avg_score?: number | null; avg_time_sec?: number | null };
}

export type TabId = 'overview' | 'lms' | 'effectiveness';
