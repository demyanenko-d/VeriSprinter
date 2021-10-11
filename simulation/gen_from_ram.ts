import * as fs from "fs";
import { PNG } from "pngjs";
import { off } from "process";

const debug = true;
const content = fs.readFileSync("./vram/bios.bin").buffer;
//const content = fs.readFileSync("./vram/256.bin").buffer;
//const content = fs.readFileSync("./vram/flappy.bin").buffer;

const src_ram = new Uint8Array(content)
const nram = new Uint8Array(src_ram.length);

for (let i = 0; i < src_ram.length; i++) {
    const offs = (i & 0x1f) | ((i >> 5) & 0x1fe0);
    const page = ((i >> 5) & 0x1f);
    let addr = ((page << 13) | offs);
    nram[addr] = src_ram[i];
}


const ram = new Uint32Array(content);
const png = new PNG({
    colorType: 4,
    width: 896,
    height: 640
});

fs.writeFileSync("out.bin", nram);

function print_addr(va: number) {
    const offs = (va & 0x1f) | ((va >> 5) & 0x1fe0);
    const page = ((va >> 5) & 0x1f);
    console.log("VA: " + va.toString(16) + " ZX-PAGE: " + page + " offs(" + offs.toString(16) + ") : " + ((page << 13) | offs).toString(16));
}

function debug_modes(modes: number) {
    const mode0 = (modes >> 0) & 0xff;
    const mode1 = (modes >> 8) & 0xff;
    const mode2 = (modes >> 16) & 0xff;

    console.log("mode0: " + mode0.toString(16) + " mode1: " + mode1.toString(16) + " mode2: " + mode2.toString(16));
}

let scr_h = 320;
let scr_w = 448;

let dir_port = 0b0000_1000;
let zx_port = 0b0000_0000;

const pgm = (dir_port >> 3) & 1;
const zx_screen = (dir_port >> 0) & 1;
const screen_off = (dir_port >> 4) != 0;
const flash = 0;

enum VState {
    RdModes,
    WrCpu,
    RdPixels,
    RdAttrs,
    RdPallete,
    None
};

let cur_state: VState = VState.None;
let va = 0;
let tmp_modes = 0;
let attr = 0, pix = 0;
let mode0 = 0, mode1 = 0, mode2 = 0, mode3 = 0;
let oldmode0 = -1;

let res640 = false;
let res320 = false;
let mode_text = false;
let mode_gfx = false;
let bord = false;
let blank = false;
let intx = false;

let curr_r = 0, curr_g = 0, curr_b = 0;
let pal_index = 0, pal_num = 0;

for (let cnt_y = 0; cnt_y < scr_h; cnt_y++) {
    const scr_line = (cnt_y * 2) * scr_w * 2; // указатель для png
    const scr_line2 = (cnt_y * 2 + 1) * scr_w * 2; // указатель для png удвоенная строка

    for (let cnt_x = 0; cnt_x < scr_w; cnt_x++) {

        const ray_cntx = cnt_x >> 3;
        const pixel_7m = cnt_x & 0x07;
        let pixel_14m = pixel_7m << 1;
        let dbg_str = cnt_y == 0 && cnt_x >= 168;

        for (let vfase = 1; vfase <= 6; vfase++) {

            switch (vfase) {
                case 1: {
                    cur_state = VState.None;
                    if (mode_text) {
                        if (pixel_7m == 0) cur_state = VState.RdPixels;
                        if (pixel_7m == 4 && res640) cur_state = VState.RdPixels;
                    }

                    // cur_state = mode_text && pixel_7m == 1 ? VState.RdPixels : VState.None;
                    // debug && console.log("state: RdPixels");
                    break
                }
                case 2: {
                    if (mode_gfx)
                        cur_state = VState.RdAttrs;
                    else {
                        cur_state = VState.None;

                        if (pixel_7m == 0) cur_state = VState.RdAttrs;
                        if (pixel_7m == 4 && res640) cur_state = VState.RdAttrs;
                    }

                    //debug && console.log("state: RdAttrs");
                    break
                }
                case 3: {
                    cur_state = VState.RdPallete;
                    //debug && console.log("state: RdPallete");
                    break
                }
                case 4: {
                    cur_state = VState.None;
                    pixel_14m |= 1;

                    if (pixel_7m == 0) cur_state = VState.RdModes;
                    if (pixel_7m == 4) cur_state = VState.RdModes;

                    //debug && console.log("vfase: RdModes");
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
                    va = (pgm << 17) | (ray_cntx << 11) | (((pixel_7m >> 2)) << 10) | 0x300 | ((cnt_y >> 3) << 2);
                    tmp_modes = ram[va >> 2];

                    //console.log("modes: " + tmp_modes.toString(16));
                    //debug && console.log("vstate: RdModes");
                    //debug && console.log("cnt_y[8:3]: " + (cnt_y >> 3).toString(16) + " CT5: " + (pixel_7m >> 2) + " CTH[5:3]: " +  ray_cntx.toString(16));

                    if (pixel_7m == 0) {
                        //console.log("rd: modes **********************");
                        //debug && print_addr(va);
                    }
                    //debug && debug_modes(tmp_modes);

                    break;
                }

                case VState.RdAttrs: {
                    attr = 0;

                    if (mode_text) {
                        // ZX-atr adress
                        va = (mode2 << 10) | ((mode0 & 0x0f) << 6) | (zx_screen << 5) | 0x18 | ((mode0 >> 6));

                        if (dbg_str) {
                            console.log(`\n\nattr y: ${cnt_y & 0x07} ++++++++++++++ `);
                            print_addr(va);
                            console.log("\n");
                        }

                    } else { // gfx
                        //	Graf adress

                        let posy = (cnt_y & 7);  // (mode2 >> 2) != 0 ? ((cnt_y & 7)^7) : (((mode2 & 1) << 2) | (((cnt_y >> 1) & 3) ^ 3));
                        let posx = pixel_7m & 7; //  (mode2 >> 2) != 0 ? (pixel_7m & 7) :  (((mode2 & 2) << 1) | ;

                        if ((mode2 >> 2) != 0) {
                            posx >>= 1;
                            posy >>= 1;

                            if ((mode2 & 1) != 0) posy |= 0x4;
                            if ((mode2 & 2) != 0) posx |= 0x4;
                        }

                        va =
                            ((mode1 >> 3) << 13) |
                            (posy << 10) |
                            ((mode0 & 0x0f) << 6) |
                            ((mode1 & 7) << 3) |
                            posx;
                    }

                    //console.log("rd: graph");
                    //debug && print_addr(va);

                    // mux
                    let tmp = ram[va >> 2];
                    attr = (tmp >> (8 * (va & 3))) & 0xff;

                    break;
                }

                case VState.RdPixels: {
                    //	ZX-pic adress
                    va = (mode1 << 10) |
                        ((mode0 & 0x0f) << 6) |
                        (zx_screen << 5) |
                        (((mode0 >> 6) & 3) << 3) |
                        (cnt_y & 0x07);

                    // mux
                    let tmp = ram[va >> 2];
                    pix = (tmp >> (8 * (va & 3))) & 0xff;

                    if (dbg_str) {
                        console.log(`\n\ntxt y: ${cnt_y & 0x07} >>>>>>>>>>>>>>>>>>>>>>>>>>>>> `);
                        print_addr(va);

                        console.log("\n");

                        console.log(`mode0: ${mode0.toString(16)}`);
                        console.log(`mode1: ${mode1.toString(16)}`);
                        console.log(`mode2: ${mode2.toString(16)}`);

                        console.log("\n");

                        console.log(("00000000" + ((ram[(va >> 2) + 0] >> 0) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 0] >> 8) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 0] >> 16) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 0] >> 24) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 1] >> 0) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 1] >> 8) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 1] >> 16) & 0xff).toString(2)).slice(-8));
                        console.log(("00000000" + ((ram[(va >> 2) + 1] >> 24) & 0xff).toString(2)).slice(-8));

                        console.log("\n");
                    }

                    break;
                }

                case VState.RdPallete: {
                    va = (pal_index << 10) | 0x3e0 | (pal_num << 2);
                    let tmp = ram[va >> 2];
                    curr_r = (tmp >> 0) & 0xff;
                    curr_g = (tmp >> 8) & 0xff;
                    curr_b = (tmp >> 16) & 0xff;

                    if (dbg_str) {
                        console.log(`pal_index:${pal_index.toString(16)} pal_num:${pal_num.toString(16)} r:${curr_r.toString(16)} g:${curr_g.toString(16)} b:${curr_b.toString(16)}`)
                    }

                    // вывод пикселей
                    if (vfase == 3) {
                        let pointer = (scr_line + cnt_x * 2) << 2;
                        png.data[pointer + 0] = curr_r;
                        png.data[pointer + 1] = curr_g;
                        png.data[pointer + 2] = curr_b;
                        png.data[pointer + 3] = 0xff;

                        // увдоение строк
                        let pointer2 = (scr_line2 + cnt_x * 2) << 2;
                        png.data[pointer2 + 0] = curr_r;
                        png.data[pointer2 + 1] = curr_g;
                        png.data[pointer2 + 2] = curr_b;
                        png.data[pointer2 + 3] = 0xff;
                    }

                    if (vfase == 6) {
                        let pointer = (scr_line + cnt_x * 2 + 1) << 2;
                        png.data[pointer + 0] = curr_r;
                        png.data[pointer + 1] = curr_g;
                        png.data[pointer + 2] = curr_b;
                        png.data[pointer + 3] = 0xff;

                        // увдоение строк
                        let pointer2 = (scr_line2 + cnt_x * 2 + 1) << 2;
                        png.data[pointer2 + 0] = curr_r;
                        png.data[pointer2 + 1] = curr_g;
                        png.data[pointer2 + 2] = curr_b;
                        png.data[pointer2 + 3] = 0xff;
                    }

                    break;
                }
            }

            // формирование цвета пикселя
            if (mode_gfx) {
                if (res640) {
                    pal_index = (pixel_14m & 1) ? (attr & 0xf) : (attr >> 4);
                    //pal_index = (attr >> 4);
                    pal_num = mode0 >> 6;
                } else {
                    pal_index = attr;
                    pal_num = mode0 >> 6;
                }

            } else {
                if (vfase == 3)
                    pix <<= 1;

                if (vfase == 6 && res640)
                    pix <<= 1;

                if (dbg_str)
                    console.log("pix bits: " + ("000000000" + pix.toString(2)).slice(-8));

                let curr_pix = (pix >> 7) & 1;
                curr_pix |= flash << 1;
                pal_num = ((curr_pix | 0x4) << 2);
                pal_index = attr;

                //pal_index = 1 << (curr_pix + 3);
                //pal_num = 0;
            }

            // чтение текущих модов
            if (vfase == 6 && ((pixel_7m == 3 && res640) || pixel_7m == 7)) {
                mode0 = (tmp_modes >> 0) & 0xff;
                mode1 = (tmp_modes >> 8) & 0xff;
                mode2 = (tmp_modes >> 16) & 0xff;

                if (oldmode0 != mode0) { // микрооптимизация

                    bord = (mode0 >> 4) == 0x0f;
                    blank = (mode0 >> 2) == 0x3f || screen_off;
                    intx = (mode0 >> 2) == 0x3f && ((mode0 & 1) == 1);

                    res320 = (mode0 & 0x20) != 0 && !bord;
                    res640 = (mode0 & 0x20) == 0 && !bord;

                    mode_text = (mode0 & 0x10) != 0 && !bord;
                    mode_gfx = (mode0 & 0x10) == 0 && !bord;

                    debug && console.log(`bord:${bord} blank:${blank} intx:${intx} res320:${res320} res640:${res640} txt:${mode_text} gfx:${mode_gfx}`);
                };

                oldmode0 = mode0;
            }

        }


    }
    //break;
    if (cnt_y > 60) break;
}


fs.writeFileSync("ram.png", PNG.sync.write(png));

