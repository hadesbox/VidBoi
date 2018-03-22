/*
 * Original shader from: https://www.shadertoy.com/view/4ljSDt
 * Made addon by Teafella of teafella.com
 */

#ifdef GL_ES
precision mediump float;
#endif
#define PI 3.1415926535897932384626433832795

// IMPORTANT: set to 0 if you are using this shader in GLSLSandbox.com | 1 if on VidBoi
#define VIDBOI 1

#if VIDBOI == 1
uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
uniform float cv0;
uniform float cv1;
uniform float cv2;
varying vec2 tcoord;
uniform int sceneIndex;
uniform sampler2D tex;
uniform sampler2D texFB;
uniform sampler2D texIN;

#else
uniform vec2 mouse;
float cv0 = mouse.x;
float cv1 = mouse.y;
float cv2 = mouse.x - mouse.y;
uniform vec2 resolution;
#endif

uniform float time;


float sdBox( vec3 p, vec3 dim )
{
  vec3 d = abs(p) - dim;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float map(vec3 p)
{
    vec3 q = fract(p) * 2.0 - 1.0;
    //return length(q) - 0.1;
    vec3 boxDim = vec3(.1,.5,.5); //vec3(0.2 + cv2 /3. ));
    return sdBox(q,  boxDim);
}

float trace(vec3 o, vec3 r)
{
    float t = 0.0;
    for (int i = 0; i < 32; ++i)
    {
        vec3 p = o + r * t;
        float d = map(p);
        t += d * 0.5;
    }
    return t;
}

vec3 rotateX( vec3 rMat, float theta){
    rMat.xz *= mat2(cos(theta), -sin(theta), sin(theta), cos(theta));  // Rotation matrix for 3d space
    return rMat;
}

vec3 rotateY( vec3 rMat, float theta){
    rMat.yz *= mat2(cos(theta), -sin(theta), sin(theta), cos(theta));  // Rotation matrix for 3d space
    return rMat;
}

vec3 rotateZ( vec3 rMat, float theta){
    rMat.xy *= mat2(cos(theta), -sin(theta), sin(theta), cos(theta));  // Rotation matrix for 3d space
    return rMat;
}

void main(void)
{
   vec2 uv;

    //vid boi compatibility ( SandboxSpecific Delete on VidBoi)
    #if VIDBOI  == 0
        uv = gl_FragCoord.xy / resolution.xy;
    #else
        uv = vec2(tcoord.x, tcoord.y);
    #endif
    // end vidboi compatiblity
   
    
    uv = uv * 2.0 - 1.0;
    
    uv.x *= resolution.x / resolution.y;
    
    float depth = 2.0;
    vec3 r = normalize(vec3(uv, depth));
    
    bool enableRotation = false;
    if(enableRotation){
            r = rotateX(r, -cv0 * 4.75);
            r = rotateY(r, cv1 * 3.1);
    }

    
    vec3 o = vec3(0.0, 0.0, time);  // Movement (Translation) in 3d space

    float st = 1.;//(sin(time) + 1.5) * 0.4; // blur in and out

    float t = trace(o, r * st);
    
    float fog = 1./t ; 1.0 / (1.0 + t * t * 0.1);
    
    vec3 fc = vec3(fog*2.);//( -cv0 ) + .5);  // glow intensity

    
    vec3 tint = vec3(0.8,0.8,0.8);//vec3(st *cv0 + sin(time/2.*PI)/2. + 0.5,st * cv1 + uv.y,st * cv1 + uv.x + sin(time/2.*PI)/2.+.25 ); // glow color 
    gl_FragColor = vec4(fc * tint, 1.0);
}