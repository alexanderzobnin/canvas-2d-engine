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

vec3 dist_color(vec3 base_color, float dist) {
    return base_color - dist * base_color;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec3 color = vec3(st.x, st.y, 1);
    vec2 center = vec2(0.5);
    float radius = 0.1;

    float dist = distance(st, center);

    vec2 toCenter = center - st;
    float angle = atan(toCenter.y, toCenter.x);
    angle = angle * 10.0;
    float mod_angle = sin(angle * 2.0) * cos(angle * 1.0) * sin(angle * u_time * 0.005) * cos(angle + u_time * 0.5) * 0.01;
    dist += mod_angle;

    // // Modulate size by time
    // // float mod_size = sin(u_time) / 20.0;
    // // float dist_noize = rand(vec2(u_time * st)) * 0.01;
    // // mod_size += dist_noize;
    // // dist = smoothstep(0.2 + mod_size, 0.3 + mod_size, dist);
    // vec2 step_from = atan(st);
    // dist = smoothstep(step_from.x, step_from.y, dist);
    // dist = dist;
    // // dist += sin(st.x);
    // // dist = dist + dist_noize;
    // color = vec3(1.0 - dist);

    dist = smoothstep(radius * 0.95, radius, dist);
    vec3 base_color = vec3(0.8, 0.4, 0.0);
    color = dist_color(base_color, dist);

    // gl_FragColor = vec4(color.r, color.g * mod_size * 10.0, color.b * mod_size, 1.0);
    gl_FragColor = vec4(color, 1.0);


}
