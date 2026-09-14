import { RelationshipView } from "@/components/relationship/RelationshipView";

export default async function RelationshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RelationshipView id={id} />;
}
