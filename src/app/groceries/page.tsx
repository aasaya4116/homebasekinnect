"use client";

import { useState } from "react";

type GroceryItem = {
  id: string;
  name: string;
  category: string;
  checked: boolean;
};

const initialItems: GroceryItem[] = [
  { id: "1", name: "Chicken Breasts", category: "Meat", checked: false },
  { id: "2", name: "Lemons", category: "Produce", checked: true },
  { id: "3", name: "Broccoli", category: "Produce", checked: false },
  { id: "4", name: "Whole Wheat Pasta", category: "Pantry", checked: false },
  { id: "5", name: "Milk", category: "Dairy", checked: false },
];

export default function Groceries() {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Grocery List</h1>
          <p style={{ margin: 0, fontSize: '1.2rem' }}>{items.filter(i => !i.checked).length} items remaining</p>
        </div>
      </header>

      <main className="grid-2">
        {categories.map(category => (
          <section key={category} className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-hover)' }}>{category}</h2>
            <div>
              {items.filter(i => i.category === category).map(item => (
                <div 
                  key={item.id} 
                  className="checklist-item"
                  onClick={() => toggleItem(item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`checkbox ${item.checked ? 'checked' : ''}`}>
                    {item.checked && (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '1.1rem',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
