import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
};
