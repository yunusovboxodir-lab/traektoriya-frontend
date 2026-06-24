// Данные «Зала славы — Кубок N'Medov 2025». Историческая запись, неизменна.
// Сгенерировано из Google Sheets (вкладка «Итоги Кубка») скриптом
// _temp/championship_2025/gen_react_data.py — править там, не здесь.

export interface HofTeam {
  rank: number;
  team: string;
  supervisor: string;
  dealer: string;
  months: (number | null)[];
  total: number | null;
}

export interface HofCategory {
  name_ru: string;
  name_uz: string;
  teams: HofTeam[];
}

export interface HofData {
  year: number;
  categories: HofCategory[];
}

export const CHAMPIONSHIP_2025: HofData = {
  "year": 2025,
  "categories": [
    {
      "name_ru": "Общий зачёт (KPI / Dashboard)",
      "name_uz": "Umumiy hisob (KPI / Dashboard)",
      "teams": [
        {
          "rank": 1,
          "team": "Карши",
          "supervisor": "Лилия",
          "dealer": "Алишер.Карши",
          "months": [
            87,
            81,
            81,
            87
          ],
          "total": 84
        },
        {
          "rank": 2,
          "team": "Андижон 2",
          "supervisor": "Тохиржонов Абубакир",
          "dealer": "Алишер.Андижон",
          "months": [
            86,
            72,
            73,
            92
          ],
          "total": 81
        },
        {
          "rank": 3,
          "team": "Ташкент 32",
          "supervisor": "Nigina-Super",
          "dealer": "Умурзок2.Таш",
          "months": [
            71,
            89,
            96,
            68
          ],
          "total": 81
        },
        {
          "rank": 4,
          "team": "Нукус",
          "supervisor": "SALAMAT",
          "dealer": "Икром.Нукус",
          "months": [
            70,
            91,
            94,
            63
          ],
          "total": 80
        },
        {
          "rank": 5,
          "team": "Ташкент 31",
          "supervisor": "Azam-Super",
          "dealer": "Умурзок.Таш",
          "months": [
            54,
            84,
            97,
            72
          ],
          "total": 77
        },
        {
          "rank": 6,
          "team": "Самарканд 3",
          "supervisor": "Хужанов Саид",
          "dealer": "Хуршид.Самарқанд",
          "months": [
            81,
            75,
            80,
            51
          ],
          "total": 72
        },
        {
          "rank": 7,
          "team": "Гулистон 3",
          "supervisor": "Алимова Феруза",
          "dealer": "Александр.Гулистон",
          "months": [
            77,
            71,
            76,
            60
          ],
          "total": 71
        },
        {
          "rank": 8,
          "team": "Хоразм 1",
          "supervisor": "MASHARIPOV SAN'AT",
          "dealer": "Жафар.Хоразм",
          "months": [
            86,
            90,
            78,
            68
          ],
          "total": 70
        },
        {
          "rank": 9,
          "team": "Карши 2",
          "supervisor": "Orzigul",
          "dealer": "Алибек.Карши",
          "months": [
            61,
            83,
            68,
            67
          ],
          "total": 70
        },
        {
          "rank": 10,
          "team": "Андижон 1",
          "supervisor": "Рузибоев Жасурбек",
          "dealer": "Алишер.Андижон",
          "months": [
            70,
            69,
            85,
            55
          ],
          "total": 70
        },
        {
          "rank": 11,
          "team": "Хоразм 2",
          "supervisor": "Rustamov Siroj",
          "dealer": "Жафар.Хоразм",
          "months": [
            89,
            80,
            78,
            69
          ],
          "total": 69
        },
        {
          "rank": 12,
          "team": "Қўқон",
          "supervisor": "Маматов Хожиакбар",
          "dealer": "Бахтиёр.Қўқон",
          "months": [
            62,
            75,
            80,
            54
          ],
          "total": 68
        },
        {
          "rank": 13,
          "team": "Нукус 2",
          "supervisor": "AMINOV XUSNIDDIN",
          "dealer": "Саламат.Нукус",
          "months": [
            59,
            75,
            91,
            38
          ],
          "total": 66
        },
        {
          "rank": 14,
          "team": "Қўқон 2",
          "supervisor": "Муминов Умиджон",
          "dealer": "Бахтиёр.Қўқон 2",
          "months": [
            73,
            67,
            71,
            42
          ],
          "total": 63
        },
        {
          "rank": 15,
          "team": "Самарканд",
          "supervisor": "Альмира",
          "dealer": "Xалим.Самарканд",
          "months": [
            65,
            65,
            83,
            36
          ],
          "total": 62
        },
        {
          "rank": 16,
          "team": "Наманган",
          "supervisor": "Бобур",
          "dealer": "Азимхон.Наманган",
          "months": [
            75,
            80,
            53,
            35
          ],
          "total": 61
        },
        {
          "rank": 17,
          "team": "Фергана",
          "supervisor": "Холматов Мухаммадюсуф",
          "dealer": "Абдумухтор.Фергана",
          "months": [
            58,
            77,
            56,
            49
          ],
          "total": 60
        },
        {
          "rank": 18,
          "team": "Бухоро 2",
          "supervisor": "СВР2 Раджабов Бекзод",
          "dealer": "Жонибек.Бухоро",
          "months": [
            74,
            74,
            56,
            28
          ],
          "total": 58
        },
        {
          "rank": 19,
          "team": "Термез",
          "supervisor": "Elbek Termiz",
          "dealer": "Шерзод.Термез",
          "months": [
            49,
            72,
            77,
            26
          ],
          "total": 56
        },
        {
          "rank": 20,
          "team": "Ташкент 22",
          "supervisor": "DILAFRUZ-SUPER",
          "dealer": "Умид.Таш.обл",
          "months": [
            49,
            66,
            56,
            44
          ],
          "total": 54
        },
        {
          "rank": 21,
          "team": "Ташкент 21",
          "supervisor": "DILAFRUZ-SUPER",
          "dealer": "Умид.Таш",
          "months": [
            60,
            54,
            42,
            44
          ],
          "total": 50
        },
        {
          "rank": 22,
          "team": "Навои",
          "supervisor": "Сарвар",
          "dealer": "Бобур.Навои",
          "months": [
            60,
            64,
            56,
            21
          ],
          "total": 50
        },
        {
          "rank": 23,
          "team": "Гулистон 2",
          "supervisor": "Sherzod",
          "dealer": "Элмурод.Гулистон",
          "months": [
            46,
            61,
            54,
            36
          ],
          "total": 49
        },
        {
          "rank": 24,
          "team": "Денов",
          "supervisor": "Поёнов Шохрух",
          "dealer": "Шахрёр.Денов",
          "months": [
            64,
            60,
            29,
            32
          ],
          "total": 46
        },
        {
          "rank": 25,
          "team": "Жиззах 2",
          "supervisor": "Anvar Ikromov",
          "dealer": "Шодёр.Жиззах",
          "months": [
            64,
            55,
            27,
            29
          ],
          "total": 44
        },
        {
          "rank": 26,
          "team": "Таш.обл 2",
          "supervisor": "Ахмаджон",
          "dealer": "Абдусамат.Таш.Обл",
          "months": [
            34,
            48,
            48,
            31
          ],
          "total": 40
        },
        {
          "rank": 27,
          "team": "Наманган 3",
          "supervisor": "Sardor",
          "dealer": "Мухаммаджон1.Наманган",
          "months": [
            45,
            57,
            37,
            23
          ],
          "total": 40
        },
        {
          "rank": 28,
          "team": "Шахрисабз",
          "supervisor": "Зухриддин",
          "dealer": "Алибек.Шахрисабз",
          "months": [
            50,
            42,
            30,
            31
          ],
          "total": 38
        },
        {
          "rank": 29,
          "team": "Таш.обл",
          "supervisor": "Farruh Supervizor",
          "dealer": "Бобомурод.Таш.обл",
          "months": [
            38,
            29,
            24,
            28
          ],
          "total": 30
        },
        {
          "rank": 30,
          "team": "Жиззах 4",
          "supervisor": "Anvar Ikromov",
          "dealer": "Шодёр.Жиззах 2",
          "months": [
            28,
            28,
            29,
            29
          ],
          "total": 28
        }
      ]
    },
    {
      "name_ru": "Обучения",
      "name_uz": "O'qish",
      "teams": [
        {
          "rank": 1,
          "team": "Карши",
          "supervisor": "Лилия",
          "dealer": "Алишер.Карши",
          "months": [
            87,
            85,
            96,
            74
          ],
          "total": 86
        },
        {
          "rank": 2,
          "team": "Андижон 2",
          "supervisor": "Тохиржонов Абубакир",
          "dealer": "Алишер.Андижон",
          "months": [
            80,
            81,
            81,
            96
          ],
          "total": 85
        },
        {
          "rank": 3,
          "team": "Хоразм 1",
          "supervisor": "MASHARIPOV SAN'AT",
          "dealer": "Жафар.Хоразм",
          "months": [
            78,
            82,
            97,
            71
          ],
          "total": 82
        },
        {
          "rank": 4,
          "team": "Нукус",
          "supervisor": "SALAMAT",
          "dealer": "Икром.Нукус",
          "months": [
            70,
            81,
            77,
            90
          ],
          "total": 80
        },
        {
          "rank": 5,
          "team": "Ташкент 31",
          "supervisor": "Azam-Super",
          "dealer": "Умурзок.Таш",
          "months": [
            73,
            76,
            98,
            72
          ],
          "total": 80
        },
        {
          "rank": 6,
          "team": "Хоразм 2",
          "supervisor": "Rustamov Siroj",
          "dealer": "Жафар.Хоразм",
          "months": [
            74,
            75,
            97,
            69
          ],
          "total": 79
        },
        {
          "rank": 7,
          "team": "Ташкент 32",
          "supervisor": "Nigina-Super",
          "dealer": "Умурзок2.Таш",
          "months": [
            71,
            79,
            98,
            68
          ],
          "total": 79
        },
        {
          "rank": 8,
          "team": "Самарканд 3",
          "supervisor": "Хужанов Саид",
          "dealer": "Хуршид.Самарқанд",
          "months": [
            75,
            76,
            97,
            65
          ],
          "total": 78
        },
        {
          "rank": 9,
          "team": "Андижон 1",
          "supervisor": "Рузибоев Жасурбек",
          "dealer": "Алишер.Андижон",
          "months": [
            73,
            77,
            97,
            55
          ],
          "total": 76
        },
        {
          "rank": 10,
          "team": "Гулистон 3",
          "supervisor": "Алимова Феруза",
          "dealer": "Александр.Гулистон",
          "months": [
            82,
            73,
            97,
            45
          ],
          "total": 74
        },
        {
          "rank": 11,
          "team": "Самарканд",
          "supervisor": "Альмира",
          "dealer": "Xалим.Самарканд",
          "months": [
            57,
            79,
            96,
            48
          ],
          "total": 70
        },
        {
          "rank": 12,
          "team": "Қўқон",
          "supervisor": "Маматов Хожиакбар",
          "dealer": "Бахтиёр.Қўқон",
          "months": [
            55,
            52,
            96,
            70
          ],
          "total": 68
        },
        {
          "rank": 13,
          "team": "Қўқон 2",
          "supervisor": "Муминов Умиджон",
          "dealer": "Бахтиёр.Қўқон 2",
          "months": [
            61,
            60,
            93,
            50
          ],
          "total": 66
        },
        {
          "rank": 14,
          "team": "Фергана",
          "supervisor": "Холматов Мухаммадюсуф",
          "dealer": "Абдумухтор.Фергана",
          "months": [
            55,
            76,
            69,
            52
          ],
          "total": 63
        },
        {
          "rank": 15,
          "team": "Бухоро 2",
          "supervisor": "СВР2 Раджабов Бекзод",
          "dealer": "Жонибек.Бухоро",
          "months": [
            61,
            74,
            97,
            0
          ],
          "total": 58
        },
        {
          "rank": 16,
          "team": "Термез",
          "supervisor": "Elbek Termiz",
          "dealer": "Шерзод.Термез",
          "months": [
            68,
            68,
            94,
            0
          ],
          "total": 57
        },
        {
          "rank": 17,
          "team": "Навои",
          "supervisor": "Сарвар",
          "dealer": "Бобур.Навои",
          "months": [
            44,
            58,
            94,
            0
          ],
          "total": 49
        },
        {
          "rank": 18,
          "team": "Карши 2",
          "supervisor": "Orzigul",
          "dealer": "Алибек.Карши",
          "months": [
            32,
            68,
            39,
            40
          ],
          "total": 45
        },
        {
          "rank": 19,
          "team": "Нукус 2",
          "supervisor": "AMINOV XUSNIDDIN",
          "dealer": "Саламат.Нукус",
          "months": [
            0,
            75,
            97,
            0
          ],
          "total": 43
        },
        {
          "rank": 20,
          "team": "Наманган",
          "supervisor": "Бобур",
          "dealer": "Азимхон.Наманган",
          "months": [
            67,
            83,
            12,
            0
          ],
          "total": 40
        },
        {
          "rank": 21,
          "team": "Ташкент 22",
          "supervisor": "DILAFRUZ-SUPER",
          "dealer": "Умид.Таш.обл",
          "months": [
            44,
            46,
            16,
            41
          ],
          "total": 37
        },
        {
          "rank": 22,
          "team": "Ташкент 21",
          "supervisor": "DILAFRUZ-SUPER",
          "dealer": "Умид.Таш",
          "months": [
            44,
            46,
            16,
            41
          ],
          "total": 37
        },
        {
          "rank": 23,
          "team": "Наманган 3",
          "supervisor": "Sardor",
          "dealer": "Мухаммаджон1.Наманган",
          "months": [
            29,
            49,
            0,
            0
          ],
          "total": 19
        },
        {
          "rank": 24,
          "team": "Жиззах 2",
          "supervisor": "Anvar Ikromov",
          "dealer": "Шодёр.Жиззах",
          "months": [
            44,
            32,
            0,
            0
          ],
          "total": 19
        },
        {
          "rank": 25,
          "team": "Денов",
          "supervisor": "Поёнов Шохрух",
          "dealer": "Шахрёр.Денов",
          "months": [
            38,
            37,
            0,
            0
          ],
          "total": 19
        },
        {
          "rank": 26,
          "team": "Гулистон 2",
          "supervisor": "Sherzod",
          "dealer": "Элмурод.Гулистон",
          "months": [
            35,
            39,
            0,
            0
          ],
          "total": 19
        },
        {
          "rank": 27,
          "team": "Таш.обл 2",
          "supervisor": "Ахмаджон",
          "dealer": "Абдусамат.Таш.Обл",
          "months": [
            25,
            21,
            7,
            4
          ],
          "total": 14
        },
        {
          "rank": 28,
          "team": "Шахрисабз",
          "supervisor": "Зухриддин",
          "dealer": "Алибек.Шахрисабз",
          "months": [
            31,
            0,
            0,
            0
          ],
          "total": 8
        },
        {
          "rank": 29,
          "team": "Таш.обл",
          "supervisor": "Farruh Supervizor",
          "dealer": "Бобомурод.Таш.обл",
          "months": [
            23,
            0,
            0,
            0
          ],
          "total": 6
        },
        {
          "rank": 30,
          "team": "Жиззах 4",
          "supervisor": "Anvar Ikromov",
          "dealer": "Шодёр.Жиззах 2",
          "months": [
            0,
            0,
            0,
            0
          ],
          "total": 0
        }
      ]
    }
  ]
};
