"use client";

import { useState, useTransition } from "react";
import { RefreshCw, X, Utensils, Pizza, Check } from "lucide-react";
import { confirmMealAction, swapMealAction } from "@/lib/actions";

interface InventoryMeal {
  name: string;
  type?: string;
  prepTime?: string;
  ingredients?: string;
  image?: string;
}

interface MealSwapModalProps {
  dateStr: string;
  mealType: string;
  currentMealName: string;
  inventory: InventoryMeal[];
  buttonStyle?: React.CSSProperties;
  label?: string;
  canConfirm?: boolean;
  source?: "Menu" | "Scheduled Meals";
  cook?: string;
}

const CHANGE_REASONS = [
  { key: "busy", label: "Too busy" },
  { key: "missing-ingredients", label: "Missing ingredients" },
  { key: "preference", label: "Wanted something else" },
  { key: "leftovers", label: "Use leftovers" },
  { key: "ate-out", label: "Ate out" },
  { key: "schedule-change", label: "Schedule changed" },
  { key: "other", label: "Other" },
] as const;

export default function MealSwapModal({
  dateStr,
  mealType,
  currentMealName,
  inventory,
  buttonStyle,
  label = "Swap",
  canConfirm = false,
  source = "Scheduled Meals",
  cook = "",
}: MealSwapModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedReason, setSelectedReason] = useState("");
  const [error, setError] = useState("");

  // Filter inventory by search query
  const filteredInventory = inventory.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickSwap = (quickName: string) => {
    if (!selectedReason) return;
    startTransition(async () => {
      setError("");
      const result = await swapMealAction(dateStr, mealType, quickName, "N/A", "", "", selectedReason);
      if (result?.success) setIsOpen(false);
      else setError(result?.error || "Homebase could not save this change.");
    });
  };

  const handleConfirmRecipe = (meal: InventoryMeal) => {
    if (!selectedReason) return;
    startTransition(async () => {
      setError("");
      const result = await swapMealAction(
        dateStr,
        mealType,
        meal.name,
        meal.prepTime || "30 mins",
        meal.ingredients || "",
        meal.image || "",
        selectedReason
      );
      if (result?.success) setIsOpen(false);
      else setError(result?.error || "Homebase could not save this change.");
    });
  };

  const handleConfirmCustom = () => {
    if (!searchQuery.trim() || !selectedReason) return;
    startTransition(async () => {
      setError("");
      const result = await swapMealAction(dateStr, mealType, searchQuery.trim(), "30 mins", "", "", selectedReason);
      if (result?.success) setIsOpen(false);
      else setError(result?.error || "Homebase could not save this change.");
    });
  };

  const handleConfirmCurrent = () => {
    startTransition(async () => {
      setError("");
      const result = await confirmMealAction(dateStr, mealType, currentMealName, source, cook);
      if (result?.success) setIsOpen(false);
      else setError(result?.error || "Homebase could not confirm this meal.");
    });
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setError("");
          setSelectedReason("");
          setIsOpen(true);
        }}
        style={{
          background: 'var(--gold-dim)',
          color: 'var(--gold)',
          border: '1px solid transparent',
          borderRadius: '999px',
          padding: '4px 10px',
          fontSize: '0.72rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          ...buttonStyle
        }}
        title={canConfirm ? "Confirm or change this meal" : "Change this meal"}
      >
        <RefreshCw size={12} />
        {label ? <span>{label}</span> : null}
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="widget"
            style={{
              width: '100%',
              maxWidth: '550px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {canConfirm ? "What did we eat?" : "Change the plan"} 🍽️
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {mealType} for {dateStr} · Currently: {currentMealName}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close meal dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {canConfirm && (
              <button
                disabled={isPending}
                onClick={handleConfirmCurrent}
                style={{
                  minHeight: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                  padding: "12px 18px",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  borderRadius: "999px",
                  background: "rgba(16, 185, 129, 0.14)",
                  color: "var(--accent-green)",
                  font: "inherit",
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                <Check size={18} /> We ate {currentMealName}
              </button>
            )}

            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", marginBottom: "8px", textTransform: "uppercase" }}>
                If it changed, why?
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {CHANGE_REASONS.map((reason) => (
                  <button
                    key={reason.key}
                    type="button"
                    disabled={isPending}
                    onClick={() => setSelectedReason(reason.key)}
                    style={{
                      minHeight: "42px",
                      padding: "8px 13px",
                      borderRadius: "999px",
                      border: selectedReason === reason.key ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                      background: selectedReason === reason.key ? "var(--gold-dim)" : "var(--bg-panel-hover)",
                      color: selectedReason === reason.key ? "var(--text-primary)" : "var(--text-secondary)",
                      font: "inherit",
                      fontSize: "0.8rem",
                      fontWeight: 650,
                      cursor: "pointer",
                    }}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Quick Deviations (Skips Grocery Restock)
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  disabled={isPending || !selectedReason}
                  onClick={() => handleQuickSwap("Leftovers")}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 700,
                    cursor: selectedReason ? 'pointer' : 'not-allowed',
                    opacity: selectedReason ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Utensils size={16} /> Leftovers 🥡
                </button>
                <button
                  disabled={isPending || !selectedReason}
                  onClick={() => handleQuickSwap("Eat Out")}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--accent-orange)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: 700,
                    cursor: selectedReason ? 'pointer' : 'not-allowed',
                    opacity: selectedReason ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Pizza size={16} /> Eat Out / Takeout 🍕
                </button>
              </div>
            </div>

            {/* Search / Custom Input */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Or Pick From Recipe Inventory / Type Dish
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search recipes or type custom dish name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-panel-hover)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
                {searchQuery.trim() && !inventory.some(i => i.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                  <button
                    disabled={isPending || !selectedReason}
                    onClick={handleConfirmCustom}
                    className="btn-primary"
                    style={{ padding: '0 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Use &ldquo;{searchQuery}&rdquo;
                  </button>
                )}
              </div>
            </div>

            {/* Inventory List Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
                overflowY: 'auto',
                maxHeight: '300px',
                paddingRight: '4px'
              }}
            >
              {filteredInventory.map((meal, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={isPending || !selectedReason}
                  onClick={() => !isPending && selectedReason && handleConfirmRecipe(meal)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'var(--bg-panel-hover)',
                    border: '1px solid var(--border-color)',
                    cursor: selectedReason ? 'pointer' : 'not-allowed',
                    opacity: selectedReason ? 1 : 0.52,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s',
                    font: 'inherit',
                    textAlign: 'left',
                    appearance: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {meal.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⏱️ {meal.prepTime || "30m"}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Select →</span>
                  </div>
                </button>
              ))}
              {filteredInventory.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  No matching recipes found in inventory. Type above to use custom dish name!
                </div>
              )}
            </div>

            {/* Footer / Status */}
            {isPending && (
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>
                ⏳ Syncing change with Google Sheets...
              </div>
            )}
            {error && (
              <div role="alert" style={{ color: "var(--accent-red)", fontSize: "0.82rem", fontWeight: 650, textAlign: "center" }}>
                {error}
              </div>
            )}
            {!selectedReason && !isPending && (
              <div style={{ color: "var(--text-tertiary)", fontSize: "0.76rem", textAlign: "center" }}>
                Choose a reason to unlock replacement meals.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
