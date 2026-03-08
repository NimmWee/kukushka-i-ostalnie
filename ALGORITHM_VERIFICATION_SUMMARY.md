# Algorithm Verification Summary

Date of latest verification: **March 9, 2026**

## What was checked

The project was verified with deterministic headless runs that execute the real browser code from `app.js` through a mock DOM/canvas harness.

The checks cover:

- algorithm termination
- monotonic `best-so-far`
- keeping all generated points inside search bounds `[-5, 5]`
- `GA + Tabu` population and seed invariants
- `Simulated Annealing` cooling invariants
- `Scatter Search` `RefSet` invariants
- `Cuckoo Search` nest and abandon-phase invariants
- convergence sanity-check on `Sphere`

Quick test command:

```bash
node scripts/run-algorithm-tests.js
```

Detailed report command:

```bash
node scripts/verify-algorithms.js --json reports/algorithm-verification.json --csv reports/algorithm-verification.csv
```

## Latest observed results

Median final value over seeds `11, 19, 23, 29, 31`:

| Algorithm | Sphere | Ackley | Rastrigin | Interpretation |
| --- | ---: | ---: | ---: | --- |
| `GA + Tabu` | `1.588e-7` | `4.580e-4` | `5.598e-4` | Strong and stable |
| `Simulated Annealing` | `0.001724` | `0.162728` | `1.033124` | Works, but much weaker on multimodal landscapes |
| `Scatter Search` | `7.211e-7` | `9.153e-4` | `2.268e-4` | Strong and stable |
| `Cuckoo Search` | `1.431e-5` | `0.027411` | `0.009087` | Strong on Sphere/Ackley, weaker on Rastrigin |

Interpretation:

- for the current continuous optimization task, the implementations behave consistently
- `GA + Tabu` and `Scatter Search` look robust on all three benchmark functions
- `Cuckoo Search` also behaves plausibly and passes invariants, with especially good results on `Sphere` and `Ackley`
- `Simulated Annealing` is valid as a demo, but it is clearly less stable on `Ackley` and especially `Rastrigin`

## Important limitation

This verification does **not** prove correctness for `Berlin52` or any other TSP instance.

Reason:

- the current project optimizes continuous points `(x, y)`
- objective functions are `Sphere`, `Ackley`, and `Rastrigin`
- there is no representation of a route, permutation, city list, or distance matrix

So this project can be defended as a visualization of continuous metaheuristic optimization, but **not** as a `Berlin52` solver.

## Short text for the professor

You can use this wording:

> I verified the implementation with deterministic headless runs of the real code from `app.js`.  
> The checks cover termination, monotonic best-so-far, search-bound invariants, and algorithm-specific invariants for GA+Tabu, Simulated Annealing, Scatter Search, and Cuckoo Search.  
> The implementation converges reliably on Sphere and behaves plausibly on Ackley and Rastrigin, with GA+Tabu and Scatter Search showing the strongest stability and Cuckoo Search also performing convincingly.  
> At the same time, this project is a continuous optimization demo and does not implement Berlin52/TSP, because solutions are represented as points `(x, y)` rather than permutations of cities.
