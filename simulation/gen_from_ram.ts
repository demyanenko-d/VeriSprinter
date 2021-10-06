import * as fs from "fs";
import { PNG } from "pngjs";
import { env } from "process";

const debug = true;

const rom = new Uint8Array(fs.readFileSync("./vram/bios.bin"));
const png = new PNG({
    colorType: 4,
    width: 896,
    height: 320
});

function print_addr(va: number) {
    console.log("VA: " + va.toString(16) + " ZX-PAGE: " + ((va >> 5) & 0x1f) + " offs(" + (((va & 0x1f) << 8) || (va >> 10)).toString(16) + ")" );
}

let scr_h = 320;
let scr_w = 896;

let dir_port = 0b0000_1000;
let zx_port = 0;

const pgm = (dir_port >> 3) & 1;

enum VState {
    RdModes,
    WrCpu,
    RdPixels,
    RdAttrs,
    RdPallete,
};

let cur_state: VState = VState.RdAttrs;
let va = 0;
let tmp_modes = 0;
let mode0, mode1, mode2, mode3 = 0;

for (let cnt_y = 0; cnt_y < scr_h; cnt_y++) {
    const scr_line = (cnt_y * scr_w) << 2;
    for (let cnt_x = 0; cnt_x < scr_w; cnt_x++) {
        const ray_cntx = cnt_x >> 3;
        const pixel_7m = cnt_x & 0x07;
        let pixel_14m = pixel_7m << 1;

        for (let vfase = 1; vfase <= 6; vfase++) {

            switch (vfase) {
                case 1: {
                    cur_state = VState.RdPixels;
                    //debug && console.log("state: RdPixels");
                    break
                }
                case 2: {
                    cur_state = VState.RdAttrs;
                    //debug && console.log("state: RdAttrs");
                    break
                }
                case 3: {
                    cur_state = VState.RdPallete;
                    //debug && console.log("state: RdPallete");
                    break
                }
                case 4: {
                    pixel_14m |= 1;
                    cur_state = VState.RdModes;
                    //debug && console.log("state: RdModes");
                    break
                }
                case 5: {
                    cur_state = VState.WrCpu;
                    //debug && console.log("state: WrCpu");
                    break
                }
                case 6: {
                    cur_state = VState.RdPallete;
                    //debug && console.log("state: RdPallete");
                    break
                }

            }

            switch (cur_state) {
                case VState.RdModes: {
                    va = (pgm << 17) | (ray_cntx << 11) | ((pixel_7m >> 2) << 10) | 0x300 | ((cnt_y >> 3) << 2) ;
                    debug && print_addr(va);
                    break;
                }
            }
        }

        
    }
    process.exit();
}


fs.writeFileSync("ram.png", PNG.sync.write(png));