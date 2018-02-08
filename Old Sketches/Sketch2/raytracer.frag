uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 inputVal;
uniform vec2 resolution;
varying vec2 tcoord;
uniform float time;
uniform sampler2D tex;

#define M_PI 3.1415926535897932384626433832795




vec3 cam = vec3(0.0,3.5,10.0);
vec3 viewDir = vec3(-1.0, -1.0, -2.0);  // z-coord sets fov

struct Material
{
	vec3 diffuse;
	vec3 ambient;
	float glossiness;
};
	
struct Sphere
{
	vec4 pos;
	Material material;
};

Sphere sph1 = Sphere(vec4( 0.0, 2.0, -5.0, 2.0), 
		     Material(vec3(0.9,0.8,0.6), vec3(0.1,0.2,0.5), 0.1));
Sphere sph2 = Sphere(vec4(-2.0, 1.25,  -2.0, 1.25), 
		     Material(vec3(0.9,0.8,0.6), vec3(0.7,0.2,0.4), 0.1));
Sphere sph3 = Sphere(vec4( 1.0, 0.75,  -1.0, 0.75), 
		     Material(vec3(0.9,0.8,0.6), vec3(0.1,0.7,0.4), 0.5));
 
#define MAXBOUNCES 1



vec3 background(vec3 light, vec3 rd)
{
 float sun = max(0.0, dot(rd, light));
 float sky = max(0.0, dot(rd, vec3(0.0, 1.0, 0.0)));
 float ground = max(0.0, -dot(rd, vec3(0.0, 1.0, 0.0)));
 return 
  (pow(sun, 256.0)+0.25*pow(sun, 2.0))*vec3(2.0, 1.6, 1.0) +
  pow(ground, 0.5)*vec3(0.4, 0.3, 0.2) +
  pow(sky, 1.0)*vec3(0.5, 0.6, 0.7);
}

float intersectSphere( in vec3 ray_origin, in vec3 ray_dir, in vec4 sph)
{
	vec3 oc = ray_origin - sph.xyz;
	float r = 1.0;
	float b = 2.0*dot(oc, ray_dir);
	float c = dot(oc, oc) - sph.w*sph.w;
	float h = b*b - 4.0*c;
	if (h<0.0) return -1.0;
	float t = (-b - sqrt(h))/2.0;
	return t;
	
}

float intersectPlane( in vec3 ray_origin, in vec3 ray_dir)
{
	return -ray_origin.y / ray_dir.y;
}

vec3 normalSphere( in vec3 pos, in vec4 sph)
{
	return normalize((pos - sph.xyz) / sph.w);
}

vec3 normalPlane( in vec3 pos)
{
	return vec3(0.0,1.0,0.0);
}

float intersection(inout vec3 ray_origin, inout vec3 ray_dir, in vec3 light, out vec3 col)
{
	float tmin = -1.0;
	float tpla = intersectPlane( ray_origin, ray_dir) - 0.0001;
	
	Sphere s[3];
	s[0] = sph1;
	s[1] = sph2;
	s[2] = sph3;
	float tSpheres[3];
	for(int i=0;i<3;i++)
		tSpheres[i] = intersectSphere( ray_origin, ray_dir, s[i].pos);
	
	float glossiness = 0.0;
	vec3 pos = ray_origin;
	vec3 n = vec3(0.0);
	col = vec3(0.0);
	
	
	// plane collision
	if (tpla > 0.0 && tpla < 10000.0)
	{
		pos = ray_origin + tpla * ray_dir;
		n = normalPlane(ray_origin);
		
		// 'ambient occlusion'
		float amb = 0.0;
		for(int i=0;i<3;i++)
		{
			amb += smoothstep( 0.0, 3.0*s[i].pos.w, length(pos.xz - s[i].pos.xz)*0.6);
		}
		col = sqrt(vec3(amb*2.0));
		
		tmin = tpla;
	}
	// sphere collision
	for(int i=0;i<3;i++)
	{
		if (tSpheres[i] > 0.0 && (tpla < 0.0 || tpla > tSpheres[i]))
		{
			pos = ray_origin + tSpheres[i] * ray_dir;
			n = normalSphere(pos, s[i].pos);
			float dif = clamp(dot(n, light), 0.0, 1.0);
			float ao = 0.5 + 0.9*n.y;
			col = s[i].material.diffuse*dif*ao + s[i].material.ambient;
			tmin = tSpheres[i];
		}
	}
	
	vec3 bgCol = background(light, ray_dir) * vec3(0.9, 0.8, 1.0);
		
	if (tmin>=0.0)
	{
		ray_origin = pos;
		ray_dir = normalize(reflect(ray_dir, n));
		
		// hard shadow
		float tSpheres[3];
		bool shadowed = false;
		for(int i=0;i<3;i++)
		{
			float t = intersectSphere( ray_origin, light, s[i].pos+0.0001) ;
			if (t>0.0)
			{
				shadowed = true;
				break;
			}
		}
		
		
		if (shadowed)
		{
			float angle = dot(n, light);
			col *= 0.92 - abs(angle);
		}
	}
	
	col = mix(col, bgCol, step(tmin, 0.0));
	return tmin;
}


void main( void ) {
	
	//sph1.x = 0.25*cos(time*0.5);
	//sph1.z = 0.25*sin(time*0.5);
	
	float aspect = (resolution.x/resolution.y);
	vec2 uv = gl_FragCoord.xy/resolution.xy;
	// aspect ratio
	if (aspect < 1.0)
		uv.x = uv.x*aspect;
	else
		uv.y = uv.y/aspect;
	
	// origin and direction
	vec3 ray_origin = cam;
	vec3 ray_dir = viewDir;
	ray_dir.xy += 2.0*uv.xy;
	ray_dir = normalize( ray_dir );
	vec3 colSum = vec3(0.1);
	
	float bounced = 1.0;
	vec3 light = normalize(vec3(sin(time*0.125), 0.6, cos(time*0.125)));
		
	// intersection
	for (int bounces=MAXBOUNCES; bounces >= 0;bounces--)
	{
		vec3 col = vec3(0);
		float t = intersection(ray_origin, ray_dir, light, col);
		colSum += col * pow(1.0/bounced,2.0);
		if (t>0.0)
			bounced++;
	}
	colSum /= bounced;

	gl_FragColor = vec4( colSum, 1.0 );
}
 
