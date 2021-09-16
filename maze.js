
import {
    repeat,
    Coordinate2 as C2,
    random_int as ran_int,
} from "./tools.js"

const CROSS = 1,// 路口
    STRAIGHT = 2,// 直行
    // 纵横
    VER = 3,
    HOR = 4,
    XCROSS = 5,
    // 方向，顺时针顺序
    UP = 0,
    RIGHT = 1,
    DOWN = 2,
    LEFT = 3,
    // 步进增量
    MV_X = [0, 1, 0, -1],
    MV_Y = [-1, 0, 1, 0]

/**
 * 读方向
 * @param {number} d 方向
 * @returns 方向
 */
function dcs(d) {
    switch (d) {
        case UP: return '上U0'
        case DOWN: return '下D1'
        case LEFT: return '左L3'
        case RIGHT: return '右R2'
        default: `?${d}`
    }
}

/**
 * 反方向
 * @param {number} d 方向
 * @returns 反方向
 */
function mirr(d) {
    return d > 1 ? d - 2 : d + 2
}

/**
 * 校验路标是否可用
 * 非空
 * 十字路口
 * 非数字（十字除外）
 * 长度介于2~4之间
 * 
 * 直走 -- 长度介于2~3之间
 * 路口 -- 长度介于3~4之间
 * @param {string} s 路标
 */
function identify(s) {
    if (s == null) return 0
    if (s == XCROSS) return s
    let l = typeof s == 'string' ? s.length : 0
    if (l < 2 || l > 4) return 0
    let p = s[0]
    if (p != CROSS && p != STRAIGHT)
        return 0
    if (p == STRAIGHT && l > 1)
        return STRAIGHT
    if (p == CROSS && l > 2 && l < 5)
        return CROSS
    return 0
}

/**
 * 遍历方向
 * @param {(d:number)=>any} f 按方向直行任务
 * @returns {any[]} 遍历产生的结果
 */
function apply_dir(f) {
    let rs = []
    for (let d = 0; d < 4; rs.push(f(d++)));
    return rs
}

/**
 * 追加方向到路标
 * @param {string} s 原路标
 * @param {number} d 需要追加的方向
 * @returns {string} 新路标
 */
function apnd_dir(s, d) {
    if (s == XCROSS) return s
    if (d < UP || d > LEFT) return s
    let t = s
    // 是否新路标
    if (s == null || s < CROSS || s.length < 1)
        t = `${STRAIGHT}` + d
    // 重复
    else if (s.includes(d, 1))
        return s
    // 是否直行
    else if (s[0] == STRAIGHT) {
        let pd = Number.parseInt(s[1])
        if (d == pd || Math.abs(d - pd) == 2)
            t = s + d
        // 转向
        else t = `${CROSS}${pd}` + d
    }
    // 是否路口拓展
    else if (s[0] == CROSS)
        t = s.length == 4 ? XCROSS : s + d
    else console.error('路标无法识别：', s)
    return t
}

/**
 * 分析路标属于横向还是纵向
 * @param {string} s 路标
 */
function hov(s) {
    if (identify(s) != STRAIGHT) return null
    return Number.parseInt(s[1]) % 2 < 1 ? VER : HOR
}

/**
 * 判断是否为路口
 * @param {string} s 路标
 */
function is_cross(s) {
    return s == XCROSS || s[0] == CROSS
}

/**
 * 判断是否直行
 * @param {string} s1 路标1
 * @param {string} s2 路标2
 */
function is_stra(s1, s2) {
    let t1 = hov(s1)
    if (t1 != null && s2 != null && s2 < CROSS)
        return true
    let t2 = hov(s2)
    return t1 != null && t2 != null && (t1 == t2)
}

/**
 * 迷宫
 */
export default class Maze {
    /**
     * 路径标识表
     * 例：'101' => 路口 上 右
     * 首位：路口CROSS 或 直行STRAIGHT
     * 后4位：通行方向：0123=上右下左=URDL
     */
    #signs
    // 路口坐标的集合
    #crossing
    #width
    #height
    #start

    /**
     * @param {number} w 宽度
     * @param {number} h 高度
     */
    constructor(w, h) {
        // console.debug(`width: ${w}, height:`, h)
        this.#width = w
        this.#height = h
        // 零点作为起点
        this.#start = new C2(0, 0)
    }

    /**
     * 检查出界
     * @param {C2} c 坐标
     */
    #valid(c) {
        let { x, y } = c
        return (x > -1 && x < this.#width) && (y > -1 && y < this.#height)
    }

    /**
     * 读取路标或重新登记路标
     * @param {C2} c 坐标
     * @param {string} s 路标（传此参数将在查询后修改值）
     * @returns {string} 路标
     */
    #sign(c, s) {
        if (typeof c == 'number') {
            return this.#signs[c][s] || -1
        }
        if (!this.#valid(c)) return null
        let { x, y } = c
        let t = this.#signs[x][y] || -1
        if (s != null) {
            // if ((!is_cross(t)) && is_cross(s))
            this.#signs[x][y] = s
        }
        return t
    }

    /**
     * 直走
     * @param {C2} c 出发位置
     * @param {number} d 方向
     * @returns {C2} 目标位置
     */
    go_stra(c, d) {
        if (!c) {
            console.error(`c not null -- @Maze.go_stra()`)
            return null
        }
        if (!this.#valid(c)) return null
        let nc = new C2(c.x + MV_X[d], c.y + MV_Y[d])
        if (!this.#valid(nc)) return null
        return nc
    }

    /**
     * 顺时针45°斜着走
     * @param {C2} c 出发位置
     * @param {number} d 方向指标（顺时针转45°作为出发角度）
     * @returns {C2} 目标位置
     */
    bevel(c, d) {
        if (!c) {
            console.error(`c not null -- @Maze.bevel()`)
            return null
        }
        if (!this.#valid(c)) return null
        let { x, y } = c
        if (d == LEFT) return new C2(x - 1, y - 1)
        return new C2(x + MV_X[d] + MV_X[d + 1], y + MV_Y[d] + MV_Y[d + 1])
    }

    /**
     * 取邻近格子的状态
     * @param {C2} c 起始坐标
     * @returns {number[]} 【指定格子，或上下左右4个格子】的状态
     */
    nearby(c) {
        return apply_dir(d => {
            let dc = this.go_stra(c, d)
            if (dc == null) return undefined
            return this.#sign(dc)
        })
    }

    /**
     * 取周围8个单位
     * @param {C2} c 中心坐标
     * @returns {C2[]} 周围8个单位
     */
    around(c) {
        if (!c) {
            console.error(`c not null -- @Maze.around()`)
            return null
        }
        let sls = [], bls = []
        for (let d = UP; d <= LEFT; d++) {
            sls.push(this.go_stra(c, d))
            bls.push(this.bevel(c, d))
        }
        return sls.concat(bls)
    }

    /**
     * 连接坐标点指定方向的格子
     * @param {C2} c 出发坐标
     * @param {number} d 连接方向
     */
    #connect(c, d) {
        let dc = this.go_stra(c, d),
            md = `${mirr(d)}`,
            // sign at d(irection)
            ds = this.#sign(dc),
            // old(now) sign at (x,y)
            os = this.#sign(c),
            // new sign
            ns;
        // console.debug('os:', os)
        // console.debug('dc:', dc.str())

        if (os == XCROSS) return
        // 前方路标
        if (ds == null || ds < CROSS) ds = apnd_dir(0, md)
        else if (is_cross(ds)) ds = apnd_dir(ds, md)
        else ds = apnd_dir(ds, d)
        // console.debug('ds:', ds)
        // 配置新路标
        // 起点
        if (c.eq(this.#start) && os < CROSS)
            ns = apnd_dir(0, d)
        // 是否路口拓展
        else if (is_cross(os))
            ns = apnd_dir(os, d)
        // 是否直行
        else if (is_stra(os, ds))
            ns = apnd_dir(c.eq(this.#start) ? 0 : os, d)
        // 直行变路口
        else ns = apnd_dir(os, d)
        // console.debug('ns:', ns)

        if (ns == null) {
            console.error(`异常路标：${c.str()}${os}->${dc.str()}${ds}`)
            return
        }

        // 更新路标表
        this.#sign(c, ns)
        this.#sign(dc, ds)

        // 向堆底部压入新节点
        if (ns != XCROSS && (is_cross(ns) || ns.length == 2))
            this.#crossing.push(c)
        if (!is_cross(ds))
            this.#crossing.push(dc)
    }

    /**
     * 从合适方向中随机选取
     * @param {C2} c 坐标
     * @returns {number} 方向
     */
    #rand_dir(c) {
        let ds = [],
            ls = this.nearby(c)
        // console.debug('nearby:', ls)

        for (let d = 0; d < ls.length; d++) {
            let s = ls[d]
            // 非界外坐标
            // 未设路标 或 为非十字的路口
            if (s !== undefined && s != XCROSS &&
                (s < 0 || (is_cross(s) && s.length < 4 && !s.includes(mirr(d), 1)))
            ) {
                ds.push(d)
            }
        }
        // console.debug('passable:', ds)

        let l = ds.length
        if (l == 0) return null
        if (l == 1) return ds[0]
        // let rd = ds[ran_int(l)]
        // for (; s.includes(`${rd}`, 1); rd = ds[ran_int(l)]);
        return ds[ran_int(l - 1)]
    }

    /**
     * 构筑迷宫
     */
    generate() {
        this.#signs = []
        this.#crossing = [this.#start]
        repeat(this.#width, x => this.#signs.push(new Array(this.#height).fill(null)))
        while (this.#crossing.length > 0) {
            // 取最后一个
            let c = this.#crossing.pop()
            // 排除十字路口和双向直行
            let ts = this.#sign(c)
            if (ts == XCROSS || (ts[0] == STRAIGHT && ts.length > 2))
                continue
            // console.debug(`\n--->${c.str()}<---`)

            // 随机选择开路方向
            let d = this.#rand_dir(c)
            // console.debug('direction:', dcs(d))

            // 若无有效方向，从堆中删除坐标
            if (d == null) {
                this.#crossing.pop()
                continue
            }

            // 开路
            this.#connect(c, d)
        }
        // console.debug('signs:', this.#signs)
        // 修补空穴
        console.debug('connect [null] rooms...')
        for (let x = 0; x < this.#width; x++) {
            for (let y = 0; y < this.#height; y++) {
                let s = this.#signs[x][y]
                if (s != null) continue

                let c = new C2(x, y)
                console.debug(`\n--->${c.str()}<---`)

                let ts = '',
                    ls = this.nearby(c)
                while (ts.length < 4) {
                    let d = ran_int(ls.length)
                    if (ts.indexOf(d) >= 0) continue
                    else ts += d
                    let n = ls[d]
                    if (typeof n == 'string' && (n.length < 4 || is_cross(n))) {
                        let dc = this.go_stra(c, d)
                        console.debug(`${dc.str()}->${c.str()}`)
                        this.#connect(this.go_stra(c, d), mirr(d))
                        break
                    }
                }
                console.debug(`now ${c.str()}`, this.#sign(c))
            }// for y
        }// for x
    }

    output() {
        console.log('\n\n')
        let tt = '   '
        repeat(this.#height, x => tt += ` ${x}${x > 9 ? '' : ' '}`)
        console.log(tt)
        repeat(this.#height, y => {
            let mstr = `${y > 9 ? '' : ' '}${y} `,
                nls = '   '
            repeat(this.#width, x => {
                let s = this.#signs[x][y]
                if (s == XCROSS) {
                    mstr += '—+—'
                    nls += ' | '
                } else if (s == null) {
                    mstr += ' ? '
                    nls += '   '
                } else if (s[0] == CROSS) {
                    mstr += s.includes(LEFT, 1) ? '—' : ' '
                    mstr += 'o'
                    mstr += s.includes(RIGHT, 1) ? '—' : ' '
                    nls += s.includes(DOWN, 1) ? ' | ' : '   '
                } else {
                    let t = hov(s)
                    if (t == VER) {
                        if (s.length < 3) {
                            if (s[1] == UP) {
                                mstr += ' | '
                                nls += ' * '
                            } else {
                                mstr += ' * '
                                nls += ' | '
                            }
                        } else {
                            mstr += " | "
                            nls += " | "
                        }
                    } else if (t == HOR) {
                        if (s.length < 3) {
                            if (s[1] == RIGHT)
                                mstr += ' *—'
                            else mstr += '—* '
                        } else mstr += '———'
                        nls += '   '
                    }
                }
            })
            console.log(mstr)
            console.log(nls)
        })
    }
}
