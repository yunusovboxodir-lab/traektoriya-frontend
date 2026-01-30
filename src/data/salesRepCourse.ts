// ===========================================
// КУРС "СТАНДАРТЫ ТОРГОВОГО ПРЕДСТАВИТЕЛЯ"
// 100 шагов по методологии MOOC
// ===========================================

export interface Step {
  id: number;
  moduleId: number;
  title: string;
  titleUz: string;
  type: 'theory' | 'practice' | 'quiz' | 'video' | 'case_study';
  duration: number;
  content: string;
  contentUz: string;
  videoUrl?: string;
  quiz?: QuizQuestion[];
  practice?: PracticeTask;
  points: number;
  badge?: Badge;
}

export interface QuizQuestion {
  id: number;
  question: string;
  questionUz: string;
  options: string[];
  optionsUz: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface PracticeTask {
  instruction: string;
  instructionUz: string;
  checkpoints: string[];
  checkpointsUz: string[];
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  titleUz: string;
  description: string;
}

export interface Module {
  id: number;
  title: string;
  titleUz: string;
  description: string;
  descriptionUz: string;
  icon: string;
  color: string;
  stepsRange: [number, number];
}

// ===========================================
// МОДУЛИ
// ===========================================

export const modules: Module[] = [
  {
    id: 1,
    title: 'Портрет торгового представителя',
    titleUz: 'Savdo vakili portrati',
    description: 'Кто такой успешный ТП и какими качествами он обладает',
    descriptionUz: 'Muvaffaqiyatli savdo vakili kim va qanday fazilatlarga ega',
    icon: '👤',
    color: '#3B82F6',
    stepsRange: [1, 15]
  },
  {
    id: 2,
    title: 'DSPM: Дистрибуция',
    titleUz: 'DSPM: Distribyutsiya',
    description: 'Distribution — обеспечение присутствия товара',
    descriptionUz: 'Distribution — mahsulot mavjudligini ta\'minlash',
    icon: '📦',
    color: '#10B981',
    stepsRange: [16, 30]
  },
  {
    id: 3,
    title: 'DSPM: Выкладка',
    titleUz: 'DSPM: Joylash',
    description: 'Shelving — правила выкладки товара',
    descriptionUz: 'Shelving — mahsulotni joylashtirish qoidalari',
    icon: '📊',
    color: '#8B5CF6',
    stepsRange: [31, 45]
  },
  {
    id: 4,
    title: 'DSPM: Ценообразование',
    titleUz: 'DSPM: Narxlash',
    description: 'Pricing — работа с ценами и ценниками',
    descriptionUz: 'Pricing — narxlar bilan ishlash',
    icon: '💰',
    color: '#F59E0B',
    stepsRange: [46, 55]
  },
  {
    id: 5,
    title: 'Шаги успешного визита',
    titleUz: 'Muvaffaqiyatli tashrif qadamlari',
    description: '8 шагов эффективного визита в торговую точку',
    descriptionUz: 'Savdo nuqtasiga samarali tashrifning 8 qadami',
    icon: '👣',
    color: '#EF4444',
    stepsRange: [56, 75]
  },
  {
    id: 6,
    title: 'ФУП: Формат убедительных продаж',
    titleUz: 'FUP: Ishontiruvchi sotish formati',
    description: 'Структура убеждающей презентации',
    descriptionUz: 'Ishontiruvchi taqdimot tuzilishi',
    icon: '🎯',
    color: '#EC4899',
    stepsRange: [76, 90]
  },
  {
    id: 7,
    title: 'Работа с возражениями',
    titleUz: 'E\'tirozlar bilan ishlash',
    description: 'Техники преодоления возражений клиентов',
    descriptionUz: 'Mijoz e\'tirozlarini bartaraf etish texnikalari',
    icon: '💬',
    color: '#14B8A6',
    stepsRange: [91, 100]
  }
];

// ===========================================
// ВСЕ 100 ШАГОВ КУРСА
// ===========================================

export const steps: Step[] = [
  // ===== МОДУЛЬ 1: ПОРТРЕТ ТП (1-15) =====
  {
    id: 1,
    moduleId: 1,
    title: 'Добро пожаловать в N\'Medov!',
    titleUz: 'N\'Medov-ga xush kelibsiz!',
    type: 'video',
    duration: 3,
    content: `# Добро пожаловать в команду N'Medov!

Вы стали частью одной из ведущих дистрибьюторских компаний Узбекистана.

## Что вас ждёт в этом курсе:
- **100 шагов** к профессионализму
- Практические навыки продаж
- Секреты успешных торговых представителей

## Ваша цель:
Стать экспертом в продажах продукции N'Medov и помогать клиентам развивать их бизнес.

> 💡 Каждый шаг приближает вас к мастерству!`,
    contentUz: `# N'Medov jamoasiga xush kelibsiz!

Siz O'zbekistonning yetakchi distribyutor kompaniyalaridan birining a'zosi bo'ldingiz.

## Ushbu kursda sizni nima kutmoqda:
- Professionallikka **100 qadam**
- Amaliy sotuv ko'nikmalari
- Muvaffaqiyatli savdo vakillarining sirlari

## Sizning maqsadingiz:
N'Medov mahsulotlarini sotish bo'yicha mutaxassis bo'lish va mijozlarga bizneslarini rivojlantirishda yordam berish.

> 💡 Har bir qadam sizni mahoratga yaqinlashtiradi!`,
    videoUrl: 'https://youtu.be/Ap2wtBlZgXw',
    points: 10,
    badge: {
      id: 'first_step',
      icon: '🎉',
      title: 'Первый шаг',
      titleUz: 'Birinchi qadam',
      description: 'Начал обучение'
    }
  },
  {
    id: 2,
    moduleId: 1,
    title: 'Кто такой торговый представитель?',
    titleUz: 'Savdo vakili kim?',
    type: 'theory',
    duration: 5,
    content: `# Роль торгового представителя

**Торговый представитель** — это лицо компании в торговых точках. Вы — связующее звено между производителем и розницей.

## Ваши основные функции:
1. **Продажи** — увеличение объёмов и ассортимента
2. **Мерчандайзинг** — правильная выкладка товара
3. **Консультирование** — помощь клиентам
4. **Сбор информации** — анализ рынка

## Формула успеха ТП:
\`Успех = Знания × Навыки × Мотивация\`

Все три компонента важны!`,
    contentUz: `# Savdo vakilining roli

**Savdo vakili** — bu savdo nuqtalarida kompaniyaning yuzi. Siz ishlab chiqaruvchi va chakana savdo o'rtasidagi bog'lovchi halqasiz.

## Sizning asosiy vazifalaringiz:
1. **Sotuvlar** — hajm va assortimentni oshirish
2. **Merchandayzing** — mahsulotni to'g'ri joylashtirish
3. **Maslahat berish** — mijozlarga yordam
4. **Ma'lumot yig'ish** — bozor tahlili

## Savdo vakili muvaffaqiyat formulasi:
\`Muvaffaqiyat = Bilim × Ko'nikmalar × Motivatsiya\`

Uchala komponent ham muhim!`,
    points: 10,
    quiz: [
      {
        id: 1,
        question: 'Что является главной задачей торгового представителя?',
        questionUz: 'Savdo vakilining asosiy vazifasi nima?',
        options: [
          'Только доставка товара',
          'Быть связующим звеном между производителем и розницей',
          'Только сбор денег',
          'Только заполнение документов'
        ],
        optionsUz: [
          'Faqat mahsulot yetkazish',
          'Ishlab chiqaruvchi va chakana savdo o\'rtasida bog\'lovchi bo\'lish',
          'Faqat pul yig\'ish',
          'Faqat hujjatlarni to\'ldirish'
        ],
        correctAnswer: 1,
        explanation: 'ТП — это представитель компании, который выполняет множество функций.'
      }
    ]
  },
  {
    id: 3,
    moduleId: 1,
    title: '7 качеств успешного ТП',
    titleUz: 'Muvaffaqiyatli savdo vakilining 7 fazilati',
    type: 'theory',
    duration: 5,
    content: `# 7 качеств успешного торгового представителя

## 1. 🎯 Целеустремлённость
Чёткое понимание своих целей и настойчивость в их достижении.

## 2. 💬 Коммуникабельность
Умение находить общий язык с любым клиентом.

## 3. 📚 Экспертность
Глубокое знание продукта и рынка.

## 4. 🔄 Адаптивность
Способность быстро реагировать на изменения.

## 5. ⏰ Организованность
Эффективное управление временем и маршрутом.

## 6. 💪 Стрессоустойчивость
Спокойствие в сложных ситуациях.

## 7. 🤝 Надёжность
Выполнение обещаний и соблюдение договорённостей.`,
    contentUz: `# Muvaffaqiyatli savdo vakilining 7 fazilati

## 1. 🎯 Maqsadga intilish
O'z maqsadlarini aniq tushunish va ularga erishishda qat'iyatlilik.

## 2. 💬 Muloqotga layoqatlilik
Har qanday mijoz bilan til topish qobiliyati.

## 3. 📚 Ekspertlik
Mahsulot va bozorni chuqur bilish.

## 4. 🔄 Moslashuvchanlik
O'zgarishlarga tez javob berish qobiliyati.

## 5. ⏰ Tartiblilik
Vaqt va marshrutni samarali boshqarish.

## 6. 💪 Stressga chidamlilik
Murakkab vaziyatlarda xotirjamlik.

## 7. 🤝 Ishonchlilik
Va'dalarni bajarish va kelishuvlarga rioya qilish.`,
    points: 10
  },
  {
    id: 4,
    moduleId: 1,
    title: 'Тест: Качества ТП',
    titleUz: 'Test: Savdo vakili fazilatlari',
    type: 'quiz',
    duration: 3,
    content: 'Проверьте своё понимание качеств успешного торгового представителя.',
    contentUz: 'Muvaffaqiyatli savdo vakili fazilatlarini tushunganingizni tekshiring.',
    points: 15,
    quiz: [
      {
        id: 1,
        question: 'Какое качество помогает ТП справляться с отказами?',
        questionUz: 'Qaysi fazilar savdo vakiliga rad javoblarini engishda yordam beradi?',
        options: ['Экспертность', 'Стрессоустойчивость', 'Организованность', 'Адаптивность'],
        optionsUz: ['Ekspertlik', 'Stressga chidamlilik', 'Tartiblilik', 'Moslashuvchanlik'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Что означает "экспертность" для ТП?',
        questionUz: 'Savdo vakili uchun "ekspertlik" nimani anglatadi?',
        options: ['Умение быстро считать', 'Знание продукта и рынка', 'Физическая выносливость', 'Красивая речь'],
        optionsUz: ['Tez hisoblash qobiliyati', 'Mahsulot va bozorni bilish', 'Jismoniy chidamlilik', 'Chiroyli nutq'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Почему важна организованность?',
        questionUz: 'Nima uchun tartiblilik muhim?',
        options: ['Чтобы красиво выглядеть', 'Для эффективного управления временем и маршрутом', 'Чтобы нравиться руководству', 'Для получения бонусов'],
        optionsUz: ['Chiroyli ko\'rinish uchun', 'Vaqt va marshrutni samarali boshqarish uchun', 'Rahbariyatga yoqish uchun', 'Bonus olish uchun'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 5,
    moduleId: 1,
    title: 'Ваш рабочий день',
    titleUz: 'Sizning ish kuningiz',
    type: 'theory',
    duration: 5,
    content: `# Типичный день торгового представителя

## 🌅 Утро (8:00-9:00)
- Проверка задач на день
- Планирование маршрута
- Подготовка материалов

## 🏃 Визиты (9:00-17:00)
- 10-15 визитов в день
- Работа по стандарту 8 шагов
- Фиксация результатов

## 🏠 Завершение (17:00-18:00)
- Отчётность
- Анализ дня
- Планирование на завтра

## ⚡ Секрет эффективности:
> Готовься вечером — экономь утро!`,
    contentUz: `# Savdo vakilining odatiy kuni

## 🌅 Ertalab (8:00-9:00)
- Kunlik vazifalarni tekshirish
- Marshrutni rejalashtirish
- Materiallarni tayyorlash

## 🏃 Tashriflar (9:00-17:00)
- Kuniga 10-15 tashrif
- 8 qadam standarti bo'yicha ishlash
- Natijalarni qayd etish

## 🏠 Yakunlash (17:00-18:00)
- Hisobot
- Kunni tahlil qilish
- Ertaga rejalashtirish

## ⚡ Samaradorlik siri:
> Kechqurun tayyorlaning — ertalab vaqt tejang!`,
    points: 10
  },
  {
    id: 6,
    moduleId: 1,
    title: 'Продукция N\'Medov',
    titleUz: 'N\'Medov mahsulotlari',
    type: 'theory',
    duration: 7,
    content: `# Ассортимент N'Medov

## 🍫 Шоколадная паста
- **Chococream** — классическая шоколадная паста
- **Chocotella** — с лесным орехом

## 🍜 Лапша быстрого приготовления
- Разные вкусы и форматы
- Удобная упаковка

## 🍪 Печенье и вафли
- Широкий ассортимент
- Разные ценовые сегменты

## 🍫 Батончики
- Энергетические
- Шоколадные

> 💡 Знание продукта = Уверенность в продажах`,
    contentUz: `# N'Medov assortimenti

## 🍫 Shokolad pastasi
- **Chococream** — klassik shokolad pastasi
- **Chocotella** — o'rmon yong'og'i bilan

## 🍜 Tez tayyorlanadigan lag'mon
- Turli ta'mlar va formatlar
- Qulay qadoq

## 🍪 Pechene va vafllar
- Keng assortiment
- Turli narx segmentlari

## 🍫 Batonchiklar
- Energetik
- Shokoladli

> 💡 Mahsulotni bilish = Sotuvda ishonch`,
    points: 10
  },
  {
    id: 7,
    moduleId: 1,
    title: 'Практика: Изучите продукт',
    titleUz: 'Amaliyot: Mahsulotni o\'rganing',
    type: 'practice',
    duration: 10,
    content: `# Практическое задание

Изучите продукцию N'Medov на практике.

## Задание:
1. Возьмите образцы 3-х разных продуктов
2. Изучите состав и упаковку
3. Попробуйте продукт
4. Запишите 3 преимущества каждого`,
    contentUz: `# Amaliy topshiriq

N'Medov mahsulotlarini amalda o'rganing.

## Topshiriq:
1. 3 xil mahsulot namunasini oling
2. Tarkib va qadoqni o'rganing
3. Mahsulotni tatib ko'ring
4. Har birining 3 ta afzalligini yozing`,
    points: 20,
    practice: {
      instruction: 'Изучите 3 продукта N\'Medov и запишите их преимущества',
      instructionUz: '3 ta N\'Medov mahsulotini o\'rganing va ularning afzalliklarini yozing',
      checkpoints: ['Изучен Chococream', 'Изучена лапша', 'Изучено печенье'],
      checkpointsUz: ['Chococream o\'rganildi', 'Lag\'mon o\'rganildi', 'Pechene o\'rganildi']
    }
  },
  {
    id: 8,
    moduleId: 1,
    title: 'Конкуренты на рынке',
    titleUz: 'Bozordagi raqobatchilar',
    type: 'theory',
    duration: 5,
    content: `# Знай своих конкурентов

## Почему это важно?
- Клиенты сравнивают
- Нужны аргументы для продажи
- Понимание рынка

## Основные конкуренты:
| Категория | Конкуренты |
|-----------|------------|
| Шоколадная паста | Nutella, местные бренды |
| Лапша | Maggi, Rollton, BigBon |
| Печенье | Orion, местные производители |

## Наши преимущества:
✅ Локальное производство
✅ Свежесть продукции
✅ Адаптация под местный вкус
✅ Конкурентные цены`,
    contentUz: `# Raqobatchilaringizni biling

## Nima uchun bu muhim?
- Mijozlar taqqoslaydi
- Sotish uchun argumentlar kerak
- Bozorni tushunish

## Asosiy raqobatchilar:
| Kategoriya | Raqobatchilar |
|-----------|------------|
| Shokolad pastasi | Nutella, mahalliy brendlar |
| Lag'mon | Maggi, Rollton, BigBon |
| Pechene | Orion, mahalliy ishlab chiqaruvchilar |

## Bizning afzalliklarimiz:
✅ Mahalliy ishlab chiqarish
✅ Mahsulot yangiligi
✅ Mahalliy ta'mga moslashuv
✅ Raqobatbardosh narxlar`,
    points: 10
  },
  {
    id: 9,
    moduleId: 1,
    title: 'Целевые клиенты',
    titleUz: 'Maqsadli mijozlar',
    type: 'theory',
    duration: 5,
    content: `# Типы торговых точек

## 🏪 Традиционная розница
- Магазины у дома
- Киоски
- Небольшие супермаркеты

## 🏬 Современная розница
- Сетевые супермаркеты
- Гипермаркеты

## 🍽️ HoReCa
- Кафе
- Рестораны
- Столовые

## 📊 Приоритеты:
1. Высокий трафик
2. Целевая аудитория
3. Потенциал роста`,
    contentUz: `# Savdo nuqtalari turlari

## 🏪 An'anaviy chakana savdo
- Uy yonidagi do'konlar
- Kiosklar
- Kichik supermarketlar

## 🏬 Zamonaviy chakana savdo
- Tarmoq supermarketlari
- Gipermarketlar

## 🍽️ HoReCa
- Kafelar
- Restoranlar
- Oshxonalar

## 📊 Ustuvorliklar:
1. Yuqori trafik
2. Maqsadli auditoriya
3. O'sish salohiyati`,
    points: 10
  },
  {
    id: 10,
    moduleId: 1,
    title: 'Тест: Знание рынка',
    titleUz: 'Test: Bozorni bilish',
    type: 'quiz',
    duration: 5,
    content: 'Проверьте своё знание продуктов и рынка.',
    contentUz: 'Mahsulotlar va bozorni bilishingizni tekshiring.',
    points: 20,
    quiz: [
      {
        id: 1,
        question: 'Какой продукт N\'Medov содержит лесной орех?',
        questionUz: 'N\'Medov ning qaysi mahsulotida o\'rmon yong\'og\'i bor?',
        options: ['Chococream', 'Chocotella', 'Лапша', 'Печенье'],
        optionsUz: ['Chococream', 'Chocotella', 'Lag\'mon', 'Pechene'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Какое преимущество даёт локальное производство?',
        questionUz: 'Mahalliy ishlab chiqarish qanday afzallik beradi?',
        options: ['Только низкая цена', 'Свежесть продукции и адаптация под местный вкус', 'Только красивая упаковка', 'Только большой объём'],
        optionsUz: ['Faqat past narx', 'Mahsulot yangiligi va mahalliy ta\'mga moslashuv', 'Faqat chiroyli qadoq', 'Faqat katta hajm'],
        correctAnswer: 1
      }
    ],
    badge: {
      id: 'product_expert_1',
      icon: '🎓',
      title: 'Знаток продукта',
      titleUz: 'Mahsulot bilimdon',
      description: 'Изучил базовый ассортимент'
    }
  },
  {
    id: 11,
    moduleId: 1,
    title: 'KPI торгового представителя',
    titleUz: 'Savdo vakilining KPI ko\'rsatkichlari',
    type: 'theory',
    duration: 5,
    content: `# Ключевые показатели эффективности

## 📊 Основные KPI:

### 1. Дистрибуция
- % покрытия территории
- Количество активных ТТ

### 2. Продажи
- Выполнение плана (сум)
- Количество SKU

### 3. Мерчандайзинг
- Доля полки
- Качество выкладки

### 4. Визиты
- Количество визитов
- Эффективность визита

## 🎯 Формула оценки:
\`Бонус = База × (KPI₁ + KPI₂ + KPI₃) / 100\``,
    contentUz: `# Asosiy samaradorlik ko'rsatkichlari

## 📊 Asosiy KPI:

### 1. Distribyutsiya
- Hududni qamrab olish %
- Faol savdo nuqtalari soni

### 2. Sotuvlar
- Rejani bajarish (so'm)
- SKU soni

### 3. Merchandayzing
- Javon ulushi
- Joylashtirish sifati

### 4. Tashriflar
- Tashriflar soni
- Tashrif samaradorligi

## 🎯 Baholash formulasi:
\`Bonus = Baza × (KPI₁ + KPI₂ + KPI₃) / 100\``,
    points: 10
  },
  {
    id: 12,
    moduleId: 1,
    title: 'Планирование маршрута',
    titleUz: 'Marshrutni rejalashtirish',
    type: 'theory',
    duration: 5,
    content: `# Эффективное планирование маршрута

## 🗺️ Принципы построения:

### 1. Географическая логика
- Минимум возвратов
- Оптимальное время в пути

### 2. Приоритеты
- VIP клиенты — утром
- Новые точки — в середине дня
- Проблемные — когда есть время

### 3. Временные окна
- Учитывайте часы работы ТТ
- Избегайте часов пик

## ⚡ Лайфхак:
> Планируй маршрут вечером, когда голова свежая!`,
    contentUz: `# Marshrutni samarali rejalashtirish

## 🗺️ Qurish tamoyillari:

### 1. Geografik mantiq
- Minimal qaytishlar
- Optimal yo'l vaqti

### 2. Ustuvorliklar
- VIP mijozlar — ertalab
- Yangi nuqtalar — kun o'rtasida
- Muammoli — vaqt bo'lganda

### 3. Vaqt oynalari
- Savdo nuqtalarining ish vaqtini hisobga oling
- Pik soatlardan saqlaning

## ⚡ Maslahat:
> Marshrutni kechqurun rejalashtiring — bosh tinch bo'lganda!`,
    points: 10
  },
  {
    id: 13,
    moduleId: 1,
    title: 'Инструменты работы',
    titleUz: 'Ish vositalari',
    type: 'theory',
    duration: 5,
    content: `# Что нужно торговому представителю

## 📱 Цифровые инструменты:
- Смартфон с приложением
- Доступ к CRM
- Калькулятор

## 📋 Материалы:
- Каталог продукции
- Прайс-лист
- POS-материалы
- Образцы продукции

## 🎒 Что всегда с собой:
- Планшет/телефон
- Визитки
- Ручка и блокнот
- Ценники

## ✅ Чек-лист перед выходом:
□ Телефон заряжен
□ Материалы собраны
□ Маршрут спланирован
□ Цели на день ясны`,
    contentUz: `# Savdo vakiliga nima kerak

## 📱 Raqamli vositalar:
- Ilova bilan smartfon
- CRM ga kirish
- Kalkulyator

## 📋 Materiallar:
- Mahsulot katalogi
- Narx ro'yxati
- POS-materiallar
- Mahsulot namunalari

## 🎒 Doim o'zingiz bilan:
- Planshet/telefon
- Vizit kartalari
- Ruchka va bloknot
- Narx belgilari

## ✅ Chiqishdan oldingi chek-list:
□ Telefon zaryad
□ Materiallar yig'ilgan
□ Marshrut rejalashtirilgan
□ Kunlik maqsadlar aniq`,
    points: 10
  },
  {
    id: 14,
    moduleId: 1,
    title: 'Практика: Подготовка к работе',
    titleUz: 'Amaliyot: Ishga tayyorgarlik',
    type: 'practice',
    duration: 10,
    content: `# Практическое задание

Подготовьтесь к рабочему дню как профессионал.

## Задание:
1. Соберите рабочую сумку по чек-листу
2. Проверьте наличие всех материалов
3. Спланируйте маршрут на завтра
4. Сфотографируйте готовый набор`,
    contentUz: `# Amaliy topshiriq

Professional sifatida ish kuniga tayyorlaning.

## Topshiriq:
1. Chek-list bo'yicha ish sumkasini yig'ing
2. Barcha materiallarning mavjudligini tekshiring
3. Ertaga uchun marshrutni rejalashtiring
4. Tayyor to'plamni suratga oling`,
    points: 20,
    practice: {
      instruction: 'Соберите рабочую сумку и спланируйте маршрут',
      instructionUz: 'Ish sumkasini yig\'ing va marshrutni rejalashtiring',
      checkpoints: ['Сумка собрана', 'Материалы проверены', 'Маршрут спланирован'],
      checkpointsUz: ['Sumka yig\'ildi', 'Materiallar tekshirildi', 'Marshrut rejalashtirildi']
    }
  },
  {
    id: 15,
    moduleId: 1,
    title: 'Итоговый тест модуля 1',
    titleUz: '1-modul yakuniy testi',
    type: 'quiz',
    duration: 7,
    content: 'Проверьте свои знания по модулю "Портрет торгового представителя".',
    contentUz: '"Savdo vakili portrati" moduli bo\'yicha bilimlaringizni tekshiring.',
    points: 30,
    quiz: [
      {
        id: 1,
        question: 'Сколько качеств успешного ТП мы изучили?',
        questionUz: 'Muvaffaqiyatli savdo vakilining nechta fazilatini o\'rgandik?',
        options: ['5', '6', '7', '8'],
        optionsUz: ['5', '6', '7', '8'],
        correctAnswer: 2
      },
      {
        id: 2,
        question: 'Что входит в формулу успеха ТП?',
        questionUz: 'Savdo vakili muvaffaqiyat formulasiga nima kiradi?',
        options: ['Знания, Навыки, Мотивация', 'Деньги, Время, Связи', 'Удача, Харизма, Опыт', 'Скорость, Сила, Ловкость'],
        optionsUz: ['Bilim, Ko\'nikmalar, Motivatsiya', 'Pul, Vaqt, Aloqalar', 'Omad, Xarizma, Tajriba', 'Tezlik, Kuch, Epchillik'],
        correctAnswer: 0
      },
      {
        id: 3,
        question: 'Сколько визитов в день должен совершать ТП?',
        questionUz: 'Savdo vakili kuniga nechta tashrif qilishi kerak?',
        options: ['5-7', '10-15', '20-25', '30+'],
        optionsUz: ['5-7', '10-15', '20-25', '30+'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Когда лучше планировать маршрут?',
        questionUz: 'Marshrutni qachon rejalashtirish yaxshiroq?',
        options: ['Утром', 'В обед', 'Вечером накануне', 'Не нужно планировать'],
        optionsUz: ['Ertalab', 'Tushlikda', 'Oldingi kuni kechqurun', 'Rejalashtirish kerak emas'],
        correctAnswer: 2
      },
      {
        id: 5,
        question: 'Какой тип клиентов нужно посещать утром?',
        questionUz: 'Ertalab qaysi turdagi mijozlarni ziyorat qilish kerak?',
        options: ['Новые точки', 'VIP клиенты', 'Проблемные точки', 'Любые'],
        optionsUz: ['Yangi nuqtalar', 'VIP mijozlar', 'Muammoli nuqtalar', 'Har qanday'],
        correctAnswer: 1
      }
    ],
    badge: {
      id: 'module_1_complete',
      icon: '🏆',
      title: 'Модуль 1 пройден',
      titleUz: '1-modul o\'tildi',
      description: 'Освоил основы профессии ТП'
    }
  },

  // ===== МОДУЛЬ 2: ДИСТРИБУЦИЯ (16-30) =====
  {
    id: 16,
    moduleId: 2,
    title: 'Введение в DSPM',
    titleUz: 'DSPM-ga kirish',
    type: 'video',
    duration: 5,
    content: `# DSPM — фундамент успеха

## Что такое DSPM?

**D** — Distribution (Дистрибуция)
**S** — Shelving (Выкладка)
**P** — Pricing (Ценообразование)
**M** — Merchandising (Мерчандайзинг)

## Почему это важно?

DSPM — это системный подход к работе с торговой точкой.

> 💡 Без DSPM продажи — случайность. С DSPM — система!`,
    contentUz: `# DSPM — muvaffaqiyat poydevori

## DSPM nima?

**D** — Distribution (Distribyutsiya)
**S** — Shelving (Joylashtirish)
**P** — Pricing (Narxlash)
**M** — Merchandising (Merchandayzing)

## Nima uchun bu muhim?

DSPM — bu savdo nuqtasi bilan ishlashga tizimli yondashuv.

> 💡 DSPM-siz sotuvlar — tasodif. DSPM bilan — tizim!`,
    videoUrl: 'https://youtu.be/cGLbxO4OkHk',
    points: 10
  },
  {
    id: 17,
    moduleId: 2,
    title: 'Что такое дистрибуция?',
    titleUz: 'Distribyutsiya nima?',
    type: 'theory',
    duration: 5,
    content: `# Distribution — Дистрибуция

## Определение:
**Дистрибуция** — это обеспечение присутствия нужного товара в нужном месте в нужное время.

## Ключевые понятия:

### Числовая дистрибуция
% торговых точек, где есть наш товар

### Взвешенная дистрибуция
% продаж через точки с нашим товаром

### SKU (Stock Keeping Unit)
Единица ассортимента

## Формула:
\`Дистрибуция = (ТТ с товаром / Всего ТТ) × 100%\``,
    contentUz: `# Distribution — Distribyutsiya

## Ta'rif:
**Distribyutsiya** — bu kerakli mahsulotning kerakli joyda kerakli vaqtda mavjudligini ta'minlash.

## Asosiy tushunchalar:

### Sonli distribyutsiya
Bizning mahsulotimiz bo'lgan savdo nuqtalari %

### Og'irlikli distribyutsiya
Bizning mahsulotimiz bo'lgan nuqtalar orqali sotuvlar %

### SKU (Stock Keeping Unit)
Assortiment birligi

## Formula:
\`Distribyutsiya = (Mahsulotli TN / Jami TN) × 100%\``,
    points: 10
  },
  {
    id: 18,
    moduleId: 2,
    title: 'Уровни дистрибуции',
    titleUz: 'Distribyutsiya darajalari',
    type: 'theory',
    duration: 5,
    content: `# Три уровня дистрибуции

## 🥉 Базовый уровень (Must Have)
Минимальный набор SKU для любой точки:
- Chococream 350г
- Лапша (топ-вкус)
- Печенье (топ-SKU)

## 🥈 Стандартный уровень
Расширенный ассортимент:
- Базовый + Chocotella
- 3-4 вкуса лапши
- 2-3 вида печенья

## 🥇 Премиум уровень
Полный ассортимент:
- Все SKU компании
- Новинки первыми
- Промо-упаковки

## 📊 Цель: 
Поднять каждую ТТ на уровень выше!`,
    contentUz: `# Distribyutsiyaning uch darajasi

## 🥉 Asosiy daraja (Must Have)
Har qanday nuqta uchun minimal SKU to'plami:
- Chococream 350g
- Lag'mon (top-ta'm)
- Pechene (top-SKU)

## 🥈 Standart daraja
Kengaytirilgan assortiment:
- Asosiy + Chocotella
- 3-4 ta'm lag'mon
- 2-3 turdagi pechene

## 🥇 Premium daraja
To'liq assortiment:
- Kompaniyaning barcha SKU
- Yangi mahsulotlar birinchi
- Promo-qadoqlar

## 📊 Maqsad: 
Har bir savdo nuqtasini yuqori darajaga ko'tarish!`,
    points: 10
  },
  {
    id: 19,
    moduleId: 2,
    title: 'Матрица ассортимента',
    titleUz: 'Assortiment matritsasi',
    type: 'theory',
    duration: 7,
    content: `# Ассортиментная матрица по типам ТТ

## 🏪 Магазин у дома (до 50м²)
| Категория | SKU | Приоритет |
|-----------|-----|-----------|
| Паста | 2 | Высокий |
| Лапша | 3-4 | Высокий |
| Печенье | 2-3 | Средний |

## 🏬 Мини-маркет (50-150м²)
| Категория | SKU | Приоритет |
|-----------|-----|-----------|
| Паста | 3-4 | Высокий |
| Лапша | 5-6 | Высокий |
| Печенье | 4-5 | Высокий |

## 🛒 Супермаркет (150м²+)
Весь ассортимент + промо

> 💡 Не пытайтесь продать всё везде!`,
    contentUz: `# Savdo nuqtasi turlari bo'yicha assortiment matritsasi

## 🏪 Uy yonidagi do'kon (50m² gacha)
| Kategoriya | SKU | Ustuvorlik |
|-----------|-----|-----------|
| Pasta | 2 | Yuqori |
| Lag'mon | 3-4 | Yuqori |
| Pechene | 2-3 | O'rtacha |

## 🏬 Mini-market (50-150m²)
| Kategoriya | SKU | Ustuvorlik |
|-----------|-----|-----------|
| Pasta | 3-4 | Yuqori |
| Lag'mon | 5-6 | Yuqori |
| Pechene | 4-5 | Yuqori |

## 🛒 Supermarket (150m²+)
To'liq assortiment + promo

> 💡 Hamma joyda hammani sotishga urinmang!`,
    points: 15
  },
  {
    id: 20,
    moduleId: 2,
    title: 'Тест: Основы дистрибуции',
    titleUz: 'Test: Distribyutsiya asoslari',
    type: 'quiz',
    duration: 5,
    content: 'Проверьте понимание основ дистрибуции.',
    contentUz: 'Distribyutsiya asoslarini tushunganingizni tekshiring.',
    points: 15,
    quiz: [
      {
        id: 1,
        question: 'Что показывает числовая дистрибуция?',
        questionUz: 'Sonli distribyutsiya nimani ko\'rsatadi?',
        options: ['Объём продаж', '% точек с нашим товаром', 'Количество SKU', 'Прибыль'],
        optionsUz: ['Sotuv hajmi', 'Bizning mahsulotimiz bilan nuqtalar %', 'SKU soni', 'Foyda'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Что такое SKU?',
        questionUz: 'SKU nima?',
        options: ['Название компании', 'Единица ассортимента', 'Тип магазина', 'Вид скидки'],
        optionsUz: ['Kompaniya nomi', 'Assortiment birligi', 'Do\'kon turi', 'Chegirma turi'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Какой уровень должен быть в любой точке?',
        questionUz: 'Har qanday nuqtada qaysi daraja bo\'lishi kerak?',
        options: ['Премиум', 'Стандартный', 'Базовый (Must Have)', 'Любой'],
        optionsUz: ['Premium', 'Standart', 'Asosiy (Must Have)', 'Har qanday'],
        correctAnswer: 2
      }
    ]
  },
  // Продолжение модуля 2 (шаги 21-30)
  {
    id: 21,
    moduleId: 2,
    title: 'Аудит дистрибуции',
    titleUz: 'Distribyutsiya auditi',
    type: 'theory',
    duration: 5,
    content: `# Как проводить аудит дистрибуции

## 🔍 Что проверяем:

### 1. Наличие товара
- Есть ли наш товар?
- Какие SKU представлены?
- Есть ли out-of-stock?

### 2. Количество
- Достаточно ли запаса?
- Нужен ли дозаказ?

### 3. Качество
- Срок годности
- Состояние упаковки
- Товарный вид

## 📋 Чек-лист аудита:
□ Проверил наличие всех SKU
□ Записал out-of-stock
□ Проверил сроки годности
□ Оценил запас
□ Сделал фото полки`,
    contentUz: `# Distribyutsiya auditini qanday o'tkazish

## 🔍 Nimani tekshiramiz:

### 1. Mahsulot mavjudligi
- Bizning mahsulotimiz bormi?
- Qaysi SKU taqdim etilgan?
- Out-of-stock bormi?

### 2. Miqdor
- Zaxira yetarlimi?
- Qo'shimcha buyurtma kerakmi?

### 3. Sifat
- Yaroqlilik muddati
- Qadoq holati
- Tovar ko'rinishi

## 📋 Audit chek-listi:
□ Barcha SKU mavjudligini tekshirdim
□ Out-of-stock yozdim
□ Yaroqlilik muddatlarini tekshirdim
□ Zaxirani baholadim
□ Javon suratini oldim`,
    points: 10
  },
  {
    id: 22,
    moduleId: 2,
    title: 'Out-of-Stock: Враг №1',
    titleUz: 'Out-of-Stock: №1 dushman',
    type: 'theory',
    duration: 5,
    content: `# Out-of-Stock (OOS) — потеря продаж

## ❌ Что такое OOS?
Ситуация, когда товар отсутствует на полке.

## 📉 Последствия OOS:
- Потеря 40% покупателей навсегда
- Переключение на конкурента
- Недовольство клиента
- Снижение доверия к бренду

## 🔍 Причины OOS:
1. Неправильный заказ
2. Задержка поставки
3. Плохая ротация
4. Сезонный спрос

## ✅ Как бороться:
- Регулярные визиты
- Правильное прогнозирование
- Страховой запас
- Быстрая реакция`,
    contentUz: `# Out-of-Stock (OOS) — sotuvlarni yo'qotish

## ❌ OOS nima?
Mahsulot javonda yo'q bo'lgan vaziyat.

## 📉 OOS oqibatlari:
- Xaridorlarning 40% ini abadiy yo'qotish
- Raqobatchiga o'tish
- Mijoz noroziligi
- Brendga ishonchning pasayishi

## 🔍 OOS sabablari:
1. Noto'g'ri buyurtma
2. Yetkazib berishning kechikishi
3. Yomon rotatsiya
4. Mavsumiy talab

## ✅ Qanday kurashish:
- Muntazam tashriflar
- To'g'ri prognozlash
- Sug'urta zaxirasi
- Tez reaktsiya`,
    points: 10
  },
  {
    id: 23,
    moduleId: 2,
    title: 'Расчёт заказа',
    titleUz: 'Buyurtmani hisoblash',
    type: 'theory',
    duration: 7,
    content: `# Формула оптимального заказа

## 📊 Базовая формула:
\`Заказ = (Средние продажи × Дни до визита) + Страховой запас - Остаток\`

## Пример:
- Продажи Chococream: 5 шт/день
- До следующего визита: 7 дней
- Страховой запас: 20%
- Остаток на полке: 10 шт

\`Заказ = (5 × 7) + 7 - 10 = 35 + 7 - 10 = 32 шт\`

## 💡 Советы:
- Учитывайте сезонность
- Смотрите тренд продаж
- Общайтесь с продавцом`,
    contentUz: `# Optimal buyurtma formulasi

## 📊 Asosiy formula:
\`Buyurtma = (O'rtacha sotuvlar × Tashrifgacha kunlar) + Sug'urta zaxirasi - Qoldiq\`

## Misol:
- Chococream sotuvlari: 5 dona/kun
- Keyingi tashrifgacha: 7 kun
- Sug'urta zaxirasi: 20%
- Javondagi qoldiq: 10 dona

\`Buyurtma = (5 × 7) + 7 - 10 = 35 + 7 - 10 = 32 dona\`

## 💡 Maslahatlar:
- Mavsumiylikni hisobga oling
- Sotuv trendiga qarang
- Sotuvchi bilan gaplashing`,
    points: 15
  },
  {
    id: 24,
    moduleId: 2,
    title: 'Практика: Расчёт заказа',
    titleUz: 'Amaliyot: Buyurtma hisoblash',
    type: 'practice',
    duration: 10,
    content: `# Практическое задание

Рассчитайте заказ для торговой точки.

## Исходные данные:
- Лапша "Курица": продажи 8 шт/день
- До визита: 5 дней
- Страховой запас: 15%
- Остаток: 12 шт

## Задание:
1. Примените формулу
2. Рассчитайте заказ
3. Округлите до упаковки (по 12 шт)`,
    contentUz: `# Amaliy topshiriq

Savdo nuqtasi uchun buyurtmani hisoblang.

## Dastlabki ma'lumotlar:
- "Tovuq" lag'mon: sotuvlar 8 dona/kun
- Tashrifgacha: 5 kun
- Sug'urta zaxirasi: 15%
- Qoldiq: 12 dona

## Topshiriq:
1. Formulani qo'llang
2. Buyurtmani hisoblang
3. Qadoqqa yaxlitlang (12 donadan)`,
    points: 20,
    practice: {
      instruction: 'Рассчитайте оптимальный заказ по формуле',
      instructionUz: 'Formula bo\'yicha optimal buyurtmani hisoblang',
      checkpoints: ['Формула применена', 'Расчёт выполнен', 'Округление сделано'],
      checkpointsUz: ['Formula qo\'llandi', 'Hisoblash bajarildi', 'Yaxlitlash qilindi']
    }
  },
  {
    id: 25,
    moduleId: 2,
    title: 'Работа с новой ТТ',
    titleUz: 'Yangi TN bilan ishlash',
    type: 'theory',
    duration: 5,
    content: `# Открытие новой торговой точки

## 🎯 Цель первого визита:
Начать сотрудничество с базовым ассортиментом.

## 📋 Алгоритм:

### 1. Разведка
- Оцените потенциал
- Изучите конкурентов
- Определите ЛПР

### 2. Первый контакт
- Представьтесь
- Кратко о компании
- Предложите сотрудничество

### 3. Презентация
- Базовый ассортимент
- Условия работы
- Выгоды для ТТ

### 4. Закрытие
- Первый заказ
- Договорённость о выкладке`,
    contentUz: `# Yangi savdo nuqtasini ochish

## 🎯 Birinchi tashrif maqsadi:
Asosiy assortiment bilan hamkorlikni boshlash.

## 📋 Algoritm:

### 1. Razvedka
- Salohiyatni baholang
- Raqobatchilarni o'rganing
- Qaror qabul qiluvchini aniqlang

### 2. Birinchi aloqa
- O'zingizni tanishtiring
- Kompaniya haqida qisqacha
- Hamkorlik taklif qiling

### 3. Taqdimot
- Asosiy assortiment
- Ishlash shartlari
- TN uchun foydalar

### 4. Yakunlash
- Birinchi buyurtma
- Joylashtirish haqida kelishuv`,
    points: 10
  },
  {
    id: 26,
    moduleId: 2,
    title: 'Аргументы для новой ТТ',
    titleUz: 'Yangi TN uchun argumentlar',
    type: 'theory',
    duration: 5,
    content: `# Почему ТТ выгодно работать с N'Medov

## 💰 Финансовые выгоды:
- Конкурентные цены
- Гибкие условия оплаты
- Маржинальность 15-25%
- Бонусные программы

## 📦 Сервис:
- Регулярные поставки
- Минимальный заказ доступен
- Поддержка мерчандайзинга
- Обмен просрочки

## 📈 Маркетинг:
- Рекламная поддержка
- POS-материалы
- Промо-акции
- Новинки первыми

## 🤝 Партнёрство:
- Персональный менеджер
- Обучение персонала
- Консультации`,
    contentUz: `# Nima uchun TN uchun N'Medov bilan ishlash foydali

## 💰 Moliyaviy foydalar:
- Raqobatbardosh narxlar
- Moslashuvchan to'lov shartlari
- 15-25% marja
- Bonus dasturlari

## 📦 Xizmat:
- Muntazam yetkazib berish
- Minimal buyurtma mavjud
- Merchandayzing qo'llab-quvvatlash
- Muddati o'tgan mahsulotlarni almashtirish

## 📈 Marketing:
- Reklama qo'llab-quvvatlash
- POS-materiallar
- Promo-aksiyalar
- Yangiliklar birinchi

## 🤝 Sheriklik:
- Shaxsiy menejer
- Xodimlarni o'qitish
- Maslahatlar`,
    points: 10
  },
  {
    id: 27,
    moduleId: 2,
    title: 'Тест: Работа с дистрибуцией',
    titleUz: 'Test: Distribyutsiya bilan ishlash',
    type: 'quiz',
    duration: 5,
    content: 'Проверьте знания по работе с дистрибуцией.',
    contentUz: 'Distribyutsiya bilan ishlash bo\'yicha bilimlaringizni tekshiring.',
    points: 20,
    quiz: [
      {
        id: 1,
        question: 'Что входит в формулу расчёта заказа?',
        questionUz: 'Buyurtma hisoblash formulasiga nima kiradi?',
        options: ['Только продажи', 'Продажи, дни, страховой запас, остаток', 'Только остаток', 'Цена и скидка'],
        optionsUz: ['Faqat sotuvlar', 'Sotuvlar, kunlar, sug\'urta zaxirasi, qoldiq', 'Faqat qoldiq', 'Narx va chegirma'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Сколько % покупателей теряем при OOS?',
        questionUz: 'OOS da xaridorlarning necha % ini yo\'qotamiz?',
        options: ['10%', '20%', '40%', '60%'],
        optionsUz: ['10%', '20%', '40%', '60%'],
        correctAnswer: 2
      }
    ]
  },
  {
    id: 28,
    moduleId: 2,
    title: 'Развитие существующей ТТ',
    titleUz: 'Mavjud TN ni rivojlantirish',
    type: 'theory',
    duration: 5,
    content: `# Как увеличить дистрибуцию в ТТ

## 📈 Стратегия расширения:

### Шаг 1: Анализ
- Что уже продаётся?
- Что продаётся у конкурентов?
- Какие категории пустуют?

### Шаг 2: Выбор SKU
- Начните с топ-продавцов
- Одна новинка за визит
- Логичное расширение

### Шаг 3: Аргументация
- "Этот продукт дополнит..."
- "Покупатели уже спрашивают..."
- "Маржа выше чем у..."

### Шаг 4: Поддержка
- Помогите с выкладкой
- Дайте POS-материалы
- Контролируйте продажи`,
    contentUz: `# TN da distribyutsiyani qanday oshirish

## 📈 Kengaytirish strategiyasi:

### 1-qadam: Tahlil
- Nima allaqachon sotilmoqda?
- Raqobatchilarda nima sotilmoqda?
- Qaysi kategoriyalar bo'sh?

### 2-qadam: SKU tanlash
- Top-sotuvchilardan boshlang
- Har tashrifda bitta yangilik
- Mantiqiy kengaytirish

### 3-qadam: Argumentatsiya
- "Bu mahsulot to'ldiradi..."
- "Xaridorlar allaqachon so'ramoqda..."
- "Marja yuqoriroq..."

### 4-qadam: Qo'llab-quvvatlash
- Joylashtirishda yordam bering
- POS-materiallar bering
- Sotuvlarni nazorat qiling`,
    points: 10
  },
  {
    id: 29,
    moduleId: 2,
    title: 'Кейс: Расширение ассортимента',
    titleUz: 'Keys: Assortimentni kengaytirish',
    type: 'case_study',
    duration: 10,
    content: `# Кейс: Магазин "Савдо"

## 📍 Ситуация:
Магазин у дома, 40м². Сейчас берёт только Chococream 350г.

## 📊 Данные:
- Продажи Chococream: 4 шт/неделю
- Конкуренты: Nutella (6 шт/неделю)
- Есть место на полке
- Владелец лоялен

## ❓ Вопросы:
1. Какой продукт предложить следующим?
2. Какие аргументы использовать?
3. Как поддержать продажи?`,
    contentUz: `# Keys: "Savdo" do'koni

## 📍 Vaziyat:
Uy yonidagi do'kon, 40m². Hozir faqat Chococream 350g oladi.

## 📊 Ma'lumotlar:
- Chococream sotuvlari: 4 dona/hafta
- Raqobatchilar: Nutella (6 dona/hafta)
- Javonda joy bor
- Egasi sodiq

## ❓ Savollar:
1. Keyingi qaysi mahsulotni taklif qilish kerak?
2. Qanday argumentlardan foydalanish kerak?
3. Sotuvlarni qanday qo'llab-quvvatlash kerak?`,
    points: 25,
    quiz: [
      {
        id: 1,
        question: 'Какой продукт логично предложить?',
        questionUz: 'Qaysi mahsulotni taklif qilish mantiqiy?',
        options: ['Лапшу 5 вкусов', 'Chocotella как альтернативу Nutella', 'Весь ассортимент', 'Промо-упаковку'],
        optionsUz: ['5 ta\'mli lag\'mon', 'Nutella ga alternativa sifatida Chocotella', 'To\'liq assortiment', 'Promo-qadoq'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 30,
    moduleId: 2,
    title: 'Итоговый тест: Дистрибуция',
    titleUz: 'Yakuniy test: Distribyutsiya',
    type: 'quiz',
    duration: 10,
    content: 'Комплексная проверка знаний по модулю "Дистрибуция".',
    contentUz: '"Distribyutsiya" moduli bo\'yicha kompleks bilim tekshiruvi.',
    points: 40,
    quiz: [
      {
        id: 1,
        question: 'Что означает D в DSPM?',
        questionUz: 'DSPM da D nimani anglatadi?',
        options: ['Discount', 'Distribution', 'Delivery', 'Design'],
        optionsUz: ['Discount', 'Distribution', 'Delivery', 'Design'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Какой минимальный уровень дистрибуции везде?',
        questionUz: 'Hamma joyda distribyutsiyaning minimal darajasi qanday?',
        options: ['Премиум', 'Стандартный', 'Must Have (базовый)', 'Любой'],
        optionsUz: ['Premium', 'Standart', 'Must Have (asosiy)', 'Har qanday'],
        correctAnswer: 2
      },
      {
        id: 3,
        question: 'Главный враг дистрибуции — это...',
        questionUz: 'Distribyutsiyaning asosiy dushmani — bu...',
        options: ['Конкуренты', 'Out-of-Stock', 'Высокие цены', 'Плохая упаковка'],
        optionsUz: ['Raqobatchilar', 'Out-of-Stock', 'Yuqori narxlar', 'Yomon qadoq'],
        correctAnswer: 1
      }
    ],
    badge: {
      id: 'distribution_master',
      icon: '📦',
      title: 'Мастер дистрибуции',
      titleUz: 'Distribyutsiya ustasi',
      description: 'Освоил все аспекты дистрибуции'
    }
  }
];

// Генерация оставшихся шагов (31-100)
const moduleConfig = [
  { id: 3, range: [31, 45], topics: ['Золотая полка', 'Планограмма', 'Face-out', 'Ротация', 'FIFO', 'Кросс-мерчандайзинг', 'Сезонная выкладка', 'POS-материалы', 'Проверка выкладки', 'Фото отчёт'] },
  { id: 4, range: [46, 55], topics: ['Ценовая политика', 'Ценники', 'Промо цены', 'Маржинальность', 'Конкурентные цены', 'Ошибки ценообразования', 'Ценовой мониторинг'] },
  { id: 5, range: [56, 75], topics: ['Подготовка к визиту', 'Приветствие', 'Осмотр ТТ', 'Анализ запасов', 'Презентация', 'Работа с заказом', 'Мерчандайзинг', 'Завершение визита', 'Документация', 'Анализ визита'] },
  { id: 6, range: [76, 90], topics: ['Формула ФУП', 'Выявление потребностей', 'Характеристики продукта', 'Преимущества', 'Выгоды для клиента', 'Доказательства', 'Призыв к действию', 'Примеры ФУП', 'Практика ФУП'] },
  { id: 7, range: [91, 100], topics: ['Типы возражений', 'Техника присоединения', '"Дорого"', '"Нет места"', '"Не продаётся"', '"Есть другой поставщик"', 'Отложенные возражения', 'Итоговый тест'] }
];

for (const config of moduleConfig) {
  const module = modules.find(m => m.id === config.id)!;
  for (let i = config.range[0]; i <= config.range[1]; i++) {
    const topicIndex = i - config.range[0];
    const topic = config.topics[topicIndex % config.topics.length] || `Урок ${topicIndex + 1}`;
    const isQuiz = i % 5 === 0 || i === config.range[1];
    const isPractice = i % 3 === 0 && !isQuiz;
    
    steps.push({
      id: i,
      moduleId: config.id,
      title: topic,
      titleUz: topic, // В реальном проекте — перевод
      type: isQuiz ? 'quiz' : isPractice ? 'practice' : 'theory',
      duration: isQuiz ? 7 : isPractice ? 10 : 5,
      content: `# ${topic}\n\nКонтент модуля "${module.title}".\n\n> 📚 Шаг ${i} из 100`,
      contentUz: `# ${topic}\n\n"${module.titleUz}" moduli kontenti.\n\n> 📚 100 dan ${i}-qadam`,
      points: isQuiz ? 25 : isPractice ? 20 : 10,
      ...(i === config.range[1] ? {
        badge: {
          id: `module_${config.id}_complete`,
          icon: module.icon,
          title: `${module.title} пройден`,
          titleUz: `${module.titleUz} o'tildi`,
          description: `Освоил модуль ${config.id}`
        }
      } : {}),
      ...(isQuiz ? {
        quiz: [{
          id: 1,
          question: `Вопрос по теме "${topic}"`,
          questionUz: `"${topic}" mavzusi bo'yicha savol`,
          options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
          optionsUz: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
          correctAnswer: 1
        }]
      } : {}),
      ...(isPractice ? {
        practice: {
          instruction: `Выполните практическое задание по теме "${topic}"`,
          instructionUz: `"${topic}" mavzusi bo'yicha amaliy topshiriqni bajaring`,
          checkpoints: ['Задание понято', 'Задание выполнено', 'Результат зафиксирован'],
          checkpointsUz: ['Topshiriq tushunildi', 'Topshiriq bajarildi', 'Natija qayd etildi']
        }
      } : {})
    });
  }
}

// Экспорт курса
export const salesRepCourse = {
  id: 'sales_rep',
  title: 'Стандарты торгового представителя',
  titleUz: 'Savdo vakili standartlari',
  description: '100 шагов к мастерству продаж',
  descriptionUz: 'Sotuv mahoratiga 100 qadam',
  totalSteps: 100,
  modules,
  steps,
  estimatedHours: 10,
  certificate: true
};
