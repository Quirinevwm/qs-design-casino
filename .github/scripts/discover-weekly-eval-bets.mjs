const API_ROOT = "https://api.github.com";
const CANDIDATE_LIMIT = 5;
const LOOKBACK_DAYS = 30;

const topicSearches = [
  { query: "topic:design-systems stars:>50 archived:false", lens: "Design-system integrity" },
  { query: "topic:accessibility stars:>50 archived:false", lens: "Accessibility baseline" },
  { query: "topic:user-experience stars:>50 archived:false", lens: "Journey quality" },
  { query: "topic:human-computer-interaction stars:>25 archived:false", lens: "Interaction quality" },
  { query: "topic:ai-design stars:>10 archived:false", lens: "Human-AI interaction" },
];

const checkedKeywords = [
  "accessibility",
  "aria",
  "contrast",
  "keyboard",
  "responsive",
  "schema",
  "token",
  "terminology",
  "lint",
  "overflow",
];

const runtimeKeywords = [
  "accessibility",
  "aria",
  "contrast",
  "keyboard",
  "responsive",
  "overflow",
  "render",
];

const designKeywords = [
  ...checkedKeywords,
  "color",
  "component",
  "content",
  "copy",
  "design",
  "error message",
  "flow",
  "form",
  "interaction",
  "journey",
  "layout",
  "loading",
  "mobile",
  "navigation",
  "onboarding",
  "spacing",
  "theme",
  "trust",
  "typography",
  "usability",
  "user experience",
  "workflow",
];

const excludedKeywords = [
  "build failed",
  "ci failed",
  "code simplifier",
  "community",
  "dependency",
  "installation",
  "release checklist",
  "support",
  "test failed",
  "users",
];

const requiredLabels = [
  {
    name: "weekly-eval-bet",
    color: "8250df",
    description: "A candidate or active weekly evaluation experiment",
  },
  {
    name: "status:ready",
    color: "1a7f37",
    description: "Ready to be selected for a weekly review",
  },
  {
    name: "discovered:public-repos",
    color: "0969da",
    description: "Inspired by attributed signals from public repositories",
  },
];

const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const token = process.env.GH_TOKEN;
const dryRun = process.env.DRY_RUN === "true";

if (!owner || !repo) {
  throw new Error("GITHUB_REPOSITORY must contain an owner and repository name.");
}

if (!token) {
  throw new Error("GH_TOKEN is required to query GitHub and create backlog issues.");
}

async function github(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`GitHub API ${response.status} for ${path}: ${detail}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function ensureLabels() {
  if (dryRun) {
    return;
  }

  for (const label of requiredLabels) {
    try {
      await github(`/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`);
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }

      await github(`/repos/${owner}/${repo}/labels`, {
        method: "POST",
        body: JSON.stringify(label),
      });
    }
  }
}

async function listAllIssuesWithLabel(label) {
  const issues = [];

  for (let page = 1; ; page += 1) {
    const batch = await github(
      `/repos/${owner}/${repo}/issues?state=all&labels=${encodeURIComponent(label)}&per_page=100&page=${page}`,
    );
    issues.push(...batch);

    if (batch.length < 100) {
      return issues;
    }
  }
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/\[weekly eval bet\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sanitizeSourceTitle(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(value, keyword) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escapedKeyword}(?=\\W|$)`, "i").test(value);
}

function isDesignSignal(value) {
  return (
    designKeywords.some((keyword) => containsKeyword(value, keyword)) &&
    !excludedKeywords.some((keyword) => containsKeyword(value, keyword))
  );
}

function collectUrls(value) {
  return value.match(/https:\/\/github\.com\/[^\s)>]+/g) ?? [];
}

async function readOptionalContent(path) {
  try {
    const content = await github(`/repos/${owner}/${repo}/contents/${path}`);
    if (Array.isArray(content) || content.type !== "file") {
      return "";
    }
    return Buffer.from(content.content, "base64").toString("utf8");
  } catch (error) {
    if (error.status === 404) {
      return "";
    }
    throw error;
  }
}

async function buildMemory() {
  const seenUrls = new Set();
  const seenThemes = new Set();

  const priorIssues = await listAllIssuesWithLabel("weekly-eval-bet");

  for (const issue of priorIssues) {
    if (issue.pull_request) {
      continue;
    }
    seenThemes.add(normalize(issue.title));
    for (const url of collectUrls(issue.body ?? "")) {
      seenUrls.add(url);
    }
  }

  const root = await github(`/repos/${owner}/${repo}/contents/weekly-eval-bets`);
  const completedBets = root.filter((entry) => entry.type === "dir");

  for (const bet of completedBets) {
    seenThemes.add(normalize(bet.name));
    const memoryText = [
      await readOptionalContent(`weekly-eval-bets/${bet.name}/README.md`),
      await readOptionalContent(`weekly-eval-bets/${bet.name}/bet.yaml`),
    ].join("\n");

    for (const url of collectUrls(memoryText)) {
      seenUrls.add(url);
    }
  }

  return { seenUrls, seenThemes };
}

function classify(title) {
  const evaluator = checkedKeywords.some((keyword) => containsKeyword(title, keyword))
    ? "checked"
    : "judged";

  if (evaluator === "judged") {
    return { evaluator, evidence: "holistic" };
  }

  const evidence = runtimeKeywords.some((keyword) => containsKeyword(title, keyword))
    ? "runtime-only"
    : "source-provable";

  return { evaluator, evidence };
}

function deriveLens(defaultLens, title) {
  if (
    ["accessibility", "aria", "contrast", "keyboard", "screen reader"].some((keyword) =>
      containsKeyword(title, keyword),
    )
  ) {
    return "Accessibility baseline";
  }

  if (
    ["component", "layout", "spacing", "theme", "token", "typography"].some((keyword) =>
      containsKeyword(title, keyword),
    )
  ) {
    return "Design-system integrity";
  }

  return defaultLens;
}

function createQuestion(candidate) {
  if (candidate.evaluator === "checked") {
    return "Can observable evidence detect this quality risk before design review?";
  }

  return "How does this experience affect clarity, trust, and craft?";
}

function scoreCandidate(candidate) {
  const updatedAt = new Date(candidate.updatedAt).getTime();
  const ageInDays = Math.max(0, (Date.now() - updatedAt) / 86_400_000);
  const freshness = Math.max(0, LOOKBACK_DAYS - ageInDays);
  return candidate.comments * 2 + Math.min(candidate.stars / 1000, 10) + freshness;
}

async function discoverCandidates(memory) {
  const updatedSince = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const candidates = [];
  const visitedRepositories = new Set();

  for (const search of topicSearches) {
    const lensCandidates = [];
    const repositories = await github(
      `/search/repositories?q=${encodeURIComponent(search.query)}&sort=updated&order=desc&per_page=5`,
    );

    for (const repository of repositories.items) {
      if (visitedRepositories.has(repository.full_name)) {
        continue;
      }
      visitedRepositories.add(repository.full_name);

      const issues = await github(
        `/search/issues?q=${encodeURIComponent(
          `repo:${repository.full_name} is:issue is:open updated:>=${updatedSince}`,
        )}&sort=comments&order=desc&per_page=3`,
      );

      for (const issue of issues.items) {
        if (!isDesignSignal(issue.title)) {
          continue;
        }

        const sourceUrl = issue.html_url;
        const themeKey = normalize(issue.title);

        if (memory.seenUrls.has(sourceUrl) || memory.seenThemes.has(themeKey)) {
          continue;
        }

        const classification = classify(issue.title);
        lensCandidates.push({
          lens: deriveLens(search.lens, issue.title),
          repository: repository.full_name,
          repositoryUrl: repository.html_url,
          sourceTitle: issue.title,
          sourceUrl,
          comments: issue.comments,
          stars: repository.stargazers_count,
          updatedAt: issue.updated_at,
          ...classification,
        });
      }
    }

    const strongestCandidate = lensCandidates.sort(
      (left, right) => scoreCandidate(right) - scoreCandidate(left),
    )[0];

    if (strongestCandidate) {
      candidates.push(strongestCandidate);
    }
  }

  const seenLenses = new Set();
  return candidates
    .filter((candidate) => {
      if (seenLenses.has(candidate.lens)) {
        return false;
      }
      seenLenses.add(candidate.lens);
      return true;
    })
    .slice(0, CANDIDATE_LIMIT);
}

function issueBody(candidate) {
  return `## Proposed eval bet

| Layer | Proposal |
| --- | --- |
| Theme | ${candidate.lens} |
| Design question | ${createQuestion(candidate)} |
| Evaluator | ${candidate.evaluator} |
| Evidence | ${candidate.evidence} |
| Suggested artifact | A representative product surface or workflow |
| Initial success threshold | 75% |

## Why this signal

This candidate was discovered through recent public design activity. It should be synthesized into an original Design Casino experiment rather than copied from the source.

- **Repository:** [${candidate.repository}](${candidate.repositoryUrl})
- **Source signal:** [View source issue](${candidate.sourceUrl})
- **Source title:** ${sanitizeSourceTitle(candidate.sourceTitle)}
- **Activity:** ${candidate.comments} comments, ${candidate.stars} repository stars
- **Last updated:** ${candidate.updatedAt.slice(0, 10)}

## Review prompt

- What design judgment can we make explicit?
- What can be checked mechanically?
- What still needs to be judged experientially?
- What would make this lens reusable in a future review stack?

Generated by the weekly public-repository discovery workflow. The source link and issue history remain part of the backlog memory so reviewed ideas are not proposed again.
`;
}

async function createBacklogIssues(candidates) {
  for (const candidate of candidates) {
    const title = `[Weekly eval bet] ${candidate.lens}: ${sanitizeSourceTitle(candidate.sourceTitle)}`.slice(
      0,
      256,
    );
    if (dryRun) {
      console.log(`Would create candidate: ${title}`);
      continue;
    }

    await github(`/repos/${owner}/${repo}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title,
        body: issueBody(candidate),
        labels: requiredLabels.map((label) => label.name),
      }),
    });
    console.log(`Created candidate: ${title}`);
  }
}

await ensureLabels();
const memory = await buildMemory();
const candidates = await discoverCandidates(memory);

if (candidates.length === 0) {
  console.log("No new design signals remained after checking backlog and review memory.");
} else {
  await createBacklogIssues(candidates);
  console.log(
    `${dryRun ? "Prepared" : "Created"} ${candidates.length} weekly eval bet candidates.`,
  );
}
