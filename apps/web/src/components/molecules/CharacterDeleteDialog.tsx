"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
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
    <div className="modal-backdrop" role="presentation">
      <section
        aria-describedby="delete-character-description"
        aria-labelledby="delete-character-title"
        aria-modal="true"
        className="modal-panel"
        role="dialog"
      >
        <form className="stack" onSubmit={handleSubmit}>
          <div className="stack">
            <h2 id="delete-character-title">Delete {character.name}</h2>
            <p className="muted" id="delete-character-description">
              Enter the character name to permanently delete this slot.
            </p>
          </div>
          {error ? <ErrorMessage message={error} /> : null}
          <TextField
            autoComplete="off"
            id="delete-character-name"
            label="Character name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={onCancel}>
              Cancel
            </button>
            <Button type="submit" disabled={!canConfirm}>
              {isDeleting ? "Deleting..." : "Delete character"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
