export const SESSION_EXPIRED = "agritech:session-expired";

export function pagePermission(path: string): string | null {
  if (path.startsWith("/administracao/usuarios")) return "users.read";
  // Ler tipos alimenta os filtros; administrar o catálogo exige permissão de edição.
  if (path.startsWith("/administracao/parametros")) return "sensor-types.update";
  if (path.startsWith("/alertas/regras") || path === "/regras") return "alert-configs.read";
  if (path.startsWith("/alertas")) return "triggered-alerts.read";
  if (path.startsWith("/estacoes")) return "stations.read";
  if (path.startsWith("/propriedades")) return "properties.read";
  if (path.startsWith("/dashboard") || path.startsWith("/historico")) return "monitoring.read";
  return null;
}

export function landingPage(permissions: string[]): string {
  return ["/dashboard", "/estacoes", "/alertas", "/alertas/regras", "/administracao/usuarios", "/administracao/parametros"]
    .find((path) => permissions.includes(pagePermission(path)!)) ?? "/acesso-negado";
}

export function safeDestination(value: string | null, permissions: string[]): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes(String.fromCharCode(92)) || Array.from(value).some((c) => c.charCodeAt(0) < 32)) return landingPage(permissions);
  const url = new URL(value, "https://portal.invalid");
  const permission = pagePermission(url.pathname);
  return url.origin === "https://portal.invalid" && permission && permissions.includes(permission)
    ? url.pathname + url.search : landingPage(permissions);
}

/** Same permission codes as the backend access policies; unknown resources fail closed. */
export function apiPermission(path: string[], method: string): string | null {
  const [resource, segment, action] = path;
  const read = method === "GET" || method === "HEAD";
  if (resource === "stations" && segment === "properties") return read ? "properties.read" : null;
  if (resource === "stations" && path.some((part) => ["overview", "current", "statistics", "forecast", "status", "readings"].includes(part))) return read ? "monitoring.read" : null;
  if (resource === "readings") return read ? "monitoring.read" : null;
  if (resource === "occurrences") return read ? "occurrences.read" : method === "PATCH" && action === "resolve" ? "occurrences.resolve" : null;
  if (resource === "permissions") return read ? "permissions.read" : null;
  if (resource === "roles" && action === "permissions") return read ? "roles.read" : method === "PUT" ? "roles.permissions.update" : null;
  if (resource === "alerts") {
    if (segment === "triggered") return read ? "triggered-alerts.read" : method === "PUT" && path[3] === "acknowledge" ? "triggered-alerts.acknowledge" : null;
    if (segment !== "config") return null;
  }
  const prefix = resource === "alerts" ? "alert-configs" : resource;
  if (!["users", "roles", "properties", "stations", "sensors", "sensor-types", "alert-configs"].includes(prefix ?? "")) return null;
  const operation = read ? "read" : method === "POST" ? "create" : ["PUT", "PATCH"].includes(method) ? "update" : method === "DELETE" ? "delete" : null;
  return operation ? `${prefix}.${operation}` : null;
}
