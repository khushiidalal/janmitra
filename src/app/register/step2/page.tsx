'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from "lucide-react";

export default function RegistrationStep2() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    department: "",
    designation: "",
    employeeId: "",
    jurisdiction: "",
    joiningDate: "",
    supervisingOfficer: "",
    officialEmail: "",
    officialPhone: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const savedData = sessionStorage.getItem("registrationStep2");

    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch {
        
      }
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const isComplete =
    formData.department.trim() !== "" &&
    formData.designation.trim() !== "" &&
    formData.employeeId.trim() !== "" &&
    formData.jurisdiction !== "" &&
    formData.joiningDate !== "" &&
    formData.supervisingOfficer.trim() !== "" &&
    formData.officialEmail.trim() !== "" &&
    formData.officialPhone.trim() !== "";

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isComplete) return;

    sessionStorage.setItem(
      "registrationStep2",
      JSON.stringify(formData)
    );

    router.push("/register/step3");
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f9fd] text-slate-900">

      {}

      <header className="flex h-[62px] w-full items-center justify-between border-b border-[#dce6f0] bg-white px-5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="National Emblem"
            className="h-[48px] w-[48px] object-contain"
          />

          <div>
            <h1 className="text-[20px] font-bold leading-none tracking-[0.04em] text-[#123f70]">
              JANMITRA
            </h1>

            <p className="mt-1 text-[9px] leading-none text-[#6b7d91]">
              Legal Investigation System
            </p>
          </div>
        </div>

        <div className="flex h-[30px] items-center gap-1.5 rounded-full bg-green-100 px-3 text-14px font-medium text-green-700">
          <ShieldCheck size={13} />
          Session Encrypted
        </div>
      </header>

      {}

      <div className="flex min-h-[calc(100vh-62px)] w-full">

        {}

        <aside className="relative hidden w-[255px] shrink-0 overflow-hidden border-r border-[#dce6f0] bg-gradient-to-b from-[#f5faff] via-[#f1f8ff] to-[#eef8ff] lg:block">

          {}
          <div className="relative z-10 px-[32px] pt-[70px]">
            <div className="mb-4 flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#0b3b78] text-white">
              <Scale size={17} strokeWidth={2} />
            </div>

            <p className="text-14px font-semibold leading-tight text-[#113d6d]">
              Create Your
            </p>

            <h2 className="mt-[2px] text-[22px] font-bold leading-[1.02] text-[#1474e4]">
              Official Account
            </h2>

            <p className="mt-3 max-w-[175px] text-xs leading-[1.4] text-[#596f87]">
              Provide your legal information exactly as it appears on official
              documents.
            </p>
          </div>

          {}
          <img
            src="/sidebar-tricolor.png"
            alt=""
            className="absolute bottom-[82px] left-0 w-full object-contain"
          />

          {}
          <div className="absolute bottom-[20px] left-[28px] right-[28px]">

            <div className="mb-4 flex items-center justify-between">
              <div className="h-[2px] w-[42%] rounded-full bg-[#43A96B]" />
              <div className="h-[2px] w-[42%] rounded-full bg-[#F57C00]" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B3B78] text-white">
                <Scale size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold leading-4 text-[#073B7A]">
                  Justice. Integrity. Service.
                </p>

                <p className="text-[10px] leading-4 text-[#4D6FA3]">
                  Protected · Confidential · Trusted
                </p>
              </div>
            </div>
          </div>
        </aside>

        {}

        <main className="flex min-w-0 flex-1 items-start justify-center p-4 lg:px-6 lg:py-4">

          <div className="w-full max-w-[980px] overflow-hidden rounded-[9px] border border-[#c9d5e2] bg-white shadow-sm">

            {}

            <div className="border-b border-[#dce4ed] px-7 py-3">
              <div className="flex items-start">

                {}
                <div className="flex min-w-[105px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#1477e5] text-[12px] font-semibold text-white">
                    1
                  </div>

                  <span className="mt-1 text-[12px] font-medium text-[#176bc7]">
                    Basic Information
                  </span>
                </div>

                <div className="mt-[11px] h-px flex-1 bg-[#70aef0]" />

                {}
                <div className="flex min-w-[115px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#1477e5] text-[12px] font-semibold text-white">
                    2
                  </div>

                  <span className="mt-1 text-[12px] font-medium text-[#176bc7]">
                    Official Information
                  </span>
                </div>

                <div className="mt-[11px] h-px flex-1 bg-[#c5ced8]" />

                {}
                <div className="flex min-w-[100px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#f0f1f2] text-[12px] font-medium text-[#656d77]">
                    3
                  </div>

                  <span className="mt-1 text-[12px] text-[#727b85]">
                    Identity Proof
                  </span>
                </div>
              </div>
            </div>

            {}

            <form onSubmit={handleContinue}>
              <section className="px-7 py-5">

                {}
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Department / Agency Name
                    </label>

                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. Federal Bureau of Investigation"
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Designation / Rank
                    </label>

                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Special Agent"
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {}
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Employee / Badge ID
                    </label>

                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      placeholder="Enter official ID number"
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Jurisdiction / Location
                    </label>

                    <div className="relative">
                      <select
                        name="jurisdiction"
                        value={formData.jurisdiction}
                        onChange={handleChange}
                        required
                        className="h-[36px] w-full appearance-none rounded-[5px] border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">
                          Select jurisdiction level
                        </option>

                        <option value="national">National</option>
                        <option value="state">State</option>
                        <option value="district">District</option>
                        <option value="city">City</option>
                        <option value="local">Local</option>
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>
                </div>

                {}
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Date of Joining
                    </label>

                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Supervising Officer
                    </label>

                    <input
                      type="text"
                      name="supervisingOfficer"
                      value={formData.supervisingOfficer}
                      onChange={handleChange}
                      placeholder="Name or Title"
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {}
                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Official Email
                    </label>

                    <input
                      type="email"
                      name="officialEmail"
                      value={formData.officialEmail}
                      onChange={handleChange}
                      placeholder="Enter Email"
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-14px font-semibold text-slate-800">
                      Official Phone
                    </label>

                    <input
                      type="tel"
                      name="officialPhone"
                      value={formData.officialPhone}
                      onChange={handleChange}
                      placeholder="Enter Phone no."
                      required
                      className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

                  {}
                  <div className="flex max-w-[430px] items-center gap-2 rounded-[4px] bg-blue-50 px-3 py-2 text-[12px] leading-[1.4] text-blue-700">
                    <LockKeyhole className="h-4 w-4 shrink-0" />

                    <span>
                      Your information is encrypted and secured. It will only
                      be used for official purposes and will not be shared
                      without authorization.
                    </span>
                  </div>

                  {}
                  <div className="flex shrink-0 items-center gap-2">

                    <button
                      type="button"
                      onClick={() => router.push("/register/step1")}
                      className="flex h-[34px] items-center gap-1.5 rounded-[5px] border border-slate-400 bg-white px-4 text-12px font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <ArrowLeft size={13} />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={!isComplete}
                      className={`flex h-[34px] items-center gap-1.5 rounded-[5px] px-4 text-12px font-medium text-white transition ${
                        isComplete
                          ? "bg-[#0877eb] hover:bg-[#0068d6]"
                          : "cursor-not-allowed bg-[#82b9ef]"
                      }`}
                    >
                      Continue
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </section>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
