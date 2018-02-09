#include "input.h"
#include <iostream>
#include <unistd.h>

#include <string.h>
#include <fstream>
#include <fcntl.h>

Input::Input(){
	onButton = 0;
	setupSerial();
}

Input::~Input(){
	threadRunning = false;
	serialThread.join();
}

void Input::update(){
	//readSerial();
}

void Input::addButtonCallback(std::function<void(bool)> buttonCallback){
	onButton = buttonCallback;
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
							serialMutex.lock();
							cvIn[index] = val/1024.0;
							serialMutex.unlock();
						}
						else if (index >= 10 && index < 20){ //knob input
							serialMutex.lock();
							potIn[index-10] = val / 1024.0; //( val -512.0)/1024.0 * 2.; //scaled to -1 to 1
							serialMutex.unlock();
						}
						else if( index >= 30 && index < 40){ //button Input
							serialMutex.lock();
							
							buttonIn = val;
							serialMutex.unlock();
							
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
    serialThread = std::thread(&Input::readSerial, this);
    
    return true;
} 

float Input::getCV(int i){
	float ret;
	Input::serialMutex.lock();
	ret = cvIn[i];
	Input::serialMutex.unlock();
	return ret;
}

float Input::getPot(int i){
	float ret;
	Input::serialMutex.lock();
	ret = potIn[i];
	Input::serialMutex.unlock();
	return ret;
}
 
//==============================================================================
