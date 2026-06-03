import { CharacterCreationPage } from "@/components/pages/CharacterCreationPage";

type CreateCharacterRouteProps = {
  searchParams: Promise<{
    slot?: string;
  }>;
};

export default async function CreateCharacterRoute({ searchParams }: CreateCharacterRouteProps) {
  const { slot } = await searchParams;

  return <CharacterCreationPage slot={slot} />;
}
