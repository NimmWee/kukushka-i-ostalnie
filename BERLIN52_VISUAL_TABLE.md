# Наглядная таблица Berlin52

Бенчмарк: `Berlin52`, `EUC_2D`, оптимум `7542`, `seed = 11, 19, 23, 29, 31`.

Эта страница является компактной наглядной версией полного отчета из `BERLIN52_CONVERGENCE_SUMMARY.md`.

## Финальные результаты

| Алгоритм | Статус | Точных попаданий | <=1% gap | <=5% gap | Медианный итог | Медианный gap |
| --- | --- | --- | --- | --- | ---: | ---: |
| `GA+Tabu` | ![optimal](https://img.shields.io/badge/result-optimal-brightgreen) | ![5/5](https://img.shields.io/badge/exact-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_1%25-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7542` | `0.000%` |
| `Simulated Annealing` | ![near-optimal](https://img.shields.io/badge/result-near--optimal-yellowgreen) | ![0/5](https://img.shields.io/badge/exact-0%2F5-yellow) | ![1/5](https://img.shields.io/badge/under_1%25-1%2F5-yellow) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7733` | `2.532%` |
| `Scatter Search` | ![optimal](https://img.shields.io/badge/result-optimal-brightgreen) | ![5/5](https://img.shields.io/badge/exact-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_1%25-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7542` | `0.000%` |
| `Cuckoo Search` | ![optimal](https://img.shields.io/badge/result-optimal-brightgreen) | ![5/5](https://img.shields.io/badge/exact-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_1%25-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7542` | `0.000%` |

## Форма сходимости

| Алгоритм | Старт | 25% | 50% | 75% | Финал | Наглядная траектория |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `GA+Tabu` | `8164` | `7734` | `7542` | `7542` | `7542` | `8164 -> 7734 -> 7542 -> 7542 -> 7542` |
| `Simulated Annealing` | `8164` | `8164` | `7922` | `7769` | `7733` | `8164 -> 8164 -> 7922 -> 7769 -> 7733` |
| `Scatter Search` | `8421` | `7542` | `7542` | `7542` | `7542` | `8421 -> 7542 -> 7542 -> 7542 -> 7542` |
| `Cuckoo Search` | `8421` | `7542` | `7542` | `7542` | `7542` | `8421 -> 7542 -> 7542 -> 7542 -> 7542` |

## Короткая интерпретация

- `GA+Tabu`, `Scatter Search` и `Cuckoo Search` вышли на точный оптимум во всех пяти запусках.
- `Simulated Annealing` не дал точный оптимум, но во всех пяти запусках остался в пределах `5%` от оптимального решения.
- По качеству финального решения на `Berlin52` сильнейшая группа: `GA+Tabu`, `Scatter Search` и `Cuckoo Search`.
