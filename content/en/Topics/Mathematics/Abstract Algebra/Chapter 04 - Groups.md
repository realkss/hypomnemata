---
title: Chapter 04 - Groups
lang: en
sourceLanguage: en
translationStatus: original
---

A group is a binary structure with associativity, an identity, and inverses for every element.

## Core definition

A **group** $(G,\ast)$ satisfies:

- closure
- associativity
- identity
- inverses

If also $ab = ba$ for all $a,b$, the group is **abelian**.

## High-yield consequences

- cancellation holds
- equations $ax=b$ and $ya=b$ have unique solutions
- powers are unambiguous because associativity holds

## Counterexamples worth remembering

- $(\mathbb{N}, +)$ with positive integers is closed and associative but has no identity.
- $(\mathbb{Z}, \cdot)$ has an identity, but most elements are not invertible in $\mathbb{Z}$.

## Toggleable proofs

> [!info]- Proof of the cancellation laws
>
> Let $G$ be a group and suppose $ax=ay$. Multiply on the left by $a^{-1}$:
> $$
> a^{-1}(ax)=a^{-1}(ay).
> $$
> By associativity,
> $$
> (a^{-1}a)x=(a^{-1}a)y,
> $$
> so $ex=ey$, hence $x=y$. This proves left cancellation. The proof of right cancellation is analogous: if $xa=ya$, multiply on the right by $a^{-1}$ to obtain $x=y$.

> [!info]- Why the equation ax=b has a unique solution
>
> Existence: multiply $ax=b$ on the left by $a^{-1}$. Then
> $$
> x=a^{-1}b.
> $$
> So $x=a^{-1}b$ is a solution. Uniqueness: if $x_1$ and $x_2$ both satisfy $ax=b$, then $ax_1=ax_2$. By the cancellation law, $x_1=x_2$. Therefore the solution is unique.

## Companion exercises

1. Prove the cancellation laws.
2. Solve $ax=b$ abstractly in a group.
3. Show that the nonzero real numbers under multiplication form a group.

## Textbook drill in your copy of Fraleigh 7e

- Work one cancellation exercise.
- Work one equation-solving exercise.
- Work one example distinguishing abelian from nonabelian.
