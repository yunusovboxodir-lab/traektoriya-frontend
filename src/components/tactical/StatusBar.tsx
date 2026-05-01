/**
 * StatusBar — верхняя горизонтальная полоса.
 * Структура из Tactical Dashboard.html (handoff 2026-05-01).
 */
import { useEffect, useState } from 'react';

export function StatusBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="statusbar">
      <div className="brand-wrap">
        <button className="brand" aria-label="Меню">
          <img src="/tactical/traektoriya-logo.jpg" alt="Traektoriya" className="brand-logo" />
          <div className="brand-text">
            <div className="brand-name">TRAEKTORIYA</div>
            <div className="brand-tag">с нуля до эксперта</div>
          </div>
          <span className="brand-caret">▾</span>
        </button>
      </div>
      <div className="sb-divider" />
      <div className="sb-mod">
        <span className="sb-mod-num">03</span>
        <span className="sb-mod-name">СТРАТЕГИЧЕСКИЙ ШТАБ</span>
        <span className="sb-mod-sub">/ TACTICAL TABLE</span>
      </div>
      <div className="sb-divider" />
      <div className="sb-meta">
        <span className="sb-pulse" />
        <span>СИСТЕМА · <strong>ОНЛАЙН</strong></span>
      </div>
      <div className="sb-meta">СЕССИЯ · <strong>SES-08842-A</strong></div>
      <div className="sb-meta">ОБНОВЛЕНО · <strong>{time} UTC+5</strong></div>
      <div className="sb-spacer" />
      <div className="lang-toggle" role="group" aria-label="Язык">
        <button className="lang-opt on">РУ</button>
        <button className="lang-opt">UZ</button>
      </div>
      <button className="sb-btn">ФИЛЬТРЫ</button>
      <button className="sb-btn">ЭКСПОРТ</button>
    </div>
  );
}
