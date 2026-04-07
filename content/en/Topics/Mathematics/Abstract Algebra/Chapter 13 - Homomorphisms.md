---
title: Chapter 13 - Homomorphisms
lang: en
sourceLanguage: en
translationStatus: original
---

Homomorphisms are the correct structure-preserving maps between groups.

## Core definition

A map `phi: G -> H` is a **homomorphism** if

`phi(ab) = phi(a)phi(b)` for all `a,b in G`.

## Fundamental objects

- **kernel**: `ker(phi) = {g in G : phi(g)=e_H}`
- **image**: `im(phi) = {phi(g) : g in G}`

## Key theorems

- `phi(e_G)=e_H`
- `phi(a^{-1}) = phi(a)^{-1}`
- `ker(phi)` is a subgroup of `G`
- `im(phi)` is a subgroup of `H`
- `phi` is injective iff `ker(phi) = {e_G}`

## Counterexamples worth remembering

- A bijection need not be a homomorphism.
- The map `g -> g^2` is not automatically a homomorphism in a nonabelian group.

## Companion exercises

1. Compute the kernel and image of `phi: Z -> Z_6`.
2. Prove that a homomorphism sends inverses to inverses.
3. Show that `phi: (Z,+) -> (Z_n,+)` defined by reduction mod `n` is a homomorphism.

## Textbook drill in your copy of Fraleigh 7e

- Work one kernel problem.
- Work one image problem.
- Work one injectivity-via-kernel problem.
