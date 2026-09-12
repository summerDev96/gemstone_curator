import { FiveElementsIntroView } from "@/components/fiveElements/FiveElementsIntroView";

export default async function FiveElementsIntroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FiveElementsIntroView id={id} />;
}
