---
title: Chapter 02 - Binary Operations
lang: en
sourceLanguage: en
translationStatus: original
---

Binary operations are where algebra becomes precise. The phrase "an operation on a set" must mean a genuine function $S \times S \to S$, and that single statement already packages closure. This chapter isolates the properties of operations before the full group axioms appear.

---

## §2.1 The definition

### Definition 2.1 (Binary operation)

A **binary operation** on a set $S$ is a function
$$
\ast : S \times S \to S.
$$
For $(a, b) \in S \times S$, the output is written $a \ast b$. The requirement that $\ast$ maps into $S$ means **closure is built into the definition**: $a \ast b \in S$ for all $a, b \in S$.

### Remark 2.2 (Closure is not a separate axiom)

When we say "$\ast$ is a binary operation on $S$," we have already asserted closure. If a proposed rule sends some pair outside $S$ or is not defined on some pair, then it is not a binary operation on $S$. The discussion should stop there, before checking any further properties.

---

## §2.2 Properties of binary operations

### Definition 2.3 (Commutativity)

A binary operation $\ast$ on $S$ is **commutative** if
$$
a \ast b = b \ast a \quad \text{for all } a, b \in S.
$$

### Definition 2.4 (Associativity)

A binary operation $\ast$ on $S$ is **associative** if
$$
(a \ast b) \ast c = a \ast (b \ast c) \quad \text{for all } a, b, c \in S.
$$

Figure: associativity compares the two ways of multiplying a triple.

![](../../_figures/02-associativity-square.svg)

The diagram says that whether we combine the first two entries first or the last two first, we must land at the same element of $S$.

### Definition 2.5 (Identity element)

An element $e \in S$ is an **identity** for $\ast$ if
$$
e \ast a = a \ast e = a \quad \text{for all } a \in S.
$$

### Definition 2.6 (Inverse)

Suppose $\ast$ has an identity $e$. An element $b \in S$ is an **inverse** of $a \in S$ if
$$
a \ast b = b \ast a = e.
$$

---

## §2.3 Examples and non-examples

### Example 2.7 (Standard binary operations)

| Operation | Set | Binary op? | Commutative? | Associative? | Identity |
| --- | --- | --- | --- | --- | --- |
| $a + b$ | $\mathbb{Z}$ | Yes | Yes | Yes | $0$ |
| $a \cdot b$ | $\mathbb{Z}$ | Yes | Yes | Yes | $1$ |
| $a - b$ | $\mathbb{Z}$ | Yes | No | No | None (right: $0$) |
| $a / b$ | $\mathbb{Z}$ | **No** | --- | --- | --- |
| $\max(a,b)$ | $\mathbb{Z}$ | Yes | Yes | Yes | None |
| $\gcd(a,b)$ | $\mathbb{Z}^+$ | Yes | Yes | Yes | None |
| $AB$ (matrix) | $M_n(\mathbb{R})$ | Yes | No ($n \geq 2$) | Yes | $I_n$ |

### Example 2.8 (Subtraction is not associative)

On $\mathbb{Z}$, subtraction is a binary operation (closed: $a - b \in \mathbb{Z}$), but:
$$
(5 - 3) - 1 = 1, \qquad 5 - (3 - 1) = 3.
$$
Since $1 \neq 3$, subtraction is not associative. Also, $0$ is a right identity ($a - 0 = a$) but not a left identity ($0 - a = -a \neq a$ for $a \neq 0$), so there is no two-sided identity.

### Example 2.9 (Division is not a binary operation on $\mathbb{Z}$)

The rule $a / b$ is not defined for $b = 0$, and even when defined, $1/2 \notin \mathbb{Z}$. So $/ : \mathbb{Z} \times \mathbb{Z} \to \mathbb{Z}$ is not a function. The discussion stops here.

### Example 2.10 (The left-projection operation)

On any nonempty set $S$, define $a \ast b = a$. This is a binary operation:
- **Closure:** $a \ast b = a \in S$. Yes.
- **Associative:** $(a \ast b) \ast c = a \ast c = a$, and $a \ast (b \ast c) = a \ast b = a$. Yes.
- **Commutative:** $a \ast b = a$ vs $b \ast a = b$; fails unless $a = b$. Not commutative (if $|S| \geq 2$).
- **Identity:** Need $e \ast a = a$ for all $a$. But $e \ast a = e$, so $e = a$ for all $a$, impossible if $|S| \geq 2$. No identity.

This example shows that associativity alone forces nothing about invertibility.

### Example 2.11 (Max on $\{0, 1, 2\}$)

On $S = \{0, 1, 2\}$, define $a \ast b = \max\{a, b\}$. Associative and commutative, with $0$ as identity ($\max\{0, a\} = a$). But only $0$ has an inverse (itself), since $\max\{a, b\} = 0$ forces $a = b = 0$. Not a group.

---

## §2.4 Operation tables for finite sets

### Definition 2.12 (Operation table / Cayley table)

For a finite set $S = \{a_1, \ldots, a_n\}$ with binary operation $\ast$, the **operation table** (or **Cayley table**) is the $n \times n$ array whose $(i, j)$-entry is $a_i \ast a_j$.

### Example 2.13 (Operation table for $\mathbb{Z}_4$ under addition)

| $+_4$ | $0$ | $1$ | $2$ | $3$ |
| --- | --- | --- | --- | --- |
| $0$ | $0$ | $1$ | $2$ | $3$ |
| $1$ | $1$ | $2$ | $3$ | $0$ |
| $2$ | $2$ | $3$ | $0$ | $1$ |
| $3$ | $3$ | $0$ | $1$ | $2$ |

**Reading the table:**
- **Closure:** automatic (every entry is in $\{0, 1, 2, 3\}$).
- **Commutativity:** the table is symmetric across the main diagonal.
- **Identity:** the row for $0$ reproduces the header, and so does the column.
- **Inverses:** every element appears in every row (Latin square property).

### Example 2.14 (A non-associative operation table)

Define $\ast$ on $\{a, b\}$ by: $a \ast a = a$, $a \ast b = b$, $b \ast a = b$, $b \ast b = a$.

| $\ast$ | $a$ | $b$ |
| --- | --- | --- |
| $a$ | $a$ | $b$ |
| $b$ | $b$ | $a$ |

This looks like a group table (it is in fact $\mathbb{Z}_2$): under the identification $a \mapsto 0$, $b \mapsto 1$, the operation $\ast$ is addition mod $2$. One can also read the group axioms directly from the table: $a$ is the identity (its row and column reproduce the header), and every element is its own inverse ($a \ast a = a$, $b \ast b = a$).

But change one entry: let $b \ast a = a$ instead.

| $\ast'$ | $a$ | $b$ |
| --- | --- | --- |
| $a$ | $a$ | $b$ |
| $b$ | $a$ | $a$ |

Now check: $(b \ast' b) \ast' b = a \ast' b = b$, but $b \ast' (b \ast' b) = b \ast' a = a$. Not associative. A valid-looking table does not guarantee associativity.

### Remark 2.15 (Associativity cannot be read from the table at a glance)

Closure, identity, inverses, and commutativity can all be checked directly from a Cayley table. Associativity cannot: it requires checking $n^3$ triples. For small tables one checks by hand; for larger structures one inherits associativity from a known associative ambient operation.

---

## §2.5 Uniqueness of identity and inverse

### Theorem 2.16 (Uniqueness of identity)

If a binary operation $\ast$ on $S$ has a two-sided identity, it is unique.

> [!info]- Proof
>
> Suppose $e$ and $f$ are both two-sided identities. Then:
> $$
> e = e \ast f = f,
> $$
> where the first equality uses "$f$ is a right identity" and the second uses "$e$ is a left identity." Hence $e = f$. $\blacksquare$

### Theorem 2.17 (Uniqueness of inverse in an associative structure)

If $\ast$ is associative with identity $e$, and $a \in S$ has a two-sided inverse, that inverse is unique.

> [!info]- Proof
>
> Suppose $b$ and $c$ are both two-sided inverses of $a$:
> $$
> a \ast b = b \ast a = e, \qquad a \ast c = c \ast a = e.
> $$
> Then:
> $$
> b = b \ast e = b \ast (a \ast c) = (b \ast a) \ast c = e \ast c = c.
> $$
> The middle step uses associativity. Hence $b = c$. $\blacksquare$

### Remark 2.18 (Associativity is essential for uniqueness of inverses)

Without associativity, inverses need not be unique. The proof above uses associativity in exactly one place: the regrouping $b \ast (a \ast c) = (b \ast a) \ast c$. If this fails, the argument collapses.

---

## §2.6 One-sided data can force two-sided data

### Theorem 2.19 (Left identity + left inverses $\implies$ group)

Let $(S, \ast)$ be an associative binary structure with a left identity $e$ (so $e \ast x = x$ for all $x$) and left inverses (for each $a$, there exists $\ell$ with $\ell \ast a = e$). Then $e$ is a two-sided identity and every left inverse is a two-sided inverse.

> [!info]- Proof
>
> Fix $a \in S$ with left inverse $\ell$ ($\ell \ast a = e$). Let $m$ be a left inverse of $\ell$ ($m \ast \ell = e$). Then:
> $$
> a = e \ast a = (m \ast \ell) \ast a = m \ast (\ell \ast a) = m \ast e = m.
> $$
> That argument is too fast, because at this stage we have not yet proved that $e$ is a right identity. So we restart with a computation that uses only the given hypotheses.
>
> We have $\ell \ast a = e$ and $m \ast \ell = e$. Compute:
> $$
> a \ast \ell = (e) \ast (a \ast \ell) = (m \ast \ell) \ast (a \ast \ell) = m \ast (\ell \ast a) \ast \ell = m \ast e \ast \ell = m \ast (e \ast \ell) = m \ast \ell = e.
> $$
> So $\ell$ is also a right inverse of $a$. Now:
> $$
> a \ast e = a \ast (\ell \ast a) = (a \ast \ell) \ast a = e \ast a = a.
> $$
> So $e$ is also a right identity. $\blacksquare$

This theorem shows how much associativity controls the algebra: purely one-sided hypotheses become two-sided.

---

## Mastery Checklist

- [ ] State the definition of binary operation and explain why closure is part of the definition, not a separate axiom.
- [ ] Distinguish associativity from commutativity with examples where one holds but not the other.
- [ ] Give a non-example where the proposed rule fails to be a binary operation (closure fails).
- [ ] Prove uniqueness of the identity element.
- [ ] Prove uniqueness of inverses in the presence of associativity.
- [ ] Read a Cayley table and extract identity, inverses, and commutativity; explain why associativity cannot be read off.
- [ ] State and explain the "left identity + left inverses" theorem (Theorem 2.19).
