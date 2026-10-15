"use client";

import Link from "next/link";
import { useState } from "react";

type ScanMode = "scan" | "myqr";

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>("scan");
  const [flashOn, setFlashOn] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f7f6] flex justify-center">

      <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex flex-col">

        {/* ================= HEADER ================= */}

        <header className="px-6 pt-6 pb-4">

          <div className="flex items-center gap-4">

            <Link
              href="/home"
              className="text-2xl text-[#071b35] hover:opacity-70"
            >
              ←
            </Link>

            <h1 className="text-xl font-bold text-[#071b35]">
              Scan & Pay
            </h1>

          </div>

        </header>


        {/* ================= CONTENT ================= */}

        <section className="flex-1 px-6 pb-8">

          {/* Scan / My QR */}

          <div className="p-1 bg-slate-100 rounded-xl flex">

            <button
              onClick={() => setMode("scan")}
              className={`flex-1 h-11 rounded-lg text-sm font-semibold transition ${
                mode === "scan"
                  ? "bg-[#071b35] text-white shadow-sm"
                  : "text-[#071b35]"
              }`}
            >
              Scan QR
            </button>

            <button
              onClick={() => setMode("myqr")}
              className={`flex-1 h-11 rounded-lg text-sm font-semibold transition ${
                mode === "myqr"
                  ? "bg-[#071b35] text-white shadow-sm"
                  : "text-[#071b35]"
              }`}
            >
              My QR
            </button>

          </div>


          {/* ================= SCANNER ================= */}

          {mode === "scan" ? (

            <>

              <div
                className="
                  mt-5
                  relative
                  w-full
                  aspect-square
                  max-h-97.5
                  rounded-2xl
                  overflow-hidden
                  bg-[#101010]
                  shadow-lg
                "
              >

                {/* Camera background */}

                <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-black to-slate-900" />

                {/* Simulated camera glow */}

                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,#ffffff_0%,transparent_35%)]" />


                {/* Scanner frame */}

                <div className="absolute inset-10">

                  {/* Top Left */}

                  <div className="absolute left-0 top-0 w-12 h-12 border-l-4 border-t-4 border-white rounded-tl-xl" />

                  {/* Top Right */}

                  <div className="absolute right-0 top-0 w-12 h-12 border-r-4 border-t-4 border-white rounded-tr-xl" />

                  {/* Bottom Left */}

                  <div className="absolute left-0 bottom-0 w-12 h-12 border-l-4 border-b-4 border-white rounded-bl-xl" />

                  {/* Bottom Right */}

                  <div className="absolute right-0 bottom-0 w-12 h-12 border-r-4 border-b-4 border-white rounded-br-xl" />


                  {/* Scanning Line */}

                  <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-green-400 shadow-[0_0_12px_#4ade80]" />

                </div>


                {/* Center QR placeholder */}

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

                  <div className="w-28 h-28 grid grid-cols-7 gap-1 p-2 opacity-80">

                    {Array.from({ length: 49 }).map((_, index) => {

                      const filled =
                        index % 3 === 0 ||
                        index % 5 === 0 ||
                        index === 8 ||
                        index === 9 ||
                        index === 15 ||
                        index === 40;

                      return (
                        <span
                          key={index}
                          className={filled ? "bg-white" : "bg-transparent"}
                        />
                      );

                    })}

                  </div>

                </div>


                {/* Camera status */}

                <div className="absolute top-5 left-0 right-0 text-center">

                  <span className="text-xs text-white/80 bg-black/40 px-3 py-1.5 rounded-full">
                    Camera ready
                  </span>

                </div>


                {/* Instruction */}

                <div className="absolute bottom-5 left-0 right-0 text-center">

                  <p className="text-xs text-white">
                    Align the QR code within the frame
                  </p>

                </div>

              </div>


              {/* Scanner controls */}

              <div className="flex justify-center gap-8 mt-5">

                <button
                  onClick={() => setFlashOn(!flashOn)}
                  className={`
                    w-14 h-14
                    rounded-full
                    flex items-center justify-center
                    transition
                    ${
                      flashOn
                        ? "bg-yellow-400 text-[#071b35]"
                        : "bg-[#071b35] text-white"
                    }
                  `}
                >
                  🔦
                </button>

                <button
                  className="
                    w-14 h-14
                    rounded-full
                    bg-[#071b35]
                    text-white
                    flex items-center
                    justify-center
                  "
                >
                  🖼️
                </button>

              </div>


              {/* Offline information */}

              <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">

                <div className="flex gap-3">

                  <div className="w-10 h-10 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600">
                      📶
                    </span>
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-[#071b35]">
                      Offline payments supported
                    </p>

                    <p className="text-xs text-slate-500 mt-1 leading-4">
                      You can scan and create a secure payment even
                      without an internet connection.
                    </p>

                  </div>

                </div>

              </div>

            </>

          ) : (

            /* ================= MY QR ================= */

            <div className="mt-6 flex flex-col items-center">

              <p className="text-sm text-slate-500">
                Let someone scan your QR to pay you
              </p>


              {/* QR Card */}

              <div className="mt-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">

                <div className="w-52 h-52 bg-white grid grid-cols-11 gap-1 p-2 border border-slate-100">

                  {Array.from({ length: 121 }).map((_, index) => {

                    const filled =
                      index % 2 === 0 ||
                      index % 7 === 0 ||
                      index === 12 ||
                      index === 13 ||
                      index === 14 ||
                      index === 108 ||
                      index === 109;

                    return (
                      <span
                        key={index}
                        className={filled ? "bg-[#071b35]" : "bg-white"}
                      />
                    );

                  })}

                </div>

              </div>


              <h2 className="mt-5 text-lg font-bold text-[#071b35]">
                saransh@upi
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Saransh Kumar Singh
              </p>


              <button
                className="
                  mt-6
                  w-full
                  h-14
                  rounded-xl
                  border
                  border-[#071b35]
                  text-[#071b35]
                  font-semibold
                  hover:bg-slate-50
                "
              >
                Share My QR
              </button>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}