// ========================================
// APP - TFT TOURNAMENT
// ========================================

import {
    initializePlayers,
    getPlayers,
    renamePlayer
} from "./players.js";

import {
    initializeRounds,
    getRounds,
    setPlacement,
    clearPlacement,
    getPlacement
} from "./rounds.js";

import {
    getRanking,
    getPlayerTotalScore
} from "./ranking.js";

import {
    findChampion,
    getQualificationRound
} from "./championship.js";

import {
    getScoreFromPlacement
} from "./scoring.js";

import {
    saveTournamentData,
    loadTournamentData,
    clearTournamentData
} from "./storage.js";

import {
    TOURNAMENT_CONFIG
} from "../data/config.js";

import {
    deleteSharedTournament,
    disableCloudSharing,
    getCloudUser,
    getSharedTournamentOwnerId,
    getSharedTournamentUrl,
    isCloudSharingEnabled,
    publishTournament,
    signInCloudUser,
    signOutCloudUser,
    subscribeToTournament,
    unsubscribeFromTournament
} from "./cloud.js";

let savedTournamentData = null;
const isSharedViewer =
    new URLSearchParams(window.location.search).get("view") === "1";


// ========================================
// KHỞI TẠO GIẢI ĐẤU
// ========================================

function restoreTournamentState(savedData) {

    if (!savedData) {
        return false;
    }

    const playerCount =
        Array.isArray(savedData.players)
            ? savedData.players.length
            : TOURNAMENT_CONFIG.playerCount;

    initializePlayers(playerCount);

    if (Array.isArray(savedData.players)) {
        savedData.players.forEach(player => {
            if (player && player.id) {
                renamePlayer(
                    Number(player.id),
                    player.name || `Player ${player.id}`
                );
            }
        });
    }

    const roundCount =
        Array.isArray(savedData.rounds)
            ? savedData.rounds.length
            : TOURNAMENT_CONFIG.roundCount;

    initializeRounds(roundCount);

    if (Array.isArray(savedData.rounds)) {
        savedData.rounds.forEach(round => {
            if (!round || !round.placements) {
                return;
            }

            Object.entries(round.placements).forEach(([playerId, placement]) => {
                const numericPlayerId = Number(playerId);
                const numericPlacement = Number(placement);

                if (
                    Number.isInteger(numericPlayerId)
                    && Number.isInteger(numericPlacement)
                ) {
                    setPlacement(
                        round.id,
                        numericPlayerId,
                        numericPlacement
                    );
                }
            });
        });
    }

    return true;
}

function initializeTournament(
    playerCount = TOURNAMENT_CONFIG.playerCount
) {

    savedTournamentData =
        loadTournamentData();

    initializePlayers(
        playerCount
    );

    initializeRounds(
        TOURNAMENT_CONFIG.roundCount
    );

    console.log(
        "TFT Tournament đã khởi động!"
    );

}


// ========================================
// TẠO DỮ LIỆU ĐỂ LƯU
// ========================================

function createTournamentData() {

    return {
        players: getPlayers(),
        rounds: getRounds()
    };

}


// ========================================
// LƯU GIẢI ĐẤU
// ========================================

function saveData() {

    const data =
        createTournamentData();

    const success =
        saveTournamentData(
            data
        );

    if (!success) {
        console.error(
            "Không thể lưu giải đấu."
        );
        return false;
    }

    savedTournamentData = data;
    renderStartMenuLeaderboard();

    if (
        !isSharedViewer
        && isCloudSharingEnabled()
    ) {
        publishTournament(data)
            .then(() => {
                setOnlineSharingStatus(
                    "BXH đã được cập nhật trực tuyến.",
                    "success"
                );
            })
            .catch(error => {
                console.error(
                    "Không thể đồng bộ giải đấu lên Supabase:",
                    error
                );
                setOnlineSharingStatus(
                    `Không đồng bộ được: ${error.message}`,
                    "error"
                );
            });
    }

    return true;

}


// ========================================
// RESET GIẢI ĐẤU
// ========================================

async function resetTournamentData() {

    const confirmed =
        window.confirm(
            "Bạn có chắc muốn reset toàn bộ dữ liệu giải đấu?"
        );

    if (!confirmed) {
        return;
    }

    if (isCloudSharingEnabled()) {
        try {
            await deleteSharedTournament();
        } catch (error) {
            console.error(
                "Không thể dừng chia sẻ BXH:",
                error
            );
            alert(
                `Không thể reset BXH trực tuyến: ${error.message}`
            );
            return;
        }
    } else {
        disableCloudSharing();
    }

    if (!clearTournamentData()) {
        alert("Không thể xóa dữ liệu đã lưu.");
        return;
    }

    savedTournamentData = null;
    renderStartMenuLeaderboard();

    const continueButton =
        document.getElementById(
            "continue-tournament-button"
        );

    if (continueButton) {
        continueButton.hidden = true;
    }

    initializePlayers(
        TOURNAMENT_CONFIG.playerCount
    );

    initializeRounds(
        TOURNAMENT_CONFIG.roundCount
    );

    renderPlayerNameInputs();
    renderAll();

    alert("Đã reset giải đấu.");

}


// ========================================
// HIỂN THỊ NGƯỜI CHƠI
// ========================================

function renderPlayers() {

    const playersList =
        document.getElementById(
            "players-list"
        );

    if (!playersList) {
        return;
    }

    const players =
        getPlayers();

    playersList.innerHTML = "";

    players.forEach(player => {

        const playerElement =
            document.createElement("div");

        playerElement.className =
            "player-card";

        playerElement.textContent =
            player.name;

        playersList.appendChild(
            playerElement
        );

    });

}


// ========================================
// HIỂN THỊ TỔNG ĐIỂM
// ========================================

function renderTotalScores() {

    const scoreBoard =
        document.getElementById(
            "total-score-board"
        );

    if (!scoreBoard) {
        return;
    }

    const players =
        getPlayers();

    scoreBoard.innerHTML = "";

    players.forEach(player => {

        const total =
            getPlayerTotalScore(
                player.id
            );

        const playerBox =
            document.createElement("div");

        playerBox.className =
            "total-score-player";

        const name =
            document.createElement("span");

        name.textContent =
            player.name;

        const score =
            document.createElement("strong");

        score.textContent =
            `${total} điểm`;

        playerBox.appendChild(
            name
        );

        playerBox.appendChild(
            score
        );

        scoreBoard.appendChild(
            playerBox
        );

    });

}


// ========================================
// HIỂN THỊ BẢNG XẾP HẠNG
// ========================================

function renderRanking() {

    const rankingBoard =
        document.getElementById(
            "ranking-board"
        );

    if (!rankingBoard) {
        return;
    }

    const ranking =
        getRanking();

    rankingBoard.innerHTML = "";

    const table =
        document.createElement("table");

    table.className =
        "ranking-table";


    // --------------------------------
    // HEADER
    // --------------------------------

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    const rankHeader =
        document.createElement("th");

    rankHeader.textContent =
        "#";

    const nameHeader =
        document.createElement("th");

    nameHeader.textContent =
        "Người chơi";

    const scoreHeader =
        document.createElement("th");

    scoreHeader.textContent =
        "Điểm";

    headerRow.appendChild(
        rankHeader
    );

    headerRow.appendChild(
        nameHeader
    );

    headerRow.appendChild(
        scoreHeader
    );

    thead.appendChild(
        headerRow
    );

    table.appendChild(
        thead
    );


    // --------------------------------
    // BODY
    // --------------------------------

    const tbody =
        document.createElement("tbody");

    ranking.forEach(player => {

        const row =
            document.createElement("tr");

        const rankCell =
            document.createElement("td");

        rankCell.textContent =
            player.rank;

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            player.playerName;

        const scoreCell =
            document.createElement("td");

        scoreCell.textContent =
            player.totalScore;

        row.appendChild(
            rankCell
        );

        row.appendChild(
            nameCell
        );

        row.appendChild(
            scoreCell
        );

        tbody.appendChild(
            row
        );

    });

    table.appendChild(
        tbody
    );

    rankingBoard.appendChild(
        table
    );

}


// ========================================
// HIỂN THỊ ROUND
// ========================================

function renderRounds() {

    const scoreBoard =
        document.getElementById(
            "score-board"
        );

    if (!scoreBoard) {
        return;
    }

    const players =
        getPlayers();

    const rounds =
        getRounds();

    scoreBoard.innerHTML = "";


    rounds.forEach(round => {

        const roundElement =
            document.createElement("div");

        roundElement.className =
            "round-card";


        // --------------------------------
        // TÊN ROUND
        // --------------------------------

        const roundTitle =
            document.createElement("h3");

        roundTitle.textContent =
            round.name;

        roundElement.appendChild(
            roundTitle
        );


        // --------------------------------
        // NGƯỜI CHƠI
        // --------------------------------

        players.forEach(player => {

            const playerRow =
                document.createElement("div");

            playerRow.className =
                "player-row";


            // ----------------------------
            // TÊN
            // ----------------------------

            const playerName =
                document.createElement("span");

            playerName.textContent =
                player.name;


            // ----------------------------
            // KHU VỰC NHẬP
            // ----------------------------

            const placementArea =
                document.createElement("div");

            placementArea.className =
                "placement-area";


            // ----------------------------
            // Ô TOP
            // ----------------------------

            const placementInput =
                document.createElement("input");

            placementInput.type =
                "number";

            placementInput.min =
                1;

            placementInput.max =
                8;

            placementInput.step =
                1;

            placementInput.disabled =
                isSharedViewer;

            placementInput.placeholder =
                "Top";


            const oldPlacement =
                getPlacement(
                    round.id,
                    player.id
                );


            if (
                oldPlacement !== null
            ) {

                placementInput.value =
                    oldPlacement;

            }


            // ----------------------------
            // HIỂN THỊ ĐIỂM
            // ----------------------------

            const scoreDisplay =
                document.createElement("span");

            scoreDisplay.className =
                "placement-score";


            updatePlacementScore(
                scoreDisplay,
                oldPlacement
            );


            // ----------------------------
            // SỰ KIỆN NHẬP TOP
            // ----------------------------

            placementInput.addEventListener(
                "change",
                () => {

                    handlePlacementChange(
                        round.id,
                        player.id,
                        placementInput.value
                    );

                }
            );


            placementArea.appendChild(
                placementInput
            );

            placementArea.appendChild(
                scoreDisplay
            );


            playerRow.appendChild(
                playerName
            );

            playerRow.appendChild(
                placementArea
            );


            roundElement.appendChild(
                playerRow
            );

        });


        scoreBoard.appendChild(
            roundElement
        );

    });

}


// ========================================
// CẬP NHẬT ĐIỂM BÊN CẠNH TOP
// ========================================

function updatePlacementScore(
    scoreElement,
    placement
) {

    if (
        placement === null
        || placement === ""
        || placement === undefined
    ) {

        scoreElement.textContent =
            "— điểm";

        scoreElement.classList.remove(
            "has-score"
        );

        return;

    }


    const top =
        Number(placement);


    if (
        !Number.isInteger(top)
        || top < 1
        || top > 8
    ) {

        scoreElement.textContent =
            "— điểm";

        scoreElement.classList.remove(
            "has-score"
        );

        return;

    }


    const score =
        getScoreFromPlacement(
            top
        );


    scoreElement.textContent =
        `+${score} điểm`;

    scoreElement.classList.add(
        "has-score"
    );

}


// ========================================
// KIỂM TRA TOP ĐÃ ĐƯỢC SỬ DỤNG
// ========================================

function isPlacementAlreadyUsed(
    roundId,
    playerId,
    placement
) {

    const players =
        getPlayers();


    for (const player of players) {

        if (
            player.id === playerId
        ) {

            continue;

        }


        const existingPlacement =
            getPlacement(
                roundId,
                player.id
            );


        if (
            existingPlacement === placement
        ) {

            return true;

        }

    }


    return false;

}


// ========================================
// XỬ LÝ NHẬP TOP
// ========================================

function handlePlacementChange(
    roundId,
    playerId,
    placement
) {

    if (isSharedViewer) {
        return;
    }

    if (
        placement === ""
    ) {
        if (clearPlacement(roundId, playerId)) {
            saveData();
            renderAll();
        }
        return;

    }


    const top =
        Number(placement);


    // --------------------------------
    // KIỂM TRA TOP
    // --------------------------------

    if (
        !Number.isInteger(top)
        || top < 1
        || top > 8
    ) {

        alert(
            "Top phải là số nguyên từ 1 đến 8."
        );

        renderRounds();

        return;

    }


    // --------------------------------
    // KIỂM TRA TRÙNG TOP
    // --------------------------------

    if (
        isPlacementAlreadyUsed(
            roundId,
            playerId,
            top
        )
    ) {

        alert(
            `Top ${top} đã được sử dụng trong Round này.`
        );

        renderRounds();

        return;

    }


    // --------------------------------
    // LƯU TOP
    // --------------------------------

    const success =
        setPlacement(
            roundId,
            playerId,
            top
        );


    if (!success) {

        alert(
            "Không thể lưu kết quả."
        );

        return;

    }

    saveData();


    // --------------------------------
    // CẬP NHẬT TOÀN BỘ
    // --------------------------------

    renderAll();

}


// ========================================
// HIỂN THỊ TRẠNG THÁI VÔ ĐỊCH
// ========================================

function renderChampionship() {

    const championshipStatus =
        document.getElementById(
            "championship-status"
        );

    const topStatus =
        document.getElementById(
            "championship-top-status"
        );

    const topPlayer =
        document.getElementById(
            "championship-top-player"
        );

    const champion =
        findChampion();


    // --------------------------------
    // ĐÃ CÓ VÔ ĐỊCH
    // --------------------------------

    if (champion) {

        if (championshipStatus) {

            championshipStatus.textContent =
                `🏆 ${champion.playerName} `
                + `đã vô địch tại Round `
                + `${champion.roundId}!`;

        }


        if (topStatus) {

            topStatus.textContent =
                "ĐÃ CÓ NHÀ VÔ ĐỊCH";

        }


        if (topPlayer) {

            topPlayer.textContent =
                `🏆 ${champion.playerName}`;

        }


        return;

    }


    // --------------------------------
    // CHƯA CÓ VÔ ĐỊCH
    // --------------------------------

    if (championshipStatus) {

        championshipStatus.textContent =
            "Chưa có người vô địch.";

    }


    if (topStatus) {

        topStatus.textContent =
            "Đang thi đấu";

    }


    if (topPlayer) {

        topPlayer.textContent =
            "Chưa có nhà vô địch";

    }


    // --------------------------------
    // TÌM NGƯỜI ĐỦ ĐIỀU KIỆN
    // --------------------------------

    const players =
        getPlayers();


    for (const player of players) {

        const qualificationRound =
            getQualificationRound(
                player.id
            );


        if (
            qualificationRound !== null
        ) {

            if (topStatus) {

                topStatus.textContent =
                    "ĐÃ CÓ NGƯỜI ĐỦ ĐIỀU KIỆN";

            }


            if (topPlayer) {

                topPlayer.textContent =
                    `⚡ ${player.name} `
                    + `đã đủ 20 điểm`;

            }


            break;

        }

    }

}


// ========================================
// TẠO Ô NHẬP TÊN
// ========================================

function renderPlayerNameInputs() {

    const container =
        document.getElementById(
            "player-name-inputs"
        );

    const playerCountSelect =
        document.getElementById(
            "player-count"
        );


    if (
        !container
        || !playerCountSelect
    ) {

        return;

    }


    const playerCount =
        Number(
            playerCountSelect.value
        );

    const players = getPlayers();

    container.innerHTML = "";


    for (
        let i = 1;
        i <= playerCount;
        i++
    ) {

        const input =
            document.createElement("input");


        input.type =
            "text";


        input.className =
            "player-name-input";


        input.placeholder =
            `Tên người chơi ${i}`;

        const savedPlayer =
            players.find(
                player =>
                    player.id === i
            );

        input.value =
            savedPlayer
                ? savedPlayer.name
                : `Player ${i}`;


        input.dataset.playerId =
            i;


        container.appendChild(
            input
        );

    }

}

function renderStartMenuPlayerInputs() {

    const container =
        document.getElementById(
            "menu-player-name-inputs"
        );

    const playerCountSelect =
        document.getElementById(
            "menu-player-count"
        );

    if (!container || !playerCountSelect) {
        return;
    }

    const currentNames = new Map(
        Array.from(
            container.querySelectorAll(".start-menu-player-name")
        ).map(input => [
            Number(input.dataset.playerId),
            input.value
        ])
    );

    const playerCount =
        Number(playerCountSelect.value);

    container.innerHTML = "";

    for (let playerId = 1; playerId <= playerCount; playerId++) {
        const input =
            document.createElement("input");

        input.type = "text";
        input.className = "start-menu-player-name";
        input.placeholder = `Người chơi ${playerId}`;
        input.setAttribute(
            "aria-label",
            `Tên người chơi ${playerId}`
        );
        input.dataset.playerId = String(playerId);
        input.value =
            currentNames.get(playerId)
            || getPlayers().find(player => player.id === playerId)?.name
            || `Player ${playerId}`;

        container.appendChild(input);
    }

}


function renderStartMenuLeaderboard() {

    const status =
        document.getElementById(
            "start-menu-leaderboard-status"
        );

    const content =
        document.getElementById(
            "start-menu-leaderboard-content"
        );

    if (!status || !content) {
        return;
    }

    const players =
        savedTournamentData?.players;

    const rounds =
        savedTournamentData?.rounds;

    if (
        !Array.isArray(players)
        || players.length === 0
        || !Array.isArray(rounds)
    ) {
        status.textContent =
            "Chưa có giải đang diễn ra";
        status.classList.remove("is-live");
        content.innerHTML = "";

        const emptyState =
            document.createElement("p");

        emptyState.className = "leaderboard-empty";
        emptyState.textContent =
            "Bắt đầu giải đấu để xem thứ hạng người chơi tại đây.";
        content.appendChild(emptyState);

        return;
    }

    status.textContent =
        `ĐANG DIỄN RA · ${rounds.length} trận`;
    status.classList.add("is-live");

    const ranking =
        players
            .filter(player => player && Number.isInteger(Number(player.id)))
            .map((player, originalIndex) => {
                let totalScore = 0;
                let playedRounds = 0;

                rounds.forEach(round => {
                    const placement =
                        Number(round?.placements?.[player.id]);

                    if (
                        Number.isInteger(placement)
                        && placement >= 1
                        && placement <= 8
                    ) {
                        totalScore +=
                            TOURNAMENT_CONFIG.scoring[placement] || 0;
                        playedRounds += 1;
                    }
                });

                return {
                    name: String(player.name || `Player ${player.id}`),
                    totalScore,
                    playedRounds,
                    originalIndex
                };
            })
            .sort((left, right) => {
                return right.totalScore - left.totalScore
                    || left.originalIndex - right.originalIndex;
            });

    const table =
        document.createElement("table");

    table.className = "start-menu-leaderboard-table";

    const tableHead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    ["#", "Người chơi", "Trận", "Điểm"].forEach(label => {
        const header =
            document.createElement("th");

        header.scope = "col";
        header.textContent = label;
        headerRow.appendChild(header);
    });

    tableHead.appendChild(headerRow);
    table.appendChild(tableHead);

    const tableBody =
        document.createElement("tbody");

    ranking.forEach((player, index) => {
        const row =
            document.createElement("tr");

        [
            String(index + 1),
            player.name,
            `${player.playedRounds}/${rounds.length}`,
            String(player.totalScore)
        ].forEach(value => {
            const cell =
                document.createElement("td");

            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    table.appendChild(tableBody);
    content.replaceChildren(table);

}


function setOnlineSharingStatus(message, type = "") {

    const status =
        document.getElementById(
            "online-sharing-status"
        );

    if (!status) {
        return;
    }

    status.textContent = message;
    status.classList.remove("is-success", "is-error");

    if (type === "success") {
        status.classList.add("is-success");
    } else if (type === "error") {
        status.classList.add("is-error");
    }

}


function setSharedViewerStatus(message, isLive = false) {

    const banner =
        document.getElementById(
            "shared-viewer-banner"
        );

    const status =
        document.getElementById(
            "shared-viewer-status"
        );

    if (!banner || !status) {
        return;
    }

    banner.hidden = false;
    status.textContent = message;
    banner.classList.toggle("is-live", isLive);

}


function renderViewerDashboard(data) {

    const dashboard =
        document.getElementById("viewer-dashboard");

    const rankingContent =
        document.getElementById("viewer-ranking-content");

    const resultsContent =
        document.getElementById("viewer-results-content");

    if (!dashboard || !rankingContent || !resultsContent) {
        return;
    }

    dashboard.hidden = false;

    const players =
        Array.isArray(data?.players)
            ? data.players
            : [];

    const rounds =
        Array.isArray(data?.rounds)
            ? data.rounds
            : [];

    if (players.length === 0) {
        rankingContent.replaceChildren();
        resultsContent.replaceChildren();

        const emptyState =
            document.createElement("p");
        emptyState.className = "viewer-empty-state";
        emptyState.textContent =
            "Chưa có BXH được chia sẻ. Hãy quay lại sau khi quản lý bắt đầu giải.";
        rankingContent.appendChild(emptyState);
        resultsContent.appendChild(emptyState.cloneNode(true));
        return;
    }

    const playerStats =
        players.map((player, originalIndex) => {
            let totalScore = 0;

            rounds.forEach(round => {
                const placement =
                    Number(round?.placements?.[player.id]);

                if (
                    Number.isInteger(placement)
                    && placement >= 1
                    && placement <= 8
                ) {
                    totalScore +=
                        TOURNAMENT_CONFIG.scoring[placement] || 0;
                }
            });

            return {
                player,
                originalIndex,
                totalScore
            };
        }).sort((left, right) => {
            return right.totalScore - left.totalScore
                || left.originalIndex - right.originalIndex;
        });

    const tableWrap =
        document.createElement("div");
    tableWrap.className = "viewer-ranking-table-wrap";

    const table =
        document.createElement("table");
    table.className = "viewer-ranking-table";

    const tableHead =
        document.createElement("thead");
    const headerRow =
        document.createElement("tr");

    ["Hạng", "Người chơi", "Điểm"].forEach(label => {
        const cell =
            document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        headerRow.appendChild(cell);
    });

    tableHead.appendChild(headerRow);
    table.appendChild(tableHead);

    const tableBody =
        document.createElement("tbody");

    playerStats.forEach((stats, index) => {
        const row =
            document.createElement("tr");

        const rankCell =
            document.createElement("td");
        const rankBadge =
            document.createElement("span");
        rankBadge.className = "viewer-rank-badge";
        if (index < 3) {
            rankBadge.classList.add(
                ["is-first", "is-second", "is-third"][index]
            );
        }
        rankBadge.textContent = String(index + 1);
        rankCell.appendChild(rankBadge);

        const nameCell =
            document.createElement("td");
        nameCell.className = "viewer-player-name";
        nameCell.textContent =
            String(stats.player.name || `Player ${stats.player.id}`);

        const scoreCell =
            document.createElement("td");
        scoreCell.className = "viewer-score-value";
        scoreCell.textContent = String(stats.totalScore);

        row.append(rankCell, nameCell, scoreCell);
        tableBody.appendChild(row);
    });

    table.appendChild(tableBody);
    tableWrap.appendChild(table);
    rankingContent.replaceChildren(tableWrap);

    const resultCards = [];

    playerStats.forEach(stats => {
        const card =
            document.createElement("article");
        card.className = "viewer-player-results";

        const cardHeader =
            document.createElement("div");
        cardHeader.className = "viewer-player-results-header";

        const name =
            document.createElement("strong");
        name.textContent =
            String(stats.player.name || `Player ${stats.player.id}`);

        const total =
            document.createElement("span");
        total.textContent = `${stats.totalScore} điểm`;
        cardHeader.append(name, total);

        const roundsList =
            document.createElement("div");
        roundsList.className = "viewer-round-results";

        rounds.forEach(round => {
            const placement =
                Number(round?.placements?.[stats.player.id]);
            const played =
                Number.isInteger(placement)
                && placement >= 1
                && placement <= 8;

            const roundResult =
                document.createElement("div");
            roundResult.className = "viewer-round-result";
            roundResult.title =
                `${String(round.name || `Vòng ${round.id}`)}: ${played ? `Top ${placement}` : "chưa đấu"}`;

            const roundName =
                document.createElement("span");
            roundName.className = "viewer-round-name";
            roundName.textContent =
                String(round.name || `Vòng ${round.id}`);

            const placementText =
                document.createElement("span");
            placementText.className = "viewer-round-placement";
            if (played) {
                placementText.classList.add(`placement-${placement}`);
                placementText.setAttribute(
                    "aria-label",
                    `${roundName.textContent}: Top ${placement}`
                );
            } else {
                placementText.classList.add("is-unplayed");
                placementText.setAttribute(
                    "aria-label",
                    `${roundName.textContent}: chưa đấu`
                );
            }
            placementText.textContent =
                played ? String(placement) : "—";

            roundResult.append(roundName, placementText);
            roundsList.appendChild(roundResult);
        });

        card.append(cardHeader, roundsList);
        resultCards.push(card);
    });

    resultsContent.replaceChildren(...resultCards);

}


function updateOnlineSharingControls(user) {

    const loginButton =
        document.getElementById(
            "online-login-button"
        );

    const logoutButton =
        document.getElementById(
            "online-logout-button"
        );

    const shareButton =
        document.getElementById(
            "online-enable-sharing-button"
        );

    const copyButton =
        document.getElementById(
            "online-copy-share-link-button"
        );

    if (loginButton) {
        loginButton.hidden = Boolean(user);
    }

    if (logoutButton) {
        logoutButton.hidden = !user;
    }

    if (shareButton) {
        shareButton.hidden = !user;
        shareButton.textContent =
            isCloudSharingEnabled()
                ? "🔄 Đồng bộ BXH ngay"
                : "📡 Bật BXH trực tiếp";
    }

    if (copyButton) {
        copyButton.hidden =
            !user || !isCloudSharingEnabled();
    }

}


async function connectOwnerToSharedTournament() {

    await subscribeToTournament(
        data => {
            if (!data) {
                return;
            }

            if (restoreTournamentState(data)) {
                savedTournamentData = data;
                saveTournamentData(data);
                renderAll();

                const continueButton =
                    document.getElementById(
                        "continue-tournament-button"
                    );

                if (continueButton) {
                    continueButton.hidden = false;
                }
            }
        },
        status => {
            if (status === "SUBSCRIBED") {
                setOnlineSharingStatus(
                    "Đã kết nối BXH trực tiếp.",
                    "success"
                );
            } else if (
                status === "CHANNEL_ERROR"
                || status === "TIMED_OUT"
            ) {
                setOnlineSharingStatus(
                    "Mất kết nối realtime, đang thử kết nối lại.",
                    "error"
                );
            }
        }
    );

}


async function setupOnlineSharing() {

    const loginButton =
        document.getElementById(
            "online-login-button"
        );

    const logoutButton =
        document.getElementById(
            "online-logout-button"
        );

    const shareButton =
        document.getElementById(
            "online-enable-sharing-button"
        );

    const copyButton =
        document.getElementById(
            "online-copy-share-link-button"
        );

    if (loginButton) {
        loginButton.addEventListener("click", async () => {
            const email =
                document.getElementById(
                    "online-owner-email"
                ).value.trim();

            const password =
                document.getElementById(
                    "online-owner-password"
                ).value;

            if (!email || !password) {
                setOnlineSharingStatus(
                    "Nhập email và mật khẩu quản lý.",
                    "error"
                );
                return;
            }

            loginButton.disabled = true;
            setOnlineSharingStatus("Đang đăng nhập…");

            try {
                const user =
                    await signInCloudUser(email, password);

                updateOnlineSharingControls(user);
                setOnlineSharingStatus(
                    `Đã đăng nhập: ${user.email}`,
                    "success"
                );

                if (isCloudSharingEnabled()) {
                    try {
                        await connectOwnerToSharedTournament();
                    } catch (error) {
                        console.error(
                            "Không thể kết nối BXH trực tuyến:",
                            error
                        );
                        setOnlineSharingStatus(
                            `Đã đăng nhập nhưng BXH chưa kết nối: ${error.message}`,
                            "error"
                        );
                    }
                }
            } catch (error) {
                console.error("Đăng nhập Supabase thất bại:", error);
                setOnlineSharingStatus(
                    `Đăng nhập thất bại: ${error.message}`,
                    "error"
                );
            } finally {
                loginButton.disabled = false;
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await signOutCloudUser();
                updateOnlineSharingControls(null);
                setOnlineSharingStatus(
                    "Đã đăng xuất. BXH đã phát vẫn được bạn bè xem.",
                    "success"
                );
            } catch (error) {
                console.error("Đăng xuất Supabase thất bại:", error);
                setOnlineSharingStatus(
                    `Đăng xuất thất bại: ${error.message}`,
                    "error"
                );
            }
        });
    }

    if (shareButton) {
        shareButton.addEventListener("click", async () => {
            shareButton.disabled = true;
            setOnlineSharingStatus("Đang phát BXH lên mạng…");

            try {
                const user = await getCloudUser();

                if (!user) {
                    setOnlineSharingStatus(
                        "Hãy đăng nhập tài khoản quản lý trước.",
                        "error"
                    );
                    return;
                }

                await publishTournament(createTournamentData());
                updateOnlineSharingControls(user);
                setOnlineSharingStatus(
                    "Đã bật BXH trực tiếp. Kết quả sẽ tự đồng bộ.",
                    "success"
                );
            } catch (error) {
                console.error("Không thể bật BXH trực tuyến:", error);
                setOnlineSharingStatus(
                    `Không thể phát BXH: ${error.message}`,
                    "error"
                );
            } finally {
                shareButton.disabled = false;
            }
        });
    }

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(
                    getSharedTournamentUrl()
                );
                setOnlineSharingStatus(
                    "Đã sao chép link xem BXH.",
                    "success"
                );
            } catch (error) {
                console.error("Không thể sao chép link:", error);
                setOnlineSharingStatus(
                    "Không sao chép được link. Hãy mở link ?view=1 và sao chép thủ công.",
                    "error"
                );
            }
        });
    }

    try {
        const user = await getCloudUser();
        updateOnlineSharingControls(user);

        if (user && isCloudSharingEnabled()) {
            setOnlineSharingStatus(
                `Đang phát BXH bằng tài khoản ${user.email}.`,
                "success"
            );

            try {
                await connectOwnerToSharedTournament();
            } catch (error) {
                console.error(
                    "Không thể kết nối BXH trực tuyến:",
                    error
                );
                setOnlineSharingStatus(
                    `Không kết nối được BXH: ${error.message}`,
                    "error"
                );
            }
        }
    } catch (error) {
        updateOnlineSharingControls(null);
        console.error(
            "Không thể khởi tạo kết nối Supabase:",
            error
        );
        setOnlineSharingStatus(
            "Chưa kết nối được Supabase. Kiểm tra data/config.js và ONLINE_SETUP.md.",
            "error"
        );
    }

}


async function setupSharedViewer() {

    document.body.classList.add("shared-viewer");
    document.getElementById("access-portal").hidden = true;
    document.querySelector("header p").textContent =
        "BXH trực tiếp · Chế độ chỉ xem";
    initializePlayers(TOURNAMENT_CONFIG.playerCount);
    initializeRounds(TOURNAMENT_CONFIG.roundCount);
    renderAll();

    const loginOverlay =
        document.getElementById("viewer-login-overlay");

    const loginForm =
        document.getElementById("viewer-login-form");

    const loginButton =
        document.getElementById("viewer-login-button");

    const dashboardLogoutButton =
        document.getElementById("viewer-dashboard-logout-button");

    const loginStatus =
        document.getElementById("viewer-login-status");

    if (loginOverlay) {
        loginOverlay.hidden = false;
    }

    if (loginStatus) {
        loginStatus.textContent = "Đang kiểm tra phiên đăng nhập…";
    }

    const connectViewer = async () => {
        if (loginOverlay) {
            loginOverlay.hidden = true;
        }

        setSharedViewerStatus("Đang kết nối BXH trực tiếp…");

        try {
            await subscribeToTournament(
                data => {
                    if (!data) {
                        savedTournamentData = null;
                        initializePlayers(TOURNAMENT_CONFIG.playerCount);
                        initializeRounds(TOURNAMENT_CONFIG.roundCount);
                        renderAll();
                        renderViewerDashboard(null);
                        setSharedViewerStatus(
                            "BXH này đã được chủ giải reset hoặc ngừng chia sẻ."
                        );
                        return;
                    }

                    if (!restoreTournamentState(data)) {
                        setSharedViewerStatus(
                            "Dữ liệu giải đấu trực tuyến không hợp lệ."
                        );
                        return;
                    }

                    savedTournamentData = data;
                    saveTournamentData(data);
                    renderAll();
                    renderViewerDashboard(data);
                },
                status => {
                    if (status === "SUBSCRIBED") {
                        setSharedViewerStatus(
                            "BXH đang cập nhật trực tiếp",
                            true
                        );
                    } else if (
                        status === "CHANNEL_ERROR"
                        || status === "TIMED_OUT"
                    ) {
                        setSharedViewerStatus(
                            "Mất kết nối trực tiếp. Đang thử kết nối lại…"
                        );
                    }
                }
            );
        } catch (error) {
            console.error("Không thể tải BXH trực tuyến:", error);
            setSharedViewerStatus(
                `Không tải được BXH: ${error.message}`
            );
            renderViewerDashboard(null);
        }
    };

    if (loginForm) {
        loginForm.addEventListener("submit", async event => {
            event.preventDefault();

            const email =
                document.getElementById("viewer-email").value.trim();

            const password =
                document.getElementById("viewer-password").value;

            loginButton.disabled = true;
            loginStatus.textContent = "Đang đăng nhập…";
            loginStatus.classList.remove("is-error");

            try {
                const user =
                    await signInCloudUser(email, password);

                loginStatus.textContent = "";

                if (user.app_metadata?.role === "manager") {
                    window.location.href = "index.html";
                    return;
                }

                await connectViewer();
            } catch (error) {
                console.error("Đăng nhập tài khoản xem thất bại:", error);
                loginStatus.textContent =
                    `Đăng nhập thất bại: ${error.message}`;
                loginStatus.classList.add("is-error");
            } finally {
                loginButton.disabled = false;
            }
        });
    }

    if (dashboardLogoutButton) {
        const logoutViewer = async () => {
            dashboardLogoutButton.disabled = true;
            try {
                await unsubscribeFromTournament();
                await signOutCloudUser();
                window.location.href = "index.html";
            } catch (error) {
                console.error("Đăng xuất tài khoản xem thất bại:", error);
                setSharedViewerStatus(
                    `Không thể đăng xuất: ${error.message}`
                );
            } finally {
                dashboardLogoutButton.disabled = false;
            }
        };

        dashboardLogoutButton.addEventListener("click", logoutViewer);
    }

    try {
        const user = await getCloudUser();

        if (user) {
            if (user.app_metadata?.role === "manager") {
                window.location.replace("index.html");
            } else {
                await connectViewer();
            }
        } else if (loginOverlay) {
            loginOverlay.hidden = false;
            document.getElementById("viewer-email")?.focus();
        }
    } catch (error) {
        console.error("Không thể kiểm tra phiên đăng nhập:", error);
        if (loginOverlay) {
            loginOverlay.hidden = false;
        }
        if (loginStatus) {
            loginStatus.textContent =
                `Không kiểm tra được đăng nhập: ${error.message}`;
            loginStatus.classList.add("is-error");
        }
    }

}


async function validateManagerAccount(user) {

    if (user.app_metadata?.role !== "manager") {
        throw new Error(
            "Tài khoản này chưa được cấp quyền quản lý. Hãy dùng tài khoản quản lý giải."
        );
    }

    const ownerId =
        await getSharedTournamentOwnerId();

    if (ownerId && ownerId !== user.id) {
        throw new Error(
            "Tài khoản này không phải chủ sở hữu BXH."
        );
    }

}


function isConfiguredManagerAccount(user) {

    const username =
        String(user.email || "").split("@")[0].toLowerCase();

    return username === "phuoc";

}


function initializeManagerApp(portal) {

    document.body.classList.remove("manager-locked");

    if (portal) {
        portal.hidden = true;
    }

    initializeTournament();
    setupStartMenu();
    setupSettingsMenu();
    setupOnlineSharing();
    renderPlayerNameInputs();
    renderAll();

}


async function setupAccessPortal() {

    document.body.classList.add("manager-locked");

    const portal =
        document.getElementById("access-portal");
    portal.hidden = false;

    const form =
        document.getElementById("access-login-form");

    const emailInput =
        document.getElementById("access-email");

    const passwordInput =
        document.getElementById("access-password");

    const loginButton =
        document.getElementById("access-login-button");

    const status =
        document.getElementById("access-login-status");

    document.getElementById("manager-logout-button")
        .addEventListener("click", async () => {
            try {
                await unsubscribeFromTournament();
                await signOutCloudUser();
                window.location.href = "index.html";
            } catch (error) {
                console.error("Đăng xuất quản lý thất bại:", error);
                alert(`Không thể đăng xuất: ${error.message}`);
            }
        });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        loginButton.disabled = true;
        status.textContent = "Đang xác thực tài khoản…";
        status.classList.remove("is-error");

        try {
            const user =
                await signInCloudUser(
                    emailInput.value.trim(),
                    passwordInput.value
                );

            status.textContent = "";

            if (user.app_metadata?.role === "manager") {
                await validateManagerAccount(user);
                initializeManagerApp(portal);
            } else if (isConfiguredManagerAccount(user)) {
                throw new Error(
                    "Tài khoản phuoc chưa được cấp role=manager trong Supabase. Hãy chạy câu lệnh cấp quyền trong ONLINE_SETUP.md, đăng xuất rồi đăng nhập lại."
                );
            } else {
                document.body.classList.remove("manager-locked");
                await setupSharedViewer();
            }
        } catch (error) {
            console.error("Đăng nhập thất bại:", error);
            status.textContent = error.message;
            status.classList.add("is-error");
            try {
                await signOutCloudUser();
            } catch (signOutError) {
                console.error(
                    "Không thể xóa phiên đăng nhập không hợp lệ:",
                    signOutError
                );
                status.textContent +=
                    " Không thể xóa phiên đăng nhập cũ; hãy đăng xuất thủ công.";
            }
        } finally {
            loginButton.disabled = false;
        }
    });

    try {
        const user = await getCloudUser();

        if (user) {
            if (
                user.app_metadata?.role !== "manager"
                && !isConfiguredManagerAccount(user)
            ) {
                document.body.classList.remove("manager-locked");
                await setupSharedViewer();
                return;
            }

            if (
                isSharedViewer
                && user.app_metadata?.role === "manager"
            ) {
                window.location.replace("index.html");
                return;
            }

            await validateManagerAccount(user);
            initializeManagerApp(portal);
        }
    } catch (error) {
        portal.hidden = false;
        status.textContent = error.message;
        status.classList.add("is-error");
    }

}


function hideStartMenu() {

    const menu =
        document.getElementById("start-menu");

    if (menu) {
        menu.hidden = true;
    }

}


function startTournamentFromStartMenu() {

    if (
        savedTournamentData
        && !window.confirm(
            "Đã có giải đấu được lưu. Bắt đầu giải mới sẽ thay thế dữ liệu cũ. Bạn có muốn tiếp tục?"
        )
    ) {
        return;
    }

    const playerCount =
        Number(
            document.getElementById("menu-player-count").value
        );

    const nameInputs =
        document.querySelectorAll(".start-menu-player-name");

    initializePlayers(playerCount);

    nameInputs.forEach(input => {
        renamePlayer(
            Number(input.dataset.playerId),
            input.value
        );
    });

    initializeRounds(TOURNAMENT_CONFIG.roundCount);
    renderAll();
    hideStartMenu();

    if (!saveData()) {
        alert("Không lưu được giải đấu. Hãy kiểm tra cài đặt lưu trữ của trình duyệt.");
    }

}


function continueSavedTournament() {

    if (!savedTournamentData) {
        return;
    }

    restoreTournamentState(savedTournamentData);
    renderAll();
    hideStartMenu();

}


function setupStartMenu() {

    const playerCountSelect =
        document.getElementById("menu-player-count");

    const startButton =
        document.getElementById("menu-start-button");

    const continueButton =
        document.getElementById("continue-tournament-button");

    if (playerCountSelect) {
        playerCountSelect.addEventListener(
            "change",
            renderStartMenuPlayerInputs
        );
    }

    if (startButton) {
        startButton.addEventListener(
            "click",
            startTournamentFromStartMenu
        );
    }

    if (continueButton) {
        continueButton.hidden = !savedTournamentData;
        continueButton.addEventListener(
            "click",
            continueSavedTournament
        );
    }

    renderStartMenuPlayerInputs();
    renderStartMenuLeaderboard();

}


// ========================================
// MỞ MENU CÀI ĐẶT
// ========================================

function openSettings() {

    const overlay =
        document.getElementById(
            "settings-overlay"
        );

    const playerCountSelect =
        document.getElementById(
            "player-count"
        );


    if (!overlay) {
        return;
    }

    if (playerCountSelect) {
        playerCountSelect.value =
            String(
                getPlayers().length ||
                TOURNAMENT_CONFIG.playerCount
            );
    }


    renderPlayerNameInputs();


    overlay.classList.add(
        "active"
    );

}


// ========================================
// ĐÓNG MENU
// ========================================

function closeSettings() {

    const overlay =
        document.getElementById(
            "settings-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "active"
    );

}


// ========================================
// BẮT ĐẦU GIẢI ĐẤU
// ========================================

function startTournamentFromSettings() {

    const playerCountSelect =
        document.getElementById(
            "player-count"
        );


    const nameInputs =
        document.querySelectorAll(
            ".player-name-input"
        );


    const playerCount =
        Number(
            playerCountSelect.value
        );


    initializePlayers(
        playerCount
    );


    nameInputs.forEach(
        input => {

            const playerId =
                Number(
                    input.dataset.playerId
                );


            renamePlayer(
                playerId,
                input.value
            );

        }
    );


    initializeRounds(
        TOURNAMENT_CONFIG.roundCount
    );


    const playerCountDisplay =
        document.getElementById(
            "player-count-display"
        );


    if (playerCountDisplay) {

        playerCountDisplay.textContent =
            playerCount;

    }


    closeSettings();

    saveData();


    renderAll();
}

// ========================================
// GẮN SỰ KIỆN MENU
// ========================================

function setupSettingsMenu() {

    const saveButton =
        document.getElementById(
            "save-tournament-button"
        );

    const resetButton =
        document.getElementById(
            "reset-tournament-button"
        );

    const openButton =
        document.getElementById(
            "open-settings-button"
        );


    const closeButton =
        document.getElementById(
            "close-settings-button"
        );


    const startButton =
        document.getElementById(
            "start-tournament-button"
        );


    const playerCountSelect =
        document.getElementById(
            "player-count"
        );


    if (saveButton) {
        saveButton.addEventListener(
            "click",
            () => {
                if (saveData()) {
                    alert("Đã lưu giải đấu.");
                }
            }
        );
    }

    if (resetButton) {
        resetButton.addEventListener(
            "click",
            resetTournamentData
        );
    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            openSettings
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSettings
        );

    }


    if (startButton) {

        startButton.addEventListener(
            "click",
            startTournamentFromSettings
        );

    }


    if (playerCountSelect) {

        playerCountSelect.addEventListener(
            "change",
            renderPlayerNameInputs
        );

    }

}


// ========================================
// HIỂN THỊ TOÀN BỘ APP
// ========================================

function renderAll() {

    renderPlayers();

    renderTotalScores();

    renderRanking();

    renderRounds();

    renderChampionship();

}


// ========================================
// KHỞI ĐỘNG
// ========================================

if (isSharedViewer) {
    setupSharedViewer();
} else {
    setupAccessPortal();
}