uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
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
	if( fract(time) < 0.5){
		position.x  = floor(position.x) + random(floor(time)); 
		
	}
	else {
		position.y = floor(position.y) + random(floor(time));
	}
	return position;
}

void main( void ) {

	vec2 pos = vec2(tcoord.x, 1.0-tcoord.y) * (15. * random(floor(time)));
	
	
	vec2 position = motion(pos);
	
	vec2 center = vec2(0.5, 0.5);
	
	vec2 ipos = floor(position);  // get the integer coords
	vec2 fpos = fract(position);  // get the fractional coords
	
	fpos = rotate2D(fpos, PI* random(fpos.x - .5 + time/1000.)) ;
	pos = rotate2D(pos, PI* random(pos.x  + time/1000.));
	
	vec3 texColor = texture2D( tex2, pos).xyz;
	
	//~ float radius = 0.25 ;
	//~ float thickness = .05 ;
	//float circle = circle(fpos, .25, thickness); // not using
	
	float offset = step(fract(time), 0.2) /30. ;
	float boxR = box(fpos , texColor.xy + (offset * step(fract(random(time)), 0.5) ), 0.);
	float boxG = box(fpos , texColor.xy , 0.);
	float boxB = box(fpos , texColor.xy , 0.);
	
	
	vec3 color = vec3( boxR , boxG, boxB ) ;
	

	gl_FragColor = vec4( color, 1.0 );

}
