
module VeriSprinter(
    input   wire                tg42_i,
    output  wire                clkz1_o,

    inout   wire                n_wait_io,
    inout   wire                n_reset_io,
    input   wire                n_m1_i,
    input   wire                n_rfsh_i,
    input   wire                n_iorq_i,
    input   wire                n_wr_i,
    input   wire                n_rd_i,
    input   wire                n_halt_i,
    input   wire                n_mreq_i,
    
    input   wire [15:0]         a_i,
    inout   wire [7:0]          d_io,

    output  wire                n_cs_rom_o,
    output  wire                n_cs_cash_o,
    output  wire [17:14]        ra_o,

    output  wire [1:0]          n_vcs_o,
    output  wire [15:0]         va_o,
    output  wire [3:0]          n_vwr_o,
    output  wire [7:0]          vd3_o,
    output  wire [7:0]          vd2_o,
    output  wire [7:0]          vd1_o,
    output  wire [7:0]          vd0_o,

    output  wire                wr_col_o,

    output  wire                dac_data_o,
    output  wire                dac_ws_o,
    output  wire                dac_bck_o,

    inout   wire [15:0]         md_io,
    output  wire [14:0]         ma_o,
    output  wire [1:0]          n_ras_o,
    output  wire [3:0]          n_cas_o,
    output  wire                n_we_o,

    output  wire                xacs_o, // rom we
    inout   wire [3:0]          xa_o,
    output  wire                sxa_o,

    output  wire                rdxa_o,
    output  wire                wr_awg_o,
    output  wire                rd_kmps_o,
    output  wire                wr_dmg_o
);


endmodule
