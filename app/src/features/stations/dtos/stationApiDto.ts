export interface StationApiDto {
  id: number;
  property_id: number;
  mac_address: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  last_communication_at: string | null;
  created_at: string;
}

export interface PaginatedStationsApiDto {
  data: StationApiDto[];
  meta: {
    total_records: number;
    total_pages: number;
    current_page: number;
  };
}

export interface PropertyApiDto {
  id: number;
  name: string;
  location?: string | null;
}
