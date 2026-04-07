---
title: Chapter 14 - Factor Groups
lang: en
sourceLanguage: en
translationStatus: original
---

Factor groups are quotient groups built from normal subgroups.

## Core definitions

- A subgroup $N \le G$ is **normal** if $gN = Ng$ for every $g \in G$.
- If $N$ is normal, then $G/N$ is the set of cosets with multiplication
  $(gN)(hN) = ghN$.

## Key theorem

Coset multiplication is well defined **if and only if** the subgroup is normal.

## Standard facts

- The natural projection $\pi(g)=gN$ is a surjective homomorphism.
- $\ker(\pi)=N$.
- Every subgroup of an abelian group is normal.

## Counterexamples worth remembering

- If $H$ is not normal, coset multiplication can depend on the representatives and fails to define a group.
- In $S_3$, $\{e,(1\,2)\}$ is not normal.

## Toggleable proofs

> [!info]- Proof that every subgroup of an abelian group is normal
>
> Let $G$ be abelian and let $N \le G$. For any $g \in G$ and $n \in N$, commutativity gives
> $$
> gn=ng.
> $$
> Thus every element of the left coset $gN$ already lies in the right coset $Ng$, so $gN \subseteq Ng$. The same argument in reverse shows $Ng \subseteq gN$. Therefore $gN=Ng$ for every $g \in G$, and $N$ is normal.

> [!info]- Proof that coset multiplication is well defined iff the subgroup is normal
>
> Assume first that $N \trianglelefteq G$. Suppose $gN=g'N$ and $hN=h'N$. Then $g'=gn_1$ and $h'=hn_2$ for some $n_1,n_2 \in N$. Hence
> $$
> g'h'N=(gn_1)(hn_2)N.
> $$
> Because $N$ is normal, $n_1h=hn_3$ for some $n_3 \in N$. Therefore
> $$
> (gn_1)(hn_2)N=g(hn_3)n_2N=gh(n_3n_2)N=ghN.
> $$
> So the product of cosets does not depend on the chosen representatives.
>
> Conversely, assume the rule $(gN)(hN)=ghN$ is well defined on cosets. Fix $g \in G$ and let $n \in N$. Since $gnN=gN$, well-definedness of multiplication with $g^{-1}N$ gives
> $$
> (gnN)(g^{-1}N)=(gN)(g^{-1}N).
> $$
> Evaluating both sides,
> $$
> gng^{-1}N=gg^{-1}N=N.
> $$
> Thus $gng^{-1} \in N$ for every $n \in N$, so $gNg^{-1}\subseteq N$. Replacing $g$ by $g^{-1}$ yields the reverse inclusion, hence $gNg^{-1}=N$. Therefore $N$ is normal.

## Companion exercises

1. Show that every subgroup of an abelian group is normal.
2. Compute $S_3 / A_3$.
3. Exhibit why quotient multiplication fails for a nonnormal subgroup of $S_3$.

## Textbook drill in your copy of Fraleigh 7e

- Work one normality proof.
- Work one quotient construction.
- Work one nonnormal-subgroup counterexample.
