import { FiveElementsResultView } from "@/components/fiveElements/FiveElementsResultView";

export default async function FiveElementsResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FiveElementsResultView id={id} />;
}
