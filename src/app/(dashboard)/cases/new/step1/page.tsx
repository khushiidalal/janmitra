'use client';

import { Cloud, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Stepper from '@/components/ui/Stepper';
import Card from '@/components/ui/Card';
import { useDraft } from '@/lib/useDraft';

export default function Step1Incident() {
  const router = useRouter();
  const { draft, setDraft } = useDraft();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setDraft({
      ...draft,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/cases/new/step2');
  };

  return (
    <div className="mx-auto max-w-[1080px] space-y-3">
      {/* PAGE HEADING */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Case Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage, track, and review active First Information Reports and
          Complaints.
        </p>
      </div>

      {/* STEPPER */}
      <Stepper currentStep={1} />

      {/* FORM CARD */}
      <Card className="rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Step 1: Incident Details
        </h2>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {/* TITLE */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Incident Title / Brief
            </label>

            <input
              type="text"
              name="title"
              value={draft.title}
              onChange={handleChange}
              placeholder="Briefly describe the incident"
              className="
                h-9
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
              required
            />
          </div>

          {/* DATE + TIME */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Date of Incident
              </label>

              <input
                type="date"
                name="date"
                value={draft.date}
                onChange={handleChange}
                className="
                  h-9
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Time of Incident
              </label>

              <input
                type="time"
                name="time"
                value={draft.time}
                onChange={handleChange}
                className="
                  h-9
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
          </div>

          {/* LOCATION */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Location of Incident
            </label>

            <input
              type="text"
              name="location"
              value={draft.location}
              onChange={handleChange}
              placeholder="Full address or descriptive location"
              className="
                h-9
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
              required
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Category
            </label>

            <select
              name="category"
              value={draft.category}
              onChange={handleChange}
              className="
                h-9
                w-full
                cursor-pointer
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                text-slate-700
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
              required
            >
              <option value="">Select a category ...</option>
              <option value="Theft">Theft / Burglary</option>
              <option value="Assault">Assault / Violence</option>
              <option value="Fraud">Fraud / Scam</option>
              <option value="Property Dispute">Property Dispute</option>
              <option value="Cyber Crime">Cyber Crime</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* NARRATIVE */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Detailed Narrative
            </label>

            <textarea
              name="description"
              value={draft.description}
              onChange={handleChange}
              rows={4}
              placeholder="Provide a detailed, chronological account of the events ..."
              className="
                w-full
                resize-none
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                py-2
                text-xs
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
              required
            />

            <p className="mt-1 text-[10px] text-slate-500">
              Include specific details, sequence of events, and any known
              context.
            </p>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[10px] font-medium text-green-700">
              <Cloud className="h-3.5 w-3.5" />
              <span>Your progress is saved automatically</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/cases')}
                className="
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-blue-700
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-800
                "
              >
                <span>Save and Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
