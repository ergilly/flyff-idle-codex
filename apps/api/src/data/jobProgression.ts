const jobProgressionPaths: ReadonlyArray<readonly string[]> = [
  ["Slayer", "Blade", "Mercenary", "Vagrant"],
  ["Templar", "Knight", "Mercenary", "Vagrant"],
  ["Arcanist", "Elementor", "Magician", "Vagrant"],
  ["Mentalist", "Psykeeper", "Magician", "Vagrant"],
  ["Forcemaster", "Billposter", "Assist", "Vagrant"],
  ["Seraph", "Ringmaster", "Assist", "Vagrant"],
  ["Harlequin", "Jester", "Acrobat", "Vagrant"],
  ["Crackshooter", "Ranger", "Acrobat", "Vagrant"]
];

function normalizeJob(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function getJobLineage(job: string): string[] {
  const path = jobProgressionPaths.find((candidate) => candidate.includes(job));

  if (!path) {
    return job === "Vagrant" ? [job] : [job, "Vagrant"];
  }

  return path.slice(path.indexOf(job));
}

export function meetsRequiredJobForJob(job: string, requiredJob: string) {
  const normalizedRequirement = normalizeJob(requiredJob);

  return getJobLineage(job).some((lineageJob) => normalizeJob(lineageJob) === normalizedRequirement);
}
