"use client";

export default function ByPerson() {
  const familyMembers = [
    { name: "Dad", role: "Parent", color: "var(--accent-color)" },
    { name: "Mom", role: "Parent", color: "var(--warning-color)" },
    { name: "Son (9)", role: "Kid", color: "var(--success-color)" },
    { name: "Son (6)", role: "Kid", color: "#8b5cf6" },
  ];

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem' }}>
        <h1>By Person</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Individual schedules for Today</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {familyMembers.map((member) => (
          <section key={member.name} className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${member.color}` }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem' }}>
                {member.name[0]}
              </div>
              {member.name}
            </h2>
            
            <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>8:00 AM</p>
              <p style={{ fontWeight: 'bold' }}>{member.role === 'Kid' ? 'School' : 'Work'}</p>
            </div>

            {member.role === 'Kid' && (
              <div className="glass-card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>4:00 PM</p>
                <p style={{ fontWeight: 'bold' }}>{member.name.includes("9") ? 'Soccer Practice' : 'Gymnastics'}</p>
              </div>
            )}

            {member.role === 'Parent' && (
              <div className="glass-card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>7:00 PM</p>
                <p style={{ fontWeight: 'bold' }}>Dinner Out</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
