import React from 'react';
import styles from './Header.module.css';
import MoonFillIcon from './icons/MoonFillIcon';
import SunFillIcon from './icons/SunFillIcon';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className={`container py-3 ${styles.header}`}>
      <div className={styles.themeButton}>
        <button onClick={toggleTheme} className="contrast">
          {theme === 'light' ? <MoonFillIcon /> : <SunFillIcon />}
        </button>
      </div>
      <div className="align-items-center mb-2">
        <h1 className="mb-0">【セルプロ】インシデント管理システム</h1>
      </div>
      <p className="mb-0">
        トラブル情報を詳細に記録し、適切な対応を行うための管理システムです
      </p>
    </header>
  );
};

export default Header;
