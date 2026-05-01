/**
 * StatusBar — верхний бар: лого, координаты, время, маршрут.
 * Адаптировано из Tactical Dashboard.html .statusbar.
 */
import { useEffect, useState } from 'react';

export function StatusBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="statusbar">
      <div className="sb-logo">
        <img src="/tactical/traektoriya-logo.jpg" alt="Traektoriya" />
        <div>
          <div className="sb-brand">TRAEKTORIYA</div>
          <div className="sb-mode">СТРАТЕГИЧЕСКИЙ ШТАБ · LMS-V4.2</div>
        </div>
      </div>
      <div className="sb-meta">
        <div className="sb-coord">
          <span className="sb-lbl">КООРД</span>
          <span className="sb-val">41.2995° N · 69.2401° E</span>
        </div>
        <div className="sb-coord">
          <span className="sb-lbl">СЕКТОР</span>
          <span className="sb-val">UZ-04 · TASHKENT</span>
        </div>
        <div className="sb-coord">
          <span className="sb-lbl">ДАТА</span>
          <span className="sb-val">{date}</span>
        </div>
        <div className="sb-coord sb-clock">
          <span className="sb-lbl">ВРЕМЯ</span>
          <span className="sb-val">{time}</span>
        </div>
      </div>
    </div>
  );
}
