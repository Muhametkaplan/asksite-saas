export interface MemoryItem {
  id: string;
  photo_url: string;
  date: string;
  title: string;
  note: string;
}

export interface BucketListItem {
  id: string;
  title: string;
  category: 'city' | 'movie' | 'activity';
  completed: boolean;
}

export interface UpcomingEvent {
  title: string;
  date: string; // ISO or YYYY-MM-DD
  location?: string;
}

export interface FeatureToggles {
  spotify?: boolean;
  memory?: boolean;
  bucket_list?: boolean;
  day_night?: boolean;
  countdown?: boolean;
  custom_audio?: boolean;
}

export interface CoupleConfig {
  id?: string;
  slug: string;
  partner1_name: string;
  partner2_name: string;
  subtitle: string;
  start_date: string; // ISO date string
  theme_color_primary: string;
  theme_color_tech: string;
  bg_music_url: string;
  custom_audio_url?: string;
  spotify_url?: string;
  spotify_lyrics?: string[];
  whatsapp_number: string;
  whatsapp_message: string;
  love_reasons: string[];
  memories?: MemoryItem[];
  bucket_list?: BucketListItem[];
  upcoming_event?: UpcomingEvent;
  feature_toggles?: FeatureToggles;
  is_active?: boolean;
  created_at?: string;
}

export interface MapMarker {
  id?: string;
  couple_id?: string;
  lat: number;
  lng: number;
  title?: string;
  created_at?: string;
}

export interface MovieRecommendationRequest {
  genre: string;
  mood: string;
}

export interface MovieRecommendationResponse {
  title: string;
  plot: string;
  reason: string;
  rawText?: string;
  error?: string;
}
