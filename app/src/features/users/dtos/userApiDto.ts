export type ApiUserDto = {
  id: number;
  role_id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
};

export type ApiRoleDto = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type ApiPaginationMetaDto = {
  total_records: number;
  total_pages: number;
  current_page: number;
};

export type ApiPaginatedUsersDto = {
  data: ApiUserDto[];
  meta: ApiPaginationMetaDto;
};

export type ApiCreateUserDto = {
  role_id: number;
  name: string;
  email: string;
  password: string;
  active: boolean;
};

export type ApiUpdateUserDto = {
  role_id: number;
  name: string;
  active: boolean;
};
