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


void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec2 mouse_norm = vec2(u_mouse.x, u_resolution.y - u_mouse.y) / u_resolution;

    float dist = distance(mouse_norm, st);
    float dist_smooth = smoothstep(0.09, 0.0, abs(dist));
    float dist_mod = sin(dist_smooth * 10.0);

    // color = vec3(circle(st, 0.5));

    // Base structure
    vec3 color = vec3(
        sin(gl_FragCoord.x / 50.0),
        cos(gl_FragCoord.y / 20.0),
        tan(gl_FragCoord.z / 2.0)
    );
    // Modulate with time
    color = color * vec3(1, abs(cos(u_time / 2.0)) * 0.6 + 0.4, abs(sin(u_time / 4.0)) * 0.6 + 0.4);
    // Add mouse pointer effect
    color = color * vec3(1.0 - dist_mod);

    gl_FragColor = vec4(color, 1.0);
}
