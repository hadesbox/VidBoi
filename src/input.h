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
	
	std::thread serialThread;
	std::mutex serialMutex;
  
private:
	int serialFd;
	float cvIn[3] = {0,0,0};
	float potIn[3] = {1.,1.,1.};
	bool buttonIn;
	
	std::function<void(bool)> onButton;
	
	bool setupSerial();
	bool readSerial();
	
	bool threadRunning = false;

};
