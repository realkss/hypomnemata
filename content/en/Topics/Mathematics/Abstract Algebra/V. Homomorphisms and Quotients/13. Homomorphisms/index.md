---
title: Chapter 13 - Homomorphisms
lang: en
sourceLanguage: en
translationStatus: original
---

Homomorphisms are the correct structure-preserving maps between groups.

## Core definition

A map $\varphi: G \to H$ is a **homomorphism** if

$\varphi(ab) = \varphi(a)\varphi(b)$ for all $a,b \in G$.

## Fundamental objects

- **kernel**: $\ker(\varphi) = \{g \in G : \varphi(g) = e_H\}$
- **image**: $\operatorname{im}(\varphi) = \{\varphi(g) : g \in G\}$

## Key theorems

- $\varphi(e_G)=e_H$
- $\varphi(a^{-1}) = \varphi(a)^{-1}$
- $\ker(\varphi)$ is a subgroup of $G$
- $\operatorname{im}(\varphi)$ is a subgroup of $H$
- $\varphi$ is injective iff $\ker(\varphi) = \{e_G\}$

## Counterexamples worth remembering

- A bijection need not be a homomorphism.
- The map $g \mapsto g^2$ is not automatically a homomorphism in a nonabelian group.

## Toggleable proofs

> [!info]- Proof that the kernel is a subgroup
>
> Let $\varphi:G \to H$ be a homomorphism. We prove that $\ker(\varphi)$ is a subgroup of $G$ using the subgroup test. The kernel is nonempty because
> $$
> \varphi(e_G)=e_H,
> $$
> so $e_G \in \ker(\varphi)$. Now take $x,y \in \ker(\varphi)$. Then $\varphi(x)=e_H$ and $\varphi(y)=e_H$. Hence
> $$
> \varphi(xy^{-1})=\varphi(x)\varphi(y^{-1})=\varphi(x)\varphi(y)^{-1}=e_H e_H^{-1}=e_H.
> $$
> So $xy^{-1} \in \ker(\varphi)$. By the subgroup test, $\ker(\varphi)$ is a subgroup of $G$.

> [!info]- Proof that varphi is injective iff ker(varphi)=e_G
>
> Assume first that $\varphi$ is injective. If $x \in \ker(\varphi)$, then
> $$
> \varphi(x)=e_H=\varphi(e_G).
> $$
> Injectivity gives $x=e_G$. So the kernel is exactly $\{e_G\}$.
>
> Conversely, assume $\ker(\varphi)=\{e_G\}$ and suppose $\varphi(x)=\varphi(y)$. Then
> $$
> e_H=\varphi(y)^{-1}\varphi(x)=\varphi(y^{-1}x),
> $$
> so $y^{-1}x \in \ker(\varphi)$. Hence $y^{-1}x=e_G$, and therefore $x=y$. Thus $\varphi$ is injective.

## Companion exercises

1. Compute the kernel and image of $\varphi: \mathbb{Z} \to \mathbb{Z}_6$.
2. Prove that a homomorphism sends inverses to inverses.
3. Show that $\varphi: (\mathbb{Z}, +) \to (\mathbb{Z}_n, +)$ defined by reduction mod $n$ is a homomorphism.

## Textbook drill in your copy of Fraleigh 7e

- Work one kernel problem.
- Work one image problem.
- Work one injectivity-via-kernel problem.
