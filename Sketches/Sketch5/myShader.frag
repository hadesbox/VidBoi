uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
uniform float cv0;
uniform float cv1;
uniform float cv2;
varying vec2 tcoord;
uniform float time;
uniform sampler2D tex;
uniform sampler2D tex2;

#define PI 3.14159265358979323846

float random (float x) {
    return fract(sin(x)*1e4);
}

highp float random(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
}

float circle(vec2 _st, float _radius){
    vec2 l = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(l,l)*4.0);
}

float circle(vec2 _st, float _radius, float thickness){
	return circle(_st, _radius) - circle(_st, _radius - thickness);
}

vec2 motion(vec2 position){
	//~ if( fract(time) < 0.5){
		//~ position.x  = floor(position.x) + random(floor(time)); 
		
	//~ }
	//~ else {
		//~ position.y = floor(position.y) + random(floor(time));
	//~ }
	return position;
}

vec3 horizontalLine(vec2 st, float pos, float size, vec3 color){
	st.x = fract(st.x) - pos ;

	return (step(0., st.x  ) * 1.0 - step( size,  st.x  )) * color;
}

vec3 verticalLine(vec2 st, float pos, float size, vec3 color){
	st.y = fract(st.y) - pos ;
	return (step(0., st.y  ) * 1.0 - step( size,  st.y  )) * color;
}

void main( void ) {
	vec3 center = vec3(cv0 /0.5,cv1/0.5, cv2/0.5);
	vec2 pos = vec2(tcoord.x, tcoord.y)   ;
	

	
	float offset = 0.5 ;
	vec2 size = vec2(cv1 +.01 , cv2 +.01) / cv0;
	
	vec3 linecolor = vec3(0.5, cv1, cv2) ;

	vec3 color = vec3(horizontalLine(pos, cv0, 0.05, linecolor)  + verticalLine( pos, cv1, 0.05, linecolor));
	
	
	//~ vec3 color = vec3(box(pos , size, .0) + center)  - vec3( circle(pos , cv0 ) ) ;
	
	gl_FragColor = vec4( color, 1.0 );
	//~ gl_FragColor = vec4( 1.0 );
}
