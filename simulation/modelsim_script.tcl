vlib work
vmap work work

onerror {quit -f}

vlog -sv +incdir+../models +incdir+../vram \
../testbench.sv \
../models/sram.v \
../../src/vsprinter.sv \
../../src/video.sv 

vsim work.testbench.video
add  wave sim:/testbench/*

run 70us

#run  -all
#wave zoom full

quit -f