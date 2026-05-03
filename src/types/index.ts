export interface MoodEntry {
  id: string;
  user_id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  stress: number; // 1-10
  note?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  streak_count: number;
  is_guest: boolean;
}

export interface CampusResource {
  id: string;
  category: string;
  name: string;
  description: string;
  contact_info: {
    phone?: string;
    email?: string;
    maps_link?: string;
  };
  hours: string;
}

export interface WellnessTip {
  id: string;
  category: string;
  title: string;
  body: string;
}

export interface AcademicEvent {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  is_high_stress: boolean;
  tip_category_override?: string;
}
