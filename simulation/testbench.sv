`timescale 1ns/1ps

module testbench();

reg tg42 = 0;

always begin
    tg42 = #23.81 !tg42; // ~42mhz
end

wire                clkz1;

wire                n_wait;
wire                n_reset;
wire                n_m1;
wire                n_rfsh;
wire                n_iorq;
wire                n_wr;
wire                n_rd;
wire                n_halt;
wire                n_mreq;

wire [15:0]         a;
wire [7:0]          d;

wire                n_cs_rom;
wire                n_cs_cash;
wire [17:14]        ra;

wire [1:0]          n_vcs;
wire [15:0]         va;
wire [3:0]          n_vwr;
wire [7:0]          vd3;
wire [7:0]          vd2;
wire [7:0]          vd1;
wire [7:0]          vd0;

wire                wr_col;

wire                dac_data;
wire                dac_ws;
wire                dac_bck;

wire [15:0]         md;
wire [14:0]         ma;
wire [1:0]          n_ras;
wire [3:0]          n_cas;
wire                n_we;

wire                xacs; // rom we
wire [3:0]          xa;
wire                sxa;

wire                rdxa;
wire                wr_awg;
wire                rd_kmps;
wire                wr_dmg;



vsprinter dut(
    tg42, clkz1,
    n_wait, n_reset, n_m1, n_rfsh, n_iorq, n_wr, n_rd, n_halt, n_mreq, a, d,
    n_cs_rom, n_cs_cash, ra,
    n_vcs, va, n_vwr, vd3, vd2, vd1, vd0,
    wr_col,
    dac_data, dac_ws, dac_bck,
    md, ma, n_ras, n_cas, n_we,
    xacs, xa, sxa, rdxa, wr_awg, rd_kmps, wr_dmg
);

sram #(.INITFILE("..\\vram\\bios0.mif"))ram0(
    .addr_i({1'b0, va}),
    .ce_n_i(n_vcs[0]),
    .oe_n_i(1'b0),
    .we_n_i(n_vwr[0]),
    .dat_io(vd0)
);

sram #(.INITFILE("..\\vram\\bios1.mif"))ram1(
    .addr_i({1'b0, va}),
    .ce_n_i(n_vcs[0]),
    .oe_n_i(1'b0),
    .we_n_i(n_vwr[1]),
    .dat_io(vd1)
);

sram #(.INITFILE("..\\vram\\bios2.mif"))ram2(
    .addr_i({1'b0, va}),
    .ce_n_i(n_vcs[0]),
    .oe_n_i(1'b0),
    .we_n_i(n_vwr[2]),
    .dat_io(vd2)
);

sram #(.INITFILE("..\\vram\\bios3.mif"))ram3(
    .addr_i({1'b0, va}),
    .ce_n_i(n_vcs[0]),
    .oe_n_i(1'b0),
    .we_n_i(n_vwr[3]),
    .dat_io(vd3)
);

    // do at the beginning of the simulation
    initial 
        begin
  
        end

    //initial 
    //    $monitor("KEY=%b LEDR=%b", KEY, LEDR);

    initial 
        $dumpvars; 

endmodule