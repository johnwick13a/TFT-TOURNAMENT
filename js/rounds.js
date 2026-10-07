// ========================================
// QUẢN LÝ ROUND
// ========================================

import { TOURNAMENT_CONFIG } from "../data/config.js";


// ----------------------------------------
// Danh sách các Round
// ----------------------------------------

let rounds = [];


// ----------------------------------------
// Tạo Round mới
// ----------------------------------------

export function addRound() {

    const roundNumber = rounds.length + 1;

    const round = {
        id: roundNumber,
        name: `Round ${roundNumber}`,
        placements: {}
    };

    rounds.push(round);

    return round;
}


// ----------------------------------------
// Khởi tạo giải đấu
// ----------------------------------------

export function initializeRounds(numberOfRounds = 6) {

    rounds = [];

    for (let i = 0; i < numberOfRounds; i++) {
        addRound();
    }

}


// ----------------------------------------
// Lấy toàn bộ Round
// ----------------------------------------

export function getRounds() {

    return rounds;
}


// ----------------------------------------
// Lấy một Round
// ----------------------------------------

export function getRound(roundId) {

    return rounds.find(round => round.id === roundId);
}


// ----------------------------------------
// Ghi Top của người chơi
// ----------------------------------------

export function setPlacement(roundId, playerId, placement) {

    const round = getRound(roundId);

    if (!round) {
        return false;
    }

    const top = Number(placement);

    if (!Number.isInteger(top) || top < 1 || top > 8) {
        return false;
    }

    round.placements[playerId] = top;

    return true;

}


// ----------------------------------------
// Xóa Top của một người chơi trong Round
// ----------------------------------------

export function clearPlacement(roundId, playerId) {

    const round = getRound(roundId);

    if (!round) {
        return false;
    }

    delete round.placements[playerId];

    return true;

}


// ----------------------------------------
// Lấy Top của người chơi
// ----------------------------------------

export function getPlacement(roundId, playerId) {

    const round = getRound(roundId);

    if (!round) {
        return null;
    }

    return round.placements[playerId] ?? null;
}


// ----------------------------------------
// Xóa kết quả của một Round
// ----------------------------------------

export function clearRound(roundId) {

    const round = getRound(roundId);

    if (!round) {
        return false;
    }

    round.placements = {};

    return true;
}


// ----------------------------------------
// Xóa toàn bộ Round
// ----------------------------------------

export function resetRounds() {

    rounds = [];

}