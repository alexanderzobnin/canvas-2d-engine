#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 position;
varying vec2 v_position;

void main(void) {
    vec4 pos = vec4(position, 0.0, 1.0);
    gl_Position = pos;
    gl_PointSize = 8.0;
    v_position = pos.xy;
}
