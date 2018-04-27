import * as React from "react"
import * as ReactDOM from "react-dom"
import "../node_modules/materialize-css/dist/css/materialize.min.css"
import "../node_modules/materialize-css/dist/js/materialize.min.js"
import "./index.css"

// COPY FROM HERE

enum GameState {
  NotStarted = "Game not started",
  Playing = "Currently Playing",
  Draw = "It's a Draw!",
  PlayerOneVictory = "Hurray- Player One made it!",
  PlayerTwoVictory = "Bummer- Player Two made it!",
}

enum PlayerMarker {
  X = "X",
  O = "O"
}

interface PlayerState {
  marker: PlayerMarker
}

interface State {
  playAgainstComputer: boolean
  whoIsNext: number
  players: PlayerState[]
  board: number[][]
  gameState: GameState
}

type ButtonEventCallback = (e: React.MouseEvent<HTMLButtonElement>) => void
// type LinkEventCallback = (e: React.MouseEvent<HTMLAnchorElement>) => void

// computer solve code inspired by https://codepen.io/freeCodeCamp/pen/KzXQgy
class ComputerSolver {

  lines: number[][][]
  possibleLines: number[][][]
  board: number[][]
  player: number
  otherPlayer: number

  public constructor(lines: number[][][], board: number[][], player: number) {
    this.lines = lines
    this.board = board
    this.player = player
    this.otherPlayer = (player + 1) % 2
    this.possibleLines = this.lines.filter(row => (
      row.find(([a1, a2]) => (
        this.board[a1][a2] === -1
      ))
    ))

  }

  addMoveToBoard(move: number[][], p: number): number[][] {
    const [cellA, cellB] = move.find(([a1, a2]) => this.board[a1][a2] === -1)
    this.board[cellA][cellB] = p
    return this.board
  }

  // Find a row with length-1 moves of player p and one empty spot
  tryToComplete(p: number): number[][] {
    return this.possibleLines.find(row => {
      let cntPlayer = 0
      let cntEmpty = 0
      row.forEach(([a1, a2]) => {
        if (this.board[a1][a2] === p) {
          cntPlayer++
        } else if (this.board[a1][a2] === -1) {
          cntEmpty = 1
        }
      })
      return (cntPlayer + cntEmpty) === row.length
    })
  }

  weightLine(row: number[][], p: number): number {
    let weight = 0
    row.forEach(([a1, a2]) => {
      if (this.board[a1][a2] === p) {
        weight++
      } else if (this.board[a1][a2] !== -1 && this.board[a1][a2] !== p) {
        weight -= 2
      }
    })
    return weight
  }

  /**
   * Reduce the list of possible lines and weight them
   * - sum the number of avl. moves, if player B has stones on this line give it a negative value
   * - sort by number of moves desc
   * == After that ==
   * - for each possible line:
   *   - for each possible position:
   *     - pretend that move and calcPossibleMoves with it
   * 
   * FIXME: We also need to:
   * - find lines where we need to block B and choose a position that helps us score
   */
  weightPossibleMoves(p: number): number[][] {
    const weightedLines = this.possibleLines.map(row => {
      return {
        weight: this.weightLine(row, p),
        row: row
      }
    })
    weightedLines.sort((a, b) => b.weight - a.weight)
    console.log("sorted array: ", weightedLines)
    return weightedLines.shift().row
  }

  public makeAMove(): [number[][], GameState] {
  
    let move = this.tryToComplete(this.player)
    if (move) {
      console.log("found win move", move)
      this.board = this.addMoveToBoard(move, this.player)
      return [this.board, this.player === 0 ? GameState.PlayerOneVictory : GameState.PlayerTwoVictory]
    }
    
    move = this.tryToComplete(this.otherPlayer)
    if (move) {
      console.log("found block move")
      this.board = this.addMoveToBoard(move, this.player)
      return [this.board, this.otherPlayer === 0 ? GameState.PlayerOneVictory : GameState.PlayerTwoVictory]
    }
    
    move = this.weightPossibleMoves(this.player)
    console.log("found move", move)
    this.board = this.addMoveToBoard(move, this.player)
    return [this.board, GameState.Playing]
    
  }
}

const ResetButton = (props) => (
  <button 
    className={"btn red darken-1 waves-effect waves-light " + props.className} 
    onClick={props.resetFn}
  >
    <span>
      <i className="fas fa-search left"></i> Reset
    </span>
  </button>
)

interface StartProps {
  className?: string
  startGame: ButtonEventCallback,
  restartGame: ButtonEventCallback,
  gameState: GameState
}

const StartButton: React.SFC<StartProps> = ({className, gameState, startGame, restartGame}) => {
  // const stateCls = gameState !== GameState.NotStarted ? "disabled" : ""
  if (gameState === GameState.NotStarted) {
    return (
      <button 
        className={"btn light-blue darken-1 waves-effect waves-light right "} 
        onClick={startGame}
      >Start
      </button>
    )
  } else {
    return (
      <button
        className={"btn light-blue darken-1 waves-effect waves-light right "}
        onClick={restartGame}
      >Restart
      </button>
    )
  }
}

class TicTacToe extends React.Component<any, State> {

  private lines: number[][][]

  constructor(props: any) {
    super(props)
    this.state = this.initialState()

    this.lines = [
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ]
  }

  initPlayers(): PlayerState[] {
    return [
      {
        marker: PlayerMarker.X
      },
      {
        marker: PlayerMarker.O
      },
    ]
  }

  initGameBoard(): number[][] {
    return [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1]
    ]
  }

  initialState(): State {
    return {
      playAgainstComputer: true,
      whoIsNext: 0,
      players: this.initPlayers(),
      board: this.initGameBoard(),
      gameState: GameState.NotStarted
    }
  }

  resetGame = () => {
    this.setState(this.initialState())
  }

  startGame = () => {
    this.setState({gameState: GameState.Playing})
  }

  restartGame = () => {
    this.setState({
      whoIsNext: 0,
      gameState: GameState.Playing,
      board: this.initGameBoard()
    })
  }

  oppositeMarker = (marker: PlayerMarker) => (
    marker === PlayerMarker.X ? PlayerMarker.O : PlayerMarker.X
  )

  togglePlayerOneMarker = (e: any) => {
    const players = this.state.players.map((p, i) => {
      p.marker = this.oppositeMarker(p.marker)
      return p
    })
    this.setState({players: players})
    e.preventDefault()
  }

  togglePlayAgainstComputer = (e: any) => {
    this.setState({playAgainstComputer: !this.state.playAgainstComputer})
    e.preventDefault()
  }

  /**
   * If consecutive line of X or O that player has won
   * If not and all fields filled, its a Draw
   */
  calcGameState = (board: number[][]): GameState => {
    let state = GameState.Playing

    for (let i = 0; i < this.lines.length; i++) {
      const [[a1, a2], [b1, b2], [c1, c2]] = this.lines[i]
      if (board[a1][a2] > -1 && board[a1][a2] === board[b1][b2] && board[a1][a2] === board[c1][c2]) {
        if (board[a1][a2] === 0) {
          state = GameState.PlayerOneVictory
        } else {
          state = GameState.PlayerTwoVictory
        }
        return state
      }
    }

    if (board.every(row => row.every(cell => cell > -1))) {
      state = GameState.Draw
    }
    return state
  }

  makeMove = (rowIdx: number, colIdx: number) => (e: any) => {
    let b = this.state.board.map((row, ri) => (
      row.map((cell, ci) => {
        if (ri === rowIdx && ci === colIdx) {
          cell = this.state.whoIsNext
        }
        return cell
      })
    ))
    let state = this.calcGameState(b)
    let whoIsNext = (this.state.whoIsNext + 1) % 2
    if (this.state.playAgainstComputer && state === GameState.Playing) {
      const solver = new ComputerSolver(this.lines, b, whoIsNext)
      const x = solver.makeAMove()
      b = x[0]
      state = x[1]
      
      // [b, state] = this.computerMakesMove(b, whoIsNext)
      state = this.calcGameState(b)
      whoIsNext = (whoIsNext + 1) % 2
    }
    this.setState({
      gameState: state,
      whoIsNext: whoIsNext,
      board: b,
    })
  }

  gameBoard = () => (
    <div className="game-board">
    {
      this.state.board.map((row, ridx) => (
        row.map((cell, cidx) => {
          if ((cell === -1) && this.state.gameState === GameState.Playing) {
            return (
              <div key={`k-${ridx}-${cidx}`} className="game-cell">
                <button 
                  type="button" 
                  className="game-cell-content btn-flat"
                  onClick={this.makeMove(ridx, cidx)}
                >&nbsp;
                </button>
              </div>
            )
          } else {
            return (
              <div key={`k-${ridx}-${cidx}`} className="game-cell">
                <span className="game-cell-content">{
                  cell === -1 ? "" : this.state.players[cell].marker.toString()
                }</span>
              </div>
            )
          }
        })
      ))
    }
    </div>
  )

  render() {
    return (
      <div id="outer-container">
        <div className="align-middle">
          <div className="card-container">
            <div className="card blue-grey darken-1 z-depth-4">
              <div className="card-content white-text">
                <span className="card-title center-align">Tic Tac Toe</span>

                <div className="game-grid-container">
                  {this.gameBoard()}
                </div>

              </div>
              <div className="card-action">
                <div className="game-state center-align">
                  {this.state.gameState}
                  {
                    this.state.gameState === GameState.Playing ?
                      `: Player ${this.state.players[this.state.whoIsNext].marker}`
                    :
                    ""
                  } 
                </div>
              </div>
              <div className="card-action">
                <div>
                  <label className="game-setting">Player One is:&nbsp;
                    {this.state.players[0].marker.toString()}&nbsp;
                    { this.state.gameState === GameState.NotStarted ?
                      <span>(
                        <button 
                          type="button" 
                          className="game-btn" 
                          onClick={this.togglePlayerOneMarker}
                        >
                          Change to&nbsp; {this.oppositeMarker(this.state.players[0].marker)}
                        </button>)</span> :
                      ""
                    }
                  </label>
                </div>
                <div className="m-t-10">
                  <label className="game-setting">Player Two is:&nbsp; 
                    {this.state.playAgainstComputer ? "Android" : "Humanoid"}&nbsp;
                    {this.state.gameState === GameState.NotStarted ?
                      <span>(
                        <button 
                          type="button" 
                          className="game-btn" 
                          onClick={this.togglePlayAgainstComputer}
                        >Play against&nbsp; 
                          {this.state.playAgainstComputer ? "Human" : "Computer"}
                        </button>)</span> :
                      ""
                    }
                  </label>
                </div>
              </div>
              <div className="card-action">
                <ResetButton resetFn={this.resetGame} />
                <StartButton 
                  className="right m-l-20" 
                  startGame={this.startGame}
                  restartGame={this.restartGame}
                  gameState={this.state.gameState}
                />
              </div>
            </div>
            <p className="center-align">by <a href="http://www.agynamix.de" target="_blank">Torsten Uhlmann</a></p>
          </div>
        </div>
      </div >
    )
  }
}

ReactDOM.render(
  <TicTacToe />,
  document.getElementById("root") as HTMLElement
)
