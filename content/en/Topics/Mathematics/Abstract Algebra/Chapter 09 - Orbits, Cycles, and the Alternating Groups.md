---
title: Chapter 09 - Orbits, Cycles, and the Alternating Groups
lang: en
sourceLanguage: en
translationStatus: original
---

This chapter deepens permutation theory through cycle structure, parity, and the alternating groups.

## Core ideas

- A transposition swaps exactly two elements.
- A permutation is **even** if it is a product of an even number of transpositions.
- $A_n$ is the subgroup of even permutations in $S_n$.

## Standard facts

- A $k$-cycle is a product of $k-1$ transpositions.
- The parity of a permutation is well defined.
- $|A_n| = n!/2$.

## Counterexamples worth remembering

- An even permutation need not be a single cycle.
  Example: $(1\,2)(3\,4)$.
- A $3$-cycle is even, not odd.

## Toggleable proofs

> [!info]- Proof that a k-cycle is a product of k-1 transpositions
>
> Let
> $$
> \sigma=(a_1\,a_2\,\dots\,a_k).
> $$
> We claim that
> $$
> \sigma=(a_1\,a_k)(a_1\,a_{k-1})\cdots(a_1\,a_3)(a_1\,a_2).
> $$
> To verify this, apply the right-hand side to each $a_i$. The element $a_1$ is sent first to $a_2$, then remains fixed by the remaining transpositions, so the image is $a_2$. For $2 \le i<k$, the element $a_i$ is first fixed by the transpositions to its right until $(a_1\,a_i)$ sends it to $a_1$, and then the next transposition to the left sends $a_1$ to $a_{i+1}$. Finally, $a_k$ is sent to $a_1$ by the leftmost transposition. Every element outside $\{a_1,\dots,a_k\}$ is fixed by all transpositions. Hence the product acts exactly as the cycle $\sigma$. Since the product contains $k-1$ transpositions, every $k$-cycle has parity $k-1$ modulo $2$.

> [!info]- Why a 3-cycle is even
>
> Apply the previous formula with $k=3$:
> $$
> (a\,b\,c)=(a\,c)(a\,b).
> $$
> This is a product of exactly two transpositions, and two is even. Therefore every $3$-cycle is an even permutation.

## Companion exercises

1. Determine whether $(1\,2\,3\,4\,5)$ is even or odd.
2. Express $(1\,3\,2)$ as a product of transpositions.
3. List the elements of $A_3$.

## Textbook drill in your copy of Fraleigh 7e

- Work one parity exercise.
- Work one transposition-expansion exercise.
- Work one small alternating-group exercise.
