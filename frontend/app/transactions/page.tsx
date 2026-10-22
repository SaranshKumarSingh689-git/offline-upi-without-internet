"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Filter = "all" | "sent" | "received" | "pending";

type TransactionStatus = "Success" | "Pending" | "Failed" | "Other";

interface UserInfo {
  _id?: string;
  id?: string;
  fullName?: string;
  upiId?: string;
}

interface ApiTransaction {
  _id: string;
  txnId?: string;
  transactionId?: string;

  sender: UserInfo | string;
  receiver: UserInfo | string;

  amount: number | string;
  status: string;

  offline?: boolean;
  mode?: string;

  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

interface Transaction {
  id: string;
  name: string;
  subtitle: string;
  amount: string;
  type: "sent" | "received";
  status: TransactionStatus;
  mode: "Online" | "Offline";
  time: string;
  icon: string;
  avatar: string;
  dateValue: number;
}

const avatarStyles = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-orange-100 text-orange-600",
  "bg-red-100 text-red-600",
  "bg-emerald-100 text-emerald-600",
];

function getId(value: UserInfo | string | undefined): string {

  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || "";
}

function getName(value: UserInfo | string | undefined): string {
  if (!value) return "Unknown user";

  if (typeof value === "string") {
    return "UPI user";
  }

  return value.fullName || value.upiId || "UPI user";
}

function getStatus(status: string): TransactionStatus {
  const normalized = status?.toUpperCase();

  if (
    normalized === "SUCCESS" ||
    normalized === "COMPLETED" ||
    normalized === "SETTLED"
  ) {
    return "Success";
  }

  if (
    normalized === "PENDING" ||
    normalized === "PROCESSING"
  ) {
    return "Pending";
  }

  if (
    normalized === "FAILED" ||
    normalized === "REJECTED" ||
    normalized === "CANCELLED"
  ) {
    return "Failed";
  }

  return "Other";
}

function formatAmount(amount: number | string): string {
  const value = Number(amount);

  return Number.isFinite(value)
    ? value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function getDateLabel(dateString?: string): string {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() !== today.getFullYear()
        ? "numeric"
        : undefined,
  });
}

function getTimeLabel(dateString?: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function mapTransaction(
  transaction: ApiTransaction,
  currentUserId: string,
  index: number
): Transaction {
  const senderId = getId(transaction.sender);
  const receiverId = getId(transaction.receiver);

  const isSent = senderId === currentUserId;

  const otherParty = isSent
    ? transaction.receiver
    : transaction.sender;

  const name = getName(otherParty);
  const status = getStatus(transaction.status);

  const dateString =
    transaction.createdAt ||
    transaction.timestamp ||
    transaction.updatedAt;

  const parsedDate = dateString
    ? new Date(dateString)
    : null;

  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate
      : null;

  const offline =
    transaction.offline === true ||
    transaction.mode?.toLowerCase() === "offline";

  const dateValue = validDate?.getTime() || 0;

  const avatar = avatarStyles[index % avatarStyles.length];

  return {
    id: transaction._id,
    name,
    subtitle: `${isSent ? "Paid to" : "Received from"} ${
      validDate ? `· ${getTimeLabel(dateString)}` : ""
    }`,
    amount: `${isSent ? "−" : "+"}₹${formatAmount(
      transaction.amount
    )}`,
    type: isSent ? "sent" : "received",
    status,
    mode: offline ? "Offline" : "Online",
    time: getDateLabel(dateString),
    icon: name.charAt(0).toUpperCase() || "₹",
    avatar,
    dateValue,
  };
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch the logged-in user and their transaction history.
      const [profileData, transactionData] = await Promise.all([
        apiRequest("/api/users/profile"),
        apiRequest("/api/transactions/history"),
      ]);

      const currentUser = profileData?.user;

      const currentUserId = currentUser?._id || currentUser?.id;

      if (!currentUserId) {
        throw new Error(
          "Unable to identify your account. Please log in again."
        );
      }

      const apiTransactions: ApiTransaction[] =
        transactionData?.transactions || [];

      const mappedTransactions = apiTransactions.map(
        (transaction, index) =>
          mapTransaction(transaction, currentUserId, index)
      );

      // Newest transactions first.
      mappedTransactions.sort(
        (a, b) => b.dateValue - a.dateValue
      );

      setTransactions(mappedTransactions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load transaction history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const syncPendingTransactions = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncMessage("");
    setError("");

    try {
      const data = await apiRequest("/api/transactions/sync", {
        method: "POST",
      });

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to synchronize transactions."
        );
      }

      setSyncMessage(
        data.message || "Transactions synced successfully."
      );

      // Refresh the transaction list after synchronization.
      await fetchTransactions();
    } catch (err: unknown) {
      setSyncMessage(
        err instanceof Error
          ? err.message
          : "Transaction synchronization failed."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter(
    (transaction) => {
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
    }
  );

  const groupedTransactions = filteredTransactions.reduce<
    Record<string, Transaction[]>
  >((groups, transaction) => {
    const groupName = transaction.time;

    if (!groups[groupName]) {
      groups[groupName] = [];
    }

    groups[groupName].push(transaction);

    return groups;
  }, {});

  const totalSent = transactions
    .filter(
      (transaction) =>
        transaction.type === "sent" &&
        transaction.status === "Success"
    )
    .reduce((total, transaction) => {
      const amount = Number(
        transaction.amount.replace(/[₹,+−-]/g, "")
      );

      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);

  const totalReceived = transactions
    .filter(
      (transaction) =>
        transaction.type === "received" &&
        transaction.status === "Success"
    )
    .reduce((total, transaction) => {
      const amount = Number(
        transaction.amount.replace(/[₹,+−-]/g, "")
      );

      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);

  return (
    <main className="flex min-h-screen justify-center bg-[#f5f7f6]">
      <div className="flex min-h-screen w-full max-w-130 flex-col bg-white shadow-xl">
        {/* Header */}
        <header className="px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/home"
                aria-label="Back to dashboard"
                className="text-2xl text-[#071b35] transition hover:opacity-70"
              >
                ←
              </Link>

              <div>
                <h1 className="text-xl font-bold text-[#071b35]">
                  Transactions
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                  Your payment activity
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchTransactions()}
              disabled={loading}
              aria-label="Refresh transactions"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-lg transition hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? "…" : "↻"}
            </button>
          </div>
        </header>

        {/* Summary cards */}
        {!loading && !error && transactions.length > 0 && (
          <section className="grid grid-cols-2 gap-3 px-6 pt-2">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Total sent
              </p>

              <p className="mt-2 wrap-break-word text-xl font-bold text-[#071b35]">
                ₹
                {totalSent.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Total received
              </p>

              <p className="mt-2 wrap-break-word text-xl font-bold text-[#071b35]">
                ₹
                {totalReceived.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </section>
        )}

        {/* Offline transaction synchronization */}
        <section className="px-6 pt-4">
          <button
            type="button"
            onClick={() => void syncPendingTransactions()}
            disabled={isSyncing || loading}
            className="w-full rounded-xl bg-[#071b35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing
              ? "Syncing transactions..."
              : "Sync Pending Transactions"}
          </button>

          {syncMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 text-center text-sm ${
                /failed|unable|error|invalid|not authorized/i.test(syncMessage)
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {syncMessage}
            </p>
          )}
        </section>

        {/* Filters */}
        <section className="px-6 pt-5">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(
              [
                { key: "all", label: "All" },
                { key: "sent", label: "Sent" },
                { key: "received", label: "Received" },
                { key: "pending", label: "Pending" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`h-10 flex-1 rounded-lg text-xs font-semibold transition ${
                  filter === item.key
                    ? "bg-[#071b35] text-white shadow-sm"
                    : "text-[#071b35] hover:bg-white/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* Transaction list */}
        <section className="flex-1 px-6 pb-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#071b35]" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your transactions...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
              <div className="text-2xl">⚠️</div>

              <h2 className="mt-3 font-bold text-[#071b35]">
                Unable to load transactions
              </h2>

              <p className="mt-2 wrap-break-word text-sm text-slate-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void fetchTransactions()}
                className="mt-5 rounded-xl bg-[#071b35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-[#071b35]">
                ₹
              </div>

              <h2 className="mt-4 text-base font-bold text-[#071b35]">
                {transactions.length === 0
                  ? "No transactions yet"
                  : "No transactions found"}
              </h2>

              <p className="mt-2 max-w-xs text-center text-sm leading-6 text-slate-500">
                {transactions.length === 0
                  ? "Your payments will appear here when you start using Offline UPI."
                  : "There are no transactions in this category."}
              </p>

              {transactions.length === 0 && (
                <Link
                  href="/send"
                  className="mt-5 rounded-xl bg-[#071b35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Send your first payment
                </Link>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            Object.entries(groupedTransactions).map(
              ([groupName, groupTransactions]) => (
                <div key={groupName} className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#071b35]">
                      {groupName}
                    </h2>

                    <span className="text-xs text-slate-400">
                      {groupTransactions.length}{" "}
                      {groupTransactions.length === 1
                        ? "transaction"
                        : "transactions"}
                    </span>
                  </div>

                  <div>
                    {groupTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
        </section>

        {/* Bottom navigation */}
        <nav className="shrink-0 border-t border-slate-200 bg-white px-6 py-3">
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

/* Transaction row */

function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const isSent = transaction.type === "sent";

  const statusStyles: Record<TransactionStatus, string> = {
    Success: "text-green-600",
    Pending: "text-orange-500",
    Failed: "text-red-600",
    Other: "text-slate-500",
  };

  return (
    <Link
      href={`/transactions/${encodeURIComponent(transaction.id)}`}
      className="flex items-center gap-3 border-b border-slate-100 py-4 transition hover:bg-slate-50"
    >
      {/* Avatar */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${transaction.avatar}`}
      >
        {transaction.icon}
      </div>

      {/* Transaction details */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#071b35]">
          {transaction.name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {transaction.subtitle}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              transaction.mode === "Offline"
                ? "bg-orange-50 text-orange-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {transaction.mode}
          </span>

          {isSent && (
            <span className="text-[10px] text-slate-400">
              Money sent
            </span>
          )}

          {!isSent && (
            <span className="text-[10px] text-slate-400">
              Money received
            </span>
          )}
        </div>
      </div>

      {/* Amount and status */}
      <div className="shrink-0 text-right">
        <p
          className={`text-sm font-bold ${
            isSent ? "text-[#071b35]" : "text-green-600"
          }`}
        >
          {transaction.amount}
        </p>

        <p
          className={`mt-1 text-xs font-medium ${
            statusStyles[transaction.status]
          }`}
        >
          {transaction.status === "Other"
            ? "Unknown status"
            : transaction.status}
        </p>
      </div>
    </Link>
  );
}

/* Bottom navigation item */

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
      className={`flex flex-col items-center gap-1 transition ${
        active ? "text-[#071b35]" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <span className="text-xl">{icon}</span>

      <span
        className={`text-[10px] ${
          active ? "font-semibold" : ""
        }`}
      >
        {label}
      </span>
    </Link>
  );
}