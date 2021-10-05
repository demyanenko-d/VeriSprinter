vlib work
vmap work work

onerror {quit -f}

vlog -sv -64 +incdir+../models +incdir+../vram \
../testbench.sv \
../models/sram.v \
../../src/vsprinter.sv \
../../src/video.sv 

vsim work.testbench
add  wave sim:/testbench/*

#run 170us
#run 21ms
run 3ms

#run  -all
#wave zoom full

quit -f