"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { TextField } from "@/components/atoms/TextField";
import { PageHeader } from "@/components/molecules/PageHeader";
import { GameTemplate } from "@/components/templates/GameTemplate";
import { createCharacter, type CharacterGender } from "@/lib/api";

type CharacterCreationPageProps = {
  slot?: string;
};

function getSlotIndex(slot?: string) {
  const slotNumber = Number(slot);

  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 8) {
    return 0;
  }

  return slotNumber - 1;
}

export function CharacterCreationPage({ slot }: CharacterCreationPageProps) {
  const router = useRouter();
  const slotIndex = useMemo(() => getSlotIndex(slot), [slot]);
  const slotNumber = slotIndex + 1;
  const [name, setName] = useState("");
  const [gender, setGender] = useState<CharacterGender>("male");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      setError("Character name must be at least 3 characters.");
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCharacter(token, slotIndex, trimmedName, gender);
      router.replace("/characters");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create character");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GameTemplate>
      <PageHeader
        eyebrow="Character Creation"
        title={`Slot ${slotNumber}`}
        description="Create the adventurer who will start your idle journey."
      />
      <div className="creation-layout">
        <section className="creation-preview" aria-label="New character preview">
          <Image
            className="creation-class-logo"
            src="/images/classes/vagrant.png"
            alt="Vagrant class logo"
            width={96}
            height={96}
          />
          <div className="stack">
            <h2>{name.trim() || "New Vagrant"}</h2>
            <p className="muted">Level 1 Vagrant - {gender === "male" ? "Male" : "Female"}</p>
          </div>
          <div className="stat-pill-grid" aria-label="Starting stats">
            <span>STR 15</span>
            <span>STA 15</span>
            <span>DEX 15</span>
            <span>INT 15</span>
          </div>
        </section>

        <form className="creation-form stack" onSubmit={handleSubmit}>
          {error ? <ErrorMessage message={error} /> : null}
          <TextField
            id="character-name"
            label="Character name"
            maxLength={16}
            minLength={3}
            onChange={(event) => setName(event.target.value)}
            pattern="[A-Za-z][A-Za-z0-9 ]*"
            placeholder="FlarisHero"
            required
            value={name}
          />
          <div className="field">
            <span className="field-label">Gender</span>
            <div className="gender-options" role="radiogroup" aria-label="Gender">
              <label className="gender-option">
                <input
                  checked={gender === "male"}
                  name="gender"
                  onChange={() => setGender("male")}
                  type="radio"
                  value="male"
                />
                <span>Male</span>
              </label>
              <label className="gender-option">
                <input
                  checked={gender === "female"}
                  name="gender"
                  onChange={() => setGender("female")}
                  type="radio"
                  value="female"
                />
                <span>Female</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => router.push("/characters")}>
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create character"}
            </Button>
          </div>
        </form>
      </div>
    </GameTemplate>
  );
}
