import React from 'react';
import { Button } from '../ui';
import Container from './Container';
import { MoonIcon, SunIcon } from '../icons';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="py-4 mb-8 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      <Container>
        <div className="flex items-center justify-between gap-4 mb-3">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 break-words">
            coco incident app
          </h1>
          <Button
            variant="contrast"
            onClick={toggleTheme}
            className="!px-3 !py-2 flex-shrink-0"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          トラブル情報を詳細に記録し、適切な対応を行うための管理システムです
        </p>
      </Container>
    </header>
  );
};

export default Header;
