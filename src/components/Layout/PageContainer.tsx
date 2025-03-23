
import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
