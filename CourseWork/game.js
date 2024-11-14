import {gameManager} from "./gameManager.js";

if (localStorage.getItem("leaderboard") === null) {
    localStorage.setItem("leaderboard", JSON.stringify([]))
}

const mainMenu = document.getElementById("main-menu")
const playButton = document.getElementById("play-button")
const playerNameField = document.getElementById("player-name")

let playerName
playButton.addEventListener("click", function() {
    if (playerNameField.value.length !== 0) {
        playerName = playerNameField.value
        startGame()
    }
})

playerNameField.addEventListener("keydown", function(event) {
    if (event.code === "Enter") {
        event.preventDefault();
        playButton.click();
    }
})

const gameOverScreen = document.getElementById("game-over-screen")
const gameOverTitle = document.getElementById("game-over-title")
const gameOverScore = document.getElementById("game-over-score")
const leaderboard = document.getElementById("leaderboard")
const tryAgainButton = document.getElementById("try-again-button")

tryAgainButton.addEventListener("click", function () {
    location.reload()
})

export const canvas = document.getElementById("game-canvas")
export const ctx = canvas.getContext("2d")
ctx.imageSmoothingEnabled = false

function startGame() {
    mainMenu.style.display = "none"
    canvas.style.display = "block"
    gameManager.play()
}

export function endGame() {
    canvas.style.display = "none"
    gameOverScreen.style.display = "block"

    let playerScore = gameManager.player.score

    gameOverScore.textContent = playerScore
    if (gameManager.player.isDead()) {
        gameOverTitle.textContent = "You died"
    } else {
        gameOverTitle.textContent = "You won"
    }

    let leaderboardArray = JSON.parse(localStorage.getItem("leaderboard"));

    let newPlayer = true;
    for (let i = 0; i < leaderboardArray.length; i++) {
        if (leaderboardArray[i].lbName === playerName) {
            leaderboardArray[i].lbScore = playerScore;
            newPlayer = false;
            break;
        }
    }

    if (newPlayer) {
        leaderboardArray.push({
            lbName: playerName,
            lbScore: playerScore
        })
    }

    leaderboardArray.sort((a, b) => {
        let aScore = parseInt(a.lbScore);
        let bScore = parseInt(b.lbScore);

        if (aScore === bScore) {
            return 0;
        } else {
            return aScore > bScore ? -1 : 1;
        }
    })

    localStorage.setItem("leaderboard", JSON.stringify(leaderboardArray));

    for (let i = 0; i < Math.min(leaderboardArray.length, 8); i++) {
        let row = leaderboard.tBodies[0].insertRow();
        row.insertCell().innerText = leaderboardArray[i].lbName;
        row.insertCell().innerText = leaderboardArray[i].lbScore;
    }
}
