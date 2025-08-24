document.addEventListener('DOMContentLoaded', () => {
    const NUM_PLAYERS = 4;
    const NUM_HOLES = 18;
    const LOCAL_STORAGE_KEY = 'golfOlympicScores';

    // メダルの点数定義
    const MEDAL_POINTS = {
        '': 0, // 未選択の場合
        '金': 4,
        '銀': 3,
        '銅': 2,
        '鉄': 1,
        'チップイン': 5
    };

    // DOM要素の取得
    const playerInputs = [];
    for (let i = 1; i <= NUM_PLAYERS; i++) {
        playerInputs.push(document.getElementById(`player${i}-name`));
    }
    const scoreTableBody = document.querySelector('#score-table tbody');
    const resultsTableBody = document.querySelector('#results-table tbody');
    const playerNameHeaders = document.querySelectorAll('.player-name-header');
    const resetButton = document.getElementById('reset-button');

    // 初期スコアデータ構造
    let scores = {
        playerNames: [],
        holeScores: Array(NUM_HOLES).fill(null).map(() => Array(NUM_PLAYERS).fill('')) // 各プレイヤーの各ホールのメダル種別
    };

    /**
     * LocalStorageからスコアデータをロードする
     */
    function loadScores() {
        const storedScores = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedScores) {
            scores = JSON.parse(storedScores);
            // プレイヤー名をUIに反映
            scores.playerNames.forEach((name, index) => {
                if (playerInputs[index]) {
                    playerInputs[index].value = name;
                }
            });
            // ホールスコアをUIに反映（後でgenerateScoreTableで処理）
        } else {
            // デフォルトのプレイヤー名を設定
            playerInputs.forEach((input, index) => {
                input.value = `プレイヤー${String.fromCharCode(65 + index)}`; // プレイヤーA, B, C, D
                scores.playerNames[index] = input.value;
            });
        }
    }

    /**
     * スコアデータをLocalStorageに保存する
     */
    function saveScores() {
        // 現在のプレイヤー名をscoresオブジェクトに反映
        scores.playerNames = playerInputs.map(input => input.value);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
    }

    /**
     * スコア入力テーブルを生成・更新する
     */
    function generateScoreTable() {
        scoreTableBody.innerHTML = ''; // 一度クリア

        // プレイヤー名ヘッダーを更新
        playerInputs.forEach((input, index) => {
            if (playerNameHeaders[index]) {
                playerNameHeaders[index].textContent = input.value || `プレイヤー${index + 1}`;
            }
        });

        for (let i = 0; i < NUM_HOLES; i++) {
            const row = scoreTableBody.insertRow();
            const holeCell = row.insertCell();
            holeCell.textContent = `ホール ${i + 1}`;

            for (let j = 0; j < NUM_PLAYERS; j++) {
                const cell = row.insertCell();
                const select = document.createElement('select');
                select.classList.add('medal-select');
                select.dataset.hole = i;
                select.dataset.player = j;

                // メダルオプションを追加
                const medalOptions = ['選択してください', 'チップイン', '金', '銀', '銅', '鉄'];
                medalOptions.forEach(medal => {
                    const option = document.createElement('option');
                    option.value = medal;
                    option.textContent = medal === '' ? '選択してください' : medal; // 空文字列の場合は「選択してください」を表示
                    select.appendChild(option);
                });

                // 保存されているメダル種別を反映
                select.value = scores.holeScores[i][j];

                // 変更イベントリスナーを設定
                select.addEventListener('change', (event) => {
                    const holeIndex = parseInt(event.target.dataset.hole);
                    const playerIndex = parseInt(event.target.dataset.player);
                    scores.holeScores[holeIndex][playerIndex] = event.target.value; // メダル種別を保存
                    saveScores(); // 変更があったら即座に保存
                    updateResults(); // 結果を更新
                });
                cell.appendChild(select);
            }
        }
    }

    /**
     * 結果（合計点数と差分）を計算して表示する
     */
    function updateResults() {
        resultsTableBody.innerHTML = ''; // 一度クリア

        const playerTotals = Array(NUM_PLAYERS).fill(0);

        // 各プレイヤーの合計点数を計算
        for (let i = 0; i < NUM_HOLES; i++) {
            for (let j = 0; j < NUM_PLAYERS; j++) {
                const medalType = scores.holeScores[i][j];
                playerTotals[j] += MEDAL_POINTS[medalType] || 0; // 点数を加算、未定義なら0
            }
        }

        // 最高点数を特定
        const maxScore = Math.max(...playerTotals);

        // 結果テーブルに表示
        playerInputs.forEach((input, index) => {
            const playerName = input.value || `プレイヤー${index + 1}`;
            const totalScore = playerTotals[index];
            const difference = totalScore - maxScore; // トップとの差分

            const row = resultsTableBody.insertRow();
            row.insertCell().textContent = playerName;
            row.insertCell().textContent = totalScore;

            const diffCell = row.insertCell();
            diffCell.textContent = difference > 0 ? `+${difference}` : difference;
            if (difference > 0) {
                diffCell.classList.add('positive-diff');
            } else if (difference < 0) {
                diffCell.classList.add('negative-diff');
            } else {
                diffCell.classList.add('zero-diff');
            }
        });
    }

    /**
     * 全てのスコアとプレイヤー名をリセットする
     */
    function resetScores() {
        if (confirm('全てのスコアとプレイヤー名をリセットしますか？この操作は元に戻せません。')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            // デフォルト値で初期化
            scores = {
                playerNames: [],
                holeScores: Array(NUM_HOLES).fill(null).map(() => Array(NUM_PLAYERS).fill(''))
            };
            // UIもリセット
            playerInputs.forEach((input, index) => {
                input.value = `プレイヤー${String.fromCharCode(65 + index)}`;
                scores.playerNames[index] = input.value;
            });
            generateScoreTable();
            updateResults();
        }
    }

    // イベントリスナーの登録
    playerInputs.forEach(input => {
        input.addEventListener('input', () => { // 入力時に即座に保存し、UIを更新
            saveScores();
            generateScoreTable(); // ヘッダーのプレイヤー名を更新するため
            updateResults();
        });
    });
    resetButton.addEventListener('click', resetScores);

    // ページの初期ロード時に実行
    loadScores();
    generateScoreTable(); // まずテーブルを生成してから
    updateResults();     // 結果を計算・表示
});