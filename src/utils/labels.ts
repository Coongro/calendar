export const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No asistió',
  tentative: 'Tentativo',
};

export const STATUS_COLORS: Record<string, string> = {
  scheduled: 'cg-info',
  confirmed: 'cg-success',
  completed: 'cg-muted',
  cancelled: 'cg-danger',
  no_show: 'cg-warning',
  tentative: 'cg-accent',
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled: 'bg-cg-info-bg text-cg-info border-cg-info-border',
  confirmed: 'bg-cg-success-bg text-cg-success border-cg-success-border',
  completed: 'bg-cg-bg-secondary text-cg-text-muted border-cg-border',
  cancelled: 'bg-cg-danger-bg text-cg-danger border-cg-danger-border',
  no_show: 'bg-cg-warning-bg text-cg-warning-text border-cg-warning-border',
  tentative: 'bg-cg-accent/10 text-cg-accent border-cg-accent/30',
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function toSelectOptions(
  labels: Record<string, string>
): Array<{ label: string; value: string }> {
  return Object.entries(labels).map(([value, label]) => ({ label, value }));
}
