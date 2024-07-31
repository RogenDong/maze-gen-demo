
const U = 1;// 0b_1
const D = 2;// 0b_10
const L = 4;// 0b_100
const R = 8;// 0b_1000

// const UD = U + D;
// const LR = L + R;
// const ALL = 15;

// export const WAY_SIGN = [
//     U, D, U | D,
//     L, U | L, D | L, U | D | L,
//     R, U | R, D | R, U | D | R, L | R, U | L | R, D | L | R,
//     ALL
// ];

/** 反向 */
export function rev(d) {
    switch (d) {
        case U: return D;
        case D: return U;
        case L: return R;
        case R: return L;
    }
    return 0;
}

/** 单步移动 */
export function move(x, y, d) {
    switch (d) {
        case U: return [x, y - 1];
        case D: return [x, y + 1];
        case L: return [x - 1, y];
        case R: return [x + 1, y];
    }
    return null;
}

/**
 * 每个方向各进一步
 */
export function for_each_dir(x, y, fn) {
    for (let d = U; d <= R; d <<= 1) {
        let m = move(x, y, d);
        if (m != null) {
            let [mx, my] = m;
            fn(mx, my, d);
        }
    }
}