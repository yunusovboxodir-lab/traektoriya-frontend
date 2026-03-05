import type { BlockResultsData } from '../../../api/learning';

interface Props {
  data: BlockResultsData;
  title: string;
  correct: number;
  total: number;
  elapsedSeconds: number;
  accent: string;
  onFinish: () => void;
}

export function BlockResults({ data, title, correct, total, elapsedSeconds, accent, onFinish }: Props) {
  const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 100;

  // Choose emoji based on score
  let emoji = '\u{1F389}'; // party
  if (scorePercent < 50) emoji = '\u{1F914}'; // thinking
  else if (scorePercent < 80) emoji = '\u{1F44D}'; // thumbs up

  return (
    <div className="animate-slideUp">
      <div className="bg-white mx-3 rounded-2xl p-8 shadow-sm text-center">
        <div className="text-[56px] mb-2">{emoji}</div>
        <div className="text-xl font-extrabold mb-1">Урок пройден!</div>
        <div className="text-[13px] text-gray-400 mb-5">{title}</div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl py-3 px-1.5">
            <div className="text-xl font-black" style={{ color: accent }}>{correct}</div>
            <div className="text-[9px] text-gray-400 mt-0.5">правильных</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-3 px-1.5">
            <div className="text-xl font-black" style={{ color: accent }}>{total}</div>
            <div className="text-[9px] text-gray-400 mt-0.5">всего</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-3 px-1.5">
            <div className="text-xl font-black" style={{ color: accent }}>{minutes}</div>
            <div className="text-[9px] text-gray-400 mt-0.5">минут</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-xl text-base font-extrabold mb-3">
          +{data.xpReward} XP {'\u{1F3C6}'}
        </div>

        <button
          onClick={onFinish}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-transform active:scale-[0.97]"
          style={{ background: accent }}
        >
          Продолжить {'\u2192'}
        </button>
      </div>
    </div>
  );
}
