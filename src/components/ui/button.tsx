import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { COMPONENT_PATTERNS, ANIMATIONS } from '@/lib/design-system';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  href?: string;
  to?: string;
  className?: string;
  showArrow?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  href,
  to,
  onClick,
  className = '',
  showArrow = false,
  disabled = false,
  ...buttonProps
}) => {
  const baseClass = variant === 'primary' 
    ? COMPONENT_PATTERNS.button.primary 
    : COMPONENT_PATTERNS.button.secondary;

  const sizeClasses = {
    small: 'px-4 py-2 text-xs',
    medium: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base',
  };

  const combinedClasses = `${baseClass} ${sizeClasses[size]} ${className} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  const content = (
    <>
      {children}
      {showArrow && (
        <ArrowRight className={`w-4 h-4 ml-2 ${ANIMATIONS.transition.transform} group-hover:translate-x-1`} />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`inline-flex items-center ${combinedClasses}`}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={`inline-flex items-center ${combinedClasses}`}>
        {content}
      </a>
    );
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`inline-flex items-center ${combinedClasses}`}
      {...buttonProps}
    >
      {content}
    </button>
  );
};

export default Button;
export { Button }; 