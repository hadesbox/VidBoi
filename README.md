# VidBoi: Shader Video Synthesizer

![VidBoi Prototype 1](https://github.com/teafella/VidBoi/blob/master/images/IMGP1873.jpg?raw=true)
## Overview

The VidBoi is a flexible Raspberry Pi based video synthesizer with CV inputs. At its core the device is built around shaders (video card code) and uses them to generate the visuals. VidBoi is a great way to interface the world of shader visuals with analog CV equipment such as Eurorack synthesizers.

Turn the knobs and explore or plug in your eurorack to create your own audio/visual universe!

Features:
- 3 knobs & 1 button
- 3 bipolar -5V to +5V CV inputs (Eurorack friendly!)
- Diverse presets of interactive visuals
- Plug in a keyboard and write your own shaders!
- Open Source

## Basic Operation
Plug the VidBoi into an HDMI display and power and (after a short startup time) you will be experiencing the strange world of shaders.

## Channels (Presets)
The VidBoi comes with an array of "Channels" each of which represents a different visual space that can be synthesized. Pressing the button on the top of the device switches channels and turning the knobs controls various parameters in the algorithms.

## CV Control
The device comes with 3 bipolar CV inputs that can be used to control each of these knobs with voltage rather than turning them by hand. When an input is present the position of the knob represents the center or 0V state of the parameter.

Pair VidBoi with an external LFO for slow morphing changes or patch in your modular sequencer for rhythmic frames in sync with the rest of your patch.

## Write Your Own Shaders

VidBoi is basically just a Raspberry Pi in a convenient package that is ready to be programmed. Just plug in your keyboard to edit your own shader code. (Detailed info coming soon)

Sound intimidating? It isn't! Shader Language is only slightly different from regular C based coding and is super fun!

Check out: https://thebookofshaders.com/ and you will be creating your own craziness in a matter of minutes.

When you're ready to take the show on the road and/or open your creations up to the world of modular synthesizers, take thesame code and plug it into the VidBoi.

# Installation
## Software
0. flash rasbian
8. git clone https://github.com/teafella/VidBoi
59. sudo apt-get install libsoil-dev

#Hardware (Dev Notes)

![VMCP3008](https://github.com/teafella/VidBoi/blob/master/images/MCP3008pinout.gif)


# OPTIONAL Setup

## Creating a Headless Raspberry Pi Zero (Ez Dev Ready Rig)

### Gear
- Zero
- Micro USB cable
- Yurr Laptop

### Steps
1. OTG that thang:
		Guide: https://gist.github.com/gbaman/975e2db164b3ca2b51ae11e45e8fd40a 
2. Make sure you are sharing your wifi Connection: 
		OSX Guide: https://stevegrunwell.com/blog/raspberry-pi-zero-share-internet/
3. Log in with VNC: 
		Instructions: https://raspberrypi.stackexchange.com/questions/13986/how-to-have-remote-desktop-on-macbook-with-raspberry-pi


## About The Creator
Ronald Sardarian is a musician, creative programmer and modular synthesizer enthusiast.

Check out [sardarian.wordpress.com](sardarian.wordpress.com) for more projects and [instagram.com/teafela/](instagram.com/teafela) for electronic music and visuals.


