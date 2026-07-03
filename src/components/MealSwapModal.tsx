"use client";

import { useState, useTransition } from "react";
import { RefreshCw, X, Utensils, Pizza, ShoppingBag, Check } from "lucide-react";
import { swapMealAction } from "@/lib/actions";

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
}

export default function MealSwapModal({
  dateStr,
  mealType,
  currentMealName,
  inventory,
  buttonStyle,
  label = "Swap"
}: MealSwapModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedMeal, setSelectedMeal] = useState<InventoryMeal | null>(null);

  // Filter inventory by search query
  const filteredInventory = inventory.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickSwap = (quickName: string) => {
    startTransition(async () => {
      await swapMealAction(dateStr, mealType, quickName, "N/A", "", "Both", "");
      setIsOpen(false);
    });
  };

  const handleConfirmRecipe = (meal: InventoryMeal) => {
    startTransition(async () => {
      await swapMealAction(
        dateStr,
        mealType,
        meal.name,
        meal.prepTime || "30 mins",
        meal.ingredients || "",
        "Both",
        meal.image || ""
      );
      setIsOpen(false);
    });
  };

  const handleConfirmCustom = () => {
    if (!searchQuery.trim()) return;
    startTransition(async () => {
      await swapMealAction(dateStr, mealType, searchQuery.trim(), "30 mins", "", "Both", "");
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        style={{
          background: 'rgba(14, 165, 233, 0.15)',
          color: 'var(--accent-blue)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          ...buttonStyle
        }}
        title="We Ate Something Else — Swap Dish"
      >
        <RefreshCw size={12} />
        <span>{label}</span>
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
                  We Ate Something Else 🍽️
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Swapping {mealType} for {dateStr} (Currently: {currentMealName})
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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

            {/* Quick Actions */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Quick Deviations (Skips Grocery Restock)
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  disabled={isPending}
                  onClick={() => handleQuickSwap("Leftovers")}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Utensils size={16} /> Leftovers 🥡
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleQuickSwap("Eat Out")}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--accent-orange)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: 700,
                    cursor: 'pointer',
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
                    disabled={isPending}
                    onClick={handleConfirmCustom}
                    className="btn-primary"
                    style={{ padding: '0 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Use "{searchQuery}"
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
                <div
                  key={idx}
                  onClick={() => !isPending && handleConfirmRecipe(meal)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'var(--bg-panel-hover)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {meal.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⏱️ {meal.prepTime || "30m"}</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Select →</span>
                  </div>
                </div>
              ))}
              {filteredInventory.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  No matching recipes found in inventory. Type above to use custom dish name!
                </div>
              )}
            </div>

            {/* Footer / Status */}
            {isPending && (
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                ⏳ Syncing change with Google Sheets...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
