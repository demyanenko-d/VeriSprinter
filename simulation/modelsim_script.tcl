vlib work
vmap work work

vlog ../testbench.sv ../../src/VeriSprinter.sv 
vsim work.testbench

add  wave sim:/testbench/*

run  -all
#wave zoom full

quit