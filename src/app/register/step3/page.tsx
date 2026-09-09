'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { register, sendEmailOTP, verifyEmailOTP } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Glasses,
  Lightbulb,
  LockKeyhole,
  Mail,
  ScanFace,
  Scale,
  ShieldCheck,
} from "lucide-react";

type VerificationStep = 1 | 2 | 3 | 4;

export default function RegistrationStep3() {
  const router = useRouter();

  const [verificationStep, setVerificationStep] =
    useState<VerificationStep>(1);

  const [faceVerified, setFaceVerified] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [biometricVerified, setBiometricVerified] = useState(false);

  // Password state (typed, not PIN pad — so we can satisfy 8-digit backend rule
  // while giving the user a real password input they can see/hide)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [officialEmailDisplay, setOfficialEmailDisplay] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    const savedStep2Raw = sessionStorage.getItem("registrationStep2");
    if (savedStep2Raw) {
      try {
        const parsed = JSON.parse(savedStep2Raw);
        setOfficialEmailDisplay(parsed.officialEmail || "");
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;

    if (!cameraActive || !video || !stream) return;

    video.srcObject = stream;
    void video.play();
  }, [cameraActive]);

  // ---------- helpers ----------

  const passwordValid = /^\d{8}$/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  // ---------- camera verification ----------

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraActive(false);
  };

  const handleFaceScan = async () => {
    if (faceVerified) {
      setVerificationStep(2);
      return;
    }

    if (!cameraActive) {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is not available in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        cameraStreamRef.current = stream;
        setError("");
        setCameraActive(true);
      } catch {
        setError("Camera permission was denied or the camera is unavailable.");
      }
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError("Camera is still starting. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setProfilePhoto(canvas.toDataURL("image/jpeg", 0.82));
    setFaceVerified(true);
    stopCamera();
    setTimeout(() => setVerificationStep(2), 400);
  };

  const handleBiometricScan = () => {
    setBiometricVerified(true);
    setTimeout(() => setVerificationStep(3), 400);
  };

  // ---------- Resend Email OTP handlers ----------

  const handleSendEmailOTP = async () => {
    const savedStep2Raw = sessionStorage.getItem("registrationStep2");
    if (!savedStep2Raw) {
      setError("Registration data is missing. Please go back and complete Step 2.");
      return;
    }

    const savedStep2 = JSON.parse(savedStep2Raw);
    const email = String(savedStep2.officialEmail || "").trim().toLowerCase();

    if (!email) {
      setError("Official email address is required before sending OTP.");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      await sendEmailOTP(email);
      setEmailOtpSent(true);
      setEmailOtpVerified(false);
    } catch (err: any) {
      setError(err.message || "Unable to send OTP email via Resend.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    const savedStep2Raw = sessionStorage.getItem("registrationStep2");
    if (!savedStep2Raw) {
      setError("Registration data is missing. Please go back and complete Step 2.");
      return;
    }

    const savedStep2 = JSON.parse(savedStep2Raw);
    const email = String(savedStep2.officialEmail || "").trim().toLowerCase();

    if (!email) {
      setError("Official email address is required before OTP verification.");
      return;
    }

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit OTP received in your email.");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      await verifyEmailOTP(email, otpCode.trim());
      setEmailOtpVerified(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP. Please check your inbox or resend.");
      setEmailOtpVerified(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmitRegistration = async () => {
    const savedStep2Raw = sessionStorage.getItem("registrationStep2");
    if (!savedStep2Raw) {
      setError("Registration data is missing. Please go back and complete Step 2.");
      return;
    }

    setError("");

    // Pull data collected in Steps 1 & 2 from sessionStorage
    const step1Raw = sessionStorage.getItem("registrationStep1");
    const finalStep2Raw = sessionStorage.getItem("registrationStep2");

    if (!step1Raw || !finalStep2Raw) {
      setError(
        "Registration data is missing. Please go back and complete Steps 1 and 2."
      );
      return;
    }

    const step1 = JSON.parse(step1Raw);
    const step2 = JSON.parse(finalStep2Raw);

    // The backend requires: fullName, email, password (8 digits)
    const fullName = step1.fullName?.trim();
    const email = step2.officialEmail?.trim().toLowerCase();

    if (!fullName || !email) {
      setError(
        "Full name or email is missing. Please go back to Step 1 / Step 2."
      );
      return;
    }

    if (!passwordValid) {
      setError("Password must be exactly 8 digits (numbers only).");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const extraProfile = {
        dateOfBirth: step1.dateOfBirth,
        gender: step1.gender,
        govIdType: step1.govIdType,
        govIdNumber: step1.govIdNumber,
        address: step1.address,
        department: step2.department,
        designation: step2.designation,
        employeeId: step2.employeeId,
        jurisdiction: step2.jurisdiction,
        joiningDate: step2.joiningDate,
        supervisingOfficer: step2.supervisingOfficer,
        officialEmail: step2.officialEmail,
        officialPhone: step2.officialPhone,
        profilePhoto,
      };

      const user = await register(fullName, email, password, extraProfile);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userName", user.fullName || fullName);

      setRegisteredUser(user);

      sessionStorage.setItem(
        "registrationStep3",
        JSON.stringify({ faceVerified, biometricVerified, pinCreated: true })
      );

      setVerificationStep(4);
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f9fd] text-slate-900">
      {/* ================= HEADER ================= */}
      <header className="flex h-[62px] w-full items-center justify-between border-b border-[#dce6f0] bg-white px-5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="JANMITRA Logo"
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
          <ShieldCheck size={13} />
          Session Encrypted
        </div>
      </header>

      {/* ================= BODY ================= */}
      <div className="flex min-h-[calc(100vh-62px)] w-full">
        {/* ================= LEFT PANEL ================= */}
        <aside className="relative hidden w-[255px] shrink-0 overflow-hidden border-r border-[#dce6f0] bg-gradient-to-b from-[#f5faff] via-[#f1f8ff] to-[#eef8ff] lg:block">
          <div className="relative z-10 px-[32px] pt-[70px]">
            <div className="mb-4 flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#0B3B78] text-white">
              <Scale size={17} />
            </div>

            <p className="text-sm font-semibold leading-tight text-[#113d6d]">
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

          <img
            src="/sidebar-tricolor.png"
            alt=""
            className="absolute bottom-[82px] left-0 w-full object-contain"
          />

          {/* LEFT FOOTER */}
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

        {/* ================= RIGHT ================= */}
        <main className="flex min-w-0 flex-1 items-start justify-center p-4 lg:px-6 lg:py-4">
          <div className="w-full max-w-[980px] overflow-hidden rounded-[9px] border border-[#c9d5e2] bg-white shadow-sm">
            {/* ================= REGISTRATION STEPPER ================= */}
            <div className="border-b border-[#dce4ed] px-7 py-3">
              <div className="flex items-start">
                <div className="flex min-w-[105px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#1477e5] text-[14px] font-semibold text-white">
                    1
                  </div>

                  <span className="mt-1 text-[12px] font-medium text-[#176bc7]">
                    Basic Information
                  </span>
                </div>

                <div className="mt-[11px] h-px flex-1 bg-[#70aef0]" />

                <div className="flex min-w-[115px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#1477e5] text-[14px] font-semibold text-white">
                    2
                  </div>

                  <span className="mt-1 text-[12px] font-medium text-[#176bc7]">
                    Official Information
                  </span>
                </div>

                <div className="mt-[11px] h-px flex-1 bg-[#70aef0]" />

                <div className="flex min-w-[100px] flex-col items-center">
                  <div className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#1477e5] text-[14px] font-semibold text-white">
                    3
                  </div>

                  <span className="mt-1 text-[12px] font-medium text-[#176bc7]">
                    Identity Proof
                  </span>
                </div>
              </div>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <div className="grid grid-cols-1 gap-5 px-7 py-5 lg:grid-cols-[0.95fr_1.05fr]">
              {/* ================= LEFT VERIFICATION LIST ================= */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Verification Steps
                </h2>

                <p className="mt-1 text-[12px] text-slate-500">
                  Complete all steps to create your official account.
                </p>

                <div className="mt-4 space-y-2.5">
                  {/* FACIAL */}
                  <button
                    type="button"
                    onClick={() => setVerificationStep(1)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      verificationStep === 1
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-[#fafcff]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        {faceVerified ? (
                          <CheckCircle2 size={17} className="text-green-600" />
                        ) : (
                          <ScanFace size={17} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-[10px] text-white">
                            1
                          </span>

                          <p className="text-xs font-semibold text-slate-900">
                            Facial Verification
                          </p>
                        </div>

                        <p className="mt-1 text-[12px] leading-4 text-slate-500">
                          Verify your identity using real-time
                          <br />
                          facial scan.
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={15} />
                  </button>

                  {/* BIOMETRIC */}
                  <button
                    type="button"
                    onClick={() => setVerificationStep(2)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      verificationStep === 2
                        ? "border-green-400 bg-green-50"
                        : "border-slate-200 bg-[#fafcff]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        {biometricVerified ? (
                          <CheckCircle2 size={17} className="text-green-600" />
                        ) : (
                          <Fingerprint size={17} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-green-600 text-[10px] text-white">
                            2
                          </span>

                          <p className="text-xs font-semibold text-slate-900">
                            Device Biometric
                          </p>
                        </div>

                        <p className="mt-1 text-[12px] leading-4 text-slate-500">
                          Authenticate using your device
                          <br />
                          biometric security.
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={15} />
                  </button>

                  {/* PASSWORD */}
                  <button
                    type="button"
                    onClick={() => setVerificationStep(3)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      verificationStep === 3
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-[#fafcff]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                        {passwordValid && passwordsMatch ? (
                          <CheckCircle2 size={17} className="text-green-600" />
                        ) : (
                          <LockKeyhole size={17} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-orange-500 text-[10px] text-white">
                            3
                          </span>

                          <p className="text-xs font-semibold text-slate-900">
                            Secure Password
                          </p>
                        </div>

                        <p className="mt-1 text-[12px] leading-4 text-slate-500">
                          Create an 8-digit numeric password
                          <br />
                          to secure your account.
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* WHY THESE STEPS */}
                <div className="mt-4 flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2.5">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-[12px] font-semibold text-blue-700">
                      Why these steps?
                    </p>

                    <p className="mt-0.5 text-[12px] leading-4 text-slate-500">
                      These verification steps help us ensure that your account
                      is secure and protected.
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= RIGHT SCREEN 1: FACIAL ================= */}
              {verificationStep === 1 && (
                <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold">
                      Facial Verification
                    </h3>

                    <p className="mt-1 text-[12px] text-blue-600">
                      Step 1 of 3
                    </p>
                  </div>

                  <div className="relative mx-auto mt-4 flex h-[205px] max-w-[280px] items-center justify-center rounded-lg border border-slate-200 bg-[#fafcff]">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        muted
                        playsInline
                        aria-label="Live camera preview"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Captured facial verification"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <img
                        src="/face-scan.png"
                        alt="Facial verification"
                        className="h-full w-full object-contain"
                      />
                    )}

                    <div className="absolute left-5 top-5 h-7 w-7 border-l-2 border-t-2 border-blue-500" />
                    <div className="absolute right-5 top-5 h-7 w-7 border-r-2 border-t-2 border-blue-500" />
                    <div className="absolute bottom-5 left-5 h-7 w-7 border-b-2 border-l-2 border-blue-500" />
                    <div className="absolute bottom-5 right-5 h-7 w-7 border-b-2 border-r-2 border-blue-500" />
                  </div>

                  <p className="mt-2 text-center text-[12px] text-slate-600">
                    Position your face in the frame
                  </p>

                  <div className="mt-3 flex justify-center gap-4 text-[12px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Lightbulb size={10} className="text-blue-600" />
                      Good lighting
                    </span>

                    <span className="flex items-center gap-1">
                      <Eye size={10} className="text-blue-600" />
                      Look Straight
                    </span>

                    <span className="flex items-center gap-1">
                      <Glasses size={10} className="text-blue-600" />
                      No Accessories
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => router.push("/register/step2")}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleFaceScan}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <ScanFace size={13} />
                      {faceVerified
                        ? "Verified"
                        : cameraActive
                        ? "Capture Photo"
                        : "Open Camera"}
                    </button>
                  </div>
                </div>
              )}

              {/* ================= RIGHT SCREEN 2: BIOMETRIC ================= */}
              {verificationStep === 2 && (
                <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold">
                      Biometric Verification
                    </h3>

                    <p className="mt-1 text-[12px] text-blue-600">
                      Step 2 of 3
                    </p>
                  </div>

                  <div className="mx-auto mt-4 flex h-[205px] max-w-[280px] items-center justify-center rounded-lg border border-slate-200 bg-[#fafcff]">
                    <Fingerprint
                      size={115}
                      strokeWidth={1.2}
                      className="text-blue-500"
                    />
                  </div>

                  <p className="mt-2 text-center text-[12px] text-slate-600">
                    Position your finger on the machine
                  </p>

                  <div className="mt-3 flex justify-center gap-4 text-[12px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Fingerprint size={10} className="text-blue-500" />
                      Fix finger
                    </span>

                    <span className="flex items-center gap-1">
                      <ShieldCheck size={10} className="text-blue-500" />
                      Clean machine
                    </span>

                    <span className="flex items-center gap-1">
                      <Fingerprint size={10} className="text-blue-500" />
                      Finger should be healthy
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setVerificationStep(1)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleBiometricScan}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <Fingerprint size={13} />
                      {biometricVerified ? "✓ Verified" : "Start Scan"}
                    </button>
                  </div>
                </div>
              )}

              {/* ================= RIGHT SCREEN 3: PASSWORD ================= */}
              {verificationStep === 3 && (
                <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold">Secure Password</h3>

                    <p className="mt-1 text-[12px] text-blue-600">
                      Step 3 of 3
                    </p>
                  </div>

                  <p className="mt-3 text-center text-[11px] text-slate-500">
                    Create an <strong>8-digit numeric password</strong> for your
                    account.
                  </p>

                  {/* Password field */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-[12px] font-semibold text-slate-700">
                        Password
                      </label>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          maxLength={8}
                          placeholder="Enter 8-digit password"
                          className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>

                      {password && !passwordValid && (
                        <p className="mt-1 text-[11px] text-red-500">
                          Must be exactly 8 digits (0–9 only).
                        </p>
                      )}

                      {passwordValid && (
                        <p className="mt-1 text-[11px] text-green-600">
                          ✓ Valid password
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[12px] font-semibold text-slate-700">
                        Confirm Password
                      </label>

                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          maxLength={8}
                          placeholder="Re-enter password"
                          className="h-[36px] w-full rounded-[5px] border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showConfirm ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>

                      {confirmPassword && !passwordsMatch && (
                        <p className="mt-1 text-[11px] text-red-500">
                          Passwords do not match.
                        </p>
                      )}

                      {passwordsMatch && (
                        <p className="mt-1 text-[11px] text-green-600">
                          ✓ Passwords match
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    <strong>Note:</strong> Your password must be exactly 8
                    numeric digits (e.g. 12345678). Keep it confidential.
                  </div>

                  <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-blue-700" />
                          <p className="text-[12px] font-semibold text-blue-700">Email OTP Verification (Resend)</p>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {emailOtpVerified
                            ? "✓ Email verified successfully via Resend."
                            : officialEmailDisplay
                            ? `Send OTP to ${officialEmailDisplay}`
                            : "Send OTP to your registered email address."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendEmailOTP}
                        disabled={otpLoading || emailOtpVerified}
                        className="rounded-md bg-blue-600 px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {otpLoading ? "Sending..." : emailOtpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                    </div>

                    {emailOtpSent && !emailOtpVerified && (
                      <div className="mt-3">
                        <label className="mb-1 block text-[12px] font-semibold text-slate-700">Enter 6-digit Email OTP</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                            placeholder="123456"
                            className="h-[36px] flex-1 rounded-[5px] border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />

                          <button
                            type="button"
                            onClick={handleVerifyEmailOTP}
                            disabled={otpLoading}
                            className="rounded-md bg-green-600 px-3 py-2 text-[11px] font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {verificationStep === 4 && (
                <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle2 size={28} />
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      Registration Successful!
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                      Your account has been created and is ready to use.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Full Name
                      </span>

                      <span className="text-[11px] text-slate-800">
                        {registeredUser?.fullName || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Email
                      </span>

                      <span className="text-[11px] text-slate-800">
                        {registeredUser?.email || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Role
                      </span>

                      <span className="text-[11px] text-slate-800">
                        {registeredUser?.role || "Viewer"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Status
                      </span>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-[9px] font-semibold text-green-700">
                        {emailOtpVerified ? "✓ EMAIL VERIFIED (RESEND)" : "✓ APPROVED"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 w-full rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    GO TO DASHBOARD →
                  </button>
                </div>
              )}
            </div>

            {/* ================= PAGE FOOTER ================= */}
            <div className="flex flex-col items-end gap-2 border-t border-slate-200 px-7 py-3">
              {/* Error banner (shown above the action buttons) */}
              {error && (
                <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2">
                {verificationStep === 4 ? (
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="flex h-[34px] items-center gap-1.5 rounded-md border border-slate-400 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft size={13} />
                    Go to Login
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        verificationStep === 1
                          ? router.push("/register/step2")
                          : setVerificationStep(
                              (verificationStep - 1) as VerificationStep
                            )
                      }
                      className="flex h-[34px] items-center gap-1.5 rounded-md border border-slate-400 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft size={13} />
                      Back
                    </button>

                    {verificationStep < 3 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setVerificationStep(
                            (verificationStep + 1) as VerificationStep
                          )
                        }
                        className="flex h-[34px] items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Continue
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      /* Step 3 → Submit Registration button */
                      <button
                        type="button"
                        onClick={handleSubmitRegistration}
                        disabled={
                          !faceVerified ||
                          !biometricVerified ||
                          !passwordValid ||
                          !passwordsMatch ||
                          loading
                        }
                        className="flex h-[34px] items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loading ? (
                          "Submitting…"
                        ) : (
                          <>
                            Submit Registration
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
