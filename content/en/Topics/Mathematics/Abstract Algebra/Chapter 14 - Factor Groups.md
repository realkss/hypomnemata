---
title: Chapter 14 - Factor Groups
lang: en
sourceLanguage: en
translationStatus: original
---

Factor groups are quotient groups built from normal subgroups.

## Core definitions

- A subgroup `N <= G` is **normal** if `gN = Ng` for every `g in G`.
- If `N` is normal, then `G/N` is the set of cosets with multiplication
  `(gN)(hN) = ghN`.

## Key theorem

Coset multiplication is well defined **if and only if** the subgroup is normal.

## Standard facts

- The natural projection `pi(g)=gN` is a surjective homomorphism.
- `ker(pi)=N`.
- Every subgroup of an abelian group is normal.

## Counterexamples worth remembering

- If `H` is not normal, coset multiplication can depend on the representatives and fails to define a group.
- In `S_3`, `{e,(1 2)}` is not normal.

## Companion exercises

1. Show that every subgroup of an abelian group is normal.
2. Compute `S_3 / A_3`.
3. Exhibit why quotient multiplication fails for a nonnormal subgroup of `S_3`.

## Textbook drill in your copy of Fraleigh 7e

- Work one normality proof.
- Work one quotient construction.
- Work one nonnormal-subgroup counterexample.
