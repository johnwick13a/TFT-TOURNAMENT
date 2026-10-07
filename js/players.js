// ========================================
// QUẢN LÝ NGƯỜI CHƠI
// ========================================

import {
    TOURNAMENT_CONFIG
} from "../data/config.js";


// ----------------------------------------
// Danh sách người chơi
// ----------------------------------------

let players = [];


// ----------------------------------------
// Tạo người chơi
// ----------------------------------------

export function initializePlayers(
    playerCount = TOURNAMENT_CONFIG.playerCount
) {

    players = [];


    for (
        let i = 0;
        i < playerCount;
        i++
    ) {

        players.push({

            id: i + 1,

            name: `Player ${i + 1}`

        });

    }

}


// ----------------------------------------
// Lấy danh sách người chơi
// ----------------------------------------

export function getPlayers() {

    return players;

}


// ----------------------------------------
// Lấy một người chơi
// ----------------------------------------

export function getPlayer(playerId) {

    return players.find(
        player =>
            player.id === playerId
    );

}


// ----------------------------------------
// Đổi tên người chơi
// ----------------------------------------

export function renamePlayer(
    playerId,
    newName
) {

    const player =
        getPlayer(playerId);


    if (!player) {

        return false;

    }


    player.name =
        newName.trim()
        || `Player ${playerId}`;


    return true;

}