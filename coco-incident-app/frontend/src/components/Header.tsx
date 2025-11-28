import React from 'react';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="container py-3">
      <div className="header-theme-button">
        <button onClick={toggleTheme} className="contrast">
          <i
            className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'}`}
          ></i>
        </button>
      </div>
      <div className="d-flex align-items-center mb-2">
        <h1 className="mb-0">【セルプロ】インシデント管理システム</h1>
      </div>
      <p className="mb-0">
        トラブル情報を詳細に記録し、適切な対応を行うための管理システムです
      </p>
    </header>
  );
};

export default Header;
