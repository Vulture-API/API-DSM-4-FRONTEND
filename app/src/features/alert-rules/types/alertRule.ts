export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '=' | '!=';

export interface AlertRule {
  id: number;
  sensorType: string;
  operator: ComparisonOperator;
  value: number;
  message: string;
  stations: string[];
  active: boolean;
  sensor_id?: string;
  reference_value?: number;
  comparison_operator?: ComparisonOperator;
}

export type AlertConfig = AlertRule;

export interface OperatorOption {
  label: string;
  value: ComparisonOperator;
}

export type DetailModalMode = 'view' | 'edit' | 'confirm_delete';
