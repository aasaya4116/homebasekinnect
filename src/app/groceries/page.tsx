import { getGroceryList } from "@/lib/data";
import { ShoppingCart, Check, RefreshCw, Package } from "lucide-react";

export const revalidate = 1800; // 30 minutes ISR caching

export default async function Groceries() {
  const items = await getGroceryList();

  // Group items by category
  const grouped: Record<string, typeof items> = {};
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const categories = Object.keys(grouped);
  const toBuyCount = items.filter(i => i.status === "To Buy").length;
  const restockCount = items.filter(i => i.status === "Restock").length;

  // Category icon colors
  const categoryColors: Record<string, string> = {
    "Produce": "#10b981",
    "Meat & Seafood": "#ef4444",
    "Dairy": "#0ea5e9",
    "Grains & Carbs": "#f59e0b",
    "Canned & Jarred": "#8b5cf6",
    "Spices & Seasonings": "#ec4899",
    "Frozen": "#06b6d4",
    "Other": "#6b7280",
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <ShoppingCart size={24} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '10px', color: 'var(--accent-blue)' }}/>
            Grocery List
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Auto-generated from your scheduled meals
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-blue-glow)', padding: '6px 14px', borderRadius: '20px' }}>
            <Package size={14} color="var(--accent-blue)"/>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{toBuyCount} To Buy</span>
          </div>
          {restockCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-orange-glow)', padding: '6px 14px', borderRadius: '20px' }}>
              <RefreshCw size={14} color="var(--accent-orange)"/>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{restockCount} Restock</span>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="widget" style={{ textAlign: 'center', padding: '3rem' }}>
          <ShoppingCart size={48} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }}/>
          <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>No Grocery List Yet</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>
            Click "Auto-Schedule Week" on the Dashboard to generate your meals and grocery list.
          </p>
        </div>
      ) : (
        /* Category Sections */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {categories.map(category => {
            const catItems = grouped[category];
            const color = categoryColors[category] || "#6b7280";

            return (
              <div key={category} className="widget">
                {/* Category Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}/>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{category}</h3>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-panel-hover)', padding: '3px 10px', borderRadius: '12px' }}>
                    {catItems.length} item{catItems.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Items */}
                <div>
                  {catItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0',
                      borderBottom: idx < catItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}>
                      {/* Status Icon */}
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: item.status === 'To Buy' ? '2px solid var(--text-tertiary)' : 'none',
                        background: item.status === 'Restock' ? 'var(--accent-orange-glow)' : 'transparent',
                      }}>
                        {item.status === 'Restock' && <RefreshCw size={12} color="var(--accent-orange)"/>}
                      </div>

                      {/* Ingredient Name + Qty */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.ingredient}
                          {item.quantity && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '6px', fontWeight: 400 }}>
                              ({item.quantity})
                            </span>
                          )}
                        </div>
                        {/* Meal Source */}
                        {item.mealSource && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            → {item.mealSource}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                        textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                        background: item.status === 'Restock' ? 'var(--accent-orange-glow)' : 'var(--accent-blue-glow)',
                        color: item.status === 'Restock' ? 'var(--accent-orange)' : 'var(--accent-blue)',
                      }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
