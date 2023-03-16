#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 position;

void main(void) {
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = 8.0;
}
