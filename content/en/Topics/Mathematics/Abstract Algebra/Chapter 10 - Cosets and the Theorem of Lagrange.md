---
title: Chapter 10 - Cosets and the Theorem of Lagrange
lang: en
sourceLanguage: en
translationStatus: original
---

Cosets partition a group into translated copies of a subgroup, and Lagrange's theorem turns that partition into a divisibility law.

## Core definitions

- A **left coset** of `H` is `gH`.
- A **right coset** of `H` is `Hg`.
- The **index** `[G:H]` is the number of left cosets when `G` is finite.

## Key theorems

- Left cosets partition `G`.
- Every left coset has the same size as `H`.
- **Lagrange's theorem**: `|G| = [G:H]|H|` for finite `G`.
- Corollaries:
  - the order of an element divides `|G|`
  - every group of prime order is cyclic

## Counterexamples worth remembering

- The converse to Lagrange's theorem fails.
  Example: `A_4` has order `12` but no subgroup of order `6`.
- Left and right cosets may differ for nonnormal subgroups.

## Companion exercises

1. Compute the cosets of `<2>` in `Z_6`.
2. Prove that a group of order `7` is cyclic.
3. List the possible element orders in a group of order `20`.

## Textbook drill in your copy of Fraleigh 7e

- Work one explicit coset-listing exercise.
- Work one divisibility exercise from Lagrange.
- Work one prime-order corollary exercise.
