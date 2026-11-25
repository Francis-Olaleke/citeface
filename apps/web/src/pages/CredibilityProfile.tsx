import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import {
  getMyCredibilityProfile,
  updateMyCredibilityProfile,
  type CredibilityProfilePayload,
} from "../services/researchers";
import { removeProfileImage, uploadProfileImage } from "../services/profile-images";
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

const CAREER_STAGES = [
  "Entry-level researcher",
  "Research student",
  "Postgraduate student",
  "Early-career researcher",
  "Mid-career researcher",
  "Senior researcher",
  "Professor",
  "Retired academic",
  "Industry professional",
];

const PROFESSIONAL_RANKS = [
  "BSc",
  "MSc",
  "MPhil",
  "PhD",
  "DPhil",
  "Postdoctoral Fellow",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Principal/Chief Researcher",
  "MBBS",
  "MD",
  "DDS",
  "RN",
  "Registered Nurse",
  "Nurse Practitioner",
  "Engineer",
  "Chartered Engineer",
  "CA",
  "ICAN Accountant",
  "ACCA",
  "CFA",
  "Barrister",
  "Solicitor",
];

const RESEARCH_INTERESTS = [
  "Medicine and Health",
  "Public Health",
  "Clinical Research",
  "Life Sciences",
  "Genomics",
  "Engineering",
  "Computer Science",
  "Artificial Intelligence",
  "Environment and Climate",
  "Agriculture",
  "Economics",
  "Education",
  "Law",
  "Social Sciences",
  "Humanities",
];

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
  const [careerStage, setCareerStage] = useState("");
  const [professionalRanks, setProfessionalRanks] = useState<string[]>([]);
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [researchGoal, setResearchGoal] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
        let localProfile: Partial<CredibilityProfilePayload> | null = null;
        try {
          const raw = localStorage.getItem("citeface:profile");
          localProfile = raw ? JSON.parse(raw) : null;
        } catch {
          localProfile = null;
        }
        if (profile) {
          setProfileImageUrl(profile.profileImageUrl ?? null);
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
          setCareerStage(profile.careerStage ?? "");
          setProfessionalRanks(Array.isArray(profile.professionalRanks) ? profile.professionalRanks : []);
          setResearchInterests(Array.isArray(profile.researchInterests) ? profile.researchInterests : []);
          setResearchGoal(profile.researchGoal ?? "");
        }
        if (localProfile) {
          setHeadline(localProfile.headline ?? "");
          setBiography(localProfile.biography ?? "");
          setCountry(localProfile.country ?? "");
          setCity(localProfile.city ?? "");
          setWebsiteUrl(localProfile.websiteUrl ?? "");
          setLinkedinUrl(localProfile.linkedinUrl ?? "");
          setGoogleScholarUrl(localProfile.googleScholarUrl ?? "");
          setOrcidId(localProfile.orcidId ?? "");
          setCitationCount(localProfile.citationCount ?? 0);
          setSpecializations(Array.isArray(localProfile.specializations) ? localProfile.specializations.join(", ") : "");
          setCareerStage(localProfile.careerStage ?? "");
          setProfessionalRanks(Array.isArray(localProfile.professionalRanks) ? localProfile.professionalRanks : []);
          setResearchInterests(Array.isArray(localProfile.researchInterests) ? localProfile.researchInterests : []);
          setResearchGoal(localProfile.researchGoal ?? "");
          setEducation(toLines(localProfile.education, ["institution", "degree", "year"]));
          setInstitutionAffiliations(toLines(localProfile.institutionAffiliations, ["institution", "role", "startYear", "endYear"]));
          setGrants(toLines(localProfile.grants, ["title", "funder", "year"]));
          setFellowships(toLines(localProfile.fellowships, ["title", "organization", "year"]));
          setProfessionalBodies(toLines(localProfile.professionalBodies, ["name", "role"]));
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

  async function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);
    setError(null);
    try {
      const imageUrl = await uploadProfileImage(file);
      setProfileImageUrl(imageUrl);
      setMessage("Your profile photo has been updated.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload your profile photo.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveProfileImage() {
    setUploadingImage(true);
    setMessage(null);
    setError(null);
    try {
      await removeProfileImage();
      setProfileImageUrl(null);
      setMessage("Your profile photo has been removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove your profile photo.");
    } finally {
      setUploadingImage(false);
    }
  }

  useEffect(() => {
    if (loading) return;

    const payload: CredibilityProfilePayload = {
      headline: headline.trim(),
      biography: biography.trim(),
      country: country.trim(),
      city: city.trim(),
      websiteUrl: websiteUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      googleScholarUrl: googleScholarUrl.trim(),
      orcidId: orcidId.trim() || undefined,
      citationCount,
      specializations: specializations.split(",").map((item) => item.trim()).filter(Boolean),
      education: linesToRecords(education, ["institution", "degree", "year"]),
      institutionAffiliations: linesToRecords(institutionAffiliations, ["institution", "role", "startYear", "endYear"]),
      grants: linesToRecords(grants, ["title", "funder", "year"]),
      fellowships: linesToRecords(fellowships, ["title", "organization", "year"]),
      professionalBodies: linesToRecords(professionalBodies, ["name", "role"]),
      careerStage,
      professionalRanks,
      researchInterests,
      researchGoal,
    };

    localStorage.setItem("citeface:profile", JSON.stringify(payload));
    const timer = window.setTimeout(() => {
      void updateMyCredibilityProfile(payload)
        .then(() => {
          localStorage.removeItem("citeface:profile");
          setMessage("Your profile is saved automatically.");
        })
        .catch((saveError) => setError(saveError instanceof Error ? saveError.message : "Unable to save your profile."));
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [
    loading,
    headline,
    biography,
    country,
    city,
    websiteUrl,
    linkedinUrl,
    googleScholarUrl,
    orcidId,
    citationCount,
    specializations,
    education,
    institutionAffiliations,
    grants,
    fellowships,
    professionalBodies,
    careerStage,
    professionalRanks,
    researchInterests,
    researchGoal,
  ]);

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
      orcidId: orcidId.trim() || undefined,
      citationCount,
      specializations: specializations.split(",").map((item) => item.trim()).filter(Boolean),
      education: linesToRecords(education, ["institution", "degree", "year"]),
      institutionAffiliations: linesToRecords(institutionAffiliations, ["institution", "role", "startYear", "endYear"]),
      grants: linesToRecords(grants, ["title", "funder", "year"]),
      fellowships: linesToRecords(fellowships, ["title", "organization", "year"]),
      professionalBodies: linesToRecords(professionalBodies, ["name", "role"]),
      careerStage,
      professionalRanks,
      researchInterests,
      researchGoal,
    };
    try {
      await updateMyCredibilityProfile(payload);
      localStorage.removeItem("citeface:profile");
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

            <section className="credibility-section credibility-photo-section">
              <div className="credibility-photo-preview">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Your profile" />
                ) : (
                  <span aria-hidden="true">Photo</span>
                )}
              </div>
              <div className="credibility-photo-controls">
                <h2>Profile photo</h2>
                <p>Add a clear photo so researchers can recognize you.</p>
                <div className="credibility-photo-actions">
                  <label className={`credibility-photo-upload${uploadingImage ? " is-disabled" : ""}`}>
                    {uploadingImage ? "Uploading..." : "Upload photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfileImageChange}
                      disabled={uploadingImage}
                      aria-label="Upload profile photo"
                    />
                  </label>
                  {profileImageUrl && (
                    <button
                      className="credibility-photo-remove"
                      type="button"
                      onClick={() => void handleRemoveProfileImage()}
                      disabled={uploadingImage}
                    >
                      Remove photo
                    </button>
                  )}
                  <small>JPEG, PNG or WebP, up to 10 MB.</small>
                </div>
              </div>
            </section>

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
              <h2>Career stage and professional rank</h2>
              <div className="credibility-grid">
                <label className="credibility-span">
                  Career stage
                  <select
                    value={careerStage}
                    onChange={(event) => setCareerStage(event.target.value)}
                  >
                    <option value="">Select career stage</option>
                    {CAREER_STAGES.map((stage) => (
                      <option value={stage} key={stage}>{stage}</option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="credibility-choice-fieldset">
                <legend>Professional qualifications and ranks</legend>
                <div className="credibility-choice-grid">
                  {PROFESSIONAL_RANKS.map((rank) => (
                    <label key={rank}>
                      <input
                        type="checkbox"
                        checked={professionalRanks.includes(rank)}
                        onChange={(event) => {
                          setProfessionalRanks((current) =>
                            event.target.checked
                              ? [...current, rank]
                              : current.filter((item) => item !== rank),
                          );
                        }}
                      />
                      {rank}
                    </label>
                  ))}
                </div>
              </fieldset>

              {["Entry-level researcher", "Research student", "Postgraduate student", "Early-career researcher"].includes(careerStage) && (
                <div className="credibility-grid credibility-entry-level">
                  <fieldset className="credibility-choice-fieldset credibility-span">
                    <legend>Research interests</legend>
                    <div className="credibility-choice-grid">
                      {RESEARCH_INTERESTS.map((interest) => (
                        <label key={interest}>
                          <input
                            type="checkbox"
                            checked={researchInterests.includes(interest)}
                            onChange={(event) => {
                              setResearchInterests((current) =>
                                event.target.checked
                                  ? [...current, interest]
                                  : current.filter((item) => item !== interest),
                              );
                            }}
                          />
                          {interest}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="credibility-span">
                    Research goal
                    <textarea
                      value={researchGoal}
                      onChange={(event) => setResearchGoal(event.target.value)}
                      rows={4}
                      maxLength={3000}
                      placeholder="What do you want to discover, learn, publish or achieve?"
                    />
                  </label>
                </div>
              )}
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
