import DOMNode from "./CustomElements/DOMNode.js"
import DOMRow from "./CustomElements/DOMRow.js"
import {BFS, DFS} from "./algorithms.js"

let animationQueue = [];
let animationProgress = null;
let prevAnimationIndex = 0;
let animationIndex = 0;
let currAnimation = null;
let currAlgorithm = null

//Grid
//  generateGrid(nodeSize)
//  handleGridSize(nodeSize)
class Grid {
    constructor(){
        this.grid = document.getElementById("grid");
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.prevNode = null;
        this.nodeSizes = [40,24,12];
        this.hasVisitedNodes = false;
    }

    generateGrid(nodeSize) {
        // get grid dimensions
        const gridDimensions = this.grid.getBoundingClientRect();
        const gridWidth = gridDimensions.width;
        const gridHeight = gridDimensions.height;

        // clear children
        while (this.grid.firstChild) {
            this.grid.removeChild(grid.firstChild);
        }

        const rows = Math.floor(gridHeight/nodeSize) % 2 ? Math.floor(gridHeight/nodeSize) : Math.floor(gridHeight/nodeSize)+1;
        const cols = Math.floor(gridWidth/nodeSize) % 2 ? Math.floor(gridWidth/nodeSize) : Math.floor(gridWidth/nodeSize)+1;
        // generate nodes and DOM for nodes
        for (let row = 0; row < rows; row++) {
            const nodeRow = [];
            const newDOMRow = document.createElement("tr"); // DOM grid
            for (let col = 0; col < cols; col++) {
                const newNode = new Node(row, col)

                // DOM Node setup
                const newDOMNode = new DOMNode(newNode);
                newDOMNode.addEventListener("mouseenter", (evt) => NodeMouseEnter(this, newNode, evt));
                newDOMNode.addEventListener("mousedown",  (evt) => NodeMouseDown(this, newNode, evt));
                newDOMNode.setAttribute('size', nodeSize);
                newDOMRow.appendChild(newDOMNode);

                // Internal Node
                newNode.DOMNode = newDOMNode;
                nodeRow.push(newNode);
                
                // set start and end node
                if (row == parseInt(rows/2) && col == parseInt(cols/4)) this.setStart(newNode);
                if (row == parseInt(rows/2) && col == parseInt(3*cols/4)) this.setEnd(newNode);
            }
            this.nodes.push(nodeRow);
            this.grid.append(newDOMRow);
        }
    }

    // remove walls
    ClearAll() {
        this.nodes.forEach(nodeRow => nodeRow.forEach(node => {
            node.setIsWall(false);
            node.visited = false;
            node.from = null;
            node.DOMNode.setVisited(false);
            node.DOMNode.setPath(false);
        }));
        this.hasVisitedNodes = false;
    }

    ClearVisited() {
        this.nodes.forEach(nodeRow => nodeRow.forEach(node => {
            node.visited = false;
            node.from = null;
            node.DOMNode.setVisited(false);
            node.DOMNode.setPath(false);
        }));
        this.hasVisitedNodes = false;
    }

    // generate new grid if grid size changes
    handleGridSize(nodeSize) { 
        this.generateGrid(this.nodeSizes[nodeSize]);
    }

    setStart(node) {
        if (this.startNode == node) {
            node.setIsStart(false);
            this.startNode = null;
        } else {
            if (this.startNode) this.startNode.setIsStart(false);
            node.setIsStart(true);
            this.startNode = node;
        }
    }

    setEnd(node) {
        if (this.endNode == node) {
            node.setIsEnd(false);
            this.endNode = null;
        } else {
            if (this.endNode) this.endNode.setIsEnd(false);
            node.setIsEnd(true);
            this.endNode = node;
        }
    }
}

//Node(row, col)
//  clearAttributes(node)
//  getNeighbors(node)
//  getDOMNode(node)
class Node {
    constructor(row, col) {
        this.id = `${row}_${col}`
        this.DOMNode = null;
        this.row = row;
        this.col = col;
        this.isWall = false;
        this.direction = null;
        this.visited = false;
        this.from = null;
    }

    getNeighbors(grid) {
        const {row, col} = this;
        const nodes = grid.nodes;
        const neighbors = [];
        const colLength = nodes[0].length;
        const rowLength = nodes.length
        let neighbor = null;
        if (col+1 < colLength) {
            neighbor = nodes[row][col+1];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "left";
                neighbors.push( neighbor );
            }
        }
        if (row+1 < rowLength) {
            neighbor = nodes[row+1][col];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "above";
                neighbors.push( neighbor );
            }
        }
        if (col-1 >= 0) {
            neighbor = nodes[row][col-1];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "right";
                neighbors.push( neighbor );
            }
        }
        if (row-1 >= 0) {
            neighbor = nodes[row-1][col];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "below";
                neighbors.push( neighbor );
            }
        }
        return neighbors;
    }
    
    clearAttributes() {
        this.DOMNode.isStart = false;
        this.DOMNode.isEnd = false;
        this.DOMNode.isWall = false;
    }

    setVisited(value, animate = true) {
        if (animate) this.DOMNode.setVisited(value, this.direction);
        else this.DOMNode.setVisited(value, "none");
    }

    setPath(value, animate = true) {
        if (animate) this.DOMNode.setPath(value, this.direction);
        else this.DOMNode.setPath(value, "none");     
    }

    setIsWall(value) {
        this.DOMNode.isWall = value;
        this.isWall = value;
    }

    setIsStart(value) {
        this.DOMNode.isStart = value;
    }

    setIsEnd(value) {
        this.DOMNode.isEnd = value;
    }
}

class StateMachine {
    constructor (initialState) {
        this.state = initialState;
        this.prevState = null;
        this.mouseState = {leftMouseDown: false, rightMouseDown: false};
        this.handleMouseState = this.handleMouseState.bind(this);
    }

    transition(state) {
        // attempt to transition to next state
        let nextState = this.state.transitions[state.name]
        
        // if next state doesn't exist, show default error and don't transition
        if (!nextState) {
            alert(`No transition ${this.state.name} => ${state.name}`);
            return;
        }
        // if next state has an error, call its error function and don't transition
        if (nextState.error) { 
            nextState.error();
            return
        }
        
        if (nextState.animation) {
            nextState.animation();
        }

        if (nextState.prepareForTransition) {
            nextState.prepareForTransition();
        }
        
        if (this.state != APPSTATE[state.name]) this.prevState = this.state; // don't set prevState if next state is the same as current
        this.state = APPSTATE[state.name];
        console.log(this.state);
    }

    handleMouseState(evt) {
        this.mouseState.leftMouseDown = false;
        this.mouseState.rightMouseDown = false;

        switch(evt.buttons) {
            case 1: 
                this.mouseState.leftMouseDown = true;
                break;
            case 2: 
                this.mouseState.rightMouseDown = true;
                break;
        }
    }
}

// main
window.addEventListener("DOMContentLoaded", function() {

    const grid = new Grid();
    grid.generateGrid(24);

    // prevent contentmenu on node right click
    document.oncontextmenu = function(evt){
        if (evt.target instanceof DOMNode) {
            evt.preventDefault();
        }
    }
    document.onmouseup = handleMouseUp;

    // user actions
    // const gridSize = document.getElementById("grid-size");
    // gridSize.onchange = (evt) => grid.handleGridSize(evt.target.value);
    const playButton = document.getElementById("play-button");
    playButton.onclick = () => handlePlay(grid);
    animationProgress = document.getElementById("animation-progress");
    animationProgress.onchange = (evt) => handleAnimationProgress(evt.target.value);
    const BFSButton = document.getElementById("algorithm-BFS");
    BFSButton.onclick = () => runAlgorithm(grid, BFS, animationProgress, playButton);
    const DFSButton = document.getElementById("algorithm-DFS");
    DFSButton.onclick = () => runAlgorithm(grid, DFS, animationProgress, playButton);
    const clearButton = document.getElementById("clear-button");
    clearButton.onclick = () => Clear(grid);
    const resetButton = document.getElementById("reset-button");
    resetButton.onclick = () => Reset(grid);
});

// Node Logic Handlers
function NodeMouseEnter(grid, node, evt) {
    stateMachine.handleMouseState(evt); // update mouse state before doing anything
    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;
    
    // wall drawing
    switch(stateMachine.state) {
        case APPSTATE.PAUSE:
            if ((leftMouseDown || rightMouseDown) && grid.hasVisitedNodes) grid.ClearVisited(); // if you try to draw a wall while paused, clear out the board
        case APPSTATE.IDLE:
            if (leftMouseDown && node != grid.startNode && node != grid.endNode) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            break;
        case APPSTATE.MOVE_START:
            if (node != grid.endNode && !node.isWall) grid.setStart(node);
            if (currAlgorithm) instantAnimate(grid);
            break;
        case APPSTATE.MOVE_END:
            if (node != grid.startNode && !node.isWall) grid.setEnd(node);
            if (currAlgorithm) instantAnimate(grid);
            break;
    }
}

function NodeMouseDown(grid, node, evt) {
    stateMachine.handleMouseState(evt);
    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;

    if (node == grid.startNode) { stateMachine.transition(APPSTATE.MOVE_START); } 
    if (node == grid.endNode) { stateMachine.transition(APPSTATE.MOVE_END); }

    switch(stateMachine.state) {
        // wall drawing
        case APPSTATE.IDLE:
            if (leftMouseDown) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            break;
        case APPSTATE.PLAYING_ANIMATION:
            stateMachine.transition(APPSTATE.PAUSE);;
        case APPSTATE.PAUSE:
            if (grid.hasVisitedNodes) grid.ClearVisited();
            if (leftMouseDown) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);

        default:
            break;
    }
}

function handleMouseUp(evt){
    switch(stateMachine.state) {
        case APPSTATE.MOVE_END:
        case APPSTATE.MOVE_START:
            stateMachine.transition(stateMachine.prevState);
            break;
        default:
            break;
    }
}

// global state
const APPSTATE = Object.freeze({
    IDLE: {
        name: "IDLE", 
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
            PLAYING_ANIMATION: {name: "PLAYING_ANIMATION"}
        }
    },
    MOVE_START: {
        name: "MOVE_START", 
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
        }
    }, 
    MOVE_END: {
        name: "MOVE_END", 
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
            PAUSE: {name: "PAUSE"},
        }
    }, 
    PLAYING_ANIMATION: {
        name: "PLAYING_ANIMATION", 
        transitions: {
            PLAYING_ANIMATION: {name: "PLAYING_ANIMATION",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            PAUSE: {
                name: "PAUSE",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            IDLE: {
                name: "IDLE",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
        }
    }, 
    PAUSE: {
        name: "PAUSE", 
        transitions: {
            PLAYING_ANIMATION: {name: "PLAYING_ANIMATION"},
            PAUSE: {name: "PAUSE"},
            IDLE: {name: "IDLE"},
            MOVE_END: {name: "MOVE_END"},
        }
    }, 
});

const stateMachine = new StateMachine(APPSTATE.IDLE);

// handle transitioning state machine based on user button press
function handleAppState(state) {
    switch(state) {
        // is user pressed wall button, set to draw wall mode
        // case APPSTATE.DRAW_WALL:
        //     stateMachine.state !== APPSTATE.DRAW_WALL ? stateMachine.transition(APPSTATE.DRAW_WALL) : stateMachine.transition(APPSTATE.IDLE)
        //     break;
        // Place START
        default: 
            stateMachine.transition(APPSTATE.IDLE);
    }
    toggleButtons();
}

// toggle button appearance
function toggleButtons() {
    // document.getElementById("wall-button").classList.remove("toggled");
    switch(stateMachine.state) {
        // is user pressed wall button, set to draw wall mode
        // case APPSTATE.DRAW_WALL:
        //     document.getElementById("wall-button").classList.add("toggled");
        //     break;
        // Place START
        default: 
    }
}

function runAlgorithm(grid, algorithm) {
    currAlgorithm = algorithm;
    // clean up visited nodes and reset animations & animation progress
    grid.ClearVisited();
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
    
    // run algorithm and then animate
    algorithm(grid, animationQueue);
    animationQueue = animationQueue.concat(createPath(grid)); 
    animationProgress.max = animationQueue.length;
    grid.hasVisitedNodes = true;
    currAnimation = setInterval(animateSearch, 5);

}

// animate algorithm search
function animateSearch() {
    if (animationIndex < animationQueue.length) {
        animationProgress.value++;
        const { node, type } = animationQueue[animationIndex++];
        type == "visit" ? node.setVisited(true) : node.setPath(true);
        //animateSearch(animationProgress, ++animationIndex);
        prevAnimationIndex = animationIndex;
    } else {
        clearInterval(currAnimation);
    }
}


// when animation progress is handled by user
function handleAnimationProgress(value) {
    grid.hasVisitedNodes = true;
    stateMachine.transition(APPSTATE.PAUSE);

    // if single stepping with arrow keys
    if (animationIndex == value-1) {
        const {node, type} = animationQueue[animationIndex];
        type == "visit" ? node.setVisited(true) : node.setPath(true);

    }
    if (animationIndex == value+1) {
        const {node, type} = animationQueue[animationIndex];
        type == "visit" ? node.setVisited(false) : node.setPath(false);
    }

    // if jumping to a point in the animation, go over entire queue to be safe since repaint is async
    else {
        for (let x = 0; x < value; x++) {
            const {node, type} = animationQueue[x];
            // don't animate to prevent lag
            type == "visit" ? node.setVisited(true, false) : node.setPath(true, false);
        }
        for (let x = value; x < animationQueue.length; x++) {
            const {node, type} = animationQueue[x];
            type == "visit" ? node.setVisited(false, false) : node.setPath(false, false);
        }
    }
    animationIndex = value;
}


// when start or end node is updated, immediately show search result
let previousPath = []; // keep track of previous path for efficient clear
function instantAnimate(grid) {
    // start fresh and run algorithm
    grid.nodes.forEach(nodeRow => nodeRow.forEach(node => node.visited = false));
    previousPath.forEach(({node, type}) => node.setPath(false, false));
    currAlgorithm(grid, animationQueue);

    grid.nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node.visited) {
            node.setVisited(true, false)
        } else {
            node.setVisited(false, false);
        }
    }))

    // draw path
    previousPath = createPath(grid);
    let pathNode = grid.endNode;
    while (pathNode.from) {
        pathNode.setPath(true, false);
        pathNode = pathNode.from;
    }
}

// play button handler, get rid of this eventually
function handlePlay(grid) {
    grid.hasVisitedNodes = true;
    const playButton = document.getElementById("play-button");
    const animationProgress = document.getElementById("animation-progress");
    console.log("arf", stateMachine.state);
    if (stateMachine.state == APPSTATE.IDLE) {
        playButton.innerHTML = "Pause";
    } else if (stateMachine.state == APPSTATE.PLAYING_ANIMATION) {
        stateMachine.transition(APPSTATE.PAUSE);
        clearInterval(currAnimation);
        currAnimation = null;
        playButton.innerHTML = "Play";
    } else if (stateMachine.state == APPSTATE.PAUSE) {
        stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
        playButton.innerHTML = "Pause";
        currAnimation = setInterval(animateSearch, 5);
    }
}

// figure out the path
function createPath(grid) {
    let node = grid.endNode;
    let pathQueue = [];
    while (node.from) {
        node = node.from;
        pathQueue.unshift({node: node, type: "path"});
    }
    if (grid.endNode.from) pathQueue.unshift({node: grid.endNode, type: "path"});
    return pathQueue;
}

// clear button handler, clears everything
function Clear(grid) {
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    animationProgress.max = 0;
    grid.ClearAll();
    stateMachine.transition(APPSTATE.IDLE);
}

// reset button handler, clears everything except walls
function Reset(grid) {
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    animationProgress.max = 0;
    grid.ClearVisited();
    stateMachine.transition(APPSTATE.IDLE);
}