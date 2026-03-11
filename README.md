# 🐦 Kukushka и остальные

<div align="center">

### Интерактивная визуализация метаэвристик и популяционных методов оптимизации

<p>
  <img src="https://img.shields.io/badge/HTML-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML" />
  <img src="https://img.shields.io/badge/CSS-3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111" alt="JavaScript" />
</p>

<p>
  <img src="https://img.shields.io/badge/Тип-Статический%20веб--проект-5B5BD6?style=flat-square" alt="Static project" />
  <img src="https://img.shields.io/badge/Сборка-Не%20нужна-1F883D?style=flat-square" alt="No build" />
  <img src="https://img.shields.io/badge/Запуск-За%2010%20секунд-orange?style=flat-square" alt="Quick start" />
</p>

</div>

> Проект показывает, как работают `GA + Tabu`, `Simulated Annealing`, `Scatter Search` и `Cuckoo Search` на одной карте целевой функции — с анимацией, графиком сходимости, пошаговым режимом и журналом выполнения.

---

## ✨ Что здесь есть

- интерактивный выбор алгоритма и целевой функции
- визуальная карта поиска в 2D
- график сходимости по итерациям
- пошаговый режим выполнения алгоритма
- лог текущих фаз и изменений состояния
- наглядная демонстрация поведения разных метаэвристик

## 🚀 Запуск

Проект полностью статический: без бэкенда, без сборки, без установки зависимостей.

### Вариант 1 — открыть сразу

1. Склонируйте репозиторий или скачайте архив.
2. Откройте `index.html` в браузере.

### Вариант 2 — поднять локальный сервер

#### Через Python

```bash
python -m http.server 8000
```

Откройте:

```text
http://localhost:8000
```

#### Через Node.js

```bash
npx serve .
```

После запуска откройте адрес, который покажет терминал.

## 🕹️ Как пользоваться

1. Выберите алгоритм:
   - `GA + Tabu`
   - `Simulated Annealing`
   - `Scatter Search`
   - `Cuckoo Search`
2. Выберите целевую функцию:
   - `Sphere`
   - `Rastrigin`
   - `Ackley`
3. Настройте параметры запуска.
4. Нажмите:
   - `Сброс` — подготовка алгоритма
   - `Старт` — запуск анимации
   - `Пауза` — остановка
   - `Шаг` — пошаговое выполнение

## 🧠 Алгоритмы внутри

<table>
  <tr>
    <td align="center" width="25%">
      <strong>GA + Tabu</strong><br />
      <a href="./genetik.jpg">
        <img src="./genetik.jpg" alt="GA + Tabu" width="100%" />
      </a>
    </td>
    <td align="center" width="25%">
      <strong>Simulated Annealing</strong><br />
      <a href="./otshig.jpg">
        <img src="./otshig.jpg" alt="Simulated Annealing" width="100%" />
      </a>
    </td>
    <td align="center" width="25%">
      <strong>Scatter Search</strong><br />
      <a href="./rasseivanie.jpg">
        <img src="./rasseivanie.jpg" alt="Scatter Search" width="100%" />
      </a>
    </td>
    <td align="center" width="25%">
      <strong>Cuckoo Search</strong><br />
      <a href="./kukushka.jpg">
        <img src="./kukushka.jpg" alt="Cuckoo Search" width="100%" />
      </a>
    </td>
  </tr>
</table>

## 📁 Структура проекта

```text
.
├── index.html        # интерфейс приложения
├── styles.css        # оформление и layout
├── app.js            # логика визуализации и алгоритмов
├── genetik.jpg       # схема Genetic + Tabu
├── otshig.jpg        # схема Simulated Annealing
├── rasseivanie.jpg   # схема Scatter Search
└── kukushka.jpg      # схема Cuckoo Search
```

## 💡 Почему проект удобен для демонстрации

- подходит для учебных работ и презентаций
- помогает сравнивать поведение алгоритмов визуально
- показывает не только результат, но и процесс поиска
- запускается буквально в один файл

## 🖥️ Требования

- любой современный браузер с поддержкой JavaScript

## ✅ Проверка алгоритмов

В проект добавлены детерминированные headless-проверки, которые прогоняют именно код из `app.js`, но без браузера.

### Быстрые проверки

```bash
node scripts/run-algorithm-tests.js
```

Что проверяется:

- завершение всех алгоритмов
- монотонность `best-so-far`
- сохранение точек внутри границ поиска `[-5, 5]`
- инварианты `GA + Tabu`, `Simulated Annealing`, `Scatter Search`, `Cuckoo Search`
- sanity-check сходимости на `Sphere`

### Наглядная сводка по алгоритмам

Последняя верификация: **9 марта 2026**

| Алгоритм | Инвариантные тесты | `Sphere` медиана | `Ackley` медиана | `Rastrigin` медиана | Итог |
| --- | --- | ---: | ---: | ---: | --- |
| `GA + Tabu` | ✅ пройдены | `1.588e-7` | `4.580e-4` | `5.598e-4` | Очень сильный и стабильный |
| `Simulated Annealing` | ✅ пройдены | `0.001724` | `0.162728` | `1.033124` | Работает, но заметно слабее |
| `Scatter Search` | ✅ пройдены | `7.211e-7` | `9.153e-4` | `2.268e-4` | Очень сильный и стабильный |
| `Cuckoo Search` | ✅ пройдены | `1.431e-5` | `0.027411` | `0.009087` | Сильный на `Sphere/Ackley`, слабее на `Rastrigin` |

Как читать таблицу:

- инвариантные тесты проверяют корректность механики алгоритма
- числа — это медианное финальное значение функции по `seed = 11, 19, 23, 29, 31`
- чем ближе значение к нулю, тем лучше результат

Короткий вывод:

- `GA + Tabu` и `Scatter Search` проходят проверки увереннее всех и показывают сильную сходимость
- `Cuckoo Search` тоже проходит проверки и выглядит убедительно, особенно на `Sphere` и `Ackley`
- `Simulated Annealing` проходит проверки, но на сложных функциях ведёт себя слабее и менее стабильно

### Подробный отчёт

```bash
node scripts/verify-algorithms.js
```

Экспорт в файлы:

```bash
node scripts/verify-algorithms.js --json reports/algorithm-verification.json --csv reports/algorithm-verification.csv
```

Отчёт показывает:

- результат по нескольким `seed`
- стартовое и финальное значение функции
- процент улучшения
- число шагов
- сравнение для `Sphere`, `Ackley`, `Rastrigin`

Короткая готовая записка для преподавателя: `ALGORITHM_VERIFICATION_SUMMARY.md`

## 🔗 Репозиторий

GitHub: `https://github.com/NimmWee/kukushka-i-ostalnie.git`

## Бенчмарк Berlin52

Ниже показана компактная таблица по `Berlin52` прямо в `README`.
Известный оптимум: `7542`, использованные `seed`: `11, 19, 23, 29, 31`.

| Алгоритм | Точных попаданий | <=1% gap | <=5% gap | Медианный итог | Медианный gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| `GA+Tabu` | `5/5` | `5/5` | `5/5` | `7542` | `0.000%` |
| `Simulated Annealing` | `0/5` | `1/5` | `5/5` | `7733` | `2.532%` |
| `Scatter Search` | `5/5` | `5/5` | `5/5` | `7542` | `0.000%` |
| `Cuckoo Search` | `5/5` | `5/5` | `5/5` | `7542` | `0.000%` |

| Алгоритм | Старт | 25% | 50% | 75% | Финал |
| --- | ---: | ---: | ---: | ---: | ---: |
| `GA+Tabu` | `8164` | `7734` | `7542` | `7542` | `7542` |
| `Simulated Annealing` | `8164` | `8164` | `7922` | `7769` | `7733` |
| `Scatter Search` | `8421` | `7542` | `7542` | `7542` | `7542` |
| `Cuckoo Search` | `8421` | `7542` | `7542` | `7542` | `7542` |

Подробности:
- `BERLIN52_VISUAL_TABLE.md`
- `BERLIN52_CONVERGENCE_SUMMARY.md`
- `reports/berlin52-convergence.json`
- `reports/berlin52-convergence.csv`
