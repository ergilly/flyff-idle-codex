import authoredJobProgression from "../../../../content/authored/progression/jobs.json";

const jobProgressionPaths: ReadonlyArray<readonly string[]> = authoredJobProgression.paths;

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
