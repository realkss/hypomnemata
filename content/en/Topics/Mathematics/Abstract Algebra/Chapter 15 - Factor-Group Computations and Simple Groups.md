---
title: Chapter 15 - Factor-Group Computations and Simple Groups
lang: en
sourceLanguage: en
translationStatus: original
---

This chapter combines practical quotient computations with the idea of a simple group.

## Core definitions

- A group is **simple** if its only normal subgroups are the trivial subgroup and the whole group.
- In $G/N$, the order of $gN$ is the least positive integer $m$ such that $g^m \in N$.

## High-yield facts

- $\mathbb{Z}_p$ is simple for prime $p$.
- $\mathbb{Z}_n$ is not simple when $n$ is composite.
- Quotients can collapse large amounts of structure.

## Counterexamples worth remembering

- $A_4$ is not simple because it has a normal Klein four subgroup.
- A group can fail to be simple even when it has very few obvious normal subgroups.

## Toggleable proofs

<details>
<summary>Proof that $\mathbb{Z}_p$ is simple for prime $p$</summary>

Let $p$ be prime and let $H$ be a subgroup of $\mathbb{Z}_p$. By Lagrange's theorem, $|H|$ divides $|\mathbb{Z}_p|=p$. Since $p$ is prime, the only positive divisors are $1$ and $p$. Therefore $|H|=1$ or $|H|=p$. If $|H|=1$, then $H=\{\overline{0}\}$. If $|H|=p$, then $H=\mathbb{Z}_p$. So $\mathbb{Z}_p$ has no nontrivial proper subgroups. Because every subgroup of an abelian group is normal, $\mathbb{Z}_p$ has no nontrivial proper normal subgroups. Hence $\mathbb{Z}_p$ is simple.
</details>

<details>
<summary>Why the order of $gN$ in $G/N$ is the least positive $m$ with $g^m \in N$</summary>

In the quotient group $G/N$, the order of the coset $gN$ is by definition the least positive integer $m$ such that
$$
(gN)^m=N.
$$
But quotient multiplication gives
$$
(gN)^m=g^mN.
$$
Therefore
$$
(gN)^m=N \iff g^mN=N.
$$
Now $g^mN=N$ happens exactly when $g^m \in N$: if $g^m \in N$, then $g^mN=N$; conversely, if $g^mN=N$, then $g^m \in N$ because $g^m$ lies in its own coset. Thus the order of $gN$ is precisely the least positive integer $m$ for which $g^m \in N$.
</details>

## Companion exercises

1. Prove that $\mathbb{Z}_p$ is simple for prime $p$.
2. Show that $\mathbb{Z}_6$ is not simple.
3. Compute the order of each coset in $\mathbb{Z}_8 / \langle 4 \rangle$.

## Textbook drill in your copy of Fraleigh 7e

- Work one quotient-order computation.
- Work one simplicity test.
- Work one comparison between $\mathbb{Z}_p$ and $\mathbb{Z}_n$ for composite $n$.
