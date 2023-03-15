precision highp float ; // high percision for float variables
precision highp int ;   // high percision for integer variables

in vec2 position;   // position of vertices as input of the shader

out vec2 pixPos ;   // pixel positions (out to fragment shader)
out vec2 cc    ;    // pixel positions (out to fragment shader)

// Main body of the vertex shader
void main() {
    pixPos = position.xy ;  // interpolate based on xy values
    cc = position.xy ;  // interpolate based on xy values
    gl_Position = vec4(
      position.x*2.-1.,   /* x-coordinate */
      position.y*2.-1.,   /* y-coordinate */
      position.z,         /* z-coordinate */
      1.0
    );
}
