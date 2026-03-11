# Berlin52 Convergence Summary

Generated: 2026-03-11T07:42:56.288Z

Seeds: `11, 19, 23, 29, 31`

Benchmark: `Berlin52`, `EUC_2D`, optimum `7542`.

## Final quality

| Algorithm | Best final | Median final | Worst final | Median gap | <=5% gap hits | <=1% gap hits | Exact hits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GA+Tabu | 7542.000 | 7542.000 | 7542.000 | 0.000e+0% | 5/5 | 5/5 | 5/5 |
| Simulated Annealing | 7596.000 | 7733.000 | 7788.000 | 2.532% | 5/5 | 1/5 | 0/5 |
| Scatter Search | 7542.000 | 7542.000 | 7542.000 | 0.000e+0% | 5/5 | 5/5 | 5/5 |
| Cuckoo Search | 7542.000 | 7542.000 | 7542.000 | 0.000e+0% | 5/5 | 5/5 | 5/5 |

## Milestones

| Algorithm | 0% | 25% | 50% | 75% | 100% |
| --- | ---: | ---: | ---: | ---: | ---: |
| GA+Tabu | 8164.000 | 7734.000 | 7542.000 | 7542.000 | 7542.000 |
| Simulated Annealing | 8164.000 | 8164.000 | 7922.000 | 7769.000 | 7733.000 |
| Scatter Search | 8421.000 | 7542.000 | 7542.000 | 7542.000 | 7542.000 |
| Cuckoo Search | 8421.000 | 7542.000 | 7542.000 | 7542.000 | 7542.000 |

## Notes

- Histories keep best-so-far and are monotonic non-increasing.
- GA+Tabu mirrors the project idea: GA stage first, then multi-start Tabu refinement.
- This is a separate headless TSP benchmark and does not change the current browser visualization.
