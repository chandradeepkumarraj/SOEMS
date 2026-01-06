import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'error' | 'warning';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: 'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg',
            secondary: 'bg-secondary hover:bg-secondary/90 text-white shadow-sm',
            outline: 'border-2 border-primary text-primary hover:bg-primary/5',
            ghost: 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100',
            success: 'bg-emerald-600 dark:bg-success hover:bg-emerald-700 dark:hover:bg-successDark text-white shadow-lg shadow-emerald-500/30',
            error: 'bg-rose-600 dark:bg-error hover:bg-rose-700 dark:hover:bg-errorDark text-white shadow-lg shadow-rose-500/30',
            warning: 'bg-amber-500 dark:bg-warning hover:bg-amber-600 dark:hover:bg-warningDark text-white shadow-lg shadow-amber-500/30',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-5 py-2.5 text-base',
            lg: 'px-8 py-3 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
