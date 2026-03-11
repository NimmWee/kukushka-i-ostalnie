# Berlin52 Visual Table

Benchmark: `Berlin52`, `EUC_2D`, optimum `7542`, seeds `11, 19, 23, 29, 31`.

This page is the compact visual version of the full report from `BERLIN52_CONVERGENCE_SUMMARY.md`.

## Final results

| Algorithm | Status | Exact hits | <=1% gap | <=5% gap | Median final | Median gap |
| --- | --- | --- | --- | --- | ---: | ---: |
| `GA+Tabu` | ![optimal](https://img.shields.io/badge/result-optimal-brightgreen) | ![5/5](https://img.shields.io/badge/exact-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_1%25-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7542` | `0.000%` |
| `Simulated Annealing` | ![near-optimal](https://img.shields.io/badge/result-near--optimal-yellowgreen) | ![0/5](https://img.shields.io/badge/exact-0%2F5-yellow) | ![1/5](https://img.shields.io/badge/under_1%25-1%2F5-yellow) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7733` | `2.532%` |
| `Scatter Search` | ![optimal](https://img.shields.io/badge/result-optimal-brightgreen) | ![5/5](https://img.shields.io/badge/exact-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_1%25-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7542` | `0.000%` |
| `Cuckoo Search` | ![optimal](https://img.shields.io/badge/result-optimal-brightgreen) | ![5/5](https://img.shields.io/badge/exact-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_1%25-5%2F5-brightgreen) | ![5/5](https://img.shields.io/badge/under_5%25-5%2F5-brightgreen) | `7542` | `0.000%` |

## Convergence shape

| Algorithm | Start | 25% | 50% | 75% | Final | Visual path |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `GA+Tabu` | `8164` | `7734` | `7542` | `7542` | `7542` | `8164 -> 7734 -> 7542 -> 7542 -> 7542` |
| `Simulated Annealing` | `8164` | `8164` | `7922` | `7769` | `7733` | `8164 -> 8164 -> 7922 -> 7769 -> 7733` |
| `Scatter Search` | `8421` | `7542` | `7542` | `7542` | `7542` | `8421 -> 7542 -> 7542 -> 7542 -> 7542` |
| `Cuckoo Search` | `8421` | `7542` | `7542` | `7542` | `7542` | `8421 -> 7542 -> 7542 -> 7542 -> 7542` |

## Short interpretation

- `GA+Tabu`, `Scatter Search`, and `Cuckoo Search` reached the exact optimum in all five runs.
- `Simulated Annealing` did not hit the exact optimum, but it stayed within `5%` of optimum in all five runs.
- By final solution quality, the strongest group on `Berlin52` is `GA+Tabu`, `Scatter Search`, and `Cuckoo Search`.
