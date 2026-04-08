---
title: Chapter 04 - Groups
lang: en
sourceLanguage: en
translationStatus: original
---

A group is the first algebraic structure in the book whose axioms are strong enough to support a real proof theory. Once a set has an associative operation, an identity, and inverses, equations can be solved abstractly, cancellation becomes legitimate, and the same proof patterns reappear in nearly every later chapter. This rewrite provides numbered definitions and theorems, complete proofs, full worked examples, and exercises with solutions, matching the format of the Chapter 11 notes.

---

## §4.1 The definition of a group

### Definition 4.1 (Group)

A **group** is a set $G$ together with a binary operation $\ast : G \times G \to G$ satisfying:

1. **Associativity.** For all $a, b, c \in G$, $(a \ast b) \ast c = a \ast (b \ast c)$.
2. **Identity.** There exists an element $e \in G$ such that $e \ast a = a \ast e = a$ for every $a \in G$.
3. **Inverses.** For each $a \in G$ there exists $a^{-1} \in G$ such that $a \ast a^{-1} = a^{-1} \ast a = e$.

The phrase "binary operation on $G$" already encodes **closure**: the output of $a \ast b$ must lie in $G$ whenever $a, b \in G$. This is why careful definitions matter. If the proposed operation is not defined on every pair or sends some pair outside the set, the structure fails before one even begins checking associativity.

### Definition 4.2 (Abelian group)

A group $(G, \ast)$ is **abelian** (or **commutative**) if $a \ast b = b \ast a$ for all $a, b \in G$.

**Notation.** When the operation is understood, we write $ab$ instead of $a \ast b$ (multiplicative notation) or $a + b$ (additive notation, typically reserved for abelian groups). In additive notation the identity is written $0$ and inverses as $-a$.

---

## §4.2 Checking the axioms: the systematic order

Fraleigh's exercises repeatedly ask whether a set with an operation forms a group. The most efficient order of attack is:

1. **Closure.** Is $a \ast b \in G$ for all $a, b \in G$? (Often automatic from the definition of the operation.)
2. **Associativity.** Is $(a \ast b) \ast c = a \ast (b \ast c)$? This is the subtle step. Typically one *inherits* it from a known associative ambient operation (integer addition, matrix multiplication, function composition) rather than checking all triples.
3. **Identity.** Find a candidate $e$ and verify $ea = ae = a$ for all $a$.
4. **Inverses.** For each $a$, solve $ax = e$ and $xa = e$ and verify the solution lies in $G$.

### Remark 4.3 (Why associativity is the subtle axiom)

Identity and inverse checks are equations in one or two unknowns. Associativity is a universal statement about *all* triples. For a finite group of order $n$, a brute-force check requires $n^3$ verifications. In practice, one avoids this by either:
- inheriting associativity from a known associative operation (addition in $\mathbb{Z}$, multiplication in $\mathbb{R}$, matrix multiplication, function composition), or
- exhibiting an isomorphism to a known group.

A nice-looking Cayley table may suggest a group, but appearance is not proof. Whenever associativity is not inherited, it must be justified.

---

## §4.3 Standard examples that should become automatic

### Example 4.4 ($(\mathbb{Z}, +)$ — the basic infinite abelian group)

**Closure:** the sum of two integers is an integer. **Associativity:** inherited from integer addition. **Identity:** $0$. **Inverses:** $-n$ for each $n$. **Abelian:** $m + n = n + m$. This is the prototypical infinite cyclic group.

### Example 4.5 ($(\mathbb{Q}^{\ast}, \cdot)$ and $(\mathbb{R}^{\ast}, \cdot)$ — multiplicative groups)

Here $\mathbb{Q}^{\ast} = \mathbb{Q} \setminus \{0\}$ and $\mathbb{R}^{\ast} = \mathbb{R} \setminus \{0\}$.

**Closure:** the product of two nonzero rationals (reals) is nonzero. **Associativity:** inherited from field multiplication. **Identity:** $1$. **Inverses:** $a^{-1} = 1/a$ for $a \neq 0$. **Abelian:** $ab = ba$.

### Example 4.6 ($(\mathbb{Z}_n, +)$ — the basic finite model)

The set $\mathbb{Z}_n = \{\bar{0}, \bar{1}, \ldots, \overline{n-1}\}$ under addition modulo $n$.

**Closure:** addition mod $n$ stays in $\mathbb{Z}_n$. **Associativity:** inherited from integer addition. **Identity:** $\bar{0}$. **Inverses:** the inverse of $\bar{a}$ is $\overline{n - a}$ (equivalently $\overline{-a}$). **Abelian:** yes.

For $n = 4$: $|\mathbb{Z}_4| = 4$, and $\bar{1}$ has order $4$ (generating the whole group), so $\mathbb{Z}_4$ is cyclic.

### Example 4.7 ($GL_n(\mathbb{R})$ — the first nonabelian example)

The **general linear group** $GL_n(\mathbb{R})$ is the set of all invertible $n \times n$ real matrices under matrix multiplication.

**Closure:** if $A, B$ are invertible, then $\det(AB) = \det(A)\det(B) \neq 0$, so $AB$ is invertible. **Associativity:** matrix multiplication is associative. **Identity:** the identity matrix $I_n$. **Inverses:** the matrix inverse $A^{-1}$.

For $n \geq 2$ this group is **nonabelian**. Explicit example in $GL_2(\mathbb{R})$:
$$
A = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}, \qquad B = \begin{pmatrix} 1 & 0 \\ 1 & 1 \end{pmatrix}.
$$
$$
AB = \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}, \qquad BA = \begin{pmatrix} 1 & 1 \\ 1 & 2 \end{pmatrix}.
$$
Since $AB \neq BA$, the group is not abelian.

### Example 4.8 ($U(n)$ — units modulo $n$)

Define $U(n) = \{k \in \mathbb{Z}_n : \gcd(k, n) = 1\}$ with multiplication modulo $n$.

**Closure:** if $\gcd(a, n) = 1$ and $\gcd(b, n) = 1$, then $\gcd(ab, n) = 1$, so $\overline{ab} \in U(n)$. **Associativity:** inherited from integer multiplication. **Identity:** $\bar{1}$. **Inverses:** since $\gcd(a, n) = 1$, by Bezout's lemma there exist $s, t$ with $as + nt = 1$, so $\overline{s}$ is the multiplicative inverse of $\bar{a}$ modulo $n$.

The order of $U(n)$ is $\varphi(n)$ (Euler's totient function).

**Concrete examples:**
- $U(8) = \{1, 3, 5, 7\}$ under multiplication mod $8$. We will see this is isomorphic to $V_4$.
- $U(10) = \{1, 3, 7, 9\}$ under multiplication mod $10$, isomorphic to $\mathbb{Z}_4$ (since $3^2 = 9$, $3^3 = 27 \equiv 7$, $3^4 \equiv 1$, so $3$ has order $4$).
- $U(12) = \{1, 5, 7, 11\}$ under multiplication mod $12$. Every element squares to $1$: $5^2 = 25 \equiv 1$, $7^2 = 49 \equiv 1$, $11^2 = 121 \equiv 1$. So $U(12) \cong V_4$.

### Example 4.9 (Roots of unity $\mu_n$)

The $n$-th roots of unity are
$$
\mu_n = \{e^{2\pi i k / n} : k = 0, 1, \ldots, n - 1\} = \{z \in \mathbb{C} : z^n = 1\}.
$$

**Closure:** if $z^n = 1$ and $w^n = 1$ then $(zw)^n = z^n w^n = 1$. **Associativity:** inherited from complex multiplication. **Identity:** $1$. **Inverses:** $z^{-1} = \bar{z}$ (complex conjugate on the unit circle), and $(\bar{z})^n = \overline{z^n} = \bar{1} = 1$.

As a group, $\mu_n \cong \mathbb{Z}_n$ via the isomorphism $\bar{k} \mapsto e^{2\pi i k / n}$. For example, $\mu_4 = \{1, i, -1, -i\}$ is a cyclic group of order $4$ generated by $i$.

---

## §4.4 Non-examples and the discipline of naming the first failure

When a proposed structure fails to be a group, one should identify the **first** axiom (in the systematic order) that fails.

### Example 4.10 ($(\mathbb{Z}^+, +)$ — no identity)

Here $\mathbb{Z}^+ = \{1, 2, 3, \ldots\}$. Closure holds ($m + n \in \mathbb{Z}^+$), and associativity is inherited. But there is no element $e \in \mathbb{Z}^+$ with $e + a = a$ for all $a$; the number $0$ is not in $\mathbb{Z}^+$. **First failure: identity axiom.**

### Example 4.11 ($(\mathbb{Z}, \cdot)$ — no inverses)

Closure holds (product of integers is an integer), associativity is inherited, and the identity is $1 \in \mathbb{Z}$. But the inverse of $2$ would be $1/2 \notin \mathbb{Z}$. In fact, the only elements with multiplicative inverses in $\mathbb{Z}$ are $1$ and $-1$. **First failure: inverse axiom.**

### Example 4.12 ($(M_n(\mathbb{R}), \cdot)$ — no inverses for singular matrices)

The set of all $n \times n$ real matrices under multiplication. Closure and associativity hold, and $I_n$ is the identity. But any matrix with $\det = 0$ has no multiplicative inverse. **First failure: inverse axiom.** (This is why we restrict to $GL_n(\mathbb{R})$.)

### Example 4.13 ($a \ast b = a/b$ on $\mathbb{R}^{\ast}$ — not associative)

Define $a \ast b = a/b$ on $\mathbb{R}^{\ast}$. Closure holds. But:
$$
(a \ast b) \ast c = \frac{a/b}{c} = \frac{a}{bc}, \qquad a \ast (b \ast c) = \frac{a}{b/c} = \frac{ac}{b}.
$$
These are equal only when $b^2 c^2 = 1$ for all $b, c$, which is false. **First failure: associativity.** (Note: $e = 1$ would be a right identity since $a \ast 1 = a/1 = a$, but $1 \ast a = 1/a \neq a$ in general, so it fails as a two-sided identity too.)

---

## §4.5 Cayley tables for the groups of order 4

Small Cayley tables are not childish exercises; they are one of the cleanest ways to see structure. The groups of order four are the first place where tables make a real conceptual difference.

### Example 4.14 (Cayley table for $\mathbb{Z}_4$)

$\mathbb{Z}_4 = \{0, 1, 2, 3\}$ under addition mod $4$:

| $+_4$ | $0$ | $1$ | $2$ | $3$ |
| --- | --- | --- | --- | --- |
| $0$ | $0$ | $1$ | $2$ | $3$ |
| $1$ | $1$ | $2$ | $3$ | $0$ |
| $2$ | $2$ | $3$ | $0$ | $1$ |
| $3$ | $3$ | $0$ | $1$ | $2$ |

The element $1$ generates the whole group: $1, 1+1=2, 1+1+1=3, 1+1+1+1=0$. So $\mathbb{Z}_4$ is cyclic. The element $2$ has order $2$ (since $2 + 2 = 0$), and the element $3$ has order $4$ (another generator).

**Element orders in $\mathbb{Z}_4$:** $\operatorname{ord}(0) = 1$, $\operatorname{ord}(1) = 4$, $\operatorname{ord}(2) = 2$, $\operatorname{ord}(3) = 4$.

### Example 4.15 (Cayley table for the Klein four-group $V_4$)

$V_4 = \{e, a, b, c\}$ with $a^2 = b^2 = c^2 = e$, $ab = c$, $bc = a$, $ca = b$:

| $\ast$ | $e$ | $a$ | $b$ | $c$ |
| --- | --- | --- | --- | --- |
| $e$ | $e$ | $a$ | $b$ | $c$ |
| $a$ | $a$ | $e$ | $c$ | $b$ |
| $b$ | $b$ | $c$ | $e$ | $a$ |
| $c$ | $c$ | $b$ | $a$ | $e$ |

Every nonidentity element has order $2$. No element generates the whole group, so $V_4$ is **not cyclic**.

### Example 4.16 (Cayley table for $U(8) = \{1, 3, 5, 7\}$ mod $8$)

| $\cdot_8$ | $1$ | $3$ | $5$ | $7$ |
| --- | --- | --- | --- | --- |
| $1$ | $1$ | $3$ | $5$ | $7$ |
| $3$ | $3$ | $1$ | $7$ | $5$ |
| $5$ | $5$ | $7$ | $1$ | $3$ |
| $7$ | $7$ | $5$ | $3$ | $1$ |

**Verification of products:** $3 \cdot 3 = 9 \equiv 1$, $3 \cdot 5 = 15 \equiv 7$, $3 \cdot 7 = 21 \equiv 5$, $5 \cdot 5 = 25 \equiv 1$, $5 \cdot 7 = 35 \equiv 3$, $7 \cdot 7 = 49 \equiv 1$.

**Element orders:** $\operatorname{ord}(1) = 1$, $\operatorname{ord}(3) = 2$, $\operatorname{ord}(5) = 2$, $\operatorname{ord}(7) = 2$.

Every nonidentity element has order $2$, exactly as in $V_4$.

### Theorem 4.17. $V_4 \cong U(8)$.

> [!info]- Proof
>
> Define $\varphi : V_4 \to U(8)$ by $\varphi(e) = 1$, $\varphi(a) = 3$, $\varphi(b) = 5$, $\varphi(c) = 7$. This is a bijection. We verify it preserves the operation by comparing the two Cayley tables entry by entry.
>
> The key structural fact is that both groups have the property that the product of any two distinct nonidentity elements is the third nonidentity element:
> - In $V_4$: $ab = c$, $ac = b$, $bc = a$.
> - In $U(8)$: $3 \cdot 5 = 7$, $3 \cdot 7 = 5$, $5 \cdot 7 = 3$.
>
> This, together with $x^2 = e$ for all nonidentity elements, completely determines the group operation. Hence the tables agree under $\varphi$, and $\varphi$ is an isomorphism. $\blacksquare$

### Theorem 4.18. $\mathbb{Z}_4 \not\cong V_4$.

> [!info]- Proof
>
> In $\mathbb{Z}_4$, the element $1$ has order $4$. In $V_4$, every nonidentity element has order $2$. Since isomorphisms preserve element orders (if $\varphi(a) = b$ and $\varphi$ is an isomorphism, then $\operatorname{ord}(a) = \operatorname{ord}(b)$), no isomorphism can exist. $\blacksquare$

**Summary.** Up to isomorphism, there are exactly **two** groups of order $4$: the cyclic group $\mathbb{Z}_4$ and the Klein four-group $V_4$.

---

## §4.6 Subgroup lattices of the two order-4 groups

Subgroup structure is a clean invariant that distinguishes $\mathbb{Z}_4$ from $V_4$ independently of element orders.

### The lattice of $\mathbb{Z}_4$

The subgroups of $\mathbb{Z}_4$ are:
- $\{0\}$ (order $1$)
- $\{0, 2\}$ (order $2$, generated by $2$)
- $\{0, 1, 2, 3\} = \mathbb{Z}_4$ (order $4$)

The lattice is a **chain**: $\{0\} \subset \{0, 2\} \subset \mathbb{Z}_4$. There is exactly **one** subgroup of order $2$.

Since $U_4 = \mu_4 = \{1, i, -1, -i\}$ is cyclic and isomorphic to $\mathbb{Z}_4$, its subgroup lattice is also a chain: $\{1\} \subset \{1, -1\} \subset U_4$.

Figure: the subgroup lattice of $U_4 \cong \mathbb{Z}_4$.

![](../../_figures/u4-subgroup-lattice.svg)

What to read off it: a cyclic group of order $4$ has exactly one proper nontrivial subgroup.

### The lattice of $V_4$

The subgroups of $V_4 = \{e, a, b, c\}$ are:
- $\{e\}$ (order $1$)
- $\{e, a\}$ (order $2$)
- $\{e, b\}$ (order $2$)
- $\{e, c\}$ (order $2$)
- $V_4$ (order $4$)

There are **three** subgroups of order $2$, and the lattice is a "diamond":

Figure: the subgroup lattice of $V_4$.

![](../../_figures/v4-subgroup-lattice.svg)

What to read off it: unlike $\mathbb{Z}_4$, the Klein four-group has three distinct subgroups of order $2$.

### Why the lattices differ

An isomorphism $\varphi : G \to H$ sends subgroups of $G$ bijectively to subgroups of $H$, preserving inclusion and order. Since $\mathbb{Z}_4$ has one subgroup of order $2$ and $V_4$ has three, no such bijection can exist. This provides a **second proof** that $\mathbb{Z}_4 \not\cong V_4$, independent of element orders.

---

## §4.7 First theorems: uniqueness results

### Theorem 4.19 (Uniqueness of identity)

In a group $G$, the identity element is unique.

> [!info]- Proof
>
> Suppose $e$ and $f$ are both identity elements of $G$. Then:
> $$
> e = e \ast f = f.
> $$
> A common first stumble here is to mix up which identity law gives which equality. The correct bookkeeping is:
> - Since $e$ is an identity: $e \ast f = f$.
> - Since $f$ is an identity: $e \ast f = e$.
>
> Therefore $e = e \ast f = f$. $\blacksquare$

### Theorem 4.20 (Uniqueness of inverses)

In a group $G$, each element has a unique inverse.

> [!info]- Proof
>
> Let $b$ and $c$ both be inverses of $a$. Then $ba = e$ and $ac = e$. Compute:
> $$
> b = b \ast e = b \ast (a \ast c) = (b \ast a) \ast c = e \ast c = c.
> $$
> The key step uses associativity: $b(ac) = (ba)c$. Hence inverses are unique. $\blacksquare$

---

## §4.8 First theorems: cancellation and equation solving

### Theorem 4.21 (Left and right cancellation laws)

In a group $G$:
- **Left cancellation:** if $ax = ay$, then $x = y$.
- **Right cancellation:** if $xa = ya$, then $x = y$.

> [!info]- Proof
>
> **Left cancellation.** Suppose $ax = ay$. Multiply on the left by $a^{-1}$:
> $$
> a^{-1}(ax) = a^{-1}(ay).
> $$
> By associativity:
> $$
> (a^{-1}a)x = (a^{-1}a)y,
> $$
> so $ex = ey$, and therefore $x = y$.
>
> **Right cancellation.** Suppose $xa = ya$. Multiply on the right by $a^{-1}$:
> $$
> (xa)a^{-1} = (ya)a^{-1}.
> $$
> By associativity:
> $$
> x(aa^{-1}) = y(aa^{-1}),
> $$
> so $xe = ye$, and therefore $x = y$. $\blacksquare$

### Theorem 4.22 (Unique solvability of linear equations)

In a group $G$, for any $a, b \in G$:
- The equation $ax = b$ has the unique solution $x = a^{-1}b$.
- The equation $ya = b$ has the unique solution $y = ba^{-1}$.

> [!info]- Proof
>
> **Existence for $ax = b$.** Set $x = a^{-1}b$. Then $a(a^{-1}b) = (aa^{-1})b = eb = b$. So $x = a^{-1}b$ is a solution.
>
> **Uniqueness for $ax = b$.** If $x_1$ and $x_2$ are both solutions, then $ax_1 = b = ax_2$, and left cancellation gives $x_1 = x_2$.
>
> **Existence for $ya = b$.** Set $y = ba^{-1}$. Then $(ba^{-1})a = b(a^{-1}a) = be = b$.
>
> **Uniqueness for $ya = b$.** If $y_1 a = y_2 a$, right cancellation gives $y_1 = y_2$. $\blacksquare$
>
> **Remark.** In a nonabelian group, $a^{-1}b \neq ba^{-1}$ in general. So the solutions to $ax = b$ and $ya = b$ are different equations with (generally) different answers.

---

## §4.9 First theorems: the inverse of a product and double inverse

### Theorem 4.23 (Socks-and-shoes: $(ab)^{-1} = b^{-1}a^{-1}$)

In a group $G$, for any $a, b \in G$:
$$
(ab)^{-1} = b^{-1}a^{-1}.
$$

> [!info]- Proof
>
> We show that $b^{-1}a^{-1}$ satisfies the definition of the inverse of $ab$.
>
> **Left product:**
> $$
> (b^{-1}a^{-1})(ab) = b^{-1}(a^{-1}a)b = b^{-1}eb = b^{-1}b = e.
> $$
>
> **Right product:**
> $$
> (ab)(b^{-1}a^{-1}) = a(bb^{-1})a^{-1} = aea^{-1} = aa^{-1} = e.
> $$
>
> Since $b^{-1}a^{-1}$ is both a left and right inverse of $ab$, and inverses are unique (Theorem 4.20), we have $(ab)^{-1} = b^{-1}a^{-1}$. $\blacksquare$

**Why "socks and shoes"?** To undo the operation "put on socks, then shoes," you reverse the order: "remove shoes, then socks." The inverse of a sequence of operations is performed in reverse order.

**Generalization.** By induction, $(a_1 a_2 \cdots a_n)^{-1} = a_n^{-1} \cdots a_2^{-1} a_1^{-1}$.

### Theorem 4.24 (Double inverse: $(a^{-1})^{-1} = a$)

For any $a$ in a group $G$, $(a^{-1})^{-1} = a$.

> [!info]- Proof
>
> By definition, $a^{-1}$ is the unique element satisfying $a \cdot a^{-1} = a^{-1} \cdot a = e$. But these same equations say that $a$ is an inverse of $a^{-1}$. By uniqueness of inverses (Theorem 4.20), $(a^{-1})^{-1} = a$. $\blacksquare$

---

## §4.10 Theorem: $a^2 = e$ for all $a$ implies abelian

This result appeared in the context of Homework 1, Problem 1.

### Theorem 4.25

If $G$ is a group satisfying $a^2 = e$ for every $a \in G$, then $G$ is abelian.

> [!info]- Proof
>
> The hypothesis $a^2 = e$ means every element is its own inverse: $a^{-1} = a$ for all $a \in G$.
>
> For any $a, b \in G$, the element $ab$ also satisfies $(ab)^2 = e$, so $(ab)^{-1} = ab$. But by the socks-and-shoes rule (Theorem 4.23):
> $$
> (ab)^{-1} = b^{-1}a^{-1} = ba.
> $$
>
> Therefore $ab = ba$ for all $a, b \in G$, and $G$ is abelian. $\blacksquare$

**Remark.** This is how one recognizes Klein-four-type behavior: if a finite group has the property that every element squares to the identity, it must be abelian (and in fact is isomorphic to a direct product of copies of $\mathbb{Z}_2$, as the Fundamental Theorem of Finitely Generated Abelian Groups will eventually confirm).

---

## §4.11 Cayley tables as theorem sheets

### Reading structure from the table

For a finite group $G = \{g_1, g_2, \ldots, g_n\}$, the **Cayley table** is the $n \times n$ grid whose $(i, j)$-entry is $g_i \ast g_j$. One can extract:

- **Identity:** the row and column that reproduce the headers (i.e., the row for $e$ is $g_1, g_2, \ldots, g_n$ in order).
- **Inverses:** find where $e$ appears in a row; if $g_i \ast g_j = e$, then $g_j = g_i^{-1}$.
- **Commutativity:** the table is symmetric across the main diagonal if and only if the group is abelian.
- **Latin square property:** each element appears exactly once in each row and column. (See Theorem 4.26.)

### Theorem 4.26 (Latin square property)

In the Cayley table of a finite group $G$, each row and each column is a permutation of $G$.

> [!info]- Proof
>
> Fix $a \in G$ and consider the row labeled by $a$: it consists of the elements $\{a g_1, a g_2, \ldots, a g_n\}$.
>
> **No repeats (injectivity).** If $ag_i = ag_j$, then left cancellation (Theorem 4.21) gives $g_i = g_j$. So all entries in the row are distinct.
>
> **Complete (surjectivity).** Since $G$ is finite and we have $|G|$ distinct elements from $G$, the row contains every element of $G$ exactly once.
>
> Formally, the map $L_a : G \to G$ defined by $L_a(x) = ax$ is injective by cancellation. Since $G$ is finite, an injective map from a finite set to itself is also surjective. Hence the row for $a$ is a permutation of $G$.
>
> The same argument, using right cancellation and the map $R_a(x) = xa$, proves the result for columns. $\blacksquare$

**Remark.** The converse fails: not every Latin square with an identity row/column comes from a group. The Latin square property guarantees cancellation, but associativity must still be verified.

---

## §4.12 Finite groups and order

### Definition 4.27 (Order of a group)

The **order** of a group $G$, written $|G|$, is the number of elements in $G$ (if $G$ is finite).

### Definition 4.28 (Order of an element)

Let $G$ be a group and $a \in G$. The **order** of $a$, written $\operatorname{ord}(a)$ or $|a|$, is the smallest positive integer $n$ such that $a^n = e$. If no such $n$ exists, $a$ has **infinite order**.

**Worked computations of element orders:**

| Group | Element | Computation | Order |
| --- | --- | --- | --- |
| $\mathbb{Z}_6$ | $\bar{2}$ | $2, 4, 0$ (since $2+2+2 = 6 \equiv 0$) | $3$ |
| $\mathbb{Z}_6$ | $\bar{3}$ | $3, 0$ (since $3+3=6 \equiv 0$) | $2$ |
| $\mathbb{Z}_8$ | $\bar{3}$ | $3, 6, 1, 4, 7, 2, 5, 0$ | $8$ |
| $U(10)$ | $\bar{3}$ | $3, 9, 7, 1$ (i.e., $3^2=9$, $3^3=27\equiv 7$, $3^4=81\equiv 1$) | $4$ |
| $GL_2(\mathbb{R})$ | $\begin{psmallmatrix} 0 & -1 \\ 1 & 0 \end{psmallmatrix}$ | $A^2 = -I$, $A^3 = -A$, $A^4 = I$ | $4$ |

---

## §4.13 Lang's structural perspective: groups as categories

A group can be reinterpreted as a **category with one object** (call it $\ast$) in which **every morphism is invertible**:

| Group concept | Categorical translation |
| --- | --- |
| Elements of $G$ | Morphisms $\ast \to \ast$ |
| Group operation $ab$ | Composition of morphisms |
| Identity $e$ | Identity morphism $\mathrm{id}_{\ast}$ |
| Inverse $a^{-1}$ | Inverse morphism |

The axioms match: composition of morphisms is associative, the identity morphism exists, and invertibility of every morphism gives the inverse axiom.

**What this viewpoint explains:**
- A **homomorphism** $\varphi : G \to H$ is a functor between the corresponding one-object categories (it maps the single object to the single object and respects composition).
- The group axioms encode exactly the structure needed for **invertible composition**, which is why the same pattern (associativity + identity + inverses) appears in linear algebra ($GL_n$), topology (fundamental groups), and geometry (isometry groups).
- Later constructions — direct products, quotient groups, group actions — are all categorical constructions (products, coequalizers, functors to $\mathbf{Set}$) restricted to the category $\mathbf{Grp}$.

For now, the category-theoretic viewpoint should function as a structural translation that illuminates why the axioms are the way they are, not as a replacement for the concrete proofs above.

---

## §4.15 Flashcard-ready summary

> [!tip] Key facts for Chapter 4
>
> 1. **Group axioms (in checking order):** closure (from binary operation), associativity, identity, inverses.
> 2. **Abelian** = commutative: $ab = ba$ for all elements.
> 3. **Standard groups:** $(\mathbb{Z}, +)$, $(\mathbb{Q}^*, \cdot)$, $(\mathbb{R}^*, \cdot)$, $(\mathbb{Z}_n, +)$, $GL_n(\mathbb{R})$, $U(n)$, $\mu_n$.
> 4. **First nonabelian example:** $GL_2(\mathbb{R})$.
> 5. **Two groups of order 4:** $\mathbb{Z}_4$ (cyclic, has element of order 4) and $V_4$ (every nonidentity element has order 2).
> 6. $U(8) \cong V_4 \cong U(12)$ (all elements square to identity).
> 7. **Identity is unique; inverses are unique.**
> 8. **Cancellation:** $ax = ay \Rightarrow x = y$; $xa = ya \Rightarrow x = y$.
> 9. **Equation solving:** $ax = b$ has unique solution $x = a^{-1}b$.
> 10. **Socks and shoes:** $(ab)^{-1} = b^{-1}a^{-1}$.
> 11. **Double inverse:** $(a^{-1})^{-1} = a$.
> 12. $a^2 = e$ for all $a \in G$ $\Longrightarrow$ $G$ is abelian.
> 13. **Cayley table rows/columns** are permutations of $G$ (Latin square property, proved via cancellation).
> 14. **Lang's lens:** a group is a one-object category where every morphism is invertible.

---

## What should be mastered before leaving Chapter 4

- [ ] State the definition of a group cleanly (four axioms, abelian variant).
- [ ] Verify a proposed group structure systematically: closure, associativity, identity, inverses.
- [ ] Recognize standard examples instantly: $\mathbb{Z}$, $\mathbb{Q}^*$, $\mathbb{R}^*$, $\mathbb{Z}_n$, $GL_n(\mathbb{R})$, $U(n)$, $\mu_n$.
- [ ] Diagnose the first failing axiom in a non-example.
- [ ] Write Cayley tables for small groups and read off identity, inverses, commutativity.
- [ ] Distinguish $\mathbb{Z}_4$ from $V_4$ by element orders AND by subgroup structure.
- [ ] Show $V_4 \cong U(8)$ via the table.
- [ ] Prove uniqueness of identity and inverses without notes.
- [ ] Prove the cancellation laws and unique solvability of $ax = b$, $ya = b$.
- [ ] Prove the socks-and-shoes rule $(ab)^{-1} = b^{-1}a^{-1}$ and the double inverse $(a^{-1})^{-1} = a$.
- [ ] Prove: $a^2 = e$ for all $a$ implies $G$ is abelian.
- [ ] Prove the Latin square property of Cayley tables.
- [ ] Compute element orders in $\mathbb{Z}_n$ and $U(n)$.
- [ ] Explain a group as a one-object category (Lang's perspective).
