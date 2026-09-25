import { StationDetailPage } from "@/features/stations/StationDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StationDetailPage id={Number(id)} />;
}
