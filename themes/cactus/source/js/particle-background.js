/**
 * Interactive Particle Background
 * 现代感动感粒子背景系统
 * 特性: 鼠标交互、自适应性能、响应式设计
 */

(function() {
  let canvas, ctx;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  const particleArray = [];
  
  // 合并配置：优先使用全局 ParticleConfig，否则使用默认值
  const userConfig = window.ParticleConfig || {};
  const config = {
    particleCount: userConfig.particleCount || Math.min(150, Math.floor(window.innerWidth * window.innerHeight / 20000)),
    connectionDistance: userConfig.connectionDistance !== undefined ? userConfig.connectionDistance : 140,
    particleSize: userConfig.particleSize || 1.5,
    connectionOpacity: userConfig.connectionOpacity !== undefined ? userConfig.connectionOpacity : 0.15,
    attractionRadius: userConfig.attractionRadius !== undefined ? userConfig.attractionRadius : 200,
    attractionForce: userConfig.attractionForce !== undefined ? userConfig.attractionForce : 0.35,
    damping: userConfig.damping !== undefined ? userConfig.damping : 0.98,
    hueRange: userConfig.hueRange || [180, 280],
    enableColorBreathe: userConfig.enableColorBreathe !== false,
    enableGlow: userConfig.enableGlow !== false,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  class Particle {
    constructor(x, y, z) {
      this.x = x || Math.random() * window.innerWidth;
      this.y = y || Math.random() * window.innerHeight;
      this.z = z || Math.random() * 500 - 250;
      
      // 随机速度
      const speed = 0.2 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed * (Math.random() - 0.5);
      this.vy = Math.sin(angle) * speed * (Math.random() - 0.5);
      this.vz = (Math.random() - 0.5) * 0.2;
      
      this.size = Math.random() * 2 + 0.5;
      this.mass = this.size / 2;
      
      // 颜色：使用配置中的 hueRange
      const [minHue, maxHue] = config.hueRange;
      this.baseHue = minHue + Math.random() * (maxHue - minHue);
      this.hue = this.baseHue;
    }

    update(mouseX, mouseY, particleArray) {
      // 鼠标引力效果
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < config.attractionRadius && distance > 0) {
        const force = config.attractionForce * (1 - distance / config.attractionRadius);
        this.vx += (dx / distance) * force;
        this.vy += (dy / distance) * force;
      }
      
      // 阻尼（减速）
      this.vx *= config.damping;
      this.vy *= config.damping;
      this.vz *= 0.99;
      
      // 位置更新
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;
      
      // 边界反弹
      const bounceStrength = 0.7;
      if (this.x < 0 || this.x > window.innerWidth) {
        this.vx *= -bounceStrength;
        this.x = Math.max(0, Math.min(window.innerWidth, this.x));
      }
      if (this.y < 0 || this.y > window.innerHeight) {
        this.vy *= -bounceStrength;
        this.y = Math.max(0, Math.min(window.innerHeight, this.y));
      }
      if (this.z < -300 || this.z > 300) {
        this.vz *= -0.8;
        this.z = Math.max(-300, Math.min(300, this.z));
      }
      
      // 颜色呼吸效果（缓慢变化）
      this.hue = this.baseHue + Math.sin(Date.now() * 0.0003) * 15;
    }

    draw(ctx) {
      // 深度感：远处粒子较小、透明
      const depthFactor = (this.z + 300) / 600;
      const size = this.size * Math.max(0.3, depthFactor);
      const opacity = Math.max(0.1, depthFactor) * 0.7;
      
      // 动态颜色（HSL）
      const saturation = 65 + Math.sin(Date.now() * 0.0005 + this.x * 0.001) * 15;
      const lightness = 45 + Math.sin(Date.now() * 0.0003 + this.y * 0.001) * 15;
      
      ctx.fillStyle = `hsla(${Math.round(this.hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%, ${opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
      
      // 发光效果（如果启用）
      if (config.enableGlow) {
        ctx.strokeStyle = `hsla(${Math.round(this.hue)}, 80%, 60%, ${opacity * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  function drawConnections() {
    ctx.strokeStyle = `rgba(0, 217, 255, ${config.connectionOpacity})`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < particleArray.length; i++) {
      for (let j = i + 1; j < Math.min(i + 10, particleArray.length); j++) {
        const dx = particleArray[i].x - particleArray[j].x;
        const dy = particleArray[i].y - particleArray[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.connectionDistance) {
          const opacity = 1 - (distance / config.connectionDistance);
          ctx.strokeStyle = `rgba(0, 217, 255, ${opacity * config.connectionOpacity})`;
          ctx.beginPath();
          ctx.moveTo(particleArray[i].x, particleArray[i].y);
          ctx.lineTo(particleArray[j].x, particleArray[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function init() {
    // 创建 Canvas
    canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      background: transparent;
    `;
    
    // 确保粒子背景容器存在
    const bgContainer = document.getElementById('particle-background') || 
                        document.createElement('div');
    if (!document.getElementById('particle-background')) {
      bgContainer.id = 'particle-background';
      bgContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none;';
      document.body.insertBefore(bgContainer, document.body.firstChild);
    }
    
    bgContainer.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    
    // 设置 Canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 初始化粒子
    for (let i = 0; i < config.particleCount; i++) {
      particleArray.push(new Particle());
    }
    
    // 事件监听
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    
    // 移动设备上禁用鼠标吸引（性能考虑）
    if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
      document.addEventListener('mouseleave', () => {
        mouseX = window.innerWidth / 2;
        mouseY = window.innerHeight / 2;
      });
    }
    
    // 窗口大小改变时调整 Canvas
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // 重新计算粒子数量（根据新的窗口大小）
      const newParticleCount = Math.min(150, Math.floor(window.innerWidth * window.innerHeight / 20000));
      if (newParticleCount > particleArray.length) {
        for (let i = particleArray.length; i < newParticleCount; i++) {
          particleArray.push(new Particle());
        }
      } else if (newParticleCount < particleArray.length) {
        particleArray.length = newParticleCount;
      }
    });
    
    // 动画循环
    function animate() {
      // 清除 Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制连接线
      drawConnections();
      
      // 更新和绘制所有粒子
      for (let i = 0; i < particleArray.length; i++) {
        particleArray[i].update(mouseX, mouseY, particleArray);
        particleArray[i].draw(ctx);
      }
      
      requestAnimationFrame(animate);
    }
    
    // 启动动画
    animate();
  }

  // 延迟初始化确保 DOM 准备好
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // 给 DOM 一个微任务间隙
    Promise.resolve().then(init);
  }
})();
