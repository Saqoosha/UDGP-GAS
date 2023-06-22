function InitHeats() {
    const pilotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("参加パイロット");
    const pilots = pilotsSheet.getRange("B2:B").getValues().filter((v) => v[0] !== "").map((v) => v[0] as string);

    // round 1 heat list
    const heats = pilots.reduce((acc, pilot, i) => {
        const index = Math.floor(i / 3);
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(pilot);
        return acc;
    }, [] as string[][]);
    const lastHeat = heats[heats.length - 1];
    switch (lastHeat.length) {
        case 1:
            lastHeat.unshift(heats[heats.length - 2].pop() as string);
            lastHeat.push("");
            heats[heats.length - 2].push("");
            break;
        case 2:
            lastHeat.push("");
            break;
    }

    // set channels to pilotsSheet from heat 1
    const flatHeats = heats.reduce((acc, heat) => {
        acc.push(...heat);
        return acc;
    }, []);
    const CHANNEL_NAMES = ["E1 5705", "F1 5740", "F4 5800"];
    const channels = flatHeats.map((pilot, i) => pilot ? CHANNEL_NAMES[i % 3] : null).filter((v) => v !== null);
    pilotsSheet.getRange(2, 3, channels.length, 1).setValues(channels.map((channel) => [channel]));

    // set all heats to dataSheet
    let row = 2;
    let heatNumber = 1;
    for (let i = 1; i <= 6; i++) {
        _setHeats(row, 1, i, heatNumber, heats.length, heats);
        row += heats.length + 1;
        heatNumber += heats.length;
    }
    const heatCountForRace2 = Math.floor(pilots.length / 2);
    for (let i = 1; i <= 3; i++) {
        _setHeats(row, 2, i, heatNumber, heatCountForRace2);
        row += heatCountForRace2 + 1;
        heatNumber += heatCountForRace2;
    }
}

function _setHeats(row: number, race: number, round: number, heatStart: number, numHeats: number, heats: string[][] | undefined = undefined) {
    // reset
    heatListSheet.getRange(row, 1, numHeats, 6).clearContent().setHorizontalAlignment("center");
    heatListSheet.getRange(row, 1, numHeats, heatListSheet.getMaxColumns()).setBackground(null);

    // title
    heatListSheet.getRange(row, 1).setValue(`Race ${race}-${round}`);

    // heat number
    heatListSheet.getRange(row, 2, numHeats, 1).setValues(new Array(numHeats).fill(0).map((_, i) => [i + heatStart]));

    // time
    if (heatStart == 1) {
        heatListSheet.getRange(row, 3).setValue("9:00:00");
        heatListSheet.getRange(row + 1, 3, numHeats - 1, 1).setFormulaR1C1("=R[-1]C[0]+time(0,R2C10,0)");
    } else {
        heatListSheet.getRange(row, 3).setFormulaR1C1("=R[-2]C[0]+time(0,R3C10,0)");
        heatListSheet.getRange(row + 1, 3, numHeats - 1, 1).setFormulaR1C1("=R[-1]C[0]+time(0,R2C10,0)");
    }

    // pilot
    if (heatStart == 1 && heats) {
        heatListSheet.getRange(row, 4, heats.length, 3).setValues(heats);
    }

    // interval
    row += numHeats;
    heatListSheet.getRange(row, 1, 1, heatListSheet.getMaxColumns()).setBackground("#d9d9d9").clearContent();
    heatListSheet.getRange(row, 1).setValue("組み合わせ発表＆チャンネル調整").setHorizontalAlignment("left");
}
