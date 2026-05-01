/**
 * StatusBar — верхняя горизонтальная полоса.
 * Структура из Tactical Dashboard.html (handoff 2026-05-01).
 */
import { useEffect, useState } from 'react';
import { useLangStore } from '../../stores/langStore';

export function StatusBar() {
  const [now, setNow] = useState(new Date());
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

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
            <div className="brand-tag">{lang === 'uz' ? 'noldan ekspertgacha' : 'с нуля до эксперта'}</div>
          </div>
          <span className="brand-caret">▾</span>
        </button>
      </div>
      <div className="sb-divider" />
      <div className="sb-mod">
        <span className="sb-mod-num">03</span>
        <span className="sb-mod-name">{lang === 'uz' ? 'STRATEGIK SHTAB' : 'СТРАТЕГИЧЕСКИЙ ШТАБ'}</span>
        <span className="sb-mod-sub">/ TACTICAL TABLE</span>
      </div>
      <div className="sb-divider" />
      <div className="sb-meta">
        <span className="sb-pulse" />
        <span>{lang === 'uz' ? 'TIZIM' : 'СИСТЕМА'} · <strong>{lang === 'uz' ? 'ONLAYN' : 'ОНЛАЙН'}</strong></span>
      </div>
      <div className="sb-meta">{lang === 'uz' ? 'SESSIYA' : 'СЕССИЯ'} · <strong>SES-08842-A</strong></div>
      <div className="sb-meta">{lang === 'uz' ? 'YANGILANDI' : 'ОБНОВЛЕНО'} · <strong>{time} UTC+5</strong></div>
      <div className="sb-spacer" />
      <div className="lang-toggle" role="group" aria-label="Язык">
        <button
          className={'lang-opt' + (lang === 'ru' ? ' on' : '')}
          onClick={() => setLang('ru')}
        >РУ</button>
        <button
          className={'lang-opt' + (lang === 'uz' ? ' on' : '')}
          onClick={() => setLang('uz')}
        >UZ</button>
      </div>
      <button className="sb-btn">{lang === 'uz' ? 'FILTRLAR' : 'ФИЛЬТРЫ'}</button>
      <button className="sb-btn">{lang === 'uz' ? 'EKSPORT' : 'ЭКСПОРТ'}</button>
    </div>
  );
}
