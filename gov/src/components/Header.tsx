// src/components/Header.tsx
interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <header className="gov-header">
      <div>
        <div className="gov-header__title">{title}</div>
        {subtitle && <div className="gov-header__sub">{subtitle}</div>}
      </div>
      <div className="gov-header__meta">
        <span>📅</span> {now}
      </div>
    </header>
  );
}
