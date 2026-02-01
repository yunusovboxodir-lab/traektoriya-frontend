// ===========================================
// БИБЛИОТЕКА ПРОДУКТОВ N'MEDOV
// 30+ карточек продуктов для изучения
// ===========================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameUz: string;
  category: ProductCategory;
  brand: string;
  weight: string;
  price: number; // РРЦ в сумах
  image?: string;
  usp: string; // Уникальное торговое предложение
  uspUz: string;
  targetAudience: string;
  targetAudienceUz: string;
  salesScript: string; // Короткий скрипт продажи
  salesScriptUz: string;
  shelfLife: string; // Срок годности
  storageConditions: string;
  storageConditionsUz: string;
  isNew?: boolean;
  isBestseller?: boolean;
}

export type ProductCategory = 
  | 'chocolate_paste'  // Шоколадная паста
  | 'noodles'          // Лапша
  | 'bars'             // Батончики
  | 'cookies';         // Печенье

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
    titleUz: 'Batончикlar',
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
// ПРОДУКТЫ N'MEDOV
// ===========================================

export const products: Product[] = [
  // === ШОКОЛАДНАЯ ПАСТА ===
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
    isBestseller: true
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
    storageConditionsUz: '+5 dan +25°C gacha haroratda'
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
    isNew: true
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
    storageConditionsUz: '+5 dan +25°C gacha haroratda'
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
    storageConditionsUz: '+5 dan +25°C gacha haroratda'
  },

  // === ЛАПША ===
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
    isBestseller: true
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    isNew: true
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
  },

  // === БАТОНЧИКИ ===
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
    isBestseller: true
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
    storageConditionsUz: '+5 dan +22°C gacha haroratda'
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
    isNew: true
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
    storageConditionsUz: '+5 dan +22°C gacha haroratda'
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
    storageConditionsUz: '+5 dan +22°C gacha haroratda'
  },

  // === ПЕЧЕНЬЕ ===
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
    isBestseller: true
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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
    isNew: true
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
    storageConditionsUz: 'Quruq joyda +25°C gacha haroratda'
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

// Статистика
export const productStats = {
  totalProducts: products.length,
  categories: productCategories.length,
  bestsellers: products.filter(p => p.isBestseller).length,
  newProducts: products.filter(p => p.isNew).length
};
