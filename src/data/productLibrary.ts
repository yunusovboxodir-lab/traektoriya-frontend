// ===========================================
// БИБЛИОТЕКА ПРОДУКТОВ N'MEDOV
// 26 карточек продуктов с тестами для разблокировки
// ===========================================

export interface ProductQuiz {
  id: number;
  question: string;
  questionUz: string;
  options: string[];
  optionsUz: string[];
  correctAnswer: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameUz: string;
  category: ProductCategory;
  brand: string;
  weight: string;
  price: number;
  image?: string;
  usp: string;
  uspUz: string;
  targetAudience: string;
  targetAudienceUz: string;
  salesScript: string;
  salesScriptUz: string;
  shelfLife: string;
  storageConditions: string;
  storageConditionsUz: string;
  isNew?: boolean;
  isBestseller?: boolean;
  quiz: ProductQuiz[]; // 5 вопросов для разблокировки
}

export type ProductCategory = 
  | 'chocolate_paste'
  | 'noodles'
  | 'bars'
  | 'cookies';

export interface ProductCategoryInfo {
  id: ProductCategory;
  title: string;
  titleUz: string;
  icon: string;
  color: string;
  description: string;
  descriptionUz: string;
}

// ===========================================
// КАТЕГОРИИ ПРОДУКТОВ
// ===========================================

export const productCategories: ProductCategoryInfo[] = [
  {
    id: 'chocolate_paste',
    title: 'Шоколадная паста',
    titleUz: 'Shokoladli pasta',
    icon: '🍫',
    color: '#8B4513',
    description: 'Премиальные шоколадные пасты для всей семьи',
    descriptionUz: 'Butun oila uchun premium shokoladli pastalar'
  },
  {
    id: 'noodles',
    title: 'Лапша быстрого приготовления',
    titleUz: 'Tezkor tayyorlanadigan makaron',
    icon: '🍜',
    color: '#FF6B35',
    description: 'Вкусная лапша за 5 минут',
    descriptionUz: '5 daqiqada mazali makaron'
  },
  {
    id: 'bars',
    title: 'Батончики',
    titleUz: 'Batonciklar',
    icon: '🍫',
    color: '#D2691E',
    description: 'Энергия и вкус в каждом батончике',
    descriptionUz: 'Har bir batoncikda energiya va ta\'m'
  },
  {
    id: 'cookies',
    title: 'Печенье',
    titleUz: 'Pechene',
    icon: '🍪',
    color: '#DEB887',
    description: 'Хрустящее печенье к чаю',
    descriptionUz: 'Choyga mo\'rt pechene'
  }
];

// ===========================================
// ПРОДУКТЫ N'MEDOV (26 карточек с тестами)
// ===========================================

export const products: Product[] = [
  // === ШОКОЛАДНАЯ ПАСТА (5 продуктов) ===
  {
    id: 'choco-001',
    sku: 'CHC-350-CLS',
    name: 'Chococream Классик 350г',
    nameUz: 'Chococream Klassik 350g',
    category: 'chocolate_paste',
    brand: 'Chococream',
    weight: '350г',
    price: 32000,
    usp: 'Натуральное какао без пальмового масла',
    uspUz: 'Palma yog\'isiz tabiiy kakao',
    targetAudience: 'Семьи с детьми, любители сладкого',
    targetAudienceUz: 'Bolali oilalar, shirinlik ixlosmandlari',
    salesScript: 'Chococream — это настоящий шоколадный вкус без вредных добавок. Идеально для детских завтраков!',
    salesScriptUz: 'Chococream — zararli qo\'shimchalarsiz haqiqiy shokolad ta\'mi. Bolalar nonushtasi uchun ideal!',
    shelfLife: '12 месяцев',
    storageConditions: 'При температуре от +5 до +25°C',
    storageConditionsUz: '+5 dan +25°C gacha haroratda',
    isBestseller: true,
    quiz: [
      {
        id: 1,
        question: 'Какой объём у Chococream Классик?',
        questionUz: 'Chococream Klassik hajmi qancha?',
        options: ['200г', '350г', '500г', '400г'],
        optionsUz: ['200g', '350g', '500g', '400g'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Главное преимущество Chococream Классик?',
        questionUz: 'Chococream Klassik ning asosiy afzalligi?',
        options: ['Низкая цена', 'Без пальмового масла', 'Большой объём', 'Долгий срок хранения'],
        optionsUz: ['Arzon narx', 'Palma yog\'isiz', 'Katta hajm', 'Uzoq saqlash muddati'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Какова РРЦ Chococream Классик 350г?',
        questionUz: 'Chococream Klassik 350g ning TChN qancha?',
        options: ['28 000 сум', '32 000 сум', '35 000 сум', '30 000 сум'],
        optionsUz: ['28 000 so\'m', '32 000 so\'m', '35 000 so\'m', '30 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Кто целевая аудитория Chococream Классик?',
        questionUz: 'Chococream Klassik ning maqsadli auditoriyasi kim?',
        options: ['Спортсмены', 'Семьи с детьми', 'Пожилые люди', 'Студенты'],
        optionsUz: ['Sportchilar', 'Bolali oilalar', 'Keksa odamlar', 'Talabalar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Срок годности Chococream Классик?',
        questionUz: 'Chococream Klassik saqlash muddati?',
        options: ['6 месяцев', '9 месяцев', '12 месяцев', '18 месяцев'],
        optionsUz: ['6 oy', '9 oy', '12 oy', '18 oy'],
        correctAnswer: 2
      }
    ]
  },
  {
    id: 'choco-002',
    sku: 'CHC-180-CLS',
    name: 'Chococream Классик 180г',
    nameUz: 'Chococream Klassik 180g',
    category: 'chocolate_paste',
    brand: 'Chococream',
    weight: '180г',
    price: 18000,
    usp: 'Компактный размер для пробы',
    uspUz: 'Sinab ko\'rish uchun ixcham o\'lcham',
    targetAudience: 'Новые покупатели, одинокие люди',
    targetAudienceUz: 'Yangi xaridorlar, yolg\'iz odamlar',
    salesScript: 'Идеальный размер, чтобы попробовать. Если понравится — есть большая упаковка!',
    salesScriptUz: 'Sinab ko\'rish uchun ideal o\'lcham. Yoqsa — katta qadoq bor!',
    shelfLife: '12 месяцев',
    storageConditions: 'При температуре от +5 до +25°C',
    storageConditionsUz: '+5 dan +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Какой объём у Chococream Классик компакт?',
        questionUz: 'Chococream Klassik kompakt hajmi qancha?',
        options: ['150г', '180г', '200г', '250г'],
        optionsUz: ['150g', '180g', '200g', '250g'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Для кого идеален компактный размер?',
        questionUz: 'Ixcham o\'lcham kim uchun ideal?',
        options: ['Для больших семей', 'Для новых покупателей', 'Для ресторанов', 'Для спортсменов'],
        optionsUz: ['Katta oilalar uchun', 'Yangi xaridorlar uchun', 'Restoranlar uchun', 'Sportchilar uchun'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Chococream 180г?',
        questionUz: 'Chococream 180g narxi?',
        options: ['15 000 сум', '18 000 сум', '20 000 сум', '22 000 сум'],
        optionsUz: ['15 000 so\'m', '18 000 so\'m', '20 000 so\'m', '22 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Какой скрипт продаж для этого продукта?',
        questionUz: 'Bu mahsulot uchun qanday savdo skripti?',
        options: ['Самый дешёвый', 'Попробуйте, есть большая упаковка', 'Для всей семьи', 'Премиум качество'],
        optionsUz: ['Eng arzon', 'Sinab ko\'ring, katta qadoq bor', 'Butun oila uchun', 'Premium sifat'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'К какому бренду относится этот продукт?',
        questionUz: 'Bu mahsulot qaysi brendga tegishli?',
        options: ['Chocotella', 'Chococream', 'Strobar', 'Velona'],
        optionsUz: ['Chocotella', 'Chococream', 'Strobar', 'Velona'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'choco-003',
    sku: 'CHC-350-NUT',
    name: 'Chococream с фундуком 350г',
    nameUz: 'Chococream funduk bilan 350g',
    category: 'chocolate_paste',
    brand: 'Chococream',
    weight: '350г',
    price: 38000,
    usp: 'Кусочки настоящего фундука',
    uspUz: 'Haqiqiy funduk bo\'laklari',
    targetAudience: 'Гурманы, любители орехов',
    targetAudienceUz: 'Gurmanlar, yong\'oq ixlosmandlari',
    salesScript: 'Настоящие кусочки фундука в каждой ложке. Премиальный вкус по доступной цене!',
    salesScriptUz: 'Har bir qoshiqda haqiqiy funduk bo\'laklari. Arzon narxda premium ta\'m!',
    shelfLife: '12 месяцев',
    storageConditions: 'При температуре от +5 до +25°C',
    storageConditionsUz: '+5 dan +25°C gacha haroratda',
    isNew: true,
    quiz: [
      {
        id: 1,
        question: 'Что особенного в Chococream с фундуком?',
        questionUz: 'Chococream funduk bilan nimasi alohida?',
        options: ['Низкая цена', 'Кусочки настоящего фундука', 'Большой объём', 'Без сахара'],
        optionsUz: ['Arzon narx', 'Haqiqiy funduk bo\'laklari', 'Katta hajm', 'Shakarsiz'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Chococream с фундуком 350г?',
        questionUz: 'Chococream funduk bilan 350g narxi?',
        options: ['32 000 сум', '35 000 сум', '38 000 сум', '40 000 сум'],
        optionsUz: ['32 000 so\'m', '35 000 so\'m', '38 000 so\'m', '40 000 so\'m'],
        correctAnswer: 2
      },
      {
        id: 3,
        question: 'Кто целевая аудитория этого продукта?',
        questionUz: 'Bu mahsulotning maqsadli auditoriyasi kim?',
        options: ['Дети', 'Гурманы и любители орехов', 'Спортсмены', 'Пожилые'],
        optionsUz: ['Bolalar', 'Gurmanlar va yong\'oq ixlosmandlari', 'Sportchilar', 'Keksalar'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Это новинка?',
        questionUz: 'Bu yangi mahsulotmi?',
        options: ['Нет, давно на рынке', 'Да, это новинка', 'Снят с производства', 'Только для HoReCa'],
        optionsUz: ['Yo\'q, bozorda uzoq', 'Ha, bu yangilik', 'Ishlab chiqarish to\'xtatilgan', 'Faqat HoReCa uchun'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Разница в цене с классической версией?',
        questionUz: 'Klassik versiya bilan narx farqi?',
        options: ['Одинаковая цена', 'На 6 000 сум дороже', 'На 10 000 сум дороже', 'На 3 000 сум дешевле'],
        optionsUz: ['Bir xil narx', '6 000 so\'m qimmatroq', '10 000 so\'m qimmatroq', '3 000 so\'m arzonroq'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'choco-004',
    sku: 'CHT-400-DUO',
    name: 'Chocotella Duo 400г',
    nameUz: 'Chocotella Duo 400g',
    category: 'chocolate_paste',
    brand: 'Chocotella',
    weight: '400г',
    price: 35000,
    usp: 'Два вкуса в одной банке: молочный и белый шоколад',
    uspUz: 'Bitta bankada ikki ta\'m: sutli va oq shokolad',
    targetAudience: 'Молодёжь, любители экспериментов',
    targetAudienceUz: 'Yoshlar, tajriba ixlosmandlari',
    salesScript: 'Два любимых вкуса в одной банке! Смешивайте или ешьте отдельно — выбор за вами.',
    salesScriptUz: 'Bitta bankada ikkita sevimli ta\'m! Aralashtiring yoki alohida yeng — tanlov sizniki.',
    shelfLife: '12 месяцев',
    storageConditions: 'При температуре от +5 до +25°C',
    storageConditionsUz: '+5 dan +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Сколько вкусов в Chocotella Duo?',
        questionUz: 'Chocotella Duo da nechta ta\'m bor?',
        options: ['Один', 'Два', 'Три', 'Четыре'],
        optionsUz: ['Bitta', 'Ikkita', 'Uchta', 'To\'rtta'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Какие вкусы в Chocotella Duo?',
        questionUz: 'Chocotella Duo da qanday ta\'mlar bor?',
        options: ['Молочный и тёмный', 'Молочный и белый', 'Белый и карамель', 'Фундук и кокос'],
        optionsUz: ['Sutli va qora', 'Sutli va oq', 'Oq va karamel', 'Funduk va kokos'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Объём Chocotella Duo?',
        questionUz: 'Chocotella Duo hajmi?',
        options: ['350г', '400г', '450г', '500г'],
        optionsUz: ['350g', '400g', '450g', '500g'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Цена Chocotella Duo?',
        questionUz: 'Chocotella Duo narxi?',
        options: ['30 000 сум', '35 000 сум', '40 000 сум', '45 000 сум'],
        optionsUz: ['30 000 so\'m', '35 000 so\'m', '40 000 so\'m', '45 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Целевая аудитория Chocotella Duo?',
        questionUz: 'Chocotella Duo maqsadli auditoriyasi?',
        options: ['Пожилые люди', 'Молодёжь', 'Дети до 3 лет', 'Диабетики'],
        optionsUz: ['Keksa odamlar', 'Yoshlar', '3 yoshgacha bolalar', 'Diabetiklar'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'choco-005',
    sku: 'CHT-200-MLK',
    name: 'Chocotella Молочная 200г',
    nameUz: 'Chocotella Sutli 200g',
    category: 'chocolate_paste',
    brand: 'Chocotella',
    weight: '200г',
    price: 22000,
    usp: 'Нежный молочный вкус',
    uspUz: 'Nozik sutli ta\'m',
    targetAudience: 'Дети, семьи',
    targetAudienceUz: 'Bolalar, oilalar',
    salesScript: 'Самый нежный вкус для самых маленьких. Дети обожают!',
    salesScriptUz: 'Eng kichiklar uchun eng nozik ta\'m. Bolalar yaxshi ko\'radi!',
    shelfLife: '12 месяцев',
    storageConditions: 'При температуре от +5 до +25°C',
    storageConditionsUz: '+5 dan +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Главная особенность Chocotella Молочная?',
        questionUz: 'Chocotella Sutli ning asosiy xususiyati?',
        options: ['Горький вкус', 'Нежный молочный вкус', 'С орехами', 'Без сахара'],
        optionsUz: ['Achchiq ta\'m', 'Nozik sutli ta\'m', 'Yong\'oqli', 'Shakarsiz'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Объём Chocotella Молочная?',
        questionUz: 'Chocotella Sutli hajmi?',
        options: ['150г', '200г', '250г', '300г'],
        optionsUz: ['150g', '200g', '250g', '300g'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Chocotella Молочная 200г?',
        questionUz: 'Chocotella Sutli 200g narxi?',
        options: ['18 000 сум', '20 000 сум', '22 000 сум', '25 000 сум'],
        optionsUz: ['18 000 so\'m', '20 000 so\'m', '22 000 so\'m', '25 000 so\'m'],
        correctAnswer: 2
      },
      {
        id: 4,
        question: 'Для кого этот продукт?',
        questionUz: 'Bu mahsulot kim uchun?',
        options: ['Спортсмены', 'Дети и семьи', 'Пожилые', 'Вегетарианцы'],
        optionsUz: ['Sportchilar', 'Bolalar va oilalar', 'Keksalar', 'Vegetarianlar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'К какому бренду относится?',
        questionUz: 'Qaysi brendga tegishli?',
        options: ['Chococream', 'Chocotella', 'Strobar', 'Hot Lunch'],
        optionsUz: ['Chococream', 'Chocotella', 'Strobar', 'Hot Lunch'],
        correctAnswer: 1
      }
    ]
  },

  // === ЛАПША (8 продуктов) ===
  {
    id: 'nood-001',
    sku: 'HL-70-CHK',
    name: 'Hot Lunch Курица 70г',
    nameUz: 'Hot Lunch Tovuq 70g',
    category: 'noodles',
    brand: 'Hot Lunch',
    weight: '70г',
    price: 4500,
    usp: 'Насыщенный куриный вкус',
    uspUz: 'Boy tovuq ta\'mi',
    targetAudience: 'Студенты, офисные работники',
    targetAudienceUz: 'Talabalar, ofis xodimlari',
    salesScript: 'Горячий обед за 5 минут! Настоящий куриный бульон в каждой порции.',
    salesScriptUz: '5 daqiqada issiq tushlik! Har bir porsiyada haqiqiy tovuq sho\'rva.',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    isBestseller: true,
    quiz: [
      {
        id: 1,
        question: 'За сколько минут готовится Hot Lunch?',
        questionUz: 'Hot Lunch necha daqiqada tayyorlanadi?',
        options: ['3 минуты', '5 минут', '10 минут', '15 минут'],
        optionsUz: ['3 daqiqa', '5 daqiqa', '10 daqiqa', '15 daqiqa'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Вес Hot Lunch Курица?',
        questionUz: 'Hot Lunch Tovuq vazni?',
        options: ['50г', '70г', '90г', '100г'],
        optionsUz: ['50g', '70g', '90g', '100g'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Hot Lunch Курица 70г?',
        questionUz: 'Hot Lunch Tovuq 70g narxi?',
        options: ['3 500 сум', '4 500 сум', '5 500 сум', '6 000 сум'],
        optionsUz: ['3 500 so\'m', '4 500 so\'m', '5 500 so\'m', '6 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория Hot Lunch?',
        questionUz: 'Hot Lunch maqsadli auditoriyasi?',
        options: ['Пожилые', 'Студенты и офисные работники', 'Дети до 3 лет', 'Вегетарианцы'],
        optionsUz: ['Keksalar', 'Talabalar va ofis xodimlari', '3 yoshgacha bolalar', 'Vegetarianlar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Hot Lunch — это бестселлер?',
        questionUz: 'Hot Lunch — bu bestseller?',
        options: ['Нет', 'Да', 'Снят с продажи', 'Только для экспорта'],
        optionsUz: ['Yo\'q', 'Ha', 'Sotuvdan olib tashlangan', 'Faqat eksport uchun'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-002',
    sku: 'HL-70-BEF',
    name: 'Hot Lunch Говядина 70г',
    nameUz: 'Hot Lunch Mol go\'shti 70g',
    category: 'noodles',
    brand: 'Hot Lunch',
    weight: '70г',
    price: 4500,
    usp: 'Богатый мясной вкус',
    uspUz: 'Boy go\'sht ta\'mi',
    targetAudience: 'Мужчины, любители мяса',
    targetAudienceUz: 'Erkaklar, go\'sht ixlosmandlari',
    salesScript: 'Сытный обед с настоящим вкусом говядины. Утоляет голод надолго!',
    salesScriptUz: 'Haqiqiy mol go\'shti ta\'mi bilan to\'yimli tushlik. Uzoq vaqt ochlikni qondiradi!',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Вкус Hot Lunch Говядина?',
        questionUz: 'Hot Lunch Mol go\'shti ta\'mi?',
        options: ['Куриный', 'Говяжий', 'Рыбный', 'Овощной'],
        optionsUz: ['Tovuqli', 'Mol go\'shtli', 'Baliqli', 'Sabzavotli'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена одинакова с куриным вкусом?',
        questionUz: 'Tovuqli ta\'m bilan narxi bir xilmi?',
        options: ['Нет, дороже', 'Да, одинаковая', 'Нет, дешевле', 'Зависит от магазина'],
        optionsUz: ['Yo\'q, qimmatroq', 'Ha, bir xil', 'Yo\'q, arzonroq', 'Do\'konga bog\'liq'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Для кого этот вкус?',
        questionUz: 'Bu ta\'m kim uchun?',
        options: ['Вегетарианцы', 'Мужчины, любители мяса', 'Дети', 'Диетики'],
        optionsUz: ['Vegetarianlar', 'Erkaklar, go\'sht ixlosmandlari', 'Bolalar', 'Parhez tutuvchilar'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Главное преимущество этого вкуса?',
        questionUz: 'Bu ta\'mning asosiy afzalligi?',
        options: ['Низкая калорийность', 'Утоляет голод надолго', 'Без глютена', 'Острый вкус'],
        optionsUz: ['Kam kaloriya', 'Uzoq vaqt ochlikni qondiradi', 'Glutensiz', 'Achchiq ta\'m'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Срок годности?',
        questionUz: 'Saqlash muddati?',
        options: ['6 месяцев', '12 месяцев', '18 месяцев', '24 месяца'],
        optionsUz: ['6 oy', '12 oy', '18 oy', '24 oy'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-003',
    sku: 'HL-70-SHR',
    name: 'Hot Lunch Креветка 70г',
    nameUz: 'Hot Lunch Qisqichbaqa 70g',
    category: 'noodles',
    brand: 'Hot Lunch',
    weight: '70г',
    price: 5000,
    usp: 'Экзотический вкус морепродуктов',
    uspUz: 'Ekzotik dengiz mahsulotlari ta\'mi',
    targetAudience: 'Любители азиатской кухни',
    targetAudienceUz: 'Osiyo oshxonasi ixlosmandlari',
    salesScript: 'Вкус Азии у вас дома! Настоящие креветки в ароматном бульоне.',
    salesScriptUz: 'Uyingizda Osiyo ta\'mi! Xushbo\'y sho\'rvada haqiqiy qisqichbaqalar.',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    isNew: true,
    quiz: [
      {
        id: 1,
        question: 'Вкус Hot Lunch Креветка?',
        questionUz: 'Hot Lunch Qisqichbaqa ta\'mi?',
        options: ['Мясной', 'Морепродукты', 'Овощной', 'Грибной'],
        optionsUz: ['Go\'shtli', 'Dengiz mahsulotlari', 'Sabzavotli', 'Qo\'ziqorinli'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Hot Lunch Креветка?',
        questionUz: 'Hot Lunch Qisqichbaqa narxi?',
        options: ['4 500 сум', '5 000 сум', '5 500 сум', '6 000 сум'],
        optionsUz: ['4 500 so\'m', '5 000 so\'m', '5 500 so\'m', '6 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Это новинка?',
        questionUz: 'Bu yangi mahsulotmi?',
        options: ['Нет', 'Да', 'Скоро снимут', 'Только в Ташкенте'],
        optionsUz: ['Yo\'q', 'Ha', 'Tez orada olib tashlanadi', 'Faqat Toshkentda'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Дети', 'Любители азиатской кухни', 'Вегетарианцы', 'Диабетики'],
        optionsUz: ['Bolalar', 'Osiyo oshxonasi ixlosmandlari', 'Vegetarianlar', 'Diabetiklar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Почему дороже куриного?',
        questionUz: 'Nega tovuqlinikidan qimmatroq?',
        options: ['Больше порция', 'Экзотический вкус', 'Другая упаковка', 'Ошибка в цене'],
        optionsUz: ['Kattaroq porsiya', 'Ekzotik ta\'m', 'Boshqa qadoq', 'Narxda xato'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-004',
    sku: 'HL-70-VEG',
    name: 'Hot Lunch Овощи 70г',
    nameUz: 'Hot Lunch Sabzavotlar 70g',
    category: 'noodles',
    brand: 'Hot Lunch',
    weight: '70г',
    price: 4000,
    usp: 'Лёгкий овощной вкус',
    uspUz: 'Yengil sabzavot ta\'mi',
    targetAudience: 'Вегетарианцы, следящие за фигурой',
    targetAudienceUz: 'Vegetarianlar, jismoniy shaklini kuzatuvchilar',
    salesScript: 'Лёгкий и вкусный обед без мяса. Идеально для тех, кто следит за питанием!',
    salesScriptUz: 'Go\'shtsiz yengil va mazali tushlik. Ovqatlanishini kuzatuvchilar uchun ideal!',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Особенность Hot Lunch Овощи?',
        questionUz: 'Hot Lunch Sabzavotlar xususiyati?',
        options: ['С мясом', 'Без мяса, лёгкий', 'Очень острый', 'Сладкий'],
        optionsUz: ['Go\'shtli', 'Go\'shtsiz, yengil', 'Juda achchiq', 'Shirin'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Hot Lunch Овощи?',
        questionUz: 'Hot Lunch Sabzavotlar narxi?',
        options: ['4 000 сум', '4 500 сум', '5 000 сум', '5 500 сум'],
        optionsUz: ['4 000 so\'m', '4 500 so\'m', '5 000 so\'m', '5 500 so\'m'],
        correctAnswer: 0
      },
      {
        id: 3,
        question: 'Это самый дешёвый вкус Hot Lunch?',
        questionUz: 'Bu Hot Lunch ning eng arzon ta\'mimi?',
        options: ['Нет', 'Да', 'Такой же как другие', 'Самый дорогой'],
        optionsUz: ['Yo\'q', 'Ha', 'Boshqalari bilan bir xil', 'Eng qimmat'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Для кого этот продукт?',
        questionUz: 'Bu mahsulot kim uchun?',
        options: ['Мясоеды', 'Вегетарианцы', 'Только дети', 'Только мужчины'],
        optionsUz: ['Go\'sht yeydiganlar', 'Vegetarianlar', 'Faqat bolalar', 'Faqat erkaklar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Какой скрипт продаж?',
        questionUz: 'Qanday savdo skripti?',
        options: ['Самый сытный', 'Лёгкий обед без мяса', 'Премиум качество', 'Для детей'],
        optionsUz: ['Eng to\'yimli', 'Go\'shtsiz yengil tushlik', 'Premium sifat', 'Bolalar uchun'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-005',
    sku: 'HL-120-CHK',
    name: 'Hot Lunch BIG Курица 120г',
    nameUz: 'Hot Lunch BIG Tovuq 120g',
    category: 'noodles',
    brand: 'Hot Lunch',
    weight: '120г',
    price: 7500,
    usp: 'Большая порция для большого аппетита',
    uspUz: 'Katta ishtaha uchun katta porsiya',
    targetAudience: 'Мужчины, рабочие',
    targetAudienceUz: 'Erkaklar, ishchilar',
    salesScript: 'Двойная порция — двойное удовольствие! Когда обычной лапши мало.',
    salesScriptUz: 'Ikki barobar porsiya — ikki barobar zavq! Oddiy makaron kam bo\'lganda.',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Вес Hot Lunch BIG?',
        questionUz: 'Hot Lunch BIG vazni?',
        options: ['70г', '100г', '120г', '150г'],
        optionsUz: ['70g', '100g', '120g', '150g'],
        correctAnswer: 2
      },
      {
        id: 2,
        question: 'Во сколько раз больше обычной порции?',
        questionUz: 'Oddiy porsiyadan necha marta katta?',
        options: ['В 1.5 раза', 'Почти в 2 раза', 'В 3 раза', 'Одинаково'],
        optionsUz: ['1.5 marta', 'Deyarli 2 marta', '3 marta', 'Bir xil'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Hot Lunch BIG?',
        questionUz: 'Hot Lunch BIG narxi?',
        options: ['6 000 сум', '7 500 сум', '9 000 сум', '10 000 сум'],
        optionsUz: ['6 000 so\'m', '7 500 so\'m', '9 000 so\'m', '10 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Для кого большая порция?',
        questionUz: 'Katta porsiya kim uchun?',
        options: ['Дети', 'Мужчины, рабочие', 'Диетики', 'Пожилые'],
        optionsUz: ['Bolalar', 'Erkaklar, ishchilar', 'Parhez tutuvchilar', 'Keksalar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж для BIG?',
        questionUz: 'BIG uchun savdo skripti?',
        options: ['Для детей', 'Двойная порция', 'Диетический', 'Острый вкус'],
        optionsUz: ['Bolalar uchun', 'Ikki barobar porsiya', 'Dietik', 'Achchiq ta\'m'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-006',
    sku: 'CF-80-CHK',
    name: 'Cheff Курица 80г',
    nameUz: 'Cheff Tovuq 80g',
    category: 'noodles',
    brand: 'Cheff',
    weight: '80г',
    price: 5500,
    usp: 'Премиальное качество лапши',
    uspUz: 'Makaronning premium sifati',
    targetAudience: 'Требовательные покупатели',
    targetAudienceUz: 'Talabchan xaridorlar',
    salesScript: 'Лапша от шеф-повара! Премиальное качество по разумной цене.',
    salesScriptUz: 'Bosh oshpazdan makaron! Oqilona narxda premium sifat.',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Бренд Cheff — это?',
        questionUz: 'Cheff brendi — bu?',
        options: ['Эконом сегмент', 'Премиум сегмент', 'Детское питание', 'Органик'],
        optionsUz: ['Ekonom segment', 'Premium segment', 'Bolalar ovqati', 'Organik'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Вес Cheff Курица?',
        questionUz: 'Cheff Tovuq vazni?',
        options: ['70г', '80г', '90г', '100г'],
        optionsUz: ['70g', '80g', '90g', '100g'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Cheff Курица?',
        questionUz: 'Cheff Tovuq narxi?',
        options: ['4 500 сум', '5 500 сум', '6 500 сум', '7 500 сум'],
        optionsUz: ['4 500 so\'m', '5 500 so\'m', '6 500 so\'m', '7 500 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Чем Cheff отличается от Hot Lunch?',
        questionUz: 'Cheff Hot Lunch dan nimasi bilan farqlanadi?',
        options: ['Дешевле', 'Премиальное качество', 'Меньше порция', 'Острее'],
        optionsUz: ['Arzonroq', 'Premium sifat', 'Kichikroq porsiya', 'Achchiqroq'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Целевая аудитория Cheff?',
        questionUz: 'Cheff maqsadli auditoriyasi?',
        options: ['Студенты', 'Требовательные покупатели', 'Дети', 'Эконом-сегмент'],
        optionsUz: ['Talabalar', 'Talabchan xaridorlar', 'Bolalar', 'Ekonom-segment'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-007',
    sku: 'CF-80-BEF',
    name: 'Cheff Говядина 80г',
    nameUz: 'Cheff Mol go\'shti 80g',
    category: 'noodles',
    brand: 'Cheff',
    weight: '80г',
    price: 5500,
    usp: 'Насыщенный вкус говядины',
    uspUz: 'Boy mol go\'shti ta\'mi',
    targetAudience: 'Гурманы',
    targetAudienceUz: 'Gurmanlar',
    salesScript: 'Настоящий вкус говядины в премиальной лапше. Попробуйте разницу!',
    salesScriptUz: 'Premium makaronda haqiqiy mol go\'shti ta\'mi. Farqni his qiling!',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Вкус Cheff Говядина?',
        questionUz: 'Cheff Mol go\'shti ta\'mi?',
        options: ['Куриный', 'Говяжий', 'Креветочный', 'Овощной'],
        optionsUz: ['Tovuqli', 'Mol go\'shtli', 'Qisqichbaqali', 'Sabzavotli'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена одинакова с Cheff Курица?',
        questionUz: 'Cheff Tovuq bilan narxi bir xilmi?',
        options: ['Нет, дороже', 'Да, одинаковая', 'Нет, дешевле', 'Зависит от региона'],
        optionsUz: ['Yo\'q, qimmatroq', 'Ha, bir xil', 'Yo\'q, arzonroq', 'Mintaqaga bog\'liq'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Чем Cheff Говядина отличается от Hot Lunch Говядина?',
        questionUz: 'Cheff Mol go\'shti Hot Lunch Mol go\'shtidan nimasi bilan farqlanadi?',
        options: ['Дешевле', 'Премиум качество, больше порция', 'Острее', 'Меньше порция'],
        optionsUz: ['Arzonroq', 'Premium sifat, kattaroq porsiya', 'Achchiqroq', 'Kichikroq porsiya'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Студенты', 'Гурманы', 'Дети', 'Вегетарианцы'],
        optionsUz: ['Talabalar', 'Gurmanlar', 'Bolalar', 'Vegetarianlar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Самый дешёвый', 'Попробуйте разницу', 'Для детей', 'Диетический'],
        optionsUz: ['Eng arzon', 'Farqni his qiling', 'Bolalar uchun', 'Dietik'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'nood-008',
    sku: 'CF-80-SPC',
    name: 'Cheff Острая 80г',
    nameUz: 'Cheff Achchiq 80g',
    category: 'noodles',
    brand: 'Cheff',
    weight: '80г',
    price: 5500,
    usp: 'Пикантная острота',
    uspUz: 'Pikantli achchiqlik',
    targetAudience: 'Любители острого',
    targetAudienceUz: 'Achchiq taom ixlosmandlari',
    salesScript: 'Для тех, кто любит погорячее! Идеальный баланс остроты и вкуса.',
    salesScriptUz: 'Issiqroq yoqtiradiganlar uchun! Achchiqlik va ta\'mning ideal muvozanati.',
    shelfLife: '12 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Особенность Cheff Острая?',
        questionUz: 'Cheff Achchiq xususiyati?',
        options: ['Мягкий вкус', 'Пикантная острота', 'Сладкий', 'Кислый'],
        optionsUz: ['Yumshoq ta\'m', 'Pikantli achchiqlik', 'Shirin', 'Nordon'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Для кого эта лапша?',
        questionUz: 'Bu makaron kim uchun?',
        options: ['Дети', 'Любители острого', 'Диетики', 'Пожилые'],
        optionsUz: ['Bolalar', 'Achchiq taom ixlosmandlari', 'Parhez tutuvchilar', 'Keksalar'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Cheff Острая?',
        questionUz: 'Cheff Achchiq narxi?',
        options: ['4 500 сум', '5 500 сум', '6 500 сум', '7 500 сум'],
        optionsUz: ['4 500 so\'m', '5 500 so\'m', '6 500 so\'m', '7 500 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'К какому бренду относится?',
        questionUz: 'Qaysi brendga tegishli?',
        options: ['Hot Lunch', 'Cheff', 'Strobar', 'Velona'],
        optionsUz: ['Hot Lunch', 'Cheff', 'Strobar', 'Velona'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Для детей', 'Для тех, кто любит погорячее', 'Диетический', 'Большая порция'],
        optionsUz: ['Bolalar uchun', 'Issiqroq yoqtiradiganlar uchun', 'Dietik', 'Katta porsiya'],
        correctAnswer: 1
      }
    ]
  },

  // === БАТОНЧИКИ (5 продуктов) ===
  {
    id: 'bar-001',
    sku: 'STR-40-CLS',
    name: 'Strobar Классик 40г',
    nameUz: 'Strobar Klassik 40g',
    category: 'bars',
    brand: 'Strobar',
    weight: '40г',
    price: 6000,
    usp: 'Идеальный баланс шоколада и карамели',
    uspUz: 'Shokolad va karamelning ideal muvozanati',
    targetAudience: 'Молодёжь, студенты',
    targetAudienceUz: 'Yoshlar, talabalar',
    salesScript: 'Перекус с пользой! Энергия и удовольствие в одном батончике.',
    salesScriptUz: 'Foydali gazak! Bitta batoncikda energiya va zavq.',
    shelfLife: '9 месяцев',
    storageConditions: 'При температуре от +5 до +22°C',
    storageConditionsUz: '+5 dan +22°C gacha haroratda',
    isBestseller: true,
    quiz: [
      {
        id: 1,
        question: 'Вес Strobar Классик?',
        questionUz: 'Strobar Klassik vazni?',
        options: ['30г', '40г', '50г', '60г'],
        optionsUz: ['30g', '40g', '50g', '60g'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Главное преимущество Strobar?',
        questionUz: 'Strobar ning asosiy afzalligi?',
        options: ['Большой размер', 'Баланс шоколада и карамели', 'Без сахара', 'Острый вкус'],
        optionsUz: ['Katta o\'lcham', 'Shokolad va karamel muvozanati', 'Shakarsiz', 'Achchiq ta\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Strobar Классик?',
        questionUz: 'Strobar Klassik narxi?',
        options: ['5 000 сум', '6 000 сум', '7 000 сум', '8 000 сум'],
        optionsUz: ['5 000 so\'m', '6 000 so\'m', '7 000 so\'m', '8 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Strobar — бестселлер?',
        questionUz: 'Strobar — bestsellermi?',
        options: ['Нет', 'Да', 'Снят с продажи', 'Только для экспорта'],
        optionsUz: ['Yo\'q', 'Ha', 'Sotuvdan olib tashlangan', 'Faqat eksport uchun'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Срок годности Strobar?',
        questionUz: 'Strobar saqlash muddati?',
        options: ['6 месяцев', '9 месяцев', '12 месяцев', '18 месяцев'],
        optionsUz: ['6 oy', '9 oy', '12 oy', '18 oy'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'bar-002',
    sku: 'STR-40-NUT',
    name: 'Strobar с арахисом 40г',
    nameUz: 'Strobar yeryong\'oq bilan 40g',
    category: 'bars',
    brand: 'Strobar',
    weight: '40г',
    price: 6500,
    usp: 'Хрустящий арахис в каждом кусочке',
    uspUz: 'Har bir bo\'lakda qarsildoq yeryong\'oq',
    targetAudience: 'Спортсмены, активные люди',
    targetAudienceUz: 'Sportchilar, faol odamlar',
    salesScript: 'Белок и энергия для активных! Арахис даёт силу на весь день.',
    salesScriptUz: 'Faollar uchun oqsil va energiya! Yeryong\'oq kun bo\'yi kuch beradi.',
    shelfLife: '9 месяцев',
    storageConditions: 'При температуре от +5 до +22°C',
    storageConditionsUz: '+5 dan +22°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Что особенного в Strobar с арахисом?',
        questionUz: 'Strobar yeryong\'oq bilan nimasi alohida?',
        options: ['Без орехов', 'Хрустящий арахис', 'Острый', 'Мягкая текстура'],
        optionsUz: ['Yong\'oqsiz', 'Qarsildoq yeryong\'oq', 'Achchiq', 'Yumshoq tekstura'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Strobar с арахисом?',
        questionUz: 'Strobar yeryong\'oq bilan narxi?',
        options: ['6 000 сум', '6 500 сум', '7 000 сум', '7 500 сум'],
        optionsUz: ['6 000 so\'m', '6 500 so\'m', '7 000 so\'m', '7 500 so\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Для кого этот батончик?',
        questionUz: 'Bu batoncik kim uchun?',
        options: ['Дети', 'Спортсмены', 'Пожилые', 'Вегетарианцы'],
        optionsUz: ['Bolalar', 'Sportchilar', 'Keksalar', 'Vegetarianlar'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Почему арахис?',
        questionUz: 'Nega yeryong\'oq?',
        options: ['Дешёвый', 'Даёт белок и энергию', 'Красивый цвет', 'Модный тренд'],
        optionsUz: ['Arzon', 'Oqsil va energiya beradi', 'Chiroyli rang', 'Moda trendi'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Разница в цене с классическим?',
        questionUz: 'Klassik bilan narx farqi?',
        options: ['Одинаковая', 'На 500 сум дороже', 'На 1000 сум дороже', 'Дешевле'],
        optionsUz: ['Bir xil', '500 so\'m qimmatroq', '1000 so\'m qimmatroq', 'Arzonroq'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'bar-003',
    sku: 'STR-40-COC',
    name: 'Strobar Кокос 40г',
    nameUz: 'Strobar Kokos 40g',
    category: 'bars',
    brand: 'Strobar',
    weight: '40г',
    price: 6500,
    usp: 'Тропический вкус кокоса',
    uspUz: 'Tropik kokos ta\'mi',
    targetAudience: 'Девушки, любители экзотики',
    targetAudienceUz: 'Qizlar, ekzotika ixlosmandlari',
    salesScript: 'Вкус тропиков в каждом кусочке! Нежный кокос в шоколаде.',
    salesScriptUz: 'Har bir bo\'lakda tropik ta\'m! Shokoladda nozik kokos.',
    shelfLife: '9 месяцев',
    storageConditions: 'При температуре от +5 до +22°C',
    storageConditionsUz: '+5 dan +22°C gacha haroratda',
    isNew: true,
    quiz: [
      {
        id: 1,
        question: 'Вкус Strobar Кокос?',
        questionUz: 'Strobar Kokos ta\'mi?',
        options: ['Ореховый', 'Тропический кокос', 'Карамельный', 'Ванильный'],
        optionsUz: ['Yong\'oqli', 'Tropik kokos', 'Karamelli', 'Vanilli'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Это новинка?',
        questionUz: 'Bu yangi mahsulotmi?',
        options: ['Нет', 'Да', 'Снят с продажи', 'Классика'],
        optionsUz: ['Yo\'q', 'Ha', 'Sotuvdan olib tashlangan', 'Klassika'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Strobar Кокос?',
        questionUz: 'Strobar Kokos narxi?',
        options: ['6 000 сум', '6 500 сум', '7 000 сум', '7 500 сум'],
        optionsUz: ['6 000 so\'m', '6 500 so\'m', '7 000 so\'m', '7 500 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Мужчины', 'Девушки, любители экзотики', 'Дети', 'Спортсмены'],
        optionsUz: ['Erkaklar', 'Qizlar, ekzotika ixlosmandlari', 'Bolalar', 'Sportchilar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Для мужчин', 'Вкус тропиков', 'Диетический', 'Острый'],
        optionsUz: ['Erkaklar uchun', 'Tropik ta\'m', 'Dietik', 'Achchiq'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'bar-004',
    sku: 'STR-40-CAR',
    name: 'Strobar Карамель 40г',
    nameUz: 'Strobar Karamel 40g',
    category: 'bars',
    brand: 'Strobar',
    weight: '40г',
    price: 6000,
    usp: 'Тягучая карамель внутри',
    uspUz: 'Ichida cho\'ziladigan karamel',
    targetAudience: 'Сладкоежки',
    targetAudienceUz: 'Shirinlik ixlosmandlari',
    salesScript: 'Для настоящих сладкоежек! Тягучая карамель, которая тает во рту.',
    salesScriptUz: 'Haqiqiy shirinlik ixlosmandlari uchun! Og\'izda eriydigan cho\'ziladigan karamel.',
    shelfLife: '9 месяцев',
    storageConditions: 'При температуре от +5 до +22°C',
    storageConditionsUz: '+5 dan +22°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Особенность Strobar Карамель?',
        questionUz: 'Strobar Karamel xususiyati?',
        options: ['Без карамели', 'Тягучая карамель внутри', 'Острый', 'С орехами'],
        optionsUz: ['Karamelsiz', 'Ichida cho\'ziladigan karamel', 'Achchiq', 'Yong\'oqli'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Strobar Карамель?',
        questionUz: 'Strobar Karamel narxi?',
        options: ['5 500 сум', '6 000 сум', '6 500 сум', '7 000 сум'],
        optionsUz: ['5 500 so\'m', '6 000 so\'m', '6 500 so\'m', '7 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Для кого этот батончик?',
        questionUz: 'Bu batoncik kim uchun?',
        options: ['Спортсмены', 'Сладкоежки', 'Диабетики', 'Вегетарианцы'],
        optionsUz: ['Sportchilar', 'Shirinlik ixlosmandlari', 'Diabetiklar', 'Vegetarianlar'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Цена одинакова с классическим?',
        questionUz: 'Klassik bilan narxi bir xilmi?',
        options: ['Нет, дороже', 'Да, одинаковая', 'Нет, дешевле', 'Зависит от магазина'],
        optionsUz: ['Yo\'q, qimmatroq', 'Ha, bir xil', 'Yo\'q, arzonroq', 'Do\'konga bog\'liq'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Для спортсменов', 'Для сладкоежек', 'Диетический', 'С белком'],
        optionsUz: ['Sportchilar uchun', 'Shirinlik ixlosmandlari uchun', 'Dietik', 'Oqsilli'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'bar-005',
    sku: 'STR-25-MIN',
    name: 'Strobar Mini 25г',
    nameUz: 'Strobar Mini 25g',
    category: 'bars',
    brand: 'Strobar',
    weight: '25г',
    price: 3500,
    usp: 'Маленький размер — большое удовольствие',
    uspUz: 'Kichik o\'lcham — katta zavq',
    targetAudience: 'Дети, экономные покупатели',
    targetAudienceUz: 'Bolalar, tejamkor xaridorlar',
    salesScript: 'Идеальный размер для детей! Маленькая радость по маленькой цене.',
    salesScriptUz: 'Bolalar uchun ideal o\'lcham! Kichik narxda kichik quvonch.',
    shelfLife: '9 месяцев',
    storageConditions: 'При температуре от +5 до +22°C',
    storageConditionsUz: '+5 dan +22°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Вес Strobar Mini?',
        questionUz: 'Strobar Mini vazni?',
        options: ['20г', '25г', '30г', '35г'],
        optionsUz: ['20g', '25g', '30g', '35g'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Strobar Mini?',
        questionUz: 'Strobar Mini narxi?',
        options: ['3 000 сум', '3 500 сум', '4 000 сум', '4 500 сум'],
        optionsUz: ['3 000 so\'m', '3 500 so\'m', '4 000 so\'m', '4 500 so\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Для кого Strobar Mini?',
        questionUz: 'Strobar Mini kim uchun?',
        options: ['Спортсмены', 'Дети', 'Гурманы', 'Диетики'],
        optionsUz: ['Sportchilar', 'Bolalar', 'Gurmanlar', 'Parhez tutuvchilar'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Преимущество маленького размера?',
        questionUz: 'Kichik o\'lchamning afzalligi?',
        options: ['Больше калорий', 'Доступная цена', 'Острее вкус', 'Дольше хранится'],
        optionsUz: ['Ko\'proq kaloriya', 'Arzon narx', 'Achchiqroq ta\'m', 'Uzoqroq saqlanadi'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Большая порция', 'Маленькая радость по маленькой цене', 'Премиум качество', 'Для взрослых'],
        optionsUz: ['Katta porsiya', 'Kichik narxda kichik quvonch', 'Premium sifat', 'Kattalar uchun'],
        correctAnswer: 1
      }
    ]
  },

  // === ПЕЧЕНЬЕ (8 продуктов) ===
  {
    id: 'cook-001',
    sku: 'VEL-200-CLS',
    name: 'Velona Классик 200г',
    nameUz: 'Velona Klassik 200g',
    category: 'cookies',
    brand: 'Velona',
    weight: '200г',
    price: 15000,
    usp: 'Хрустящее печенье из натуральных ингредиентов',
    uspUz: 'Tabiiy ingredientlardan qarsildoq pechene',
    targetAudience: 'Семьи, любители чаепития',
    targetAudienceUz: 'Oilalar, choy ichish ixlosmandlari',
    salesScript: 'К чаю — самое то! Хрустящее печенье, которое тает во рту.',
    salesScriptUz: 'Choyga eng zo\'ri! Og\'izda eriydigan qarsildoq pechene.',
    shelfLife: '6 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    isBestseller: true,
    quiz: [
      {
        id: 1,
        question: 'Особенность Velona Классик?',
        questionUz: 'Velona Klassik xususiyati?',
        options: ['Мягкое', 'Хрустящее из натуральных ингредиентов', 'Острое', 'С начинкой'],
        optionsUz: ['Yumshoq', 'Tabiiy ingredientlardan qarsildoq', 'Achchiq', 'Ichli'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Вес Velona Классик?',
        questionUz: 'Velona Klassik vazni?',
        options: ['150г', '200г', '250г', '300г'],
        optionsUz: ['150g', '200g', '250g', '300g'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Velona Классик?',
        questionUz: 'Velona Klassik narxi?',
        options: ['12 000 сум', '15 000 сум', '18 000 сум', '20 000 сум'],
        optionsUz: ['12 000 so\'m', '15 000 so\'m', '18 000 so\'m', '20 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Velona — бестселлер?',
        questionUz: 'Velona — bestsellermi?',
        options: ['Нет', 'Да', 'Снят с продажи', 'Новинка'],
        optionsUz: ['Yo\'q', 'Ha', 'Sotuvdan olib tashlangan', 'Yangilik'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Срок годности?',
        questionUz: 'Saqlash muddati?',
        options: ['3 месяца', '6 месяцев', '9 месяцев', '12 месяцев'],
        optionsUz: ['3 oy', '6 oy', '9 oy', '12 oy'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'cook-002',
    sku: 'VEL-200-CHO',
    name: 'Velona с шоколадом 200г',
    nameUz: 'Velona shokolad bilan 200g',
    category: 'cookies',
    brand: 'Velona',
    weight: '200г',
    price: 18000,
    usp: 'Кусочки натурального шоколада',
    uspUz: 'Tabiiy shokolad bo\'laklari',
    targetAudience: 'Любители шоколада',
    targetAudienceUz: 'Shokolad ixlosmandlari',
    salesScript: 'Двойное удовольствие: хрустящее печенье + настоящий шоколад!',
    salesScriptUz: 'Ikki barobar zavq: qarsildoq pechene + haqiqiy shokolad!',
    shelfLife: '6 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Что добавлено в Velona с шоколадом?',
        questionUz: 'Velona shokolad bilan ga nima qo\'shilgan?',
        options: ['Орехи', 'Кусочки шоколада', 'Изюм', 'Карамель'],
        optionsUz: ['Yong\'oq', 'Shokolad bo\'laklari', 'Mayiz', 'Karamel'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Velona с шоколадом?',
        questionUz: 'Velona shokolad bilan narxi?',
        options: ['15 000 сум', '18 000 сум', '20 000 сум', '22 000 сум'],
        optionsUz: ['15 000 so\'m', '18 000 so\'m', '20 000 so\'m', '22 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Разница в цене с классическим?',
        questionUz: 'Klassik bilan narx farqi?',
        options: ['Одинаковая', 'На 3 000 сум дороже', 'На 5 000 сум дороже', 'Дешевле'],
        optionsUz: ['Bir xil', '3 000 so\'m qimmatroq', '5 000 so\'m qimmatroq', 'Arzonroq'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Диетики', 'Любители шоколада', 'Спортсмены', 'Вегетарианцы'],
        optionsUz: ['Parhez tutuvchilar', 'Shokolad ixlosmandlari', 'Sportchilar', 'Vegetarianlar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Диетическое', 'Двойное удовольствие', 'Для детей', 'Острое'],
        optionsUz: ['Dietik', 'Ikki barobar zavq', 'Bolalar uchun', 'Achchiq'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'cook-003',
    sku: 'VEL-200-OAT',
    name: 'Velona Овсяное 200г',
    nameUz: 'Velona Suli 200g',
    category: 'cookies',
    brand: 'Velona',
    weight: '200г',
    price: 16000,
    usp: 'Полезное овсяное печенье',
    uspUz: 'Foydali suli pechenesi',
    targetAudience: 'Следящие за здоровьем',
    targetAudienceUz: 'Sog\'liqni kuzatuvchilar',
    salesScript: 'Вкусно и полезно! Овсянка даёт энергию без лишних калорий.',
    salesScriptUz: 'Mazali va foydali! Suli ortiqcha kaloriyasiz energiya beradi.',
    shelfLife: '6 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Из чего сделано Velona Овсяное?',
        questionUz: 'Velona Suli nimadan qilingan?',
        options: ['Пшеница', 'Овсянка', 'Рис', 'Кукуруза'],
        optionsUz: ['Bug\'doy', 'Suli', 'Guruch', 'Makkajo\'xori'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Преимущество овсяного печенья?',
        questionUz: 'Suli pechenesining afzalligi?',
        options: ['Очень сладкое', 'Полезное, даёт энергию', 'Острое', 'Большой размер'],
        optionsUz: ['Juda shirin', 'Foydali, energiya beradi', 'Achchiq', 'Katta o\'lcham'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Velona Овсяное?',
        questionUz: 'Velona Suli narxi?',
        options: ['14 000 сум', '16 000 сум', '18 000 сум', '20 000 сум'],
        optionsUz: ['14 000 so\'m', '16 000 so\'m', '18 000 so\'m', '20 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Для кого это печенье?',
        questionUz: 'Bu pechene kim uchun?',
        options: ['Сладкоежки', 'Следящие за здоровьем', 'Дети', 'Спортсмены'],
        optionsUz: ['Shirinlik ixlosmandlari', 'Sog\'liqni kuzatuvchilar', 'Bolalar', 'Sportchilar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Самое сладкое', 'Вкусно и полезно', 'Для детей', 'Премиум'],
        optionsUz: ['Eng shirin', 'Mazali va foydali', 'Bolalar uchun', 'Premium'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'cook-004',
    sku: 'TB-150-CRM',
    name: 'Two Bite Крем 150г',
    nameUz: 'Two Bite Krem 150g',
    category: 'cookies',
    brand: 'Two Bite',
    weight: '150г',
    price: 14000,
    usp: 'Два печенья с кремом посередине',
    uspUz: 'O\'rtasida kremli ikkita pechene',
    targetAudience: 'Дети, молодёжь',
    targetAudienceUz: 'Bolalar, yoshlar',
    salesScript: 'Два в одном! Хрустящее печенье с нежным кремом — любимец детей.',
    salesScriptUz: 'Bittada ikkita! Nozik kremli qarsildoq pechene — bolalarning sevimchasi.',
    shelfLife: '6 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Особенность Two Bite?',
        questionUz: 'Two Bite xususiyati?',
        options: ['Одно печенье', 'Два печенья с кремом', 'Без крема', 'Острое'],
        optionsUz: ['Bitta pechene', 'Kremli ikkita pechene', 'Kremsiz', 'Achchiq'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Вес Two Bite Крем?',
        questionUz: 'Two Bite Krem vazni?',
        options: ['100г', '150г', '200г', '250г'],
        optionsUz: ['100g', '150g', '200g', '250g'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Two Bite Крем?',
        questionUz: 'Two Bite Krem narxi?',
        options: ['12 000 сум', '14 000 сум', '16 000 сум', '18 000 сум'],
        optionsUz: ['12 000 so\'m', '14 000 so\'m', '16 000 so\'m', '18 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Пожилые', 'Дети и молодёжь', 'Диетики', 'Спортсмены'],
        optionsUz: ['Keksalar', 'Bolalar va yoshlar', 'Parhez tutuvchilar', 'Sportchilar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'К какому бренду относится?',
        questionUz: 'Qaysi brendga tegishli?',
        options: ['Velona', 'Two Bite', 'Strobar', 'Chococream'],
        optionsUz: ['Velona', 'Two Bite', 'Strobar', 'Chococream'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'cook-005',
    sku: 'TB-150-CHO',
    name: 'Two Bite Шоколад 150г',
    nameUz: 'Two Bite Shokolad 150g',
    category: 'cookies',
    brand: 'Two Bite',
    weight: '150г',
    price: 15000,
    usp: 'Шоколадный крем между печеньями',
    uspUz: 'Pecheneler orasida shokoladli krem',
    targetAudience: 'Шокоголики',
    targetAudienceUz: 'Shokoladxo\'rlar',
    salesScript: 'Тройной шоколад: шоколадное печенье + шоколадный крем + шоколадная глазурь!',
    salesScriptUz: 'Uch karra shokolad: shokoladli pechene + shokoladli krem + shokoladli glazur!',
    shelfLife: '6 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    isNew: true,
    quiz: [
      {
        id: 1,
        question: 'Сколько шоколада в Two Bite Шоколад?',
        questionUz: 'Two Bite Shokolad da qancha shokolad bor?',
        options: ['Один элемент', 'Тройной шоколад', 'Без шоколада', 'Только глазурь'],
        optionsUz: ['Bitta element', 'Uch karra shokolad', 'Shokoladsiz', 'Faqat glazur'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Это новинка?',
        questionUz: 'Bu yangi mahsulotmi?',
        options: ['Нет', 'Да', 'Классика', 'Снят с продажи'],
        optionsUz: ['Yo\'q', 'Ha', 'Klassika', 'Sotuvdan olib tashlangan'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена Two Bite Шоколад?',
        questionUz: 'Two Bite Shokolad narxi?',
        options: ['14 000 сум', '15 000 сум', '16 000 сум', '17 000 сум'],
        optionsUz: ['14 000 so\'m', '15 000 so\'m', '16 000 so\'m', '17 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Диетики', 'Шокоголики', 'Вегетарианцы', 'Спортсмены'],
        optionsUz: ['Parhez tutuvchilar', 'Shokoladxo\'rlar', 'Vegetarianlar', 'Sportchilar'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Диетическое', 'Тройной шоколад', 'Без сахара', 'Для детей'],
        optionsUz: ['Dietik', 'Uch karra shokolad', 'Shakarsiz', 'Bolalar uchun'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'cook-006',
    sku: 'TB-150-VAN',
    name: 'Two Bite Ваниль 150г',
    nameUz: 'Two Bite Vanil 150g',
    category: 'cookies',
    brand: 'Two Bite',
    weight: '150г',
    price: 14000,
    usp: 'Нежный ванильный крем',
    uspUz: 'Nozik vanilli krem',
    targetAudience: 'Любители классики',
    targetAudienceUz: 'Klassika ixlosmandlari',
    salesScript: 'Классика вкуса! Нежная ваниль — выбор настоящих ценителей.',
    salesScriptUz: 'Ta\'m klassikasi! Nozik vanil — haqiqiy bilimdonlar tanlovi.',
    shelfLife: '6 месяцев',
    storageConditions: 'В сухом месте при температуре до +25°C',
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda',
    quiz: [
      {
        id: 1,
        question: 'Вкус крема в Two Bite Ваниль?',
        questionUz: 'Two Bite Vanil dagi krem ta\'mi?',
        options: ['Шоколад', 'Ваниль', 'Карамель', 'Клубника'],
        optionsUz: ['Shokolad', 'Vanil', 'Karamel', 'Qulupnay'],
        correctAnswer: 1
      },
      {
        id: 2,
        question: 'Цена Two Bite Ваниль?',
        questionUz: 'Two Bite Vanil narxi?',
        options: ['12 000 сум', '14 000 сум', '16 000 сум', '18 000 сум'],
        optionsUz: ['12 000 so\'m', '14 000 so\'m', '16 000 so\'m', '18 000 so\'m'],
        correctAnswer: 1
      },
      {
        id: 3,
        question: 'Цена одинакова с кремовым?',
        questionUz: 'Kremli bilan narxi bir xilmi?',
        options: ['Нет, дороже', 'Да, одинаковая', 'Нет, дешевле', 'Зависит от магазина'],
        optionsUz: ['Yo\'q, qimmatroq', 'Ha, bir xil', 'Yo\'q, arzonroq', 'Do\'konga bog\'liq'],
        correctAnswer: 1
      },
      {
        id: 4,
        question: 'Целевая аудитория?',
        questionUz: 'Maqsadli auditoriya?',
        options: ['Экспериментаторы', 'Любители классики', 'Диетики', 'Острых вкусов'],
        optionsUz: ['Eksperimentatorlar', 'Klassika ixlosmandlari', 'Parhez tutuvchilar', 'Achchiq ta\'m'],
        correctAnswer: 1
      },
      {
        id: 5,
        question: 'Скрипт продаж?',
        questionUz: 'Savdo skripti?',
        options: ['Новинка', 'Классика вкуса', 'Диетическое', 'Острое'],
        optionsUz: ['Yangilik', 'Ta\'m klassikasi', 'Dietik', 'Achchiq'],
        correctAnswer: 1
      }
    ]
  }
];

// ===========================================
// ФУНКЦИИ ПОМОЩНИКИ
// ===========================================

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter(p => p.category === category);
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getBestsellers(): Product[] {
  return products.filter(p => p.isBestseller);
}

export function getNewProducts(): Product[] {
  return products.filter(p => p.isNew);
}

export function getRandomProducts(count: number): Product[] {
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getCategoryInfo(category: ProductCategory): ProductCategoryInfo | undefined {
  return productCategories.find(c => c.id === category);
}

// ===========================================
// КОНСТАНТЫ
// ===========================================

export const TOTAL_PRODUCTS = products.length; // 26
export const QUIZ_PASS_THRESHOLD = 4; // 4 из 5 правильных для разблокировки
