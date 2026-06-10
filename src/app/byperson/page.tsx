"use client";

export default function ByPerson() {
  const familyMembers = [
    { name: "Dad", role: "Parent", color: "var(--accent-blue)" },
    { name: "Mom", role: "Parent", color: "var(--accent-orange)" },
    { name: "Mekhi", role: "Kid", color: "var(--accent-green)", badge: "Intermediate Golf" },
    { name: "Khalil", role: "Kid", color: "var(--accent-purple)", badge: "Basic Golf" },
  ];

  return (
    <div style={{ padding: '0 2rem 2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>By Person</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Individual schedules for Today</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {familyMembers.map((member) => (
          <section key={member.name} className="glass-card" style={{ padding: '1.5rem', borderTop: `4px solid ${member.color}`, borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                {member.name[0]}
              </div>
              {member.name}
            </h2>

            {member.badge && (
              <div style={{ marginBottom: '1rem', backgroundColor: 'var(--bg-panel-hover)', padding: '6px 12px', borderRadius: '16px', display: 'inline-block', fontSize: '0.8rem', fontWeight: '600', color: member.color }}>
                {member.badge}
              </div>
            )}
            
            <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>8:00 AM</p>
              <p style={{ fontWeight: '600', margin: 0 }}>{member.role === 'Kid' ? 'School' : 'Work'}</p>
            </div>

            {member.role === 'Kid' && (
              <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>4:00 PM</p>
                <p style={{ fontWeight: '600', margin: 0 }}>Golf Practice ({member.name === "Mekhi" ? "Intermediate" : "Basic"})</p>
              </div>
            )}

            {member.role === 'Parent' && (
              <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>7:00 PM</p>
                <p style={{ fontWeight: '600', margin: 0 }}>Dinner Prep / Family Time</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
