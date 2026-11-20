// Canais da placa do datalogger (SCRUM-626, SCRUM-628). O firmware lê todos os
// pinos livres em toda coleta e envia o valor bruto (SCRUM-621); o sensor é
// vinculado à estação pelo identificador do canal e a calibração converte o
// bruto. O DHT22 é achado sozinho pelo firmware, em qualquer pino digital.

export type ChannelKind = "dht22" | "analog" | "pulse";

export type BoardChannel = {
  id: string;
  kind: ChannelKind;
  pin: number;
  /** O que o canal envia, sem calibração. */
  raw: string;
};

const ANALOG_PINS = [32, 33, 34, 35, 36, 39];
const DIGITAL_PINS = [4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 26, 27];

export const BOARD_CHANNELS: readonly BoardChannel[] = [
  { id: "temp", kind: "dht22", pin: 4, raw: "°C, de -40 a 80" },
  { id: "umid", kind: "dht22", pin: 4, raw: "%, de 0 a 100" },
  ...ANALOG_PINS.map((pin) => ({ id: `an${pin}`, kind: "analog" as const, pin, raw: "0 a 4095 (0 a 3,3 V)" })),
  ...[...ANALOG_PINS, ...DIGITAL_PINS].map((pin) => ({
    id: `pu${pin}`,
    kind: "pulse" as const,
    pin,
    raw: "pulsos desde o último envio",
  })),
];

const KIND_LABEL: Record<ChannelKind, string> = {
  dht22: "DHT22",
  analog: "Analógico",
  pulse: "Pulsos",
};

const CALIBRATION_HINT: Record<ChannelKind, string> = {
  dht22: "Já chega na unidade; calibração só para correção fina.",
  analog: "Ganho 0,000805860805 (3,3 / 4095) converte para volts; para outra unidade, use a escala do sensor.",
  pulse: "Ganho = unidade por pulso, ex.: pluviômetro de 0,2 mm → 0,2.",
};

const normalize = (identifier: string) => identifier.trim().toLowerCase();

/** O sistema compara o identificador sem diferenciar maiúsculas. */
export function findChannel(identifier: string): BoardChannel | undefined {
  const key = normalize(identifier);
  return BOARD_CHANNELS.find((channel) => channel.id === key);
}

export function channelLabel(channel: BoardChannel): string {
  if (channel.kind === "dht22") return `${channel.id} · ${KIND_LABEL.dht22}`;
  return `${channel.id} · ${KIND_LABEL[channel.kind]} GPIO${channel.pin}`;
}

export function channelHint(channel: BoardChannel): string {
  return `Envia ${channel.raw}. ${CALIBRATION_HINT[channel.kind]}`;
}

/** Canais sem sensor na estação; o identificador atual (edição) continua disponível. */
export function availableChannels(usedIdentifiers: readonly string[], current = ""): BoardChannel[] {
  const used = new Set(usedIdentifiers.map(normalize));
  used.delete(normalize(current));
  return BOARD_CHANNELS.filter((channel) => !used.has(channel.id));
}
