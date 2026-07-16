"use client";

import { useSearchParams } from "next/navigation";

import { CharacterCreationPage } from "@/components/pages/CharacterCreationPage";

export function CreateCharacterRouteClient() {
  const searchParams = useSearchParams();

  return <CharacterCreationPage slot={searchParams.get("slot") ?? undefined} />;
}
