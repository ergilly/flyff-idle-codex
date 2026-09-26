import authoredCombatConstants from "../../../../../content/authored/combat/constants.json";
import { type JobCombatConstants } from "@/lib/combat/types";

export const defaultWeaponFactors: Record<string, number> = authoredCombatConstants.defaultWeaponFactors;

export const weaponSpeedModifiers: Record<string, number> = authoredCombatConstants.weaponSpeedModifiers;

export const jobConstants: Record<string, JobCombatConstants> = authoredCombatConstants.jobs;
