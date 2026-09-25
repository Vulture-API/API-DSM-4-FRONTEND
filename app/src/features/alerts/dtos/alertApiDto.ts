export type ApiComparisonOperator = ">" | "<" | ">=" | "<=" | "=" | "!=";

export type ApiAlertConfigDto = {
  id: number;
  manager_user_id?: number | null;
  sensor_id: number;
  reference_value: number;
  comparison_operator: ApiComparisonOperator;
  message?: string | null;
  active: boolean;
  created_at: string;
};

export type ApiAlertConfigInputDto = {
  manager_user_id?: number | null;
  sensor_id: number;
  reference_value: number;
  comparison_operator: ApiComparisonOperator;
  message?: string | null;
  active?: boolean;
};

export type ApiPaginationMetaDto = {
  total_records: number;
  total_pages: number;
  current_page: number;
};

export type ApiPaginatedAlertConfigsDto = {
  data: ApiAlertConfigDto[];
  meta: ApiPaginationMetaDto;
};

export type ApiTriggeredAlertDto = {
  id: number;
  alert_config_id: number;
  reading_id: number;
  acknowledged_by?: number | null;
  triggered_at: string;
  acknowledged_at?: string | null;
};

export type ApiPaginatedTriggeredAlertsDto = {
  data: ApiTriggeredAlertDto[];
  meta: ApiPaginationMetaDto;
};

export type ApiStationDto = {
  id: number;
  property_id: number;
  mac_address: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  last_communication_at?: string | null;
  created_at: string;
};

export type ApiPaginatedStationsDto = {
  data: ApiStationDto[];
  meta: ApiPaginationMetaDto;
};

export type ApiSensorDto = {
  id: number;
  station_id: number;
  sensor_type_id: number;
  local_identifier: string;
  operational_status: boolean;
  created_at: string;
};

export type ApiPaginatedSensorsDto = {
  data: ApiSensorDto[];
  meta: ApiPaginationMetaDto;
};

export type ApiSensorTypeDto = {
  id: number;
  name: string;
  unit_of_measure: string;
  factor?: number | null;
  gain?: number | null;
};

export type ApiPropertyDto = {
  id: number;
  name: string;
  owner_user_id: number;
  location?: string | null;
  created_at: string;
};

export type ApiPaginatedPropertiesDto = {
  data: ApiPropertyDto[];
  meta: ApiPaginationMetaDto;
};

export type ApiReadingDto = {
  id: number;
  sensor_id: number;
  value: number;
  unix_time: number;
  data_consistent: boolean;
  created_at: string;
};
