import { for_each_dir, rev } from './v2';

// 限制
const W_MIN = 5;
const H_MIN = 5;
const W_MAX = 50;
const H_MAX = 50;

export class Maze {
    /** 宽 */
    www
    /** 高 */
    hhh
    /** 坐标数据 */
    map

    constructor(w, h) {
        if (w < W_MIN || w > W_MAX || h < H_MIN || h > H_MAX) {
            console.error("input invalid size! now size 10x10.");
            w = 10;
            h = 10;
        }
        this.www = w;
        this.hhh = h;
        this.map = [];
        for (let y = 0; y < h; y++)
            this.map.push(new Array(w).fill(0));
    }

    /**
     * 生成迷宫数据
     * 1 以任意位置开始
     * 2 在点的上下左右收集空位
     * 3 随机选择一个方向，连通当前点与目标点
     *   > 当前点sign += 目标方向
     *   > 目标点sign += 反目标方向
     * 4 如果目标方向与之前方向不同，记录拐角坐标
     * 5 如果周围没有合适点位则回溯上一个拐角
     * 6 拐角队列清空则结束生成
     */
    gen() {
        let more_ukn = this.www * this.hhh;
        // 转角队列 [[x,y], ...]
        const corners = [];
        let pre_dir = 0;
        // 当前坐标（起点随机）
        let cur_coor = [
            rand(0, this.www),
            rand(0, this.hhh),
        ];

        while (more_ukn > 0) {
            // 获取周围有效坐标+方向 [[x, y, dir], ...]
            const ls_nearby = this.nearby_ukn(cur_coor);
            let ri = rand_one(ls_nearby.length);
            // 若无无法前进，尝试回到上一个转角
            if (ri < 0) {
                // 转角队列已清空，结束
                if (corners.length == 0) return;
                cur_coor = corners.pop();
                // console.log("back to", cur_coor);
                continue;
            }

            let dest_coor = ls_nearby[ri];
            const [dx, dy, nx_dir] = dest_coor;

            // 打开道路
            this.open_way(cur_coor, dest_coor);
            // 若当前非起点 && 转向了 && 周围有空位，记录当前点为拐角
            if (pre_dir != 0 && pre_dir != nx_dir && ls_nearby.length > 1) {
                corners.push(cur_coor);
            }
            cur_coor = [dx, dy];
            pre_dir = nx_dir;
            more_ukn--;
        }
        console.log("success");
    }

    open_way([fx, fy], [dx, dy, dd]) {
        let fs = this.map[fy][fx];
        let ds = this.map[dy][dx];

        this.map[fy][fx] = fs | dd;
        this.map[dy][dx] = ds | rev(dd);
        // console.log(`fs: ${fs}->${this.map[fy][fx]}\nds: ${ds}->${this.map[dy][dx]}`);
    }

    nearby_ukn([x, y]) {
        let ls = [];
        for_each_dir(x, y, (dx, dy, d) => {
            if (this.inside(dx, dy)) {
                if (this.map[dy][dx] == 0) {
                    ls.push([dx, dy, d]);
                }
            }
        });
        return ls;
    }

    /** 检查出界 */
    inside(x, y) {
        return !(x < 0 || x >= this.www || y < 0 || y >= this.hhh);
    }
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function rand_one(len) {
    if (len <= 1) return len - 1;
    return rand(0, len);
}
