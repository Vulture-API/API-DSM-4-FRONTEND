import { Icon } from "@/components/ui/Icon/Icon";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import type { Parameter } from "../types/parameter";
import styles from "./ParametersTable.module.css";

const measurementIcons = {
  "°C": "thermometer",
  "%": "drop",
  "m/s": "wind",
  "°": "direction",
  "mm": "rain",
  "hPa": "gauge",
} as const;
const number = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function ParametersTable({
  parameters,
  total,
  onEdit,
  onRemove,
  disabled,
}: {
  parameters: Parameter[];
  total: number;
  onEdit: (parameter: Parameter) => void;
  onRemove: (parameter: Parameter) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.card}>
      <div
        className={styles.scroll}
        role="region"
        aria-label="Tabela de parâmetros"
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.caption}>
            Parâmetros meteorológicos cadastrados
          </caption>
          <thead>
            <tr>
              <th scope="col">Parâmetro</th>
              <th scope="col">Unidade de medida</th>
              <th scope="col">Fator</th>
              <th scope="col">Ganho</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter) => (
              <tr key={parameter.id}>
                <td>
                  <div className={styles.identity}>
                    <span className={styles.symbol}>
                      <Icon
                        name={
                          measurementIcons[
                            parameter.unidade_medida as keyof typeof measurementIcons
                          ] ?? "gauge"
                        }
                      />
                    </span>
                    <span title={parameter.nome}>{parameter.nome}</span>
                  </div>
                </td>
                <td className={styles.unit}>{parameter.unidade_medida}</td>
                <td className={styles.numeric}>
                  {parameter.fator === null
                    ? "—"
                    : number.format(parameter.fator)}
                </td>
                <td className={styles.numeric}>
                  {parameter.ganho === null
                    ? "—"
                    : number.format(parameter.ganho)}
                </td>
                <td>
                  <div className={styles.actions}>
                    <IconButton
                      variant="outline"
                      label={`Editar ${parameter.nome}`}
                      onClick={() => onEdit(parameter)}
                      disabled={disabled}
                    >
                      <Icon name="edit" />
                    </IconButton>
                    <IconButton
                      variant="outline"
                      label={`Remover ${parameter.nome}`}
                      onClick={() => onRemove(parameter)}
                      disabled={disabled}
                    >
                      <Icon name="trash" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.footer}>
        Mostrando {parameters.length} de {total} parâmetros
      </div>
    </div>
  );
}
