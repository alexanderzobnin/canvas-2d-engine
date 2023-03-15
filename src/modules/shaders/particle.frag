// attribute float vertexId;
// uniform float numVerts;
attribute vec2 position;

#define PI radians(180.0)

void main() {
  float u = vertexId / numVerts;      // goes from 0 to 1
  float angle = u * PI * 2.0;         // goes from 0 to 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  gl_Position = vec4(pos, 0, 1);
  gl_PointSize = 5.0;
}
