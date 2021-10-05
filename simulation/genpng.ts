import * as fs from "fs";
import { PNG } from "pngjs";

const content = fs.readFileSync("./out/video.hex", "utf-8").split("\n");
const data = new Uint32Array(896 * 320);

let index = 0;

for (let str of content) {
    if (str.startsWith("//")) continue;

    if (!str.search("x") || !str.search("X")) {
        data[index] = 0;
    }
    else {

        data[index] = parseInt(str, 16);
    }
    index++;
}

console.log("last index: " + index);

const png = new PNG({
    colorType: 4,
    width: 896,
    height: 320
});


/*
for (var y = 0; y < 320; y++) {
    for (var x = 0; x < 896; x++) {
        var idx = (896 * y + x) << 2;

        // invert color
        png.data[idx] = y;
        png.data[idx + 1] = y;
        png.data[idx + 2] = x;

        // and reduce opacity
        png.data[idx + 3] = 0xff;
    }
}
*/

let scr_h = 320;
let scr_w = 896;
let cnt_x = 0;
let cnt_y = 0;



enum Stat {
    WaitEndBlank,
    RenderBorder,
    RenderPixels,
    RenderRightBorder,
};

let state: Stat = Stat.WaitEndBlank;

let prev = data[0];
for (let i = 1; i < data.length; i++) {
    let cur = data[i];

    let pbord = (prev >> 24) & 1;
    let bord = (cur >> 24) & 1;
    let pblank = (prev >> 25) & 1;
    let blank = (cur >> 25) & 1;

    const start_bord = pbord == 0 && bord == 1;
    const end_bord = pbord == 1 && bord == 0;
    const start_blank = pblank == 0 && blank == 1;
    const end_blank = pblank == 1 && blank == 0;

    switch (state) {
        case Stat.WaitEndBlank: {
            if (!end_blank) {                
            }
            else {
                state = Stat.RenderBorder;
                console.log("end blank at: " + i + " y: " + cnt_y + " x: " + cnt_x);
            }
            break;
        }
        case Stat.RenderBorder: {
            if (end_bord) {
                state = Stat.RenderPixels;
                console.log("end border at: " + i + " y: " + cnt_y + " x: " + cnt_x);
            }
            else {

                let index = (cnt_y * scr_w + cnt_x) << 2;
                png.data[index + 0] = 255;
                png.data[index + 1] = 20;
                png.data[index + 2] = 147;
                png.data[index + 3] = 255;

                cnt_x += 1;
            }
            break;
        }

        case Stat.RenderPixels: {
            if (start_bord) {
                console.log("start border at: " + i + " y: " + cnt_y + " x: " + cnt_x);
                state = Stat.RenderRightBorder;
            } else {
                let index = (cnt_y * scr_w + cnt_x) << 2;
                png.data[index + 0] = data[i] & 0xff;
                png.data[index + 1] = (data[i] >> 8) & 0xff;
                png.data[index + 2] = (data[i] >> 16) & 0xff;
                png.data[index + 3] = 255;

                cnt_x += 1;
            }
            break;
        }

        case Stat.RenderRightBorder: {
            if (start_blank) {
                state = Stat.WaitEndBlank;
                cnt_x = 0;
                cnt_y++;
            }
            else {

                let index = (cnt_y * scr_w + cnt_x) << 2;
                png.data[index + 0] = 255;
                png.data[index + 1] = 20;
                png.data[index + 2] = 147;
                png.data[index + 3] = 255;

                cnt_x += 1;
            }
        }
    }

    prev = cur;
}


fs.writeFileSync("out.png", PNG.sync.write(png));