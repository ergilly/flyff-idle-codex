"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { Stack } from "@/components/atoms/Stack";
import { TextField } from "@/components/atoms/TextField";
import { PageHeader } from "@/components/molecules/PageHeader";
import { GameTemplate } from "@/components/templates/GameTemplate";
import { createCharacter, type CharacterGender } from "@/lib/api";
import { borders, colors, outlines, radii, spacing, typography } from "@/styles/tokens";

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
          <Stack>
            <h2>{name.trim() || "New Vagrant"}</h2>
            <MutedText>Level 1 Vagrant - {gender === "male" ? "Male" : "Female"}</MutedText>
          </Stack>
          <div className="stat-pill-grid" aria-label="Starting stats">
            <span>STR 15</span>
            <span>STA 15</span>
            <span>DEX 15</span>
            <span>INT 15</span>
          </div>
        </section>

        <Stack as="form" className="creation-form" onSubmit={handleSubmit}>
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
          <Actions>
            <Button variant="secondary" type="button" onClick={() => router.push("/characters")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create character"}
            </Button>
          </Actions>
        </Stack>
      </div>
      <style>{`
        .creation-layout {
          display: grid;
          grid-template-columns: minmax(240px, 0.85fr) minmax(0, 1.15fr);
          gap: 20px;
        }

        .creation-preview,
        .creation-form {
          border: ${borders.default};
          border-radius: ${radii.md};
          background: ${colors.panel};
          padding: ${spacing["4xl"]};
        }

        .creation-preview {
          display: grid;
          align-content: center;
          gap: ${spacing["3xl"]};
          min-height: 312px;
          text-align: center;
        }

        .creation-class-logo {
          justify-self: center;
          width: 96px;
          height: 96px;
          object-fit: contain;
        }

        .stat-pill-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: ${spacing.md};
        }

        .stat-pill-grid span {
          border: ${borders.default};
          border-radius: ${radii.sm};
          background: ${colors.panelMuted};
          padding: 9px ${spacing.md};
          color: ${colors.textMuted};
          font-size: 0.88rem;
          font-weight: ${typography.weightHeavy};
        }

        .field {
          display: grid;
          gap: ${spacing.sm};
        }

        .field-label {
          font-size: ${typography.fieldLabelSize};
          font-weight: ${typography.weightBold};
        }

        .gender-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: ${spacing.md};
        }

        .gender-option {
          position: relative;
          display: grid;
          min-height: 44px;
          place-items: center;
          border: ${borders.default};
          border-radius: ${radii.sm};
          background: ${colors.panelMuted};
          color: ${colors.textMuted};
          cursor: pointer;
          font-weight: ${typography.weightHeavy};
        }

        .gender-option input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .gender-option span {
          pointer-events: none;
        }

        .gender-option:has(input:checked) {
          border-color: ${colors.primary};
          background: ${colors.panelElevated};
          color: ${colors.foreground};
          box-shadow: inset 0 0 0 1px ${colors.primary};
        }

        .gender-option:has(input:focus-visible) {
          outline: ${outlines.focusPrimary};
          outline-offset: ${spacing.px1};
        }

        @media (max-width: 920px) {
          .creation-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </GameTemplate>
  );
}
