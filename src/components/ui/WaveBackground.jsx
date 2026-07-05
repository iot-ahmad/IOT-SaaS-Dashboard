import React, { useEffect, useRef } from 'react';

class FilmGrain {
  constructor(width, height) {
    // Keep internal canvas small for smooth CPU performance
    this.width = Math.min(width, 384);
    this.height = Math.min(height, 216);
    this.targetWidth = width;
    this.targetHeight = height;
    
    try {
      this.grainCanvas = document.createElement('canvas');
      this.grainCanvas.width = this.width;
      this.grainCanvas.height = this.height;
      this.grainCtx = this.grainCanvas.getContext('2d');
    } catch (err) {
      console.error("FilmGrain initialization error:", err);
      this.grainCtx = null;
    }
    this.grainData = null;
    this.frame = 0;
    this.generateGrainPattern();
  }

  generateGrainPattern() {
    if (!this.grainCtx) return;
    try {
      const imageData = this.grainCtx.createImageData(this.width, this.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const grain = Math.random();
        const value = grain * 255;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255;   // A
      }
      
      this.grainData = imageData;
    } catch (err) {
      console.error("generateGrainPattern error:", err);
    }
  }

  update() {
    if (!this.grainCtx || !this.grainData) return;
    this.frame++;
    
    try {
      if (this.frame % 2 === 0) {
        const data = this.grainData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const grain = Math.random();
          const time = this.frame * 0.01;
          const x = (i / 4) % this.width;
          const y = Math.floor((i / 4) / this.width);
          
          const pattern = Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 - time);
          const value = (grain * 0.8 + pattern * 0.2) * 255;
          
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
        
        this.grainCtx.putImageData(this.grainData, 0, 0);
      }
    } catch (err) {
      console.error("FilmGrain update error:", err);
    }
  }

  apply(ctx, intensity = 0.05, colorize = true, hue = 217) {
    if (!ctx || !this.grainCtx || !this.grainCanvas) return;
    try {
      ctx.save();
      
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = intensity * 0.4;
      ctx.drawImage(this.grainCanvas, 0, 0, this.targetWidth, this.targetHeight);
      
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = Math.max(0, 1 - (intensity * 0.25));
      ctx.drawImage(this.grainCanvas, 0, 0, this.targetWidth, this.targetHeight);
      
      if (colorize) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = intensity * 0.2;
        ctx.fillStyle = `hsla(${hue}, 50%, 50%, 1)`;
        ctx.fillRect(0, 0, this.targetWidth, this.targetHeight);
      }
      
      ctx.restore();
    } catch (err) {
      console.error("FilmGrain apply error:", err);
    }
  }

  resize(width, height) {
    this.targetWidth = width;
    this.targetHeight = height;
  }
}

export function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (beam && beam.filmGrain) {
        beam.filmGrain.resize(canvas.width, canvas.height);
      }
    };

    let filmGrain = null;
    try {
      filmGrain = new FilmGrain(window.innerWidth, window.innerHeight);
    } catch (err) {
      console.error("Failed to create FilmGrain:", err);
    }

    const beam = {
      bassIntensity: 0.4,
      midIntensity: 0.3,
      trebleIntensity: 0.2,
      time: 0,
      filmGrain: filmGrain,
      colorState: {
        hue: 217,
        targetHue: 217,
        saturation: 90,
        targetSaturation: 90,
        lightness: 60,
        targetLightness: 60
      },
      waves: [
        { amplitude: 28, frequency: 0.0025, speed: 0.015, offset: 0, opacity: 0.85 },
        { amplitude: 22, frequency: 0.0035, speed: 0.012, offset: Math.PI * 0.5, opacity: 0.65 },
        { amplitude: 18, frequency: 0.0045, speed: 0.02, offset: Math.PI, opacity: 0.45 },
        { amplitude: 32, frequency: 0.0018, speed: 0.008, offset: Math.PI * 1.5, opacity: 0.55 }
      ],
      postProcessing: {
        filmGrainIntensity: 0.03,
        vignetteIntensity: 0.5,
        chromaticAberration: 0.6,
        scanlineIntensity: 0.015
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId;

    const animate = () => {
      // Tech blue/purple color sweep demo
      beam.bassIntensity = 0.4 + Math.sin(beam.time * 0.01) * 0.25;
      beam.midIntensity = 0.3 + Math.sin(beam.time * 0.015) * 0.15;
      beam.trebleIntensity = 0.2 + Math.sin(beam.time * 0.02) * 0.08;
      
      beam.colorState.targetHue = 217 + Math.sin(beam.time * 0.005) * 35; // Cycles between cyan, blue, purple
      beam.colorState.targetSaturation = 80 + Math.sin(beam.time * 0.01) * 15;
      beam.colorState.targetLightness = 52 + Math.sin(beam.time * 0.008) * 10;

      beam.colorState.hue += (beam.colorState.targetHue - beam.colorState.hue) * 0.05;
      beam.colorState.saturation += (beam.colorState.targetSaturation - beam.colorState.saturation) * 0.15;
      beam.colorState.lightness += (beam.colorState.targetLightness - beam.colorState.lightness) * 0.1;
      
      beam.time++;

      ctx.fillStyle = 'rgba(8, 8, 8, 0.90)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;

      // Draw waves
      beam.waves.forEach((wave, waveIndex) => {
        wave.offset += wave.speed * (1 + beam.bassIntensity * 0.7);
        
        const freqInfluence = waveIndex < 2 ? beam.bassIntensity : beam.midIntensity;
        const dynamicAmplitude = wave.amplitude * (1 + freqInfluence * 4.5);
        
        const waveHue = beam.colorState.hue + waveIndex * 12;
        const waveSaturation = wave.saturation || (beam.colorState.saturation - waveIndex * 4);
        const waveLightness = wave.lightness || (beam.colorState.lightness + waveIndex * 4);
        
        const gradient = ctx.createLinearGradient(0, centerY - dynamicAmplitude, 0, centerY + dynamicAmplitude);
        const alpha = wave.opacity * (0.45 + beam.bassIntensity * 0.55);
        
        gradient.addColorStop(0, `hsla(${waveHue}, ${waveSaturation}%, ${waveLightness}%, 0)`);
        gradient.addColorStop(0.5, `hsla(${waveHue}, ${waveSaturation}%, ${Math.min(90, waveLightness + 10)}%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${waveHue}, ${waveSaturation}%, ${waveLightness}%, 0)`);
        
        ctx.beginPath();
        for (let x = -50; x <= canvas.width + 50; x += 2) {
          const y1 = Math.sin(x * wave.frequency + wave.offset) * dynamicAmplitude;
          const y2 = Math.sin(x * wave.frequency * 2 + wave.offset * 1.5) * (dynamicAmplitude * 0.28 * beam.midIntensity);
          const y3 = Math.sin(x * wave.frequency * 0.5 + wave.offset * 0.7) * (dynamicAmplitude * 0.45);
          const y = centerY + y1 + y2 + y3;
          
          if (x === -50) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width + 50, canvas.height);
        ctx.lineTo(-50, canvas.height);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Apply film grain
      if (beam.filmGrain) {
        beam.filmGrain.update();
        beam.filmGrain.apply(ctx, beam.postProcessing.filmGrainIntensity, true, beam.colorState.hue);
      }

      // Draw Scanlines
      ctx.strokeStyle = `rgba(0, 0, 0, ${beam.postProcessing.scanlineIntensity})`;
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.25,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.85
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.5, `rgba(0, 0, 0, ${beam.postProcessing.vignetteIntensity * 0.25})`);
      vignette.addColorStop(0.8, `rgba(0, 0, 0, ${beam.postProcessing.vignetteIntensity * 0.55})`);
      vignette.addColorStop(1, `rgba(0, 0, 0, ${beam.postProcessing.vignetteIntensity})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dust
      if (Math.random() < 0.02) {
        const dustCount = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < dustCount; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 1.5 + 0.5;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Flicker
      const flicker = Math.sin(beam.time * 0.3) * 0.015 + Math.random() * 0.007;
      ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Color grading
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.07;
      const colorGradeGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      colorGradeGradient.addColorStop(0, 'rgb(255, 240, 220)');
      colorGradeGradient.addColorStop(0.5, 'rgb(255, 255, 255)');
      colorGradeGradient.addColorStop(1, 'rgb(220, 230, 255)');
      ctx.fillStyle = colorGradeGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Film scratches
      if (Math.random() < 0.004) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05})`;
        ctx.lineWidth = Math.random() * 1.2 + 0.4;
        ctx.beginPath();
        const scratchX = Math.random() * canvas.width;
        ctx.moveTo(scratchX, 0);
        ctx.lineTo(scratchX + (Math.random() - 0.5) * 15, canvas.height);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0 block pointer-events-none"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
