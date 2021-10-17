
module kbd(
	input   wire                CLK42,      // full sinc 42MHz
	input   wire                CLK_K,      // sinc input 15KHz
	input   wire                KBD_CC,     // sinc KBD
	input   wire                KBD_DD,     // data KBD

	input   wire                nRF,        // /rfsh
	input   wire                nIO,        //	-- /iorq

	input   wire[15:8]          A,

	output  wire[7:0]           KBO,        // output
	output  wire                KB_RESET,

	output  wire                KB_F12,
	output  wire                KB_CTRL,
	output  wire                KB_ALT,
	output  wire                KB_SH,

	input   wire                ENA,
	input   wure                INT_ENA,
	output  reg                 INT
	);

always @(posedge CLK42 or negedge INT_ENA)
    if (INT_ENA == 0)
        INT = 0;
    else
        INT = (KB_CT == 0);

always @(posedge CLK_K) begin
    if (KBD_CC)
        KB_CT = 7;
    else
        KB_CT = (KB_CT > 0) ? (KB_CT - 1) : 0;
end

reg [10:0]  KB_D; // сдвиговый регистр данных с клавиатуры

always @(negedge KB_CC) begin
    KB_D = {KBD_DD, KB_D[10:1]};
end

always @(posedge CLK42) begin
    if (KB_CT == 0 && !KB_EXT)
        KB_OFF = (KB_D == 11'bxx11110000x); // FO - release key

    if (KB_CT == 1)
        KB_EXT = (KB_D == 11'bxx11100000x); // E0 - ext
end

wire KB_CTRL_X = KB_D[8:1] == 8'h14; // 0x14 ctrl
wire KB_ALT_X  = KB_D[8:1] == 8'h11; // 0x11 alt
wire 


always @(negedge KB_CT[2]) begin
    KB_CTRL_X = 
end

endmodule
