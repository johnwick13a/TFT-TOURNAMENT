// ========================================
// HỆ THỐNG TÍNH ĐIỂM TFT
// ========================================

import { TOURNAMENT_CONFIG } from "../data/config.js";


// ----------------------------------------
// Lấy điểm dựa trên thứ hạng
// ----------------------------------------

export function getScoreFromPlacement(placement) {

    // Chuyển dữ liệu thành số
    const top = Number(placement);

    // Kiểm tra Top có hợp lệ không
    if (!Number.isInteger(top) || top < 1 || top > 8) {
        return 0;
    }

    // Lấy điểm từ config.js
    return TOURNAMENT_CONFIG.scoring[top];
}


// ----------------------------------------
// Kiểm tra thứ hạng có hợp lệ không
// ----------------------------------------

export function isValidPlacement(placement) {

    const top = Number(placement);

    return Number.isInteger(top) && top >= 1 && top <= 8;
}


// ----------------------------------------
// Lấy toàn bộ bảng điểm
// ----------------------------------------

export function getScoringTable() {

    return TOURNAMENT_CONFIG.scoring;
}