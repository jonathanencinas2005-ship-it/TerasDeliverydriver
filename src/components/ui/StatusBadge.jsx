const LABELS = {
  pending: 'Menunggu Approval',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  active: 'Aktif',
  inactive: 'Nonaktif'
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
