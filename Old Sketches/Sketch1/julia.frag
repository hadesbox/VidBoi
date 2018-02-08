uniform vec4 color;
uniform vec2 scale;
uniform vec2 centre;
uniform vec2 offset;
varying vec2 tcoord;
uniform sampler2D tex;

void main(void) {
  float intensity;
  vec4 color2;
  float ar=(gl_FragCoord.x-centre.x)*scale.x;
  float ai=(gl_FragCoord.y-centre.y)*scale.y;
  float cr=(offset.x-centre.x)*scale.x;
  float ci=(offset.y-centre.y)*scale.y;
  float tr,ti;
  float col=0.0;
  float p=0.0;
  int i=0;
  vec2 t2;
  t2.x=tcoord.x+(offset.x-centre.x)*(0.5/centre.y);
  t2.y=tcoord.y+(offset.y-centre.y)*(0.5/centre.x);
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
  color2 = vec4(0,float(i)*0.0625,0,1);
  color2 = color2+texture2D(tex,t2);
  gl_FragColor = color2;
}
