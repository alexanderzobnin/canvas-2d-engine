#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

varying vec2 texCoords;
uniform sampler2D textureSampler;
uniform vec2 u_resolution;  // canvas size (width,height)
uniform float u_time; // time in seconds since start

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 rgb2hsl(in vec3 c) {
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    float r = c.r;
    float g = c.g;
    float b = c.b;
    float cMin = min( r, min( g, b ) );
    float cMax = max( r, max( g, b ) );

    l = ( cMax + cMin ) / 2.0;
    if ( cMax > cMin ) {
        float cDelta = cMax - cMin;

        // s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original
        s = l < .0 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );

        if ( r == cMax ) {
            h = ( g - b ) / cDelta;
        } else if ( g == cMax ) {
            h = 2.0 + ( b - r ) / cDelta;
        } else {
            h = 4.0 + ( r - g ) / cDelta;
        }

        if ( h < 0.0) {
            h += 6.0;
        }
        h = h / 6.0;
    }
    return vec3( h, s, l );
}

vec3 getDefinition(in vec3 p) {
    vec3 hsl = rgb2hsl(p);
    vec3 color = vec3(0.0);

    if (hsl.y > 0.1 && hsl.z > 0.2) {
        color = vec3(1.0);
    }

    return color;
}

float getDefinitionFloat(in vec3 p) {
    vec3 hsl = rgb2hsl(p);
    float color = 0.0;

    if (hsl.y > 0.1 && hsl.z > 0.2) {
        color = 1.0;
    }

    return color;
}

void main() {
    // vec3 base_color = vec3(0.8, 0.4, 0.0);
    // gl_FragColor = vec4(base_color, 1.0);

    // float warmth = 0.1;
    // float brightness = 0.0;

    vec2 coord = vec2(texCoords.x + 0.0, texCoords.y + 0.0);
    vec4 color = texture2D(textureSampler, coord);
    if (coord.x < 0.0) {
        color = vec4(1.0);
    }
    // color.r += warmth;
    // color.b -= warmth;
    // color.rgb += brightness;

    // float mod_size = sin(u_time * 2.0) / 2.0;
    // color.r += mod_size;

    // float dist_noize = rand(vec2(u_time)) * 0.01;
    // color.r += dist_noize;

    // color.rgb = getDefinition(color.rgb);

    float light = getDefinitionFloat(color.rgb);

    gl_FragColor = color;
}


