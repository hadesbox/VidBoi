#include <thread>
#include <mutex>
#include <functional>

class Input
{
public:
	Input();
	~Input();
	
	void update();
	void addButtonCallback(std::function<void(bool)> buttonCallback);
	float getCV(int i);
	float getPot(int i);
	
	std::thread inputThread;
	std::mutex inputMutex;
  
private:
	//options
	bool useSerial = true;
	
	int serialFd;
	float cvIn[3] = {0,0,0};
	float potIn[3] = {1.,1.,1.};
	int lastPot[3] = {0,0,0};
	int lastCV[3] = {0,0,0};
	int buttonIn = 0;
	
	std::function<void(bool)> onButton;
	
	bool setupSerial();
	bool readSerial();
	bool setupADC();
	bool readADC();
	static int smooth(int in, int PrevVal);
	
	bool threadRunning = false;
	

};
