---
title: Chapter 10 - Cosets and the Theorem of Lagrange
lang: en
sourceLanguage: en
translationStatus: original
---

Cosets partition a group into translated copies of a subgroup, and Lagrange's theorem turns that partition into a divisibility law.

## Core definitions

- A **left coset** of $H$ is $gH$.
- A **right coset** of $H$ is $Hg$.
- The **index** $[G:H]$ is the number of left cosets when $G$ is finite.

## Key theorems

- Left cosets partition $G$.
- Every left coset has the same size as $H$.
- **Lagrange's theorem**: $|G| = [G:H]\,|H|$ for finite $G$.
- Corollaries:
  - the order of an element divides $|G|$
  - every group of prime order is cyclic

## Counterexamples worth remembering

- The converse to Lagrange's theorem fails.
  Example: $A_4$ has order $12$ but no subgroup of order $6$.
- Left and right cosets may differ for nonnormal subgroups.

## Toggleable proofs

<details>
<summary>Proof that left cosets partition the group</summary>

Let $H \le G$. Every element $g \in G$ belongs to the left coset $gH$, so the union of all left cosets is all of $G$. It remains to show that two left cosets are either equal or disjoint.

Suppose $g_1H$ and $g_2H$ have a common element $x$. Then
$$
x=g_1h_1=g_2h_2
$$
for some $h_1,h_2 \in H$. Rearranging gives
$$
g_2^{-1}g_1=h_2h_1^{-1} \in H.
$$
Now if $y \in g_1H$, say $y=g_1h$, then
$$
y=g_2(g_2^{-1}g_1)h.
$$
Since $g_2^{-1}g_1 \in H$ and $h \in H$, the product $(g_2^{-1}g_1)h$ lies in $H$, so $y \in g_2H$. Thus $g_1H \subseteq g_2H$. By symmetry, $g_2H \subseteq g_1H$, so the cosets are equal. Therefore left cosets form a partition of $G$.
</details>

<details>
<summary>Proof of Lagrange's theorem</summary>

Assume $G$ is finite and $H \le G$. By the previous result, the left cosets of $H$ partition $G$. If $gH$ is any left coset, the map
$$
H \to gH,\qquad h \mapsto gh
$$
is bijective: it is injective by cancellation, and surjective by definition of the coset. Therefore every left coset has exactly $|H|$ elements.

If there are $[G:H]$ distinct left cosets, and each has size $|H|$, then the partition gives
$$
|G|=[G:H]\cdot |H|.
$$
Hence $|H|$ divides $|G|$. This is Lagrange's theorem.
</details>

## Companion exercises

1. Compute the cosets of $\langle 2 \rangle$ in $\mathbb{Z}_6$.
2. Prove that a group of order $7$ is cyclic.
3. List the possible element orders in a group of order $20$.

## Textbook drill in your copy of Fraleigh 7e

- Work one explicit coset-listing exercise.
- Work one divisibility exercise from Lagrange.
- Work one prime-order corollary exercise.
