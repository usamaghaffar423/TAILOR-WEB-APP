import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  sm?: boolean;
}

export function Button({ variant = 'primary', sm, className = '', ...props }: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-danger';
  return (
    <button className={`btn ${variantClass}${sm ? ' btn-sm' : ''} ${className}`.trim()} {...props} />
  );
}
