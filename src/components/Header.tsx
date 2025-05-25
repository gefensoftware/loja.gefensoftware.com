import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface HeaderProps {
  onMenuClick: () => void;
  enterpriseName?: string;
  enterpriseLogo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  enterpriseName,
  enterpriseLogo,
}) => {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed top-0 z-30 w-full border-b bg-background/95 md:hidden border-none ${!isAtTop ? 'backdrop-blur supports-[backdrop-filter]:bg-background/60' : ''}`}>
      <div className="container flex h-16 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="mr-4 text-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* <div className="flex items-center gap-2">
          {enterpriseLogo && (
            <img
              src={enterpriseLogo}
              alt="Enterprise Logo"
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          {enterpriseName && (
            <span className="text-lg font-semibold text-primary">{enterpriseName}</span>
          )}
        </div> */}
      </div>
    </div>
  );
}; 