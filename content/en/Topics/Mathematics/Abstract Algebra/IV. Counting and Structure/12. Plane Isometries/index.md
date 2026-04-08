---
title: Chapter 12 - Plane Isometries
lang: en
sourceLanguage: en
translationStatus: original
---

Plane isometries are distance-preserving transformations of $\mathbb{R}^2$, and they form a group under composition.

## Core classification

Every plane isometry is exactly one of:

- translation
- rotation
- reflection
- glide reflection

## High-yield facts

- Orientation-preserving isometries are translations and rotations.
- Orientation-reversing isometries are reflections and glide reflections.
- Two reflections compose to:
  - a translation if their axes are parallel
  - a rotation if their axes intersect

## Counterexamples worth remembering

- The composition of two reflections is not usually another reflection.
- A glide reflection is not a pure reflection and not a pure translation.

## Toggleable proofs

> [!info]- Why two reflections in parallel lines compose to a translation
>
> Choose coordinates so the two reflection axes are the vertical lines $x=0$ and $x=a$. Reflection across $x=0$ sends
> $$
> (x,y)\mapsto (-x,y),
> $$
> while reflection across $x=a$ sends
> $$
> (u,v)\mapsto (2a-u,v).
> $$
> Composing them gives
> $$
> (x,y)\mapsto (-x,y)\mapsto (2a-(-x),y)=(x+2a,y).
> $$
> This is exactly translation by the vector $(2a,0)$. So the composition of reflections in parallel lines is a translation.

> [!info]- Why two reflections in intersecting lines compose to a rotation
>
> Assume the two lines intersect at the origin, and let the angle from the first line to the second be $\theta$. After rotating coordinates, we may take the first line to be the $x$-axis. Reflection across the $x$-axis is represented by
> $$
> D=\begin{pmatrix}1&0\\0&-1\end{pmatrix}.
> $$
> Reflection across the line making angle $\theta$ with the $x$-axis is
> $$
> R_\theta D R_{-\theta},
> $$
> where $R_\theta$ is rotation by angle $\theta$. Therefore the composition is
> $$
> (R_\theta D R_{-\theta})D
> =R_\theta D(R_{-\theta}D).
> $$
> Using the identity $DR_{-\theta}=R_\theta D$, this becomes
> $$
> R_\theta R_\theta DD=R_{2\theta}.
> $$
> So the composition is rotation about the intersection point by angle $2\theta$.

## Companion exercises

1. Compose two reflections with parallel axes and identify the result.
2. Compose two reflections with intersecting axes and identify the result.
3. Give an explicit glide reflection.

## Textbook drill in your copy of Fraleigh 7e

- Work one classification exercise.
- Work one composition-of-reflections exercise.
- Work one orientation exercise.
