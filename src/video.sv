`timescale 1ns/1ps

module video (
    input       wire        clk42_i,
    input       wire        res_n_i,

    output      wire        wr_col,
    input       wire [7:0]  dir_port,
    input       wire [7:0]  zx_port_i,

    // vram
    output      reg  [15:0] vram_addr_o,
    inout       wire [31:0] vram_dat_io,
    output      reg  [1:0]  vram_cs_n_o,
    output      reg  [3:0]  vram_we_n_o,

    // wr port
    input       wire [19:0] vaddr_i,
    input       wire [15:0] md_i,
    input       wire        wr_i,
    input       wire        double_cas_i,

    // gen outputs
    output      wire [3:0]  char_cnt_o,
    output      wire [5:0]  ray_cntx_o,
    output      wire [8:0]  ray_cnty_o,
    output      reg  [6:0]  cnt_frame_o = 0
);

wire[5:0]       zx_page     = zx_port_i[5:0];
wire            zx_screen   = zx_port_i[6];
wire            zx_a15      = zx_port_i[7];

/*
	bit0	- Spectrum SCREEN Switch
	bit1	- Spectrum Adress MODE
	bit2	- Write to Spectrum Screen OFF
	bit3	- MODE page 0/1
	bit4	- MODE on/off screen

	bit7..5	- Border
*/

wire        screen_off = dir_port[4]; 
wire        pgm = dir_port[3];                 
wire[2:0]   brd = dir_port[7:5];


reg         fetch_rd_modes, fetch_rd_pixels, fetch_rd_attrs, fetch_cpu_wr, fetch_curr_mode; // test
reg [31:0]  tmp_modes;
reg [7:0]   mode0, mode1, mode2, mode3;

wire        bord        = mode0[7:4]    == 4'b1111;
wire        blank	    = (bord & mode0[3] & mode0[2]) | screen_off;
wire        intx 	    = bord & mode0[3] & mode0[2] & mode0[0];

wire        text_mode   = mode0[4] == 1 && !bord;
wire        gfx_mode    = mode0[4] == 0 && !bord;
wire        res320      = mode0[5] == 1 && !bord;
wire        res640      = mode0[5] == 0 && !bord;


/* fase generator ************************************************************************************************* */

typedef enum { RD_MODES, WR_CPU, RD_PIXELS, RD_ATTRS, RD_PALLETE} MEM_FASE;

reg [2:0]   vfase = 0;
wire[2:0]   vnext =  (vfase > 5) ? 1 : vfase + 3'd1;

MEM_FASE    curr_fase, next_fase;

reg [2:0]   clk_7m = 0;
reg [3:0]   clk_14m;

reg             fase_rd_modes, fase_rd_pixels, fase_rd_attrs, fase_cpu_wr, fase_rd_pallete;

always @(posedge clk42_i) begin
    vfase       = vnext;
    curr_fase   = next_fase;
end

always @(posedge clk42_i) begin

    case (vfase)
        1:  next_fase =  RD_PIXELS;
        2:  next_fase =  RD_ATTRS;
        3:  next_fase =  RD_PALLETE;
        4:  next_fase =  RD_MODES;
        5:  next_fase =  WR_CPU;
        6:  next_fase =  RD_PALLETE;
    endcase

    fase_rd_modes   <= next_fase == RD_MODES && clk_7m[1:0] == 2'b11;
    fase_rd_pixels  <= next_fase == RD_PIXELS && text_mode;
    fase_rd_attrs   <= next_fase == RD_ATTRS;
    fase_cpu_wr     <= next_fase == WR_CPU && wr_i;
    fase_rd_pallete <= next_fase == RD_PALLETE && ( vfase == 6 || vfase == 3 && res640);

    if (vnext == 4) begin
        clk_7m  = clk_7m + 1; 
        clk_14m = {clk_7m, 1'b0};
    end

    if (vnext == 1)
        clk_14m[0] = 1'b1;
end

/* sync generator ************************************************************************************************* */

reg [5:0]   cntx = 0;
reg [8:0]   cnty = 24;

assign      ray_cntx_o = cntx;
assign      ray_cnty_o = cnty;
assign      char_cnt_o = clk_14m;

always @(posedge clk42_i)
if (char_cnt_o == 15 && next_fase == RD_MODES)
begin
    cntx = (cntx == 55) ? 0 : (cntx + 1);

    if (cntx == 48)
        cnty = (cnty == 319) ? 0: (cnty + 1);
end


reg [17:0]  vla;
reg [7:0]   pix_data, attr_data;

/* vram fetch data ******************************************************************************************** */

wire [7:0]  vram_8bit = (vla[1:0] == 2'b00) ? vram_dat_io[7:0] :
                            (vla[1:0] == 2'b01) ? vram_dat_io[15:8] :
                            (vla[1:0] == 2'b10) ? vram_dat_io[23:16] :
                            (vla[1:0] == 2'b11) ? vram_dat_io[31:24] : 8'hxx;





wire[1:0]   palnum      = mode0[7:6];

always @(posedge clk42_i) begin
    fetch_curr_mode     = 1'b0; 

    if (fase_rd_modes)  tmp_modes   = vram_dat_io;
    if (fase_rd_pixels) pix_data    = vram_8bit;
    if (fase_rd_attrs)  attr_data   = vram_8bit;

    fetch_rd_modes      = fase_rd_modes;
    fetch_rd_pixels     = fase_rd_pixels;
    fetch_rd_attrs      = fase_rd_attrs;
    fetch_cpu_wr        = fase_cpu_wr;

    if (next_fase == RD_PIXELS) begin
        fetch_curr_mode     = 1'b1; 
        {mode3, mode2, mode1, mode0} <= tmp_modes;
    end
end



/* vram adress mux ******************************************************************************************** */
wire[7:0]   pal_index = res320 ? 
                attr_data : 
                (clk_7m[0]) ?  attr_data[3:0] : attr_data[7:4];

always @(posedge clk42_i) begin
    vla         = 0;
    vram_we_n_o = 4'b1111;

    case (next_fase)
        RD_MODES: vla = {pgm,  ray_cntx_o[5:0],char_cnt_o[3], 2'b11, ray_cnty_o[8:3],2'b00};

        WR_CPU:     vla = vaddr_i[19] ?
                                vaddr_i[17:0]  : // in graf mode all 256k(512k) range
                                {vaddr_i[7:0], zx_page[4:1], (zx_page[0] ^ zx_a15 ^ vaddr_i[13]), vaddr_i[12:8]}; // in spectrum mode 8k/16k range pages
        
        RD_PALLETE: vla = {pal_index, 5'b11111, palnum ,2'b00};

        RD_PIXELS:  if (fase_rd_pixels) vla = {mode1[7:0], zx_screen, mode0[7:6], ray_cnty_o[2:0] ^ 3'b011}; //	ZX-pic adress

        RD_ATTRS:   vla = (text_mode) ?
                                {mode2[7:0], mode0[3:0], zx_screen, 3'b110, ~mode0[7:6]}: // // ZX-atr adress
                                { //	Graf adress
                                    mode1[7:3], 
                                    (mode2[2] ? ~cnty[2:0] : {mode2[0], ~cnty[2:1]}), 
                                    mode0[3:0], mode1[2:0], 
                                    (mode2[2] ? clk_7m[2:0] : {mode2[1], clk_7m[2:1]})
                                };
    endcase


    vram_addr_o = vla[17:2];
    vram_cs_n_o = 2'b10;
    
end


reg [31:0]  video [0:286719];
reg [20:0]  vcnt = 0;

always @(posedge clk42_i) begin
    if (vfase == 3 || vfase == 1) begin
        video[vcnt] = {cnty[1:0], cntx[1:0], fase_rd_pallete,  intx ,blank, bord, vram_dat_io[23:0]};
        vcnt = vcnt + 1;    
    end

    if (vcnt == 28719) begin
        vcnt = 0;
        $writememh("video.hex", video, 0, 286719);
    end
end

    

endmodule
