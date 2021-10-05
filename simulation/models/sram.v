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

reg [7:0]   ram [0:65535];

wire        #7  wa = we_n_i;
wire        #10 dq = (!ce_n_i && !oe_n_i && we_n_i);
wire [16:0] #10 da = addr_i;

assign dat_io = (!ce_n_i && !oe_n_i && we_n_i) ? ram[da] : 8'hzz;

initial begin
    $readmemh(INITFILE, ram, 0, 65535);    
end

always @(posedge wa) begin
    if (!ce_n_i && oe_n_i)
        ram[addr_i] <= dat_io;
end

endmodule