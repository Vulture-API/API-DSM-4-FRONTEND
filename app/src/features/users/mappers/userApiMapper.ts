import type {
  ApiCreateUserDto,
  ApiRoleDto,
  ApiUpdateUserDto,
  ApiUserDto,
} from "../dtos/userApiDto";
import type { CreateUserFormValues } from "../schemas/createUserSchema";
import type { EditUserFormValues } from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";

export function mapApiRole(role: ApiRoleDto): Cargo {
  return {
    id: role.id,
    nome: role.name,
    descricao: role.description,
    criado_em: role.created_at,
  };
}

export function mapApiUser(
  user: ApiUserDto,
  cargos: readonly Cargo[],
): UserListItem {
  const cargo = cargos.find(({ id }) => id === user.role_id);

  if (!cargo) {
    throw new Error(`Cargo ${user.role_id} do usuário ${user.id} não encontrado.`);
  }

  return {
    id: user.id,
    cargo_id: user.role_id,
    nome: user.name,
    email: user.email,
    ativo: user.active,
    criado_em: user.created_at,
    cargo: { id: cargo.id, nome: cargo.nome },
  };
}

export function mapCreateUserInput(
  values: CreateUserFormValues,
): ApiCreateUserDto {
  return {
    role_id: values.cargo_id,
    name: values.nome,
    email: values.email,
    password: values.senha,
    active: values.ativo,
  };
}

export function mapUpdateUserInput(
  values: EditUserFormValues,
): ApiUpdateUserDto {
  return {
    role_id: values.cargo_id,
    name: values.nome,
    active: values.ativo,
  };
}
