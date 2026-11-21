import { ApiError } from "@/lib/api/http";

export function collectionErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    if (error.status === 404)
      return "Estação não encontrada ou removida. Volte à lista de estações.";
    if (error.status === 403)
      return "Você não tem permissão para acessar a configuração da coleta.";
    if (error.status === 0 || error.status >= 500)
      return "Serviço de coleta indisponível. Tente novamente.";
  }
  return error.message;
}

export function collectionIntervalError(
  value: string,
  min: number,
  max: number,
): string | undefined {
  if (!value.trim()) return "Informe o intervalo de coleta.";
  if (!/^\d+$/.test(value.trim()) || !Number.isSafeInteger(Number(value)))
    return "Informe um número inteiro de segundos.";
  if (Number(value) < min || Number(value) > max)
    return `Use um intervalo entre ${min} e ${max} segundos.`;
}

export function formatCollectionInterval(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${seconds} segundos (${minutes} ${minutes === 1 ? "minuto" : "minutos"})`;
  }
  return `${seconds} segundos`;
}
