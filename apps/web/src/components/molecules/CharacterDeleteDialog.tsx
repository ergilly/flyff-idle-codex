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
import { borders, colors, overlayColors, radii, shadows, spacing } from "@/styles/tokens";

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
    <div className="modal-backdrop" role="presentation">
      <section
        aria-describedby="delete-character-description"
        aria-labelledby="delete-character-title"
        aria-modal="true"
        className="modal-panel"
        role="dialog"
      >
        <Stack as="form" onSubmit={handleSubmit}>
          <Stack>
            <h2 id="delete-character-title">Delete {character.name}</h2>
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
      <style>{`
        .modal-backdrop {
          position: fixed;
          z-index: 20;
          inset: 0;
          display: grid;
          place-items: center;
          padding: ${spacing["3xl"]};
          background: ${overlayColors.modalBackdrop};
        }

        .modal-panel {
          width: min(100%, 420px);
          border: ${borders.default};
          border-radius: ${radii.md};
          background: ${colors.panelShell};
          box-shadow: ${shadows.shell};
          padding: ${spacing["5xl"]};
        }
      `}</style>
    </div>
  );
}
