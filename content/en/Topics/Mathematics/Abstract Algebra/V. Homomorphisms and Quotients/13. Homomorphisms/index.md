---
title: Chapter 13 - Homomorphisms
lang: en
sourceLanguage: en
translationStatus: original
---

# Chapter 13 -- Homomorphisms

Homomorphisms are the correct structure-preserving maps between groups. If isomorphisms answer "when are two groups the same?", homomorphisms answer "how can one group be studied through another?" This chapter is one of the central organizational chapters of the course: every theorem here will be used repeatedly in Chapters 14, 15, and beyond.

---

## §13.1 Definition of Homomorphism

> **Definition 13.1 (Group Homomorphism).** Let $(G, *)$ and $(G', *')$ be groups. A map $\phi: G \to G'$ is a **homomorphism** if
> $$\phi(a * b) = \phi(a) *' \phi(b)$$
> for all $a, b \in G$.

**Critical point.** The operation on the left side of the equation is the operation in $G$, while the operation on the right side is the operation in $G'$. These may be completely different operations. For instance, in the determinant map $\det: GL_n(\mathbb{R}) \to \mathbb{R}^*$, the left-hand side uses matrix multiplication while the right-hand side uses ordinary multiplication of real numbers.

**Notation.** We write $\phi: G \to G'$ and suppress the operation symbols once the groups are understood. Thus the homomorphism condition becomes simply $\phi(ab) = \phi(a)\phi(b)$.

---

## §13.2 Basic Properties of Homomorphisms

> **Theorem 13.2.** Let $\phi: G \to G'$ be a group homomorphism. Then:
> 1. $\phi(e_G) = e_{G'}$.
> 2. $\phi(a^{-1}) = \phi(a)^{-1}$ for all $a \in G$.
> 3. $\phi(a^n) = \phi(a)^n$ for all $a \in G$ and all $n \in \mathbb{Z}$.
> 4. If $|a|$ is finite, then $|\phi(a)|$ divides $|a|$.

> [!info]- Proof of (1): $\phi(e_G) = e_{G'}$
> We have
> $$\phi(e_G) = \phi(e_G \cdot e_G) = \phi(e_G)\phi(e_G).$$
> Left-multiplying both sides by $\phi(e_G)^{-1}$ (which exists because $\phi(e_G) \in G'$ and $G'$ is a group):
> $$e_{G'} = \phi(e_G).$$

> [!info]- Proof of (2): $\phi(a^{-1}) = \phi(a)^{-1}$
> Using (1) and the homomorphism property:
> $$\phi(a)\phi(a^{-1}) = \phi(aa^{-1}) = \phi(e_G) = e_{G'}.$$
> Similarly $\phi(a^{-1})\phi(a) = e_{G'}$. By uniqueness of inverses in $G'$, we conclude $\phi(a^{-1}) = \phi(a)^{-1}$.

> [!info]- Proof of (3): $\phi(a^n) = \phi(a)^n$ for all $n \in \mathbb{Z}$
> **Case $n > 0$:** By induction on $n$. The base case $n = 1$ is trivial. For the inductive step:
> $$\phi(a^{n+1}) = \phi(a^n \cdot a) = \phi(a^n)\phi(a) = \phi(a)^n \phi(a) = \phi(a)^{n+1}.$$
>
> **Case $n = 0$:** $\phi(a^0) = \phi(e_G) = e_{G'} = \phi(a)^0$ by (1).
>
> **Case $n < 0$:** Write $n = -m$ where $m > 0$. Then:
> $$\phi(a^n) = \phi((a^{-1})^m) = \phi(a^{-1})^m = (\phi(a)^{-1})^m = \phi(a)^{-m} = \phi(a)^n,$$
> using the positive case and (2).

> [!info]- Proof of (4): $|\phi(a)|$ divides $|a|$
> Let $|a| = n$, so $a^n = e_G$. Then:
> $$\phi(a)^n = \phi(a^n) = \phi(e_G) = e_{G'}.$$
> Thus $\phi(a)^n = e_{G'}$. By the characterization of order, $|\phi(a)|$ divides $n = |a|$.
>
> **Note:** If $|a|$ is infinite, $|\phi(a)|$ may be finite or infinite. For example, the trivial homomorphism sends every element of infinite order to $e_{G'}$, which has order 1.

---

## §13.3 Image and Kernel

> **Definition 13.3.** Let $\phi: G \to G'$ be a homomorphism. The **image** (or **range**) of $\phi$ is
> $$\operatorname{im}(\phi) = \phi[G] = \{\phi(g) : g \in G\} \subseteq G'.$$
> The **kernel** of $\phi$ is
> $$\ker(\phi) = \{g \in G : \phi(g) = e_{G'}\} \subseteq G.$$

> **Theorem 13.4.** Let $\phi: G \to G'$ be a homomorphism. Then:
> 1. $\operatorname{im}(\phi)$ is a subgroup of $G'$.
> 2. $\ker(\phi)$ is a subgroup of $G$.

> [!info]- Proof that $\operatorname{im}(\phi) \leq G'$
> We verify the subgroup criteria.
>
> **Identity:** $\phi(e_G) = e_{G'}$ by Theorem 13.2(1), so $e_{G'} \in \operatorname{im}(\phi)$.
>
> **Closure:** If $\phi(a), \phi(b) \in \operatorname{im}(\phi)$, then
> $$\phi(a)\phi(b) = \phi(ab) \in \operatorname{im}(\phi)$$
> since $ab \in G$.
>
> **Inverses:** If $\phi(a) \in \operatorname{im}(\phi)$, then
> $$\phi(a)^{-1} = \phi(a^{-1}) \in \operatorname{im}(\phi)$$
> since $a^{-1} \in G$.

> [!info]- Proof that $\ker(\phi) \leq G$
> We verify the subgroup criteria.
>
> **Identity:** $\phi(e_G) = e_{G'}$, so $e_G \in \ker(\phi)$.
>
> **Closure:** If $a, b \in \ker(\phi)$, then $\phi(a) = e_{G'}$ and $\phi(b) = e_{G'}$. Hence
> $$\phi(ab) = \phi(a)\phi(b) = e_{G'} \cdot e_{G'} = e_{G'}.$$
> So $ab \in \ker(\phi)$.
>
> **Inverses:** If $a \in \ker(\phi)$, then $\phi(a) = e_{G'}$. Hence
> $$\phi(a^{-1}) = \phi(a)^{-1} = (e_{G'})^{-1} = e_{G'}.$$
> So $a^{-1} \in \ker(\phi)$.

---

### §13.3.1 Injectivity and the Kernel

This is one of the most important results in the chapter.

> **Theorem 13.5.** A homomorphism $\phi: G \to G'$ is injective (one-to-one) if and only if $\ker(\phi) = \{e_G\}$.

> [!info]- Proof of Theorem 13.5
> **($\Rightarrow$)** Suppose $\phi$ is injective. If $g \in \ker(\phi)$, then $\phi(g) = e_{G'} = \phi(e_G)$. Since $\phi$ is injective, $g = e_G$. Thus $\ker(\phi) = \{e_G\}$.
>
> **($\Leftarrow$)** Suppose $\ker(\phi) = \{e_G\}$. Let $\phi(a) = \phi(b)$. Then:
> $$\phi(a)\phi(b)^{-1} = e_{G'} \implies \phi(a)\phi(b^{-1}) = e_{G'} \implies \phi(ab^{-1}) = e_{G'}.$$
> Thus $ab^{-1} \in \ker(\phi) = \{e_G\}$, so $ab^{-1} = e_G$, giving $a = b$. Hence $\phi$ is injective.

**Why this matters.** To check injectivity of a homomorphism, you never need to check $\phi(a) = \phi(b) \Rightarrow a = b$ directly. It suffices to check that only $e_G$ maps to $e_{G'}$. This is an enormous simplification.

---

## §13.4 Standard Examples of Homomorphisms

### Example 1: Determinant

The map $\det: GL_n(\mathbb{R}) \to \mathbb{R}^*$ is a homomorphism because
$$\det(AB) = \det(A)\det(B)$$
for all invertible matrices $A, B$.

- **Image:** $\operatorname{im}(\det) = \mathbb{R}^*$ (surjective: for any $r \in \mathbb{R}^*$, the diagonal matrix $\operatorname{diag}(r, 1, \ldots, 1)$ has determinant $r$).
- **Kernel:** $\ker(\det) = \{A \in GL_n(\mathbb{R}) : \det(A) = 1\} = SL_n(\mathbb{R})$, the **special linear group**.

### Example 2: Sign of a Permutation

The map $\operatorname{sgn}: S_n \to \{+1, -1\}$ sends even permutations to $+1$ and odd permutations to $-1$. Here $\{+1, -1\}$ is a group under multiplication, isomorphic to $\mathbb{Z}_2$.

Verification: $\operatorname{sgn}(\sigma\tau) = \operatorname{sgn}(\sigma)\operatorname{sgn}(\tau)$ follows from the fact that a product of an even and an odd permutation is odd, etc.

- **Image:** $\operatorname{im}(\operatorname{sgn}) = \{+1, -1\}$ for $n \geq 2$ (surjective).
- **Kernel:** $\ker(\operatorname{sgn}) = A_n$, the **alternating group** of even permutations.

### Example 3: Reduction mod $n$

The map $\phi: \mathbb{Z} \to \mathbb{Z}_n$ defined by $\phi(m) = \bar{m}$ (the residue class of $m$ modulo $n$) is a homomorphism because
$$\phi(m_1 + m_2) = \overline{m_1 + m_2} = \bar{m}_1 + \bar{m}_2 = \phi(m_1) + \phi(m_2).$$
(Here both groups are under addition.)

- **Image:** $\operatorname{im}(\phi) = \mathbb{Z}_n$ (surjective).
- **Kernel:** $\ker(\phi) = \{m \in \mathbb{Z} : \bar{m} = \bar{0}\} = n\mathbb{Z}$, the set of all multiples of $n$.

### Example 4: Projection

Let $G$ and $H$ be groups. The map $\pi: G \times H \to G$ defined by $\pi(g, h) = g$ is a homomorphism:
$$\pi((g_1, h_1)(g_2, h_2)) = \pi(g_1 g_2, h_1 h_2) = g_1 g_2 = \pi(g_1, h_1)\pi(g_2, h_2).$$

- **Image:** $\operatorname{im}(\pi) = G$ (surjective).
- **Kernel:** $\ker(\pi) = \{(e_G, h) : h \in H\} \cong H$.

### Example 5: Inclusion

Let $H \leq G$. The map $\iota: H \hookrightarrow G$ defined by $\iota(h) = h$ is a homomorphism (trivially, since the operation is the same).

- **Image:** $\operatorname{im}(\iota) = H$.
- **Kernel:** $\ker(\iota) = \{e_G\}$, so $\iota$ is always injective.

### Example 6: Trivial Homomorphism

For any groups $G$ and $G'$, the map $\phi: G \to G'$ defined by $\phi(g) = e_{G'}$ for all $g$ is a homomorphism:
$$\phi(ab) = e_{G'} = e_{G'} \cdot e_{G'} = \phi(a)\phi(b).$$

- **Image:** $\operatorname{im}(\phi) = \{e_{G'}\}$.
- **Kernel:** $\ker(\phi) = G$.

### Example 7: Identity Homomorphism

The map $\operatorname{id}_G: G \to G$ defined by $\operatorname{id}_G(g) = g$ is a homomorphism (trivially). It is both injective and surjective, hence an isomorphism.

- **Image:** $\operatorname{im}(\operatorname{id}_G) = G$.
- **Kernel:** $\ker(\operatorname{id}_G) = \{e_G\}$.

---

## §13.5 Isomorphisms

> **Definition 13.6 (Isomorphism).** A homomorphism $\phi: G \to G'$ that is bijective (both injective and surjective) is called an **isomorphism**. We write $G \cong G'$ and say $G$ and $G'$ are **isomorphic**.

> **Theorem 13.7.** If $\phi: G \to G'$ is an isomorphism, then $\phi^{-1}: G' \to G$ is also an isomorphism.

> [!info]- Proof of Theorem 13.7
> Since $\phi$ is bijective, the inverse function $\phi^{-1}: G' \to G$ exists and is bijective. We need to show $\phi^{-1}$ is a homomorphism.
>
> Let $a', b' \in G'$. Since $\phi$ is surjective, there exist $a, b \in G$ with $\phi(a) = a'$ and $\phi(b) = b'$. Then $\phi^{-1}(a') = a$ and $\phi^{-1}(b') = b$. Now:
> $$\phi^{-1}(a'b') = \phi^{-1}(\phi(a)\phi(b)) = \phi^{-1}(\phi(ab)) = ab = \phi^{-1}(a')\phi^{-1}(b').$$
> Thus $\phi^{-1}$ is a homomorphism, and since it is bijective, it is an isomorphism.

---

## §13.6 The Kernel Is Always Normal

This result is the bridge connecting homomorphisms to factor groups (Chapter 14).

> **Theorem 13.8.** Let $\phi: G \to G'$ be a homomorphism. Then $\ker(\phi)$ is a **normal subgroup** of $G$, i.e., $\ker(\phi) \trianglelefteq G$. This means
> $$g \ker(\phi) g^{-1} = \ker(\phi) \quad \text{for all } g \in G.$$

> [!info]- Proof of Theorem 13.8
> Let $K = \ker(\phi)$. We must show that for all $g \in G$ and all $k \in K$, we have $gkg^{-1} \in K$. Compute:
> $$\phi(gkg^{-1}) = \phi(g)\phi(k)\phi(g^{-1}) = \phi(g) \cdot e_{G'} \cdot \phi(g)^{-1} = \phi(g)\phi(g)^{-1} = e_{G'}.$$
> Therefore $gkg^{-1} \in K$.
>
> This shows $gKg^{-1} \subseteq K$ for all $g \in G$. Replacing $g$ by $g^{-1}$ gives $g^{-1}Kg \subseteq K$, hence $K \subseteq gKg^{-1}$. Combining: $gKg^{-1} = K$.

**Remark.** The converse is also true: every normal subgroup of $G$ is the kernel of some homomorphism (namely, the canonical projection $G \to G/N$; see Chapter 14). Thus:

$$N \trianglelefteq G \iff N = \ker(\phi) \text{ for some homomorphism } \phi \text{ with domain } G.$$

---

## §13.7 Coset Characterization of Kernels

> **Theorem 13.9 (Fibers are cosets).** Let $\phi: G \to G'$ be a homomorphism with $K = \ker(\phi)$. For $a, b \in G$, the following are equivalent:
> 1. $\phi(a) = \phi(b)$.
> 2. $a^{-1}b \in K$.
> 3. $aK = bK$ (i.e., $a$ and $b$ lie in the same left coset of $K$).

> [!info]- Proof of Theorem 13.9
> **(1 $\Rightarrow$ 2):** If $\phi(a) = \phi(b)$, then
> $$\phi(a^{-1}b) = \phi(a)^{-1}\phi(b) = \phi(b)^{-1}\phi(b) = e_{G'}.$$
> So $a^{-1}b \in K$.
>
> **(2 $\Rightarrow$ 3):** If $a^{-1}b \in K$, then $b \in aK$, so $bK = aK$ (since cosets are either equal or disjoint, and $b \in aK \cap bK$).
>
> **(3 $\Rightarrow$ 1):** If $aK = bK$, then $a^{-1}b \in K$, so $\phi(a^{-1}b) = e_{G'}$, giving $\phi(a)^{-1}\phi(b) = e_{G'}$, hence $\phi(a) = \phi(b)$.

**Interpretation.** The preimage $\phi^{-1}(\{y\})$ of any element $y \in \operatorname{im}(\phi)$ is a coset of $\ker(\phi)$. Specifically, if $\phi(a) = y$, then
$$\phi^{-1}(\{y\}) = aK = \{ak : k \in K\}.$$
These preimages are called the **fibers** of $\phi$. Every fiber has the same cardinality as $K = \ker(\phi)$.

---

## §13.8 The Fundamental Homomorphism Theorem (First Isomorphism Theorem)

This is one of the most important theorems in all of algebra.

> **Theorem 13.10 (Fundamental Homomorphism Theorem / First Isomorphism Theorem).** Let $\phi: G \to G'$ be a group homomorphism with kernel $K = \ker(\phi)$. Then the map
> $$\bar{\phi}: G/K \to \operatorname{im}(\phi), \qquad \bar{\phi}(aK) = \phi(a)$$
> is a well-defined isomorphism. In particular,
> $$G / \ker(\phi) \cong \operatorname{im}(\phi).$$

The theorem says that every homomorphism factors as:

$$G \xrightarrow{\gamma} G/K \xrightarrow{\bar{\phi}} \operatorname{im}(\phi) \hookrightarrow G'$$

where $\gamma: G \to G/K$ is the canonical projection $\gamma(a) = aK$, and $\bar{\phi}$ is an isomorphism. Thus $\phi = \iota \circ \bar{\phi} \circ \gamma$, where $\iota$ is the inclusion $\operatorname{im}(\phi) \hookrightarrow G'$.

Figure: factorization in the First Isomorphism Theorem.

![](../../_figures/13-first-isomorphism-factorization.svg)

The top map $\phi$ factors through the quotient by its kernel, and the middle map is the isomorphism onto the image.

> [!info]- Full Proof of Theorem 13.10
> We must verify four things: well-definedness, homomorphism, injectivity, surjectivity.
>
> **Well-definedness.** We must show that if $aK = bK$, then $\phi(a) = \phi(b)$. If $aK = bK$, then by Theorem 13.9, $\phi(a) = \phi(b)$. So $\bar{\phi}(aK) = \phi(a) = \phi(b) = \bar{\phi}(bK)$, confirming that $\bar{\phi}$ does not depend on the choice of coset representative.
>
> **Homomorphism.** For cosets $aK, bK \in G/K$:
> $$\bar{\phi}(aK \cdot bK) = \bar{\phi}((ab)K) = \phi(ab) = \phi(a)\phi(b) = \bar{\phi}(aK) \cdot \bar{\phi}(bK).$$
>
> **Injectivity.** Suppose $\bar{\phi}(aK) = \bar{\phi}(bK)$. Then $\phi(a) = \phi(b)$, so by Theorem 13.9, $aK = bK$. Thus $\bar{\phi}$ is injective.
>
> Alternatively, using Theorem 13.5: $\ker(\bar{\phi}) = \{aK : \bar{\phi}(aK) = e_{G'}\} = \{aK : \phi(a) = e_{G'}\} = \{aK : a \in K\} = \{K\}$ (the identity element of $G/K$). Since the kernel is trivial, $\bar{\phi}$ is injective.
>
> **Surjectivity.** For any $\phi(a) \in \operatorname{im}(\phi)$, we have $\bar{\phi}(aK) = \phi(a)$. So every element of $\operatorname{im}(\phi)$ is hit.
>
> Therefore $\bar{\phi}$ is a bijective homomorphism, i.e., an isomorphism. $\blacksquare$

### Hard worked example after Theorem 13.10: kernels, fibers, and the quotient all at once

Define
$$
\psi:\mathbb{Z}\times\mathbb{Z}\to \mathbb{Z}_6,\qquad \psi(a,b)=\overline{a+2b}.
$$

This is a homomorphism because
$$
\psi((a,b)+(c,d))=\overline{(a+c)+2(b+d)}=\overline{a+2b}+\overline{c+2d}.
$$

It is surjective because
$$
\psi(1,0)=\bar{1},
$$
and $\bar{1}$ generates $\mathbb{Z}_6$.

Now compute the kernel:
$$
\ker(\psi)=\{(a,b)\in \mathbb{Z}^2 : a+2b\equiv 0 \pmod 6\}.
$$
Rewrite the condition as
$$
a=6k-2b
$$
for some integer $k$. If we set $b=t$, then every kernel element has the form
$$
(a,b)=(6k-2t,t)=k(6,0)+t(-2,1).
$$
So
$$
\ker(\psi)=\langle (6,0),\,(-2,1)\rangle.
$$

Now the fibers become explicit. For example, the fiber over $\bar{4}$ is
$$
\psi^{-1}(\bar{4})=\{(a,b):a+2b\equiv 4\pmod 6\}.
$$
Since $\psi(4,0)=\bar{4}$, this fiber is the coset
$$
(4,0)+\ker(\psi).
$$
In full parametrized form:
$$
\psi^{-1}(\bar{4})=\{(4+6k-2t,\ t):k,t\in\mathbb{Z}\}.
$$

By the First Isomorphism Theorem,
$$
(\mathbb{Z}\times\mathbb{Z})/\langle (6,0),(-2,1)\rangle \cong \mathbb{Z}_6.
$$

This example is worth revisiting several times because it shows:

- a nontrivial kernel described as a subgroup of a free abelian group;
- fibers as cosets of that kernel;
- a concrete quotient identified without listing quotient elements individually.

---

## §13.9 Worked Examples of the First Isomorphism Theorem

### Example A: $\mathbb{Z}/n\mathbb{Z} \cong \mathbb{Z}_n$

Consider the homomorphism $\phi: \mathbb{Z} \to \mathbb{Z}_n$ defined by $\phi(m) = \bar{m}$ (reduction modulo $n$).

- $\phi$ is surjective: every element $\bar{k} \in \mathbb{Z}_n$ is $\phi(k)$. So $\operatorname{im}(\phi) = \mathbb{Z}_n$.
- $\ker(\phi) = \{m \in \mathbb{Z} : \bar{m} = \bar{0}\} = n\mathbb{Z}$.

By the First Isomorphism Theorem:
$$\mathbb{Z}/n\mathbb{Z} \cong \mathbb{Z}_n.$$

This is the formal justification for identifying residue classes with elements of $\mathbb{Z}_n$.

### Example B: $GL_n(\mathbb{R})/SL_n(\mathbb{R}) \cong \mathbb{R}^*$

Consider $\det: GL_n(\mathbb{R}) \to \mathbb{R}^*$.

- $\det$ is surjective: for any $r \in \mathbb{R}^*$, the matrix $\operatorname{diag}(r, 1, \ldots, 1) \in GL_n(\mathbb{R})$ has determinant $r$. So $\operatorname{im}(\det) = \mathbb{R}^*$.
- $\ker(\det) = SL_n(\mathbb{R})$.

By the First Isomorphism Theorem:
$$GL_n(\mathbb{R})/SL_n(\mathbb{R}) \cong \mathbb{R}^*.$$

The cosets of $SL_n(\mathbb{R})$ in $GL_n(\mathbb{R})$ are exactly the level sets of the determinant. Two matrices $A$ and $B$ lie in the same coset iff $\det(A) = \det(B)$.

### Example C: $S_n/A_n \cong \mathbb{Z}_2$

Consider $\operatorname{sgn}: S_n \to \{+1, -1\} \cong \mathbb{Z}_2$ (for $n \geq 2$).

- $\operatorname{sgn}$ is surjective: the identity is even (maps to $+1$) and any transposition is odd (maps to $-1$). So $\operatorname{im}(\operatorname{sgn}) = \{+1, -1\}$.
- $\ker(\operatorname{sgn}) = A_n$.

By the First Isomorphism Theorem:
$$S_n / A_n \cong \mathbb{Z}_2.$$

In particular, $[S_n : A_n] = 2$, so $|A_n| = n!/2$.

### Example D: Projection (worked out in full)

Let $\pi: \mathbb{Z}_6 \times \mathbb{Z}_4 \to \mathbb{Z}_6$ be the projection $\pi(a, b) = a$.

- $\operatorname{im}(\pi) = \mathbb{Z}_6$ (surjective).
- $\ker(\pi) = \{(0, b) : b \in \mathbb{Z}_4\} = \{(0,0), (0,1), (0,2), (0,3)\} \cong \mathbb{Z}_4$.

By the First Isomorphism Theorem:
$$(\mathbb{Z}_6 \times \mathbb{Z}_4) / (\{0\} \times \mathbb{Z}_4) \cong \mathbb{Z}_6.$$

The coset $(a, b) + \ker(\pi)$ consists of all pairs with first coordinate $a$: $\{(a, 0), (a, 1), (a, 2), (a, 3)\}$.

---

## §13.9½ Lang's viewpoint: the universal property of direct products

The projection example is not just a convenient homomorphism. It expresses the defining property of the direct product.

**Theorem (Universal property of $G \times H$).** Let $X$, $G$, and $H$ be groups, and let
$$
f:X\to G,\qquad g:X\to H
$$
be homomorphisms. Then there exists a unique homomorphism
$$
\langle f,g\rangle : X \to G\times H
$$
such that
$$
\pi_G\circ \langle f,g\rangle=f,\qquad \pi_H\circ \langle f,g\rangle=g,
$$
where $\pi_G$ and $\pi_H$ are the projection maps.

Figure: the universal property of the direct product.

![](../../_figures/13-product-universal-property.svg)

The two projection triangles say that a map into $G \times H$ is determined completely by its two coordinate maps.

> [!info]- Proof
> Define
> $$
> \langle f,g\rangle(x)=(f(x),g(x)).
> $$
> We check that this is a homomorphism:
> $$
> \langle f,g\rangle(xy)=(f(xy),g(xy))=(f(x)f(y),g(x)g(y))=(f(x),g(x))(f(y),g(y)).
> $$
> So $\langle f,g\rangle(xy)=\langle f,g\rangle(x)\langle f,g\rangle(y)$.
>
> The projection identities are immediate:
> $$
> \pi_G(\langle f,g\rangle(x))=\pi_G(f(x),g(x))=f(x),
> $$
> and similarly $\pi_H(\langle f,g\rangle(x))=g(x)$.
>
> For uniqueness, let $\psi:X\to G\times H$ be any homomorphism with $\pi_G\circ \psi=f$ and $\pi_H\circ \psi=g$. Write
> $$
> \psi(x)=(u_x,v_x).
> $$
> Then
> $$
> u_x=\pi_G(\psi(x))=f(x),\qquad v_x=\pi_H(\psi(x))=g(x),
> $$
> so $\psi(x)=(f(x),g(x))=\langle f,g\rangle(x)$ for every $x$. Therefore $\psi=\langle f,g\rangle$. $\blacksquare$

This theorem says that the direct product is not defined by its set-theoretic cartesian product alone. It is characterized by a mapping property: to map into $G\times H$ is exactly to give a map into $G$ and a map into $H$ simultaneously.

### A concrete example

Let
$$
f:\mathbb{Z}\to\mathbb{Z}_2,\qquad f(n)=\bar{n},
$$
and
$$
g:\mathbb{Z}\to\mathbb{Z}_3,\qquad g(n)=\bar{n}.
$$
Then the universal property gives a unique homomorphism
$$
\langle f,g\rangle:\mathbb{Z}\to\mathbb{Z}_2\times\mathbb{Z}_3,\qquad
\langle f,g\rangle(n)=(\bar{n},\bar{n}).
$$
Since $(\bar{1},\bar{1})$ has order $\operatorname{lcm}(2,3)=6$, the image is cyclic of order $6$, so
$$
\mathbb{Z}_2\times\mathbb{Z}_3\cong \mathbb{Z}_6.
$$
This is the product universal property meeting the CRT in a very concrete way.

**Remark.** In category-theoretic language, the direct product is the **product object** in $\mathbf{Grp}$. This is why the projection maps are canonical and why every compatible pair $(f,g)$ factors uniquely through $G\times H$.

### A harder factorization through a product

Take the two reduction maps
$$
f:\mathbb{Z}\to \mathbb{Z}_4,\qquad f(n)=\bar{n},
$$
and
$$
g:\mathbb{Z}\to \mathbb{Z}_6,\qquad g(n)=\bar{n}.
$$
The universal property gives a unique homomorphism
$$
\eta=\langle f,g\rangle:\mathbb{Z}\to \mathbb{Z}_4\times \mathbb{Z}_6,\qquad \eta(n)=(\bar{n},\bar{n}).
$$

Here is the place where many students overguess. The codomain has $24$ elements, so one may casually expect $\eta$ to be onto. It is not.

The image is generated by
$$
\eta(1)=(\bar{1},\bar{1}),
$$
whose order is
$$
\operatorname{lcm}(4,6)=12.
$$
So
$$
\operatorname{im}(\eta)=\langle (\bar{1},\bar{1})\rangle
$$
is a cyclic subgroup of order $12$, not the whole product of order $24$.

The kernel is
$$
\ker(\eta)=\{n\in \mathbb{Z}:n\equiv 0\pmod 4 \text{ and } n\equiv 0\pmod 6\}=12\mathbb{Z}.
$$
Therefore the First Isomorphism Theorem gives
$$
\mathbb{Z}/12\mathbb{Z}\cong \operatorname{im}(\eta)\le \mathbb{Z}_4\times \mathbb{Z}_6.
$$

This is a very instructive example because it separates three ideas that are easy to blur together:

- factorization through a product;
- surjectivity onto the image;
- surjectivity onto the entire codomain.

The universal property guarantees the first. The homomorphism theorem interprets the second. The third is an extra question that must be checked.

---

## §13.10 Showing Two Groups Are Isomorphic

There are two main strategies for proving $G \cong H$:

**Strategy 1: Construct an explicit bijective homomorphism.**
1. Define a map $\phi: G \to H$.
2. Verify $\phi$ is a homomorphism: $\phi(ab) = \phi(a)\phi(b)$.
3. Verify $\phi$ is injective: $\ker(\phi) = \{e\}$.
4. Verify $\phi$ is surjective: every element of $H$ is $\phi(g)$ for some $g$.

**Strategy 2: Use the First Isomorphism Theorem.**
1. Find a surjective homomorphism $\phi: G \to H$.
2. Compute $\ker(\phi)$.
3. Conclude $G/\ker(\phi) \cong H$.
4. If $\ker(\phi) = \{e\}$, then $G \cong H$ directly.

**Worked example.** Show that $\mathbb{R}/\mathbb{Z} \cong S^1$ (the circle group).

Define $\phi: \mathbb{R} \to S^1$ by $\phi(x) = e^{2\pi i x}$. Then:
- **Homomorphism:** $\phi(x + y) = e^{2\pi i(x+y)} = e^{2\pi ix} e^{2\pi iy} = \phi(x)\phi(y)$ (here $\mathbb{R}$ has addition, $S^1$ has multiplication).
- **Surjective:** Every $e^{i\theta} \in S^1$ equals $\phi(\theta/2\pi)$.
- **Kernel:** $\phi(x) = 1 \iff e^{2\pi ix} = 1 \iff x \in \mathbb{Z}$. So $\ker(\phi) = \mathbb{Z}$.

By the First Isomorphism Theorem: $\mathbb{R}/\mathbb{Z} \cong S^1$.

**Connection to the internal direct product theorem.** The technique of constructing isomorphisms via the First Isomorphism Theorem appears throughout algebra. The internal direct product theorem (if $G = HK$, $H \cap K = \{e\}$, and both $H, K \trianglelefteq G$, then $G \cong H \times K$) relies on constructing a surjective homomorphism $H \times K \to G$ and showing its kernel is trivial.

---

## §13.11 Lang's Perspective: Homomorphisms as Morphisms

From the viewpoint of Serge Lang's *Algebra* and category theory:

**Homomorphisms are the morphisms in the category $\mathbf{Grp}$.** A category consists of objects and morphisms between them. In $\mathbf{Grp}$:
- **Objects:** Groups.
- **Morphisms:** Group homomorphisms.
- **Composition:** Composition of functions (which preserves the homomorphism property).
- **Identity morphisms:** The identity homomorphism $\operatorname{id}_G$.

**Products are characterized by a universal property.** The preceding section is already category theory in concrete clothes: $G\times H$ is the categorical product in $\mathbf{Grp}$, characterized by its projections. This is why direct products are canonical and not just convenient constructions.

**The First Isomorphism Theorem is a factorization theorem.** Every morphism $\phi: G \to G'$ in $\mathbf{Grp}$ factors as:

$$G \xrightarrow{\text{surjection}} G/\ker(\phi) \xrightarrow{\text{isomorphism}} \operatorname{im}(\phi) \xrightarrow{\text{injection}} G'$$

This is the canonical epi-mono factorization: every morphism is a surjection (epimorphism) followed by an injection (monomorphism), up to isomorphism.

**Kernels measure the failure of injectivity.** The kernel is trivial iff $\phi$ is injective. In category-theoretic language, $\ker(\phi)$ is the categorical kernel (the equalizer of $\phi$ and the zero morphism). The "size" of the kernel measures how far $\phi$ is from being a monomorphism.

**Isomorphisms are the invertible morphisms.** The isomorphism $\phi: G \to G'$ has a two-sided inverse $\phi^{-1}: G' \to G$ in $\mathbf{Grp}$. The isomorphism classes of objects in $\mathbf{Grp}$ are the "truly different" groups.

**Why this perspective matters for Fraleigh.** Although Fraleigh does not use categorical language, every construction in Chapters 13--15 is a special case of a categorical concept. Recognizing this unifies the theorems:
- Kernels, images, and quotients in $\mathbf{Grp}$ work the same way as in $\mathbf{Ring}$, $\mathbf{Mod}_R$, and other algebraic categories.
- The Second and Third Isomorphism Theorems are further factorization results.
- Normal subgroups are exactly the kernels of morphisms out of $G$.

---

## Bridge to Chapters 14 and 15 -- from product maps to quotient maps to exact sequences

The chapter sequence from here should be read as one continuous structural argument.

1. [Chapter 11 - Direct Products and Finitely Generated Abelian Groups](./Chapter%2011%20-%20Direct%20Products%20and%20Finitely%20Generated%20Abelian%20Groups.md) gave products concretely.
2. This chapter shows that products are characterized by a universal property for maps into them.
3. [Chapter 14 - Factor Groups](./Chapter%2014%20-%20Factor%20Groups.md) will show that quotients are characterized by a universal property for maps out of them.
4. The First Isomorphism Theorem sits between those two universal properties: every homomorphism factors through its quotient by the kernel.
5. [Chapter 15 - Factor-Group Computations and Simple Groups](./Chapter%2015%20-%20Factor-Group%20Computations%20and%20Simple%20Groups.md) compresses the same situation into short exact sequences.

So the bridge is:
$$
\text{direct product universal property}
\;\longrightarrow\;
\text{quotient universal property}
\;\longrightarrow\;
\text{First Isomorphism Theorem}
\;\longrightarrow\;
\text{short exact sequence }1\to \ker(\phi)\to G\to \operatorname{im}(\phi)\to 1.
$$

If this chain feels natural, then the later chapters will feel like a deepening of Chapter 13 rather than a sequence of disconnected tricks.

---

## Summary

> [!tip] Flashcard-Ready Summary
> **Homomorphism:** $\phi: G \to G'$ satisfying $\phi(ab) = \phi(a)\phi(b)$.
>
> **Properties:** $\phi(e) = e'$; $\phi(a^{-1}) = \phi(a)^{-1}$; $|\phi(a)|$ divides $|a|$.
>
> **Kernel:** $\ker(\phi) = \phi^{-1}(e')$; always a normal subgroup of $G$.
>
> **Image:** $\operatorname{im}(\phi)$ is a subgroup of $G'$.
>
> **Injective iff trivial kernel:** $\phi$ is one-to-one $\iff$ $\ker(\phi) = \{e\}$.
>
> **Fibers = cosets:** $\phi(a) = \phi(b) \iff aK = bK$ where $K = \ker(\phi)$.
>
> **First Isomorphism Theorem:** $G/\ker(\phi) \cong \operatorname{im}(\phi)$.
>
> **Standard examples:** $\det$ (kernel $SL_n$), $\operatorname{sgn}$ (kernel $A_n$), mod-$n$ (kernel $n\mathbb{Z}$), projection, inclusion, trivial, identity.
>
> **Isomorphism:** bijective homomorphism; inverse is also a homomorphism.

---

### Mastery Checklist

- [ ] I can state the definition of a group homomorphism, emphasizing that the operations on the two sides may differ.
- [ ] I can prove that $\phi(e) = e'$ and $\phi(a^{-1}) = \phi(a)^{-1}$ from the homomorphism property alone.
- [ ] I can prove that $|\phi(a)|$ divides $|a|$.
- [ ] I can prove that $\operatorname{im}(\phi)$ is a subgroup and $\ker(\phi)$ is a subgroup.
- [ ] I can prove: $\phi$ injective $\iff$ $\ker(\phi) = \{e\}$.
- [ ] I can prove that $\ker(\phi) \trianglelefteq G$.
- [ ] I can identify the kernel, image, and fibers for each of the standard examples (det, sgn, mod-$n$, projection, inclusion, trivial, identity).
- [ ] I can state and prove the First Isomorphism Theorem.
- [ ] I can apply the First Isomorphism Theorem to obtain $\mathbb{Z}/n\mathbb{Z} \cong \mathbb{Z}_n$, $GL_n/SL_n \cong \mathbb{R}^*$, and $S_n/A_n \cong \mathbb{Z}_2$.
- [ ] I understand the two strategies for showing groups are isomorphic (explicit bijective homomorphism vs. First Isomorphism Theorem).
- [ ] I can state the universal property of the direct product and construct the unique map $\langle f,g\rangle:X\to G\times H$.
- [ ] I can explain why the First Isomorphism Theorem is a factorization of every homomorphism into a surjection followed by an injection, and how this connects to the categorical perspective.
