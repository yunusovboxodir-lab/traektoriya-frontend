"""
Сервис Planogram AI для анализа выкладки товаров N'Medov
Использует Anthropic Claude Sonnet 4.5 Vision API
Версия 3.0 - с точными описаниями SKU на основе реального каталога
"""
import json
import base64
from datetime import datetime
from typing import Optional, Dict, Any, List
from anthropic import AsyncAnthropic
from loguru import logger

from app.core.config import settings


# ==================== ТОЧНЫЕ ОПИСАНИЯ SKU N'MEDOV ====================
# Данные из официального каталога https://nmedov.uz/ru/catalog-2/

SKU_CATALOG = {
    # ============ ШОКОЛАДНЫЕ ПАСТЫ ============
    "chococream": {
        "brand": "Chococream",
        "category": "chocolate_paste",
        "sku_list": [
            "Chococream 200", "Chococream 300", "Chococream 400",
            "Chococream 400 лодка", "Chococream 400 круглая",
            "Chococream 500", "Chococream 600", "Chococream 900"
        ],
        "visual_description": """
▶ CHOCOCREAM - КРАСНЫЙ ПЛАСТИКОВЫЙ КОНТЕЙНЕР
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Форма: ПРЯМОУГОЛЬНЫЙ пластиковый контейнер (НЕ стеклянная банка!)
• Цвет упаковки: КРАСНЫЙ корпус с красной крышкой
• Надпись: "Chococream" БЕЛЫМИ буквами на красном фоне
• На этикетке: изображение шоколадной пасты, орехи, ложка
• Размеры граммажа: 200г, 300г, 400г, 500г, 600г, 900г
• КЛЮЧЕВОЕ ОТЛИЧИЕ: слово "cream" в названии (Choco-CREAM)
• Контейнер может быть прямоугольный, "лодка" или круглый

❌ НЕ ПУТАТЬ С: Nutella (стеклянная банка), другими пастами в банках
"""
    },
    
    "chocotella": {
        "brand": "Chocotella",
        "category": "chocolate_paste",
        "sku_list": ["Chocotella Duo", "Chocotella Dark"],
        "visual_description": """
▶ CHOCOTELLA - СТЕКЛЯННАЯ БАНКА (КАК NUTELLA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Форма: СТЕКЛЯННАЯ банка (похожа на Nutella!)
• Крышка: БЕЛАЯ или СВЕТЛАЯ пластиковая
• Надпись: "Chocotella" на этикетке
• Версии: Duo (два вкуса), Dark (тёмный шоколад)
• Этикетка: красно-коричневые тона, изображение пасты
• КЛЮЧЕВОЕ ОТЛИЧИЕ: слово "tella" в названии (Choco-TELLA)

❌ НЕ ПУТАТЬ С: Nutella (у Nutella надпись "Nutella", у нас "Chocotella")
"""
    },

    # ============ ЛАПША ============
    "hot_lunch": {
        "brand": "Hot Lunch",
        "category": "noodles",
        "sku_list": [
            "Hot Lunch куриный 50г", "Hot Lunch куриный 90г",
            "Hot Lunch острый куриный 50г", "Hot Lunch острый куриный 90г",
            "Hot Lunch говядина", "Hot Lunch острая говядина",
            "Hot Lunch говядина 90г", "Hot Lunch острая говядина 90г",
            "Hot Lunch Сочная говядина традиционная",
            "Hot Lunch Сочная говядина острая"
        ],
        "visual_description": """
▶ HOT LUNCH - ЛАПША В СТАКАНЕ И ПАКЕТАХ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Формат ПРЕМИУМ: пластиковый СТАКАН (тара) - верхняя полка
• Формат ЭКОНОМ: ПАКЕТ - нижние полки
• Цвета: КРАСНО-ОРАНЖЕВЫЙ дизайн, яркий
• Надпись: "HOT LUNCH" крупными буквами (две слова!)
• Логотип: изображение дымящейся чашки/тарелки лапши
• Граммаж: 50г (маленький), 90г (большой)
• Вкусы: куриный, острый куриный, говядина, острая говядина

❌ НЕ ПУТАТЬ С: Роллтон (жёлтая упаковка), Доширак, Big Bon
"""
    },
    
    "cheff": {
        "brand": "Cheff",
        "category": "noodles",
        "sku_list": [
            "Cheff с куриным соусом", "Cheff с острым куриным соусом",
            "Cheff с говяжьим соусом", "Cheff с острым говяжьим соусом"
        ],
        "visual_description": """
▶ CHEFF - ЛАПША С СОУСОМ В ПАКЕТЕ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Формат: ПАКЕТ (не стакан)
• Цвета: ЗЕЛЁНО-КРАСНЫЙ или БОРДОВЫЙ дизайн
• Надпись: "Cheff" (с двумя буквами F!)
• Логотип: изображение повара или колпак шеф-повара
• Особенность: ЛАПША С СОУСОМ (в комплекте пакетик соуса)
• Конкурент: Big Bon (тоже лапша с соусом)

❌ НЕ ПУТАТЬ С: Big Bon (чёрно-красная упаковка)
"""
    },

    # ============ БАТОНЧИКИ ============
    "strobar": {
        "brand": "Strobar",
        "category": "bars",
        "sku_list": ["Strobar классический", "Strobar x2"],
        "visual_description": """
▶ STROBAR - ШОКОЛАДНЫЙ БАТОНЧИК
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Формат: индивидуальный батончик в обёртке
• Цвет упаковки: ОРАНЖЕВЫЙ фон, яркий дизайн
• Надпись: "STROBAR" крупными буквами
• Версии: обычный и "x2" (двойной)
• Место продажи: ПРИКАССОВАЯ ЗОНА
• Ценовая категория: импульсная покупка (~5000-6000 сум)

❌ НЕ ПУТАТЬ С: Snickers, Mars, KitKat, Twix (другие бренды)
"""
    },

    # ============ ПЕЧЕНЬЕ И ВАФЛИ ============
    "velona": {
        "brand": "Velona",
        "category": "cookies",
        "sku_list": ["Velona венские вафли"],
        "visual_description": """
▶ VELONA - ВЕНСКИЕ ВАФЛИ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Формат: упаковка вафель
• Цвет: ЗЕЛЁНАЯ упаковка
• Надпись: "Velona"
• Категория: венские вафли, мягкие вафли
• Размещение: среди упакованных пряников, бисквитов, вафель
"""
    },
    
    "tvbox": {
        "brand": "Two Bite / Tvbox",
        "category": "cookies",
        "sku_list": ["Two Bite печенье"],
        "visual_description": """
▶ TWO BITE (TVBOX) - ПЕЧЕНЬЕ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Формат: упаковка печенья
• Надпись: "Two Bite" или "Tvbox"
• Размещение: среди упакованных пряников, бисквитов
"""
    },
}


# ============ КОНКУРЕНТЫ ============
COMPETITORS_CATALOG = {
    "chocolate_paste": {
        "brands": ["Nutella", "Milka", "Nuss Milk"],
        "how_to_distinguish": """
• Nutella: СТЕКЛЯННАЯ банка, БЕЛАЯ крышка, надпись "nutella" маленькими буквами
• Milka: ФИОЛЕТОВЫЙ цвет упаковки, корова на логотипе
• Nuss Milk: другой дизайн
"""
    },
    "noodles": {
        "brands": ["Роллтон", "Доширак", "Big Bon", "Мивина"],
        "how_to_distinguish": """
• Роллтон: ЖЁЛТАЯ упаковка
• Доширак: красно-жёлтая упаковка, корейский стиль
• Big Bon: ЧЁРНО-КРАСНАЯ упаковка, лапша с соусом
• Мивина: украинский бренд
"""
    },
    "bars": {
        "brands": ["Snickers", "Mars", "KitKat", "Twix", "Bounty", "Milky Way"],
        "how_to_distinguish": """
• Snickers: коричневая упаковка, арахис
• Mars: чёрно-красная упаковка
• KitKat: КРАСНАЯ упаковка, вафельный батончик
• Twix: золотистая упаковка, два батончика
"""
    },
}


# ============ ПРАВИЛА ОЦЕНКИ ПО КАТЕГОРИЯМ ============
EVALUATION_RULES = {
    "noodles": {
        "name": "Лапша быстрого приготовления",
        "our_brands": ["Hot Lunch", "Cheff"],
        "competitors": ["Роллтон", "Доширак", "Big Bon", "Мивина"],
        "kpi": {
            "hot_lunch_min_sos": 50,  # Доля Hot Lunch не менее 50%
            "cheff_min_sos": 20,       # Доля Cheff не менее 20%
        },
        "planogram_rules": [
            "ВЕРТИКАЛЬНАЯ: Сверху вниз — от премиум к эконом",
            "Верхний ярус: премиум (лапша в таре/стакане)",
            "Средний ярус: лапша с соусом (Cheff, Big Bon)",
            "Нижний ярус: пакетированная лапша массового спроса",
            "Hot Lunch 50г размещать рядом с конкурентами малого граммажа",
            "ГОРИЗОНТАЛЬНАЯ: Слева ходовые, справа премиум",
            "Обязательное заполнение вглубь полок",
        ],
    },
    "chocolate_paste": {
        "name": "Шоколадная паста",
        "our_brands": ["Chococream", "Chocotella"],
        "competitors": ["Nutella", "Milka", "Nuss Milk"],
        "kpi": {
            "upper_shelf_min_sos": 70,   # Верхняя полка: доля не менее 70%
            "middle_shelf_min_sos": 70,  # Средняя полка: доля не менее 70%
        },
        "planogram_rules": [
            "ВЕРТИКАЛЬНАЯ: Сверху премиум, ниже массовый, внизу эконом",
            "Верхняя полка: премиум сегмент (Chocotella), доля ≥70%",
            "Золотая полка (уровень глаз): премиум/большой граммаж",
            "Средняя полка: топ категории, наибольший спрос, доля ≥70%",
            "Нижняя полка: детские товары, минимальный объём",
            "Полка у пола: НЕ выставлять если нет конкурента",
        ],
    },
    "bars": {
        "name": "Шоколадные батончики",
        "our_brands": ["Strobar"],
        "competitors": ["Snickers", "Mars", "KitKat", "Twix", "Bounty"],
        "kpi": {
            "right_hand_rule": True,
            "eye_level": True,
            "corporate_block": True,
        },
        "planogram_rules": [
            "Прикассовая зона: Правило правой руки",
            "Размещение СПРАВА от кассира",
            "Уровень глаз покупателя в очереди",
            "Блочная выкладка: не смешивать с конкурентами",
            "Контраст и заметность: не 'теряться' среди конкурентов",
            "Корпоративный блок Strobar",
        ],
    },
    "cookies": {
        "name": "Печенье и венские вафли",
        "our_brands": ["Velona", "Two Bite", "Tvbox"],
        "competitors": [],
        "kpi": {},
        "planogram_rules": [
            "Размещать среди упакованных пряников, бисквитов, вафель",
        ],
    },
}


class PlanogramAIService:
    """Сервис для AI-анализа планограмм с Claude Vision"""

    def __init__(self):
        self.client = None
        if settings.ANTHROPIC_API_KEY:
            self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-5-20250929"
        self.sku_catalog = SKU_CATALOG
        self.competitors = COMPETITORS_CATALOG
        self.rules = EVALUATION_RULES

    def _build_recognition_prompt(self) -> str:
        """Создание блока распознавания SKU"""
        
        prompt = """
╔══════════════════════════════════════════════════════════════════════════════╗
║          ИНСТРУКЦИЯ ПО РАСПОЗНАВАНИЮ БРЕНДОВ N'MEDOV                        ║
║                    ЧИТАЙ ВНИМАТЕЛЬНО ПЕРЕД АНАЛИЗОМ!                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

ТЫ ДОЛЖЕН НАЙТИ И ПОСЧИТАТЬ НАШИ БРЕНДЫ. ЧИТАЙ НАДПИСИ НА УПАКОВКАХ!

"""
        # Добавляем описания каждого SKU
        for sku_id, sku_data in self.sku_catalog.items():
            prompt += sku_data["visual_description"]
            prompt += "\n"
        
        # Добавляем раздел "как отличить от конкурентов"
        prompt += """
╔══════════════════════════════════════════════════════════════════════════════╗
║                    КАК ОТЛИЧИТЬ ОТ КОНКУРЕНТОВ                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
        for cat, data in self.competitors.items():
            prompt += f"\n{cat.upper()}:\n"
            prompt += f"Конкуренты: {', '.join(data['brands'])}\n"
            prompt += data["how_to_distinguish"]
        
        prompt += """

╔══════════════════════════════════════════════════════════════════════════════╗
║                    АЛГОРИТМ РАСПОЗНАВАНИЯ                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

ШАГ 1: Определи категорию товаров на полке
ШАГ 2: Найди ВСЕ красные пластиковые контейнеры (это может быть Chococream)
ШАГ 3: Найди ВСЕ стеклянные банки (это может быть Chocotella или Nutella)
ШАГ 4: ПРОЧИТАЙ НАДПИСЬ на каждой упаковке
ШАГ 5: Если написано "Chococream" → это НАШ бренд, считай
ШАГ 6: Если написано "Chocotella" → это НАШ бренд, считай
ШАГ 7: Если написано "Nutella" → это КОНКУРЕНТ
ШАГ 8: Повтори для Hot Lunch, Cheff, Strobar

⚠️ КРИТИЧЕСКИ ВАЖНО:
• Chococream = КРАСНЫЙ ПЛАСТИКОВЫЙ контейнер, надпись "Chococream"
• Chocotella = СТЕКЛЯННАЯ банка, надпись "Chocotella" 
• НЕ ПУТАЙ их между собой и с конкурентами!

"""
        return prompt

    def _build_category_rules_prompt(self, category: Optional[str]) -> str:
        """Создание блока с правилами для категории"""
        
        if not category or category not in self.rules:
            # Если категория не указана, показываем все правила
            prompt = "\n══════ ПРАВИЛА ДЛЯ ВСЕХ КАТЕГОРИЙ ══════\n"
            for cat_key, rule in self.rules.items():
                prompt += f"\n--- {rule['name'].upper()} ---\n"
                prompt += f"Наши бренды: {', '.join(rule['our_brands'])}\n"
                prompt += f"Конкуренты: {', '.join(rule['competitors']) if rule['competitors'] else 'не определены'}\n"
                prompt += "Правила:\n"
                for r in rule['planogram_rules']:
                    prompt += f"  • {r}\n"
            return prompt
        
        rule = self.rules[category]
        prompt = f"""
══════════════════════════════════════════════════════════════════════════════
ПРАВИЛА ДЛЯ КАТЕГОРИИ: {rule['name'].upper()}
══════════════════════════════════════════════════════════════════════════════

НАШИ БРЕНДЫ (ИСКАТЬ!): {', '.join(rule['our_brands'])}
КОНКУРЕНТЫ: {', '.join(rule['competitors']) if rule['competitors'] else 'не определены'}

KPI (КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ):
"""
        for kpi_name, kpi_value in rule['kpi'].items():
            if isinstance(kpi_value, bool):
                prompt += f"  • {kpi_name}: {'Да' if kpi_value else 'Нет'}\n"
            else:
                prompt += f"  • {kpi_name}: {kpi_value}%\n"
        
        prompt += "\nПРАВИЛА ВЫКЛАДКИ:\n"
        for r in rule['planogram_rules']:
            prompt += f"  ✓ {r}\n"
        
        return prompt

    def _get_system_prompt(self, category: Optional[str] = None) -> str:
        """Полный System Prompt"""
        
        prompt = self._build_recognition_prompt()
        prompt += """
╔══════════════════════════════════════════════════════════════════════════════╗
║                         РОЛЬ И ЗАДАЧА                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Ты — опытный супервайзер компании N'Medov, эксперт по мерчандайзингу.
Твоя задача — проанализировать фото полки магазина и оценить выкладку товаров.

КРИТЕРИИ ОЦЕНКИ (всего 100 баллов):
• SOS (Share of Shelf) — доля полки: 30 баллов
• Золотая полка (уровень глаз) — правильное размещение: 25 баллов
• Ценники — наличие под каждым SKU: 15 баллов
• Глубина выкладки — заполнение вглубь: 15 баллов
• Соответствие планограмме: 15 баллов

"""
        prompt += self._build_category_rules_prompt(category)
        
        prompt += """

╔══════════════════════════════════════════════════════════════════════════════╗
║                    ФОРМАТ ОТВЕТА (СТРОГО JSON!)                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Отвечай ТОЛЬКО в формате JSON без markdown. Структура:

{
    "category": "noodles/chocolate_paste/bars/cookies/mixed",
    "overall_score": 0-100,
    "alert_level": "good/warning/critical",
    
    "metrics": {
        "share_of_shelf": {
            "our_brands_count": число,
            "competitors_count": число,
            "percentage": число,
            "kpi_met": true/false
        },
        "golden_shelf_compliance": {
            "score": 0-100,
            "issues": ["список проблем"]
        },
        "price_tags": {
            "present": число,
            "missing": число,
            "score": 0-100
        },
        "depth_score": 0-100,
        "planogram_compliance": 0-100
    },
    
    "detected_products": {
        "our_brands": [
            {"name": "Chococream", "count": 8, "shelf_level": "golden"},
            {"name": "Chocotella", "count": 4, "shelf_level": "top"}
        ],
        "competitors": [
            {"name": "Nutella", "count": 3, "shelf_level": "golden"}
        ]
    },
    
    "violations": ["список нарушений"],
    
    "recommendations": [
        {
            "priority": "high/medium/low",
            "action": "конкретное действие",
            "expected_improvement": "ожидаемый результат"
        }
    ],
    
    "summary": {
        "positive": "что хорошо",
        "negative": "что плохо",
        "instant_advice": "краткий совет агенту (1 предложение)"
    }
}

ПРАВИЛА ПОДСЧЁТА:
• Считай ФЕЙСИНГИ (единицы товара лицом к покупателю)
• SOS = (наши фейсинги / все фейсинги) × 100%
• Уровни полки: top, golden/eye_level, middle, bottom, floor
• alert_level: good (≥85), warning (70-84), critical (<70)
"""
        return prompt

    async def analyze_photo(
        self,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None,
        category_hint: Optional[str] = None,
        store_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Анализ фото полки через Claude Vision API"""
        
        if not self.client:
            raise ValueError("Anthropic client not configured. Set ANTHROPIC_API_KEY.")
        
        if not image_url and not image_base64:
            raise ValueError("Either image_url or image_base64 must be provided")

        # Формируем контент изображения
        if image_base64:
            image_content = {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_base64
                }
            }
        else:
            image_content = {
                "type": "image",
                "source": {
                    "type": "url",
                    "url": image_url
                }
            }

        system_prompt = self._get_system_prompt(category_hint)
        
        # Формируем user message с акцентом на распознавание
        user_message = """Проанализируй это фото полки магазина.

⚠️ ВНИМАНИЕ! Внимательно читай надписи на упаковках:
• Красные пластиковые контейнеры с надписью "Chococream" = НАШ бренд
• Стеклянные банки с надписью "Chocotella" = НАШ бренд
• Стеклянные банки с надписью "Nutella" = КОНКУРЕНТ (не наш!)

Посчитай количество КАЖДОГО бренда отдельно.
"""
        if store_name:
            user_message += f"\nМагазин: {store_name}"
        if category_hint:
            cat_name = self.rules.get(category_hint, {}).get('name', category_hint)
            user_message += f"\nКатегория: {cat_name}"
        
        user_message += "\n\nДай полную оценку и рекомендации в формате JSON."

        try:
            start_time = datetime.utcnow()
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            image_content,
                            {"type": "text", "text": user_message}
                        ]
                    }
                ]
            )
            
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            result_text = response.content[0].text
            
            # Очистка от markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response: {e}")
                logger.error(f"Response: {result_text[:500]}")
                result = self._get_fallback_result(str(e))
            
            result["processing_time_ms"] = int(processing_time)
            result["model_used"] = self.model
            result["analyzed_at"] = datetime.utcnow().isoformat()
            
            result = self._validate_and_enrich_result(result)
            
            return result

        except Exception as e:
            logger.error(f"Planogram AI analysis error: {e}")
            raise

    def _validate_and_enrich_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Валидация и обогащение результата"""
        
        defaults = {
            "category": "mixed",
            "overall_score": 0,
            "alert_level": "critical",
            "metrics": {
                "share_of_shelf": {"our_brands_count": 0, "competitors_count": 0, "percentage": 0, "kpi_met": False},
                "golden_shelf_compliance": {"score": 0, "issues": []},
                "price_tags": {"present": 0, "missing": 0, "score": 0},
                "depth_score": 0,
                "planogram_compliance": 0
            },
            "detected_products": {"our_brands": [], "competitors": []},
            "violations": [],
            "recommendations": [],
            "summary": {"positive": "", "negative": "", "instant_advice": ""}
        }
        
        def merge_defaults(target, defaults):
            for key, value in defaults.items():
                if key not in target:
                    target[key] = value
                elif isinstance(value, dict) and isinstance(target.get(key), dict):
                    merge_defaults(target[key], value)
            return target
        
        result = merge_defaults(result, defaults)
        
        # Пересчёт alert_level
        score = result.get("overall_score", 0)
        if score >= 85:
            result["alert_level"] = "good"
        elif score >= 70:
            result["alert_level"] = "warning"
        else:
            result["alert_level"] = "critical"
        
        return result

    def _get_fallback_result(self, error_message: str) -> Dict[str, Any]:
        """Результат-заглушка при ошибке"""
        return {
            "category": "unknown",
            "overall_score": 0,
            "alert_level": "critical",
            "metrics": {
                "share_of_shelf": {"our_brands_count": 0, "competitors_count": 0, "percentage": 0, "kpi_met": False},
                "golden_shelf_compliance": {"score": 0, "issues": ["Ошибка анализа"]},
                "price_tags": {"present": 0, "missing": 0, "score": 0},
                "depth_score": 0,
                "planogram_compliance": 0
            },
            "detected_products": {"our_brands": [], "competitors": []},
            "violations": [f"Ошибка: {error_message}"],
            "recommendations": [{
                "priority": "high",
                "action": "Переснимите фото более чётко",
                "expected_improvement": "Система сможет распознать товары"
            }],
            "summary": {
                "positive": "—",
                "negative": "Ошибка анализа",
                "instant_advice": "Сделайте более чёткое фото"
            },
            "error": error_message
        }

    def generate_telegram_message(self, analysis: Dict[str, Any]) -> str:
        """Генерация сообщения для Telegram"""
        
        score = analysis.get("overall_score", 0)
        summary = analysis.get("summary", {})
        recommendations = analysis.get("recommendations", [])
        detected = analysis.get("detected_products", {})
        
        if score >= 85:
            emoji, level = "✅", "Отлично"
        elif score >= 70:
            emoji, level = "⚠️", "Требует внимания"
        else:
            emoji, level = "🔴", "Критично"
        
        msg = f"📊 **Оценка: {score}/100** {emoji}\nСтатус: {level}\n\n"
        
        our_brands = detected.get("our_brands", [])
        if our_brands:
            msg += "🏷️ **Наши бренды:**\n"
            for b in our_brands:
                msg += f"  • {b.get('name')}: {b.get('count')} шт. ({b.get('shelf_level', '?')})\n"
            msg += "\n"
        
        if summary.get("instant_advice"):
            msg += f"💡 **Совет:** {summary['instant_advice']}"
        
        return msg

    def convert_to_db_format(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Конвертация для сохранения в БД"""
        
        metrics = analysis.get("metrics", {})
        sos = metrics.get("share_of_shelf", {})
        detected = analysis.get("detected_products", {})
        
        return {
            "overall_score": analysis.get("overall_score", 0),
            "alert_level": analysis.get("alert_level", "critical"),
            "share_of_shelf": sos.get("percentage", 0),
            "planogram_compliance": metrics.get("planogram_compliance", 0),
            "price_tag_score": metrics.get("price_tags", {}).get("score", 0),
            "facing_count": sos.get("our_brands_count", 0) + sos.get("competitors_count", 0),
            "detected_products": detected.get("our_brands", []),
            "violations": analysis.get("violations", []),
            "processing_time_ms": analysis.get("processing_time_ms", 0),
        }


# Singleton
planogram_ai_service = PlanogramAIService()
