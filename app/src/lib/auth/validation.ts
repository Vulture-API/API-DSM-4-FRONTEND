/** Validação simples e linear; a validação completa continua no backend. */
export function isValidLoginEmail(value: string): boolean {
  // Limita o dado antes de percorrer ou normalizar a entrada não confiável.
  if (value.length > 150) return false;
  const email = value.trim();
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const dot = email.lastIndexOf(".");
  return dot > at + 1 && dot < email.length - 1 && !/\s/.test(email);
}
