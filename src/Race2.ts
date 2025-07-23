function clearRace2RawResult() {
    const race2ResultSheet = App.getRace2ResultSheet();
    
    race2ResultSheet.getRange("A2:AK").clearContent();
    race2ResultSheet.getRange("G2:G").setValue(false);
    race2ResultSheet.getRange("H2:H").setValue(SHEET_FORMULAS.RESULT_LAPS);
}