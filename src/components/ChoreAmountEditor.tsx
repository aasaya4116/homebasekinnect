"use client";

import { FormEvent, useEffect, useId, useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updateChoreAllowanceAction } from "@/lib/actions";
import { fmtMoney } from "@/lib/choreShared";

export default function ChoreAmountEditor({
  choreId,
  choreName,
  kid,
  allowance,
  color,
}: {
  choreId: string;
  choreName: string;
  kid: string;
  allowance: number;
  color: string;
}) {
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(allowance.toFixed(2));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isPending]);

  const parsed = Number(amount);
  const canSave =
    !isPending && amount.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;

  const open = () => {
    setAmount(allowance.toFixed(2));
    setError("");
    setIsOpen(true);
  };

  const close = () => {
    if (isPending) return;
    setError("");
    setIsOpen(false);
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;

    startTransition(async () => {
      const result = await updateChoreAllowanceAction(choreId, kid, parsed);
      if (result.success && typeof result.allowance === "number") {
        setIsOpen(false);
        setError("");
      } else {
        setError(result.error || "The amount could not be saved. Try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="chore-val chore-val-btn"
        onClick={open}
        title={`Change the amount for ${choreName}`}
        aria-label={`Change ${choreName} amount, currently ${fmtMoney(allowance)}`}
      >
        +{fmtMoney(allowance)}
        <Pencil size={13} aria-hidden />
      </button>

      {isOpen && (
        <div className="chore-amount-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <form
            className="chore-amount-modal widget"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-title`}
            onSubmit={save}
          >
            <div className="chore-amount-head">
              <div className="chore-amount-kid" style={{ background: color }} aria-hidden>
                {kid[0]}
              </div>
              <div>
                <h3 id={`${inputId}-title`}>Change chore amount</h3>
                <p>{kid} · {choreName}</p>
              </div>
              <button type="button" className="chore-amount-close" onClick={close} aria-label="Close amount editor">
                <X size={20} />
              </button>
            </div>

            <label className="chore-amount-label" htmlFor={inputId}>Amount per completion</label>
            <div className="chore-amount-input-wrap">
              <span aria-hidden>$</span>
              <input
                id={inputId}
                type="number"
                min="0"
                max="100"
                step="0.25"
                inputMode="decimal"
                autoFocus
                value={amount}
                disabled={isPending}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
              />
            </div>

            <p className="chore-amount-note">
              This changes future check-offs only. Past earnings stay the same.
            </p>

            {error && <p className="chore-amount-error" role="alert">{error}</p>}

            <div className="chore-amount-actions">
              <button type="button" className="chore-amount-cancel" onClick={close} disabled={isPending}>
                Cancel
              </button>
              <button type="submit" className="chore-amount-save" disabled={!canSave}>
                {isPending ? "Saving…" : "Save amount"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
