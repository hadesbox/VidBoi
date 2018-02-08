uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
uniform float cv0;
uniform float cv1;
uniform float cv2;
varying vec2 tcoord;
uniform float time;
uniform int sceneIndex;
uniform sampler2D tex;
uniform sampler2D texFB;
uniform sampler2D texIN;

#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

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

vec3 box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return vec3(uv.x*uv.y);
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

vec3 horizontalLine(vec2 st, float pos, float size, vec3 color){
	st.x = fract(st.x) - pos ;

	return (step(0., st.x  ) * 1.0 - step( size,  st.x  )) * color;
}

vec3 verticalLine(vec2 st, float pos, float size, vec3 color){
	st.y = fract(st.y) - pos ;
	return (step(0., st.y  ) * 1.0 - step( size,  st.y  )) * color;
}

vec3 polygon(vec2 st, vec2 position, float scale, float rotation,  float r, vec3 color){
	
	st = st + position;
	
	st = rotate2D( st, PI * rotation ) ;
	
	float d = 0.0;
	// Remap the space to -1. to 1.
	st = st *2.-1.;


  // Angle and radius from the current pixel
	float a = atan(st.x,st.y)+ PI ;
  
  
  // Shaping function that modulate the distance
  	d = cos(floor(.5+a/r)*r-a) * length(st) ;
	
  	return vec3(1.0-smoothstep(.40 , .405 , d) ) * color;
	
}

#define TRIR 2.09439510239
vec3 triangle(vec2 st, vec2 position, float scale, float rotation, vec3 color ){
	return polygon(st, position, scale, rotation,  TWO_PI/(4. *cv2), color);
}

vec3 hexagon(vec2 st, vec2 position, float scale, float rotation, vec3 color ){
	return polygon(st, position, scale, rotation,  TWO_PI/6., color);
}

vec3 drawImage(vec2 st, vec2 position, float scale){
	
	st.y = 1. - st.y;
	st.x -= position.x;
	st.y += 1.- position.y - 1.;
	vec2 texSt = (st *scale);
	
	//~ if(texSt.x > 1. || texSt.x < 0. || texSt.y > 1. || texSt.y < 0.){
		//~ return vec3(0,0,0);
	//~ }
	
	vec3 color = texture2D( texIN, texSt).xyz;
	
	if(color == vec3(1.,1.,1.)){
		return vec3(0.);
	}
	
	color = vec3(color.x * cv0, color.y * cv1, color.z * cv2);
	
	
	
	return color;
}

//BEGIN HEX RIPOFF


#define SQRT3 1.7320508

// Helper vector. If you're doing anything that involves regular triangles or hexagons, the
// 30-60-90 triangle will be involved in some way, which has sides of 1, sqrt(3) and 2.
//const vec2 s = vec2(1, 1.7320508);

const vec2 s = vec2(1.0, SQRT3);

// Standard vec2 to float hash - Based on IQ's original.
float hash21(vec2 p){ return fract(sin(dot(p, vec2(141.13, 289.97)))*43758.5453); }


// The 2D hexagonal isosuface function: If you were to render a horizontal line and one that
// slopes at 60 degrees, mirror, then combine them, you'd arrive at the following. As an aside,
// the function may be a bound - as opposed to a Euclidean distance representation, but either
// way, the result is hexagonal boundary lines.
float hex(in vec2 p){
    
    p = abs(p);
	
    
    // Below is equivalent to:
    return fract(max(fract(fract(p.x*.5) + fract(p.y*.866025)), fract(p.x))); 

    //return fract(max(dot(p, s*.5), p.x)); // Hexagon.
    
}

// This function returns the hexagonal grid coordinate for the grid cell, and the corresponding 
// hexagon cell ID - in the form of the central hexagonal point. That's basically all you need to 
// produce a hexagonal grid.
//
// When working with 2D, I guess it's not that important to streamline this particular function.
// However, if you need to raymarch a hexagonal grid, the number of operations tend to matter.
// This one has minimal setup, one "floor" call, a couple of "dot" calls, a ternary operator, etc.
// To use it to raymarch, you'd have to double up on everything - in order to deal with 
// overlapping fields from neighboring cells, so the fewer operations the better.
vec4 getHex(vec2 p){
    
    // The hexagon centers: Two sets of repeat hexagons are required to fill in the space, and
    // the two sets are stored in a "vec4" in order to group some calculations together. The hexagon
    // center we'll eventually use will depend upon which is closest to the current point. Since 
    // the central hexagon point is unique, it doubles as the unique hexagon ID.
    vec4 hC = floor(vec4(p, p - vec2(.5, 1))/s.xyxy) + .5;
    
    // Centering the coordinates with the hexagon centers above.
    vec4 h = vec4(p - hC.xy*s, p - (hC.zw + .5)*s);
    
    // Nearest hexagon center (with respect to p) to the current point. In other words, when
    // "h.xy" is zero, we're at the center. We're also returning the corresponding hexagon ID -
    // in the form of the hexagonal central point. Note that a random constant has been added to 
    // "hC.zw" to further distinguish it from "hC.xy."
    //
    // On a side note, I sometimes compare hex distances, but I noticed that Iomateron compared
    // the squared Euclidian version, which seems neater, so I've adopted that.
    return dot(h.xy, h.xy)<dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 9.73);
    
}

void hexMain(void){
	
    // Aspect correct screen coordinates.
    vec2 u = (gl_FragCoord.xy - vec2(800.,800.)*.5)/800.;
	
	u = normalize(vec3(u.xy, 1.1)).xy*2.0;
    
    // Scaling, translating, then converting it to a hexagonal grid cell coordinate and
    // a unique coordinate ID. The resultant vector contains everything you need to produce a
    // pretty pattern, so what you do from here is up to you.
    	
	vec4 h = getHex(u*cv1 * 50. + vec2(1.0,0.0));
     	gl_FragColor = vec4(h.xy, 1.0,1.0);
	
    float rnd = hash21(h.zw);
    rnd = sin(rnd*6.283 + time*1.5)*.5 + .5; // Animating the random number.
	
	
	float ii = 0.5;
	
	ii *= rnd;
	float e = (ii-abs(hex(h.xy) - ii))/ii ; // Edge distance.

	
	float value = clamp(0.0,1.0,smoothstep(0.79,0.92,e))*smoothstep(0.25,0.5,rnd);
	vec3 col1 = vec3(0.5,0.12,0.2);
	vec3 col2 = cv0 * vec3(0.2,0.7,0.8);
	gl_FragColor = vec4(col1*smoothstep(0.0,0.5,value) + 1.6*col2*smoothstep(0.7,0.8,value)*rnd + vec3(0.1) + vec3(0.,0.03,0.2)*rnd,1.0);
	return;
	
	
	
    // The beauty of working with hexagonal centers is that the relative edge distance will simply 
    // be the value of the 2D isofield for a hexagon.
    //
    float eDist = hex(h.xy); // Edge distance.
    float cDist = dot(h.xy, h.xy); // Relative squared distance from the center.

    
 
    // It's possible to control the randomness to form some kind of repeat pattern.
    rnd = mod(h.z + h.w, 4.)/3.;
    
    
    
    // Initiate the background to an off white color.
    vec3 col = vec3(1, .95, .9);

    
    // Using the random number associated with the hexagonal grid cell to provide some color
    // and some smooth blinking. The coloring was made up, but it's worth looking at the 
    // "blink" line which smoothly blinks the cell color on and off.
    //
    float blink = smoothstep(0., .125, rnd - .666); // Smooth blinking transition.
    float blend = dot(sin(u*3.14159*2. - cos(u.yx*3.14159*2.)*3.14159), vec2(.25)) + .5; // Screen blend.
    col = max(col - mix(vec3(0, .4, .6), vec3(0, .3, .7), blend)*blink, 0.); // Blended, blinking orange.
    col = mix(col, col.xzy, dot(sin(u*6. - cos(u*3. + time)), vec2(.4/2.)) + .4); // Orange and pink mix.
    
    // Uncomment this if you feel that greener shades are not being fairly represented. :)
    //col = mix(col, col.yxz, dot(cos(u*6. + sin(u*3. - iTime)), vec2(.35/2.)) + .35); // Add some green.

    
    // Using the edge distance to produce some repeat contour lines. Standard stuff.
    float cont = clamp(cos(eDist*6.283*12.)*1. + .95, 0., 1.);
    cont = mix(cont, clamp(cos(eDist*6.283*12./2.)*1. + .95, 0., 1.), .125);
    col = mix(col, vec3(0), (1.-cont)*.95);
    
    // Putting in some dark borders.
    col = mix(col, vec3(0), smoothstep(0., .03, eDist - .5 + .04));
  
    // Using the two distance variables to give the pattern a bit of highthing.
    col *= max(1.25 - eDist*1.5, 0.);
    col *= max(1.25 - cDist*2., 0.);
    
    // Rough gamma correction.    
    gl_FragColor = vec4(sqrt(max(col, 0.)), 1);
}
void main( void ) {
	
	hexMain();
}
