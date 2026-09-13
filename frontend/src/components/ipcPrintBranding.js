/**
 * Branding for Individual Point Card (IPC) print — uses school config dynamically.
 * Values mirror the reference PDF (Hasil_Cetak_IPC.pdf).
 */
export const getIpcPrintBranding = (schoolConfig = {}) => {
  const schoolName = schoolConfig.school_name || 'SMK Negeri Bali Mandara';
  const principalName = schoolConfig.principal_name || '';
  const principalNip = schoolConfig.principal_nip || '';

  return {
    schoolLine1: schoolName,
    schoolLine2: schoolName.toUpperCase(),
    placeName: 'Kubutambahan',
    kepalaSekolah: {
      titleLine: `Kepala ${schoolName.replace('SMK Negeri', 'SMKN')}`,
      nama: principalName,
      nip: principalNip,
    },
  };
};
