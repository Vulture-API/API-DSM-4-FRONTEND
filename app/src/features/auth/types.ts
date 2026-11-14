export type AuthUser = {
  id: number;
  role_id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
  permissions: string[];
  role_name?: string;
  property_ids?: number[] | null;
};
