import { useState, useEffect } from "react";
export default function CinematicScene() {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState("");
  const fullText = "Слушай... начнём с ЧП. Ракун расписал заявление. С понедельника его нет.";
  useEffect(() => {
    if (step < 2) return;
    let i = 0;
    const interval = setInterval(() => {
      setTyping(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [step]);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div style={{
      minHeight: "100vh", background: "#000",
      fontFamily: "'Georgia', serif",
      display: "flex", flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Cinematic bars */}
      <div style={{ height: 50, background: "#000", flexShrink: 0 }} />
      {/* Main scene */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Background: office at dusk */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #0c1829 0%, #1a2744 40%, #0d1520 100%)",
        }} />
        {/* Window light effect */}
        <div style={{
          position: "absolute", top: 0, right: "15%",
          width: 180, height: "60%",
          background: "linear-gradient(180deg, rgba(255,200,100,0.06) 0%, transparent 100%)",
          clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)"
        }} />
        {/* Desk silhouette */}
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "80%", maxWidth: 600 }}>
          {/* Papers on desk */}
          {step >= 1 && [0,1,2,3].map(i => (
            <div key={i} style={{
              position: "absolute",
              width: 90, height: 7,
              background: `rgba(96,165,250,${0.08+i*0.04})`,
              border: "1px solid rgba(96,165,250,0.15)",
              borderRadius: 2,
              left: 40 + i * 8, bottom: 50 + i * 5,
              transform: `rotate(${-8+i*4}deg)`,
              transition: "all 0.5s ease",
              opacity: step >= 1 ? 1 : 0,
            }} />
          ))}
          {/* Desk surface */}
          <div style={{
            height: 8, background: "linear-gradient(90deg, #1e293b, #334155, #1e293b)",
            borderRadius: 4, position: "absolute", bottom: 45, left: 0, right: 0
          }} />
          {/* Manager silhouette */}
          <div style={{
            position: "absolute", bottom: 50, left: "42%",
            transition: "all 0.8s ease",
            transform: step >= 2 ? "translateX(-10px)" : "translateX(0)"
          }}>
            <svg width="60" height="90" viewBox="0 0 60 90">
              <circle cx="30" cy="18" r="14" fill="#1e3a5f" />
              <path d="M5 90 Q30 55 55 90" fill="#1e3a5f"/>
              {/* Phone glow when ringing */}
              {step >= 2 && (
                <>
                  <circle cx="48" cy="20" r="8" fill="#ef4444" opacity="0.8"
                    style={{animation: "glow 0.8s infinite alternate"}}/>
                  <text x="44" y="24" fontSize="10" fill="white">📱</text>
                </>
              )}
            </svg>
          </div>
          {/* Alexander silhouette - calling */}
          {step >= 2 && (
            <div style={{
              position: "absolute", bottom: 50, right: "5%",
              opacity: step >= 2 ? 1 : 0, transition: "opacity 0.8s ease"
            }}>
              <svg width="50" height="80" viewBox="0 0 50 80">
                <circle cx="25" cy="15" r="12" fill="#1a1a2e"/>
                <path d="M5 80 Q25 48 45 80" fill="#1a1a2e"/>
                <text x="21" y="19" fontSize="10" fill="#ef4444">😰</text>
              </svg>
            </div>
          )}
        </div>
        {/* Location tag */}
        <div style={{
          position: "absolute", top: 20, left: 30,
          opacity: step >= 1 ? 1 : 0, transition: "opacity 1s ease"
        }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>
            ПЯТНИЦА
          </div>
          <div style={{
            color: "white", fontSize: 32, fontWeight: 900, letterSpacing: -1,
            textShadow: "0 0 40px rgba(239,68,68,0.3)"
          }}>17:00</div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: 2 }}>
            КОНЕЦ РАБОЧЕГО ДНЯ
          </div>
        </div>
        {/* Dialogue bubble */}
        {step >= 2 && (
          <div style={{
            position: "absolute", bottom: 180, right: 40,
            maxWidth: 280,
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 12, borderBottomRightRadius: 2,
            padding: "14px 18px",
            animation: "fadeIn 0.5s ease",
          }}>
            <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
              АЛЕКСАНДР (РМ)
            </div>
            <p style={{
              margin: 0, color: "#f1f5f9", fontSize: 14, lineHeight: 1.7,
              fontStyle: "italic"
            }}>
              «{typing}<span style={{ animation: "blink 1s infinite" }}>|</span>»
            </p>
          </div>
        )}
        {/* Crisis panel overlay */}
        {step >= 3 && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.8s ease"
          }}>
            <div style={{
              background: "rgba(10,5,0,0.95)",
              border: "1px solid rgba(239,68,68,0.5)",
              borderRadius: 16, padding: 32,
              maxWidth: 420, width: "90%", textAlign: "center"
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ color: "#ef4444", margin: "0 0 8px", fontSize: 22, fontWeight: 900 }}>
                РАКУН УХОДИТ
              </h2>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>
                С понедельника команда из <strong style={{color:"#f59e0b"}}>6 торговых представителей</strong> остаётся без руководителя.
              </p>
              {/* Team dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(245,158,11,0.15)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#f59e0b", fontSize: 11, fontFamily: "monospace"
                  }}>ТП{i+1}</div>
                ))}
              </div>
              <div style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.25)",
                borderRadius: 8, padding: "10px 16px",
                color: "#c4b5fd", fontSize: 13
              }}>
                🎯 Кто из них способен стать лидером?
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Cinematic bar bottom */}
      <div style={{ height: 50, background: "#000", flexShrink: 0 }} />
      <style>{`
        @keyframes glow { from{opacity:0.6} to{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}
