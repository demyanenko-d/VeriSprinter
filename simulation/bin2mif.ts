import * as fs from "fs"
import * as path from "path"

const fname = "256"

const content = fs.readFileSync(path.join("vram", fname + ".bin"))
const buff = new Uint8Array(content);

const res = new Array<Uint8Array>(4);
res[0] = new Uint8Array(buff.length / 4);
res[1] = new Uint8Array(buff.length / 4);
res[2] = new Uint8Array(buff.length / 4);
res[3] = new Uint8Array(buff.length / 4);

for (let i = 0; i < buff.length / 4; i++) {
    res[0][i] = buff[i * 4 + 0];
    res[1][i] = buff[i * 4 + 1];
    res[2][i] = buff[i * 4 + 2];
    res[3][i] = buff[i * 4 + 3];
}

for (let i = 0; i < 4; i++) {
    let str = "";
    for (let addr = 0; addr < res[i].length; addr++) {
        str += res[i][addr].toString(16) + "\n";
    }

    fs.writeFileSync(path.join("vram", fname + i + ".mif"), str);
}

/*
DEPTH = 256;	% Memory depth and width are required	%
WIDTH = 16;		% Enter a decimal number	%

ADDRESS_RADIX = HEX;	% Address and value radixes are optional	%
DATA_RADIX = HEX;		% Enter BIN, DEC, HEX, or OCT; unless 	%
                        % otherwise specified, radixes = HEX	%

-- Specify values for addresses, which can be single address or range

CONTENT
BEGIN
    0		: 1040	% DCP PAGE %;
    1B		: 1000;	% ISA_A20 WR %
    80		: 7F 7F 7F 7F 7F 7F 7F 7F % KBD_DAT %;
    90		: 	3030 3031 2032 2033 2034 2035 2036 2037 2038 2039 203A 203B 203C 203D 203E 203F; % RAM PAGES %
END ;

*/

