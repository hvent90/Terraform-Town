export type BadgeVariant = 'status' | 'info';
export type BadgeProps = {
  label: string;
  color?: string;
  variant?: BadgeVariant;
};
