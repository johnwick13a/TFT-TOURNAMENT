// ========================================
// BỘ LƯU TRỮ GIẢI ĐẤU TFT
// ========================================

const STORAGE_KEY = "tft-tournament-state-v1";

export function saveTournamentData(data) {

    try {

        if (!window || !window.localStorage) {
            return false;
        }

        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "Không thể lưu dữ liệu giải đấu:",
            error
        );

        return false;

    }

}


export function loadTournamentData() {

    try {

        if (!window || !window.localStorage) {
            return null;
        }

        const savedData =
            window.localStorage.getItem(
                STORAGE_KEY
            );

        if (!savedData) {
            return null;
        }

        return JSON.parse(savedData);

    } catch (error) {

        console.error(
            "Không thể đọc dữ liệu giải đấu:",
            error
        );

        return null;

    }

}


export function clearTournamentData() {

    try {

        if (!window || !window.localStorage) {
            return false;
        }

        window.localStorage.removeItem(
            STORAGE_KEY
        );

        return true;

    } catch (error) {

        console.error(
            "Không thể reset dữ liệu giải đấu:",
            error
        );

        return false;

    }

}
