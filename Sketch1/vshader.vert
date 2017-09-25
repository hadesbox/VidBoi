attribute vec4 vertex;
varying vec2 tcoord;"

void main(void) {
	ec4 pos = vertex;
	gl_Position = pos;
	tcoord = vertex.xy*0.5+0.5;
}
