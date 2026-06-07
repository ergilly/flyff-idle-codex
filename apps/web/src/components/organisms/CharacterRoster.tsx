"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { Stack } from "@/components/atoms/Stack";
import { CharacterCard } from "@/components/molecules/CharacterCard";
import { CharacterDeleteDialog } from "@/components/molecules/CharacterDeleteDialog";
import { deleteCharacter, fetchCharacters, type Character } from "@/lib/api";
import { spacing } from "@/styles/tokens";

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
    <>
      <Stack>
      <div className="character-roster-topbar">
        <MutedText>Choose who will begin the grind.</MutedText>
        <Button type="button" onClick={handleLogout}>
          Log out
        </Button>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      <div className="character-roster-grid" aria-label="Character roster">
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
      <style>{`
        .character-roster-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: ${spacing["2xl"]};
          margin-bottom: ${spacing["4xl"]};
        }

        .character-roster-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: ${spacing["2xl"]};
        }

        @media (max-width: 920px) {
          .character-roster-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .character-roster-topbar {
            display: grid;
          }

          .character-roster-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
