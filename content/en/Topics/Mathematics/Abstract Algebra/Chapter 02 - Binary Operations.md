---
title: Chapter 02 - Binary Operations
lang: en
sourceLanguage: en
translationStatus: original
---

A binary operation on $S$ is a map $\ast: S \times S \to S$. Closure comes first, but closure alone says nothing about associativity, identity, or inverses.

## Core definitions

- **Closure**: $a \ast b \in S$ for all $a,b \in S$.
- **Associativity**: $(a \ast b) \ast c = a \ast (b \ast c)$.
- **Identity**: $e \ast a = a \ast e = a$.
- **Inverse**: $a \ast b = b \ast a = e$.

## Rigorous facts

- A two-sided identity, if it exists, is unique.
- A two-sided inverse, if it exists, is unique once the identity is fixed.

## Counterexamples worth remembering

- Subtraction on $\mathbb{Z}$ is closed but not associative.
- Division on $\mathbb{Z}$ is not a binary operation because closure fails.
- The rule $x \ast y = x$ on a set with at least two elements is closed but has no two-sided identity.

## Toggleable proofs

> [!info]- Proof that a two-sided identity is unique
>
> Assume $e$ and $f$ are both two-sided identities for the same binary operation on $S$. Because $e$ is an identity, $e \ast f = f$. Because $f$ is an identity, $e \ast f = e$. Hence $e=f$. So a two-sided identity, if it exists, is unique.

> [!info]- Proof that inverses are unique once the identity is fixed
>
> Fix an identity element $e$ and let $a \in S$. Suppose $b$ and $c$ are both two-sided inverses of $a$, so
> $$
> a \ast b=b \ast a=e
> \quad\text{and}\quad
> a \ast c=c \ast a=e.
> $$
> Then
> $$
> b=b \ast e=b \ast (a \ast c)=(b \ast a) \ast c=e \ast c=c.
> $$
> Thus $b=c$. Therefore an element cannot have two different two-sided inverses.

## Companion exercises

1. Prove identity uniqueness.
2. Prove inverse uniqueness.
3. Find an operation that is commutative but not associative.
4. Construct a finite set with a closed operation and no identity.

## Textbook drill in your copy of Fraleigh 7e

- Work one proof of identity uniqueness.
- Work one proof of inverse uniqueness.
- Work one exercise where closure holds but associativity fails.
