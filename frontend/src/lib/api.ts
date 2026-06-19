// API Client and Interfaces for FitdaysWeb

export interface User {
  id: number;
  login: string;
  email: string;
  display_name: string | null;
  gender: string | null;
  birthday: string | null;
  height_cm: number | null;
  target_weight_kg: number | null;
  profile_image_path: string | null;
  profile_image_url: string | null;
  preferred_language: string | null;
  created_at: string;
}

export interface WeightHistoryPoint {
  date: string;
  weight: number;
  body_fat_pct: number;
  muscle_mass: number;
}

export interface DashboardSummary {
  total_records: number;
  first_record_date: string | null;
  latest_record_date: string | null;
  starting_weight: number | null;
  current_weight: number | null;
  weight_change: number | null;
  starting_body_fat: number | null;
  current_body_fat: number | null;
  body_fat_change: number | null;
  starting_muscle_mass: number | null;
  current_muscle_mass: number | null;
  muscle_mass_change: number | null;
  weight_history: WeightHistoryPoint[];
}

export interface FitdaysRecord {
  id: number;
  user_id: number;
  date: string;
  weight: number;
  bmi: number;
  body_fat_pct: number;
  subcutaneous_fat_pct: number;
  heart_rate: number | null;
  heart_index: number | null;
  visceral_fat: number;
  body_water_pct: number;
  skeletal_muscle_mass_pct: number;
  muscle_mass: number;
  bone_mass: number;
  protein_pct: number;
  bmr: number;
  metabolic_age: number;
  fat_mass: number;
  moisture_content: number;
  skeletal_muscle_mass: number;
  muscle_rate_pct: number;
  protein_mass: number;
  obesity_score: number;
  fat_free_mass: number;
  smi: number | null;
  body_score: number;
  target_weight: number;
  weight_control: number;
  fat_control: number;
  muscle_control: number;

  // Segmental Fat & Muscle
  right_arm_fat_mass: number | null;
  right_arm_fat_pct: number | null;
  right_arm_fat_level: string | null;
  right_arm_muscle_mass: number | null;
  right_arm_muscle_pct: number | null;
  right_arm_muscle_level: string | null;
  right_arm_impedance_high: number | null;
  right_arm_impedance_low: number | null;

  left_arm_fat_mass: number | null;
  left_arm_fat_pct: number | null;
  left_arm_fat_level: string | null;
  left_arm_muscle_mass: number | null;
  left_arm_muscle_pct: number | null;
  left_arm_muscle_level: string | null;
  left_arm_impedance_high: number | null;
  left_arm_impedance_low: number | null;

  trunk_fat_mass: number | null;
  trunk_fat_pct: number | null;
  trunk_fat_level: string | null;
  trunk_muscle_mass: number | null;
  trunk_muscle_pct: number | null;
  trunk_muscle_level: string | null;
  trunk_impedance_high: number | null;
  trunk_impedance_low: number | null;

  right_leg_fat_mass: number | null;
  right_leg_fat_pct: number | null;
  right_leg_fat_level: string | null;
  right_leg_muscle_mass: number | null;
  right_leg_muscle_pct: number | null;
  right_leg_muscle_level: string | null;
  right_leg_impedance_high: number | null;
  right_leg_impedance_low: number | null;

  left_leg_fat_mass: number | null;
  left_leg_fat_pct: number | null;
  left_leg_fat_level: string | null;
  left_leg_muscle_mass: number | null;
  left_leg_muscle_pct: number | null;
  left_leg_muscle_level: string | null;
  left_leg_impedance_high: number | null;
  left_leg_impedance_low: number | null;
}

export interface UploadResponse {
  message: string;
  inserted: number;
  updated: number;
  total_processed: number;
}

export interface FailedDeletion {
  id: number;
  reason: string;
}

export interface DeleteRecordsResponse {
  deleted: number[];
  failed: FailedDeletion[];
}


const TOKEN_KEY = 'fitdays_token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeAuthToken = (): void => localStorage.removeItem(TOKEN_KEY);

interface FetchOptions extends RequestInit {
  json?: any;
  formData?: FormData;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.json) {
    headers.set('Content-Type', 'application/json');
    fetchOptions.body = JSON.stringify(options.json);
  } else if (options.formData) {
    // Note: Do NOT set Content-Type header manually for FormData,
    // the browser needs to set the boundary parameter automatically.
    fetchOptions.body = options.formData;
  }

  const response = await fetch(endpoint, fetchOptions);

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      // Dispatch custom event to let the app know session expired
      window.dispatchEvent(new Event('auth-session-expired'));
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON parsing failed, keep default error
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 or files with no content returned)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  async register(
    login: string,
    email: string,
    password: string,
    display_name: string,
    gender: string,
    birthday: string,
    height_cm: number,
    target_weight_kg: number,
    preferred_language: string
  ): Promise<User> {
    return apiFetch<User>('/api/users/register', {
      method: 'POST',
      json: {
        login,
        email,
        password,
        display_name,
        gender,
        birthday,
        height_cm,
        target_weight_kg,
        preferred_language
      },
    });
  },

  async login(login: string, password: string): Promise<{ access_token: string; token_type: string }> {
    // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', login);
    params.append('password', password);

    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      let errorMessage = 'Incorrect login or password';
      try {
        const err = await response.json();
        errorMessage = err.detail || errorMessage;
      } catch {
        // use default
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    return apiFetch<User>('/api/users/me', {
      method: 'GET',
    });
  },

  async updateProfile(profileData: Partial<Omit<User, 'id' | 'created_at' | 'profile_image_path' | 'profile_image_url'>>): Promise<User> {
    return apiFetch<User>('/api/users/profile', {
      method: 'PUT',
      json: profileData,
    });
  },

  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<User>('/api/users/profile-picture', {
      method: 'POST',
      formData,
    });
  },

  async getSummary(): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>('/api/records/summary', {
      method: 'GET',
    });
  },

  async getRecords(): Promise<FitdaysRecord[]> {
    return apiFetch<FitdaysRecord[]>('/api/records', {
      method: 'GET',
    });
  },

  async uploadCSV(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<UploadResponse>('/api/records/upload', {
      method: 'POST',
      formData,
    });
  },

  async deleteRecords(ids: number[]): Promise<DeleteRecordsResponse> {
    return apiFetch<DeleteRecordsResponse>('/api/records/delete', {
      method: 'POST',
      json: { ids },
    });
  },
};
