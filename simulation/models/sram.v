`timescale 1ns/1ps

module sram #(
    parameter INITFILE = ""
)
(
    input   wire    [16:0]  addr_i,
    input   wire            ce_n_i,
    input   wire            oe_n_i,
    input   wire            we_n_i,
    inout   wire    [7:0]   dat_io
);

wire    ce_n = ce_n_i;
wire    oe_n = oe_n_i;
wire    we_n = we_n_i;

reg [7:0]   ram [0:131072];
assign      dat_io = (!ce_n && !oe_n && we_n)  ? ram[addr_i] : 8'hzz;

initial begin
    $readmemh(INITFILE, ram, 0, 65535);    
end


always @(posedge we_n) begin
    if (!ce_n && oe_n)
        ram[addr_i] = dat_io;
end

endmodule