#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

varying vec2 texCoords;
uniform sampler2D textureSampler;
uniform float u_time; // time in seconds since start

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // vec3 base_color = vec3(0.8, 0.4, 0.0);
    // gl_FragColor = vec4(base_color, 1.0);

    float warmth = 0.1;
    float brightness = 0.0;

    vec4 color = texture2D(textureSampler, texCoords);
    // color.r += warmth;
    // color.b -= warmth;
    // color.rgb += brightness;

    float mod_size = sin(u_time * 2.0) / 2.0;
    color.r += mod_size;
    // float dist_noize = rand(vec2(u_time)) * 0.01;
    // color.r += dist_noize;

    gl_FragColor = color;
}
