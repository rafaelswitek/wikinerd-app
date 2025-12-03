export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio?: string;
  website?: string;
  email: string;
  created_at: string;
}

export interface AuthContextData {
  signed: boolean;
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  signIn: (data: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
}