import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import {
  getMyCredibilityProfile,
  updateMyCredibilityProfile,
  type CredibilityProfilePayload,
} from "../services/researchers";
import "./credibility-profile.css";

function toComma(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function toLines(value: unknown, fields: string[]) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const record = item as Record<string, unknown>;
      return fields.map((field) => String(record[field] ?? "")).filter(Boolean).join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function linesToRecords(text: string, fields: string[]) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return Object.fromEntries(fields.map((field, index) => [field, parts[index] ?? ""]));
    });
}

export default function CredibilityProfile() {
  const [headline, setHeadline] = useState("");
  const [biography, setBiography] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [googleScholarUrl, setGoogleScholarUrl] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [citationCount, setCitationCount] = useState(0);
  const [specializations, setSpecializations] = useState("");
  const [education, setEducation] = useState("");
  const [institutionAffiliations, setInstitutionAffiliations] = useState("");
  const [grants, setGrants] = useState("");
  const [fellowships, setFellowships] = useState("");
  const [professionalBodies, setProfessionalBodies] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getMyCredibilityProfile();
        if (cancelled) return;
        const profile = result.profile;
        if (profile) {
          setHeadline(profile.headline ?? "");
          setBiography(profile.biography ?? "");
          setCountry(profile.country ?? "");
          setCity(profile.city ?? "");
          setWebsiteUrl(profile.websiteUrl ?? "");
          setLinkedinUrl(profile.linkedinUrl ?? "");
          setGoogleScholarUrl(profile.googleScholarUrl ?? "");
          setOrcidId(profile.orcidId ?? "");
          setCitationCount(profile.citationCount ?? 0);
          setSpecializations(toComma(profile.specializations));
          setEducation(toLines(profile.education, ["institution", "degree", "year"]));
          setInstitutionAffiliations(toLines(profile.institutionAffiliations, ["institution", "role", "startYear", "endYear"]));
          setGrants(toLines(profile.grants, ["title", "funder", "year"]));
          setFellowships(toLines(profile.fellowships, ["title", "organization", "year"]));
          setProfessionalBodies(toLines(profile.professionalBodies, ["name", "role"]));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const payload: CredibilityProfilePayload = {
      headline: headline.trim(),
      biography: biography.trim(),
      country: country.trim(),
      city: city.trim(),
      websiteUrl: websiteUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      googleScholarUrl: googleScholarUrl.trim(),
      orcidId: orcidId.trim(),
      citationCount,
      specializations: specializations.split(",").map((item) => item.trim()).filter(Boolean),
      education: linesToRecords(education, ["institution", "degree", "year"]),
      institutionAffiliations: linesToRecords(institutionAffiliations, ["institution", "role", "startYear", "endYear"]),
      grants: linesToRecords(grants, ["title", "funder", "year"]),
      fellowships: linesToRecords(fellowships, ["title", "organization", "year"]),
      professionalBodies: linesToRecords(professionalBodies, ["name", "role"]),
    };
    try {
      await updateMyCredibilityProfile(payload);
      setMessage("Your research credibility profile has been updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="credibility-page">
      <header className="credibility-topbar">
        <Link className="citeface-brand-link" to="/dashboard" aria-label="Citeface dashboard"><CitefaceBrand /></Link>
        <Link className="credibility-back" to="/dashboard">Back to research</Link>
      </header>

      <main className="credibility-main">
        <section className="credibility-heading">
          <span>CITEFACE RESEARCHER PROFILE</span>
          <h1>Professional credibility</h1>
          <p>Build a complete academic identity for discovery, collaboration and paid expertise.</p>
        </section>

        {loading ? (
          <section className="credibility-state">Loading profile...</section>
        ) : (
          <form className="credibility-form" onSubmit={handleSave}>
            {error && <p className="credibility-error" role="alert">{error}</p>}
            {message && <p className="credibility-success" role="status">{message}</p>}

            <section className="credibility-section">
              <h2>Identity and overview</h2>
              <div className="credibility-grid">
                <label>Professional headline<input value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={180} placeholder="Professor of Environmental Genomics" /></label>
                <label>Country<input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={100} /></label>
                <label>City<input value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} /></label>
                <label className="credibility-span">Biography<textarea value={biography} onChange={(event) => setBiography(event.target.value)} rows={5} maxLength={5000} /></label>
              </div>
            </section>

            <section className="credibility-section">
              <h2>Research and academic identity</h2>
              <div className="credibility-grid">
                <label className="credibility-span">Areas of specialization<input value={specializations} onChange={(event) => setSpecializations(event.target.value)} placeholder="Genomics, Public Health, Climate Science" /></label>
                <label>ORCID number<input value={orcidId} onChange={(event) => setOrcidId(event.target.value)} placeholder="0000-0002-1825-0097" pattern="\d{4}-\d{4}-\d{4}-\d{3}[\dX]" /></label>
                <label>Citation count<input type="number" min={0} max={100000000} value={citationCount} onChange={(event) => setCitationCount(Number(event.target.value) || 0)} /></label>
              </div>
            </section>

            <section className="credibility-section">
              <h2>Schools and institutional affiliations</h2>
              <label>Education and degrees<textarea value={education} onChange={(event) => setEducation(event.target.value)} rows={5} placeholder={"University of Oxford | DPhil Microbiology | 2018\nHarvard University | MSc Epidemiology | 2014"} /><small>One entry per line: Institution | Degree | Year</small></label>
              <label>Current and past institutional affiliations<textarea value={institutionAffiliations} onChange={(event) => setInstitutionAffiliations(event.target.value)} rows={5} placeholder={"University of Lagos | Professor | 2020 | Present"} /><small>Institution | Role | Start year | End year</small></label>
            </section>

            <section className="credibility-section">
              <h2>Recognition and memberships</h2>
              <div className="credibility-grid">
                <label>Grants<textarea value={grants} onChange={(event) => setGrants(event.target.value)} rows={5} placeholder={"UKRI Research Grant | UKRI | 2024"} /><small>Grant | Funder | Year</small></label>
                <label>Fellowships<textarea value={fellowships} onChange={(event) => setFellowships(event.target.value)} rows={5} placeholder={"Royal Society Fellowship | Royal Society | 2023"} /><small>Title | Organization | Year</small></label>
                <label className="credibility-span">Professional bodies<textarea value={professionalBodies} onChange={(event) => setProfessionalBodies(event.target.value)} rows={4} placeholder={"Royal Statistical Society | Fellow"} /><small>Body | Role</small></label>
              </div>
            </section>

            <section className="credibility-section">
              <h2>Professional links</h2>
              <div className="credibility-grid">
                <label>Website<input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} /></label>
                <label>LinkedIn<input type="url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} /></label>
                <label>Google Scholar<input type="url" value={googleScholarUrl} onChange={(event) => setGoogleScholarUrl(event.target.value)} /></label>
              </div>
            </section>

            <button className="credibility-save" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save credibility profile"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
