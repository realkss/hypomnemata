const PRESETS = {
  gallery: { label: "Gallery", cols: 18, rows: 38, radius: 0.026 },
  study: { label: "Study", cols: 22, rows: 52, radius: 0.022 },
  dense: { label: "Dense", cols: 26, rows: 66, radius: 0.018 },
}

class FluidSimulation {
  constructor(canvas, controls) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.controls = controls
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.world = { width: 6, height: 4 }
    this.timeStep = 0.01
    this.solverIterations = 2
    this.gravity = -981
    this.hash = new Map()
    this.maxNeighborCount = 160
    this.neighborIds = new Int32Array(this.maxNeighborCount)
    this.neighborDx = new Float32Array(this.maxNeighborCount)
    this.neighborDy = new Float32Array(this.maxNeighborCount)
    this.neighborDist = new Float32Array(this.maxNeighborCount)
    this.gradX = new Float32Array(this.maxNeighborCount)
    this.gradY = new Float32Array(this.maxNeighborCount)
    this.pointer = {
      active: false,
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vx: 0,
      vy: 0,
      radius: 0.32,
    }
    this.palette = [
      "#79b5c9",
      "#74b2c8",
      "#6eaec8",
      "#69aac8",
      "#63a6c7",
      "#5ea2c6",
      "#579dc1",
      "#4f97bc",
      "#478fb3",
      "#3f87aa",
    ]
    this.frameAverage = 16
    this.currentPreset = "study"
    this.numSubSteps = Number(this.controls.substepsInput.value)
    this.collisionDamping = Number(this.controls.dampingInput.value)
    this.barrierHeight = Number(this.controls.barrierInput.value)
    this.isPaused = false
    this.lastFrame = 0

    this.handleResize = this.handleResize.bind(this)
    this.loop = this.loop.bind(this)

    this.setupEvents()
    this.selectPreset(this.currentPreset)
    this.handleResize()
    requestAnimationFrame(this.loop)
  }

  setupEvents() {
    window.addEventListener("resize", this.handleResize)

    this.controls.toggleButton.addEventListener("click", () => {
      this.isPaused = !this.isPaused
      this.controls.toggleButton.textContent = this.isPaused ? "Resume" : "Pause"
      if (!this.isPaused) {
        this.lastFrame = 0
      }
    })

    this.controls.resetButton.addEventListener("click", () => this.reset())

    this.controls.substepsInput.addEventListener("input", () => {
      this.numSubSteps = Number(this.controls.substepsInput.value)
      this.controls.substepsValue.textContent = String(this.numSubSteps)
    })

    this.controls.barrierInput.addEventListener("input", () => {
      this.barrierHeight = Number(this.controls.barrierInput.value)
      this.controls.barrierValue.textContent = `${this.barrierHeight.toFixed(2)} m`
      this.reset()
    })

    this.controls.dampingInput.addEventListener("input", () => {
      this.collisionDamping = Number(this.controls.dampingInput.value)
      this.controls.dampingValue.textContent = this.collisionDamping.toFixed(2)
    })

    this.controls.presetButtons.forEach((button) => {
      button.addEventListener("click", () => this.selectPreset(button.dataset.preset))
    })

    this.canvas.addEventListener("pointerdown", (event) => {
      const point = this.toWorld(event)
      this.pointer.active = true
      this.pointer.x = point.x
      this.pointer.y = point.y
      this.pointer.prevX = point.x
      this.pointer.prevY = point.y
      this.pointer.vx = 0
      this.pointer.vy = 0
      this.canvas.setPointerCapture(event.pointerId)
    })

    this.canvas.addEventListener("pointermove", (event) => {
      const point = this.toWorld(event)
      this.pointer.x = point.x
      this.pointer.y = point.y
      if (this.pointer.active) {
        this.pointer.vx = (point.x - this.pointer.prevX) * 24
        this.pointer.vy = (point.y - this.pointer.prevY) * 24
        this.pointer.prevX = point.x
        this.pointer.prevY = point.y
      }
    })

    const releasePointer = (event) => {
      if (!this.pointer.active) return
      this.pointer.active = false
      this.pointer.vx *= 0.5
      this.pointer.vy *= 0.5
      this.canvas.releasePointerCapture?.(event.pointerId)
    }

    this.canvas.addEventListener("pointerup", releasePointer)
    this.canvas.addEventListener("pointercancel", releasePointer)
    this.canvas.addEventListener("pointerleave", () => {
      if (!this.pointer.active) {
        this.pointer.vx = 0
        this.pointer.vy = 0
      }
    })
  }

  selectPreset(presetKey) {
    if (!PRESETS[presetKey]) return
    this.currentPreset = presetKey
    this.controls.presetButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === presetKey)
    })
    this.reset()
  }

  reset() {
    const preset = PRESETS[this.currentPreset]
    this.particleRadius = preset.radius
    this.particleDiameter = this.particleRadius * 2
    this.kernelRadius = this.particleRadius * 3
    this.kernelRadius2 = this.kernelRadius * this.kernelRadius
    this.gridSpacing = this.kernelRadius * 1.5
    this.gridSpacing2 = this.gridSpacing * this.gridSpacing
    this.invGridSpacing = 1 / this.gridSpacing
    this.restDensity = 0.997 / (this.particleDiameter * this.particleDiameter)
    this.maxVel = 0.45 * this.particleRadius
    this.unilateral = true
    this.kernelNorm = 4 / (Math.PI * this.kernelRadius2 ** 4)

    this.particleCount = preset.cols * preset.rows
    this.posX = new Float32Array(this.particleCount)
    this.posY = new Float32Array(this.particleCount)
    this.prevX = new Float32Array(this.particleCount)
    this.prevY = new Float32Array(this.particleCount)
    this.velX = new Float32Array(this.particleCount)
    this.velY = new Float32Array(this.particleCount)

    this.obstacles = [
      {
        left: 2.0,
        right: 2.48,
        bottom: -0.02,
        top: this.barrierHeight,
        fill: "#d3c0a0",
      },
      {
        left: 5.08,
        right: 5.72,
        bottom: -0.02,
        top: 0.68,
        fill: "#d8ccb1",
      },
    ]

    const startX = 0.18
    const startY = 0.04
    const xJitter = 0.00001
    let index = 0
    for (let row = 0; row < preset.rows; row++) {
      for (let col = 0; col < preset.cols; col++) {
        this.posX[index] = startX + col * this.particleDiameter + xJitter * (row % 2)
        this.posY[index] = startY + row * this.particleDiameter
        this.prevX[index] = this.posX[index]
        this.prevY[index] = this.posY[index]
        this.velX[index] = 0
        this.velY[index] = 0
        index++
      }
    }

    this.controls.statParticles.textContent = this.particleCount.toLocaleString()
  }

  handleResize() {
    const bounds = this.canvas.getBoundingClientRect()
    const width = Math.max(320, Math.floor(bounds.width * this.pixelRatio))
    const height = Math.max(240, Math.floor(bounds.height * this.pixelRatio))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  toWorld(event) {
    const rect = this.canvas.getBoundingClientRect()
    const scale = Math.min(rect.width / this.world.width, rect.height / this.world.height)
    const offsetX = (rect.width - this.world.width * scale) * 0.5
    const offsetY = (rect.height - this.world.height * scale) * 0.5
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: this.world.height - (event.clientY - rect.top - offsetY) / scale,
    }
  }

  hashKey(gridX, gridY) {
    return (gridX + 2048) * 4096 + (gridY + 2048)
  }

  rebuildHash() {
    this.hash.clear()
    for (let i = 0; i < this.particleCount; i++) {
      const gridX = Math.floor(this.posX[i] * this.invGridSpacing)
      const gridY = Math.floor(this.posY[i] * this.invGridSpacing)
      const key = this.hashKey(gridX, gridY)
      let bucket = this.hash.get(key)
      if (!bucket) {
        bucket = []
        this.hash.set(key, bucket)
      }
      bucket.push(i)
    }
  }

  collectNeighbors(index) {
    const px = this.posX[index]
    const py = this.posY[index]
    const gridX = Math.floor(px * this.invGridSpacing)
    const gridY = Math.floor(py * this.invGridSpacing)
    let count = 0

    for (let x = gridX - 1; x <= gridX + 1; x++) {
      for (let y = gridY - 1; y <= gridY + 1; y++) {
        const bucket = this.hash.get(this.hashKey(x, y))
        if (!bucket) continue

        for (let k = 0; k < bucket.length; k++) {
          const neighborIndex = bucket[k]
          const dx = this.posX[neighborIndex] - px
          const dy = this.posY[neighborIndex] - py
          const dist2 = dx * dx + dy * dy
          if (dist2 >= this.gridSpacing2 || count >= this.maxNeighborCount) continue

          this.neighborIds[count] = neighborIndex
          this.neighborDx[count] = dx
          this.neighborDy[count] = dy
          this.neighborDist[count] = Math.sqrt(dist2)
          count++
        }
      }
    }

    return count
  }

  applyPointerImpulse() {
    const radius2 = this.pointer.radius * this.pointer.radius
    const impulseScale = this.pointer.active ? 1.25 : 0.4
    if (Math.abs(this.pointer.vx) < 0.0001 && Math.abs(this.pointer.vy) < 0.0001) {
      return
    }

    for (let i = 0; i < this.particleCount; i++) {
      const dx = this.posX[i] - this.pointer.x
      const dy = this.posY[i] - this.pointer.y
      const dist2 = dx * dx + dy * dy
      if (dist2 > radius2) continue

      const influence = 1 - Math.sqrt(dist2) / this.pointer.radius
      this.velX[i] += this.pointer.vx * influence * impulseScale
      this.velY[i] += this.pointer.vy * influence * impulseScale
    }
  }

  // Project local density constraints using neighbors from the spatial hash.
  densityProjection() {
    for (let i = 0; i < this.particleCount; i++) {
      const neighborCount = this.collectNeighbors(i)
      let rho = 0
      let sumGrad2 = 0
      let gradIx = 0
      let gradIy = 0

      for (let j = 0; j < neighborCount; j++) {
        const r = this.neighborDist[j]
        let nx = 0
        let ny = 0

        if (r > 0) {
          nx = this.neighborDx[j] / r
          ny = this.neighborDy[j] / r
        }

        if (r > this.kernelRadius) {
          this.gradX[j] = 0
          this.gradY[j] = 0
          continue
        }

        const r2 = r * r
        const w = this.kernelRadius2 - r2
        rho += this.kernelNorm * w * w * w
        const grad = (this.kernelNorm * 3 * w * w * (-2 * r)) / this.restDensity

        this.gradX[j] = nx * grad
        this.gradY[j] = ny * grad
        gradIx -= nx * grad
        gradIy -= ny * grad
        sumGrad2 += grad * grad
      }

      sumGrad2 += gradIx * gradIx + gradIy * gradIy
      const constraint = rho / this.restDensity - 1
      if (this.unilateral && constraint < 0) {
        continue
      }

      const lambda = -constraint / (sumGrad2 + 0.0001)
      for (let j = 0; j < neighborCount; j++) {
        const neighborIndex = this.neighborIds[j]
        if (neighborIndex === i) {
          this.posX[neighborIndex] += lambda * gradIx
          this.posY[neighborIndex] += lambda * gradIy
        } else {
          this.posX[neighborIndex] += lambda * this.gradX[j]
          this.posY[neighborIndex] += lambda * this.gradY[j]
        }
      }
    }
  }

  solveBoundaries() {
    const maxX = this.world.width - this.particleRadius
    const maxY = this.world.height - this.particleRadius
    const minX = this.particleRadius
    const minY = this.particleRadius

    for (let i = 0; i < this.particleCount; i++) {
      let px = this.posX[i]
      let py = this.posY[i]

      if (py < minY) {
        this.posY[i] = minY
        this.velY[i] *= -this.collisionDamping
        py = minY
      } else if (py > maxY) {
        this.posY[i] = maxY
        this.velY[i] *= -this.collisionDamping
        py = maxY
      }

      if (px < minX) {
        this.posX[i] = minX
        this.velX[i] *= -this.collisionDamping
        px = minX
      } else if (px > maxX) {
        this.posX[i] = maxX
        this.velX[i] *= -this.collisionDamping
        px = maxX
      }

      for (let j = 0; j < this.obstacles.length; j++) {
        const obstacle = this.obstacles[j]
        if (
          px < obstacle.left - this.particleRadius ||
          px > obstacle.right + this.particleRadius ||
          py < obstacle.bottom - this.particleRadius ||
          py > obstacle.top + this.particleRadius
        ) {
          continue
        }

        const dx =
          px < (obstacle.left + obstacle.right) * 0.5
            ? obstacle.left - px - this.particleRadius
            : obstacle.right - px + this.particleRadius
        const dy =
          py < (obstacle.bottom + obstacle.top) * 0.5
            ? obstacle.bottom - py - this.particleRadius
            : obstacle.top - py + this.particleRadius

        if (Math.abs(dx) < Math.abs(dy)) {
          this.posX[i] += dx
          this.velX[i] *= -this.collisionDamping
          px = this.posX[i]
        } else {
          this.posY[i] += dy
          this.velY[i] *= -this.collisionDamping
          py = this.posY[i]
        }
      }
    }
  }

  step() {
    const dt = this.timeStep / this.numSubSteps

    for (let step = 0; step < this.numSubSteps; step++) {
      this.applyPointerImpulse()

      for (let i = 0; i < this.particleCount; i++) {
        this.velY[i] += this.gravity * dt
        this.prevX[i] = this.posX[i]
        this.prevY[i] = this.posY[i]
        this.posX[i] += this.velX[i] * dt
        this.posY[i] += this.velY[i] * dt
      }

      this.solveBoundaries()

      for (let iteration = 0; iteration < this.solverIterations; iteration++) {
        this.rebuildHash()
        this.densityProjection()
        this.solveBoundaries()
      }

      for (let i = 0; i < this.particleCount; i++) {
        let vx = this.posX[i] - this.prevX[i]
        let vy = this.posY[i] - this.prevY[i]
        const speed = Math.hypot(vx, vy)
        if (speed > this.maxVel) {
          const clamp = this.maxVel / speed
          vx *= clamp
          vy *= clamp
          this.posX[i] = this.prevX[i] + vx
          this.posY[i] = this.prevY[i] + vy
        }

        this.velX[i] = (this.posX[i] - this.prevX[i]) / dt
        this.velY[i] = (this.posY[i] - this.prevY[i]) / dt
      }

      this.pointer.vx *= 0.88
      this.pointer.vy *= 0.88
    }
  }

  drawBackground(scale, offsetX, offsetY) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, "#183345")
    gradient.addColorStop(0.55, "#102331")
    gradient.addColorStop(1, "#0f1c26")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    ctx.save()
    ctx.translate(offsetX, offsetY)

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"
    ctx.lineWidth = 1
    for (let x = 0; x <= this.world.width; x += 0.5) {
      const sx = x * scale
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, this.world.height * scale)
      ctx.stroke()
    }

    for (let y = 0; y <= this.world.height; y += 0.5) {
      const sy = (this.world.height - y) * scale
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(this.world.width * scale, sy)
      ctx.stroke()
    }

    ctx.restore()
  }

  drawObstacles(scale, offsetX, offsetY) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(offsetX, offsetY)

    ctx.fillStyle = "rgba(221, 205, 176, 0.12)"
    ctx.fillRect(0, this.world.height * scale - 0.18 * scale, this.world.width * scale, 0.18 * scale)

    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]
      const left = obstacle.left * scale
      const top = (this.world.height - obstacle.top) * scale
      const width = (obstacle.right - obstacle.left) * scale
      const height = (obstacle.top - obstacle.bottom) * scale

      ctx.fillStyle = obstacle.fill
      ctx.strokeStyle = "rgba(77, 58, 34, 0.48)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(left, top, width, height, 10)
      ctx.fill()
      ctx.stroke()
    }

    const house = this.obstacles[1]
    const roofLeft = house.left * scale - 0.06 * scale
    const roofRight = house.right * scale + 0.06 * scale
    const roofTop = (this.world.height - house.top) * scale - 0.3 * scale
    const roofBase = (this.world.height - house.top) * scale + 0.02 * scale

    ctx.fillStyle = "#725236"
    ctx.beginPath()
    ctx.moveTo(roofLeft, roofBase)
    ctx.lineTo((roofLeft + roofRight) * 0.5, roofTop)
    ctx.lineTo(roofRight, roofBase)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  drawParticles(scale, offsetX, offsetY) {
    const ctx = this.ctx
    const radius = Math.max(1.8, this.particleRadius * scale)

    ctx.save()
    ctx.translate(offsetX, offsetY)

    for (let i = 0; i < this.particleCount; i++) {
      const px = this.posX[i] * scale
      const py = (this.world.height - this.posY[i]) * scale
      const speed = Math.min(1, Math.hypot(this.velX[i], this.velY[i]) / 240)
      const colorIndex = Math.min(this.palette.length - 1, Math.floor(speed * this.palette.length))

      ctx.fillStyle = this.palette[colorIndex]
      ctx.beginPath()
      ctx.arc(px, py, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  render() {
    const scale = Math.min(
      this.canvas.width / this.world.width,
      this.canvas.height / this.world.height,
    )
    const offsetX = (this.canvas.width - this.world.width * scale) * 0.5
    const offsetY = (this.canvas.height - this.world.height * scale) * 0.5

    this.drawBackground(scale, offsetX, offsetY)
    this.drawObstacles(scale, offsetX, offsetY)
    this.drawParticles(scale, offsetX, offsetY)
  }

  loop(timestamp) {
    if (!this.lastFrame) {
      this.lastFrame = timestamp
    }
    const frameDuration = timestamp - this.lastFrame
    this.lastFrame = timestamp
    this.frameAverage = this.frameAverage * 0.9 + frameDuration * 0.1

    if (!this.isPaused) {
      this.step()
    }

    this.render()
    this.controls.statMs.textContent = `${this.frameAverage.toFixed(1)} ms`
    this.controls.statFps.textContent = String(Math.max(1, Math.round(1000 / this.frameAverage)))
    requestAnimationFrame(this.loop)
  }
}

const controls = {
  toggleButton: document.getElementById("toggle-button"),
  resetButton: document.getElementById("reset-button"),
  presetButtons: Array.from(document.querySelectorAll(".preset-button")),
  substepsInput: document.getElementById("substeps-input"),
  substepsValue: document.getElementById("substeps-value"),
  barrierInput: document.getElementById("barrier-input"),
  barrierValue: document.getElementById("barrier-value"),
  dampingInput: document.getElementById("damping-input"),
  dampingValue: document.getElementById("damping-value"),
  statParticles: document.getElementById("stat-particles"),
  statMs: document.getElementById("stat-ms"),
  statFps: document.getElementById("stat-fps"),
}

new FluidSimulation(document.getElementById("sim-canvas"), controls)
