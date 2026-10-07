// ========================================
// XẾP HẠNG NGƯỜI CHƠI
// ========================================

import { getPlayers } from "./players.js";

import {
    getRounds,
    getPlacement
} from "./rounds.js";

import {
    getScoreFromPlacement
} from "./scoring.js";


// ----------------------------------------
// Tính tổng điểm của một người chơi
// ----------------------------------------

export function getPlayerTotalScore(playerId) {

    const rounds = getRounds();

    let totalScore = 0;

    rounds.forEach(round => {

        const placement = getPlacement(
            round.id,
            playerId
        );

        if (placement !== null) {

            const score = getScoreFromPlacement(
                placement
            );

            totalScore += score;
        }

    });

    return totalScore;
}


// ----------------------------------------
// Lấy bảng xếp hạng
// ----------------------------------------

export function getRanking() {

    const players = getPlayers();

    const ranking = players.map(player => {

        return {
            playerId: player.id,
            playerName: player.name,
            totalScore: getPlayerTotalScore(player.id)
        };

    });


    // Sắp xếp điểm cao xuống thấp
    ranking.sort((a, b) => {

        return b.totalScore - a.totalScore;

    });


    // Gán thứ hạng
    ranking.forEach((player, index) => {

        player.rank = index + 1;

    });


    return ranking;
}


// ----------------------------------------
// Lấy thứ hạng của một người
// ----------------------------------------

export function getPlayerRank(playerId) {

    const ranking = getRanking();

    const player = ranking.find(
        player => player.playerId === playerId
    );

    if (!player) {
        return null;
    }

    return player.rank;
}