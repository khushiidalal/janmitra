'use client';

import {
  Cloud,
  Trash2,
  User,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Plus,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Stepper from '@/components/ui/Stepper';
import Card from '@/components/ui/Card';
import { useDraft } from '@/lib/useDraft';

export default function Step2People() {
  const router = useRouter();
  const { draft, setDraft } = useDraft();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const clearForm = () => {
    setName('');
    setRelationship('');
    setContact('');
    setAddress('');
    setNotes('');
  };

  const handleSavePerson = () => {
    if (!name || !relationship) return;

    const newPerson = {
      id: Math.random().toString(),
      name,
      relationship,
      contact,
      address,
      notes,
    };

    setDraft({
      ...draft,
      people: [...(draft.people || []), newPerson],
    });

    clearForm();
  };

  const handleRemovePerson = (id: string) => {
    setDraft({
      ...draft,
      people: (draft.people || []).filter(
        (person: any) => person.id !== id
      ),
    });
  };

  return (
    <div className="mx-auto max-w-[1080px] space-y-3">

      {}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Case Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage, track, and review active First Information Reports and
          Complaints.
        </p>
      </div>

      {}
      <Stepper currentStep={2} />

      {}
      <div className="px-1">
        <h2 className="text-base font-semibold text-slate-900">
          People Involved
        </h2>

        <p className="mt-1 max-w-[850px] text-sm leading-5 text-slate-600">
          Add anyone connected to this incident - witnesses, victims, or
          persons involved. This step is optional if no one else is known yet.
        </p>
      </div>

      {}
      {draft.people?.length > 0 && (
        <div className="space-y-2">
          {draft.people.map((person: any) => (
            <Card
              key={person.id}
              className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">

                  {}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {person.name}
                      </h3>

                      <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        {person.relationship}
                      </span>
                    </div>

                    {(person.contact || person.address) && (
                      <p className="mt-1 text-sm text-slate-600">
                        {person.contact}

                        {person.contact && person.address
                          ? ' • '
                          : ''}

                        {person.address}
                      </p>
                    )}

                    {person.notes && (
                      <p className="mt-1.5 text-[11px] italic text-slate-500">
                        "{person.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemovePerson(person.id)}
                    className="rounded p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {}
      <Card className="rounded-xl border border-blue-300 bg-white p-5 shadow-sm">

        {}
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
          <User className="h-4 w-4 text-slate-800" />

          <h3 className="text-sm font-semibold text-slate-900">
            Add Another Person
          </h3>
        </div>

        <div className="space-y-3">

          {}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Relationship to Incident
              </label>

              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select relationship ...</option>
                <option value="Victim">Victim</option>
                <option value="Witness">Witness</option>
                <option value="Suspect">Suspect</option>
                <option value="Reporting Person">
                  Reporting Person
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Contact
              </label>

              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. +91 555 000 0000"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Address
            </label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Address"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Notes (Optional)
            </label>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant details about this person's involvement"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={clearForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSavePerson}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Save Person
            </button>
          </div>
        </div>
      </Card>

      {}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">

        {}
        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
          <Cloud className="h-4 w-4" />

          <span>
            Your progress is saved automatically
          </span>
        </div>

        {}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step1')
            }
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step4')
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/cases/new/step4')
            }
            className="flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
          >
            Save and Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
