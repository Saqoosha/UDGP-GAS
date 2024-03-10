function clearRace2RawResult() {
    const sheet = race2ResultSheet;
    sheet.getRange("A2:AK").clearContent();
    sheet.getRange("G2:G").setValue(false);
    sheet.getRange("H2:H").setValue("=IF(G2=TRUE, E2-2, E2)");
}
