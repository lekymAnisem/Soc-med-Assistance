export const particleVert = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute float aScale;
attribute vec3 aRandom;

varying float vAlpha;

void main() {
  vec3 pos = position;
  float t = uTime * 0.08;

  // calm, slow drift
  pos.x += sin(t + aRandom.x * 6.2831) * 0.12;
  pos.y += cos(t * 0.85 + aRandom.y * 6.2831) * 0.12;
  pos.z += sin(t * 1.1 + aRandom.z * 6.2831) * 0.12;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * uPixelRatio * (1.2 / -mv.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 24.0);

  vAlpha = smoothstep(28.0, 6.0, -mv.z);
}
`

export const particleFrag = /* glsl */ `
varying float vAlpha;
uniform vec3 uColor1;
uniform vec3 uColor2;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.18, 0.0, d);
  vec3 col = mix(uColor1, uColor2, core);
  gl_FragColor = vec4(col, alpha * vAlpha * 0.5);
}
`