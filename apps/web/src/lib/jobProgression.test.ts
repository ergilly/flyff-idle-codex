import { getFirstJob, getJobLineage, getSecondJob, meetsRequiredJobForJob } from "@/lib/jobProgression";

describe("jobProgression", () => {
  it.each([
    ["Slayer", "Blade", "Mercenary"],
    ["Templar", "Knight", "Mercenary"],
    ["Arcanist", "Elementor", "Magician"],
    ["Mentalist", "Psykeeper", "Magician"],
    ["Forcemaster", "Billposter", "Assist"],
    ["Seraph", "Ringmaster", "Assist"],
    ["Harlequin", "Jester", "Acrobat"],
    ["Crackshooter", "Ranger", "Acrobat"]
  ])("resolves the complete %s lineage", (thirdJob, secondJob, firstJob) => {
    expect(getJobLineage(thirdJob)).toEqual([thirdJob, secondJob, firstJob, "Vagrant"]);
    expect(getJobLineage(secondJob)).toEqual([secondJob, firstJob, "Vagrant"]);
    expect(getJobLineage(firstJob)).toEqual([firstJob, "Vagrant"]);
    expect(getFirstJob(thirdJob)).toBe(firstJob);
    expect(getSecondJob(thirdJob)).toBe(secondJob);
    expect(meetsRequiredJobForJob(thirdJob, secondJob)).toBe(true);
    expect(meetsRequiredJobForJob(thirdJob, firstJob)).toBe(true);
    expect(meetsRequiredJobForJob(thirdJob, "Vagrant")).toBe(true);
  });

  it("normalizes requirements and rejects unrelated jobs", () => {
    expect(meetsRequiredJobForJob("Slayer", "merc enary")).toBe(true);
    expect(meetsRequiredJobForJob("Slayer", "Assist")).toBe(false);
    expect(getJobLineage("Vagrant")).toEqual(["Vagrant"]);
  });
});
