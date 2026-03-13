---
title: Real-Time 2D Fluid Simulation
lang: en
sourceLanguage: en
translationStatus: original
date: 2026-03-13
description: A browser-based dam-break simulation rebuilt as a polished portfolio mini-project with spatial hashing, interactive controls, and a cleaner presentation pass.
order: 1
hideFolderListing: true
tags:
  - fluid-simulation
  - particle-systems
  - javascript
  - graphics
---

<style>
.fluid-project-hero {
  margin: 1rem 0 1.5rem;
  padding: 1.35rem 1.4rem;
  border: 1px solid var(--lightgray);
  border-radius: 1.5rem;
  background:
    linear-gradient(135deg, var(--highlight), transparent 62%),
    var(--light);
  box-shadow: 0 20px 42px rgba(31, 27, 22, 0.08);
}

.fluid-project-kicker {
  margin: 0 0 0.4rem;
  color: var(--secondary);
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.fluid-project-hero h2 {
  margin: 0;
  font-size: clamp(1.55rem, 3vw, 2.25rem);
  line-height: 1.12;
}

.fluid-project-summary {
  margin: 0.9rem 0 0;
  max-width: 56rem;
  font-size: 1.06rem;
}

.fluid-project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.fluid-project-meta span {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.72rem;
  border: 1px solid var(--lightgray);
  border-radius: 999px;
  background: rgba(248, 245, 239, 0.82);
  font-size: 0.88rem;
}

.fluid-project-frame {
  margin: 1.4rem 0 0.65rem;
  padding: 0.7rem;
  border: 1px solid var(--lightgray);
  border-radius: 1.6rem;
  background: var(--light);
  box-shadow: 0 24px 50px rgba(31, 27, 22, 0.08);
}

.fluid-project-frame iframe {
  width: 100%;
  min-height: 59rem;
  border: 0;
  border-radius: 1rem;
  background: #111;
}

.fluid-project-links {
  margin: 0.35rem 0 1.8rem;
  font-size: 0.96rem;
}

.fluid-project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.45rem 0 1.75rem;
}

.fluid-project-card {
  padding: 1rem 1.05rem;
  border: 1px solid var(--lightgray);
  border-radius: 1rem;
  background: rgba(248, 245, 239, 0.72);
}

.fluid-project-card h3 {
  margin: 0 0 0.45rem;
  font-size: 1rem;
}

.fluid-project-card p {
  margin: 0;
  font-size: 0.95rem;
}

@media (max-width: 960px) {
  .fluid-project-grid {
    grid-template-columns: 1fr;
  }

  .fluid-project-frame iframe {
    min-height: 72rem;
  }
}

@media (max-width: 640px) {
  .fluid-project-hero {
    padding: 1.05rem;
  }

  .fluid-project-frame {
    padding: 0.45rem;
    border-radius: 1.1rem;
  }

  .fluid-project-frame iframe {
    min-height: 78rem;
    border-radius: 0.8rem;
  }
}
</style>

<div class="fluid-project-hero">
  <p class="fluid-project-kicker">Project Study</p>
  <h2>A browser-based dam-break simulation rebuilt as a cleaner, more presentable mini-project.</h2>
  <p class="fluid-project-summary">Originally developed in 2023 for an advanced graphics course, this portfolio pass keeps the strongest idea from the work, particle-based fluid motion with fast neighborhood queries, and reframes it as an interactive case study rather than a class submission.</p>
  <div class="fluid-project-meta">
    <span>JavaScript + Canvas</span>
    <span>Particle fluid solver</span>
    <span>Spatial hashing</span>
    <span>Interactive controls</span>
  </div>
</div>

<div class="fluid-project-frame">
  <iframe src="/en/Topics/3D-Graphics/Projects/Real-Time-2D-Fluid-Simulation/demo/index.htm" title="Real-Time 2D Fluid Simulation demo" loading="lazy"></iframe>
</div>

<p class="fluid-project-links"><a href="/en/Topics/3D-Graphics/Projects/Real-Time-2D-Fluid-Simulation/demo/index.htm">Open the demo on its own</a> for a roomier view.</p>

<div class="fluid-project-grid">
  <div class="fluid-project-card">
    <h3>Problem</h3>
    <p>Turn an older assignment-based fluid simulation into something that communicates engineering judgment, not just coursework completion.</p>
  </div>
  <div class="fluid-project-card">
    <h3>Approach</h3>
    <p>Keep the dam-break setup, preserve spatial hashing for local particle queries, and rebuild the presentation around controls, stats, and cleaner structure.</p>
  </div>
  <div class="fluid-project-card">
    <h3>Result</h3>
    <p>A standalone browser demo that lets viewers inspect solver tradeoffs, restart the scene, and actively stir the flow instead of passively watching it.</p>
  </div>
</div>

## Overview

This piece sits at the intersection of simulation and visual computing: a fluid block is released behind a wall, particles accelerate under gravity, local density is corrected through nearby interactions, and the entire scene runs directly in the browser. The portfolio version focuses less on assignment framing and more on what makes the build interesting: real-time behavior, spatial partitioning, and interactive inspection.

## What Changed In The Portfolio Version

- The project now carries a descriptive title rather than an assignment label.
- The demo has been rebuilt as a small standalone artifact with its own interface, presets, and live metrics.
- The presentation highlights the engineering decisions that matter most to a reviewer: particle count, solver substeps, collision behavior, and neighborhood acceleration.
- The interaction model is stronger: viewers can pause, reset, switch density presets, and drag through the water to disturb the simulation.

## Technical Notes

- Neighborhood queries are accelerated with a spatial hash so the solver only considers nearby particles rather than every particle pair.
- The scene is intentionally bounded and stylized: a retaining wall, a small house volume, and a tuned world scale make the motion easy to read.
- The portfolio pass prioritizes clarity and responsiveness over strict archival fidelity to the original 2023 submission. It is a cleaner reinterpretation of the same core idea.

## Next Steps

- Add a second comparison mode that visualizes density or velocity as a heat map.
- Record a short benchmark table that compares each preset's particle count against average frame time.
- Extend the scene with alternate obstacle layouts so the project reads more like a small simulation lab.
