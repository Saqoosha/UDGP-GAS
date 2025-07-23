# UDGP-GAS 関数一覧

## アーキテクチャ改善

### 新しいサービスクラス

#### SheetService.ts - シートアクセスの一元化
- `getInstance()` - シングルトンインスタンスを取得
- `getPilotsSheet()` - 参加パイロットシートを取得
- `getHeatListSheet()` - 組み合わせ/タイムスケジュールシートを取得
- `getRace1ResultSheet()` - Race 1結果シートを取得
- `getRace2ResultSheet()` - Race 2結果シートを取得
- `getTournamentSheet()` - Race 2トーナメントシートを取得
- `getDataSheet()` - データシートを取得
- `getRace1RoundSheet()` - Race 1ラウンド別結果シートを取得
- `getRace1TotalSheet()` - Race 1総合結果シートを取得
- `getLogSheet()` - ログシートを取得

#### HeatGenerator.ts - ヒート生成ロジック
- `generate(pilots: string[], numChannels: number)` - ヒートを生成
- `getChannelNames(numChannels: number)` - チャンネル名を取得

#### RaceResultProcessor.ts - レース結果処理
- `processRoundResults(records: RoundRecord[])` - ラウンド結果を処理
- `calculateOverallRanking(pilotResults: Map<string, ProcessedResult[]>)` - 総合順位を計算

#### BatchUpdater.ts - バッチ更新処理
- `addValues(range, values)` - 値の更新を追加
- `addFormulas(range, formulas)` - 数式の更新を追加
- `addFormat(range, format)` - フォーマットの更新を追加
- `addClear(range, options)` - クリア操作を追加
- `execute()` - バッチ更新を実行

### 定数定義

#### Constants.ts
- `RACE_CONSTANTS` - レース関連の定数
- `CHANNEL_CONFIGS` - チャンネル設定
- `SHEET_FORMULAS` - シート数式
- `RaceMode` - レースモード列挙
- `ChannelConfig` - チャンネル設定列挙

#### DataModels.ts
- `RaceResult` - レース結果インターフェース
- `HeatAssignment` - ヒート割り当てインターフェース
- `RaceConfiguration` - レース設定インターフェース
- `ProcessedResult` - 処理済み結果インターフェース
- `PostData` - POSTデータインターフェース
- `ApiResponse` - APIレスポンスインターフェース

## Main.ts - メインエントリーポイント

### 関数

#### `findLastIndex<T>(arr: T[], predicate: (val: T) => boolean): number`
配列の最後から条件に合う要素のインデックスを検索

#### `onEdit(e: GoogleAppsScript.Events.SheetsOnEdit)`
シート編集時のイベントハンドラー。Race 1 Resultsシートが編集されたときに自動で結果を再計算

#### `doGet(e: GoogleAppsScript.Events.DoGet)`
HTTPのGETリクエストハンドラー。ヒートリストをJSON形式で返す

#### `doPost(e: GoogleAppsScript.Events.DoPost)`
HTTPのPOSTリクエストハンドラー。レース結果を受信して処理
- エラーハンドリングの改善
- 入力検証の追加
- 構造化されたレスポンス

#### `validateAndParsePostData(e: GoogleAppsScript.Events.DoPost): PostData`
POSTデータの検証と解析

#### `processRaceData(data: PostData): ApiResponse`
レースデータの処理

#### `createSuccessResponse(result: ApiResponse)`
成功レスポンスの生成

#### `createErrorResponse(error: string)`
エラーレスポンスの生成

#### `logRequest(e: GoogleAppsScript.Events.DoPost)`
リクエストのログ記録

#### `setHeatStartTime(heatNumber: number, timestamp: number)`
指定されたヒートの開始時刻を記録

#### `findRowIndexByHeatNumber(heatNumber: number): number`
ヒート番号から該当する行のインデックスを検索

#### `formatTimestampToTimeString(timestamp: number | string): string`
タイムスタンプをHH:MM:SS形式の文字列に変換

## InitHeats.ts - ヒート初期化

#### `generateHeats(pilots: string[], numChannels: number): string[][]`
HeatGeneratorを使用してヒートを生成

#### `InitHeats()`
メイン初期化関数。全レースのヒートを生成
1. 既存のヒートリストをクリア
2. パイロットリストを取得
3. ヒートを生成
4. チャンネルを割り当て
5. Race 1の全ラウンドのヒートを設定
6. Race 2のトーナメントヒートを設定

#### `populateHeatSchedule(row: number, race: number, round: number, heatStart: number, numHeats: number, heats?: string[][])`
ヒートリストシートに指定されたレース/ラウンドのヒート情報を設定（旧 _setHeats）

#### `setTournmentHeatRef(startRow: number, referenceStartCell: string)`
トーナメントシートからヒートリストシートへの参照式を設定

#### `getHeatList(): HeatAssignment[]`
現在のヒートリストを取得して返す

#### `findHeatCellInTournament(): string[]`
トーナメントシート内の「Heat X」セルを検索して返す

## Race1.ts - Race 1処理

#### `findOrAddRow(sheet: Sheet, heatNumber: number, pilotName: string): [number, "found" | "added"]`
シートから指定されたヒート番号とパイロット名の行を検索、なければ追加

#### `addOrUpdateResult(sheet: Sheet, roundNumber: number, heatNumber: number, startTimestamp: number, records: RaceRecord[])`
レース結果をシートに追加または更新（改善版）
- SheetService.COLUMNSを使用
- 定数を使用したフォーマット設定

#### `calcRace1Result()`
Race 1の全結果を計算（改善版）
- SheetServiceを使用
- 定数を使用したタイムアウト設定

#### `calcRoundRank(roundIndex: number, roundRecords: {}, prevRoundRecords: RoundRecord[])`
指定されたラウンドの順位を計算

#### `addPilotResultsForRace1(pilot: string, records: RoundRecord[])`
パイロットの全ラウンドの結果を集計

#### `setRace1NextRoundHeatsByFastest(nextRound: number, prevRoundResults: RoundRecord[])`
最速ラップタイム順で次ラウンドのヒートを設定（未使用）

#### `setRace1NextRoundHeatsByLaps(nextRound: number, prevRoundResults: RoundRecord[])`
前ラウンドの順位順で次ラウンドのヒートを設定

#### `setRace1Heats(round: number, pilots: string[])`
指定されたラウンドのヒートを設定（HeatGeneratorを使用）

#### `clearRace1RawResult()`
Race 1の生データをクリア（定数を使用）

#### `clearRace1RoundResult()`
Race 1のラウンド別結果をクリア（SheetServiceを使用）

#### `clearRace1TotalResult()`
Race 1の総合結果をクリア（SheetServiceを使用）

#### `clearRace1AllResults()`
Race 1の全結果をクリア

#### `createDummyRaceData(pilot: string, position: number)`
テスト用のダミーレースデータを生成（定数を使用）

#### `sendDummyResult()`
現在のヒートのダミー結果を送信（テスト用）

## Race2.ts - Race 2処理

#### `clearRace2RawResult()`
Race 2の生データをクリア（SheetServiceを使用）

## KVS.ts - キーバリューストレージ

### KVS_CONSTANTS
- `CACHE_DURATION` - キャッシュ期間
- `DEFAULT_NUM_CHANNELS` - デフォルトチャンネル数
- `KEYS` - KVSキー定義

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