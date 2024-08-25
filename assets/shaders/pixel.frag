#pragma header

uniform vec2 uBlocksize;

// MY GUY!!!! https://www.shadertoy.com/view/tt2cDK
uniform float inner;
uniform float outer;
uniform float strength;
uniform float curvature;

void main()
{
    vec2 curve = pow(abs(openfl_TextureCoordv.xy*2.-1.),vec2(1./curvature));
    float edge = pow(length(curve),curvature);
    float vignette = floor((1.0-strength*smoothstep(inner,outer,edge))/0.2) * 0.2;

    vec2 blocks = openfl_TextureSize / (uBlocksize*abs(1.0-vignette));
    gl_FragColor = flixel_texture2D(bitmap, floor(openfl_TextureCoordv * blocks) / blocks);
}