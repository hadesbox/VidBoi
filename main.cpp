#include <stdio.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <assert.h>
#include <unistd.h>
#include <string>
#include <iostream>
#include <fstream>

#include <linux/input.h>

//gl Includes
#include "bcm_host.h"
#include "GLES2/gl2.h"
#include "EGL/egl.h"
#include "EGL/eglext.h"

//my includes
#include "lib/SOIL.h"
#include "src/input.h"

#include <time.h>
#define NUM_SCENES 5
#define IMAGE_SIZE 128
#define PATH "/home/pi/Desktop/VidBoi/" //directory of this sketch
#define IN_TEX_NAME "/images/pusheen.png"
#define CONTEXT_DIV 1000

clock_t begin = clock();

bool programRunning = true;

Input inputs;

bool loadNewScene = false;
float lastButtonState = 0;
float buttonState = 0;

typedef struct
{
   uint32_t screen_width;
   uint32_t screen_height;
// OpenGL|ES objects
   EGLDisplay display;
   EGLSurface surface;
   EGLContext context;

   GLuint verbose;
   GLint inputValY = 0;
   GLint inputValX = 0;
   GLint sceneIndex = 3;
   GLfloat inputCV0 = 0.0;
   GLfloat inputCV1 = 0.0;
   GLfloat inputCV2 = 0.;
   GLfloat inputFFT[4] = {0.0, 0.0, 0.0, 0.0};
   GLuint vshader;
   GLuint fshader;
   GLuint mshader;
   GLuint program;
   GLuint tex_fb;
   GLuint tex[3];
   GLuint buf;
   
   unsigned char* fb_buf;
   unsigned char* tex_buf;
   int buf_height, buf_width;
// my shader attribs
   GLuint unif_color, attr_vertex, unif_scale, unif_offset, unif_tex, unif_centre, unif_resolution, unif_texFB, unif_texIN, unif_cv0, unif_cv1,unif_cv2, unif_fft; 
   GLuint unif_inputVal, unif_sceneIndex;
   
   GLuint unif_time;
} CUBE_STATE_T;

static CUBE_STATE_T _state, *state=&_state;

#define check() assert(glGetError() == 0)

static void showlog(GLint shader)
{
   // Prints the compile log for a shader
   char log[1024];
   glGetShaderInfoLog(shader,sizeof log,NULL,log);
   printf("%d:shader:\n%s\n", shader, log);
}

static void showprogramlog(GLint shader)
{
   // Prints the information log for a program object
   char log[1024];
   glGetProgramInfoLog(shader,sizeof log,NULL,log);
   printf("%d:program:\n%s\n", shader, log);
}


    
/***********************************************************
 * Name: init_ogl
 *
 * Arguments:
 *       CUBE_STATE_T *state - holds OGLES model info
 *
 * Description: Sets the display, OpenGL|ES context and screen stuff
 *
 * Returns: void
 *
 ***********************************************************/
static void init_ogl(CUBE_STATE_T *state)
{
   int32_t success = 0;
   EGLBoolean result;
   EGLint num_config;

   static EGL_DISPMANX_WINDOW_T nativewindow;

   DISPMANX_ELEMENT_HANDLE_T dispman_element;
   DISPMANX_DISPLAY_HANDLE_T dispman_display;
   DISPMANX_UPDATE_HANDLE_T dispman_update;
   VC_RECT_T dst_rect;
   VC_RECT_T src_rect;

   static const EGLint attribute_list[] =
   {
      EGL_RED_SIZE, 8,
      EGL_GREEN_SIZE, 8,
      EGL_BLUE_SIZE, 8,
      EGL_ALPHA_SIZE, 8,
      EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
      EGL_NONE
   };
   
   static const EGLint context_attributes[] = 
   {
      EGL_CONTEXT_CLIENT_VERSION, 2,
      EGL_NONE
   };
   EGLConfig config;

   // get an EGL display connection
   state->display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
   assert(state->display!=EGL_NO_DISPLAY);
   check();

   // initialize the EGL display connection
   result = eglInitialize(state->display, NULL, NULL);
   assert(EGL_FALSE != result);
   check();

   // get an appropriate EGL frame buffer configuration
   result = eglChooseConfig(state->display, attribute_list, &config, 1, &num_config);
   assert(EGL_FALSE != result);
   check();

   // get an appropriate EGL frame buffer configuration
   result = eglBindAPI(EGL_OPENGL_ES_API);
   assert(EGL_FALSE != result);
   check();

   // create an EGL rendering context
   state->context = eglCreateContext(state->display, config, EGL_NO_CONTEXT, context_attributes);
   assert(state->context!=EGL_NO_CONTEXT);
   check();

   // create an EGL window surface
   success = graphics_get_display_size(0 /* LCD */, &state->screen_width, &state->screen_height);
   assert( success >= 0 );

   dst_rect.x = 0;
   dst_rect.y = 0;
   dst_rect.width = state->screen_width ;
   dst_rect.height = state->screen_height;
      
   src_rect.x = 0;
   src_rect.y = 0;
   src_rect.width = state->screen_width << 16;
   src_rect.height = state->screen_height << 16;        

   dispman_display = vc_dispmanx_display_open( 0 /* LCD */);
   dispman_update = vc_dispmanx_update_start( 0 );
         
   dispman_element = vc_dispmanx_element_add ( dispman_update, dispman_display,
      0/*layer*/, &dst_rect, 0/*src*/,
      &src_rect, DISPMANX_PROTECTION_NONE, 0 /*alpha*/, 0/*clamp*/,  (DISPMANX_TRANSFORM_T)0/*transform*/);
      
   nativewindow.element = dispman_element;
   nativewindow.width = state->screen_width;
   nativewindow.height = state->screen_height;
   vc_dispmanx_update_submit_sync( dispman_update );
      
   check();

   state->surface = eglCreateWindowSurface( state->display, config, &nativewindow, NULL );
   assert(state->surface != EGL_NO_SURFACE);
   check();

   // connect the context to the surface
   result = eglMakeCurrent(state->display, state->surface, state->surface, state->context);
   assert(EGL_FALSE != result);
   check();

   // Set background color and clear buffers
   glClearColor(0.15f, 0.25f, 0.35f, 1.0f);
   glClear( GL_COLOR_BUFFER_BIT );
   //disable depth Buffer
   glDepthMask(false);

   check();
}

std::string readFile(const char *filePath) {

    std::string line = "";
    std::ifstream in(filePath);
    if(!in.is_open()) {
        std::cerr << "Could not read file " << filePath << ". File does not exist." << std::endl;
        return "";
    }
	std::string content((std::istreambuf_iterator<char>(in)), 
    std::istreambuf_iterator<char>());
    
    in.close();
    return content;
}


static void load_tex_images(CUBE_STATE_T *state)
{
	SOIL_free_image_data(state->tex_buf);
	//SOIL LOADER
	state->tex_buf = SOIL_load_image((std::string(PATH) + std::string(IN_TEX_NAME)).c_str(), &state->buf_width, &state->buf_height,0, SOIL_LOAD_RGB);
	
	if( 0 == state->tex_buf)
	{
		printf( "SOIL loading error: '%s'\n", SOIL_last_result() );
	}

}


static void init_shaders(CUBE_STATE_T *state, bool firstrun = true)
{
   static const GLfloat vertex_data[] = {
        -1.0,-1.0,1.0,1.0,
        1.0,-1.0,1.0,1.0,
        1.0,1.0,1.0,1.0,
        -1.0,1.0,1.0,1.0
   };
   
   //TODO: Automatically read files in Shaders/ directory
   //load up the shader files
   std::string vertShaderStr = readFile((std::string(PATH) + "vshader.vert").c_str());
    std::string fragShaderStr = readFile((std::string(PATH) + "/Shaders/myShader" + std::to_string(state->sceneIndex) + ".frag").c_str()); 
    const char *vertShaderSrc = vertShaderStr.c_str();
    const char *fragShaderSrc = fragShaderStr.c_str();
   
   //basic vert shader
   const GLchar *vshader_source = vertShaderSrc;  
   //my custom fragment shader
   const GLchar *fshader_source = fragShaderSrc;
   
   //set verbose to always be true ( print out shader errors)
	state->verbose = true;
		
        state->vshader = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(state->vshader, 1, &vshader_source, 0);
        glCompileShader(state->vshader);
        check();

        if (state->verbose)
            showlog(state->vshader);
            
        state->fshader = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(state->fshader, 1, &fshader_source, 0);
        glCompileShader(state->fshader);
        check();

        if (state->verbose)
            showlog(state->fshader);


        // custom shader attach
        state->program = glCreateProgram();
        glAttachShader(state->program, state->vshader);
        glAttachShader(state->program, state->fshader);
        glLinkProgram(state->program);
        glDetachShader(state->program, state->vshader);
        glDetachShader(state->program, state->fshader);
        glDeleteShader(state->vshader);
        glDeleteShader(state->fshader);
        
        check();
		
        if (state->verbose)
            showprogramlog(state->program);
            
            
        state->attr_vertex = glGetAttribLocation(state->program, "vertex");
        state->unif_color  = glGetUniformLocation(state->program, "color");
        state->unif_scale  = glGetUniformLocation(state->program, "scale");
        state->unif_offset = glGetUniformLocation(state->program, "offset");
        state->unif_tex    = glGetUniformLocation(state->program, "tex");
        state->unif_texFB    = glGetUniformLocation(state->program, "texFB");
        state->unif_texIN    = glGetUniformLocation(state->program, "texIN");         
        state->unif_centre = glGetUniformLocation(state->program, "centre");
        state->unif_time = glGetUniformLocation(state->program, "time");
        state->unif_inputVal = glGetUniformLocation(state->program, "inputVal");
        state->unif_sceneIndex = glGetUniformLocation(state->program, "sceneIndex");
        state->unif_cv0 = glGetUniformLocation(state->program, "cv0");
         state->unif_cv1 = glGetUniformLocation(state->program, "cv1");
         state->unif_cv2 = glGetUniformLocation(state->program, "cv2");
         state->unif_fft = glGetUniformLocation(state->program, "fft");
        
        

   
        glClearColor ( 0.0, 1.0, 1.0, 1.0 );
        if(!firstrun){
			glDeleteBuffers(1, &state->buf);
			
		}
        glGenBuffers(1, &state->buf);

        check();

        // Prepare a texture image
        if(!firstrun){
			glDeleteTextures(3,  &state->tex[0]);
		}
        glGenTextures(2, &state->tex[0]);
        check();
        glBindTexture(GL_TEXTURE_2D,state->tex[0]);
        check();
        
        
        
        glTexImage2D(GL_TEXTURE_2D,0,GL_RGB,state->screen_width / CONTEXT_DIV ,state->screen_height/ CONTEXT_DIV ,0,GL_RGB,GL_UNSIGNED_SHORT_5_6_5,0);
        check();
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        check();
        
        // setup input textures
			SOIL_free_image_data(state->fb_buf);
			//bind fb tex
		   glBindTexture(GL_TEXTURE_2D, state->tex[1]);

		   glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, state->screen_width , state->screen_height, 0,
						GL_RGB, GL_UNSIGNED_BYTE, state->fb_buf);
		   glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, (GLfloat)GL_NEAREST);
		   glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, (GLfloat)GL_NEAREST);
		   check();
		   
		   //bind input tex	
		   load_tex_images(state);
		   glBindTexture(GL_TEXTURE_2D, state->tex[2]);
		   glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, state->buf_width, state->buf_height, 0,
						GL_RGB, GL_UNSIGNED_BYTE, state->tex_buf);
		   glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, (GLfloat)GL_NEAREST);
		   glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, (GLfloat)GL_NEAREST);
		   check();
        
        
        // Prepare a framebuffer for rendering
        if(!firstrun){
			glDeleteFramebuffers(1, &state->tex_fb);
		}
        glGenFramebuffers(1,&state->tex_fb);
        check();
        glBindFramebuffer(GL_FRAMEBUFFER,state->tex_fb);
        check();
        glFramebufferTexture2D(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,state->tex[0],0);
        check();
        glBindFramebuffer(GL_FRAMEBUFFER,0);
        check();
        // Prepare viewport
        glViewport ( 0, 0, state->screen_width, state->screen_height );
        check();
        
        // Upload vertex data to a buffer
        glBindBuffer(GL_ARRAY_BUFFER, state->buf);
        glBufferData(GL_ARRAY_BUFFER, sizeof(vertex_data),
                             vertex_data, GL_STATIC_DRAW);
        glVertexAttribPointer(state->attr_vertex, 4, GL_FLOAT, 0, 16, 0);
        glEnableVertexAttribArray(state->attr_vertex);
        check();
}

        
static void draw_triangles(CUBE_STATE_T *state, GLfloat cx, GLfloat cy, GLfloat scale)
{
		//render to a texture
        //~ glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glBindFramebuffer(GL_FRAMEBUFFER,state->tex_fb); //ping pong here for framebuffer
        // Clear the background (not really necessary I suppose)
        glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);
        check();
        
        glBindBuffer(GL_ARRAY_BUFFER, state->buf);
        check();
        glUseProgram ( state->program );
        check();
        glUniform4f(state->unif_color, 0.5, 0.5, 0.8, 1.0);
        glUniform2f(state->unif_scale, scale, scale);
        glUniform2f(state->unif_centre, cx, cy);
        glUniform2f(state->unif_inputVal, state->inputValX, state->inputValY);
        //pass sceneIndex into shader
        glUniform1i( state->unif_sceneIndex, state->sceneIndex);
        
        
        
        state->inputCV0 = abs( inputs.getCV(0) + inputs.getPot(0) );
        state->inputCV1 = abs( inputs.getCV(1) + inputs.getPot(1) );
        
        state->inputCV2 = abs(inputs.getCV(2) + inputs.getPot(2) );
        
        glUniform1f(state->unif_cv0, state->inputCV0);
        glUniform1f(state->unif_cv1, state->inputCV1);
        glUniform1f(state->unif_cv2, state->inputCV2);
        glUniform1i(state->unif_tex, 0); // I don't really understand this part, perhaps it relates to active texture?
        glUniform1i(state->unif_texFB, 1);
        glUniform1i(state->unif_texIN, 2);
        
        glActiveTexture(GL_TEXTURE0 + 1);
		glBindTexture(GL_TEXTURE_2D, state->tex[1]); //ping pong texture
        
        //pass time into the frag shader
        clock_t end = clock();
		double elapsed_secs = double(end - begin) / (CLOCKS_PER_SEC/100);
        glUniform1f(state->unif_time, elapsed_secs);
        
        
        check();
        
        glDrawArrays ( GL_TRIANGLE_FAN, 0, 4 );
        check();

        glBindBuffer(GL_ARRAY_BUFFER, 0);

        glFlush();
        glFinish();
        check();
        
        //copy drawn texture for later use
        
        state->tex[1] = state->tex_fb ;
        
        // Now render that texture to the main frame buffer
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);
        check();
        
        glBindBuffer(GL_ARRAY_BUFFER, state->buf);
        check();
        
        glDrawArrays ( GL_TRIANGLE_FAN, 0, 4 );
        check();
			

        glBindBuffer(GL_ARRAY_BUFFER, 0);
        
        
        glFlush();
        glFinish();
        check();
        
        
        eglSwapBuffers(state->display, state->surface);
        check();
        
        
}

static int get_mouse(CUBE_STATE_T *state, int *outx, int *outy)
{
    static int fd = -1;
    const int width=state->screen_width, height=state->screen_height;
    static int x=800, y=400;
    const int XSIGN = 1<<4, YSIGN = 1<<5;
    if (fd<0) {
       fd = open("/dev/input/mouse0",O_RDONLY|O_NONBLOCK);
    }
    if (fd>=0) {
        struct {char buttons, dx, dy; } m;
        while (1) {
           int bytes = read(fd, &m, sizeof m);
           if (bytes < (int)sizeof m) goto _exit;
           if (m.buttons&8) {
              break; // This bit should always be set
           }
           read(fd, &m, 1); // Try to sync up again
        }
        if (m.buttons&3)
           return m.buttons&3;
        x+=m.dx;
        y+=m.dy;
        if (m.buttons&XSIGN)
           x-=256;
        if (m.buttons&YSIGN)
           y-=256;
        if (x<0) x=0;
        if (y<0) y=0;
        if (x>width) x=width;
        if (y>height) y=height;
   }
_exit:
   if (outx) *outx = x;
   if (outy) *outy = y;
   return 0;
} 


static const char *const evval[3] = {
    "RELEASED",
    "PRESSED ",
    "REPEATED"
};

void onButton(bool button){
		if(state->sceneIndex + button >= NUM_SCENES){
			state->sceneIndex = 0;
		}
		else{
			state->sceneIndex =  state->sceneIndex + button;
		}
		
		std::cout<< "switching Shaders" << std::endl;
		if(button != lastButtonState){
			loadNewScene = true;
		}
		lastButtonState = buttonState;
		//~ init_shaders(state);
}



//Keyboard input

int keyboardFd = -1;

bool setupKeyboard(){
	const char *dev = "/dev/input/by-id/usb-_USB_Keyboard-event-kbd";

    keyboardFd = open(dev, O_RDONLY|O_NONBLOCK);
    if (keyboardFd == -1) {
        fprintf(stderr, "Cannot open %s: %s.\n", dev, strerror(errno));
        return false;
    }
    return true;
}

bool readKeyboard(){
	struct input_event ev;
	ssize_t n;
	if(keyboardFd == -1){
		setupKeyboard();
	}
	
	n = read(keyboardFd, &ev, sizeof ev);
    if (n == (ssize_t)-1) {
				if (errno == EINTR)
			return true;
		else{
			//just continue here
			return true;
		}
	} else
	if (n != sizeof ev) {
		errno = EIO;
		
		return false;
	}
	if (ev.type == EV_KEY && ev.value >= 0 && ev.value <= 2)
		printf("%s 0x%04x (%d)\n", evval[ev.value], (int)ev.code, (int)ev.code);
		
		
	if (ev.code == KEY_LEFT){
		state->inputValX -= 1;
	}
	if (ev.code == KEY_RIGHT){
		state->inputValX += 1;
	}
	if (ev.code == KEY_DOWN){
		state->inputValY -= 1;
	}
	if (ev.code == KEY_UP){
		state->inputValY += 1;
	}
	
	
	if (ev.code == KEY_ESC){
		return false;
	}
	return true;
} 
  
 
//==============================================================================

int main ()
{
	
   int terminate = 0;
   GLfloat cx, cy;
   bcm_host_init();

   // Clear application state
   memset( state, 0, sizeof( *state ) );
      
   // Start OGLES
   init_ogl(state);
   init_shaders(state);
   cx = state->screen_width/2;
   cy = state->screen_height/2;
   
   setupKeyboard();
   inputs.addButtonCallback(&onButton);
   while (!terminate)
   {

	  if(!readKeyboard()){
		break;
	  }
	  
		
	draw_triangles(state, cx, cy, 0.003);
	
	if(loadNewScene  == true){
		glDeleteProgram(state->program);
		eglMakeCurrent(state->display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
		eglDestroySurface( state->display, state->surface);
		eglDestroyContext(state->display, state->context);
		init_ogl(state);
		init_shaders(state, false);
		loadNewScene = false;
	}
	

   }
   
   
   
   fflush(stdout);
    fprintf(stderr, "%s.\n", strerror(errno));
   
   return 0;
}

