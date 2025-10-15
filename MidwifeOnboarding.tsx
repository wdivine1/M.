import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MidwifeOnboardingData = {
  credentialType: 'CNM' | 'CPM' | 'LM' | 'CM' | 'Student Midwife' | 'Other' | '';
  credentialOther: string;
  yearsPracticing: number | '';
  hasHospitalPrivilegesOrBirthCenter: boolean | null;
  groupOrSolo: 'Group practice' | 'Solo' | '';
  serviceAreas: string;
  supervisingStudents: boolean | null;
  monthlyBirths: number | '';
  worksIndependentlyOrTeam: 'Independent' | 'Team' | '';
  ehrSystem: string; // freeform
  integrateEhr: boolean | null;
  primaryClientTypes: string[];
  preferredRealtimeData: string[];
  preferredRealtimeDataOther: string;
  alertFrequency: 'immediately' | 'daily' | 'weekly' | '';
  connectWithDoulas: boolean | null;
  preferredNonUrgentContact: 'secure_message' | 'app_checkin' | 'scheduled_call' | '';
  coordinationImprovement: string;
  sharedValues: string[];
};

const CREDENTIALS: Array<MidwifeOnboardingData['credentialType']> = [
  'CNM',
  'CPM',
  'LM',
  'CM',
  'Student Midwife',
  'Other',
];

const CLIENT_TYPES = [
  'Low-risk',
  'High-risk with physician collaboration',
  'VBAC candidates',
  'Home or community births',
];

const REALTIME_DATA = [
  'Vitals',
  'Mood/emotional check-ins',
  'Fetal movement',
  'Contraction patterns',
  'Other',
];

const VALUES = [
  'Respect for bodily autonomy',
  'Culturally affirming care',
  'Evidence-based support',
  'Emotional safety',
  'Ancestral or community-based healing',
];

export function MidwifeOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MidwifeOnboardingData>({
    credentialType: '',
    credentialOther: '',
    yearsPracticing: '',
    hasHospitalPrivilegesOrBirthCenter: null,
    groupOrSolo: '',
    serviceAreas: '',
    supervisingStudents: null,
    monthlyBirths: '',
    worksIndependentlyOrTeam: '',
    ehrSystem: '',
    integrateEhr: null,
    primaryClientTypes: [],
    preferredRealtimeData: [],
    preferredRealtimeDataOther: '',
    alertFrequency: '',
    connectWithDoulas: null,
    preferredNonUrgentContact: '',
    coordinationImprovement: '',
    sharedValues: [],
  });

  const isValid = useMemo(() => {
    const credentialOk = data.credentialType !== '' && (data.credentialType !== 'Other' || data.credentialOther.trim().length > 0);
    const realtimeOk = data.preferredRealtimeData.length > 0 && (!data.preferredRealtimeData.includes('Other') || data.preferredRealtimeDataOther.trim().length > 0);
    return (
      credentialOk &&
      data.yearsPracticing !== '' &&
      data.hasHospitalPrivilegesOrBirthCenter !== null &&
      data.groupOrSolo !== '' &&
      data.serviceAreas.trim().length > 0 &&
      data.supervisingStudents !== null &&
      data.monthlyBirths !== '' &&
      data.worksIndependentlyOrTeam !== '' &&
      // ehrSystem optional
      data.integrateEhr !== null &&
      data.primaryClientTypes.length > 0 &&
      realtimeOk &&
      data.alertFrequency !== '' &&
      data.connectWithDoulas !== null &&
      data.preferredNonUrgentContact !== '' &&
      data.sharedValues.length > 0
    );
  }, [data]);

  function toggleArrayValue<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  }

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

    const insertPayload = {
      user_id: user.id,
      credential_type: data.credentialType,
      credential_other: data.credentialType === 'Other' ? data.credentialOther : null,
      years_practicing: typeof data.yearsPracticing === 'number' ? data.yearsPracticing : Number(data.yearsPracticing),
      has_hospital_privileges_or_birth_center: data.hasHospitalPrivilegesOrBirthCenter,
      group_or_solo: data.groupOrSolo,
      service_areas: data.serviceAreas,
      supervising_students: data.supervisingStudents,
      monthly_births: typeof data.monthlyBirths === 'number' ? data.monthlyBirths : Number(data.monthlyBirths),
      works_independently_or_team: data.worksIndependentlyOrTeam,
      ehr_system: data.ehrSystem || null,
      integrate_ehr: data.integrateEhr,
      primary_client_types: data.primaryClientTypes,
      preferred_realtime_data: data.preferredRealtimeData,
      preferred_realtime_data_other: data.preferredRealtimeData.includes('Other') ? data.preferredRealtimeDataOther : null,
      alert_frequency: data.alertFrequency,
      connect_with_doulas: data.connectWithDoulas,
      preferred_non_urgent_contact: data.preferredNonUrgentContact,
      coordination_improvement: data.coordinationImprovement || null,
      shared_values: data.sharedValues,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('midwife_onboarding')
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white border rounded-lg p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold">💼 Professional Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="font-medium">What is your midwifery credential or license type?</label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {CREDENTIALS.map(option => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.credentialType === option}
                      onChange={() => setData(prev => ({ ...prev, credentialType: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
              {data.credentialType === 'Other' && (
                <input
                  className="mt-2 w-full border rounded p-2"
                  type="text"
                  placeholder="Please specify your credential/license"
                  value={data.credentialOther}
                  onChange={e => setData(prev => ({ ...prev, credentialOther: e.target.value }))}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium">How many years have you been practicing?</label>
                <input
                  className="mt-2 w-full border rounded p-2"
                  type="number"
                  min={0}
                  value={data.yearsPracticing}
                  onChange={e => setData(prev => ({ ...prev, yearsPracticing: e.target.value === '' ? '' : Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="font-medium">Do you currently have hospital privileges or work in a birth center?</label>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.hasHospitalPrivilegesOrBirthCenter === true}
                      onChange={() => setData(prev => ({ ...prev, hasHospitalPrivilegesOrBirthCenter: true }))}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.hasHospitalPrivilegesOrBirthCenter === false}
                      onChange={() => setData(prev => ({ ...prev, hasHospitalPrivilegesOrBirthCenter: false }))}
                    />
                    No
                  </label>
                </div>
              </div>
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

            <div>
              <label className="font-medium">Are you currently supervising any students or apprentices?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.supervisingStudents === true}
                    onChange={() => setData(prev => ({ ...prev, supervisingStudents: true }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.supervisingStudents === false}
                    onChange={() => setData(prev => ({ ...prev, supervisingStudents: false }))}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">🩺 Practice Setup</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">How many births do you typically attend per month?</label>
              <input
                className="mt-2 w-full border rounded p-2"
                type="number"
                min={0}
                value={data.monthlyBirths}
                onChange={e => setData(prev => ({ ...prev, monthlyBirths: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="font-medium">Do you work independently or with a team?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.worksIndependentlyOrTeam === 'Independent'}
                    onChange={() => setData(prev => ({ ...prev, worksIndependentlyOrTeam: 'Independent' }))}
                  />
                  Independent
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.worksIndependentlyOrTeam === 'Team'}
                    onChange={() => setData(prev => ({ ...prev, worksIndependentlyOrTeam: 'Team' }))}
                  />
                  Team
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="font-medium">What electronic health record (EHR) system do you currently use, if any?</label>
              <input
                className="mt-2 w-full border rounded p-2"
                type="text"
                placeholder="e.g., Athenahealth, Elation, none"
                value={data.ehrSystem}
                onChange={e => setData(prev => ({ ...prev, ehrSystem: e.target.value }))}
              />
            </div>
            <div>
              <label className="font-medium">Would you like to integrate your EHR data with MATRI?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.integrateEhr === true}
                    onChange={() => setData(prev => ({ ...prev, integrateEhr: true }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.integrateEhr === false}
                    onChange={() => setData(prev => ({ ...prev, integrateEhr: false }))}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">🌸 Client Care & Monitoring</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="font-medium">What types of clients do you primarily serve?</label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {CLIENT_TYPES.map(option => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.primaryClientTypes.includes(option)}
                      onChange={() => setData(prev => ({ ...prev, primaryClientTypes: toggleArrayValue(prev.primaryClientTypes, option) }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="font-medium">Which real-time data would be most helpful for your care?</label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {REALTIME_DATA.map(option => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.preferredRealtimeData.includes(option)}
                      onChange={() => setData(prev => ({ ...prev, preferredRealtimeData: toggleArrayValue(prev.preferredRealtimeData, option) }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
              {data.preferredRealtimeData.includes('Other') && (
                <input
                  className="mt-2 w-full border rounded p-2"
                  type="text"
                  placeholder="Please specify other data you'd like to see"
                  value={data.preferredRealtimeDataOther}
                  onChange={e => setData(prev => ({ ...prev, preferredRealtimeDataOther: e.target.value }))}
                />
              )}
            </div>
            <div>
              <label className="font-medium">How often would you like to receive alerts about client changes?</label>
              <div className="mt-2 flex flex-col gap-2 text-sm">
                {[
                  { key: 'immediately', label: 'Immediately' },
                  { key: 'daily', label: 'Daily summary' },
                  { key: 'weekly', label: 'Weekly overview' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.alertFrequency === opt.key}
                      onChange={() => setData(prev => ({ ...prev, alertFrequency: opt.key as MidwifeOnboardingData['alertFrequency'] }))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">📲 Collaboration & Communication</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Would you like to connect with doulas in your area for shared client care?</label>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.connectWithDoulas === true}
                    onChange={() => setData(prev => ({ ...prev, connectWithDoulas: true }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.connectWithDoulas === false}
                    onChange={() => setData(prev => ({ ...prev, connectWithDoulas: false }))}
                  />
                  No
                </label>
              </div>
            </div>
            <div>
              <label className="font-medium">What’s your preferred contact method for non-urgent client communication?</label>
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.preferredNonUrgentContact === 'secure_message'}
                    onChange={() => setData(prev => ({ ...prev, preferredNonUrgentContact: 'secure_message' }))}
                  />
                  Secure message
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.preferredNonUrgentContact === 'app_checkin'}
                    onChange={() => setData(prev => ({ ...prev, preferredNonUrgentContact: 'app_checkin' }))}
                  />
                  App check-in
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={data.preferredNonUrgentContact === 'scheduled_call'}
                    onChange={() => setData(prev => ({ ...prev, preferredNonUrgentContact: 'scheduled_call' }))}
                  />
                  Scheduled call
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="font-medium">What’s one thing MATRI could do to make your client coordination easier?</label>
              <input
                className="mt-2 w-full border rounded p-2"
                type="text"
                placeholder="Optional"
                value={data.coordinationImprovement}
                onChange={e => setData(prev => ({ ...prev, coordinationImprovement: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">🌺 Shared Values & Vision</h2>
          <div className="mt-4">
            <label className="font-medium">Which of these MATRI values resonate most with your work? (Select all that apply)</label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {VALUES.map(option => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.sharedValues.includes(option)}
                    onChange={() => setData(prev => ({ ...prev, sharedValues: toggleArrayValue(prev.sharedValues, option) }))}
                  />
                  {option}
                </label>
              ))}
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
