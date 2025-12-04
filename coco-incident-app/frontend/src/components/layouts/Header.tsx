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
    <header className="py-3 sm:py-4 mb-6 sm:mb-8 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1 break-words">
              【セルプロ】インシデント管理システム
            </h1>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {showPermissionManagement && (
              <Button
                variant="secondary"
                onClick={showPermissionManagement}
                className="!px-2 sm:!px-4 !py-2 sm:!py-2.5 text-xs sm:text-sm min-h-10 sm:min-h-11"
              >
                権限管理
              </Button>
            )}
            <Button
              variant="contrast"
              onClick={toggleTheme}
              className="!px-2 sm:!px-3 !py-2 sm:!py-2.5 min-h-10 sm:min-h-11 min-w-10 sm:min-w-11"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          トラブル情報を詳細に記録し、適切な対応を行うための管理システムです
        </p>
      </Container>
    </header>
  );
};

export default Header;
