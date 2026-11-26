// Board columns, in order. `id` is stored on each application as its status.
export const STATUSES = [
  { id: 'wishlist', label: 'To Apply' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Closed' },
];

export const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];

export const STORAGE_KEY = 'jat.applications.v2';
