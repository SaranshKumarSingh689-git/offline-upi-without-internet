"use client";

import Link from "next/link";
import { useState } from "react";

type Filter = "all" | "sent" | "received" | "pending";

type Transaction = {
  id: number;
  name: string;
  subtitle: string;
  amount: string;
  type: "sent" | "received";
  status: "Success" | "Pending";
  mode: "Online" | "Offline";
  time: string;
  icon: string;
  avatar: string;
};

const transactions: Transaction[] = [
  {
    id: 1,
    name: "Amit Kumar",
    subtitle: "Paid · 10:24 AM",
    amount: "-₹500",
    type: "sent",
    status: "Success",
    mode: "Online",
    time: "Today",
    icon: "A",
    avatar: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    name: "Priya Sharma",
    subtitle: "Received · 09:10 AM",
    amount: "+₹1,000",
    type: "received",
    status: "Success",
    mode: "Online",
    time: "Today",
    icon: "P",
    avatar: "bg-green-100 text-green-600",
  },
  {
    id: 3,
    name: "Offline Payment",
    subtitle: "To: Rohan · 06:45 PM",
    amount: "-₹200",
    type: "sent",
    status: "Pending",
    mode: "Offline",
    time: "Yesterday",
    icon: "⌁",
    avatar: "bg-orange-100 text-orange-600",
  },
  {
    id: 4,
    name: "Swiggy",
    subtitle: "Paid · 01:12 PM",
    amount: "-₹199",
    type: "sent",
    status: "Success",
    mode: "Online",
    time: "Yesterday",
    icon: "S",
    avatar: "bg-red-100 text-red-600",
  },
  {
    id: 5,
    name: "Salary",
    subtitle: "Received · 09:00 AM",
    amount: "+₹25,000",
    type: "received",
    status: "Success",
    mode: "Online",
    time: "Yesterday",
    icon: "₹",
    avatar: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 6,
    name: "Rahul Verma",
    subtitle: "Paid · 08:30 PM",
    amount: "-₹750",
    type: "sent",
    status: "Success",
    mode: "Online",
    time: "12 Sep",
    icon: "R",
    avatar: "bg-purple-100 text-purple-600",
  },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true;

    if (filter === "sent") {
      return transaction.type === "sent";
    }

    if (filter === "received") {
      return transaction.type === "received";
    }

    if (filter === "pending") {
      return transaction.status === "Pending";
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-[#f5f7f6] flex justify-center">

      <div className="w-full max-w-130 min-h-screen bg-white shadow-xl flex flex-col">

        {/* ================= HEADER ================= */}

        <header className="px-6 pt-6 pb-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">

              <Link
                href="/home"
                className="text-2xl text-[#071b35] hover:opacity-70"
              >
                ←
              </Link>

              <h1 className="text-xl font-bold text-[#071b35]">
                Transactions
              </h1>

            </div>

            <button
              className="
                w-10 h-10
                rounded-full
                bg-slate-50
                flex items-center justify-center
                text-lg
              "
            >
              ☷
            </button>

          </div>

        </header>


        {/* ================= FILTERS ================= */}

        <section className="px-6">

          <div className="p-1 bg-slate-100 rounded-xl flex">

            {[
              { key: "all", label: "All" },
              { key: "sent", label: "Sent" },
              { key: "received", label: "Received" },
              { key: "pending", label: "Pending" },
            ].map((item) => (

              <button
                key={item.key}
                onClick={() => setFilter(item.key as Filter)}
                className={`
                  flex-1
                  h-10
                  rounded-lg
                  text-xs
                  font-semibold
                  transition
                  ${
                    filter === item.key
                      ? "bg-[#071b35] text-white shadow-sm"
                      : "text-[#071b35]"
                  }
                `}
              >
                {item.label}
              </button>

            ))}

          </div>

        </section>


        {/* ================= TRANSACTION LIST ================= */}

        <section className="flex-1 px-6 pb-8">

          {/* Today */}

          {filteredTransactions.some(
            (transaction) => transaction.time === "Today"
          ) && (

            <div className="mt-6">

              <h2 className="text-sm font-bold text-[#071b35]">
                Today
              </h2>

              <div className="mt-2">

                {filteredTransactions
                  .filter(
                    (transaction) => transaction.time === "Today"
                  )
                  .map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}

              </div>

            </div>

          )}


          {/* Yesterday */}

          {filteredTransactions.some(
            (transaction) => transaction.time === "Yesterday"
          ) && (

            <div className="mt-6">

              <h2 className="text-sm font-bold text-[#071b35]">
                Yesterday
              </h2>

              <div className="mt-2">

                {filteredTransactions
                  .filter(
                    (transaction) =>
                      transaction.time === "Yesterday"
                  )
                  .map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}

              </div>

            </div>

          )}


          {/* Older */}

          {filteredTransactions.some(
            (transaction) => transaction.time === "12 Sep"
          ) && (

            <div className="mt-6">

              <h2 className="text-sm font-bold text-[#071b35]">
                12 Sep
              </h2>

              <div className="mt-2">

                {filteredTransactions
                  .filter(
                    (transaction) =>
                      transaction.time === "12 Sep"
                  )
                  .map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}

              </div>

            </div>

          )}


          {/* Empty State */}

          {filteredTransactions.length === 0 && (

            <div className="flex flex-col items-center justify-center py-20">

              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                ₹
              </div>

              <h2 className="mt-4 text-base font-bold text-[#071b35]">
                No transactions
              </h2>

              <p className="mt-1 text-sm text-slate-500 text-center">
                There are no transactions in this category.
              </p>

            </div>

          )}

        </section>


        {/* ================= BOTTOM NAV ================= */}

        <nav className="w-full bg-white border-t border-slate-200 px-6 py-3 shrink-0">

          <div className="flex items-center justify-between">

            <NavItem
              href="/home"
              icon="⌂"
              label="Home"
              active={false}
            />

            <NavItem
              href="/transactions"
              icon="≡"
              label="Transactions"
              active={true}
            />

            <NavItem
              href="/scan"
              icon="▦"
              label="Scan"
              active={false}
            />

            <NavItem
              href="/profile"
              icon="○"
              label="Profile"
              active={false}
            />

          </div>

        </nav>

      </div>

    </main>
  );
}


/* ================================================= */
/* TRANSACTION ROW                                  */
/* ================================================= */

function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <Link
      href={`/transactions/${transaction.id}`}
      className="
        flex
        items-center
        gap-3
        py-4
        border-b
        border-slate-100
        hover:bg-slate-50
        transition
      "
    >

      {/* Avatar */}

      <div
        className={`
          w-11 h-11
          shrink-0
          rounded-full
          flex
          items-center
          justify-center
          font-semibold
          ${transaction.avatar}
        `}
      >
        {transaction.icon}
      </div>


      {/* Details */}

      <div className="flex-1 min-w-0">

        <p className="text-sm font-semibold text-[#071b35]">
          {transaction.name}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          {transaction.subtitle}
        </p>

        <div className="flex items-center gap-2 mt-1">

          <span
            className={`
              text-[10px]
              px-2
              py-0.5
              rounded-full
              ${
                transaction.mode === "Offline"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-green-50 text-green-600"
              }
            `}
          >
            {transaction.mode}
          </span>

        </div>

      </div>


      {/* Amount */}

      <div className="text-right">

        <p className="text-sm font-bold text-[#071b35]">
          {transaction.amount}
        </p>

        <p
          className={`
            text-xs
            font-medium
            mt-1
            ${
              transaction.status === "Success"
                ? "text-green-600"
                : "text-orange-500"
            }
          `}
        >
          {transaction.status}
        </p>

      </div>

    </Link>
  );
}


/* ================================================= */
/* BOTTOM NAV ITEM                                  */
/* ================================================= */

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex
        flex-col
        items-center
        gap-1
        ${
          active
            ? "text-[#071b35]"
            : "text-slate-400"
        }
      `}
    >

      <span className="text-xl">
        {icon}
      </span>

      <span
        className={`
          text-[10px]
          ${active ? "font-semibold" : ""}
        `}
      >
        {label}
      </span>

    </Link>
  );
}