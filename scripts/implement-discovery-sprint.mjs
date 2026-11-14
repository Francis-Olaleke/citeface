import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${relativePath}`);
  return fs.readFileSync(file, "utf8");
}

function write(relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function replaceOnce(source, oldText, newText, description) {
  const first = source.indexOf(oldText);
  if (first < 0) throw new Error(`Could not find expected section: ${description}`);
  if (source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`Section is not unique: ${description}`);
  }
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

const files = [
  "apps/api/src/modules/stories/stories.routes.ts",
  "apps/web/src/services/stories.ts",
  "apps/web/src/pages/Dashboard.tsx",
  "apps/web/src/pages/dashboard.css",
  "apps/web/src/main.tsx",
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, "backups", `discovery-sprint-${stamp}`);

for (const file of files) {
  fs.mkdirSync(path.dirname(path.join(backupDir, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(backupDir, file));
}

console.log(`Backups created: ${backupDir}`);

// --------------------------------------------------
// 1. API: feed search and classification filters
// --------------------------------------------------

{
  const file = "apps/api/src/modules/stories/stories.routes.ts";
  let source = read(file);

  source = replaceOnce(
    source,
    `interface FeedQuery {
  page?: number;
  limit?: number;
}`,
    `type ResearchClassification =
  | "PEER_REVIEWED_ARTICLE"
  | "PREPRINT"
  | "THESIS_DISSERTATION"
  | "CONFERENCE_PAPER"
  | "RESEARCH_REPORT"
  | "AUTHOR_DESCRIBED_PROJECT"
  | "PRELIMINARY_UNPUBLISHED";

interface FeedQuery {
  page?: number;
  limit?: number;
  q?: string;
  classification?: ResearchClassification;
}`,
    "FeedQuery interface",
  );

  source = replaceOnce(
    source,
    `          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        additionalProperties: false,`,
    `          limit: { type: "integer", minimum: 1, maximum: 20 },
          q: { type: "string", minLength: 1, maxLength: 100 },
          classification: {
            type: "string",
            enum: [
              "PEER_REVIEWED_ARTICLE",
              "PREPRINT",
              "THESIS_DISSERTATION",
              "CONFERENCE_PAPER",
              "RESEARCH_REPORT",
              "AUTHOR_DESCRIBED_PROJECT",
              "PRELIMINARY_UNPUBLISHED",
            ],
          },
        },
        additionalProperties: false,`,
    "feed query schema",
  );

  source = replaceOnce(
    source,
    `    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      publishedAt: { not: null },
      creator: {
        status: "ACTIVE" as const,
        deletedAt: null,
      },
    };`,
    `    const searchTerm = request.query.q?.trim();

    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      publishedAt: { not: null },
      creator: {
        status: "ACTIVE" as const,
        deletedAt: null,
      },
      ...(request.query.classification
        ? { classification: request.query.classification }
        : {}),
      ...(searchTerm
        ? {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" as const } },
              { summary: { contains: searchTerm, mode: "insensitive" as const } },
              {
                researchQuestion: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
              {
                methodology: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
              { findings: { contains: searchTerm, mode: "insensitive" as const } },
              {
                significance: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };`,
    "public feed filter",
  );

  const detailRoute = `
  // Public detail page: only published stories from active creators.
  app.get<{ Params: { slug: string } }>(
    "/:slug",
    {
      schema: {
        params: {
          type: "object",
          required: ["slug"],
          properties: {
            slug: { type: "string", minLength: 1, maxLength: 250 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const story = await prisma.researchStory.findFirst({
        where: {
          slug: request.params.slug,
          status: "PUBLISHED",
          deletedAt: null,
          publishedAt: { not: null },
          creator: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          classification: true,
          researchQuestion: true,
          methodology: true,
          findings: true,
          significance: true,
          limitations: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          authors: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              displayName: true,
              affiliationText: true,
              role: true,
              isCorresponding: true,
              sortOrder: true,
            },
          },
          topics: {
            select: {
              topic: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          media: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              caption: true,
              media: {
                select: {
                  id: true,
                  type: true,
                  mimeType: true,
                  durationSeconds: true,
                },
              },
            },
          },
          sources: {
            select: {
              id: true,
              type: true,
              title: true,
              doi: true,
              url: true,
              journal: true,
              publisher: true,
              publicationDate: true,
              authorsText: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
              questions: true,
            },
          },
        },
      });

      if (!story) {
        return reply.code(404).send({
          error: "Not Found",
          message: "This research story is unavailable.",
        });
      }

      return reply.send({ story });
    },
  );

`;

  source = replaceOnce(
    source,
    `};

export default storiesRoutes;`,
    `${detailRoute}};

export default storiesRoutes;`,
    "end of stories routes",
  );

  write(file, source);
  console.log("Updated API routes.");
}

// --------------------------------------------------
// 2. Frontend service: search and detail
// --------------------------------------------------

{
  const file = "apps/web/src/services/stories.ts";
  let source = read(file);

  source = replaceOnce(
    source,
    `    researcherProfile: {
      headline: string | null;
      profileImageUrl: string | null;
      isVerified: boolean;
    } | null;`,
    `    researcherProfile?: {
      headline: string | null;
      profileImageUrl: string | null;
      isVerified: boolean;
    } | null;`,
    "optional researcher profile type",
  );

  source = replaceOnce(
    source,
    `export interface StoriesFeedResponse {`,
    `export interface StoryDetail extends FeedStory {
  methodology: string | null;
  findings: string | null;
  significance: string | null;
  limitations: string | null;
  createdAt: string;
  updatedAt: string;
  sources: {
    id: string;
    type: string;
    title: string | null;
    doi: string | null;
    url: string | null;
    journal: string | null;
    publisher?: string | null;
    publicationDate?: string | null;
    authorsText?: string | null;
  }[];
}

export async function getPublishedStory(slug: string): Promise<StoryDetail> {
  const response = await fetch(
    \`\${API_URL}/\${encodeURIComponent(slug)}\`,
    { method: "GET", credentials: "include" },
  );

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();
    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle empty or non-JSON responses.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to load this research story.";

    throw new StoriesServiceError(message, response.status);
  }

  return (data as { story: StoryDetail }).story;
}

export interface StoriesFeedResponse {`,
    "story detail service types",
  );

  const start = source.indexOf("export async function getStoriesFeed(");
  const end = source.indexOf("export interface DraftStory {", start);

  if (start < 0 || end < 0) {
    throw new Error("Could not locate the existing getStoriesFeed function.");
  }

  const feedFunction = `export interface StoriesFeedFilters {
  q?: string;
  classification?: string;
}

export async function getStoriesFeed(
  page = 1,
  limit = 20,
  filters: StoriesFeedFilters = {},
): Promise<StoriesFeedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.classification) {
    params.set("classification", filters.classification);
  }

  const response = await fetch(\`\${API_URL}/feed?\${params.toString()}\`, {
    method: "GET",
    credentials: "include",
  });

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();
    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle empty or non-JSON responses.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to load research stories. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as StoriesFeedResponse;
}

`;

  source = source.slice(0, start) + feedFunction + source.slice(end);

  write(file, source);
  console.log("Updated frontend story services.");
}

// --------------------------------------------------
// 3. Dashboard: filters, search, pagination, links
// --------------------------------------------------

{
  const file = "apps/web/src/pages/Dashboard.tsx";
  let source = read(file);

  source = replaceOnce(
    source,
    `  const [draftsRefreshKey, setDraftsRefreshKey] = useState(0);`,
    `  const [draftsRefreshKey, setDraftsRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [classification, setClassification] = useState("");`,
    "dashboard filter state",
  );

  source = replaceOnce(
    source,
    `const result = await getStoriesFeed(1, 20);`,
    `const result = await getStoriesFeed(1, 20, {
          q: searchQuery,
          classification,
        });`,
    "initial feed request",
  );

  source = replaceOnce(
    source,
    `  }, [refreshFeed]);`,
    `  }, [refreshFeed, searchQuery, classification]);`,
    "feed effect dependencies",
  );

  source = replaceOnce(
    source,
    `const result = await getStoriesFeed(nextPage, 20);`,
    `const result = await getStoriesFeed(nextPage, 20, {
        q: searchQuery,
        classification,
      });`,
    "load more request",
  );

  source = replaceOnce(
    source,
    `  <div className="topbar-search">
    <input
      type="search"
      placeholder="Search research, people and topics..."
      aria-label="Search Citeface"
      disabled
    />
  </div>`,
    `  <form
    className="topbar-search"
    role="search"
    onSubmit={(event) => {
      event.preventDefault();
      setSearchQuery(searchInput.trim());
    }}
  >
    <input
      type="search"
      placeholder="Search published research..."
      aria-label="Search published research"
      value={searchInput}
      maxLength={100}
      onChange={(event) => setSearchInput(event.target.value)}
    />
    <button type="submit">Search</button>
  </form>`,
    "dashboard search field",
  );

  source = replaceOnce(
    source,
    `<h3 className="story-title">{story.title}</h3>`,
    `<h3 className="story-title">
        <Link to={\`/stories/\${encodeURIComponent(story.slug)}\`}>
          {story.title}
        </Link>
      </h3>`,
    "story title link",
  );

  source = replaceOnce(
    source,
    `</section>

{!publicView && (`,
    `</section>

<section className="discovery-filters" aria-label="Research filters">
  <label htmlFor="research-classification">Filter by research type</label>
  <select
    id="research-classification"
    value={classification}
    onChange={(event) => setClassification(event.target.value)}
  >
    <option value="">All research types</option>
    <option value="PEER_REVIEWED_ARTICLE">Peer-reviewed article</option>
    <option value="PREPRINT">Preprint</option>
    <option value="THESIS_DISSERTATION">Thesis / Dissertation</option>
    <option value="CONFERENCE_PAPER">Conference paper</option>
    <option value="RESEARCH_REPORT">Research report</option>
    <option value="AUTHOR_DESCRIBED_PROJECT">Author-described project</option>
    <option value="PRELIMINARY_UNPUBLISHED">Preliminary unpublished</option>
  </select>

  {(searchQuery || classification) && (
    <button
      type="button"
      onClick={() => {
        setSearchInput("");
        setSearchQuery("");
        setClassification("");
      }}
    >
      Clear filters
    </button>
  )}
</section>

{!publicView && (`,
    "discovery filters insertion point",
  );

  source = replaceOnce(
    source,
    `<h3>Your discovery feed starts here</h3>
              <p>
                There are no published research stories to show yet.
                As researchers publish stories, videos and graphical
                abstracts, they will appear here.
              </p>`,
    `<h3>
                {searchQuery || classification
                  ? "No matching research stories"
                  : "Your discovery feed starts here"}
              </h3>
              <p>
                {searchQuery || classification
                  ? "Try another search term or clear your filters to explore more published research."
                  : "There are no published research stories to show yet. As researchers publish stories, videos and graphical abstracts, they will appear here."}
              </p>`,
    "discovery empty state",
  );

  write(file, source);
  console.log("Updated dashboard.");
}

// --------------------------------------------------
// 4. Public story page and stylesheet
// --------------------------------------------------

write("apps/web/src/pages/ResearchStoryPage.tsx", `import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublishedStory, type StoryDetail } from "../services/stories";
import "./research-story.css";

function formatLabel(value: string) {
  return value.toLowerCase().split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";
  return date.toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function ResearchStoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStory() {
      if (!slug) {
        setError("This research story could not be found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getPublishedStory(slug);
        if (!cancelled) setStory(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load this research story.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStory();
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="research-story-page">
      <header className="research-story-header">
        <Link to="/" className="research-story-brand">
          Cite<span>face</span>
          <small>Research. Connect. Discover.</small>
        </Link>
        <nav aria-label="Account navigation">
          <Link to="/login">Sign in</Link>
          <Link to="/register" className="research-story-join">Join Citeface</Link>
        </nav>
      </header>

      <main className="research-story-container">
        <Link to="/" className="research-story-back">← Back to discovery</Link>

        {loading && (
          <section className="research-story-state" aria-live="polite">
            Loading research story...
          </section>
        )}

        {!loading && error && (
          <section className="research-story-state" role="alert">
            <h1>Research story unavailable</h1>
            <p>{error}</p>
            <Link to="/">Explore other research stories</Link>
          </section>
        )}

        {!loading && !error && story && (
          <article className="research-story-article">
            <div className="research-story-category">{formatLabel(story.classification)}</div>
            <h1>{story.title}</h1>

            <div className="research-story-byline">
              <span>Published by <strong>{story.creator.displayName}</strong> (@{story.creator.username})</span>
              <span>{formatDate(story.publishedAt)}</span>
            </div>

            <section className="research-story-summary">
              <h2>Overview</h2>
              <p>{story.summary}</p>
            </section>

            {story.authors.length > 0 && (
              <section className="research-story-section">
                <h2>Authors and contributors</h2>
                <div className="research-story-authors">
                  {story.authors.map((author) => (
                    <div key={author.id} className="research-story-author">
                      <strong>{author.displayName}</strong>
                      <span>{formatLabel(author.role)}</span>
                      {author.affiliationText && <small>{author.affiliationText}</small>}
                      {author.isCorresponding && <small>Corresponding author</small>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {story.researchQuestion && (
              <section className="research-story-section">
                <h2>Research question</h2><p>{story.researchQuestion}</p>
              </section>
            )}
            {story.methodology && (
              <section className="research-story-section">
                <h2>Methodology</h2><p>{story.methodology}</p>
              </section>
            )}
            {story.findings && (
              <section className="research-story-section">
                <h2>Findings</h2><p>{story.findings}</p>
              </section>
            )}
            {story.significance && (
              <section className="research-story-section">
                <h2>Significance</h2><p>{story.significance}</p>
              </section>
            )}
            {story.limitations && (
              <section className="research-story-section">
                <h2>Limitations</h2><p>{story.limitations}</p>
              </section>
            )}

            {story.topics.length > 0 && (
              <section className="research-story-section">
                <h2>Research topics</h2>
                <div className="research-story-topics">
                  {story.topics.map(({ topic }) => <span key={topic.id}>{topic.name}</span>)}
                </div>
              </section>
            )}

            {story.media.length > 0 && (
              <section className="research-story-section">
                <h2>Related media</h2>
                {story.media.map((item) => (
                  <div key={item.id} className="research-story-media">
                    <strong>{formatLabel(item.media.type)}</strong>
                    {item.caption && <p>{item.caption}</p>}
                    {item.media.durationSeconds != null && (
                      <small>Duration: {item.media.durationSeconds} seconds</small>
                    )}
                  </div>
                ))}
              </section>
            )}

            {story.sources.length > 0 && (
              <section className="research-story-section">
                <h2>Sources and references</h2>
                <div className="research-story-sources">
                  {story.sources.map((source) => (
                    <div key={source.id}>
                      <strong>{source.title || source.journal || "Research source"}</strong>
                      {source.journal && <p>{source.journal}</p>}
                      {source.publisher && <p>{source.publisher}</p>}
                      {source.doi && <p>DOI: {source.doi}</p>}
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer">View source</a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <footer className="research-story-footer">
              <span>{story._count.reactions.toLocaleString()} appreciations</span>
              <span>{story._count.comments.toLocaleString()} comments</span>
            </footer>

            <section className="research-story-join-panel">
              <h2>Continue your research journey on Citeface</h2>
              <p>Discover more research, follow ideas and build meaningful connections with the research community.</p>
              <Link to="/register">Create your free account</Link>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
`);

write("apps/web/src/pages/research-story.css", `.research-story-page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #17233b;
}

.research-story-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 76px;
  padding: 12px 5%;
  background: #fff;
  border-bottom: 1px solid #e8edf4;
}

.research-story-brand {
  color: #185adb;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -1px;
  text-decoration: none;
}

.research-story-brand span { color: #f18a35; }

.research-story-brand small {
  display: block;
  margin-top: 3px;
  color: #8490a3;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}

.research-story-header nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.research-story-header nav a,
.research-story-back {
  color: #385b91;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.research-story-join {
  padding: 10px 14px;
  border-radius: 8px;
  color: #fff !important;
  background: #185adb;
}

.research-story-container {
  width: min(850px, 92%);
  margin: 35px auto 70px;
}

.research-story-back {
  display: inline-block;
  margin-bottom: 20px;
}

.research-story-article,
.research-story-state {
  padding: clamp(20px, 5vw, 48px);
  border: 1px solid #e8edf4;
  border-radius: 14px;
  background: #fff;
}

.research-story-category {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 20px;
  color: #385b91;
  background: #eef3fb;
  font-size: 11px;
  font-weight: 700;
}

.research-story-article > h1 {
  margin: 18px 0;
  color: #17243a;
  font-size: clamp(27px, 5vw, 38px);
  line-height: 1.25;
  letter-spacing: -1px;
  overflow-wrap: anywhere;
}

.research-story-byline {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 22px;
  border-bottom: 1px solid #edf0f5;
  color: #778195;
  font-size: 12px;
}

.research-story-summary {
  margin-top: 25px;
  padding: 22px;
  border-radius: 10px;
  background: #f7f9fc;
}

.research-story-section { margin-top: 30px; }

.research-story-summary h2,
.research-story-section h2,
.research-story-join-panel h2 {
  margin: 0 0 12px;
  color: #26344a;
  font-size: 17px;
}

.research-story-summary p,
.research-story-section > p {
  margin: 0;
  color: #596579;
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.research-story-authors,
.research-story-sources { display: grid; gap: 12px; }

.research-story-author,
.research-story-sources > div,
.research-story-media {
  padding: 15px;
  border: 1px solid #edf0f5;
  border-radius: 9px;
}

.research-story-author strong,
.research-story-author span,
.research-story-author small { display: block; }

.research-story-author span,
.research-story-author small,
.research-story-sources p,
.research-story-media p,
.research-story-media small {
  margin-top: 5px;
  color: #778195;
  font-size: 12px;
}

.research-story-topics { display: flex; flex-wrap: wrap; gap: 8px; }

.research-story-topics span {
  padding: 7px 11px;
  border-radius: 20px;
  color: #385b91;
  background: #eef3fb;
  font-size: 12px;
}

.research-story-sources a {
  display: inline-block;
  margin-top: 8px;
  color: #185adb;
  font-size: 12px;
  font-weight: 600;
}

.research-story-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px solid #edf0f5;
  color: #778195;
  font-size: 12px;
}

.research-story-join-panel {
  margin-top: 35px;
  padding: 24px;
  border-radius: 11px;
  background: #f0f5ff;
}

.research-story-join-panel p {
  color: #596579;
  font-size: 13px;
  line-height: 1.7;
}

.research-story-join-panel a {
  display: inline-block;
  margin-top: 8px;
  padding: 11px 16px;
  border-radius: 8px;
  color: #fff;
  background: #185adb;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.research-story-state { text-align: center; }
.research-story-state p { color: #778195; line-height: 1.7; }
.research-story-state a { color: #185adb; font-weight: 600; }

@media (max-width: 520px) {
  .research-story-header { padding: 12px 4%; }
  .research-story-brand { font-size: 21px; }
  .research-story-header nav { gap: 8px; }
  .research-story-header nav a { font-size: 11px; }
  .research-story-article,
  .research-story-state { padding: 20px; }
  .research-story-byline { flex-direction: column; }
}
`);

// --------------------------------------------------
// 5. Register public story route
// --------------------------------------------------

{
  const file = "apps/web/src/main.tsx";
  let source = read(file);

  source = replaceOnce(
    source,
    `import Dashboard from "./pages/Dashboard";`,
    `import Dashboard from "./pages/Dashboard";
import ResearchStoryPage from "./pages/ResearchStoryPage";`,
    "dashboard page import",
  );

  source = replaceOnce(
    source,
    `          <Route element={<ProtectedRoute />}>`,
    `          <Route path="/stories/:slug" element={<ResearchStoryPage />} />

          <Route element={<ProtectedRoute />}>`,
    "protected route insertion point",
  );

  write(file, source);
  console.log("Registered public story route.");
}

// --------------------------------------------------
// 6. Dashboard styling
// --------------------------------------------------

{
  const file = "apps/web/src/pages/dashboard.css";
  const source = read(file);

  const styles = `

/* Public research discovery search and filters */
.topbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-search input { flex: 1; min-width: 0; }

.topbar-search button {
  padding: 11px 14px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: #185adb;
  font-size: 12px;
  font-weight: 600;
}

.topbar-search button:hover { background: #1248b5; }

.discovery-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
  padding: 14px 16px;
  border: 1px solid #e9edf4;
  border-radius: 11px;
  background: #fff;
}

.discovery-filters label {
  color: #52617a;
  font-size: 12px;
  font-weight: 600;
}

.discovery-filters select {
  min-width: 190px;
  max-width: 100%;
  padding: 9px 11px;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  color: #34445e;
  background: #fff;
  font: inherit;
  font-size: 12px;
}

.discovery-filters button {
  padding: 9px 11px;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  color: #52617a;
  background: #fff;
  font-size: 12px;
}

.story-title a {
  color: inherit;
  text-decoration: none;
}

.story-title a:hover {
  color: #185adb;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 680px) {
  .topbar-search { display: flex; }
  .topbar-search button { flex-shrink: 0; }
  .discovery-filters { align-items: stretch; flex-direction: column; }
  .discovery-filters select { width: 100%; }
}
`;

  if (!source.includes("/* Public research discovery search and filters */")) {
    write(file, source + styles);
  }
}

console.log("\nDiscovery sprint files updated successfully.");
console.log("Backup folder:", backupDir);
console.log("Next: run the API and web typechecks before browser testing.");
