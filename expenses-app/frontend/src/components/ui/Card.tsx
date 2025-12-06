import { ReactNode } from 'react';

/**
 * Cardコンポーネントのプロパティ
 */
interface CardProps {
  /** カード内に表示するコンテンツ */
  children: ReactNode;
  /** 追加のCSSクラス名 */
  className?: string;
  /** 中央揃えにするかどうか（デフォルト: false） */
  centered?: boolean;
}

/**
 * 白い背景の丸角カードコンポーネント
 *
 * @param props - CardPropsオブジェクト
 * @returns カードコンポーネント
 *
 * @example
 * ```tsx
 * <Card>
 *   <p>カードの内容</p>
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * <Card centered>
 *   <h1>中央揃えのタイトル</h1>
 * </Card>
 * ```
 */
export default function Card({
  children,
  className = '',
  centered = false,
}: CardProps) {
  // 基本スタイル: 丸角、ボーダー、白背景、シャドウ
  const baseClasses =
    'rounded-3xl border border-slate-200 bg-white shadow-sm';
  // centeredプロパティに応じてパディングを調整
  const paddingClasses = centered ? 'px-6 py-8' : 'p-6';
  // centeredプロパティに応じてテキストを中央揃えに
  const textClasses = centered ? 'text-center' : '';

  return (
    <article
      className={`${baseClasses} ${paddingClasses} ${textClasses} ${className}`}
    >
      {children}
    </article>
  );
}
