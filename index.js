
import Maze from './maze.js'

function s2n(s) {
    return Number.parseInt(s)
}

function main(args) {
    console.log("maze generator demo")

    let [, , w, h] = args
    const maze = new Maze(s2n(w), s2n(h))
    maze.generate()
    maze.output()
}

main(process.argv)