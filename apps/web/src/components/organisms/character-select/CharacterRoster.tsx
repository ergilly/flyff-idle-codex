"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { Stack } from "@/components/atoms/Stack";
import { CharacterCard } from "@/components/molecules/character-select/CharacterCard";
import { CharacterDeleteDialog } from "@/components/molecules/character-select/CharacterDeleteDialog";
import { deleteCharacter, fetchCharacters, type Character } from "@/lib/api";

const characterSlotCount = 8;

export function CharacterRoster() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
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

  function handleSelect(character: Character) {
    localStorage.setItem("flyffIdleSelectedCharacterId", character.id);
    router.push("/game");
  }

  async function handleDelete(name: string) {
    if (!characterToDelete) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");
    const characterId = characterToDelete.id;

    if (!token) {
      router.replace("/");
      return;
    }

    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteCharacter(token, characterId, name);
      setCharacters((currentCharacters) =>
        currentCharacters.filter((character) => character.id !== characterId)
      );
      setCharacterToDelete(null);
    } catch (deleteCharacterError) {
      setDeleteError(
        deleteCharacterError instanceof Error ? deleteCharacterError.message : "Unable to delete character"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <MutedText>Loading characters...</MutedText>;
  }

  return (
    <Stack>
      <div className="mb-[22px] flex items-start justify-between gap-4 max-[560px]:grid">
        <MutedText>Choose who will begin the grind.</MutedText>
        <Button type="button" onClick={handleLogout}>
          Log out
        </Button>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      <div
        className="grid grid-cols-4 gap-4 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1"
        aria-label="Character roster"
      >
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
                onDelete={(selectedCharacter) => {
                  setDeleteError("");
                  setCharacterToDelete(selectedCharacter);
                }}
                onSelect={handleSelect}
                slotNumber={slotNumber}
              />
            );
          });
        })()}
      </div>
      {characterToDelete ? (
        <CharacterDeleteDialog
          character={characterToDelete}
          error={deleteError}
          isDeleting={isDeleting}
          onCancel={() => setCharacterToDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </Stack>
  );
}
