---
title: Chapter 01 - Introduction and Examples
lang: en
sourceLanguage: en
translationStatus: original
---

This opening chapter teaches the habit of seeing algebraic objects as **sets equipped with operations and laws**, not just as familiar symbols.

## Core ideas

- A structure is a set together with operations.
- The same set can carry different algebraic structures under different operations.
- Examples and nonexamples matter because they force you to test the axioms rather than trust intuition.

## Standard examples

- $(\mathbb{Z}, +)$ is an infinite abelian group.
- $(\mathbb{R}^{\times}, \cdot)$ is an abelian group.
- $GL_n(\mathbb{R})$ is a group under matrix multiplication.
- $\mathbb{Z}_n$ under addition mod $n$ is a finite cyclic group.

## Counterexamples worth remembering

- $M_n(\mathbb{R})$ under multiplication is not a group because singular matrices are not invertible.
- Positive integers under addition are closed and associative, but have no additive identity inside the set.
- Nonzero integers under multiplication have an identity, but most elements have no inverses in the set.

## Toggleable proofs

<details>
<summary>Proof that $(\mathbb{Z}, +)$ is a group</summary>

Let $m,n,k \in \mathbb{Z}$. Since the integers are closed under addition, $m+n \in \mathbb{Z}$. Associativity holds because ordinary integer addition satisfies $(m+n)+k = m+(n+k)$. The element $0$ is an identity because $m+0=0+m=m$ for every $m \in \mathbb{Z}$. Finally, each $m \in \mathbb{Z}$ has inverse $-m$, since $m+(-m)=(-m)+m=0$. Thus $(\mathbb{Z}, +)$ satisfies closure, associativity, identity, and inverses, so it is a group. It is abelian because $m+n=n+m$ for all integers $m,n$.
</details>

<details>
<summary>Why $M_n(\mathbb{R})$ under multiplication is not a group</summary>

Closure and associativity do hold for matrix multiplication, and the identity matrix $I_n$ lies in $M_n(\mathbb{R})$. The failure is invertibility. Take any singular matrix $A \in M_n(\mathbb{R})$, for example the zero matrix. If $A$ had a multiplicative inverse $B$, then $AB=I_n$. Taking determinants would give
$$
\det(A)\det(B)=\det(I_n)=1.
$$
But $\det(A)=0$ for a singular matrix, so the left-hand side would be $0$, a contradiction. Therefore not every element of $M_n(\mathbb{R})$ is invertible, so $M_n(\mathbb{R})$ is not a group under multiplication.
</details>

## Companion exercises

1. Decide whether $(\mathbb{Z}, +)$, $(\mathbb{Z}, \cdot)$, $(\mathbb{Q}^{\times}, \cdot)$, $(M_2(\mathbb{R}), \cdot)$, and $(M_2(\mathbb{R}), +)$ are groups.
2. Give one finite group and one finite algebraic system that is not a group.
3. Explain why the same set $\mathbb{Z}$ behaves differently under addition and multiplication.

## Textbook drill in your copy of Fraleigh 7e

- Work one classification problem: group or nongroup.
- Work one matrix example.
- Work one modular arithmetic example.
