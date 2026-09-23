import { z } from "zod";

export const createUserSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do usuário."),

  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido."),

  cargo_id: z.coerce
    .number()
    .int()
    .positive("Selecione um cargo."),

  senha: z.string().min(1, "Informe a senha."),

  ativo: z.boolean(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;