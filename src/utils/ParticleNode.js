class ParticleNode {
  constructor(baseX, baseY, canvas, radius) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;
    this.radius = radius;
    this.phase = Math.random() * Math.PI * 2;
    this.intensityPhase = Math.random() * Math.PI * 2;
    this.intensity = 1;
    this.targetX = baseX;
    this.targetY = baseY;
    this.oscPhase = Math.random() * Math.PI * 2;
    this._canvas = canvas;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Bounce on edges
    if (this.x < 0 || this.x > this._canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > this._canvas.height) this.vy *= -1;
  }
  moveToFinal(t, time) {
    const slowT = Math.pow(t, 4);
    let finalX = this.x * (1 - slowT) + this.baseX * slowT;
    let finalY = this.y * (1 - slowT) + this.baseY * slowT;

    const transitionThreshold = 0.5;
    let oscFade = Math.max(0, Math.min(1, (t - transitionThreshold) / (1 - transitionThreshold)));
    const floatRadius = 10;
    const speed = 0.8;
    const oscX = this.baseX + Math.sin(time * 0.001 * speed + this.oscPhase) * floatRadius;
    const oscY = this.baseY + Math.cos(time * 0.001 * speed + this.oscPhase) * floatRadius;

    this.x = finalX * (1 - oscFade) + oscX * oscFade;
    this.y = finalY * (1 - oscFade) + oscY * oscFade;
  }
}

export default ParticleNode;
