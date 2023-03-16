#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;       // time in seconds since start
uniform vec2 u_resolution;  // canvas size (width,height)
uniform vec2 u_mouse;       // mouse position in screen pixels

// #define PI radians(180.0)

uniform vec4 u_color;
varying vec2 v_position;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    // vec2 mouse_norm = vec2(u_mouse.x, u_resolution.y - u_mouse.y) / u_resolution;

    float dist = distance(v_position, st);
    // float dist_smooth = smoothstep(0.09, 0.0, abs(dist));
    // float dist_mod = sin(dist_smooth * 10.0);

    vec3 color = vec3(0.9);

    // // Base structure
    // vec3 color = vec3(
    //     sin(gl_FragCoord.x / 50.0),
    //     cos(gl_FragCoord.y / 20.0),
    //     tan(gl_FragCoord.z / 2.0)
    // );
    // // Modulate with time
    // color = color * vec3(1, abs(cos(u_time / 2.0)) * 0.6 + 0.4, abs(sin(u_time / 4.0)) * 0.6 + 0.4);
    // // Add mouse pointer effect
    color = color * vec3(1.0 - dist);

    gl_FragColor = vec4(color, 1.0);
}
