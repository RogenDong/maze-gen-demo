
import {
    C2,
    repeat,
    rand_int,
} from "./tools.js"

const
    // 方向
    UP = 1,
    DOWN = 2,
    LEFT = 4,
    RIGHT = 8,
    DIR = [UP, DOWN, LEFT, RIGHT],
    MV = {
        [UP]: [0, -1],
        [DOWN]: [0, 1],
        [LEFT]: [-1, 0],
        [RIGHT]: [1, 0],
    },
    MIRR = {
        [UP]: DOWN,
        [DOWN]: UP,
        [LEFT]: RIGHT,
        [RIGHT]: LEFT,
    },
    VERTICAL = UP + DOWN,
    HORIZONTAL = LEFT + RIGHT,
    CMAP = {
        [UP + LEFT]: [UP, LEFT],
        [DOWN + LEFT]: [DOWN, LEFT],
        [VERTICAL + LEFT]: [UP, DOWN, LEFT],
        [UP + RIGHT]: [UP, RIGHT],
        [DOWN + RIGHT]: [DOWN, RIGHT],
        [VERTICAL + RIGHT]: [UP, DOWN, RIGHT],
        [UP + HORIZONTAL]: [UP, LEFT, RIGHT],
        [DOWN + HORIZONTAL]: [DOWN, LEFT, RIGHT],
    },
    XCROSS = VERTICAL + HORIZONTAL;

/**
* 遍历方向，用方向执行指定操作
* @param {(d:number)=>any} f 按方向直行任务
* @returns {Map<number, any>} 任务结果 key 为方向
*/
function apply_dir(f) {
    let rs = {}
    for (let d of DIR) {
        rs[d] = f(d)
    }
    return rs
}

/**
* 读方向
* @param {number} d 方向
* @returns 方向
*/
function d2s(d) {
    switch (d) {
        case UP: return '上U' + UP
        case DOWN: return '下D' + DOWN
        case LEFT: return '左L' + LEFT
        case RIGHT: return '右R' + RIGHT
        default: `??${d}`
    }
}

/**
 * 校验 UDLR
 * @param {number} d 方向
 */
function udlr(d) {
    return d == UP || d == DOWN || d == LEFT || d == RIGHT
}

/**
 * 反方向
 * 只分别支持 URDL 4个方向
 * @param {number} d 方向
 * @returns 反方向
 */
function mirr(d) {
    if (!udlr(d)) {
        return 0
    }
    return MIRR[d]
}

/**
 * 检验路标有效性
 * @param {number} s 路标
 */
function vli_s(s) {
    return s > 0 && s <= XCROSS
}

/**
 * 分析纵还是横
 * @param {number} s 路标
 */
function hov(s) {
    if (s == UP || s == DOWN || s == VERTICAL) {
        return VERTICAL
    } else if (s == LEFT || s == RIGHT || s == HORIZONTAL) {
        return HORIZONTAL
    }
    return 0
}

/**
 * 是否路口
 * @param {number} s 路标
 */
function is_cross(s) {
    return s == XCROSS || CMAP[s] != null
}

/**
 * 解析路标
 * U1 D2 L4 R8
 * 转向：UR:9 UL:5 DR:10 DL:6
 * UDL:7 UDR:11 ULR:13 DLR:14 UDLR:15
 * @param {number} s 路标
 * @returns {number[]} 完整路标信息
 */
function identify(s) {
    if (!vli_s(s)) {
        return []
    }
    if (is_cross(s)) {
        return s == XCROSS ? DIR : CMAP[s]
    }
    if (s == HORIZONTAL) {
        return [LEFT, RIGHT]
    }
    if (s == VERTICAL) {
        return [UP, DOWN]
    }
    return [s]
}

/**
 * 追加方向到路标
 * @param {number} s 原路标
 * @param {number} d 需要追加的方向
 * @returns {number} 新路标
 */
function apn2s(s, d) {
    if (!udlr(d)) {
        return 0
    }
    if (s == XCROSS) {
        return s
    }
    if (!vli_s(s)) {
        return d
    }
    // 查重
    return s == d || identify(s).includes(d) ? s : s + d
}

/**
 * 迷宫
 */
export default class Maze {
    // 路标表
    #signs
    // 待拓展
    #stack
    #width
    #height
    #_hole_count

    /**
     * @param {number} w 横向路径节点数
     * @param {number} h 纵向路径节点数
     */
    constructor(w, h) {
        this.#width = w
        this.#height = h
    }

    /**
     * 检查出界
     * @param {C2} c 坐标
     */
    vli_c(c) {
        let { x, y } = c
        return (x > -1 && x < this.#width) && (y > -1 && y < this.#height)
    }

    /**
     * 读取路标或重新登记路标
     * 私有函数
     * @param {C2} c 坐标
     * @param {number} s 路标（可选；传此参数将在查询后修改值）
     * @returns {number} 路标
     */
    #sign(c, s) {
        if (!this.vli_c(c)) {
            return null
        }
        let { x, y } = c,
            os = this.#signs[x][y]
        if (s != null) {
            this.#signs[x][y] = s
        }
        return os
    }

    /**
     * 根据坐标取路标
     * @param {C2 | number} cox 坐标实体 或 坐标x值
     * @param {number} y 坐标y值
     * @returns 路标
     */
    get_sign(cox, y) {
        return y == null ? this.#sign(cox) : this.#signs[cox][y]
    }

    /**
     * 按方向走一步
     * @param {C2} c 坐标
     * @param {number} d 方向
     */
    mv(c, d) {
        if (!this.vli_c(c) || !udlr(d)) {
            return null
        }
        let { x, y } = c,
            [mx, my] = MV[d]
        let nc = new C2(x + mx, y + my)
        return this.vli_c(nc) ? nc : null
    }

    /**
     * 取邻近位置的路标
     * @param {C2} c 中心坐标
     * @returns {Map<number, number>} 上下左右4个位置的路标
     */
    nearby(c) {
        return apply_dir(d => {
            let dc = this.mv(c, d)
            return dc == null ? -1 : this.#sign(dc)
        })
    }

    /**
     * 从合适方向中随机选取
     * @param {C2} c 坐标
     * @param {number} cs 坐标c 的路标
     * @returns {number} 方向
     */
    #rand_dir(c, cs) {
        let fl = [],// first list
            sl = [],// second list
            nsl = this.nearby(c)
        // 路口可拓展
        function can_xpn(l, s, d) {
            let tdl = identify(s),
                z = tdl.length,
                f = l > 0 ? z == l : z < l
            if (f && !tdl.includes(mirr(d)))
                sl.push(d)
        }
        // console.debug('nearby:', nsl)
        for (let d of DIR) {
            let ns = nsl[d]
            if (ns >= 0) {
                // 开拓未知节点
                if (this.#_hole_count > 0) {
                    // 优先 开拓 或 连通绝路
                    if (ns == 0 || (cs != d && udlr(ns))) {
                        fl.push(d)
                    }
                    // 其次 拓展路口
                    else {
                        can_xpn(3, ns, d)
                    }
                }
                // 串连直角路口 或 打通绝路
                else if (ns != VERTICAL && ns != HORIZONTAL) {
                    if (ns != mirr(d) && udlr(ns)) {
                        fl.push(d)
                    } else {
                        can_xpn(-2, ns, d)
                    }
                }
            }// if ns valid
        }// for
        // console.debug('passable:', ds)

        let l = fl.length
        // 优先开未知，其次拓展路口
        if (l == 0) {
            fl = sl
            l = sl.length
        }
        if (l == 0) return null
        if (l == 1) return fl[0]
        return fl[rand_int(l - 1)]
    }

    /**
     * 连接坐标点指定方向的格子
     * @param {C2} c 出发坐标
     * @param {number} d 连接方向
     */
    #connect(c, d) {
        let dc = this.mv(c, d),
            // 反向
            md = mirr(d),
            // dest-loc sign
            dos = this.#sign(dc),
            // old sign at (x,y)
            os = this.#sign(c)

        if (os == null || dos == null || os == XCROSS) {
            return
        }
        // console.debug('dc:', dc.str(), ds)
        // sign 标记的是已连接方向
        let ds = dos == 0 ? md : apn2s(dos, md)
        // console.debug('new ds:', ds)
        let ns = os == 0 ? d : apn2s(os, d)
        // console.debug(`os ${os} -> ns`, ns)

        if (!vli_s(ns) || !vli_s(ds)) {
            console.error(`异常路标：${c.str()}${os} ${dc.str()}${ds}`)
            return
        } else if (ds == dos || ns == os) {
            return
        }
        if (dos == 0) {
            this.#_hole_count--
        }
        if (os == 0) {
            this.#_hole_count--
        }

        // 更新路标表
        this.#sign(c, ns)
        this.#sign(dc, ds)

        // 新节点压入底部
        if (udlr(ns)) {
            this.#stack.push(c)
        }
        if (udlr(ds)) {
            this.#stack.push(dc)
        }
        // 路口压入顶部
        if (ns < XCROSS && !hov(ns)) {
            this.#stack.unshift(c)
        }
        if (ds < XCROSS && !hov(ds)) {
            this.#stack.unshift(dc)
        }
    }

    /**
     * 构筑迷宫
     */
    generate() {
        // init
        this.#signs = []
        this.#stack = [new C2(0, 0)]
        this.#_hole_count = this.#width * this.#width
        repeat(this.#width, x => this.#signs.push(new Array(this.#height).fill(0)))

        // connect nodes
        while (this.#stack.length > 0) {
            let c = this.#stack.pop(),
                s = this.#sign(c)
            // 排除十字路口 和 双向直行
            if (s == XCROSS || s == VERTICAL || s == HORIZONTAL) {
                continue
            }

            // 随机选择开路或串连方向（回溯时考虑串连）
            let d = this.#rand_dir(c, s)
            // console.debug('rand dir:', d2s(d))

            if (d != null) {
                this.#connect(c, d)
            }
        }// while
        // console.debug(this.#_hole_count)
        // console.debug(this.#signs)
        if (this.#_hole_count == 0) {
            return
        }
        // 查漏补缺
        for (let x = 0; x < this.#width; x++) {
            for (let y = 0; y < this.#height; y++) {
                let s = this.#signs[x][y]
                if (s > 0) {
                    continue
                }

                let c = new C2(x, y),
                    nsl = this.nearby(c),
                    fl = [],
                    sl = []

                for (let d of DIR) {
                    let ns = nsl[d]
                    if (hov(ns) > 0) {
                        if (udlr(ns)) {
                            sl.push(d)
                        } else {
                            fl.push(d)
                        }
                    }
                }// for d

                let l = fl.length
                if (l < 1) {
                    fl = sl
                    l = sl.length
                }
                let d = l == 1 ? fl[0] : fl[rand_int(l - 1)],
                    dc = this.mv(c, d),
                    ds = this.#sign(dc) + mirr(d)
                this.#sign(dc, ds)
                this.#sign(c, d)
            }// for y
        }// for x
    }

    format(unk) {
        if (unk == null) {
            unk = '?'
        }
        let _tb = '   ',
            out = ''.padEnd(4)
        repeat(this.#height, x => out += `${x}`.padEnd(3))
        out += '\n'
        for (let y = 0; y < this.#height; y++) {
            let mstr = `${y}`.padStart(3),
                nls = _tb
            for (let x = 0; x < this.#width; x++) {
                let s = this.#signs[x][y]
                if (s == XCROSS) {
                    mstr += '—+—'
                    nls += ' | '
                } else if (is_cross(s)) {
                    let ds = identify(s)
                    mstr += ds.includes(LEFT) ? '—' : ' '
                    mstr += 'o'
                    mstr += ds.includes(RIGHT) ? '—' : ' '
                    nls += ds.includes(DOWN) ? ' | ' : '   '
                } else {
                    let t = hov(s)
                    if (t == VERTICAL) {
                        if (s == UP) {
                            mstr += ' * '
                            nls += _tb
                        } else {
                            mstr += s < VERTICAL ? ' * ' : " | "
                            nls += " | "
                        }
                    } else if (t == HORIZONTAL) {
                        if (s < HORIZONTAL) {
                            mstr += s == LEFT ? '—* ' : ' *—'
                        } else {
                            mstr += '———'
                        }
                        nls += _tb
                    } else {
                        mstr += ` ${unk} `
                        nls += _tb
                    }
                }
            }// for x
            out += `${mstr}\n${nls}\n`
        }// for y
        return out
    }
}
