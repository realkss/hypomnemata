---
title: Chapter 03 - Isomorphic Binary Structures
lang: en
sourceLanguage: en
translationStatus: original
---

Isomorphism is the first genuinely structural notion in the course. It captures the idea that two algebraic objects may look different as sets of symbols while being identical as algebraic systems. Once this concept is absorbed, algebra becomes about patterns of composition rather than accidental names of elements.

---

## §3.1 The definition

### Definition 3.1 (Binary structure)

A **binary structure** is an ordered pair $\langle S, \ast \rangle$ where $S$ is a set and $\ast$ is a binary operation on $S$.

### Definition 3.2 (Isomorphism of binary structures)

Let $\langle S, \ast \rangle$ and $\langle S', \ast' \rangle$ be binary structures. An **isomorphism** from $\langle S, \ast \rangle$ to $\langle S', \ast' \rangle$ is a bijection
$$
\phi : S \to S'
$$
satisfying the **homomorphism property**:
$$
\phi(a \ast b) = \phi(a) \ast' \phi(b) \quad \text{for all } a, b \in S.
$$

If such a $\phi$ exists, we say the two structures are **isomorphic** and write $\langle S, \ast \rangle \cong \langle S', \ast' \rangle$.

### Remark 3.3 (What the definition requires)

An isomorphism must be:
1. **A function** $\phi : S \to S'$.
2. **Injective:** $\phi(a) = \phi(b) \implies a = b$.
3. **Surjective:** every element of $S'$ is in the image of $\phi$.
4. **Operation-preserving:** $\phi(a \ast b) = \phi(a) \ast' \phi(b)$.

A bijection that fails condition (4) is **not** an isomorphism. Equal cardinality is necessary but far from sufficient.

### Remark 3.4 (Reading the condition as a commuting diagram)

The homomorphism property says two procedures agree:
- **Top route:** multiply in $S$ first (compute $a \ast b$), then rename via $\phi$.
- **Bottom route:** rename each factor first ($\phi(a)$ and $\phi(b)$), then multiply in $S'$.

$$
\begin{array}{ccc}
S \times S & \xrightarrow{\;\ast\;} & S \\
\downarrow\scriptstyle{\phi \times \phi} & & \downarrow\scriptstyle{\phi} \\
S' \times S' & \xrightarrow{\;\ast'\;} & S'
\end{array}
$$

Figure: an isomorphism makes the operation square commute.

![](../../_figures/03-isomorphism-square.svg)

The top path multiplies first and then renames, while the bottom path renames first and then multiplies; isomorphism means these two routes agree.

The square commuting is the structural content of the definition.

---

## §3.2 Proving two structures are isomorphic

### Remark 3.5 (Strategy)

To prove $\langle S, \ast \rangle \cong \langle S', \ast' \rangle$:
1. **Define** an explicit map $\phi : S \to S'$.
2. **Prove** $\phi$ is injective.
3. **Prove** $\phi$ is surjective.
4. **Verify** the homomorphism property: $\phi(a \ast b) = \phi(a) \ast' \phi(b)$.

### Example 3.6 ($(\mathbb{R}, +) \cong (\mathbb{R}^+, \cdot)$ via $\exp$)

Define $\phi : \mathbb{R} \to \mathbb{R}^+$ by $\phi(x) = e^x$.

**Injective:** If $e^x = e^y$, then $x = y$ (since $\ln$ is well-defined).

**Surjective:** For any $y \in \mathbb{R}^+ = (0, \infty)$, we have $\phi(\ln y) = e^{\ln y} = y$.

**Homomorphism property:**
$$
\phi(x + y) = e^{x+y} = e^x \cdot e^y = \phi(x) \cdot \phi(y).
$$

Therefore $(\mathbb{R}, +) \cong (\mathbb{R}^+, \cdot)$. The inverse isomorphism is $\phi^{-1} = \ln$.

**Why this matters:** It converts additive problems to multiplicative ones. For instance, the additive equation $x + y = c$ becomes $e^x \cdot e^y = e^c$ in the multiplicative world.

### Example 3.7 ($(\mathbb{Z}, +) \cong (2\mathbb{Z}, +)$ via doubling)

Define $\phi : \mathbb{Z} \to 2\mathbb{Z}$ by $\phi(n) = 2n$.

**Injective:** $2m = 2n \implies m = n$.

**Surjective:** Every $2k \in 2\mathbb{Z}$ is $\phi(k)$.

**Homomorphism:** $\phi(m + n) = 2(m + n) = 2m + 2n = \phi(m) + \phi(n)$.

So $(\mathbb{Z}, +) \cong (2\mathbb{Z}, +)$, even though $2\mathbb{Z} \subsetneq \mathbb{Z}$.

### Example 3.8 ($U_7 \cong \mathbb{Z}_6$)

Let $U_7 = \{1, 2, 3, 4, 5, 6\}$ under multiplication mod $7$. The element $3$ generates $U_7$:
$$
3^1 \equiv 3, \quad 3^2 \equiv 2, \quad 3^3 \equiv 6, \quad 3^4 \equiv 4, \quad 3^5 \equiv 5, \quad 3^6 \equiv 1 \pmod{7}.
$$
Define $\phi : \mathbb{Z}_6 \to U_7$ by $\phi(\bar{k}) = 3^k \bmod 7$. Then:
$$
\phi(\bar{a} + \bar{b}) = 3^{a+b} = 3^a \cdot 3^b = \phi(\bar{a}) \cdot \phi(\bar{b}).
$$
Since the powers of $3$ hit every element of $U_7$ and $|\mathbb{Z}_6| = |U_7| = 6$, the map is bijective. So $\mathbb{Z}_6 \cong U_7$.

---

## §3.3 Structural properties preserved by isomorphisms

### Theorem 3.9 (Isomorphisms preserve structural properties)

Let $\phi : \langle S, \ast \rangle \to \langle S', \ast' \rangle$ be an isomorphism. Then:

1. If $e$ is an identity for $\ast$, then $\phi(e)$ is an identity for $\ast'$.
2. If $b$ is an inverse of $a$, then $\phi(b)$ is an inverse of $\phi(a)$.
3. $\ast$ is commutative if and only if $\ast'$ is commutative.
4. $\ast$ is associative if and only if $\ast'$ is associative.
5. (In the group setting) $\operatorname{ord}(a) = \operatorname{ord}(\phi(a))$ for every $a$.

> [!info]- Proof (parts 1 and 2)
>
> **(1) Identity.** Let $e$ be the identity in $S$. For any $a' \in S'$, surjectivity gives $a' = \phi(a)$ for some $a \in S$. Then:
> $$
> \phi(e) \ast' a' = \phi(e) \ast' \phi(a) = \phi(e \ast a) = \phi(a) = a'.
> $$
> Similarly $a' \ast' \phi(e) = a'$. So $\phi(e)$ is the identity in $S'$.
>
> **(2) Inverses.** Suppose $a \ast b = b \ast a = e$. Then:
> $$
> \phi(a) \ast' \phi(b) = \phi(a \ast b) = \phi(e) = e',
> $$
> and similarly $\phi(b) \ast' \phi(a) = e'$. So $\phi(b)$ is the inverse of $\phi(a)$. $\blacksquare$

> [!info]- Proof (part 5: order preservation)
>
> Suppose $\phi(a) = a'$. We show $\operatorname{ord}(a) = \operatorname{ord}(a')$.
>
> By the homomorphism property, $\phi(a^n) = \phi(a)^n = (a')^n$ for all $n \geq 1$ (by induction on $n$).
>
> If $a^m = e$, then $(a')^m = \phi(a^m) = \phi(e) = e'$, so $\operatorname{ord}(a') \mid m$, hence $\operatorname{ord}(a') \leq \operatorname{ord}(a)$.
>
> Conversely, if $(a')^m = e'$, then $\phi(a^m) = e' = \phi(e)$. Since $\phi$ is injective, $a^m = e$, so $\operatorname{ord}(a) \leq \operatorname{ord}(a')$.
>
> Therefore $\operatorname{ord}(a) = \operatorname{ord}(a')$. $\blacksquare$

---

## §3.4 Proving two structures are NOT isomorphic

### Remark 3.10 (The invariant method)

To prove $\langle S, \ast \rangle \not\cong \langle S', \ast' \rangle$, one does **not** test all possible bijections. Instead, find a **structural invariant** --- a property preserved by every isomorphism --- that one structure has and the other lacks.

### Common invariants:

| Invariant | How to use it |
| --- | --- |
| Cardinality | $|S| \neq |S'| \implies$ not isomorphic |
| Existence of identity | One has it, the other doesn't |
| Commutativity | One is commutative, the other isn't |
| Element orders | Different multisets of orders |
| Number of solutions to $x^2 = e$ | Differs between structures |
| Cyclicity | One is cyclic, the other isn't |

### Example 3.11 ($\mathbb{Z}_4 \not\cong V_4$)

Both groups have order $4$. In $\mathbb{Z}_4$, the element $\bar{1}$ has order $4$. In $V_4 = \mathbb{Z}_2 \times \mathbb{Z}_2$, every nonidentity element has order $2$:
$$
(1,0) + (1,0) = (0,0), \quad (0,1) + (0,1) = (0,0), \quad (1,1) + (1,1) = (0,0).
$$

> [!info]- Proof that $\mathbb{Z}_4 \not\cong V_4$
>
> Any isomorphism preserves element orders (Theorem 3.9, part 5). In $\mathbb{Z}_4$, the element $\bar{1}$ has order $4$. In $V_4$, no element has order $4$ (the maximal order is $2$). Therefore no isomorphism can exist. $\blacksquare$

**The invariant used:** existence of an element of order $4$.

### Example 3.12 ($(\mathbb{Z}, +) \not\cong (\mathbb{Q}, +)$)

Both are infinite abelian groups. The invariant: **cyclicity**. $(\mathbb{Z}, +)$ is cyclic (generated by $1$). $(\mathbb{Q}, +)$ is not cyclic: for any $q \in \mathbb{Q}$, the subgroup $\langle q \rangle = \{nq : n \in \mathbb{Z}\}$ misses $q/2$ (or most rationals). Since cyclicity is preserved by isomorphism, $\mathbb{Z} \not\cong \mathbb{Q}$.

### Example 3.13 ($(\mathbb{R}, +) \not\cong (\mathbb{R}, \cdot)$)

$(\mathbb{R}, \cdot)$ is not even a group ($0$ has no multiplicative inverse). So the comparison of group structures does not apply.

If we instead compare $(\mathbb{R}, +)$ and $(\mathbb{R}^*, \cdot)$ where $\mathbb{R}^* = \mathbb{R} \setminus \{0\}$: in $(\mathbb{R}^*, \cdot)$, the equation $x^2 = 1$ has two solutions ($x = \pm 1$). In $(\mathbb{R}, +)$, the equation $x + x = 0$ (i.e., $2x = 0$) has exactly one solution ($x = 0$). Since isomorphisms preserve the number of solutions to $x^2 = e$, we get $(\mathbb{R}, +) \not\cong (\mathbb{R}^*, \cdot)$.

(Note: $(\mathbb{R}, +) \cong (\mathbb{R}^+, \cdot)$, but not $(\mathbb{R}^*, \cdot)$.)

---

## §3.5 Isomorphism is an equivalence relation

### Theorem 3.14

The relation "$\cong$" on binary structures is an equivalence relation:

1. **Reflexive:** $\langle S, \ast \rangle \cong \langle S, \ast \rangle$ via $\mathrm{id}_S$.
2. **Symmetric:** if $\phi : S \to S'$ is an isomorphism, then $\phi^{-1} : S' \to S$ is an isomorphism.
3. **Transitive:** if $\phi : S \to S'$ and $\psi : S' \to S''$ are isomorphisms, then $\psi \circ \phi : S \to S''$ is an isomorphism.

> [!info]- Proof
>
> **(1)** The identity map $\mathrm{id}_S(a) = a$ is a bijection, and $\mathrm{id}_S(a \ast b) = a \ast b = \mathrm{id}_S(a) \ast \mathrm{id}_S(b)$.
>
> **(2)** $\phi^{-1}$ is a bijection. For $a', b' \in S'$, let $a = \phi^{-1}(a')$ and $b = \phi^{-1}(b')$. Then $\phi(a \ast b) = \phi(a) \ast' \phi(b) = a' \ast' b'$, so $a \ast b = \phi^{-1}(a' \ast' b')$. That is, $\phi^{-1}(a') \ast \phi^{-1}(b') = \phi^{-1}(a' \ast' b')$.
>
> **(3)** $\psi \circ \phi$ is a bijection (composition of bijections). For $a, b \in S$:
> $$
> (\psi \circ \phi)(a \ast b) = \psi(\phi(a \ast b)) = \psi(\phi(a) \ast' \phi(b)) = \psi(\phi(a)) \ast'' \psi(\phi(b)) = (\psi \circ \phi)(a) \ast'' (\psi \circ \phi)(b).
> $$
> $\blacksquare$

---

## §3.6 A non-example: bijection without operation-preservation

### Example 3.15 (A bijection that is not an isomorphism)

Define $\phi : (\mathbb{Z}, +) \to (\mathbb{Z}, +)$ by
$$
\phi(n) = n + 1.
$$
This is a bijection ($\phi$ shifts every integer by $1$, with inverse $\phi^{-1}(n) = n - 1$). But:
$$
\phi(a + b) = a + b + 1, \qquad \phi(a) + \phi(b) = (a+1) + (b+1) = a + b + 2.
$$
Since $a + b + 1 \neq a + b + 2$, the homomorphism property fails. So $\phi$ is a bijection but not an isomorphism.

**Lesson:** Equal cardinality (even an explicit bijection) does not imply isomorphism. The operation must be respected.

---

## Mastery Checklist

- [ ] State the definition of isomorphism precisely, including both bijectivity and the homomorphism property.
- [ ] Prove $(\mathbb{R}, +) \cong (\mathbb{R}^+, \cdot)$ via $\exp$, checking all conditions.
- [ ] Prove a non-isomorphism by invariant argument (e.g., $\mathbb{Z}_4 \not\cong V_4$).
- [ ] Explain why a bijection that does not preserve the operation is not an isomorphism.
- [ ] List at least four structural properties preserved by isomorphisms.
- [ ] Verify that $\cong$ is an equivalence relation on binary structures.
- [ ] Construct an explicit isomorphism between $\mathbb{Z}_n$ and a cyclic multiplicative group of the same order.
