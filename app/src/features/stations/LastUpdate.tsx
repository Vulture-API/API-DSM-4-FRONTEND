import { formatLastUpdate } from "./last-update";

export function LastUpdate({ lastUpdate, stationName }: {
  lastUpdate: string | null | undefined;
  stationName: string;
}) {
  const formatted = formatLastUpdate(lastUpdate);
  return (
    <span className="block text-xs text-muted" aria-label={`Última atualização de ${stationName}`}>
      {formatted
        ? <>Última atualização: <time dateTime={new Date(lastUpdate!).toISOString()}>{formatted}</time></>
        : "Última atualização indisponível"}
    </span>
  );
}
