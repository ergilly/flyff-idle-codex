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
import { cx } from "@/lib/classNames";

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
      <div className="grid grid-cols-[minmax(240px,0.85fr)_minmax(0,1.15fr)] gap-5 max-[920px]:grid-cols-1">
        <section
          className="grid min-h-[312px] content-center gap-[18px] rounded-card border border-border bg-panel p-[22px] text-center [&_h2]:m-0 [&_h2]:text-[1.15rem]"
          aria-label="New character preview"
        >
          <Image
            className="h-24 w-24 justify-self-center object-contain"
            src="/images/classes/vagrant.png"
            alt="Vagrant class logo"
            width={96}
            height={96}
          />
          <Stack>
            <h2>{name.trim() || "New Vagrant"}</h2>
            <MutedText>Level 1 Vagrant - {gender === "male" ? "Male" : "Female"}</MutedText>
          </Stack>
          <div
            className="grid grid-cols-2 gap-2.5 [&_span]:rounded-control [&_span]:border [&_span]:border-border [&_span]:bg-panel-muted [&_span]:px-2.5 [&_span]:py-[9px] [&_span]:text-[0.88rem] [&_span]:font-extrabold [&_span]:text-text-muted"
            aria-label="Starting stats"
          >
            <span>STR 15</span>
            <span>STA 15</span>
            <span>DEX 15</span>
            <span>INT 15</span>
          </div>
        </section>

        <Stack
          as="form"
          className="rounded-card border border-border bg-panel p-[22px]"
          onSubmit={handleSubmit}
        >
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
          <div className="grid gap-2">
            <span className="text-[0.9rem] font-bold">Gender</span>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Gender">
              <label
                className={cx(
                  "relative grid min-h-11 cursor-pointer place-items-center rounded-control border border-border bg-panel-muted font-extrabold text-text-muted has-focus-visible:outline-[2px_solid_rgba(88,166,201,0.28)] has-focus-visible:outline-offset-[2px]",
                  gender === "male" &&
                    "border-primary bg-panel-elevated text-foreground shadow-[inset_0_0_0_1px_var(--primary)]"
                )}
              >
                <input
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  checked={gender === "male"}
                  name="gender"
                  onChange={() => setGender("male")}
                  type="radio"
                  value="male"
                />
                <span className="pointer-events-none">Male</span>
              </label>
              <label
                className={cx(
                  "relative grid min-h-11 cursor-pointer place-items-center rounded-control border border-border bg-panel-muted font-extrabold text-text-muted has-focus-visible:outline-[2px_solid_rgba(88,166,201,0.28)] has-focus-visible:outline-offset-[2px]",
                  gender === "female" &&
                    "border-primary bg-panel-elevated text-foreground shadow-[inset_0_0_0_1px_var(--primary)]"
                )}
              >
                <input
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  checked={gender === "female"}
                  name="gender"
                  onChange={() => setGender("female")}
                  type="radio"
                  value="female"
                />
                <span className="pointer-events-none">Female</span>
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
    </GameTemplate>
  );
}
