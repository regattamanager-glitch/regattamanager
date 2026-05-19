import React from 'react';

export default function AdminDashboard() {
  // Später kannst du hier deine echten Statistiken abrufen (z. B. Anzahl der Regatten, Benutzer, etc.)
  const stats = {
    totalUsers: 142,
    activeRegattas: 5,
    revenueThisMonth: "240,00 €"
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Regatta Manager – Admin Dashboard</h1>
      <p>Hier sind die aktuellen Statistiken deiner Plattform:</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
          <h3>Benutzer gesamt</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</p>
        </div>
        
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
          <h3>Aktive Regatten</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.activeRegattas}</p>
        </div>

        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
          <h3>Umsatz (Monat)</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.revenueThisMonth}</p>
        </div>
      </div>
    </div>
  );
}