#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 position;
attribute float radius;
attribute float temperature;
uniform vec2 u_resolution; // canvas size (width,height)
varying vec2 v_position;
varying float v_radius;
varying float v_temperature;

void main(void) {
    vec2 pos_normalized = vec2(position.x, u_resolution.y - position.y) / u_resolution;
    pos_normalized = vec2(pos_normalized.x * 2.0 - 1.0, pos_normalized.y * 2.0 - 1.0);
    vec4 pos = vec4(pos_normalized, 0.0, 1.0);
    gl_Position = pos;
    // Get point radius from 3rd value of point variable
    gl_PointSize = radius * 2.0;
    vec2 ndcPos = gl_Position.xy / gl_Position.w;
    v_position = u_resolution * (ndcPos*0.5 + 0.5);
    v_radius = radius;
    v_temperature = temperature;
}
