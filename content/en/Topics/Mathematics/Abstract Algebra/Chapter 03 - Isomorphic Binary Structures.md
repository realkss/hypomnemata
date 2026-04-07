---
title: Chapter 03 - Isomorphic Binary Structures
lang: en
sourceLanguage: en
translationStatus: original
---

An isomorphism is not merely a bijection. It is a bijection that preserves the binary operation.

## Core definition

If `(S,*)` and `(T,dot)` are binary structures, an **isomorphism** is a bijection `phi: S -> T` such that

`phi(a*b) = phi(a) dot phi(b)` for all `a,b in S`.

## What is preserved

- identities
- inverses
- associativity
- commutativity
- structural patterns in the operation table

## Counterexamples worth remembering

- `Z_4` and `V_4` have the same size, but they are not isomorphic because `Z_4` has an element of order `4` and `V_4` does not.
- A bijection between two structures need not be an isomorphism.

## Companion exercises

1. Prove that `phi(n)=2n` gives an isomorphism `(Z,+) -> (2Z,+)`.
2. Show that `(R,+)` and `(R_{>0},x)` are isomorphic via `phi(x)=e^x`.
3. Prove that `Z_4` is not isomorphic to `V_4`.

## Textbook drill in your copy of Fraleigh 7e

- Work one explicit isomorphism construction.
- Work one nonisomorphism proof using an invariant.
