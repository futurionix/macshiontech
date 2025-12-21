/**
 * Particle Background Configuration
 * 粒子背景配置文件 - 可自定义各项参数
 */

window.ParticleConfig = {
  // 粒子数量（自动根据屏幕大小调整）
  particleCount: undefined, // undefined = 自动计算
  
  // 粒子之间的连接距离
  connectionDistance: 140,
  
  // 粒子大小
  particleSize: 1.5,
  
  // 连接线透明度（0-1）
  connectionOpacity: 0.15,
  
  // 鼠标吸引半径
  attractionRadius: 200,
  
  // 鼠标吸引力强度
  attractionForce: 0.35,
  
  // 阻尼系数（越小越快停止）
  damping: 0.98,
  
  // 颜色范围（HSL 色调）
  hueRange: [180, 280], // 青色到紫色
  
  // 是否启用颜色呼吸效果
  enableColorBreathe: true,
  
  // 是否启用发光效果
  enableGlow: true,
  
  // 是否在移动设备上禁用粒子（性能考虑）
  disableOnMobile: false,
  
  // 自定义样式类名
  containerClass: 'particle-background',
  canvasClass: 'particle-canvas'
};

// 快速预设配置
window.ParticlePresets = {
  // 轻量级 - 移动设备友好
  light: {
    particleCount: 50,
    connectionDistance: 100,
    connectionOpacity: 0.1,
    attractionRadius: 150,
    attractionForce: 0.2
  },
  
  // 标准配置 - 平衡性能和视觉效果
  standard: {
    particleCount: 100,
    connectionDistance: 140,
    connectionOpacity: 0.15,
    attractionRadius: 200,
    attractionForce: 0.35
  },
  
  // 高质量 - 桌面设备
  high: {
    particleCount: 200,
    connectionDistance: 180,
    connectionOpacity: 0.2,
    attractionRadius: 250,
    attractionForce: 0.5,
    enableGlow: true
  },
  
  // 极致 - 性能无忧
  ultra: {
    particleCount: 300,
    connectionDistance: 200,
    connectionOpacity: 0.25,
    attractionRadius: 300,
    attractionForce: 0.6,
    enableGlow: true
  }
};

// 使用预设的函数
window.applyParticlePreset = function(presetName) {
  if (window.ParticlePresets[presetName]) {
    Object.assign(window.ParticleConfig, window.ParticlePresets[presetName]);
    console.log(`Applied particle preset: ${presetName}`);
  } else {
    console.warn(`Preset not found: ${presetName}`);
  }
};
