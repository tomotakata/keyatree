import FloorplanEditor from "@/components/floorplan/FloorplanEditor";
import { getProperty } from "@/lib/floorplanStore";

export default async function PropertyFloorplanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) return null;
  return <FloorplanEditor propertyId={property.id} propertyName={property.name} backHref={`/properties/${property.id}`} />;
}