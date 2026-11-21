import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "docs", "builds", "build-plan.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const builds = manifest.builds;
const errors = [];

if (manifest.version !== 1) {
  errors.push("Unsupported build-plan manifest version.");
}

if (!Array.isArray(builds) || builds.length !== 20) {
  errors.push("The build plan must contain exactly 20 builds.");
}

const byId = new Map();

for (const [index, build] of (Array.isArray(builds) ? builds : []).entries()) {
  const expectedId = `build-${index + 1}`;

  if (build.id !== expectedId) {
    errors.push(`Expected ${expectedId} at build index ${index + 1}.`);
  }

  if (byId.has(build.id)) {
    errors.push(`Duplicate build id: ${build.id}.`);
  }
  byId.set(build.id, build);

  const file = path.join(root, "docs", "builds", `${build.id}.md`);
  if (!fs.existsSync(file)) {
    errors.push(`Missing build document: docs/builds/${build.id}.md.`);
    continue;
  }

  const content = fs
    .readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
  if (!content.startsWith(`# Build ${index + 1}: ${build.title}\n`)) {
    errors.push(`Title mismatch in docs/builds/${build.id}.md.`);
  }
  if (
    !content.includes("## Copilot execution prompt") ||
    !content.includes(`in Milestone ${build.milestone}`)
  ) {
    errors.push(`Missing milestone-linked Copilot prompt in ${build.id}.`);
  }

  if (!build.milestone || !Array.isArray(build.dependsOn)) {
    errors.push(`Build ${build.id} requires a milestone and dependsOn array.`);
  }
}

for (const build of Array.isArray(builds) ? builds : []) {
  for (const dependency of Array.isArray(build.dependsOn) ? build.dependsOn : []) {
    if (!byId.has(dependency)) {
      errors.push(`${build.id} depends on unknown build ${dependency}.`);
    }
    if (dependency === build.id) {
      errors.push(`${build.id} cannot depend on itself.`);
    }
  }
}

const visiting = new Set();
const visited = new Set();

function visit(id) {
  if (visiting.has(id)) {
    errors.push(`Dependency cycle includes ${id}.`);
    return;
  }
  if (visited.has(id)) return;

  visiting.add(id);
  const build = byId.get(id);
  for (const dependency of build?.dependsOn ?? []) {
    if (byId.has(dependency)) visit(dependency);
  }
  visiting.delete(id);
  visited.add(id);
}

for (const id of byId.keys()) visit(id);

if (errors.length > 0) {
  console.error("Build plan validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Build plan valid: 20 documents, sequential IDs, and acyclic dependencies.");
}
