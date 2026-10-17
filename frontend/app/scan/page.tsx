"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import { apiRequest } from "@/lib/api";

type ScanMode = "scan" | "myqr";

type UserProfile = {
  _id?: string;
  fullName?: string;
  upiId?: string;
};

function extractUpiId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  // UPI payment URI, for example: upi://pay?pa=name@bank&pn=Name
  if (/^upi:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const upiId = url.searchParams.get("pa") || url.searchParams.get("upiId");
      return upiId && /^[\w.-]+@[\w.-]+$/.test(upiId.trim())
        ? upiId.trim()
        : null;
    } catch {
      return null;
    }
  }

  // QR code containing only a UPI ID.
  if (/^[\w.-]+@[\w.-]+$/.test(input)) return input;

  // URL-style QR code containing a pa or upiId query parameter.
  try {
    const url = new URL(input);
    const upiId = url.searchParams.get("pa") || url.searchParams.get("upiId");
    if (upiId && /^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
      return upiId.trim();
    }
  } catch {
    // This value was not a valid URL or supported UPI URI.
  }

  return null;
}

export default function ScanPage() {
  const router = useRouter();

  const [mode, setMode] = useState<ScanMode>("scan");
  const [flashOn, setFlashOn] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("Starting camera...");
  const [cameraError, setCameraError] = useState("");
  const [scanError, setScanError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [sharing, setSharing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanHandledRef = useRef(false);

  // Load the logged-in user's profile for the My QR screen.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await apiRequest("/api/users/profile");
        const user = data?.user ?? data;

        if (!user?.upiId) {
          throw new Error("Your account does not have a UPI ID configured.");
        }

        if (active) {
          setProfile({
            _id: user._id,
            fullName: user.fullName,
            upiId: user.upiId,
          });
          setProfileError("");
        }
      } catch (error) {
        if (active) {
          setProfileError(
            error instanceof Error ? error.message : "Unable to load your profile."
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Validate a decoded QR value and open Send Money with the recipient prefilled.
  const handleDecodedValue = useCallback(
    (decodedText: string) => {
      if (scanHandledRef.current) return;

      const upiId = extractUpiId(decodedText);
      if (!upiId) {
        setScanError(
          "This QR code does not contain a supported UPI ID. Try another QR code."
        );
        return;
      }

      scanHandledRef.current = true;
      setScanError("");
      setCameraStatus("QR code detected!");
      router.push(`/send?upiId=${encodeURIComponent(upiId)}`);
    },
    [router]
  );

  // Start and stop the camera when the Scan QR tab is active.
  useEffect(() => {
    if (mode !== "scan") return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    scanHandledRef.current = false;
    setCameraError("");
    setScanError("");
    setFlashOn(false);
    setCameraStatus("Starting camera...");

    async function startScanner() {
      try {
        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => handleDecodedValue(decodedText),
          () => {
            // Ignore individual video frames where no QR code is detected.
          }
        );

        if (cancelled) {
          // The component may have changed tabs while camera startup was pending.
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch {
            // The camera may already have stopped.
          }
          try {
            scanner.clear();
          } catch {
            // The scanner DOM may already have been cleared.
          }
          return;
        }

        setCameraStatus("Camera ready");
      } catch (error) {
        if (!cancelled) {
          setCameraStatus("Camera unavailable");
          setCameraError(
            error instanceof Error
              ? error.message
              : "Could not access the camera. Check your browser permissions."
          );
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      const currentScanner = scanner;

      if (currentScanner) {
        if (currentScanner.isScanning) {
          // stop() returns a Promise, so catch/finally can be used here.
          void currentScanner
            .stop()
            .catch(() => undefined)
            .finally(() => {
              // clear() returns void; do not chain .catch() to it.
              try {
                currentScanner.clear();
              } catch {
                // It may already be cleared.
              }
            });
        } else {
          try {
            currentScanner.clear();
          } catch {
            // It may already be cleared.
          }
        }
      }

      if (scannerRef.current === currentScanner) {
        scannerRef.current = null;
      }
    };
  }, [mode, handleDecodedValue]);

  // Attempt to toggle the camera torch on supported devices.
  async function toggleFlash() {
    const scanner = scannerRef.current;

    if (!scanner?.isScanning) {
      setCameraError("Start the camera before using the flashlight.");
      return;
    }

    const nextValue = !flashOn;

    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: nextValue } as MediaTrackConstraintSet],
      });
      setFlashOn(nextValue);
      setCameraError("");
    } catch {
      setCameraError(
        "Flashlight control is not supported by this camera or browser."
      );
    }
  }

  // Scan a QR code from an image selected by the user.
  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // Allow the same file to be selected again later.
    input.value = "";
    if (!file) return;

    setScanError("");
    setCameraError("");

    const imageScanner = new Html5Qrcode("qr-file-reader");

    try {
      const decodedText = await imageScanner.scanFile(file, true);
      handleDecodedValue(decodedText);
    } catch {
      setScanError(
        "No readable QR code was found in that image. Try a clearer image."
      );
    } finally {
      // clear() returns void; call it directly and catch synchronous errors.
      try {
        imageScanner.clear();
      } catch {
        // The temporary scanner may already have been cleared.
      }
    }
  }

  // Standard UPI payment URI used to generate this user's QR code.
  const paymentUri = profile?.upiId
    ? `upi://pay?pa=${encodeURIComponent(profile.upiId)}&pn=${encodeURIComponent(
        profile.fullName || "UPI User"
      )}`
    : "";

  async function shareMyQr() {
    if (!profile?.upiId || !paymentUri) return;

    const shareText = `Pay ${profile.fullName || "me"} using my UPI ID: ${profile.upiId}\n${paymentUri}`;

    try {
      setSharing(true);

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: "My UPI QR",
          text: shareText,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        window.alert("Your UPI payment details have been copied.");
      } else {
        throw new Error("Sharing and clipboard access are unavailable in this browser.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setProfileError(error.message || "Unable to share your UPI details.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f5f7f6]">
      <div className="flex min-h-screen w-full max-w-130 flex-col bg-white shadow-xl">
        <header className="px-6 pb-4 pt-6">
          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className="text-2xl text-[#071b35] hover:opacity-70"
              aria-label="Back to home"
            >
              ←
            </Link>
            <h1 className="text-xl font-bold text-[#071b35]">Scan &amp; Pay</h1>
          </div>
        </header>

        <section className="flex-1 px-6 pb-8">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("scan")}
              className={`h-11 flex-1 rounded-lg text-sm font-semibold transition ${
                mode === "scan"
                  ? "bg-[#071b35] text-white shadow-sm"
                  : "text-[#071b35]"
              }`}
            >
              Scan QR
            </button>
            <button
              type="button"
              onClick={() => setMode("myqr")}
              className={`h-11 flex-1 rounded-lg text-sm font-semibold transition ${
                mode === "myqr"
                  ? "bg-[#071b35] text-white shadow-sm"
                  : "text-[#071b35]"
              }`}
            >
              My QR
            </button>
          </div>

          {mode === "scan" ? (
            <>
              <div className="relative mt-5 aspect-square max-h-97.5 w-full overflow-hidden rounded-2xl bg-[#101010] shadow-lg">
                <div
                  id="qr-reader"
                  className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&_img]:hidden"
                />

                {/* Scanner frame overlay */}
                <div className="pointer-events-none absolute inset-10">
                  <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-xl border-l-4 border-t-4 border-white" />
                  <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-xl border-r-4 border-t-4 border-white" />
                  <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-xl border-b-4 border-l-4 border-white" />
                  <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-xl border-b-4 border-r-4 border-white" />
                </div>

                <div className="pointer-events-none absolute left-0 right-0 top-5 text-center">
                  <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                    {cameraStatus}
                  </span>
                </div>
              </div>

              {/* Hidden element used by html5-qrcode for image scanning. */}
              <div
                id="qr-file-reader"
                className="fixed left-[-10000px] top-0 h-75 w-75"
                aria-hidden="true"
              />

              <div className="mt-5 flex justify-center gap-8">
                <button
                  type="button"
                  onClick={toggleFlash}
                  aria-label="Toggle flashlight"
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                    flashOn
                      ? "bg-yellow-400 text-[#071b35]"
                      : "bg-[#071b35] text-white"
                  }`}
                >
                  🔦
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Scan QR from an image"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#071b35] text-white"
                >
                  🖼️
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {cameraError && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {cameraError}
                  <p className="mt-1 text-xs">
                    Camera access generally requires localhost or HTTPS. You can
                    also try uploading a QR image.
                  </p>
                </div>
              )}

              {scanError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {scanError}
                </div>
              )}

              <p className="mt-4 text-center text-xs text-slate-500">
                Align a UPI QR code within the frame, or choose an image
                containing a QR code.
              </p>

              <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <span className="text-green-600">📶</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#071b35]">
                      Offline payments supported
                    </p>
                    <p className="mt-1 text-xs leading-4 text-slate-500">
                      QR scanning identifies a recipient. Completing an offline
                      payment still depends on your app&apos;s offline packet and
                      synchronization logic.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-center text-sm text-slate-500">
                Let someone scan your QR to pay you
              </p>

              {profileLoading ? (
                <div className="mt-8 text-sm text-slate-500">
                  Loading your profile...
                </div>
              ) : profileError ? (
                <div className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {profileError}
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 block font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              ) : profile?.upiId ? (
                <>
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex h-52 w-52 items-center justify-center">
                      <QRCodeSVG
                        value={paymentUri}
                        size={208}
                        level="H"
                        includeMargin
                        title={`UPI payment QR for ${profile.upiId}`}
                      />
                    </div>
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-[#071b35]">
                    {profile.upiId}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {profile.fullName || "UPI User"}
                  </p>

                  <button
                    type="button"
                    onClick={shareMyQr}
                    disabled={sharing}
                    className="mt-6 h-14 w-full rounded-xl border border-[#071b35] font-semibold text-[#071b35] hover:bg-slate-50 disabled:opacity-50"
                  >
                    {sharing ? "Sharing..." : "Share My QR"}
                  </button>
                </>
              ) : (
                <div className="mt-6 text-sm text-slate-500">
                  No UPI ID is configured for this account.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
