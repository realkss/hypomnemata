---
title: Hawking Radiation from Bogoliubov Transformations
lang: en
sourceLanguage: en
translationStatus: original
order: 1
tags:
  - hawking_radiation
  - bogoliubov_transformations
  - qft_in_curved_spacetime
  - black_holes
  - gravitation
  - general_relativity
description: Lecture notes deriving the Hawking spectrum from Bogoliubov mode mixing in a collapsing black-hole spacetime.
---

Hawking radiation is most cleanly derived in quantum field theory on a fixed curved background. The central idea is not that particles are somehow emitted from a classical surface by hand, but that the notion of positive frequency changes between the asymptotic past and the asymptotic future of a spacetime produced by gravitational collapse. Once the "in" and "out" mode decompositions fail to agree, the vacuum defined at past null infinity is seen at future null infinity as a many-particle state.

These notes present that derivation in the Bogoliubov language. The geometry is classical, the field is quantum, and the thermal spectrum comes from an exponential relation between null coordinates near the event horizon.

## 1. Physical Setup

We consider a spacetime describing gravitational collapse to a Schwarzschild black hole of mass $M$. Outside the collapsing body, after the transient era has passed, the metric approaches the Schwarzschild form

$$
ds^2 = -\left(1 - \frac{2GM}{r c^2}\right)c^2 dt^2
+ \left(1 - \frac{2GM}{r c^2}\right)^{-1} dr^2
+ r^2 d\Omega^2.
$$

The quantum field will be taken, for simplicity, to be a free scalar field $\phi$ satisfying the curved-spacetime Klein-Gordon equation

$$
\Box \phi = 0,
$$

with

$$
\Box \phi
= \frac{1}{\sqrt{-g}} \partial_\mu \left( \sqrt{-g}\, g^{\mu \nu} \partial_\nu \phi \right).
$$

Two asymptotic regions matter:

- past null infinity $\mathcal{I}^-$, where incoming modes are defined
- future null infinity $\mathcal{I}^+$, where outgoing radiation is measured

The derivation asks a very precise question:

If the field is placed in the natural vacuum associated with positive-frequency modes on $\mathcal{I}^-$, what particle content is seen by an observer on $\mathcal{I}^+$ after the collapse has formed a horizon?

## 2. Why Particle Creation Is Even Possible

In Minkowski spacetime, time translation symmetry gives a distinguished notion of positive frequency, so there is a preferred vacuum. In a dynamical curved spacetime there is, in general, no global time coordinate with respect to which the entire spacetime admits a single positive-frequency split.

That means:

- the decomposition of the field into annihilation and creation operators is observer-dependent
- the vacuum defined by one asymptotic region need not be the vacuum defined by another
- particle creation is encoded in the mismatch between these decompositions

The Bogoliubov transformation is the precise way to quantify that mismatch.

## 3. Klein-Gordon Inner Product and Mode Bases

For two solutions $f$ and $g$ of the Klein-Gordon equation, the conserved inner product is

$$
(f,g) = -i \int_\Sigma d\Sigma^\mu \left(f \nabla_\mu g^* - g^* \nabla_\mu f \right),
$$

where $\Sigma$ is any Cauchy surface. Because the current is conserved, the value of this inner product does not depend on the choice of $\Sigma$.

We choose a complete orthonormal set of positive-frequency "in" modes $\{u^{\text{in}}_i\}$ on $\mathcal{I}^-$ and a complete orthonormal set of positive-frequency "out" modes $\{u^{\text{out}}_j\}$ on $\mathcal{I}^+$, normalized so that

$$
(u_i,u_j) = \delta_{ij}, \qquad (u_i^*,u_j^*) = -\delta_{ij}, \qquad (u_i,u_j^*) = 0.
$$

The field operator may then be expanded in either basis:

$$
\phi = \sum_i \left(a^{\text{in}}_i u^{\text{in}}_i + a^{\text{in}\dagger}_i u^{\text{in}*}_i \right),
$$

or

$$
\phi = \sum_j \left(a^{\text{out}}_j u^{\text{out}}_j + a^{\text{out}\dagger}_j u^{\text{out}*}_j \right).
$$

The in-vacuum is defined by

$$
a_i^{\text{in}} |0_{\text{in}}\rangle = 0
\qquad \text{for all } i.
$$

If the out-annihilation operators were linear combinations only of $a_i^{\text{in}}$, then the in-vacuum would also be an out-vacuum. Hawking radiation appears precisely because that is not what happens.

## 4. Bogoliubov Transformations

Since both sets of modes are complete, the out-modes can be expanded in the in-basis:

$$
u^{\text{out}}_j
= \sum_i \left(\alpha_{ji} u^{\text{in}}_i + \beta_{ji} u^{\text{in}*}_i \right).
$$

The coefficients are the Bogoliubov coefficients,

$$
\alpha_{ji} = \left(u^{\text{out}}_j, u^{\text{in}}_i \right),
\qquad
\beta_{ji} = -\left(u^{\text{out}}_j, u^{\text{in}*}_i \right).
$$

At the operator level,

$$
a^{\text{out}}_j
= \sum_i \left(\alpha_{ji}^* a^{\text{in}}_i - \beta_{ji}^* a^{\text{in}\dagger}_i \right).
$$

This is the decisive formula. If $\beta_{ji} \neq 0$, then $a^{\text{out}}_j$ contains creation operators with respect to the in-vacuum. Therefore the out-observer detects particles.

Indeed,

$$
\langle 0_{\text{in}} | N^{\text{out}}_j | 0_{\text{in}} \rangle
= \langle 0_{\text{in}} | a^{\text{out}\dagger}_j a^{\text{out}}_j | 0_{\text{in}} \rangle
= \sum_i |\beta_{ji}|^2.
$$

So the whole problem reduces to computing the $\beta$ coefficients.

## 5. Reduction to Radial Null Propagation

For the Hawking effect, the dominant near-horizon contribution can be understood by focusing on high-frequency outgoing modes and tracing them backward through the collapsing geometry. After angular decomposition, one effectively reduces the problem to a $1+1$ dimensional scattering problem in the $(t,r)$ sector, with an effective potential that produces greybody factors.

For the thermal part of the derivation, the essential kinematics comes from radial null propagation. Introduce the tortoise coordinate

$$
r_* = r + \frac{2GM}{c^2} \ln \left| \frac{r}{2GM/c^2} - 1 \right|,
$$

and the retarded null coordinate

$$
u = t - \frac{r_*}{c}.
$$

At future null infinity, outgoing positive-frequency modes behave as

$$
p_\omega^{\text{out}} \sim e^{-i \omega u},
$$

for $\omega > 0$.

The central task is to determine how such an outgoing mode looks when propagated backward to $\mathcal{I}^-$.

## 6. The Geometry of the Exponential Redshift

Consider an outgoing null ray that barely escapes the collapsing body after the horizon has almost formed. Such a ray spends an extremely long Schwarzschild time near the horizon. This is the origin of the enormous redshift.

If $U$ is a regular affine null coordinate on $\mathcal{I}^-$, then near the last escaping ray one finds an exponential relation of the form

$$
U_0 - U = A e^{-\kappa u},
$$

or equivalently

$$
u = -\frac{1}{\kappa} \ln \left(\frac{U_0 - U}{A}\right).
$$

Here:

- $U_0$ labels the null ray that just fails to escape and instead generates the horizon
- $A$ is a positive constant determined by the collapse details
- $\kappa$ is the surface gravity of the resulting black hole

For Schwarzschild,

$$
\kappa = \frac{c^4}{4GM}.
$$

This exponential map is the mathematical heart of the Hawking effect. Everything thermal comes from it.

## 7. Tracing an Outgoing Mode Back to $\mathcal{I}^-$

Take an outgoing mode on $\mathcal{I}^+$,

$$
p_\omega^{\text{out}} \sim e^{-i\omega u}.
$$

Using the exponential relation, we rewrite it in terms of the affine coordinate $U$ on $\mathcal{I}^-$:

$$
e^{-i\omega u}
= \exp\left[\frac{i\omega}{\kappa} \ln \left(\frac{U_0 - U}{A}\right)\right]
= A^{-i\omega/\kappa} (U_0 - U)^{i\omega/\kappa}.
$$

The important point is that this is not a simple plane wave in $U$. It has a branch-point structure at $U = U_0$, the location of the horizon-generating null ray.

Up to an irrelevant constant phase, the backward-traced mode on $\mathcal{I}^-$ is

$$
p_\omega^{\text{back}}(U)
\propto \Theta(U_0 - U)\, (U_0 - U)^{i\omega/\kappa},
$$

where $\Theta$ is a step function because only rays with $U < U_0$ escape to $\mathcal{I}^+$.

This object is not of definite positive frequency with respect to $U$. Therefore it must contain both positive- and negative-frequency pieces in the in-basis.

## 8. Fourier Analysis and the Origin of the $\beta$ Coefficients

To extract Bogoliubov coefficients, expand the traced-back mode in positive-frequency plane waves on $\mathcal{I}^-$:

$$
p_\omega^{\text{back}}(U)
= \int_0^\infty d\Omega
\left(
\alpha_{\omega \Omega} e^{-i\Omega U}
 \beta_{\omega \Omega} e^{+i\Omega U}
\right).
$$

The coefficient of $e^{+i\Omega U}$ is the negative-frequency part and therefore determines particle creation.

Shift the origin so that $x = U_0 - U > 0$. Then

$$
p_\omega^{\text{back}}(x) \propto x^{i\omega/\kappa}.
$$

The Fourier transform relevant to $\alpha_{\omega \Omega}$ and $\beta_{\omega \Omega}$ is therefore of the type

$$
\int_0^\infty dx\, x^{i\omega/\kappa} e^{\mp i \Omega x}.
$$

These integrals are evaluated by analytic continuation of the Gamma function. Up to normalization factors that do not affect the thermal ratio, one finds

$$
\alpha_{\omega \Omega}
\propto e^{+\pi \omega / 2\kappa}
\Gamma\!\left(1 + i\frac{\omega}{\kappa}\right)
\Omega^{-1 - i\omega/\kappa},
$$

and

$$
\beta_{\omega \Omega}
\propto e^{-\pi \omega / 2\kappa}
\Gamma\!\left(1 + i\frac{\omega}{\kappa}\right)
\Omega^{-1 - i\omega/\kappa}.
$$

Therefore

$$
|\beta_{\omega \Omega}|^2
= e^{-2\pi \omega/\kappa} |\alpha_{\omega \Omega}|^2.
$$

This relation is the thermal signature.

## 9. From Bogoliubov Ratio to Planck Spectrum

The Bogoliubov coefficients satisfy the normalization identity

$$
\int_0^\infty d\Omega
\left(
|\alpha_{\omega \Omega}|^2 - |\beta_{\omega \Omega}|^2
\right)
= 1,
$$

for each outgoing mode $\omega$, in the continuum normalization.

Combining this with

$$
|\beta_{\omega \Omega}|^2
= e^{-2\pi \omega/\kappa} |\alpha_{\omega \Omega}|^2,
$$

one obtains

$$
\langle N_\omega \rangle
= \int_0^\infty d\Omega\, |\beta_{\omega \Omega}|^2
= \frac{1}{e^{2\pi \omega/\kappa} - 1}.
$$

This is exactly the Bose-Einstein occupation number for a thermal spectrum.

Thus the in-vacuum is perceived at future null infinity as thermal radiation with temperature

$$
T_H = \frac{\hbar \kappa}{2\pi k_B c}.
$$

For the Schwarzschild black hole,

$$
T_H
= \frac{\hbar c^3}{8\pi G M k_B}.
$$

This is the Hawking temperature.

## 10. What the Derivation Has Actually Shown

The derivation does **not** say that a classical horizon emits particles in a mechanical sense. It says something more precise:

1. the collapse geometry causes outgoing null rays to acquire an exponential redshift
2. that redshift makes out-modes non-analytic with respect to the affine time on $\mathcal{I}^-$
3. the backward-traced out-modes therefore contain negative-frequency components relative to the in-vacuum
4. those negative-frequency components are measured by the Bogoliubov $\beta$ coefficients
5. the resulting occupation number is thermal

The thermal behavior is therefore a statement about mode decomposition on a curved, dynamically formed background.

## 11. Surface Gravity and Universality

The appearance of $\kappa$ is not accidental. Near any nonextremal horizon, the relation between a regular affine null coordinate and the stationary observer's null coordinate is exponential. That universal near-horizon structure is why Hawking-like radiation appears in many settings:

- Schwarzschild black holes
- Kerr and Reissner-Nordstrom black holes
- de Sitter horizons
- analog horizons in fluids, optics, and condensed matter systems

The detailed spectrum away from the horizon can be modified by scattering, superradiance, or boundary conditions, but the thermal factor is controlled by the same near-horizon exponential map.

## 12. Greybody Factors

The derivation above isolates the pure horizon contribution. In the full black-hole geometry, outgoing quanta must also scatter through the exterior curvature potential. This modifies the spectrum by frequency-dependent transmission coefficients $\Gamma_{\omega \ell}$, so that more precisely

$$
\langle N_{\omega \ell m} \rangle
= \frac{\Gamma_{\omega \ell}}{e^{2\pi \omega/\kappa} - 1}.
$$

So the radiation is thermal at the horizon, but not exactly a perfect blackbody at infinity. The deviation is entirely due to propagation through the exterior geometry.

## 13. Choice of Quantum State

The state relevant for an evaporating black hole formed by collapse is the **Unruh vacuum**:

- no incoming particles from $\mathcal{I}^-$
- regularity on the future horizon
- outgoing thermal flux on $\mathcal{I}^+$

This differs from:

- the **Boulware vacuum**, which is empty at both infinities but singular on the horizon
- the **Hartle-Hawking vacuum**, which describes thermal equilibrium with both ingoing and outgoing radiation

The Bogoliubov derivation described here is precisely the route to the Unruh-state result for collapse.

## 14. Energy Balance and Black-Hole Mass Loss

The outgoing Hawking quanta carry positive energy to infinity. Consistency of the semiclassical stress tensor then implies a compensating negative energy flux across the horizon. In stationary language one says that the partner mode falling inward carries negative Killing energy relative to infinity.

This is why the black-hole mass decreases:

$$
\frac{dM}{dt} < 0.
$$

The popular picture of "pair creation at the horizon" is only a heuristic. The actual derivation rests on global mode propagation and Bogoliubov mixing, not on a local pair-production mechanism in flat space.

## 15. Why This Is Still Semiclassical

An important conceptual boundary must be kept in view.

The derivation assumes:

- the spacetime metric is classical
- the quantum field propagates on that fixed background
- backreaction is neglected at leading order

So the Hilbert space in this calculation is the Hilbert space of the field $\phi$, not a Hilbert space of fluctuating geometries. This is exactly why Hawking radiation can be derived without a full theory of quantum gravity.

## 16. Caveats and Open Questions

The semiclassical derivation is robust, but it leaves deep questions behind:

- the trans-Planckian issue, since late outgoing quanta arise from exponentially blueshifted precursors
- the backreaction problem, once evaporation appreciably changes the geometry
- the information problem, if the radiation is exactly thermal at the fine-grained level

These do not invalidate the Bogoliubov calculation. They tell us where semiclassical gravity stops being the full story.

## 17. Compact Summary

The Hawking effect follows from three linked facts:

1. collapsing geometry produces an event horizon
2. near the horizon, affine null coordinates and asymptotic null coordinates are exponentially related
3. exponential ray tracing forces positive-frequency out-modes to contain negative-frequency in-components

That is why

$$
\beta \neq 0
\qquad \Longrightarrow \qquad
\langle N_\omega \rangle = \frac{1}{e^{2\pi \omega/\kappa} - 1},
$$

and therefore

$$
T_H = \frac{\hbar \kappa}{2\pi k_B c}.
$$

In this sense, Hawking radiation is a theorem about mode mixing in a collapsing spacetime.

## 18. Suggested Continuations

- Compare this derivation with the geometric intuition behind the [[en/Topics/Physics/Relativity and Gravitation/Personal Notes/GR/III. Applications of General Relativity/3. Gravitational Collapse and Black Holes/08. Penrose Process|Penrose Process]], where black-hole energetics already appears at the classical level.
- Revisit the Schwarzschild and Kerr solution notes so that the role of surface gravity and horizon structure remains concrete.
- From here, the natural next conceptual step is the stress-tensor derivation of flux and then the information-loss problem in semiclassical gravity.
