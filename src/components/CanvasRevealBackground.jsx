import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/** Stable ref so DotMatrix memo does not churn each render */
const CENTER_XY = Object.freeze(['x', 'y']);

export function CanvasRevealEffect({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}) {
  return (
    <div className={cn('h-full relative w-full pointer-events-none', containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={
            opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]
          }
          shader={`
            ${reverse ? 'u_reverse_active' : 'false'}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={CENTER_XY}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      )}
    </div>
  );
}

function DotMatrix({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = '',
  center = ['x', 'y'],
}) {
  const uniforms = useMemo(() => {
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }
    const speedMatch = shader.match(/animation_speed_factor_([\d.]+)_/);
    const animationSpeedFactor = speedMatch ? parseFloat(speedMatch[1]) : 0.5;

    return {
      u_colors: {
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: 'uniform3fv',
      },
      u_opacities: {
        value: opacities,
        type: 'uniform1fv',
      },
      u_total_size: {
        value: totalSize,
        type: 'uniform1f',
      },
      u_dot_size: {
        value: dotSize,
        type: 'uniform1f',
      },
      u_reverse: {
        value: shader.includes('u_reverse_active') ? 1 : 0,
        type: 'uniform1i',
      },
      u_anim_speed: {
        value: Number.isFinite(animationSpeedFactor) ? animationSpeedFactor * 0.5 : 0.5,
        type: 'uniform1f',
      },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  const centerKey = center.join(',');
  const fragmentSource = useMemo(
    () => `
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;
        uniform float u_anim_speed;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${
              center.includes('x')
                ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));'
                : ''
            }
            ${
              center.includes('y')
                ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));'
                : ''
            }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = u_anim_speed;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`,
    [centerKey],
  );

  return <Shader source={fragmentSource} uniforms={uniforms} />;
}

function getPreparedUniforms(uniforms, size) {
  const preparedUniforms = {};

  for (const uniformName of Object.keys(uniforms)) {
    const uniform = uniforms[uniformName];

    switch (uniform.type) {
      case 'uniform1f':
        preparedUniforms[uniformName] = { value: uniform.value };
        break;
      case 'uniform1i':
        preparedUniforms[uniformName] = { value: uniform.value };
        break;
      case 'uniform3f':
        preparedUniforms[uniformName] = {
          value: new THREE.Vector3().fromArray(uniform.value),
        };
        break;
      case 'uniform1fv':
        preparedUniforms[uniformName] = { value: uniform.value };
        break;
      case 'uniform3fv':
        preparedUniforms[uniformName] = {
          value: uniform.value.map((v) => new THREE.Vector3().fromArray(v)),
        };
        break;
      case 'uniform2f':
        preparedUniforms[uniformName] = {
          value: new THREE.Vector2().fromArray(uniform.value),
        };
        break;
      default:
        break;
    }
  }

  preparedUniforms.u_time = { value: 0 };
  preparedUniforms.u_resolution = {
    value: new THREE.Vector2(size.width * 2, size.height * 2),
  };
  return preparedUniforms;
}

function ShaderMaterial({ source, uniforms }) {
  const { size } = useThree();
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material;
    material.uniforms.u_time.value = clock.getElapsedTime();
    material.uniforms.u_resolution.value.set(size.width * 2, size.height * 2);
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getPreparedUniforms(uniforms, size),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source, uniforms]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Shader({ source, uniforms }) {
  return (
    <Canvas className="absolute inset-0 h-full w-full" gl={{ alpha: true, antialias: false }}>
      <ShaderMaterial source={source} uniforms={uniforms} />
    </Canvas>
  );
}

/** Dot shader + vignette layers (auth + in-app dashboard, dark theme). */
export function IoTDotFieldBackdrop({ wrapperClassName = '' }) {
  return (
    <div className={cn('pointer-events-none overflow-hidden', wrapperClassName)} aria-hidden>
      <div className="absolute inset-0 min-h-full">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-black h-full min-h-[100dvh]"
          colors={[
            [255, 255, 255],
            [16, 185, 129],
          ]}
          dotSize={5}
          reverse={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.92)_0%,_transparent_72%)]" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
    </div>
  );
}
