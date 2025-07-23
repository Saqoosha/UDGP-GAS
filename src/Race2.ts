function clearRace2RawResult() {
    const race2ResultSheet = App.getRace2ResultSheet();
    
    race2ResultSheet.getRange("A2:AK").clearContent();
    
    // Clear only horizontal borders (top and bottom), keep vertical borders
    race2ResultSheet.getRange("A2:AK").setBorder(false, null, false, null, null, false);
    
    race2ResultSheet.getRange("G2:G").setValue(false);
    race2ResultSheet.getRange("H2:H").setValue(SHEET_FORMULAS.RESULT_LAPS);
}