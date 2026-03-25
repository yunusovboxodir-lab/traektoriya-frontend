export type CharacterAnimState = 'idle' | 'talking';

interface CharacterLottieConfig {
  idle: string;
  talking: string;
}

const CHARACTER_LOTTIE_MAP: Record<string, CharacterLottieConfig> = {
  default: {
    idle: '/lottie/characters/person-idle.json',
    talking: '/lottie/characters/person-talking.json',
  },
  clipboard: {
    idle: '/lottie/characters/person-idle.json',
    talking: '/lottie/characters/person-talking.json',
  },
  phone: {
    idle: '/lottie/characters/person-idle.json',
    talking: '/lottie/characters/person-talking.json',
  },
  box: {
    idle: '/lottie/characters/person-idle.json',
    talking: '/lottie/characters/person-talking.json',
  },
};

export function getCharacterLottie(detail?: string): CharacterLottieConfig {
  return CHARACTER_LOTTIE_MAP[detail || 'default'] || CHARACTER_LOTTIE_MAP.default;
}
