import { BirthInfoView } from "@/components/fiveElements/BirthInfoView";

export default async function BirthInfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BirthInfoView id={id} />;
}
