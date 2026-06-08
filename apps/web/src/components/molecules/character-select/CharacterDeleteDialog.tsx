"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { Stack } from "@/components/atoms/Stack";
import { TextField } from "@/components/atoms/TextField";
import type { Character } from "@/lib/api";

type CharacterDeleteDialogProps = {
  character: Character;
  error?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

export function CharacterDeleteDialog({
  character,
  error,
  isDeleting = false,
  onCancel,
  onConfirm
}: CharacterDeleteDialogProps) {
  const [name, setName] = useState("");
  const canConfirm = name === character.name && !isDeleting;

  useEffect(() => {
    setName("");
  }, [character.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canConfirm) {
      onConfirm(name);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-[rgba(8,12,18,0.72)] p-[18px]"
      role="presentation"
    >
      <section
        aria-describedby="delete-character-description"
        aria-labelledby="delete-character-title"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-card border border-border bg-panel-shell p-6 shadow-shell"
        role="dialog"
      >
        <Stack as="form" onSubmit={handleSubmit}>
          <Stack>
            <h2 className="m-0 text-[1.15rem]" id="delete-character-title">
              Delete {character.name}
            </h2>
            <MutedText id="delete-character-description">
              Enter the character name to permanently delete this slot.
            </MutedText>
          </Stack>
          {error ? <ErrorMessage message={error} /> : null}
          <TextField
            autoComplete="off"
            id="delete-character-name"
            label="Character name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <Actions>
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canConfirm}>
              {isDeleting ? "Deleting..." : "Delete character"}
            </Button>
          </Actions>
        </Stack>
      </section>
    </div>
  );
}
