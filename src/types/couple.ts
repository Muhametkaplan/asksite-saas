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

export interface AllowedUsers {
  partner1_email?: string;
  partner2_email?: string;
  partner1_pin?: string;
  partner2_pin?: string;
}

export interface AuthenticatedDevice {
  device_token: string;
  partner_name: string;
  role?: 'partner1' | 'partner2';
  email?: string;
  uid?: string;
  added_at?: string;
}

export interface CouponItem {
  id: string;
  title: string;
  description: string;
  category: 'massage' | 'date' | 'food' | 'forgive' | 'movie' | 'custom';
  icon?: string;
  is_used: boolean;
  used_at?: string;
}

export interface DiaryEntry {
  id: string;
  author: string;
  role: 'partner1' | 'partner2' | 'guest';
  date: string;
  content: string;
  mood?: string;
}

export interface CapsuleItem {
  id: string;
  title: string;
  content: string;
  open_date: string; // ISO date string
  created_at: string;
  creator: string;
  photo_url?: string;
  is_opened?: boolean;
}

export interface MovieItem {
  id: string;
  title: string;
  genre?: string;
  poster_url?: string;
  watch_url?: string;
  rating?: number;
  note?: string;
  status: 'watched' | 'watchlist';
  added_by?: string;
  created_at?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  created_by?: 'partner1' | 'partner2';
  points?: number;
  created_at?: string;
  expires_at?: string;
}

export interface FeatureToggles {
  spotify?: boolean;
  memory?: boolean;
  bucket_list?: boolean;
  day_night?: boolean;
  countdown?: boolean;
  custom_audio?: boolean;
  canvas?: boolean;
  love_jar?: boolean;
  map?: boolean;
  coupons?: boolean;
  diary?: boolean;
  capsule?: boolean;
  cinema?: boolean;
  wheel?: boolean;
  quiz?: boolean;
}

export interface CoupleConfig {
  id?: string;
  slug: string;
  partner1_name: string;
  partner2_name: string;
  partner1_email?: string;
  partner2_email?: string;
  partner1_pin?: string;
  partner2_pin?: string;
  authorized_emails?: string[];
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
  coupons?: CouponItem[];
  diary_entries?: DiaryEntry[];
  time_capsules?: CapsuleItem[];
  movies?: MovieItem[];
  wheel_items?: string[];
  quiz_partner1?: QuizQuestion[];
  quiz_partner2?: QuizQuestion[];
  partner1_score?: number;
  partner2_score?: number;
  quiz_partner1_created_at?: string;
  quiz_partner2_created_at?: string;
  quiz_partner1_expires_at?: string;
  quiz_partner2_expires_at?: string;
  upcoming_event?: UpcomingEvent;
  allowed_users?: AllowedUsers;
  feature_toggles?: FeatureToggles;
  is_active?: boolean;
  isPaid?: boolean;
  plan?: '1_year' | 'lifetime' | string;
  package_type?: 'yearly' | 'lifetime' | 'nfc' | 'digital' | string;
  paid_at?: string;
  paidAt?: any;
  expires_at?: string | null;
  price?: number;
  owner_uid?: string;
  owner_email?: string;
  pair_code?: string;
  inviteCode?: string;
  pair_code_used?: boolean;
  isUsed?: boolean;
  partner1_uid?: string;
  partner2_uid?: string;
  co_owners?: string[];
  authenticated_devices?: AuthenticatedDevice[];
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

export interface AskSiteAIMovieItem {
  title: string;
  genre: string;
  reason: string;
  poster_url?: string;
  watch_url?: string;
}

export interface AskSiteAIResponse {
  movies: AskSiteAIMovieItem[];
  remaining?: number;
  error?: string;
}

export interface CanvasDrawing {
  id: string;
  imageUrl: string;
  createdAt: string;
  drawnBy: string;
}
