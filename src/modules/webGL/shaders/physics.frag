#version 300 es
#pragma vscode_glsllint_stage: frag

#ifdef GL_ES
precision mediump float;
#endif

in float vDepth;

out vec4 fragColor;

void main() {
    // Point primitives are considered to have a width and
    // height of 1 and the center is at (.5, .5). So if we
    // discard fragments beyond this distance, we get a
    // point primitive shaped like a disc.

    vec4 color = vec4(0.8, 0.8, 0.75, 1.0);
    color.rgb *= vDepth;
    color.b = color.b + (vDepth * 0.02);
    float pointRadius = 0.5;

    float distanceFromPointCenter = distance(vec2(0.5), gl_PointCoord.xy);
    if (distanceFromPointCenter > pointRadius * 0.4) {
        vec3 glowMod = vec3(color) * 1.0;
        float distMod = sin(distanceFromPointCenter - 0.8) + 0.5;
        color = vec4(glowMod.r - distMod, glowMod.g - distMod, glowMod.b - distMod, 1.0);;
    }
    if (distanceFromPointCenter > pointRadius) {
        discard;
    }

    fragColor = color;
}
