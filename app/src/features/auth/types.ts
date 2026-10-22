export type AuthUser = {
  id: number;
  role_id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
  permissions: string[];
};
