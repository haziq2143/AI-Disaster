export function emergencyCardText(card) {
  const lines = [
    'KARTU IDENTITAS DARURAT',
    `Nama: ${card.name || '—'}`,
    card.profile?.dateOfBirth ? `Tanggal lahir: ${card.profile.dateOfBirth}` : '',
    card.profile?.phone ? `Telepon: ${card.profile.phone}` : '',
    card.profile?.emergencyContactName ? `Kontak darurat: ${card.profile.emergencyContactName}` : '',
    card.profile?.emergencyContactPhone ? `Telepon kontak darurat: ${card.profile.emergencyContactPhone}` : '',
    card.profile?.bloodType ? `Golongan darah: ${card.profile.bloodType}` : '',
    card.profile?.gender ? `Jenis kelamin: ${card.profile.gender}` : '',
    card.profile?.medicalInfo ? `Riwayat kesehatan/alergi: ${card.profile.medicalInfo}` : '',
    card.profile?.homeArea ? `Domisili: ${card.profile.homeArea}` : ''
  ];
  return lines.filter(Boolean).join('\n');
}
