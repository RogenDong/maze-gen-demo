
/**
 * 函数式遍历
 * @param {number} t 遍历次数
 * @param {(x:number)=>void} f 循环执行内容
 */
export function repeat(t, f) {
    let x = 0
    for (; x < t; f(x++));
}

/**
 * 获取 0~max 之间的随机整数
 * @param {number} max 最大值
 * @returns {number} 随机整数
 */
export function rand_int(max) {
    return Math.trunc(Math.random() * 10 % (max + 1))
}

/**
 * 极简坐标类
 * @property x 横坐标
 * @property y 纵坐标
 */
export class C2 {
    x
    y
    /**
     * @param {number} xx 横坐标
     * @param {number} yy 纵坐标
     */
    constructor(xx, yy) {
        this.x = xx
        this.y = yy
    }
    /**
     * @returns 坐标字符串
     */
    str() {
        return `(${this.x},${this.y})`
    }
    /**
     * 判断坐标相同
     * @param {Coordinate2} other 坐标
     */
    eq(other) {
        return this.x == other.x && this.y == other.y
    }
}
