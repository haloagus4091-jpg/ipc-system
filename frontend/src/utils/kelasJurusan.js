export const KELAS_OPTIONS = [
  'X TKJ 1', 'X TKJ 2', 'X TKR 1', 'X TKR 2',
  'X DPIB 1', 'X DPIB 2',
  'XI TKJ 1', 'XI TKJ 2', 'XI TKR 1', 'XI TKR 2',
  'XI DPIB 1', 'XI DPIB 2',
  'XII TKJ 1', 'XII TKJ 2', 'XII TKR 1', 'XII TKR 2',
  'XII DPIB 1', 'XII DPIB 2'
];

export function applyKelasChange(prev, kelas) {
  return {
    ...prev,
    kelas
  };
}
