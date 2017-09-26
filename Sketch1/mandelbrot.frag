uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
varying vec2 tcoord;

void main(void) {
  float intensity;
  vec4 color2;
  float cr=(gl_FragCoord.x-centre.x)*scale.x;
  float ci=(gl_FragCoord.y-centre.y)*scale.y;
  float ar=cr;
  float ai=ci;
  float tr,ti;
  float col=0.0;
  float p=0.0;
  int i=0;
  for(int i2=1;i2<16;i2++)
  {
    tr=ar*ar-ai*ai+cr;
    ti=2.0*ar*ai+ci;
    p=tr*tr+ti*ti;
    ar=tr;
    ai=ti;
   if (p>16.0)
    {
      i=i2;
      break;
    }
  }
  color2 = vec4(float(i)*0.0625,0,0,1);
  gl_FragColor = color2;
}
