attribute vec4 vertex;
varying vec2 tcoord;


void main(void) {
	vec4 pos = vertex;
	gl_Position = pos;
	tcoord = vertex.xy*0.5+0.5;
	
}
