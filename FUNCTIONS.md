# UDGP-GAS 関数一覧

## Main.ts - メインエントリーポイント

### グローバル変数
- `ss` - アクティブなスプレッドシート
- `pilotsSheet` - 参加パイロットシート
- `heatListSheet` - 組み合わせ/タイムスケジュールシート
- `race1ResultSheet` - Race 1結果シート
- `race2ResultSheet` - Race 2結果シート
- `tournamentSheet` - Race 2トーナメントシート
- `dataSheet` - データシート

### 関数

#### `findLastIndex<T>(arr: T[], predicate: (val: T) => boolean): number`
配列の最後から条件に合う要素のインデックスを検索

#### `onEdit(e: GoogleAppsScript.Events.SheetsOnEdit)`
シート編集時のイベントハンドラー。Race 1 Resultsシートが編集されたときに自動で結果を再計算

#### `doGet(e: GoogleAppsScript.Events.DoGet)`
HTTPのGETリクエストハンドラー。ヒートリストをJSON形式で返す

#### `doPost(e: GoogleAppsScript.Events.DoPost)`
HTTPのPOSTリクエストハンドラー。レース結果を受信して処理
- ログ記録
- ヒート開始時刻の設定
- レース結果の保存
- 現在のヒート番号の更新

#### `setHeatStartTime(heatNumber: number, timestamp: number)`
指定されたヒートの開始時刻を記録

#### `findRowIndexByHeatNumber(heatNumber: number): number`
ヒート番号から該当する行のインデックスを検索

#### `formatTimestampToTimeString(timestamp: number | string): string`
タイムスタンプをHH:MM:SS形式の文字列に変換

## InitHeats.ts - ヒート初期化

#### `generateHeats(pilots: string[], numChannels: number): string[][]`
パイロットを指定されたチャンネル数に応じてヒートに分配
- 3チャンネル: 最後のヒートが1人の場合は2人・2人に調整
- 4チャンネル: 最後のヒートが1-2人の場合は3人ずつに調整

#### `InitHeats()`
メイン初期化関数。全レースのヒートを生成
1. 既存のヒートリストをクリア
2. パイロットリストを取得
3. ヒートを生成
4. チャンネルを割り当て
5. Race 1の全ラウンドのヒートを設定
6. Race 2のトーナメントヒートを設定

#### `_setHeats(row: number, race: number, round: number, heatStart: number, numHeats: number, heats?: string[][])`
ヒートリストシートに指定されたレース/ラウンドのヒート情報を設定

#### `setTournmentHeatRef(startRow: number, referenceStartCell: string)`
トーナメントシートからヒートリストシートへの参照式を設定

#### `getHeatList()`
現在のヒートリストを取得してJSON形式で返す

#### `findHeatCellInTournament(): string[]`
トーナメントシート内の「Heat X」セルを検索して返す

## Race1.ts - Race 1処理

#### `findOrAddRow(sheet: Sheet, heatNumber: number, pilotName: string): [number, "found" | "added"]`
シートから指定されたヒート番号とパイロット名の行を検索、なければ追加
- B列（ヒート番号）とD列（パイロット名）で検索

#### `addOrUpdateResult(sheet: Sheet, roundNumber: number, heatNumber: number, startTimestamp: number, records: RaceRecord[])`
レース結果をシートに追加または更新
- A列: ラウンド番号
- B列: ヒート番号
- C列: レース開始時刻（日本時間）
- D列: パイロット名
- E列: 順位（position + 1）
- F列: ラップ数（laps.length - 1）
- G列: 総時間
- J列以降: 各ラップタイム

#### `calcRace1Result()`
Race 1の全結果を計算
- 各ラウンドの順位計算
- 次ラウンドのヒート割り当て
- 総合順位の計算

#### `calcRoundRank(roundIndex: number, roundRecords: {}, prevRoundRecords: RoundRecord[])`
指定されたラウンドの順位を計算
- ラップ数（降順）→タイム（昇順）でソート
- 最速ラップタイムも記録

#### `addPilotResultsForRace1(pilot: string, records: RoundRecord[])`
パイロットの全ラウンドの結果を集計

#### `setRace1NextRoundHeatsByFastest(nextRound: number, prevRoundResults: RoundRecord[])`
最速ラップタイム順で次ラウンドのヒートを設定（未使用）

#### `setRace1NextRoundHeatsByLaps(nextRound: number, prevRoundResults: RoundRecord[])`
前ラウンドの順位順で次ラウンドのヒートを設定

#### `setRace1Heats(round: number, pilots: string[])`
指定されたラウンドのヒートを設定

#### `clearRace1RawResult()`
Race 1の生データをクリア

#### `clearRace1RoundResult()`
Race 1のラウンド別結果をクリア

#### `clearRace1TotalResult()`
Race 1の総合結果をクリア

#### `clearRace1AllResults()`
Race 1の全結果をクリア

#### `createDummyRaceData(pilot: string, position: number)`
テスト用のダミーレースデータを生成

#### `sendDummyResult()`
現在のヒートのダミー結果を送信（テスト用）

## Race2.ts - Race 2処理

#### `clearRace2RawResult()`
Race 2の生データをクリア

## KVS.ts - キーバリューストレージ

#### `getValueForKey(key: string)`
データシートから指定されたキーの値を取得（キャッシュ付き）

#### `setValueForKey(key: string, value: string | number)`
データシートに指定されたキーと値を保存

### 設定値アクセス関数

#### `getNumChannels(): number`
使用チャンネル数を取得（デフォルト: 4）

#### `getNumRoundForRace1(): number`
Race 1のラウンド数を取得

#### `getNumRoundForRace2(): number`
Race 2のラウンド数を取得

#### `getHeatsPerRound(round: number): number`
指定されたラウンドのヒート数を取得

#### `setHeatsPerRound(round: number, num: number)`
指定されたラウンドのヒート数を設定

#### `getRaceMode(): string`
現在のレースモードを取得

#### `setRaceMode(mode: string)`
レースモードを設定

#### `getCurrentRound(): number`
現在のラウンド番号を取得

#### `setCurrentRound(num: number)`
現在のラウンド番号を設定

#### `incrementRound(): number`
ラウンド番号をインクリメントして返す

#### `getCurrentHeat(): number`
現在のヒート番号を取得

#### `setCurrentHeat(num: number)`
現在のヒート番号を設定

#### `incrementHeat(): number`
ヒート番号をインクリメントして返す

## データ型定義

### RaceRecord.ts
```typescript
type RaceRecord = {
    pilot: string;      // パイロット名
    position: number;   // 順位
    time: number;      // 総時間
    laps: number[];    // 各ラップタイム
}
```

### RoundRecord.ts
```typescript
class RoundRecord {
    round: number;          // ラウンド番号
    heat: number;           // ヒート番号
    datetime: string;       // 日時
    pilot: string;          // パイロット名
    position: number;       // 順位
    flightLaps: number;     // 飛行ラップ数
    time: number;          // 総時間
    penalty: boolean;       // ペナルティフラグ
    resultLaps: number;     // 結果ラップ数
    isValid: boolean;       // 有効フラグ
    fastestLapTime: number; // 最速ラップタイム
}
```