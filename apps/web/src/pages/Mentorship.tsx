import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import { useAuth } from "../context/AuthContext";
import {
  createMentorOffering,
  getMentorOfferings,
  requestMentorship,
  type MentorOffering,
} from "../services/mentorship";
import "./mentorship.css";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function Mentorship() {
  const { user } = useAuth();
  const [offerings, setOfferings] = useState<MentorOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expertise, setExpertise] = useState("");
  const [description, setDescription] = useState("");
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setOfferings(await getMentorOfferings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load mentorship.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleOffering(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expertise.trim() || !description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createMentorOffering(expertise, description);
      setExpertise("");
      setDescription("");
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to publish your offer.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestFor || !requestMessage.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await requestMentorship(requestFor, requestMessage);
      setRequestFor(null);
      setRequestMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to request mentorship.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mentorship-page">
      <header className="mentorship-topbar">
        <Link className="citeface-brand-link" to="/dashboard" aria-label="Citeface dashboard"><CitefaceBrand /></Link>
        <Link className="mentorship-back" to="/dashboard">Back to research</Link>
      </header>

      <main className="mentorship-main">
        <section className="mentorship-heading">
          <span>CITEFACE MENTORSHIP</span>
          <h1>Learn from experienced researchers</h1>
          <p>Offer your expertise or request guidance from a researcher in the community.</p>
        </section>

        {error && <p className="mentorship-error" role="alert">{error}</p>}

        <section className="mentorship-compose">
          <h2>Offer mentorship</h2>
          <form onSubmit={handleOffering}>
            <label htmlFor="mentor-expertise">Area of expertise</label>
            <input id="mentor-expertise" value={expertise} onChange={(event) => setExpertise(event.target.value)} placeholder="e.g. PhD applications, genomics, academic writing" maxLength={150} />
            <label htmlFor="mentor-description">How can you help?</label>
            <textarea id="mentor-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the guidance, schedule or topics you can support." rows={4} maxLength={3000} />
            <button type="submit" disabled={busy || !expertise.trim() || !description.trim()}>
              Publish offering
            </button>
          </form>
        </section>

        {loading && <section className="mentorship-state">Loading mentors...</section>}
        {!loading && offerings.length === 0 && (
          <section className="mentorship-state">
            <h2>No mentor offerings yet</h2>
            <p>Researchers can publish their first mentoring offer above.</p>
          </section>
        )}
        {!loading && offerings.length > 0 && (
          <section className="mentor-grid" aria-label="Mentors">
            {offerings.map((offering) => {
              const profile = offering.mentor.researcherProfile;
              const ownOffering = offering.mentor.id === user?.id;
              return (
                <article className="mentor-card" key={offering.id}>
                  <Link className="mentor-avatar" to={`/researchers/${encodeURIComponent(offering.mentor.username)}`}>
                    {profile?.profileImageUrl ? <img src={profile.profileImageUrl} alt="" /> : initials(offering.mentor.displayName)}
                  </Link>
                  <div>
                    <h2>
                      <Link to={`/researchers/${encodeURIComponent(offering.mentor.username)}`}>
                        {offering.mentor.displayName}
                      </Link>
                    </h2>
                    {profile?.headline && <p className="mentor-headline">{profile.headline}</p>}
                    {profile?.country && <p className="mentor-country">{profile.country}</p>}
                    <span className="mentor-expertise">{offering.expertise}</span>
                    <p className="mentor-description">{offering.description}</p>
                    {!ownOffering && (
                      <button type="button" onClick={() => setRequestFor(offering.id)}>Request mentorship</button>
                    )}
                    {ownOffering && <span className="mentor-own">Your offering</span>}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {requestFor && (
        <div className="mentorship-dialog-backdrop" role="presentation">
          <form className="mentorship-dialog" onSubmit={handleRequest} aria-label="Request mentorship">
            <h2>Introduce yourself</h2>
            <p>Tell the mentor what you need help with.</p>
            <textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} rows={5} maxLength={3000} />
            <div>
              <button type="button" onClick={() => setRequestFor(null)}>Cancel</button>
              <button type="submit" disabled={busy || !requestMessage.trim()}>{busy ? "Sending..." : "Send request"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
