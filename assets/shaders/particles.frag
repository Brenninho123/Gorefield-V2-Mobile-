#pragma header

precision mediump float;

uniform float time;
uniform vec2 particleXY;
uniform vec3 particleColor;
uniform vec2 particleDirection;
uniform float particleZoom;
uniform float particlealpha;
uniform int layers;

#define PI 3.1415927
#define TWO_PI 6.283185

#define ANIMATION_SPEED 1.5
#define MOVEMENT_SPEED 0.5
#define MOVEMENT_DIRECTION (particleDirection)

#define PARTICLE_SIZE 0.009

#define PARTICLE_SCALE vec2(0.5, 1.6)
#define PARTICLE_SCALE_VAR vec2(0.25, 0.2)

#define SPARK_COLOR (particleColor * 1.5)
#define SMOKE_COLOR (vec3(0.31, 0.031, 0.612) * 0.8)

#define SIZE_MOD 1.2
#define ALPHA_MOD 0.9

float hash1_2(vec2 x)
{
    return fract(sin(dot(x, vec2(52.127, 61.2871))) * 521.582);
}

vec2 hash2_2(vec2 x)
{
    return fract(sin(x * mat2(20.52, 24.1994, 70.291, 80.171)) * 492.194);
}

vec2 noise2_2(vec2 uv)
{
    vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(uv));

    vec2 uv00 = floor(uv);
    vec2 uv01 = uv00 + vec2(0.0, 1.0);
    vec2 uv10 = uv00 + vec2(1.0, 0.0);
    vec2 uv11 = uv00 + 1.0;
    vec2 v00 = hash2_2(uv00);
    vec2 v01 = hash2_2(uv01);
    vec2 v10 = hash2_2(uv10);
    vec2 v11 = hash2_2(uv11);

    vec2 v0 = mix(v00, v01, f.y);
    vec2 v1 = mix(v10, v11, f.y);
    vec2 v = mix(v0, v1, f.x);

    return v;
}

float noise1_2(vec2 uv)
{
    vec2 f = fract(uv);

    vec2 uv00 = floor(uv);
    vec2 uv01 = uv00 + vec2(0.0, 1.0);
    vec2 uv10 = uv00 + vec2(1.0, 0.0);
    vec2 uv11 = uv00 + 1.0;

    float v00 = hash1_2(uv00);
    float v01 = hash1_2(uv01);
    float v10 = hash1_2(uv10);
    float v11 = hash1_2(uv11);

    float v0 = mix(v00, v01, f.y);
    float v1 = mix(v10, v11, f.y);
    float v = mix(v0, v1, f.x);

    return v;
}

float layeredNoise1_2(vec2 uv, float sizeMod, float alphaMod, int layers, float animation)
{
    float noise = 0.0;
    float alpha = 1.0;
    float size = 1.0;
    vec2 offset;
    for (int i = 0; i < layers; i++)
    {
        offset += hash2_2(vec2(alpha, size)) * 10.0;

        noise += noise1_2(uv * size + time * animation * 8.0 * MOVEMENT_DIRECTION * MOVEMENT_SPEED + offset) * alpha;
        alpha *= alphaMod;
        size *= sizeMod;
    }

    noise *= (1.0 - alphaMod) / (1.0 - pow(alphaMod, float(layers)));
    return noise;
}

vec2 rotate(vec2 point, float deg)
{
    float s = sin(deg);
    float c = cos(deg);
    return (mat2(s, c, -c, s) * point);
}

vec2 voronoiPointFromRoot(vec2 root, float deg)
{
    vec2 point = hash2_2(root) - 0.5;
    float s = sin(deg);
    float c = cos(deg);
    point = mat2(s, c, -c, s) * point * 0.66;
    point += root + 0.5;
    return point;
}

float degFromRootUV(vec2 uv)
{
    return time * ANIMATION_SPEED * (hash1_2(uv) - 0.5) * 2.0;
}

vec2 randomAround2_2(vec2 point, vec2 range, vec2 uv)
{
    return point + (hash2_2(uv) - 0.5) * range;
}

vec3 fireParticles(vec2 uv, vec2 originalUV, vec2 scrolledUV)
{
    vec3 particles = vec3(0.0);
    vec2 rootUV = floor(uv);
    float deg = degFromRootUV(rootUV);
    vec2 pointUV = voronoiPointFromRoot(rootUV, deg);
    float dist = 2.0;
    float distBloom = 0.0;

    vec2 tempUV = uv + (noise2_2(uv * 2.0) - 0.5) * 0.1;
    tempUV += -(noise2_2(uv * 3.0 + time) - 0.5) * 0.07;

    dist = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_SCALE, PARTICLE_SCALE_VAR, rootUV));

    particles += (1.0 - smoothstep(PARTICLE_SIZE * 0.6, PARTICLE_SIZE * 3.0, dist)) * SPARK_COLOR;

    float border = (hash1_2(rootUV) - 0.5) * 2.0;
    float disappear = 1.0 - smoothstep(border, border + 0.5, scrolledUV.y);

    border = (hash1_2(rootUV + vec2(0.214)) - 1.8) * 0.7;
    float appear = smoothstep(border, border + 0.4, scrolledUV.y);

    return particles * disappear * appear;
}

vec3 layeredParticles(vec2 uv, float sizeMod, float alphaMod, int layers)
{
    vec3 particles = vec3(0);
    float size = 1.0;
    float alpha = 1.0;
    vec2 offset = vec2(0.0);
    vec2 noiseOffset;
    vec2 bokehUV;
    vec2 scrolledUV = uv;
    vec2 scaledUV = uv * particleZoom;

    for (int i = 0; i < layers; i++)
    {
        noiseOffset = (noise2_2(uv * size * 2.0 + 0.5) - 0.5) * 0.15;
        
        bokehUV = (scaledUV * size + time * MOVEMENT_DIRECTION * MOVEMENT_SPEED) + offset + noiseOffset;

        particles += fireParticles(bokehUV, scaledUV, scrolledUV) * alpha;
        
        offset += hash2_2(vec2(alpha, alpha)) * 10.0;

        alpha *= alphaMod;
        size *= sizeMod;
    }
    
    return particles;
}

void main()
{
    vec2 uv = gl_FragCoord.xy / vec2(1920.0, 1080.0);

    vec2 particleUv = (2.0 * (uv * vec2(1920.0, 1080.0)) - vec2(1920.0, 1080.0)) / 1920.0;
    
    vec4 tex = texture2D(bitmap, uv);
    vec3 screen = tex.rgb;

    vec3 particles = layeredParticles(particleUv * 1.8, SIZE_MOD, ALPHA_MOD, layers);
    particles.rgb *= particlealpha;
    
    vec3 col = particles + screen + SMOKE_COLOR * 0.02;
    col = smoothstep(vec3(-0.08), vec3(1.0), col);

    gl_FragColor = vec4(col, tex.a);
}