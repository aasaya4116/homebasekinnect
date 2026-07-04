import { getFullDaySchedule } from "@/lib/data";

export const revalidate = 1800; // 30 minutes ISR caching
export default async function ByPerson() {
  const events = await getFullDaySchedule();

  const familyMembers = [
    { name: "Dad", role: "Parent", color: "var(--gold)" },
    { name: "Mom", role: "Parent", color: "var(--em)" },
    { name: "Mekhi", role: "Kid", color: "var(--accent-blue)" },
    { name: "Khalil", role: "Kid", color: "var(--text-tertiary)" },
  ];

  return (
    <div style={{ padding: '0 2rem 2rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>By Person</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Individual schedules for Today</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        {familyMembers.map((member) => {
          // Filter events for this specific person AND family events
          const memberEvents = events.filter(e => 
            e.person.toLowerCase() === member.name.toLowerCase() || 
            e.person.toLowerCase() === "family"
          );

          return (
            <section key={member.name} className="widget" style={{ padding: '1.5rem', borderTop: `4px solid ${member.color}`, borderRadius: 'var(--radius-md)' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                  {member.name[0]}
                </div>
                {member.name}
              </h2>

              
              {memberEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {memberEvents.map((event) => {
                    const isFamily = event.person.toLowerCase() === "family";
                    return (
                      <div key={event.id} style={{ 
                        padding: '1rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)', 
                        background: isFamily ? 'linear-gradient(to right, rgba(255, 255, 255, 0.03), transparent)' : `linear-gradient(to right, ${member.color}15, transparent)`,
                        borderLeft: `3px solid ${isFamily ? 'var(--text-tertiary)' : member.color}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{event.time}</p>
                          {isFamily && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', background: 'var(--bg-panel-hover)', color: 'var(--text-tertiary)' }}>
                              FAMILY
                            </span>
                          )}
                        </div>
                        <p style={{ fontWeight: '600', margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>{event.title}</p>
                        {event.location && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', margin: 0 }}>📍 {event.location}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No events today</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
