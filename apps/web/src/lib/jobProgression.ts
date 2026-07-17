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

const firstJobs = new Set(jobProgressionPaths.map((path) => path[2]));
const secondJobs = new Set(jobProgressionPaths.map((path) => path[1]));

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

export function getFirstJob(job: string) {
  return getJobLineage(job).find((lineageJob) => firstJobs.has(lineageJob));
}

export function getSecondJob(job: string) {
  return getJobLineage(job).find((lineageJob) => secondJobs.has(lineageJob));
}
