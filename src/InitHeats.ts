function generateHeats(pilots: string[]): string[][] {
    const heats = pilots.reduce((acc, pilot, i) => {
        const index = Math.floor(i / 4);
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(pilot);
        return acc;
    }, [] as string[][]);
    const lastHeat = heats[heats.length - 1];
    switch (lastHeat.length) {
        case 1: // 最後のヒートが1人のときは、最後の3ヒートを3人ずつにする
            heats[heats.length - 2].unshift(heats[heats.length - 3].pop() as string);
            lastHeat.unshift(heats[heats.length - 2].pop() as string);
            lastHeat.unshift(heats[heats.length - 2].pop() as string);
            break;
        case 2: // 最後のヒートが2人のときは、前のヒートから1人を移動させて、3人・3人にする
            lastHeat.unshift(heats[heats.length - 2].pop() as string);
            lastHeat.push("");
            break;
        case 3:
            lastHeat.push("");
            break;
    }

    // ensure all heats have 4 columns
    for (let i = 0; i < heats.length; i++) {
        const heat = heats[i];
        while (heat.length < 4) {
            heat.push("");
        }
    }
    return heats;
}

function InitHeats() {
    // clear heatListSheet and clear background
    heatListSheet.getRange(2, 1, heatListSheet.getMaxRows(), 7).clearContent();
    heatListSheet.getRange(2, 1, heatListSheet.getMaxRows(), heatListSheet.getMaxColumns()).setBackground(null);

    const pilotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("参加パイロット");
    const pilots = pilotsSheet.getRange("C2:C").getValues().filter((v) => v[0] !== "").map((v) => v[0] as string);

    const heats = generateHeats(pilots);

    // set channels to pilotsSheet from heat 1
    const flatHeats = heats.reduce((acc, heat) => {
        acc.push(...heat);
        return acc;
    }, []);
    const CHANNEL_NAMES = ["R2 5695", "5720", "F3 5780", "A4 5805"];
    const channels = flatHeats.map((pilot, i) => pilot ? CHANNEL_NAMES[i % 4] : null).filter((v) => v !== null);
    pilotsSheet.getRange(2, 4, channels.length, 1).setValues(channels.map((channel) => [channel]));

    // set all heats to dataSheet
    let row = 2;
    let heatNumber = 1;
    for (let i = 1; i <= getNumRoundForRace1(); i++) {
        _setHeats(row, 1, i, heatNumber, heats.length, heats);
        row += heats.length + 1;
        heatNumber += heats.length;
    }
    const heatCountForRace2 = Math.floor(pilots.length / 3);
    for (let i = 1; i <= getNumRoundForRace2(); i++) {
        _setHeats(row, 2, i, heatNumber, heatCountForRace2);
        row += heatCountForRace2 + 1;
        heatNumber += heatCountForRace2;
    }

    setHeatsPerRound(1, heats.length);
    setHeatsPerRound(2, heatCountForRace2);
    setValueForKey("num pilots", pilots.length);
}

function _setHeats(row: number, race: number, round: number, heatStart: number, numHeats: number, heats: string[][] | undefined = undefined) {
    // reset
    heatListSheet.getRange(row, 1, numHeats, 7).clearContent().setHorizontalAlignment("center");
    heatListSheet.getRange(row, 1, numHeats, heatListSheet.getMaxColumns()).setBackground(null);

    // title
    heatListSheet.getRange(row, 1).setValue(`Race ${race}-${round}`);

    // heat number
    heatListSheet.getRange(row, 2, numHeats, 1).setValues(new Array(numHeats).fill(0).map((_, i) => [i + heatStart]));

    // time
    if (heatStart == 1) {
        heatListSheet.getRange(row, 3).setValue("9:00:00");
        heatListSheet.getRange(row + 1, 3, numHeats - 1, 1).setFormulaR1C1("=R[-1]C[0]+time(0,R2C11,0)");
    } else {
        heatListSheet.getRange(row, 3).setFormulaR1C1("=R[-2]C[0]+time(0,R3C11,0)");
        heatListSheet.getRange(row + 1, 3, numHeats - 1, 1).setFormulaR1C1("=R[-1]C[0]+time(0,R2C11,0)");
    }

    // pilot
    if (heatStart == 1 && heats) {
        heatListSheet.getRange(row, 4, heats.length, 4).setValues(heats);
    }

    // interval
    row += numHeats;
    heatListSheet.getRange(row, 1, 1, heatListSheet.getMaxColumns()).setBackground("#d9d9d9").clearContent();
    heatListSheet.getRange(row, 1).setValue("組み合わせ発表＆チャンネル調整").setHorizontalAlignment("left");
}
