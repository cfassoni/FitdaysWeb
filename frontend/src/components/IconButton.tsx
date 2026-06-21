import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  'aria-label'?: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, title, 'aria-label': ariaLabel, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        title={title}
        aria-label={ariaLabel || title}
        className={`flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
