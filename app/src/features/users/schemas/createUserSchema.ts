import { z } from "zod";

export const createUserSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do usuário.").max(150, "Use no máximo 150 caracteres."),

  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido.").max(150, "Use no máximo 150 caracteres.").toLowerCase(),

  cargo_id: z
    .number({ error: "Selecione um cargo." })
    .int()
    .positive("Selecione um cargo."),

  senha: z.string().min(8, "Use no mínimo 8 caracteres."),

  ativo: z.boolean(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;