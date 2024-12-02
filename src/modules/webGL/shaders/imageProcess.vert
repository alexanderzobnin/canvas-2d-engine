#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 position;
varying vec2 texCoords;

void main(void) {
    texCoords = (position + 1.0) / 2.0;
    texCoords.y = 1.0 - texCoords.y;
    gl_Position = vec4(position, 0.0, 1.0);
    // gl_PointSize = 8.0;
}
