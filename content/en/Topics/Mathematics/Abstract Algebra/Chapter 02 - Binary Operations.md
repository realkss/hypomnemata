---
title: Chapter 02 - Binary Operations
lang: en
sourceLanguage: en
translationStatus: original
---

A binary operation on `S` is a map `*: S x S -> S`. Closure comes first, but closure alone says nothing about associativity, identity, or inverses.

## Core definitions

- **Closure**: `a*b in S` for all `a,b in S`.
- **Associativity**: `(a*b)*c = a*(b*c)`.
- **Identity**: `e*a = a*e = a`.
- **Inverse**: `a*b = b*a = e`.

## Rigorous facts

- A two-sided identity, if it exists, is unique.
- A two-sided inverse, if it exists, is unique once the identity is fixed.

## Counterexamples worth remembering

- Subtraction on `Z` is closed but not associative.
- Division on `Z` is not a binary operation because closure fails.
- The rule `x*y = x` on a set with at least two elements is closed but has no two-sided identity.

## Companion exercises

1. Prove identity uniqueness.
2. Prove inverse uniqueness.
3. Find an operation that is commutative but not associative.
4. Construct a finite set with a closed operation and no identity.

## Textbook drill in your copy of Fraleigh 7e

- Work one proof of identity uniqueness.
- Work one proof of inverse uniqueness.
- Work one exercise where closure holds but associativity fails.
