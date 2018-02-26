EXE         := main.out
SRC         := $(wildcard *.cpp)
SRC         += $(wildcard src/*.cpp)
DIR         := .obj
SRCDIR      := .obj/src
OBJ         := $(SRC:%.cpp=$(DIR)/%.o)
DEP         := $(OBJ:.o=.d)

CPPFLAGS+= -std=c++0x -DSTANDALONE -D__STDC_CONSTANT_MACROS -D__STDC_LIMIT_MACROS -DTARGET_POSIX -D_LINUX -fPIC -DPIC -D_REENTRANT -D_LARGEFILE64_SOURCE -D_FILE_OFFSET_BITS=64 -U_FORTIFY_SOURCE -Wall -g -DHAVE_LIBOPENMAX=2 -DOMX -DOMX_SKIP64BIT -ftree-vectorize -pipe -DUSE_EXTERNAL_OMX -DHAVE_LIBBCM_HOST -DUSE_EXTERNAL_LIBBCM_HOST -DUSE_VCHIQ_ARM -Wno-psabi

LDFLAGS+=-L$(SDKSTAGE)/opt/vc/lib/  -L$(SDKSTAGE)/opt/vc/src/hello_pi/libs/ilclient -L$(SDKSTAGE)/opt/vc/src/hello_pi/libs/vgfont

INCLUDES+=-I$(SDKSTAGE)/opt/vc/include/ -I$(SDKSTAGE)/opt/vc/include/interface/vcos/pthreads -I$(SDKSTAGE)/opt/vc/include/interface/vmcs_host/linux -I./ -I$(SDKSTAGE)/opt/vc/src/hello_pi/libs/ilclient -I$(SDKSTAGE)/opt/vc/src/hello_pi/libs/vgfont
INCLUDES+= -Isrc


LDLIBS+= -lSOIL -lbrcmGLESv2 -lbrcmEGL -lopenmaxil -lbcm_host -lvcos -lvchiq_arm -lpthread -lrt -lm -lwiringPi

.PHONY: all clean

all: $(EXE)

$(EXE): $(OBJ)
	$(CXX) $(LDFLAGS) $^ $(LDLIBS) -o $@

$(DIR)/%.o: %.cpp | $(DIR)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(INCLUDES) -o $@ -c $<

$(DIR):
	@mkdir $@ $(SRCDIR)

-include $(DEP)

clean:
	$(RM) -r $(DIR)
