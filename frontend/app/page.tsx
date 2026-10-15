import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md min-h-[calc(100vh-48px)] bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">A</span>
            </div>

            <span className="text-xl font-bold text-[#071b35]">
              Offline UPI
            </span>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold text-[#071b35]">
              Pay Anytime
            </p>
            <p className="text-[9px] text-slate-500">
              Even Without Internet
            </p>
          </div>
        </header>

        {/* Main Content */}
        <section className="flex-1 flex flex-col items-center px-6 pt-12">
          
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-[38px] leading-[1.05] font-extrabold tracking-tight text-[#071b35]">
              Payments
            </h1>

            <h2 className="text-[38px] leading-[1.05] font-extrabold tracking-tight text-green-600">
              Without Limits
            </h2>

            <p className="mt-5 text-sm font-medium leading-5 text-slate-600 max-w-70 mx-auto">
              Send and receive money, online or offline.
              <br />
              Fast. Secure. Always with you.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative mt-10 w-65 h-67.5">
            
            {/* Green background blobs */}
            <div className="absolute inset-x-5 top-8 bottom-4 rounded-[45%] bg-green-100 rotate-[-8deg]" />
            
            <div className="absolute left-3 bottom-12 w-28 h-20 bg-green-200 rounded-full rotate-25" />
            
            <div className="absolute right-0 top-12 w-24 h-16 bg-green-100 rounded-full rotate-[-25deg]" />

            {/* Phone */}
            <div className="absolute left-1/2 top-8 -translate-x-1/2 w-29.5 h-52.5 bg-[#071b35] rounded-[25px] rotate-[-8deg] shadow-xl p-1.75">
              <div className="w-full h-full bg-white rounded-[19px] overflow-hidden relative">
                
                {/* Phone notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-[#071b35] rounded-full" />

                {/* QR */}
                <div className="absolute top-16.25 left-1/2 -translate-x-1/2 w-15.5 h-15.5 border-4 border-[#071b35] rounded-lg grid grid-cols-4 gap-0.75 p-2">
                  <span className="bg-[#071b35] rounded-sm" />
                  <span />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span />
                  <span />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span className="bg-[#071b35] rounded-sm" />
                  <span />
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>

            {/* Lightning card */}
            <div className="absolute right-7 top-26.25 w-17.5 h-17.5 bg-white rounded-2xl shadow-lg rotate-[8deg] flex items-center justify-center">
              <span className="text-4xl text-[#071b35]">⚡</span>
            </div>

            {/* Small decorative dots */}
            <div className="absolute left-4 top-24 w-2 h-2 rounded-full bg-green-500" />
            <div className="absolute right-3 top-7 w-2 h-2 rounded-full bg-green-500" />
            <div className="absolute left-12 bottom-8 w-2 h-2 rounded-full bg-green-500" />
          </div>

          {/* Carousel dots */}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 rounded-full bg-[#071b35]" />
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span className="w-3 h-3 rounded-full bg-slate-300" />
          </div>
        </section>

        {/* Buttons */}
        <div className="px-6 pb-7 space-y-3">
          <Link
            href="/login"
            className="w-full h-14 rounded-xl bg-[#071b35] text-white flex items-center justify-center gap-3 font-semibold text-base hover:bg-[#0d294d] transition"
          >
            Get Started
            <span className="text-xl">→</span>
          </Link>

          <Link
            href="/login"
            className="w-full h-14 rounded-xl border-2 border-[#071b35] text-[#071b35] flex items-center justify-center font-semibold text-sm hover:bg-slate-50 transition"
          >
            I already have an account
          </Link>

          <p className="text-center text-[11px] text-slate-500 pt-1">
            Made for a more connected India 🇮🇳
          </p>
        </div>
      </div>
    </main>
  );
}