---
title: 3D Graphics
lang: en
sourceLanguage: en
translationStatus: original
---

> *Ars est celare artem.*  
> Art consists in concealing art.

3D graphics belongs here because it joins geometry, rendering, simulation, and representation. It is one of the places where abstract mathematics becomes visible and where computational technique becomes a mode of thought.

Within this notebook, the topic now splits between reusable theory notes and concrete project studies. The theory pages gather the concepts worth returning to; the project work is where those ideas are tested in code, scenes, and simulations.

<div class="landing-grid landing-grid--reference">
  <a class="landing-card" href="/en/Topics/3D-Graphics/Theory/">
    <strong>Theory</strong>
    <span>Rendering, geometry, simulation, and the mathematical structure behind visual computation.</span>
  </a>
  <a class="landing-card" href="/en/Topics/3D-Graphics/Real-Time-2D-Fluid-Simulation/">
    <strong>Project Study</strong>
    <span>Real-Time 2D Fluid Simulation, a browser-based dam-break study rebuilt as a cleaner technical case.</span>
  </a>
</div>

## Theory

This branch is for reusable notes: light transport, transforms, spatial structure, simulation models, and the conceptual material that makes later implementation clearer.

- rendering and light transport
- geometry, transforms, and spatial structure
- simulation and physically based modeling
- visual explanation as a form of inquiry

## Project Study

The current concrete build here is a browser-based fluid simulation project: a dam-break setup rebuilt into a clearer interactive study with live controls and inspectable behavior.

- particle-based fluid motion in the browser
- spatial hashing for local neighbor queries
- interactive controls for presets and disturbances
- implementation notes attached to a working demo

## Relation

Theory should sharpen what gets built; project work should return pressure to the theory by revealing where an idea is incomplete, awkward, or especially fruitful.
