import { MinecraftCharacter, getCharacterTypes } from './MinecraftCharacter';

/**
 * Preview page to see all Minecraft-style characters side by side.
 * Temporary — for design review only.
 */
export function CharacterPreview() {
  const types = getCharacterTypes();

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-10">
      <h1 className="text-white text-3xl font-bold mb-2 text-center">
        Traektoriya Blocks — Character Gallery
      </h1>
      <p className="text-gray-500 text-center mb-10">
        Minecraft-inspired pixel art characters for cinematic scenes
      </p>

      <div className="flex flex-wrap justify-center gap-12">
        {types.map((type) => (
          <div key={type} className="flex flex-col items-center gap-4">
            {/* Character at 3x scale */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-6
              flex items-end justify-center" style={{ minHeight: 280 }}>
              <MinecraftCharacter type={type} size={3} isActive={false} />
            </div>

            {/* Animated version */}
            <div className="bg-[#111827] border border-blue-800/30 rounded-xl p-6
              flex items-end justify-center" style={{ minHeight: 280 }}>
              <MinecraftCharacter type={type} size={3} isActive={true} />
            </div>

            <span className="text-gray-400 text-sm font-mono bg-gray-800/50
              px-3 py-1 rounded-full">
              {type}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center text-gray-600 text-sm">
        Top row: idle state | Bottom row: active (talking) state
      </div>
    </div>
  );
}
