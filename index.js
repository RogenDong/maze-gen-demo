
import Maze from './maze.js'

function toInt(s) {
    return Number.parseInt(s)
}

function main(args) {
    console.log("maze generator demo")

    let [, , w, h] = args
    const maze = new Maze(toInt(w), toInt(h))
    maze.generate()
    console.log(maze.format())
}

main(process.argv)