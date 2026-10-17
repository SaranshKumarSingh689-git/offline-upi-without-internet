"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface UserInfo {
  _id?: string;
  id?: string;
  fullName?: string;
  upiId?: string;
}

interface ApiTransaction {
  _id: string;
  transactionId?: string;
  txnId?: string;

  sender: UserInfo | string;
  receiver: UserInfo | string;

  amount: number | string;
  status: string;

  offline?: boolean;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

interface TransactionDetails {
  id: string;
  transactionId: string;
  name: string;
  upiId: string;
  amount: number;
  type: "Money Sent" | "Money Received";
  status: string;
  mode: "Online" | "Offline";
  date: string;
  time: string;
  note: string;
  isReceived: boolean;
  isPending: boolean;
  isFailed: boolean;
}

function getUserId(user: UserInfo | string | undefined): string {
  if (!user) return "";

  if (typeof user === "string") {
    return user;
  }

  return user._id || user.id || "";
}

function getUserName(user: UserInfo | string | undefined): string {
  if (!user) return "Unknown user";

  if (typeof user === "string") {
    return "UPI user";
  }

  return user.fullName || user.upiId || "UPI user";
}

function getUpiId(user: UserInfo | string | undefined): string {
  if (!user || typeof user === "string") {
    return "UPI ID unavailable";
  }

  return user.upiId || "UPI ID unavailable";
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString?: string): string {
  if (!dateString) return "Time unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeStatus(status: string): string {
  const normalized = status?.toUpperCase();

  switch (normalized) {
    case "SUCCESS":
    case "COMPLETED":
    case "SETTLED":
      return "Success";

    case "PENDING":
    case "PROCESSING":
      return "Pending";

    case "FAILED":
    case "REJECTED":
      return "Failed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
}

function mapTransaction(
  transaction: ApiTransaction,
  currentUserId: string
): TransactionDetails {
  const senderId = getUserId(transaction.sender);

  const isReceived = senderId !== currentUserId;

  const otherParty = isReceived
    ? transaction.sender
    : transaction.receiver;

  const status = normalizeStatus(transaction.status);

  const dateString =
    transaction.createdAt ||
    transaction.timestamp ||
    transaction.updatedAt;

  const amount = Number(transaction.amount);

  return {
    id: transaction._id,

    transactionId:
      transaction.transactionId ||
      transaction.txnId ||
      transaction._id,

    name: getUserName(otherParty),

    upiId: getUpiId(otherParty),

    amount: Number.isFinite(amount) ? amount : 0,

    type: isReceived ? "Money Received" : "Money Sent",

    status,

    mode: transaction.offline ? "Offline" : "Online",

    date: formatDate(dateString),

    time: formatTime(dateString),

    // The current backend sendMoney request does not store a note.
    note: "No note available",

    isReceived,

    isPending: status === "Pending",

    isFailed:
      status === "Failed" || status === "Cancelled",
  };
}

export default function TransactionDetailsPage() {
  const params = useParams<{ id: string }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [transaction, setTransaction] =
    useState<TransactionDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load transaction details from the authenticated history endpoint.
  const fetchTransaction = useCallback(async () => {
    if (!id) {
      setError("Invalid transaction ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [profileData, historyData] = await Promise.all([
        apiRequest("/api/users/profile"),
        apiRequest("/api/transactions/history"),
      ]);

      const currentUserId =
        profileData?.user?._id || profileData?.user?.id;

      if (!currentUserId) {
        throw new Error(
          "Unable to identify your account. Please log in again."
        );
      }

      const transactions: ApiTransaction[] =
        historyData?.transactions || [];

      const selectedTransaction = transactions.find(
        (item) => item._id === id
      );

      if (!selectedTransaction) {
        throw new Error(
          "Transaction not found in your recent transaction history."
        );
      }

      setTransaction(
        mapTransaction(selectedTransaction, currentUserId)
      );
    } catch (err) {
      setTransaction(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load transaction details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchTransaction();
  }, [fetchTransaction]);

  // Synchronize pending offline transactions for the current user.
  const handleSync = async () => {
    setSyncing(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(
        "/api/transactions/sync",
        {
          method: "POST",
        }
      );

      setMessage(
        response?.message ||
          "Synchronization request completed. Refreshing transaction status..."
      );

      // Fetch the transaction again to obtain its latest status.
      await fetchTransaction();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to synchronize pending payments."
      );
    } finally {
      setSyncing(false);
    }
  };

  // Print the receipt or let the user save it as a PDF.
  const handleDownloadReceipt = () => {
    window.print();
  };

  // Share the transaction summary.
  const handleShare = async () => {
    if (!transaction) return;

    const summary = [
      "Offline UPI - Transaction Receipt",
      `Transaction ID: ${transaction.transactionId}`,
      `Type: ${transaction.type}`,
      `Name: ${transaction.name}`,
      `Amount: ₹${transaction.amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      `Status: ${transaction.status}`,
      `Payment Mode: ${transaction.mode}`,
      `Date: ${transaction.date}`,
      `Time: ${transaction.time}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Offline UPI Transaction",
          text: summary,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        setMessage("Transaction details copied to clipboard.");
      } else {
        setMessage(
          "Sharing is not supported in this browser."
        );
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.name === "AbortError"
      ) {
        return;
      }

      setError("Unable to share transaction details.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen justify-center bg-[#f5f7f6]">
        <div className="flex min-h-screen w-full max-w-130 flex-col items-center justify-center bg-white px-6 shadow-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#071b35]" />

          <p className="mt-4 text-sm text-slate-500">
            Loading transaction details...
          </p>
        </div>
      </main>
    );
  }

  if (error && !transaction) {
    return (
      <main className="flex min-h-screen justify-center bg-[#f5f7f6]">
        <div className="flex min-h-screen w-full max-w-130 flex-col bg-white px-6 shadow-xl">
          <header className="flex items-center gap-4 py-6">
            <Link
              href="/transactions"
              className="text-2xl text-[#071b35]"
            >
              ←
            </Link>

            <h1 className="text-xl font-bold text-[#071b35]">
              Transaction Details
            </h1>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
              !
            </div>

            <h2 className="mt-4 text-lg font-bold text-[#071b35]">
              Unable to load transaction
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void fetchTransaction()}
              className="mt-5 rounded-xl bg-[#071b35] px-5 py-3 text-sm font-semibold text-white"
            >
              Try Again
            </button>

            <Link
              href="/transactions"
              className="mt-4 text-sm font-semibold text-blue-600"
            >
              Back to Transactions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!transaction) return null;

  const statusIcon = transaction.isPending
    ? "⌛"
    : transaction.isFailed
      ? "!"
      : transaction.isReceived
        ? "↓"
        : "✓";

  const statusHeading = transaction.isPending
    ? "Payment Pending"
    : transaction.isFailed
      ? "Payment Failed"
      : transaction.isReceived
        ? "Money Received"
        : "Payment Successful";

  const statusColor = transaction.isPending
    ? "bg-orange-100 text-orange-500"
    : transaction.isFailed
      ? "bg-red-100 text-red-600"
      : transaction.isReceived
        ? "bg-green-100 text-green-600"
        : "bg-blue-100 text-blue-600";

  return (
    <main className="flex min-h-screen justify-center bg-[#f5f7f6]">
      <div className="flex min-h-screen w-full max-w-130 flex-col bg-white shadow-xl">
        {/* Header */}
        <header className="px-6 pb-4 pt-6 print:hidden">
          <div className="flex items-center gap-4">
            <Link
              href="/transactions"
              aria-label="Back to transactions"
              className="text-2xl text-[#071b35] hover:opacity-70"
            >
              ←
            </Link>

            <h1 className="text-xl font-bold text-[#071b35]">
              Transaction Details
            </h1>
          </div>
        </header>

        {/* Transaction status */}
        <section className="px-6 pt-6">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${statusColor}`}
            >
              <span className="text-3xl">
                {statusIcon}
              </span>
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-[#071b35]">
              {statusHeading}
            </h2>

            <p
              className={`mt-2 text-4xl font-extrabold ${
                transaction.isReceived
                  ? "text-green-600"
                  : "text-[#071b35]"
              }`}
            >
              {transaction.isReceived ? "+" : "−"}₹
              {transaction.amount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <div
              className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                transaction.mode === "Offline"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {transaction.mode} Payment
            </div>
          </div>
        </section>

        {/* Other party */}
        <section className="mt-8 px-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">
              {transaction.isReceived
                ? "Received From"
                : "Paid To"}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ff] font-bold text-[#071b35]">
                {transaction.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="wrap-break-word text-base font-bold text-[#071b35]">
                  {transaction.name}
                </p>

                <p className="mt-0.5 break-all text-sm text-slate-500">
                  {transaction.upiId}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment details */}
        <section className="mt-5 px-6">
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
              label="Status"
              value={transaction.status}
            />

            <DetailRow
              label="Note"
              value={transaction.note}
              last
            />
          </div>
        </section>

        {/* Offline notice */}
        {transaction.isPending &&
          transaction.mode === "Offline" && (
            <section className="mt-5 px-6">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <span className="text-orange-500">
                      ⌛
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#071b35]">
                      Offline payment pending
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This payment is still pending. Synchronize
                      pending transactions when a connection is
                      available, then check its updated status.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* Feedback messages */}
        {(message || (error && transaction)) && (
          <div className="mt-5 px-6">
            {message && (
              <div
                role="status"
                className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <section className="mt-auto px-6 pb-8 pt-8 print:hidden">
          {transaction.isPending &&
          transaction.mode === "Offline" ? (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="h-14 w-full rounded-xl bg-[#071b35] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing
                ? "Synchronizing..."
                : "Sync Pending Payments"}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="rounded-xl border border-[#071b35] px-3 py-3 text-sm font-semibold text-[#071b35] transition hover:bg-slate-50"
              >
                Print / Save Receipt
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl bg-[#071b35] px-3 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Share
              </button>
            </div>
          )}

          <Link
            href="/transactions"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Back to Transactions
          </Link>
        </section>
      </div>

      {/* Print-only receipt heading */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          main {
            min-height: auto !important;
            background: white !important;
          }

          main > div {
            max-width: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}

/* Detail row */

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
      className={`flex items-start justify-between gap-4 py-3 ${
        !last ? "border-b border-slate-200" : ""
      }`}
    >
      <span className="shrink-0 text-xs text-slate-500">
        {label}
      </span>

      <span className="break-all text-right text-xs font-semibold text-[#071b35]">
        {value}
      </span>
    </div>
  );
}