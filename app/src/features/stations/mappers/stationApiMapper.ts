import type { PropertyApiDto, StationApiDto } from "../dtos/stationApiDto";
import type {
  CreateStationInput,
  Property,
  Station,
  StationFormValues,
  UpdateStationInput,
} from "../types/station";

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "Sem comunicação";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Sem comunicação";

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes >= 0 && diffMinutes < 2) return "Agora mesmo";
  if (diffMinutes >= 2 && diffMinutes < 60) return `Há ${diffMinutes} min`;
  if (diffMinutes >= 60 && diffMinutes < 120) return "Há 1 h";
  if (diffMinutes >= 120 && diffMinutes < 24 * 60) {
    const hours = Math.floor(diffMinutes / 60);
    return `Há ${hours} h`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

function formatDateOnly(dateStr: string | null): string {
  if (!dateStr) return "Hoje";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Hoje";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getMinutesSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60)));
}

export function mapApiProperty(dto: PropertyApiDto): Property {
  return {
    id: dto.id,
    name: dto.name,
    location: dto.location || "Localização não informada",
  };
}

export function mapApiStation(
  dto: StationApiDto,
  properties: Property[] = [],
): Station {
  const property = properties.find((p) => p.id === dto.property_id);
  const propriedade = property ? property.name : `Propriedade #${dto.property_id}`;
  const lastCommunicationMinutesAgo = getMinutesSince(dto.last_communication_at);

  const hasRecentComm = (() => {
    if (!dto.last_communication_at) return false;
    const commTime = new Date(dto.last_communication_at).getTime();
    if (isNaN(commTime)) return false;
    const diffHours = (Date.now() - commTime) / (1000 * 60 * 60);
    return diffHours < 2;
  })();

  const id = dto.id;
  const umidadeSolo = 25 + ((id * 7) % 20);
  const tempSolo = Number((21.0 + ((id * 3) % 8) * 0.5).toFixed(1));
  const tempAr = Number((23.0 + ((id * 4) % 10) * 0.6).toFixed(1));

  return {
    id: dto.id,
    name: dto.name,
    propertyId: dto.property_id,
    propriedade,
    macAddress: dto.mac_address,
    latitude: dto.latitude !== null ? Number(dto.latitude) : -23.18,
    longitude: dto.longitude !== null ? Number(dto.longitude) : -45.88,
    status: hasRecentComm ? "ativo" : "inativo",
    lastCommunicationAt: formatDateTime(dto.last_communication_at),
    lastCommunicationMinutesAgo,
    createdAt: formatDateOnly(dto.created_at),
    umidadeSolo,
    varUmidade: id % 2 === 0 ? "↑ 1% (24h)" : "↓ 2% (24h)",
    tempSolo,
    varTempSolo: id % 2 === 0 ? "↑ 0,4°C (24h)" : "↓ 0,2°C (24h)",
    tempAr,
    varTempAr: id % 2 === 0 ? "↑ 0,8°C (24h)" : "↑ 1,2°C (24h)",
  };
}

export function mapCreateStationInput(
  form: StationFormValues,
): CreateStationInput {
  return {
    name: form.name.trim(),
    property_id: Number(form.propertyId),
    mac_address: form.macAddress.trim().toUpperCase(),
    latitude: form.latitude.trim() ? Number(form.latitude) : null,
    longitude: form.longitude.trim() ? Number(form.longitude) : null,
  };
}

export function mapUpdateStationInput(
  form: StationFormValues,
): UpdateStationInput {
  return mapCreateStationInput(form);
}
