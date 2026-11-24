import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import { getSavedStories, setStorySaved, type FeedStory } from "../services/stories";
import "./saved-research.css";

export default function SavedResearch() {
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getSavedStories();
      setStories(result.stories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load saved research.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function remove(storyId: string) {
    try {
      await setStorySaved(storyId, false);
      setStories((current) => current.filter((story) => story.id !== storyId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove this story.");
    }
  }

  return (
    <div className="saved-page">
      <header className="saved-topbar">
        <Link className="citeface-brand-link" to="/dashboard" aria-label="Citeface dashboard"><CitefaceBrand /></Link>
        <Link className="saved-back" to="/dashboard">Back to research</Link>
      </header>
      <main className="saved-main">
        <section className="saved-heading">
          <span>CITEFACE LIBRARY</span>
          <h1>Saved research</h1>
          <p>Research stories you want to revisit and share.</p>
        </section>
        {loading && <section className="saved-state">Loading saved research...</section>}
        {!loading && error && <section className="saved-state" role="alert">{error}</section>}
        {!loading && !error && stories.length === 0 && (
          <section className="saved-state">
            <h2>No saved research yet</h2>
            <p>Save published stories from the discovery feed to build your library.</p>
          </section>
        )}
        {!loading && !error && stories.length > 0 && (
          <section className="saved-grid">
            {stories.map((story) => (
              <article className="saved-card" key={story.id}>
                <span className="saved-card-kicker">{story.classification.replaceAll("_", " ")}</span>
                <h2><Link to={`/stories/${encodeURIComponent(story.slug)}`}>{story.title}</Link></h2>
                <p>{story.summary}</p>
                <div className="saved-card-actions">
                  <Link to={`/stories/${encodeURIComponent(story.slug)}`}>Read research</Link>
                  <button type="button" onClick={() => void remove(story.id)}>Remove</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
