import { Suspense } from "react";
import { CharacterCreationPage } from "@/components/pages/CharacterCreationPage";
import { CreateCharacterRouteClient } from "./CreateCharacterRouteClient";

export default function CreateCharacterRoute() {
  return (
    <Suspense fallback={<CharacterCreationPage />}>
      <CreateCharacterRouteClient />
    </Suspense>
  );
}
