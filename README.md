<div align="center">
  <h1>🎓 GradeAI</h1>
  <p><strong>Умная проверка работ учеников — RAGFlow OCR + AlemLLM</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" />
    <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" />
    <img src="https://img.shields.io/badge/AlemLLM-246B-green" />
    <img src="https://img.shields.io/badge/RAGFlow-OCR-orange" />
  </p>
</div>

## 📋 Описание

GradeAI — веб-приложение для учителей, которое автоматически проверяет контрольные работы (СОР/СОЧ) казахстанских школьников. Учитель фотографирует или загружает PDF работы ученика, система читает текст через RAGFlow OCR и выставляет оценку через AlemLLM (казахстанская языковая модель 246B).

## 🚀 Возможности

- **📸 Фото + PDF** — загрузка изображений и PDF-сканов работ
- **🔍 OCR** — автоматическое распознавание текста через RAGFlow + DeepDOC
- **🤖 AlemLLM** — проверка на базе казахстанской LLM (246B параметров)
- **📋 Марк-схема** — ввод критериев оценивания для точной проверки
- **🎙️ Голосовой ввод** — диктовка ответов через Whisper
- **📊 SWOT-анализ** — автоматический анализ сильных/слабых сторон
- **🏫 Дашборд класса** — статистика по 16 ученикам, уровень знаний
- **❌ Анализ ошибок** — топ ошибок с указанием конкретных учеников
- **📈 СОР vs СОЧ** — сравнение результатов по типам работ
- **📄 PDF экспорт** — скачивание результата анализа
- **💾 История** — автосохранение всех проверок в localStorage
- **🌍 Три языка** — русский, казахский, английский

## 🏗️ Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 19 + TypeScript |
| Сборка | Vite 6 |
| Стили | Tailwind CSS 4 |
| ИИ-анализ | AlemLLM через `llm.alem.ai` |
| OCR | RAGFlow + DeepDOC |
| Голос | Whisper (`llm.alem.ai/v1/audio/transcriptions`) |
| Графики | Recharts |
| PDF | jsPDF + html-to-image |

## 📁 Структура проекта

```
src/
├── components/
│   ├── Header.tsx         # Навигация + переключатель языков
│   ├── UploadZone.tsx     # Загрузка фото/PDF + марк-схема
│   ├── LoadingView.tsx    # Прогресс OCR + анализа (5 шагов)
│   ├── ResultView.tsx     # Результат: оценка, SWOT, рекомендации
│   ├── Dashboard.tsx      # Аналитика класса (4 вкладки)
│   ├── HistoryView.tsx    # История проверок
│   ├── ScoreRing.tsx      # Круговой индикатор оценки
│   └── CameraModal.tsx    # Съёмка через камеру
├── hooks/
│   ├── useAnalysis.ts     # Логика анализа (AlemLLM)
│   ├── useRAGFlow.ts      # OCR pipeline (RAGFlow API)
│   ├── useResults.ts      # Хранение результатов (localStorage)
│   └── useVoiceInput.ts   # Голосовой ввод (Whisper)
├── constants/
│   └── i18n.ts            # Переводы RU/KZ/EN
├── types.ts               # TypeScript типы + computeClassStats()
├── App.tsx
├── main.tsx
└── index.css              # Design system (CSS variables)
```

## ⚙️ Установка

```bash
# 1. Клонировать
git clone https://github.com/YOUR_USERNAME/gradeai.git
cd gradeai

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
cp .env.example .env
```

Заполнить `.env`:
```env
# AlemLLM API (chat completions + Whisper)
ALEM_API_KEY=sk-ваш-ключ

# RAGFlow API (OCR + DeepDOC)
RAGFLOW_API_KEY=ragflow-ваш-ключ
```

```bash
# 4. Запустить
npm run dev
# → http://localhost:3000
```

## 🔑 Получение ключей

### AlemLLM
1. Зайти на [plus.alem.ai](https://plus.alem.ai)
2. Settings → API Keys → Create

### RAGFlow
1. Зайти на [a1-ragflow1.alem.ai](https://a1-ragflow1.alem.ai)
2. Нажать на аватар (правый верхний угол) → API Key
3. Ключ начинается с `ragflow-`

## 🔄 Как работает пайплайн

```
📸 Фото/PDF
     ↓
RAGFlow API          ← создаём временный датасет
  ↓ DeepDOC OCR      ← распознаём текст с изображения/PDF
  ↓ Chunks           ← извлекаем текст по чанкам
     ↓
AlemLLM (246B)       ← анализируем по марк-схеме
  ↓ JSON response
     ↓
📊 Результат:
  - Оценка (A/B/C/D/F)
  - Разбор по заданиям с ошибками
  - SWOT-анализ
  - Рекомендации педагога
  - Адаптивные задания
```

## 📊 Дашборд класса

- **Заполненность** — визуальная сетка 16 ячеек (цвет = оценка)
- **KPI** — проверено / средний балл / сдали / не сдали
- **Качество знаний** — трёхцветная полоса (высокий/достаточный/низкий)
- **Ошибки** — топ-12 с частотой, темой и именами учеников
- **Ученики** — таблица всех 16 с прогресс-барами и количеством ошибок
- **СОР vs СОЧ** — сравнение + прогресс по четвертям

## 🌐 Языки

Приложение поддерживает три языка (переключатель в шапке):
- 🇷🇺 Русский
- 🇰🇿 Қазақша
- 🇬🇧 English

Интерфейс и весь вывод AlemLLM (комментарии, SWOT, рекомендации) переключаются одновременно.

## 📝 Лицензия

MIT — свободное использование в образовательных целях.

---

<div align="center">
  Сделано в Казахстане 🇰🇿 для казахстанских учителей
</div>
