#version 300 es
#pragma vscode_glsllint_stage: vert

#ifdef GL_ES
precision mediump float;
#endif

uniform float uRandom;

layout(location=0) in float aSpeed;
layout(location=1) in float aDepth;
layout(location=2) in vec2 aPosition;
layout(location=3) in vec2 aVelocity;

out float vSpeed;
out float vDepth;
out vec2 vPosition;
out vec2 vVelocity;
out float vHealth;

float rand2(vec2 source) {
    return fract(sin(dot(source.xy, vec2(1.9898,1.2313))) * 42758.5453123);
}

void main() {
    // if (aSpeed == aDepth) {
    //     float s  = float(gl_VertexID);
    //     float r1 = rand2(vec2(s, uRandom));
    //     float r2 = rand2(vec2(r1, uRandom));
    //     float r3 = rand2(vec2(uRandom, r1 * uRandom));

    //     vec2 direction = vec2(cos(r1 * 2.0 + .57), sin(r1 * 2.0 + .57)); // Unit vector, mostly pointing upward
    //     float energy = 0.2 + r2; // particles with very little energy will never be visible, so always give them something.
    //     vec2 scale = vec2(0.05, 0.8); // direction*energy gives too strong a value, so we scale this to fit the screen better.

    //     // use values above to calculate velocity
    //     vVelocity = direction * energy * scale;

    //     // Particles will be emitted from below the frame
    //     vPosition = vec2(.5 - r1, -1.1);

    //     vSpeed = -r3 * .001;
    //     vDepth = aDepth;
    // } else {
    //     // Note that even values you **arn't** updating
    //     // must be assigned to the varying or else the
    //     // value will be 0 in the next draw call.
    //     // vec2 gravity = vec2(0.0, -0.02);
    //     vec2 gravity = vec2(0.0, 0.0);

    //     vVelocity = aVelocity + gravity;
    //     vPosition = aPosition + vVelocity;
    //     vSpeed = min(aDepth, aSpeed + .01);
    //     vDepth = aDepth;
    // }

    float s  = float(gl_VertexID);
    float r1 = rand2(vec2(s, uRandom));
    float r2 = rand2(vec2(r1, uRandom));

    vec2 gravity = vec2(0.0, -0.008);

    // vec2 direction = vec2(cos(r1 * 2.0 + .57), sin(r1 * 2.0 + .57)); // Unit vector, mostly pointing upward
    // vec2 direction = vec2(r1, r2);

    float yPos = (aPosition.y + 1.0) / 2.0;
    // float energy = yPos * 1.5;

    vDepth = aDepth;
    vSpeed = aSpeed;

    vec2 direction = vec2(0.0, 0.0);
    // direction.x = (r1 - 0.5) * 0.001 + r2 * 0.001 / vSpeed;
    direction.x =sin(vSpeed - vDepth + 0.3) * vDepth * 0.005;
    vVelocity = (gravity + direction) * vDepth * vSpeed;
    vPosition = aPosition + vVelocity;
    // vPosition = aPosition;

    if (vPosition.y < -1.0) {
        vPosition = vec2(r1 * 2.0 - 1.0, 1.0);
    }

    gl_Position = vec4(vPosition, vDepth, 1.0);
    gl_PointSize = vDepth * 3.0;
}
