function generateHeats(pilots: string[], numChannels: number): string[][] {
    const heats = pilots.reduce((acc, pilot, i) => {
        const index = Math.floor(i / numChannels);
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(pilot);
        return acc;
    }, [] as string[][]);
    const lastHeat = heats[heats.length - 1];
    switch (numChannels) {
        case 3:
            switch (lastHeat.length) {
                case 1: // 最後のヒートが1人のときは、前のヒートから1人を移動させて、2人・2人にする
                    lastHeat.unshift(heats[heats.length - 2].pop() as string);
                    break;
            }
            break;
        case 4:
            switch (lastHeat.length) {
                case 1: // 最後のヒートが1人のときは、最後の3ヒートを3人ずつにする
                    heats[heats.length - 2].unshift(heats[heats.length - 3].pop() as string);
                    lastHeat.unshift(heats[heats.length - 2].pop() as string);
                    lastHeat.unshift(heats[heats.length - 2].pop() as string);
                    break;
                case 2: // 最後のヒートが2人のときは、前のヒートから1人を移動させて、3人・3人にする
                    lastHeat.unshift(heats[heats.length - 2].pop() as string);
                    break;
            }
            break;
    }

    // ensure all heats have required columns
    for (let i = 0; i < heats.length; i++) {
        const heat = heats[i];
        while (heat.length < numChannels) {
            heat.push("");
        }
    }
    return heats;
}

function InitHeats() {
    // clear heatListSheet and clear background
    heatListSheet.getRange(2, 1, heatListSheet.getMaxRows(), 10).clearContent();
    heatListSheet.getRange(2, 1, heatListSheet.getMaxRows(), heatListSheet.getMaxColumns()).setBackground(null);

    const pilotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("参加パイロット");
    const pilots = pilotsSheet
        .getRange("C2:C")
        .getValues()
        .filter((v) => v[0] !== "")
        .map((v) => v[0] as string);

    const numChannels = getNumChannels();
    const heats = generateHeats(pilots, numChannels);

    // set channels to pilotsSheet from heat 1
    const flatHeats = heats.reduce((acc, heat) => {
        acc.push(...heat);
        return acc;
    }, []);
    const CHANNEL_NAMES =
        numChannels === 3 ? ["E1 5705", "F1 5740", "F4 5800", ""] : ["E1 5705", "B1 5733", "A5 5785", "A4 5805"];
    const channels = flatHeats
        .map((pilot, i) => (pilot ? CHANNEL_NAMES[i % numChannels] : null))
        .filter((v) => v !== null);
    pilotsSheet.getRange(2, 4, channels.length, 1).setValues(channels.map((channel) => [channel]));

    heatListSheet.getRange(1, 7, 1, 4).setValues([CHANNEL_NAMES]);

    // set all heats to dataSheet
    let row = 2;
    let heatNumber = 1;
    // Race 1
    for (let i = 1; i <= getNumRoundForRace1(); i++) {
        _setHeats(row, 1, i, heatNumber, heats.length, heats);
        row += heats.length + 1;
        heatNumber += heats.length;
    }
    // Race 2 - Double Elimination Tournament
    const tournamentHeatCells = [
        "D3",
        "D8",
        "D13",
        "D18",
        "D23",
        "D28",
        "D33",
        "D38",
        "D43",
        "D48",
        "I12",
        "I18",
        "I33",
        "I38",
        "I43",
        "N33",
        "N15",
    ];
    const heatCountForRace2 = tournamentHeatCells.length;
    _setHeats(row, 2, 0, heatNumber, heatCountForRace2);
    for (const cell of tournamentHeatCells) {
        setTournmentHeatRef(row++, cell);
    }
    row++;
    tournamentSheet.getRange("B2").setValue(heatNumber);

    heatListSheet
        .getRange(row - 1, 1, 1, heatListSheet.getMaxColumns())
        .setBackground(null)
        .clearContent();

    setHeatsPerRound(1, heats.length);
    setHeatsPerRound(2, heatCountForRace2);
    setValueForKey("num pilots", pilots.length);
}

function _setHeats(
    row: number,
    race: number,
    round: number,
    heatStart: number,
    numHeats: number,
    heats: string[][] | undefined = undefined,
) {
    // reset
    heatListSheet.getRange(row, 1, numHeats, 10).clearContent().setHorizontalAlignment("center");
    heatListSheet.getRange(row, 1, numHeats, heatListSheet.getMaxColumns()).setBackground(null);

    // title
    heatListSheet.getRange(row, 1).setValue(round > 0 ? `Race ${race}-${round}` : `Race ${race}`);

    // heat number
    heatListSheet.getRange(row, 2, numHeats, 1).setValues(new Array(numHeats).fill(0).map((_, i) => [i + heatStart]));

    // time
    if (heatStart === 1) {
        heatListSheet.getRange(row, 3).setValue("9:00:00");
        heatListSheet.getRange(row + 1, 3, numHeats - 1, 1).setFormulaR1C1("=R[-1]C[0]+time(0,R2C14,0)");
    } else {
        heatListSheet.getRange(row, 3).setFormulaR1C1("=R[-2]C[0]+time(0,R3C14,0)");
        heatListSheet.getRange(row + 1, 3, numHeats - 1, 1).setFormulaR1C1("=R[-1]C[0]+time(0,R2C14,0)");
    }
    heatListSheet.getRange(row, 6, numHeats, 1).setFormulaR1C1('=IF(ISBLANK(R[0]C[-1]), "", (R[0]C[-1]-R[0]C[-3])*1440)');

    // pilot
    if (heatStart === 1 && heats) {
        heatListSheet.getRange(row, 7, heats.length, heats[0].length).setValues(heats);
    }

    // interval
    const intervalRow = row + numHeats;
    heatListSheet.getRange(intervalRow, 1, 1, heatListSheet.getMaxColumns()).setBackground("#d9d9d9").clearContent();
    heatListSheet.getRange(intervalRow, 1).setValue("組み合わせ発表＆チャンネル調整").setHorizontalAlignment("left");
}

/**
 * 指定された範囲に対して、別のシートの特定の範囲からの値を参照する数式を設定する。
 *
 * @param {number} startRow - 数式を設定する開始行番号。
 * @param {string} referenceStartCell - 参照する開始セル（例: 'D3'）。
 */
function setTournmentHeatRef(startRow: number, referenceStartCell: string) {
    const referenceSheetName = "Race 2 Tournament";
    const startColumn = "G"; // 数式を設定する開始列（この例では 'G' 列から開始）
    const numberOfColumns = 4; // 設定する数式の列数
    const formulas = [[]]; // 数式を格納する2次元配列を初期化

    // 参照するセルの列名と行番号を抽出
    const referenceColumn = referenceStartCell.match(/[A-Za-z]+/)[0];
    const referenceRow = parseInt(referenceStartCell.match(/\d+/)[0], 10);

    // 数式を生成
    for (let i = 0; i < numberOfColumns; i++) {
        const currentCell = referenceColumn + (referenceRow + i); // 現在の参照セルを計算
        formulas[0].push(`='${referenceSheetName}'!${currentCell}`); // 数式を配列に追加
    }

    // 範囲を指定して数式を設定
    const range = heatListSheet.getRange(
        `${startColumn + startRow}:${String.fromCharCode(startColumn.charCodeAt(0) + numberOfColumns - 1)}${startRow}`,
    );
    range.setFormulas([formulas[0]]);
}
