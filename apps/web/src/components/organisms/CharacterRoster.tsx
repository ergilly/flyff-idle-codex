"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { CharacterCard } from "@/components/molecules/CharacterCard";
import { fetchCharacters, type Character } from "@/lib/api";

const characterSlotCount = 8;

export function CharacterRoster() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    fetchCharacters(token)
      .then(setCharacters)
      .catch(() => setError("Your session could not load any characters."))
      .finally(() => setIsLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("flyffIdleToken");
    localStorage.removeItem("flyffIdleUser");
    router.replace("/");
  }

  function handleCreate(slotIndex: number) {
    router.push(`/characters/create?slot=${slotIndex + 1}`);
  }

  if (isLoading) {
    return <p className="muted">Loading characters...</p>;
  }

  return (
    <div className="stack">
      <div className="topbar">
        <p className="muted">Choose who will begin the grind.</p>
        <Button type="button" onClick={handleLogout}>
          Log out
        </Button>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      <div className="character-grid" aria-label="Character roster">
        {(() => {
          const charactersBySlot = new Map(characters.map((character) => [character.slotIndex, character]));

          return Array.from({ length: characterSlotCount }, (_slot, index) => {
            const character = charactersBySlot.get(index);
            const slotNumber = index + 1;

            return (
              <CharacterCard
                key={character?.id ?? `empty-slot-${slotNumber}`}
                character={character}
                onCreate={() => handleCreate(index)}
                slotNumber={slotNumber}
              />
            );
          });
        })()}
      </div>
    </div>
  );
}
