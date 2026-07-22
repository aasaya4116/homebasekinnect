"use client";

// Parent-facing balance adjustment: bonus, deduction, or full cash-out.
// Trigger renders as a "Balance $X" pill in the weekly tally strip; the
// modal follows the MealSwapModal pattern (inline styles on app tokens).
// Money math and the zero-out amount are settled server-side — this UI
// only previews them.

import { useState, useTransition } from "react";
import { Wallet, X } from "lucide-react";
import { adjustBalanceAction } from "@/lib/actions";
import { fmtMoney } from "@/lib/choreShared";

/** fmtMoney with an explicit sign for adjustment previews (e.g. "-$2.50"). */
function fmtSigned(v: number): string {
  return v < 0 ? `-${fmtMoney(Math.abs(v))}` : fmtMoney(v);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "var(--bg-panel-hover)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  fontSize: "1rem",
  fontFamily: "inherit",
  minHeight: "44px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "6px",
  display: "block",
};

export default function BalanceAdjustModal({
  kid,
  balance,
  color,
  variant = "pill",
  lineText,
}: {
  kid: string;
  balance: number;
  color: string;
  /** "pill" = wallet pill (tally strip); "line" = inline earnings-line trigger (kid card header). */
  variant?: "pill" | "line";
  /** Text for the line variant, e.g. "$1 this week · 25¢ today". */
  lineText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [amountStr, setAmountStr] = useState("");
  const [zeroOut, setZeroOut] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const parsed = parseFloat(amountStr);
  const validAmount = isFinite(parsed) && parsed !== 0;
  const after = zeroOut ? 0 : validAmount ? Math.round((balance + parsed) * 100) / 100 : balance;
  const canSave = !isPending && (zeroOut || validAmount);

  const reset = () => {
    setAmountStr("");
    setZeroOut(false);
    setNote("");
    setError("");
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await adjustBalanceAction(kid, validAmount ? parsed : 0, note, zeroOut);
      if (res.success) {
        reset();
        setIsOpen(false);
      } else {
        setError(res.error || "Something went wrong — try again");
      }
    });
  };

  return (
    <>
      {/* Trigger — the kid's running balance is the tap target */}
      {variant === "line" ? (
        // Kid-card header: the earnings line itself opens the modal. Kept
        // visually identical to the old static line, with a wallet glyph and
        // the balance as the affordance that it's tappable.
        <button
          onClick={() => setIsOpen(true)}
          title={`Adjust balance / cash out for ${kid}`}
          className="kid-earned kid-earned-btn"
        >
          <Wallet size={14} aria-hidden />
          <b>{fmtMoney(balance)}</b>
          {lineText ? <span className="ke-sep">·</span> : null}
          {lineText}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          title={`Adjust balance / cash out for ${kid}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--gold-dim)",
            color: "var(--gold)",
            border: "1px solid transparent",
            borderRadius: "999px",
            padding: "8px 16px",
            fontSize: "0.9rem",
            fontWeight: 750,
            fontFamily: "inherit",
            cursor: "pointer",
            minHeight: "44px",
            whiteSpace: "nowrap",
          }}
        >
          <Wallet size={16} />
          {fmtMoney(balance)}
        </button>
      )}

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="widget"
            role="dialog"
            aria-modal="true"
            aria-label={`Adjust balance for ${kid}`}
            style={{
              width: "100%",
              maxWidth: "440px",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              background: "var(--bg-panel)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              padding: "1.25rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                  {kid[0]}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--text-primary)" }}>
                    Adjust Balances for {kid}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                    Current balance: <b style={{ color: "var(--gold)" }}>{fmtMoney(balance)}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { reset(); setIsOpen(false); }}
                aria-label="Close"
                style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "8px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Amount */}
            <div>
              <label style={labelStyle} htmlFor={`bal-amount-${kid}`}>Adjustment amount (+/−)</label>
              <input
                id={`bal-amount-${kid}`}
                type="number"
                step="0.25"
                inputMode="decimal"
                placeholder="e.g. 2.50 or -5"
                value={amountStr}
                disabled={zeroOut || isPending}
                onChange={(e) => setAmountStr(e.target.value)}
                style={{ ...inputStyle, opacity: zeroOut ? 0.4 : 1 }}
              />
            </div>

            {/* Zero-out toggle */}
            <button
              role="switch"
              aria-checked={zeroOut}
              disabled={isPending}
              onClick={() => setZeroOut(!zeroOut)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: zeroOut ? "var(--gold-dim)" : "var(--bg-panel-hover)",
                border: `1px solid ${zeroOut ? "var(--gold)" : "var(--border-color)"}`,
                color: "var(--text-primary)",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                minHeight: "44px",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "38px",
                  height: "22px",
                  flex: "none",
                  borderRadius: "999px",
                  background: zeroOut ? "var(--gold-fill)" : "var(--border-color)",
                  position: "relative",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ position: "absolute", top: "3px", left: zeroOut ? "19px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
              </span>
              <span>
                Zero out balance
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-tertiary)" }}>
                  Cash out the full {fmtMoney(balance)} and reset to $0
                </span>
              </span>
            </button>

            {/* Before / After preview */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", padding: "10px", borderRadius: "12px", background: "var(--bg-panel-hover)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ ...labelStyle, marginBottom: "2px" }}>Before</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-secondary)" }}>{fmtSigned(balance)}</span>
              </div>
              <span style={{ color: "var(--text-tertiary)", fontSize: "1.2rem" }} aria-hidden>→</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ ...labelStyle, marginBottom: "2px" }}>After</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 750, color: "var(--gold)" }}>{fmtSigned(after)}</span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label style={labelStyle} htmlFor={`bal-note-${kid}`}>Note (optional)</label>
              <input
                id={`bal-note-${kid}`}
                type="text"
                maxLength={120}
                placeholder='e.g. "Cashed out $5 allowance", "Bonus"'
                value={note}
                disabled={isPending}
                onChange={(e) => setNote(e.target.value)}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ fontSize: "0.85rem", color: "var(--accent-red)", fontWeight: 600 }}>{error}</div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "2px" }}>
              <button
                onClick={() => { reset(); setIsOpen(false); }}
                disabled={isPending}
                style={{
                  padding: "11px 22px",
                  borderRadius: "999px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  padding: "11px 26px",
                  borderRadius: "999px",
                  background: "var(--gold-fill)",
                  border: "none",
                  color: "var(--gold-ink)",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: canSave ? "pointer" : "not-allowed",
                  opacity: canSave ? 1 : 0.5,
                  minHeight: "44px",
                }}
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
