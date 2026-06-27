/**
 * platformGuides.ts — контент «Гида по платформе» (онбординг, пункт 2 фаза C).
 *
 * 6 коротких туров-инструктажей «как пользоваться платформой» (а не продажам).
 * Появляются как золотые бонусные узлы на Карте обучения по мере роста тира.
 * Формат — лёгкий тур-карточки (3-5 карточек, свайп). Двуязычно (RU/UZ).
 *
 * Связь: тир появления (minTier) использует ту же шкалу Мощи, что и
 * progressiveDisclosure. День-1 (bronze) сразу даёт 4 базовых гида.
 */
import type { Tier } from './progressiveDisclosure';

export interface GuideCard {
  /** Эмодзи-иллюстрация карточки (опц.). */
  icon?: string;
  title: { ru: string; uz: string };
  body: { ru: string; uz: string };
}

export interface PlatformGuide {
  id: string;
  /** Иконка узла на Карте. */
  icon: string;
  /** Подпись узла. */
  label: { ru: string; uz: string };
  /** При каком тире Мощи узел появляется. */
  minTier: Tier;
  cards: GuideCard[];
}

export const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    id: 'welcome',
    icon: '🎓',
    label: { ru: 'Добро пожаловать', uz: 'Xush kelibsiz' },
    minTier: 'bronze',
    cards: [
      {
        icon: '🎓',
        title: { ru: 'Это — Траектория', uz: 'Bu — Traektoriya' },
        body: {
          ru: 'Платформа, где ты прокачиваешься в профессии — с нуля до эксперта. Учишься, работаешь в поле, растёшь.',
          uz: 'Bu — kasbingni noldan ekspertgacha o‘stiradigan platforma. O‘qiysan, maydonda ishlaysan, o‘sasan.',
        },
      },
      {
        icon: '🧭',
        title: { ru: 'Путь из 4 уровней', uz: '4 bosqichli yo‘l' },
        body: {
          ru: 'Стажёр → Практик → Эксперт → Мастер. Каждый урок и действие двигают тебя вперёд по этому пути.',
          uz: 'Stajyor → Amaliyotchi → Ekspert → Usta. Har bir dars va harakat seni shu yo‘lda oldinga suradi.',
        },
      },
      {
        icon: '🎁',
        title: { ru: 'Разделы открываются призами', uz: 'Bo‘limlar sovg‘a sifatida ochiladi' },
        body: {
          ru: 'Сначала у тебя только «Обучение». Растёт Мощь — открываются новые разделы, как сундуки с наградой.',
          uz: 'Avval faqat «O‘qish» bor. Kuch o‘sgani sari yangi bo‘limlar — sovg‘ali sandiqlar kabi — ochiladi.',
        },
      },
    ],
  },
  {
    id: 'lesson',
    icon: '📚',
    label: { ru: 'Как проходить урок', uz: 'Darsni qanday o‘tish' },
    minTier: 'bronze',
    cards: [
      {
        icon: '📖',
        title: { ru: 'Урок — это блоки', uz: 'Dars — bu bloklar' },
        body: {
          ru: 'Внутри урока несколько коротких блоков: история, ключевые мысли, иногда сценка. Листай по порядку.',
          uz: 'Dars ichida bir nechta qisqa blok bor: hikoya, asosiy fikrlar, ba’zan sahna. Tartib bilan varaqla.',
        },
      },
      {
        icon: '✅',
        title: { ru: 'В конце — тест', uz: 'Oxirida — test' },
        body: {
          ru: 'После материала идёт короткий тест. Ответь правильно — урок засчитан, Мощь растёт.',
          uz: 'Materialdan keyin qisqa test bo‘ladi. To‘g‘ri javob ber — dars hisoblanadi, Kuch oshadi.',
        },
      },
      {
        icon: '🔊',
        title: { ru: 'Можно слушать', uz: 'Tinglash mumkin' },
        body: {
          ru: 'У многих уроков есть озвучка — удобно повторять в дороге или между визитами.',
          uz: 'Ko‘p darslarda ovozli o‘qish bor — yo‘lda yoki tashriflar orasida takrorlash qulay.',
        },
      },
    ],
  },
  {
    id: 'map',
    icon: '🗺️',
    label: { ru: 'Карта обучения', uz: 'O‘qish xaritasi' },
    minTier: 'bronze',
    cards: [
      {
        icon: '🗺️',
        title: { ru: 'Вся учёба — на Карте', uz: 'Butun o‘qish — Xaritada' },
        body: {
          ru: 'Карта поделена на 4 территории по уровням. Каждый посёлок — это курс. Двигайся слева направо.',
          uz: 'Xarita darajalar bo‘yicha 4 hududga bo‘lingan. Har bir qishloq — kurs. Chapdan o‘ngga harakatlan.',
        },
      },
      {
        icon: '🔵',
        title: { ru: 'Статус узла', uz: 'Tugun holati' },
        body: {
          ru: 'Светящийся узел — доступен сейчас. С галочкой — пройден. С замком — откроется позже.',
          uz: 'Yorqin tugun — hozir ochiq. Belgili — o‘tilgan. Qulfli — keyinroq ochiladi.',
        },
      },
      {
        icon: '👆',
        title: { ru: 'Жми на посёлок', uz: 'Qishloqqa bos' },
        body: {
          ru: 'Нажми на узел или строку в списке — откроется курс с уроками. Карта на телефоне зафиксирована — просто листай страницу.',
          uz: 'Tugun yoki ro‘yxatdagi qatorga bos — darsli kurs ochiladi. Telefonda xarita qotirilgan — sahifani varaqla.',
        },
      },
    ],
  },
  {
    id: 'power',
    icon: '⚡',
    label: { ru: 'Твоя Мощь', uz: 'Sening Kuching' },
    minTier: 'silver',
    cards: [
      {
        icon: '⚡',
        title: { ru: 'Мощь — твой главный счёт', uz: 'Kuch — asosiy hisobing' },
        body: {
          ru: 'Это общий показатель силы. Чем выше Мощь — тем выше место в рейтинге и больше открытых разделов.',
          uz: 'Bu — umumiy kuch ko‘rsatkichi. Kuch qancha baland bo‘lsa, reytingda o‘rning yuqori va ochiq bo‘limlar ko‘p.',
        },
      },
      {
        icon: '🧮',
        title: { ru: 'Из чего складывается', uz: 'Nimadan tashkil topadi' },
        body: {
          ru: 'Обучение + активность в поле + серия дней подряд (стрик). Делай всё понемногу каждый день — Мощь растёт быстрее.',
          uz: 'O‘qish + maydondagi faollik + ketma-ket kunlar (strik). Har kuni ozdan qil — Kuch tezroq oshadi.',
        },
      },
      {
        icon: '🎁',
        title: { ru: 'Мощь открывает разделы', uz: 'Kuch bo‘limlarni ochadi' },
        body: {
          ru: 'На каждом новом уровне Мощи выпадает сундук с новым разделом и подсказкой, зачем он нужен.',
          uz: 'Har yangi Kuch darajasida yangi bo‘lim va u nima uchun kerakligi haqida maslahat bilan sandiq tushadi.',
        },
      },
    ],
  },
  {
    id: 'streak',
    icon: '🔥',
    label: { ru: 'Стрик и квест дня', uz: 'Strik va kun kvesti' },
    minTier: 'silver',
    cards: [
      {
        icon: '🔥',
        title: { ru: 'Стрик — дни подряд', uz: 'Strik — ketma-ket kunlar' },
        body: {
          ru: 'Заходишь и учишься каждый день — стрик растёт. Прервёшь — сгорит. Стрик даёт бонус к Мощи.',
          uz: 'Har kuni kirib o‘qisang — strik o‘sadi. Uzsang — yonadi. Strik Kuchga bonus beradi.',
        },
      },
      {
        icon: '🎯',
        title: { ru: 'Квест дня', uz: 'Kun kvesti' },
        body: {
          ru: 'Каждый день есть простая цель — например, «закрой 1 раздел». Выполнил — получил XP и поддержал стрик.',
          uz: 'Har kuni oddiy maqsad bor — masalan, «1 bo‘limni yop». Bajarding — XP olding va strikni saqlading.',
        },
      },
    ],
  },
  {
    id: 'feedback',
    icon: '🗣️',
    label: { ru: 'Сообщить о проблеме', uz: 'Muammo haqida xabar' },
    minTier: 'bronze',
    cards: [
      {
        icon: '🗣️',
        title: { ru: 'Что-то не так? Сообщи', uz: 'Nimadir noto‘g‘rimi? Xabar ber' },
        body: {
          ru: 'Внизу справа есть кнопка «Сообщить». Нашёл баг, есть идея или вопрос — жми, это помогает улучшать платформу.',
          uz: 'Pastda o‘ngda «Xabar berish» tugmasi bor. Bug topding, g‘oya yoki savol bo‘lsa — bos, bu platformani yaxshilashga yordam beradi.',
        },
      },
      {
        icon: '📷',
        title: { ru: 'Скрин прикрепится сам', uz: 'Skrin o‘zi biriktiriladi' },
        body: {
          ru: 'Кнопка сама снимает текущий экран. Добавь короткий комментарий и выбери тип: баг / идея / вопрос.',
          uz: 'Tugma joriy ekranni o‘zi suratga oladi. Qisqa izoh qo‘sh va turini tanla: bug / g‘oya / savol.',
        },
      },
    ],
  },
];

/** Гиды, доступные на данном тире (накопительно). */
export function guidesUpToTier(tier: Tier | null): PlatformGuide[] {
  const rank: Record<Tier, number> = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
  const r = rank[tier ?? 'bronze'];
  return PLATFORM_GUIDES.filter((g) => rank[g.minTier] <= r);
}
