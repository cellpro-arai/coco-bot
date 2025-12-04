import React from 'react';
import { Button } from '../ui';
import Container from './Container';
import { MoonIcon, SunIcon } from '../icons';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  showPermissionManagement?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  showPermissionManagement,
}) => {
  return (
    <header className="py-4 mb-8 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 relative">
      <Container>
        <div className="absolute top-2 right-6 space-x-2">
          {showPermissionManagement && (
            <Button
              variant="secondary"
              onClick={showPermissionManagement}
              className="!px-3 !py-1.5"
            >
              権限管理
            </Button>
          )}
          <Button
            variant="contrast"
            onClick={toggleTheme}
            className="!px-2 !py-1.5"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="mb-2">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-0">
            【セルプロ】インシデント管理システム
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-0">
          トラブル情報を詳細に記録し、適切な対応を行うための管理システムです
        </p>
      </Container>
    </header>
  );
};

export default Header;
