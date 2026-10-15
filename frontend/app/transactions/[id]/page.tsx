"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const transactionData: Record<
  string,
  {
    name: string;
    amount: string;
    type: string;
    status: string;
    mode: string;
    date: string;
    time: string;
    transactionId: string;
    upiId: string;
    note: string;
  }
> = {
  "1": {
    name: "Amit Kumar",
    amount: "₹500",
    type: "Money Sent",
    status: "Success",
    mode: "Online",
    date: "18 September 2026",
    time: "10:24 AM",
    transactionId: "TXN8293748291",
    upiId: "amit@upi",
    note: "Lunch",
  },

  "2": {
    name: "Priya Sharma",
    amount: "₹1,000",
    type: "Money Received",
    status: "Success",
    mode: "Online",
    date: "18 September 2026",
    time: "09:10 AM",
    transactionId: "TXN8293748292",
    upiId: "priya@upi",
    note: "Payment received",
  },

  "3": {
    name: "Rohan",
    amount: "₹200",
    type: "Money Sent",
    status: "Pending",
    mode: "Offline",
    date: "17 September 2026",
    time: "06:45 PM",
    transactionId: "OFF8293748293",
    upiId: "rohan@upi",
    note: "Offline payment",
  },

  "4": {
    name: "Swiggy",
    amount: "₹199",
    type: "Money Sent",
    status: "Success",
    mode: "Online",
    date: "17 September 2026",
    time: "01:12 PM",
    transactionId: "TXN8293748294",
    upiId: "swiggy@upi",
    note: "Food",
  },
};

export default function TransactionDetailsPage() {
  const params = useParams();

  const id = String(params.id);

  const transaction = transactionData[id] ?? transactionData["1"];

  const isReceived = transaction.type === "Money Received";
  const isPending = transaction.status === "Pending";

  return (
    <main className="min-h-screen bg-[#f5f7f6] flex justify-center">

      <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex flex-col">

        {/* ================= HEADER ================= */}

        <header className="px-6 pt-6 pb-4">

          <div className="flex items-center gap-4">

            <Link
              href="/transactions"
              className="text-2xl text-[#071b35]"
            >
              ←
            </Link>

            <h1 className="text-xl font-bold text-[#071b35]">
              Transaction Details
            </h1>

          </div>

        </header>


        {/* ================= STATUS ================= */}

        <section className="px-6 pt-6">

          <div className="flex flex-col items-center">

            {/* Status Icon */}

            <div
              className={`
                w-20
                h-20
                rounded-full
                flex
                items-center
                justify-center
                ${
                  isPending
                    ? "bg-orange-100"
                    : isReceived
                    ? "bg-green-100"
                    : "bg-blue-100"
                }
              `}
            >

              <span
                className={`
                  text-3xl
                  ${
                    isPending
                      ? "text-orange-500"
                      : isReceived
                      ? "text-green-600"
                      : "text-blue-600"
                  }
                `}
              >
                {isPending ? "⌛" : isReceived ? "↓" : "✓"}
              </span>

            </div>


            {/* Status */}

            <h2 className="mt-4 text-xl font-bold text-[#071b35]">
              {isPending
                ? "Payment Pending"
                : isReceived
                ? "Money Received"
                : "Payment Successful"}
            </h2>


            {/* Amount */}

            <p
              className={`
                mt-2
                text-4xl
                font-extrabold
                ${
                  isReceived
                    ? "text-green-600"
                    : "text-[#071b35]"
                }
              `}
            >
              {isReceived ? "+" : "-"}
              {transaction.amount}
            </p>


            {/* Mode */}

            <div
              className={`
                mt-3
                px-3
                py-1
                rounded-full
                text-xs
                font-semibold
                ${
                  transaction.mode === "Offline"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-green-50 text-green-600"
                }
              `}
            >
              {transaction.mode} Payment
            </div>

          </div>

        </section>


        {/* ================= RECEIVER ================= */}

        <section className="px-6 mt-8">

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">

            <p className="text-xs text-slate-500">
              {isReceived ? "Received From" : "Paid To"}
            </p>

            <div className="flex items-center gap-3 mt-3">

              <div className="w-12 h-12 rounded-full bg-[#eef5ff] flex items-center justify-center text-[#071b35] font-bold">
                {transaction.name.charAt(0)}
              </div>

              <div>

                <p className="text-base font-bold text-[#071b35]">
                  {transaction.name}
                </p>

                <p className="text-sm text-slate-500 mt-0.5">
                  {transaction.upiId}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ================= DETAILS ================= */}

        <section className="px-6 mt-5">

          <div className="rounded-2xl bg-slate-50 p-5">

            <h3 className="text-sm font-bold text-[#071b35]">
              Payment Details
            </h3>


            <DetailRow
              label="Date"
              value={transaction.date}
            />

            <DetailRow
              label="Time"
              value={transaction.time}
            />

            <DetailRow
              label="Transaction ID"
              value={transaction.transactionId}
            />

            <DetailRow
              label="Payment Mode"
              value={transaction.mode}
            />

            <DetailRow
              label="Note"
              value={transaction.note}
              last
            />

          </div>

        </section>


        {/* ================= OFFLINE NOTICE ================= */}

        {isPending && (

          <section className="px-6 mt-5">

            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">

              <div className="flex gap-3">

                <div className="w-10 h-10 shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-500">
                    ⌛
                  </span>
                </div>

                <div>

                  <p className="text-sm font-semibold text-[#071b35]">
                    Offline payment queued
                  </p>

                  <p className="text-xs text-slate-500 mt-1 leading-4">
                    This payment was created while you were
                    offline. It will be synchronized when a
                    connection is available.
                  </p>

                </div>

              </div>

            </div>

          </section>

        )}


        {/* ================= ACTIONS ================= */}

        <section className="px-6 mt-auto pt-8 pb-8">

          {isPending ? (

            <button
              className="
                w-full
                h-14
                rounded-xl
                bg-[#071b35]
                text-white
                font-semibold
              "
            >
              Check Sync Status
            </button>

          ) : (

            <div className="grid grid-cols-2 gap-3">

              <button
                className="
                  h-14
                  rounded-xl
                  border
                  border-[#071b35]
                  text-[#071b35]
                  font-semibold
                "
              >
                Download Receipt
              </button>

              <button
                className="
                  h-14
                  rounded-xl
                  bg-[#071b35]
                  text-white
                  font-semibold
                "
              >
                Share
              </button>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}


/* ================================================= */
/* DETAIL ROW                                       */
/* ================================================= */

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`
        flex
        items-start
        justify-between
        gap-4
        py-3
        ${
          !last
            ? "border-b border-slate-200"
            : ""
        }
      `}
    >

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-xs font-semibold text-[#071b35] text-right break-all">
        {value}
      </span>

    </div>
  );
}