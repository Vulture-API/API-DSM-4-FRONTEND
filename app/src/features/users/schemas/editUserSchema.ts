import { z } from "zod";

export const editUserSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do usuário.").max(150, "O nome deve ter no máximo 150 caracteres."),
  cargo_id: z.number().int().positive("Selecione um cargo."),
  ativo: z.boolean(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
