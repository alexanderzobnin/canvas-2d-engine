#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;       // time in seconds since start
uniform vec2 u_resolution;  // canvas size (width,height)
uniform vec2 u_mouse;       // mouse position in screen pixels

// #define PI radians(180.0)

uniform vec4 u_color;
varying vec2 v_position;
varying float v_radius;
varying float v_temperature;

vec3 innerShadow(vec3 color, float dist) {
    return color * smoothstep(1.0, 0.6, dist);
}

void main() {
    float point_radius = v_radius;
    vec2 st = gl_FragCoord.xy / u_resolution;
    // vec2 mouse_norm = vec2(u_mouse.x, u_resolution.y - u_mouse.y) / u_resolution;

    float dist = distance(v_position, gl_FragCoord.xy) / point_radius;
    // float dist_smooth = smoothstep(0.09, 0.0, abs(dist));
    // float dist_mod = sin(dist_smooth * 10.0);
    if (dist > 1.0)
        discard;

    vec4 color = u_color;
    vec3 colorRGB = u_color.rgb;
    // // Modulate with time
    colorRGB = colorRGB * vec3(1.0, abs(cos(u_time / 2.0 * v_position.x / u_resolution.x * 8.0)) * 0.6 + 0.4, abs(sin(u_time / 4.0)) * 0.6 + 0.4);
    // // Add mouse pointer effect
    // color = vec4(innerShadow(color.rgb, dist), 1.0);
    float temp_norm = v_temperature / 5000.0 + 0.5;
    colorRGB = vec3(colorRGB.r * temp_norm, colorRGB.g * temp_norm, colorRGB.b);
    color = vec4(innerShadow(colorRGB, dist), smoothstep(1.0, 0.8, dist));

    gl_FragColor = color;
}
