---
title: Chapter 08 - Groups of Permutations
lang: en
sourceLanguage: en
translationStatus: original
---

Permutation groups turn abstract groups into concrete actions on finite sets.

## Core definitions

- A **permutation** is a bijection from a set to itself.
- $S_n$ is the symmetric group on $n$ letters.
- A **cycle** records one orbit of a permutation.

## Key theorems

- Every permutation decomposes into disjoint cycles.
- Disjoint cycles commute.
- **Cayley's theorem**: every group is isomorphic to a subgroup of a symmetric group.

## Counterexamples worth remembering

- Non-disjoint cycles do not have to commute.
- A permutation need not be a single cycle.

## Toggleable proofs

<details>
<summary>Proof that disjoint cycles commute</summary>

Let $\alpha$ and $\beta$ be disjoint cycles in $S_n$. We show that $\alpha\beta(x)=\beta\alpha(x)$ for every element $x$ in the underlying set. There are three cases.

If $x$ is moved by neither cycle, then both compositions fix $x$. If $x$ is moved by $\alpha$ but not by $\beta$, then $\beta(x)=x$, so
$$
\alpha\beta(x)=\alpha(x).
$$
Because the supports are disjoint, $\alpha(x)$ is still not moved by $\beta$, so
$$
\beta\alpha(x)=\alpha(x).
$$
The case where $x$ is moved by $\beta$ but not by $\alpha$ is symmetric. Since every element falls into one of these cases, the two permutations agree on every $x$, hence $\alpha\beta=\beta\alpha$.
</details>

<details>
<summary>Proof of Cayley's theorem</summary>

Let $G$ be a group. For each $g \in G$, define a map $L_g:G \to G$ by
$$
L_g(x)=gx.
$$
Because left multiplication by $g$ has inverse left multiplication by $g^{-1}$, each $L_g$ is a permutation of the set $G$.

Define
$$
\Phi:G \to \operatorname{Sym}(G), \qquad \Phi(g)=L_g.
$$
Then
$$
\Phi(gh)=L_{gh}=L_g \circ L_h=\Phi(g)\Phi(h),
$$
so $\Phi$ is a homomorphism into the symmetric group on the set $G$. It remains to show injectivity. If $\Phi(g)=\Phi(h)$, then the two left-multiplication maps agree on every $x \in G$, in particular on $e$:
$$
g=L_g(e)=L_h(e)=h.
$$
Thus $\Phi$ is injective, so $G$ is isomorphic to the subgroup $\Phi(G)$ of $\operatorname{Sym}(G)$. Therefore every group embeds in a symmetric group.
</details>

## Companion exercises

1. Write a given permutation in disjoint-cycle form.
2. Prove that disjoint cycles commute.
3. Embed $\mathbb{Z}_4$ into $S_4$.

## Textbook drill in your copy of Fraleigh 7e

- Work one cycle-decomposition exercise.
- Work one permutation-composition exercise.
- Work one Cayley-theorem exercise.
