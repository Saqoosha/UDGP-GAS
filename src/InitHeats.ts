function generateHeats(pilots: string[], numChannels: number): string[][] {
    return HeatGenerator.generate(pilots, numChannels);
}

function InitHeats() {
    const sheets = SheetService.getInstance();
    const heatListSheet = sheets.getHeatListSheet();
    const pilotsSheet = sheets.getPilotsSheet();
    const tournamentSheet = sheets.getTournamentSheet();
    
    // Clear heat list sheet
    heatListSheet.getRange(2, 1, heatListSheet.getMaxRows(), 10).clearContent();
    heatListSheet.getRange(2, 1, heatListSheet.getMaxRows(), heatListSheet.getMaxColumns()).setBackground(null);

    // Get pilots
    const pilots = pilotsSheet
        .getRange("C2:C")
        .getValues()
        .filter((v) => v[0] !== "")
        .map((v) => v[0] as string);

    const numChannels = getNumChannels();
    const heats = generateHeats(pilots, numChannels);

    // Set channels to pilots sheet
    const flatHeats = heats.reduce((acc, heat) => {
        acc.push(...heat);
        return acc;
    }, []);
    
    const CHANNEL_NAMES = HeatGenerator.getChannelNames(numChannels);
    const channels = flatHeats
        .map((pilot, i) => (pilot ? CHANNEL_NAMES[i % numChannels] : null))
        .filter((v) => v !== null);
    pilotsSheet.getRange(2, 4, channels.length, 1).setValues(channels.map((channel) => [channel]));

    heatListSheet.getRange(1, SheetService.COLUMNS.HEAT_LIST.PILOTS_START, 1, 4).setValues([CHANNEL_NAMES]);

    // Set all heats to heat list sheet
    let row = 2;
    let heatNumber = 1;
    
    // Race 1
    for (let i = 1; i <= getNumRoundForRace1(); i++) {
        populateHeatSchedule(row, 1, i, heatNumber, heats.length, heats);
        row += heats.length + 1;
        heatNumber += heats.length;
    }
    
    // Race 2 - Double Elimination Tournament
    const tournamentHeatCells = findHeatCellInTournament();
    const heatCountForRace2 = tournamentHeatCells.length;
    populateHeatSchedule(row, 2, 0, heatNumber, heatCountForRace2);
    for (const cell of tournamentHeatCells) {
        setTournmentHeatRef(row++, cell);
    }
    row++;
    tournamentSheet.getRange("B6").setValue(heatNumber);

    heatListSheet
        .getRange(row - 1, 1, 1, heatListSheet.getMaxColumns())
        .setBackground(null)
        .clearContent();

    setHeatsPerRound(1, heats.length);
    setHeatsPerRound(2, heatCountForRace2);
    setValueForKey("num pilots", pilots.length);
}

function populateHeatSchedule(
    row: number,
    race: number,
    round: number,
    heatStart: number,
    numHeats: number,
    heats: string[][] | undefined = undefined,
) {
    const sheets = SheetService.getInstance();
    const heatListSheet = sheets.getHeatListSheet();
    const cols = SheetService.COLUMNS.HEAT_LIST;
    
    // Reset
    heatListSheet.getRange(row, 1, numHeats, 10).clearContent().setHorizontalAlignment("center");
    heatListSheet.getRange(row, 1, numHeats, heatListSheet.getMaxColumns()).setBackground(null);

    // Title
    heatListSheet.getRange(row, cols.RACE).setValue(round > 0 ? `Race ${race}-${round}` : `Race ${race}`);

    // Heat numbers
    heatListSheet.getRange(row, cols.HEAT_NUMBER, numHeats, 1)
        .setValues(new Array(numHeats).fill(0).map((_, i) => [i + heatStart]));

    // Time formulas
    if (heatStart === 1) {
        heatListSheet.getRange(row, cols.TIME).setValue("9:00:00");
        heatListSheet.getRange(row + 1, cols.TIME, numHeats - 1, 1)
            .setFormulaR1C1(SHEET_FORMULAS.TIME_INCREMENT);
    } else {
        heatListSheet.getRange(row, cols.TIME)
            .setFormulaR1C1(SHEET_FORMULAS.TIME_INCREMENT_WITH_INTERVAL);
        heatListSheet.getRange(row + 1, cols.TIME, numHeats - 1, 1)
            .setFormulaR1C1(SHEET_FORMULAS.TIME_INCREMENT);
    }
    
    // Duration formula
    heatListSheet.getRange(row, cols.DURATION, numHeats, 1)
        .setFormulaR1C1(SHEET_FORMULAS.DURATION_MINUTES);

    // Pilots
    if (heatStart === 1 && heats) {
        heatListSheet.getRange(row, cols.PILOTS_START, heats.length, heats[0].length).setValues(heats);
    }

    // Interval row
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
    const sheets = SheetService.getInstance();
    const heatListSheet = sheets.getHeatListSheet();
    const referenceSheetName = "Race 2 Tournament";
    const startColumn = "G"; // 数式を設定する開始列（この例では 'G' 列から開始）
    const numberOfColumns = 2; // 設定する数式の列数
    const formulas = [[]]; // 数式を格納する2次元配列を初期化

    // 参照するセルの列名と行番号を抽出
    const referenceColumn = referenceStartCell.match(/[A-Za-z]+/)[0];
    const referenceRow = Number.parseInt(referenceStartCell.match(/\d+/)[0], 10);

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

function getHeatList(): HeatAssignment[] {
    try {
        const sheets = SheetService.getInstance();
        const heatListSheet = sheets.getHeatListSheet();
        const range = heatListSheet.getRange("A2:I");
        const values = range.getValues();
        let previousRace = "";
        
        const data = values
            .filter(([_, heat]) => heat && !Number.isNaN(heat))
            .map((row) => {
                const race = row[0] ? row[0].toString() : previousRace;
                const heat = row[1].toString();
                const pilots = row.slice(6).map((pilot) => pilot.toString());
                if (row[0]) previousRace = race;
                return { round: race, heat, pilots };
            });
            
        console.log(data);
        return data;
    } catch (error) {
        console.error("Error fetching heat list: ", error);
        return [];
    }
}

function findHeatCellInTournament(): string[] {
    const sheets = SheetService.getInstance();
    const tournamentSheet = sheets.getTournamentSheet();
    const tournamentRange = tournamentSheet.getDataRange();
    const displayValues = tournamentRange.getDisplayValues();
    const fontWeights = tournamentRange.getFontWeights();
    const matches: { address: string; number: number }[] = [];

    for (let row = 0; row < displayValues.length; row++) {
        for (let col = 0; col < displayValues[row].length; col++) {
            const value = displayValues[row][col].toString().trim();
            const isBold = fontWeights[row][col] === "bold";
            if (value.startsWith("Heat ") && isBold) {
                const num = Number.parseInt(value.replace("Heat ", ""), 10);
                if (!Number.isNaN(num)) {
                    const columnLetter = String.fromCharCode(65 + col + 2);
                    matches.push({
                        address: `${columnLetter}${row + 2}`,
                        number: num,
                    });
                }
            }
        }
    }

    matches.sort((a, b) => a.number - b.number);
    console.log("All matches:", matches);
    return matches.map((m) => m.address);
}