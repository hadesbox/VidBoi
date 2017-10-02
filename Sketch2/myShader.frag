uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
uniform vec2 resolution;
varying vec2 tcoord;
uniform float time;
uniform sampler2D tex;

#define M_PI 3.1415926535897932384626433832795

vec4 drawSphere(vec3 translation){
	
	//put 0,0,0 in center of screen
	vec3 centerOffset = vec3(0.5,0.5,0.0);
	translation = translation + centerOffset;
	vec2 p = -1.0 + 2.0 * ((tcoord.xy  - translation.xy) / (1.0 - translation.z)  ); //could also add scaling with xy independent
	
	vec2 uv;
	float r = dot(p,p);
	float f = (1.0-sqrt(1.0-r))/(r);
	
	vec3 worldPos = vec3(tcoord.x, tcoord.y, r*r) ; //world position of this sphere point
	//~ vec3 eyePos = gl_ModelViewMatrix * worldPos;
	
	//calculate texture uv
	uv.x = p.x*f;
	uv.y = p.y*f;
	
	if( r < 1.0){
		
		vec3 lightPos = vec3(0.0+ (inputVal.x*0.1),0.0+ (inputVal.y*0.1), r*r - 0.5  ) + centerOffset;
		//somehow calculate normal?
		vec3 normal = normalize(worldPos - translation);
		vec3 surfaceToLight = normalize(lightPos - worldPos);   
		
		
		
		float diffuseBrightness = dot(normal, surfaceToLight) / (length(surfaceToLight) * length(normal));
		diffuseBrightness = clamp(diffuseBrightness, 0., 1.);
		vec3 color =  vec3(1.0, .25, .5);
		float c1 = diffuseBrightness;
		return vec4( vec3(diffuseBrightness) , 1.0);
	}

	return vec4( 0.0,0.0,0.0,1.0);
}
	

void main(void) {
  vec4 color2;
  float scaledTime = time/4.0;
  float offset = 1.0;
  //~ vec3 color = vec3(smoothstep( 0.1, 1.0, tcoord.x));
  
  //~ //color2 = vec4(sin(tcoord.y * M_PI + scaledTime + offset) + cos(tcoord.x * M_PI + scaledTime/2.0) + 0.7, sin(tcoord.y *M_PI + scaledTime/2.0 - offset) + cos(tcoord.x * M_PI - scaledTime) + 0.7, cos(tcoord.y/2.0 * M_PI - scaledTime - offset) ,1);
  //~ color2 = vec4(color, 1.0);
  //~ gl_FragColor = color2;
  
  float s = 0.25;
  vec2 t = vec2(0.5,0.5);
  
  gl_FragColor = drawSphere( vec3(-.25,-.25, 0.5 ) );
  
}
 
