import { expectVersion, loadAuthoredContent } from "../content/authoredContent.js";

const jobProgressionPaths = loadAuthoredContent("progression/jobs.json", (value, filePath) => {
  const document = expectVersion(value, filePath);

  if (!Array.isArray(document.paths) || !document.paths.every(isJobPath)) {
    throw new Error(`Invalid authored content at ${filePath}: paths must contain job name arrays`);
  }

  return document.paths;
});

function isJobPath(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((job) => typeof job === "string");
}

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
