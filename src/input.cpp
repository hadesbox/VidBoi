#include "input.h"
#include <iostream>
#include <unistd.h>

#include <string.h>
#include <fstream>
#include <fcntl.h>

//wiringPi includes
#define BASE 100
#define SPI_CHAN 0
#include <wiringPi.h>
#include "mcp3004.h"


Input::Input(){
	onButton = 0;
	if(useSerial){
		setupSerial();
	}
	else{
		setupADC();
	}
}

Input::~Input(){
	if(threadRunning){
		threadRunning = false;
		inputThread.join();
	}
}

void Input::update(){
	
}

void Input::addButtonCallback(std::function<void(bool)> buttonCallback){
	onButton = buttonCallback;
}

bool Input::setupADC(){
	//initialize wiringPi
	if (wiringPiSetup() == -1)
	{
		std::cout<< "Input Error: WiringPi setup failure" << std::endl;
		return false;
	}
	mcp3004Setup(BASE, SPI_CHAN);
	//start input thread
	threadRunning = true;
	inputThread = std::thread(&Input::readADC, this);
	return true;
}

bool Input::readADC(){
	while(threadRunning){
		//read mcp3008
		for ( int chan = 0; chan < 8 ;chan++) 
		{
			//read in ADC values
			int val = analogRead( BASE + chan);
			int smoothVal;
			
			//channels 0,1,2 are Potentiometers
			if(chan < 3){
				smoothVal = smooth(val, lastPot[chan]);
				//~ if(smoothVal != -1){
					inputMutex.lock();
					
					potIn[chan] = val/1024.0;
					inputMutex.unlock();
					lastPot[chan] = val;
				//~ }
			}
			
			//channels 3,4,5 are corresponding CVs
			else if(chan < 6){
				//~ smoothVal = smooth(val, lastCV[chan-3]);
				//~ if(smoothVal != -1){
					//~ inputMutex.lock();
					//~ cvIn[chan-3] = val/1024.0;
					//~ inputMutex.unlock();
					//~ lastCV[chan-3] = val;
				//~ }
			}
			
			printf("%d: %d | %d\n", chan, val, smoothVal);
		}
		
		//read button pin
		int val = digitalRead(29); //Physical Pin 40, run "gpio readall" for pin details
		inputMutex.lock();
		buttonIn = val;
		inputMutex.unlock();
		if(onButton){
			onButton(buttonIn);
		}
		printf("Button%d\n", buttonIn);
	}
	
	return true;
}



//Serial input - from arduino

//reads serial inputs from Arduino, make sure to setupSerial() before calling this function
bool Input::readSerial(){
	
	while(threadRunning){
		char buff[0x1000];
		ssize_t rd = read(serialFd, buff, 100);
		if(rd != 0){
			if(strchr(buff, '\n') != NULL){
				char* tok;
				
				int index = -1;
				tok = strtok(buff, " ");
				if (tok != NULL){
					
					index = atoi(tok);
					//~ std::cout<< "Index: "<< index <<std::endl;
				}
				else{
					//~ return false;
				}
					tok = strtok(NULL, "\n");
					
					if (tok != NULL){
						//~ printf("Value: %s\n", tok);
						int val = atoi(tok);
						if(val < 0){
							val = 0;
						}
						else if(val > 1024){
							val = 1024;
						}
						
						if(index < 10){//cv input
							inputMutex.lock();
							cvIn[index] = val/1024.0;
							inputMutex.unlock();
						}
						else if (index >= 10 && index < 20){ //knob input
							inputMutex.lock();
							potIn[index-10] = val / 1024.0; //( val -512.0)/1024.0 * 2.; //scaled to -1 to 1
							inputMutex.unlock();
						}
						else if( index >= 30 && index < 40){ //button Input
							inputMutex.lock();
							
							buttonIn = val;
							inputMutex.unlock();
							
							onButton(buttonIn);
							
						}
							
					}
				}

					
			}
	}
			
	return true;		
} 

bool Input::setupSerial(){
	const char *dev = "/dev/ttyUSB0";

    serialFd = open(dev, O_RDWR| O_NOCTTY | O_NDELAY |O_NONBLOCK);
    fcntl(serialFd, F_SETFL, 0);
    if (serialFd == -1) {
        fprintf(stderr, "Cannot open %s: %s.\n", dev, strerror(errno));
        return false;
    }
    
    threadRunning = true;
    inputThread = std::thread(&Input::readSerial, this);
    
    return true;
} 

float Input::getCV(int i){
	float ret;
	Input::inputMutex.lock();
	ret = cvIn[i];
	Input::inputMutex.unlock();
	return ret;
}

float Input::getPot(int i){
	float ret;
	Input::inputMutex.lock();
	ret = potIn[i];
	Input::inputMutex.unlock();
	return ret;
}

int Input::smooth(int in, int PrevVal){ 
    int margin = PrevVal * .008; //  get 2% of the raw value.  Tune for lowest non-jitter value.
    /*
     * Next we add (or subtract...) the 'standard' fixed value to the previous reading. (PotPrevVal needs to be declared outside the function so it persists.)
     * Here's the twist: Since the jitter seems to be worse at high raw vals, we also add/subtract the 2% of total raw. Insignificantat on low 
     * raw vals, but enough to remove the jitter at raw >900 without wrecking linearity or adding 'lag', or slowing down the loop, etc.
     */
    if (in > PrevVal + (4 + margin) || in < PrevVal - (5 + margin)) { // a 'real' change in value? Tune the two numeric values for best results
      
      //average last 2 values ofr smoothing
      in = (PrevVal + in) / 2.0;
      //PotPrevVal = in; // store valid raw val  for next comparison
      return in;
    }  
    return -1;  
}
 
//==============================================================================
