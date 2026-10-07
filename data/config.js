// ========================================
// CẤU HÌNH GIẢI ĐẤU TFT
// ========================================

export const TOURNAMENT_CONFIG = {

    // Số điểm cần đạt để đủ điều kiện tranh chức vô địch
    championshipPoints: 20,

    // Top cần đạt ở round tiếp theo để vô địch
    championshipPlacement: 1,

    // Số người chơi mặc định
    playerCount: 4,

    // Số Round
    roundCount: 6,

    // Cấu hình Supabase dùng chung cho bảng xếp hạng trực tuyến.
    // Điền Project URL và public anon key của dự án Supabase.
    supabaseUrl: "https://sjuptprkxazqwskgooyu.supabase.co",
    supabaseAnonKey: "sb_publishable_WzHZXqeM18O22gwMK6MpXQ_zTF2WkdZ",

    // Điểm theo thứ hạng
    scoring: {

        1: 8,
        2: 7,
        3: 6,
        4: 5,
        5: 4,
        6: 3,
        7: 2,
        8: 1

    }

};