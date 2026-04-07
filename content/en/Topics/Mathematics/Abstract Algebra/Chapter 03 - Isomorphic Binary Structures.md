---
title: Chapter 03 - Isomorphic Binary Structures
lang: en
sourceLanguage: en
translationStatus: original
---

An isomorphism is not merely a bijection. It is a bijection that preserves the binary operation.

## Core definition

If $(S,\ast)$ and $(T,\cdot)$ are binary structures, an **isomorphism** is a bijection $\varphi: S \to T$ such that

$\varphi(a \ast b) = \varphi(a) \cdot \varphi(b)$ for all $a,b \in S$.

## What is preserved

- identities
- inverses
- associativity
- commutativity
- structural patterns in the operation table

## Counterexamples worth remembering

- $\mathbb{Z}_4$ and $V_4$ have the same size, but they are not isomorphic because $\mathbb{Z}_4$ has an element of order $4$ and $V_4$ does not.
- A bijection between two structures need not be an isomorphism.

## Toggleable proofs

> [!info]- Proof that an isomorphism preserves identity and inverses
>
> Let $\varphi:(S,\ast)\to (T,\cdot)$ be an isomorphism, and let $e_S$ be the identity in $S$. For any $a \in S$,
> $$
> \varphi(e_S)\cdot \varphi(a)=\varphi(e_S \ast a)=\varphi(a).
> $$
> Since $\varphi$ is surjective, every element of $T$ has the form $\varphi(a)$, so $\varphi(e_S)$ acts as a left identity on all of $T$. A similar computation with $\varphi(a)\cdot \varphi(e_S)=\varphi(a \ast e_S)$ shows that $\varphi(e_S)$ is also a right identity. By uniqueness of identity, $\varphi(e_S)=e_T$.
>
> Now let $a^{-1}$ be the inverse of $a$ in $S$. Then
> $$
> \varphi(a)\cdot \varphi(a^{-1})=\varphi(a \ast a^{-1})=\varphi(e_S)=e_T
> $$
> and similarly $\varphi(a^{-1})\cdot \varphi(a)=e_T$. Thus $\varphi(a^{-1})$ is the inverse of $\varphi(a)$ in $T$.

> [!info]- Proof that Z_4 is not isomorphic to V_4
>
> Any isomorphism preserves the order of each element, because if $\varphi(g)^m=e$, then
> $$
> \varphi(g^m)=\varphi(g)^m=e,
> $$
> so $g^m=e$ by injectivity of $\varphi$, and conversely. In $\mathbb{Z}_4$, the class $\overline{1}$ has order $4$. In $V_4=\mathbb{Z}_2 \times \mathbb{Z}_2$, every nonidentity element has order $2$:
> $$
> (1,0)+(1,0)=(0,0), \quad (0,1)+(0,1)=(0,0), \quad (1,1)+(1,1)=(0,0).
> $$
> So $V_4$ has no element of order $4$. Since $\mathbb{Z}_4$ does have one, the two groups cannot be isomorphic.

## Companion exercises

1. Prove that $\varphi(n)=2n$ gives an isomorphism $(\mathbb{Z}, +) \to (2\mathbb{Z}, +)$.
2. Show that $(\mathbb{R}, +)$ and $(\mathbb{R}_{>0}, \cdot)$ are isomorphic via $\varphi(x)=e^x$.
3. Prove that $\mathbb{Z}_4$ is not isomorphic to $V_4$.

## Textbook drill in your copy of Fraleigh 7e

- Work one explicit isomorphism construction.
- Work one nonisomorphism proof using an invariant.
