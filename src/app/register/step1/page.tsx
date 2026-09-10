"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Scale,
  LockKeyhole,
} from "lucide-react";

export default function RegistrationStep1() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    govIdType: "",
    govIdNumber: "",
    address: "",
  });

  // const [photo, setPhoto] = useState<File | null>(null);

  // useEffect(() => {
  //   window.scrollTo(0, 0);
  // }, []);

  // const photoPreview = useMemo(() => {
  //   if (!photo) return "";

  //   return URL.createObjectURL(photo);
  // }, [photo]);

  // useEffect(() => {
  //   return () => {
  //     if (photoPreview) {
  //       URL.revokeObjectURL(photoPreview);
  //     }
  //   };
  // }, [photoPreview]);

  const isStep1Complete =
    formData.fullName.trim() !== "" &&
    formData.dateOfBirth !== "" &&
    formData.gender !== "" &&
    formData.govIdType !== "" &&
    formData.govIdNumber.trim() !== "" &&
    formData.address.trim() !== "" &&
    photo !== null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    // 5 MB maximum
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("Photo size must be 5MB or less.");
      e.target.value = "";
      return;
    }

    setPhoto(selectedFile);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStep1Complete) return;

    sessionStorage.setItem(
      "registrationStep1",
      JSON.stringify({
        ...formData,
        photoName: photo?.name || "",
      }),
    );

    router.push("/register/step2");
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f9fd] text-slate-900">
      {/* ================= HEADER ================= */}

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
        <div className="flex h-[30px] items-center gap-1.5 rounded-full bg-green-100 px-3 text-sm font-medium text-green-700">
          <ShieldCheck size={12} />
          Session Encrypted
        </div>
      </header>

      {/* ================= MAIN PAGE ================= */}

      <div className="flex min-h-[calc(100vh-62px)] w-full">
        {/* ================= LEFT PANEL ================= */}

        <aside className="relative hidden w-[255px] shrink-0 overflow-hidden border-r border-[#dce6f0] bg-gradient-to-b from-[#f5faff] via-[#f1f8ff] to-[#eef8ff] lg:block">
          {/* LEFT TEXT */}
          <div className="relative z-10 px-[32px] pt-[70px]">
            <div className="mb-4 flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#e1efff] text-[#0758ba]">
              <Scale size={17} strokeWidth={2} />
            </div>

            <p className="text-[18px] font-semibold leading-tight text-[#113d6d]">
              Create Your
            </p>

            <h2 className="mt-[2px] text-[22px] font-bold leading-[1.02] text-[#1474e4]">
              Official Account
            </h2>

            <p className="mt-3 max-w-[175px] text-[12px] leading-[1.35] text-[#596f87]">
              Provide your legal information exactly as it appears on official
              documents.
            </p>
          </div>

          {/* COURTHOUSE + TRICOLOR */}
          <img
            src="/sidebar-tricolor.png"
            alt=""
            className="absolute bottom-[78px] left-0 w-full object-contain"
          />

          {/* LEFT FOOTER */}
          <div className="absolute bottom-[18px] left-[26px] right-[26px]">
            <div className="mb-3 flex items-center gap-8">
              <div className="h-px flex-1 bg-green-600" />
              <div className="h-px flex-1 bg-orange-500" />
            </div>

            <div className="flex items-start gap-2 text-[12px] font-medium leading-[1.45] text-[#3e5875]">
              <ShieldCheck
                size={12}
                className="mt-[1px] shrink-0 text-[#174f8e]"
              />

              <div>
                <p className="text-sm font-semibold leading-5 text-[#073B7A]">
                  Justice. Integrity. Service.
                </p>

                <p className="text-xs font-normal leading-5 text-[#4D6FA3]">
                  Protected · Confidential · Trusted
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT SIDE ================= */}

        <main className="flex min-w-0 flex-1 items-start justify-center p-4 lg:px-6 lg:py-4">
          <div className="w-full max-w-[980px] overflow-hidden rounded-[9px] border border-[#c9d5e2] bg-white shadow-sm">
            {/* ================= STEPPER ================= */}

            <div className="border-b border-[#dce4ed] px-7 py-3">
              <div className="flex items-start">
                {/* STEP 1 */}
                <div className="flex min-w-[105px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#1477e5] text-[15px] font-semibold text-white">
                    1
                  </div>

                  <span className="mt-1 text-[12px] font-medium text-[#176bc7]">
                    Basic Information
                  </span>
                </div>

                <div className="mt-[11px] h-px flex-1 bg-[#c5ced8]" />

                {/* STEP 2 */}
                <div className="flex min-w-[115px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#f0f1f2] text-[15px] font-medium text-[#656d77]">
                    2
                  </div>

                  <span className="mt-1 text-[12px] text-[#727b85]">
                    Official Information
                  </span>
                </div>

                <div className="mt-[11px] h-px flex-1 bg-[#c5ced8]" />

                {/* STEP 3 */}
                <div className="flex min-w-[100px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#f0f1f2] text-[15px] font-medium text-[#656d77]">
                    3
                  </div>

                  <span className="mt-1 text-[12px] text-[#727b85]">
                    Identity Proof
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleContinue}>
              {/* ================= FORM FIELDS ================= */}

              <section className="px-7 py-4">
                {/* FULL NAME */}
                <div className="mb-2.5">
                  <label className="mb-1 block text-[14px] font-semibold text-[#1c2835]">
                    Full Legal Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="First Middle Last"
                    required
                    className="h-[31px] w-full rounded-[5px] border border-[#c7d0db] bg-white px-2.5 text-[12px] text-slate-800 outline-none placeholder:text-[#8f9bad] focus:border-[#2781df] focus:ring-1 focus:ring-[#2781df]"
                  />
                </div>

                {/* DOB / GENDER */}
                <div className="mb-2.5 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[14px] font-semibold text-[#1c2835]">
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      className="h-[31px] w-full rounded-[5px] border border-[#c7d0db] bg-white px-2.5 text-[12px] text-slate-800 outline-none focus:border-[#2781df] focus:ring-1 focus:ring-[#2781df]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold text-[#1c2835]">
                      Legal Gender
                    </label>

                    <div className="relative">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="h-[31px] w-full appearance-none rounded-[5px] border border-[#c7d0db] bg-white px-2.5 pr-7 text-[12px] text-[#566474] outline-none focus:border-[#2781df] focus:ring-1 focus:ring-[#2781df]"
                      >
                        <option value="">Select gender...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#536170]" />
                    </div>
                  </div>
                </div>

                {/* GOVT ID */}
                <div className="mb-2.5 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[14px] font-semibold text-[#1c2835]">
                      Govt ID Type
                    </label>

                    <div className="relative">
                      <select
                        name="govIdType"
                        value={formData.govIdType}
                        onChange={handleChange}
                        required
                        className="h-[31px] w-full appearance-none rounded-[5px] border border-[#c7d0db] bg-white px-2.5 pr-7 text-[12px] text-[#566474] outline-none focus:border-[#2781df] focus:ring-1 focus:ring-[#2781df]"
                      >
                        <option value="">Select ID Type...</option>
                        <option value="aadhaar">Aadhaar</option>
                        <option value="pan">PAN</option>
                        <option value="passport">Passport</option>
                        <option value="driving-license">Driving License</option>
                        <option value="voter-id">Voter ID</option>
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#536170]" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-semibold text-[#1c2835]">
                      Govt ID Number
                    </label>

                    <input
                      type="text"
                      name="govIdNumber"
                      value={formData.govIdNumber}
                      onChange={handleChange}
                      placeholder="ID number"
                      required
                      className="h-[31px] w-full rounded-[5px] border border-[#c7d0db] bg-white px-2.5 text-[12px] text-slate-800 outline-none placeholder:text-[#8f9bad] focus:border-[#2781df] focus:ring-1 focus:ring-[#2781df]"
                    />
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="mb-3">
                  <label className="mb-1 block text-[14px] font-semibold text-[#1c2835]">
                    Primary Residential Address
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street Address, City, State/Province, Postal Code"
                      required
                      className="h-[31px] w-full rounded-[5px] border border-[#c7d0db] bg-white px-2.5 pr-7 text-[12px] text-slate-800 outline-none placeholder:text-[#8f9bad] focus:border-[#2781df] focus:ring-1 focus:ring-[#2781df]"
                    />

                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#536170]" />
                  </div>
                </div>

                {/* ================= FOOTER ================= */}

                <div className="flex flex-col gap-3 border-t border-[#e5eaf0] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* SECURITY */}
                  <div className="flex max-w-[380px] items-center gap-2 rounded-[4px] bg-[#eef6ff] px-2.5 py-2 text-[10px] leading-[1.4] text-[#0868d7]">
                    <LockKeyhole size={20} className="shrink-0" />

                    <span>
                      Your information is encrypted and secured. It will only be
                      used for official purposes and will not be shared without
                      authorization.
                    </span>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="flex h-[30px] items-center gap-1.5 rounded-[5px] border border-[#8794a3] bg-white px-3.5 text-[14px] font-medium text-[#283544] transition hover:bg-slate-50"
                    >
                      <ArrowLeft size={11} />
                      Return to login
                    </button>

                    <button
                      type="submit"
                      disabled={!isStep1Complete}
                      className={`flex h-[30px] items-center gap-1.5 rounded-[5px] px-3.5 text-[14px] font-medium text-white transition ${
                        isStep1Complete
                          ? "bg-[#0877eb] hover:bg-[#0068d6]"
                          : "cursor-not-allowed bg-[#82b9ef]"
                      }`}
                    >
                      Continue
                      <ArrowRight size={11} />
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
