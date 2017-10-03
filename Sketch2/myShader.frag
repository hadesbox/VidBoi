uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
uniform vec2 resolution;
varying vec2 tcoord;
uniform float time;
uniform sampler2D tex;

#define M_PI 3.1415926535897932384626433832795

vec4 drawSphere(vec3 translation, vec3 lightPos, vec3 color){
	
	//put 0,0,0 in center of screen
	vec3 centerOffset = vec3(0.5,0.5,0.0);
	translation = translation + centerOffset;
	vec2 p = -1.0 + 2.0 * ((tcoord.xy  - translation.xy) / (1.0 - translation.z )  ); //could also add scaling with xy independent
	
	vec2 uv;
	float r = dot(p,p);
	float f = (1.0-sqrt(1.0-r))/(r);
	
	vec3 worldPos = vec3(tcoord.x - translation.x, tcoord.y - translation.y, r*r - translation.z) ; //world position of this sphere point
	//~ vec3 eyePos = gl_ModelViewMatrix * worldPos;
	
	//calculate texture uv
	uv.x = p.x*f;
	uv.y = p.y*f;
	
	
	//somehow calculate normal?
		vec3 normal = normalize(worldPos - translation);
		vec3 surfaceToLight = normalize(lightPos - translation);   
		
		 color = vec3(pow( time/50., uv.x ) +.5, uv.y + sin( time/50. *M_PI)/2. +.5 ,uv.x+ sin( time/50. *M_PI)+.5);
		
		float brightness = 0.7;
		float diffuseBrightness = dot(normal, surfaceToLight) / (length(surfaceToLight) * length(normal)) * brightness ;
		diffuseBrightness = clamp(diffuseBrightness, 0., 1.) ;
	
	//~ if( r <= 1.0 ){
		float c1 = diffuseBrightness;
		return vec4( vec3(diffuseBrightness) * color , worldPos.z  );
	//~ }

	//~ return vec4( 0.0,0.0,0.0,  1000.0);
}
	

void main(void) {
  vec4 color2;
  float scaledTime = time/4.0;
  float offset = 1.0;
  //~ vec3 color = vec3(smoothstep( 0.1, 1.0, tcoord.x));
  
  //~ //color2 = vec4(sin(tcoord.y * M_PI + scaledTime + offset) + cos(tcoord.x * M_PI + scaledTime/2.0) + 0.7, sin(tcoord.y *M_PI + scaledTime/2.0 - offset) + cos(tcoord.x * M_PI - scaledTime) + 0.7, cos(tcoord.y/2.0 * M_PI - scaledTime - offset) ,1);
  //~ color2 = vec4(color, 1.0);
  //~ gl_FragColor = color2;
  
  vec3 lightPos = vec3(0.0 + (50.0 * sin(time/18.0*M_PI)) + 20.0, 0.0 + (80.0 * cos(time/21.0*M_PI)) +10.0, -2.0 + (25.0 * sin(time/20.0*M_PI)) - 20.0);
  float s = 0.25;
  vec2 t = vec2(0.5,0.5);
  
  //draw spheres
  vec4 outColor;

	//pink
  //~ vec4 sphere1 = drawSphere( vec3(-.5,-.5, 0.0),  lightPos, vec3(1.0, .25, .5));
  //white
  vec4 sphere2 = drawSphere( vec3(-.2 + (inputVal.x *.01),-.2 + (inputVal.y *.01), 0.5), lightPos, vec3(1., 1., 1.) );
  
  //~ if(sphere1[3] >= sphere2[3]){
	gl_FragColor = vec4(sphere2.xyz, 1.0);
  //~ }
  //~ else{
	  //~ gl_FragColor = vec4(sphere1.xyz, 1.0);
  //~ }
  
}
 
