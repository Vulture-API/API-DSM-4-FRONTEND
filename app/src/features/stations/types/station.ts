export interface Station {
  id: number;
  name: string;
  propertyId: number;
  propriedade: string;
  macAddress: string;
  latitude: number;
  longitude: number;
  status: "ativo" | "inativo";
  lastCommunicationAt: string;
  createdAt: string;
  umidadeSolo?: number;
  varUmidade?: string;
  tempSolo?: number;
  varTempSolo?: string;
  tempAr?: number;
  varTempAr?: string;
}

export interface Property {
  id: number;
  name: string;
  location: string;
}

export interface StationFormValues {
  name: string;
  propertyId: string;
  macAddress: string;
  latitude: string;
  longitude: string;
  status: "ativo" | "inativo";
}

export interface CreateStationInput {
  name: string;
  property_id: number;
  mac_address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UpdateStationInput {
  name: string;
  property_id: number;
  mac_address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface StationListOptions {
  page?: number;
  limit?: number;
  propertyId?: number;
}

export interface PaginatedStations {
  items: Station[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
  };
}
