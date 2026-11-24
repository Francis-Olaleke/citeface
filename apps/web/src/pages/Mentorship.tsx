import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import { useAuth } from "../context/AuthContext";
import {
  createMentorOffering,
  getMentorOfferings,
  requestMentorship,
  startStripeOnboarding,
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
  const [serviceType, setServiceType] = useState<"MENTORSHIP" | "TUTORING" | "TEACHING" | "CONSULTING" | "RESEARCH_ADVICE">("MENTORSHIP");
  const [priceMinor, setPriceMinor] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [durationMinutes, setDurationMinutes] = useState(60);
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
      await createMentorOffering(expertise, description, serviceType, priceMinor, currency, durationMinutes);
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
            <label htmlFor="mentor-service">Service type</label>
            <select id="mentor-service" value={serviceType} onChange={(event) => setServiceType(event.target.value as typeof serviceType)}>
              <option value="MENTORSHIP">Mentorship</option>
              <option value="TUTORING">Tutoring</option>
              <option value="TEACHING">Teaching</option>
              <option value="CONSULTING">Consulting</option>
              <option value="RESEARCH_ADVICE">Research advice</option>
            </select>
            <div className="mentorship-pricing-grid">
              <label>Price (minor units)<input type="number" min={0} max={100000000} value={priceMinor} onChange={(event) => setPriceMinor(Number(event.target.value) || 0)} /></label>
              <label>Currency<input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase().slice(0, 3))} maxLength={3} /></label>
              <label>Duration (minutes)<input type="number" min={15} max={480} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value) || 60)} /></label>
            </div>
            <button
              type="button"
              className="mentorship-stripe-button"
              onClick={async () => {
                try {
                  const url = await startStripeOnboarding();
                  window.location.assign(url);
                } catch (onboardingError) {
                  setError(onboardingError instanceof Error ? onboardingError.message : "Unable to start Stripe onboarding.");
                }
              }}
            >
              Set up Stripe payouts
            </button>
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
                    {offering.priceMinor > 0 && (
                      <span className="mentor-price">
                        {(offering.priceMinor / 100).toLocaleString(undefined, { style: "currency", currency: offering.currency })}
                        {" · "}{offering.durationMinutes} min · {offering.serviceType.toLowerCase().replace("_", " ")}
                      </span>
                    )}
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
