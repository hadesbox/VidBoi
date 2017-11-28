

bool DEBUG = true;

int numInputs = 3;
byte cvIn[] = {A0, A4, A5};


void setup() {
  analogReference(INTERNAL);
  if(DEBUG){
    //setup serial (for debug)
    Serial.begin(114400);
  }
  
  // Setup CV inputs
  pinMode(cvIn[0], INPUT);
  pinMode(cvIn[1], INPUT);
  pinMode(cvIn[2], INPUT);

}

void loop() {
  // put your main code here, to run repeatedly:
  sampleCV();

}

int last[] = {0,0,0}; // needs global scope


bool on = false;
void sampleCV(){
  int in0 = analogRead(cvIn[0]);
  int in1 = analogRead(cvIn[1]);
  int in2 = analogRead(cvIn[2]);

  int sample, in, scaled;
  for(int x = 0; x < numInputs; ++x){
    //read and smooth
    in = analogRead(cvIn[x]);
    sample = smooth(in, last[x]);
    
    //save raw value for next smoothing comparison
    last[x] = in;
    
    //output value using serial ( rescale val/1023.0 for 0. to 1. on the other end)
    String out = String(x) + String(" ");
//    if(x==2){
      Serial.println(out + in);
//    }
  }
}



int smooth(int in, int PotPrevVal){ 
    int margin = PotPrevVal * .02; //  get 2% of the raw value.  Tune for lowest non-jitter value.
    /*
     * Next we add (or subtract...) the 'standard' fixed value to the previous reading. (PotPrevVal needs to be declared outside the function so it persists.)
     * Here's the twist: Since the jitter seems to be worse at high raw vals, we also add/subtract the 2% of total raw. Insignificantat on low 
     * raw vals, but enough to remove the jitter at raw >900 without wrecking linearity or adding 'lag', or slowing down the loop, etc.
     */
    if (in > PotPrevVal + (4 + margin) || in < PotPrevVal - (5 + margin)) { // a 'real' change in value? Tune the two numeric values for best results
      
      //average last 2 values ofr smoothing
      in = (PotPrevVal + in) / 2.0;
      //PotPrevVal = in; // store valid raw val  for next comparison
      return in;
    }  
    return -1;  
}

