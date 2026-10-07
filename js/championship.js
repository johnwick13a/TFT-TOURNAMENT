// ========================================
// HỆ THỐNG VÔ ĐỊCH TFT
// ========================================

import {
    TOURNAMENT_CONFIG
} from "../data/config.js";

import {
    getRounds,
    getPlacement
} from "./rounds.js";

import {
    getPlayers
} from "./players.js";

import {
    getScoreFromPlacement
} from "./scoring.js";


// ========================================
// TÍNH ĐIỂM TRƯỚC MỘT ROUND
// ========================================

function getScoreBeforeRound(
    playerId,
    roundId
) {

    const rounds =
        getRounds();

    let totalScore = 0;


    for (const round of rounds) {

        // Chỉ tính Round trước Round hiện tại
        if (round.id >= roundId) {
            continue;
        }


        const placement =
            getPlacement(
                round.id,
                playerId
            );


        if (placement === null) {
            continue;
        }


        const score =
            getScoreFromPlacement(
                placement
            );


        totalScore += score;

    }


    return totalScore;
}


// ========================================
// TÌM ROUND ĐẦU TIÊN ĐẠT 20 ĐIỂM
// ========================================

export function getQualificationRound(
    playerId
) {

    const rounds =
        getRounds();


    let totalScore = 0;


    for (const round of rounds) {

        const placement =
            getPlacement(
                round.id,
                playerId
            );


        if (placement === null) {
            continue;
        }


        const score =
            getScoreFromPlacement(
                placement
            );


        totalScore += score;


        // Đây là Round đầu tiên đạt 20
        if (
            totalScore >=
            TOURNAMENT_CONFIG.championshipPoints
        ) {

            return round.id;

        }

    }


    return null;
}


// ========================================
// KIỂM TRA CÓ ĐỦ ĐIỀU KIỆN Ở ROUND NÀY
// ========================================

export function isEligibleForChampionship(
    playerId,
    roundId
) {

    const qualificationRound =
        getQualificationRound(
            playerId
        );


    if (qualificationRound === null) {

        return false;

    }


    // Round đạt 20 không được tính.
    // Phải từ Round kế tiếp.
    return roundId >
        qualificationRound;
}


// ========================================
// KIỂM TRA VÔ ĐỊCH Ở MỘT ROUND
// ========================================

export function checkChampionship(
    playerId,
    roundId
) {

    const qualificationRound =
        getQualificationRound(
            playerId
        );


    // Chưa từng đạt 20
    if (qualificationRound === null) {

        return {
            champion: false,
            eligible: false,
            qualificationRound: null
        };

    }


    // Round đạt 20 chưa được tính
    if (
        roundId <= qualificationRound
    ) {

        return {
            champion: false,
            eligible: false,
            qualificationRound:
                qualificationRound
        };

    }


    // Lấy Top Round hiện tại
    const placement =
        getPlacement(
            roundId,
            playerId
        );


    // Chưa nhập Top
    if (placement === null) {

        return {
            champion: false,
            eligible: true,
            qualificationRound:
                qualificationRound
        };

    }


    // Kiểm tra Top 1
    if (
        placement ===
        TOURNAMENT_CONFIG.championshipPlacement
    ) {

        return {
            champion: true,
            eligible: true,
            qualificationRound:
                qualificationRound
        };

    }


    // Đủ điều kiện nhưng không Top 1
    return {
        champion: false,
        eligible: true,
        qualificationRound:
            qualificationRound
    };

}


// ========================================
// TÌM NHÀ VÔ ĐỊCH
// ========================================

export function findChampion() {

    const players =
        getPlayers();

    const rounds =
        getRounds();


    // Kiểm tra theo thứ tự Round
    for (const round of rounds) {

        for (const player of players) {

            const result =
                checkChampionship(
                    player.id,
                    round.id
                );


            if (result.champion) {

                return {

                    playerId:
                        player.id,

                    playerName:
                        player.name,

                    roundId:
                        round.id,

                    qualificationRound:
                        result.qualificationRound

                };

            }

        }

    }


    return null;
}


// ========================================
// LẤY TRẠNG THÁI CỦA TẤT CẢ NGƯỜI CHƠI
// ========================================

export function getChampionshipStatus() {

    const players =
        getPlayers();


    return players.map(player => {

        const qualificationRound =
            getQualificationRound(
                player.id
            );


        return {

            playerId:
                player.id,

            playerName:
                player.name,

            qualificationRound:
                qualificationRound,

            qualified:
                qualificationRound !== null

        };

    });

}