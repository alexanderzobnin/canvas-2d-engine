#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;       // time in seconds since start
uniform vec2 u_resolution;  // canvas size (width,height)
uniform vec2 u_mouse;       // mouse position in screen pixels

#define PI 3.14159265359

uniform vec4 u_color;

float circle(in vec2 _st, in float _radius) {
    vec2 l = _st - vec2(0.5);
    return 1.0 - smoothstep(_radius - (_radius * 0.01), _radius + (_radius * 0.01), dot(l,l) * 4.0);
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec3 color = vec3(st.x, st.y, 1);

    float dist = distance(st, vec2(0.5));
    // Modulate size by time
    // float mod_size = sin(u_time) / 20.0;
    // float dist_noize = rand(vec2(u_time * st)) * 0.01;
    // mod_size += dist_noize;
    // dist = smoothstep(0.2 + mod_size, 0.3 + mod_size, dist);
    vec2 step_from = atan(st);
    dist = smoothstep(step_from.x, step_from.y, dist);
    dist = dist;
    // dist += sin(st.x);
    // dist = dist + dist_noize;
    color = vec3(1.0 - dist);

    // gl_FragColor = vec4(color.r, color.g * mod_size * 10.0, color.b * mod_size, 1.0);
    gl_FragColor = vec4(color, 1.0);
}
