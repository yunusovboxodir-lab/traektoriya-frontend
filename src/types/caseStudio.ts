// Module 17: Case Studio (Кейсотека) — TypeScript-типы (зеркальные Pydantic-схемам)

export type CaseTargetRole =
  | 'sales_rep'
  | 'supervisor'
  | 'regional_manager'
  | 'commercial_dir';

export type CaseScenarioStatus = 'draft' | 'published' | 'archived';

export type RatingTargetType = 'scenario' | 'solution';

export interface CaseCategory {
  id: string;
  code: string;
  label_ru: string;
  label_uz: string | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  applicable_roles: string[] | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreateIn {
  code: string;
  label_ru: string;
  label_uz?: string | null;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  applicable_roles?: string[] | null;
  order_index?: number;
}

export interface CategoryUpdateIn {
  label_ru?: string;
  label_uz?: string | null;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  applicable_roles?: string[] | null;
  order_index?: number;
  is_active?: boolean;
}

export interface DialogueLine {
  speaker: string; // client | tp | sv | rm | other
  speaker_name?: string | null;
  text: string;
}

export interface CaseScenario {
  id: string;
  author_id: string | null;
  target_role: CaseTargetRole;
  category_id: string | null;
  title_ru: string;
  title_uz: string | null;
  situation_ru: string;
  situation_uz: string | null;
  original_dialogue: DialogueLine[] | null;
  has_author_solution: boolean;
  status: CaseScenarioStatus;
  views_count: number;
  ratings_count: number;
  ai_simulator_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseSolution {
  id: string;
  scenario_id: string;
  author_id: string | null;
  is_author_solution: boolean;
  text_ru: string;
  text_uz: string | null;
  solution_dialogue: DialogueLine[] | null;
  total_score: number;
  ratings_count: number;
  avg_rating: number;
  top_position: number | null;
  is_etalon: boolean;
  created_at: string;
}

export interface CaseScenarioDetail extends CaseScenario {
  category: CaseCategory | null;
  solutions: CaseSolution[];
}

export interface ScenarioCreateIn {
  target_role: CaseTargetRole;
  category_id: string;
  title_ru: string;
  title_uz?: string | null;
  situation_ru: string;
  situation_uz?: string | null;
  original_dialogue?: DialogueLine[] | null;
  has_author_solution?: boolean;
  author_solution_text?: string | null;
}

export interface ScenarioUpdateIn {
  title_ru?: string;
  title_uz?: string | null;
  situation_ru?: string;
  situation_uz?: string | null;
  original_dialogue?: DialogueLine[] | null;
  category_id?: string;
}

export interface SolutionCreateIn {
  text_ru: string;
  text_uz?: string | null;
  solution_dialogue?: DialogueLine[] | null;
}

export interface RatingCreateIn {
  target_type: RatingTargetType;
  target_id: string;
  stars: number; // 1-5
  comment?: string | null;
}

export interface CaseRating {
  id: string;
  rater_id: string;
  target_type: RatingTargetType;
  target_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  employee_id: string | null;
  full_name: string | null;
  role: string | null;
  total_xp: number;
  scenarios_count: number;
  solutions_count: number;
  top3_count: number;
}

export interface MyStats {
  user_id: string;
  total_xp: number;
  scenarios_created: number;
  solutions_added: number;
  ratings_given: number;
  top3_solutions: number;
  popular_scenarios: number;
  by_action: Record<string, number>;
}
