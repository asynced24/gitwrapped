import type { RawRepo } from "@/lib/github/types";
import type { PracticeKey, PracticeSignal, PracticesSummary } from "@/types/github";

/**
 * Engineering-practice detection from each repo's root listing and
 * .github/workflows. Exact names only: the old substring check counted
 * folders like `latest/` and `contest/` as test suites.
 */

const CI_ROOT_FILES = new Set([
    ".gitlab-ci.yml", ".circleci", ".travis.yml", "jenkinsfile",
    "azure-pipelines.yml", "bitbucket-pipelines.yml", ".buildkite", ".drone.yml",
]);

const TEST_DIRS = new Set(["test", "tests", "__tests__", "spec", "specs", "e2e", "cypress", "testing"]);
const TEST_CONFIG = /^(jest|vitest|playwright|cypress|karma|mocha|ava)\.config\.(js|cjs|mjs|ts|mts|cts|json)$|^(pytest\.ini|conftest\.py|tox\.ini|noxfile\.py|phpunit\.xml(\.dist)?|\.rspec|\.mocharc\..+)$/;
const GO_TEST_FILE = /_test\.go$/;

const CONTAINER_FILES = new Set([
    "dockerfile", "containerfile", "docker-compose.yml", "docker-compose.yaml",
    "compose.yml", "compose.yaml", ".devcontainer",
]);

const IAC_FILES = new Set([
    "terraform", "pulumi.yaml", "pulumi.yml", "cdk.json", "serverless.yml", "serverless.yaml",
    "template.yaml", "samconfig.toml", "k8s", "kubernetes", "helm", "charts",
    "skaffold.yaml", "kustomization.yaml", "ansible", "playbook.yml",
]);

const DEPLOY_FILES = new Set([
    "vercel.json", "netlify.toml", "fly.toml", "railway.json", "railway.toml", "render.yaml",
    "app.yaml", "procfile", "firebase.json", "heroku.yml", "amplify.yml", "wrangler.toml",
]);

const DETECTORS: Record<PracticeKey, (root: string[], workflows: string[]) => boolean> = {
    ci: (root, workflows) =>
        workflows.some(f => f.endsWith(".yml") || f.endsWith(".yaml")) || root.some(f => CI_ROOT_FILES.has(f)),
    tests: root => root.some(f => TEST_DIRS.has(f) || TEST_CONFIG.test(f) || GO_TEST_FILE.test(f)),
    containers: root => root.some(f => CONTAINER_FILES.has(f)),
    iac: root => root.some(f => IAC_FILES.has(f) || f.endsWith(".tf")),
    deploy: root => root.some(f => DEPLOY_FILES.has(f)),
    license: root => root.some(f => /^(license|licence|copying)(\.|$)/.test(f)),
    readme: root => root.some(f => /^readme(\.|$)/.test(f)),
};

const META: Record<PracticeKey, { label: string; icon: string }> = {
    ci: { label: "CI pipelines", icon: "🔄" },
    tests: { label: "Tests", icon: "🧪" },
    containers: { label: "Containers", icon: "🐳" },
    iac: { label: "Infrastructure as code", icon: "🏗️" },
    deploy: { label: "Deploy config", icon: "🚀" },
    license: { label: "License", icon: "📄" },
    readme: { label: "README", icon: "📘" },
};

export const PRACTICE_KEYS = Object.keys(DETECTORS) as PracticeKey[];

export function detectPractices(repo: RawRepo): PracticeKey[] {
    if (!repo.rootEntries) return [];
    const root = repo.rootEntries;
    const workflows = repo.workflowFiles ?? [];
    return PRACTICE_KEYS.filter(key => DETECTORS[key](root, workflows));
}

export function analyzePractices(repos: RawRepo[]): PracticesSummary {
    // Archived repos are history, not current practice.
    const analyzed = repos.filter(r => r.rootEntries !== null && !r.archived);
    const counts = Object.fromEntries(PRACTICE_KEYS.map(k => [k, 0])) as Record<PracticeKey, number>;

    for (const repo of analyzed) {
        for (const key of detectPractices(repo)) counts[key]++;
    }

    const signals: PracticeSignal[] = PRACTICE_KEYS.map(key => ({
        key,
        ...META[key],
        repoCount: counts[key],
        share: analyzed.length > 0 ? Math.round((counts[key] / analyzed.length) * 100) : 0,
    }));

    return { analyzedRepos: analyzed.length, signals };
}

export function practiceShare(summary: PracticesSummary, key: PracticeKey): number {
    return summary.signals.find(s => s.key === key)?.share ?? 0;
}
