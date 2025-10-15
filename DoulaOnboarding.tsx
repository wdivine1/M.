import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DoulaOnboardingData = {
  doulaTypes: string[];
  experienceCount: number | '';
  isCertified: boolean | null;
  certificationOrgs: string;
  groupOrSolo: 'Group practice' | 'Solo' | '';
  serviceAreas: string; // freeform counties and zip codes
  independentOrAgency: 'Independent' | 'Agency/collective' | '';
  typicalMonthlyClients: number | '';
  matchingPreference: 'automatic' | 'manual' | 'referral' | '';
  servicesOffered: string[];
  styles: string[];
  digitalComfortLevel: 1 | 2 | 3 | 4 | 5 | null;
  preferredUpdateChannel: 'app' | 'text' | 'email' | '';
  joinDoulaConnect: boolean | null;
};

const DOULA_TYPES = [
  'Birth',
  'Postpartum',
  'Full Spectrum',
  'Bereavement',
  'Fertility',
  'Other',
];

const SERVICES = [
  'Prenatal visits',
  'Labor/birth support',
  'Postpartum care',
  'Breastfeeding or lactation support',
  'Virtual or hybrid sessions',
  'Birth planning/education',
];

const STYLES = [
  'Calm & grounding',
  'Energetic & motivational',
  'Educational & structured',
  'Intuitive & emotionally nurturing',
];

export function DoulaOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DoulaOnboardingData>({
    doulaTypes: [],
    experienceCount: '',
    isCertified: null,
    certificationOrgs: '',
    groupOrSolo: '',
    serviceAreas: '',
    independentOrAgency: '',
    typicalMonthlyClients: '',
    matchingPreference: '',
    servicesOffered: [],
    styles: [],
    digitalComfortLevel: null,
    preferredUpdateChannel: '',
    joinDoulaConnect: null,
  });

  const isValid = useMemo(() => {
    return (
      data.doulaTypes.length > 0 &&
      data.experienceCount !== '' &&
      data.isCertified !== null &&
      data.groupOrSolo !== '' &&
      data.serviceAreas.trim().length > 0 &&
      data.independentOrAgency !== '' &&
      data.typicalMonthlyClients !== '' &&
      data.matchingPreference !== '' &&
      data.servicesOffered.length > 0 &&
      data.styles.length > 0 &&
      data.digitalComfortLevel !== null &&
      data.preferredUpdateChannel !== '' &&
      data.joinDoulaConnect !== null
    );
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to continue.');
      return;
    }
    if (!isValid) {
      setError('Please complete all required fields.');
      return;
    }

    setSaving(true);
    setError(null);

    // Persist responses in a dedicated table
    const insertPayload = {
      user_id: user.id,
      doula_types: data.doulaTypes,
      experience_count: typeof data.experienceCount === 'number' ? data.experienceCount : Number(data.experienceCount),
      is_certified: data.isCertified,
      certification_orgs: data.certificationOrgs || null,
      group_or_solo: data.groupOrSolo,
      service_areas: data.serviceAreas,
      independent_or_agency: data.independentOrAgency,
      typical_monthly_clients: typeof data.typicalMonthlyClients === 'number' ? data.typicalMonthlyClients : Number(data.typicalMonthlyClients),
      matching_preference: data.matchingPreference,
      services_offered: data.servicesOffered,
      styles: data.styles,
      digital_comfort_level: data.digitalComfortLevel,
      preferred_update_channel: data.preferredUpdateChannel,
      join_doula_connect: data.joinDoulaConnect,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('doula_onboarding')
      .upsert(insertPayload, { onConflict: 'user_id' });

    if (insertError) {
      setSaving(false);
      setError('Could not save responses. Please try again.');
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);

    if (updateError) {
      setSaving(false);
      setError('Saved responses, but could not complete onboarding. Try again.');
      return;
    }

    setSaving(false);
    onComplete();
  }

  function toggleArrayValue<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white border rounded-lg p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold">🩷 Basic Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="font-medium">What type of doula are you? (Select all that apply)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {DOULA_TYPES.map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={data.doulaTypes.includes(option)}
                      onChange={() => setData(prev => ({ ...prev, doulaTypes: toggleArrayValue(prev.doulaTypes, option) }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium">How many births or postpartum clients have you supported so far?</label>
                <input
                  className="mt-2 w-full border rounded p-2"
                  type="number"
                  min={0}
                  value={data.experienceCount}
                  onChange={e => setData(prev => ({ ...prev, experienceCount: e.target.value === '' ? '' : Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="font-medium">Are you certified?</label>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.isCertified === true}
                      onChange={() => setData(prev => ({ ...prev, isCertified: true }))}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.isCertified === false}
                      onChange={() => setData(prev => ({ ...prev, isCertified: false }))}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="font-medium">If yes, through which organization (e.g., DONA, NBDA, ICTC, etc.)?</label>
              <input
                className="mt-2 w-full border rounded p-2"
                type="text"
                placeholder="List certifications (comma-separated)"
                value={data.certificationOrgs}
                onChange={e => setData(prev => ({ ...prev, certificationOrgs: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Are you part of a group practice or do you work solo?</label>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.groupOrSolo === 'Group practice'}
                      onChange={() => setData(prev => ({ ...prev, groupOrSolo: 'Group practice' }))}
                    />
                    Group practice
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.groupOrSolo === 'Solo'}
                      onChange={() => setData(prev => ({ ...prev, groupOrSolo: 'Solo' }))}
                    />
                    Solo
                  </label>
                </div>
              </div>
              <div>
                <label className="font-medium">Which counties and zip codes do you currently support?</label>
                <textarea
                  className="mt-2 w-full border rounded p-2"
                  placeholder="e.g., Alameda County (94601, 94606), Contra Costa County (94565)"
                  rows={3}
                  value={data.serviceAreas}
                  onChange={e => setData(prev => ({ ...prev, serviceAreas: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">🌿 Practice Details</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Do you work independently or through an agency/collective?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.independentOrAgency === 'Independent'}
                    onChange={() => setData(prev => ({ ...prev, independentOrAgency: 'Independent' }))}
                  />
                  Independent
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.independentOrAgency === 'Agency/collective'}
                    onChange={() => setData(prev => ({ ...prev, independentOrAgency: 'Agency/collective' }))}
                  />
                  Agency/collective
                </label>
              </div>
            </div>
            <div>
              <label className="font-medium">How many clients do you typically support per month?</label>
              <input
                className="mt-2 w-full border rounded p-2"
                type="number"
                min={0}
                value={data.typicalMonthlyClients}
                onChange={e => setData(prev => ({ ...prev, typicalMonthlyClients: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="font-medium">What’s your preferred way to be matched with clients?</label>
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.matchingPreference === 'automatic'}
                    onChange={() => setData(prev => ({ ...prev, matchingPreference: 'automatic' }))}
                  />
                  Automatic match based on criteria
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.matchingPreference === 'manual'}
                    onChange={() => setData(prev => ({ ...prev, matchingPreference: 'manual' }))}
                  />
                  Manual approval after review
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.matchingPreference === 'referral'}
                    onChange={() => setData(prev => ({ ...prev, matchingPreference: 'referral' }))}
                  />
                  Referral only
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">✨ Support Style</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="font-medium">Which of these services do you offer? (Select all that apply)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SERVICES.map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={data.servicesOffered.includes(option)}
                      onChange={() => setData(prev => ({ ...prev, servicesOffered: toggleArrayValue(prev.servicesOffered, option) }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="font-medium">How would you describe your doula style? (Select all that apply)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STYLES.map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={data.styles.includes(option)}
                      onChange={() => setData(prev => ({ ...prev, styles: toggleArrayValue(prev.styles, option) }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">💻 Communication & Tech</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">How comfortable are you with digital tools or apps for client updates? (1–5)</label>
              <div className="mt-2 flex items-center gap-3 text-sm">
                {[1,2,3,4,5].map(n => (
                  <label key={n} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.digitalComfortLevel === n}
                      onChange={() => setData(prev => ({ ...prev, digitalComfortLevel: n as DoulaOnboardingData['digitalComfortLevel'] }))}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="font-medium">What’s your preferred way to get client updates?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.preferredUpdateChannel === 'app'}
                    onChange={() => setData(prev => ({ ...prev, preferredUpdateChannel: 'app' }))}
                  />
                  App notification
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.preferredUpdateChannel === 'text'}
                    onChange={() => setData(prev => ({ ...prev, preferredUpdateChannel: 'text' }))}
                  />
                  Text alert
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.preferredUpdateChannel === 'email'}
                    onChange={() => setData(prev => ({ ...prev, preferredUpdateChannel: 'email' }))}
                  />
                  Email summary
                </label>
              </div>
            </div>
            <div>
              <label className="font-medium">Would you like to join MATRI’s “Doula Connect” to collaborate with midwives or receive referrals?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.joinDoulaConnect === true}
                    onChange={() => setData(prev => ({ ...prev, joinDoulaConnect: true }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.joinDoulaConnect === false}
                    onChange={() => setData(prev => ({ ...prev, joinDoulaConnect: false }))}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !isValid}
            className={`px-4 py-2 rounded text-white ${saving || !isValid ? 'bg-gray-400' : 'bg-harmony-brown hover:bg-harmony-brown/90'}`}
          >
            {saving ? 'Saving…' : 'Complete Onboarding'}
          </button>
        </div>
      </form>
    </div>
  );
}
