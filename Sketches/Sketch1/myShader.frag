uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
varying vec2 tcoord;
uniform float time;
uniform sampler2D tex;

#define M_PI 3.1415926535897932384626433832795

void main(void) {
  vec4 color2;
  float scaledTime = time/4.0;
  float offset = 1.0;
  color2 = vec4(sin(tcoord.y * M_PI + scaledTime + offset) + cos(tcoord.x * M_PI + scaledTime/2.0) + 0.7, sin(tcoord.y *M_PI + scaledTime/2.0 - offset) + cos(tcoord.x * M_PI - scaledTime) + 0.7, cos(tcoord.y/2.0 * M_PI - scaledTime - offset) ,1);
  gl_FragColor = color2;
  
}
