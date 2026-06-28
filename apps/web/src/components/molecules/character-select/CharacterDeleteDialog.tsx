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
      data-testid="characters_delete_div_overlay"
      role="presentation"
    >
      <section
        aria-describedby="delete-character-description"
        aria-labelledby="delete-character-title"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-card border border-border bg-panel-shell p-6 shadow-shell"
        data-testid="characters_delete_section_dialog"
        role="dialog"
      >
        <Stack as="form" data-testid="characters_delete_form" onSubmit={handleSubmit}>
          <Stack>
            <h2
              className="m-0 text-[1.15rem]"
              data-testid="characters_delete_h2_title"
              id="delete-character-title"
            >
              Delete {character.name}
            </h2>
            <MutedText data-testid="characters_delete_p_description" id="delete-character-description">
              Enter the character name to permanently delete this slot.
            </MutedText>
          </Stack>
          {error ? <ErrorMessage message={error} testId="characters_delete_error" /> : null}
          <TextField
            autoComplete="off"
            data-testid="characters_delete_input_name"
            id="delete-character-name"
            label="Character name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <Actions>
            <Button
              data-testid="characters_delete_button_cancel"
              variant="secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button data-testid="characters_delete_button_confirm" type="submit" disabled={!canConfirm}>
              {isDeleting ? "Deleting..." : "Delete character"}
            </Button>
          </Actions>
        </Stack>
      </section>
    </div>
  );
}
