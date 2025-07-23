# UDGP-GAS

UDGPドローンレース大会運営のためのGoogle Apps Scriptシステム / Google Apps Script system for UDGP drone racing event management

## 概要 / Overview

このプロジェクトは、UDGPドローンレース大会の運営を自動化するGoogle Apps Script (GAS)システムです。ヒートの自動生成、リアルタイムでのレース結果の収集・集計、トーナメント管理などの機能を提供します。

This project is a Google Apps Script (GAS) system that automates UDGP drone racing event management. It provides features such as automatic heat generation, real-time race result collection and aggregation, and tournament management.

## 主な機能 / Key Features

- **ヒート自動生成 / Automatic Heat Generation**: パイロットを最適に配分してヒートを生成 / Optimal pilot distribution across heats
- **リアルタイム結果収集 / Real-time Result Collection**: Web APIでレース結果を受信・記録 / Receive and record race results via Web API
- **自動順位計算 / Automatic Ranking**: ラップ数とタイムに基づく順位計算 / Rankings based on lap count and time
- **ラウンド管理 / Round Management**: 複数ラウンドの予選とヒート再配置 / Multi-round qualifying with heat reassignment
- **トーナメント管理 / Tournament Management**: ダブルエリミネーション形式の決勝トーナメント / Double elimination tournament bracket
- **チャンネル管理 / Channel Management**: 3チャンネル/4チャンネルの自動割り当て / Automatic 3/4 channel allocation

## システム構成 / System Architecture

### Google スプレッドシート

システムは以下のシートで構成されています：

- **参加パイロット**: 参加者リストとチャンネル割り当て
- **組み合わせ / タイムスケジュール**: ヒート一覧とスケジュール
- **Race 1 Results**: 予選レースの生データ
- **Race 1 Results（ラウンド別）**: ラウンドごとの順位表
- **Race 1 Results（総合）**: 総合順位表
- **Race 2 Tournament**: 決勝トーナメント表
- **Race 2 Results**: 決勝レースの生データ
- **data**: システム設定値（KVS）
- **Log**: APIリクエストログ

### ソースコード構成 / Source Code Structure

```
src/
├── App.ts                 # グローバルアプリケーション名前空間 / Global application namespace
├── Main.ts                # エントリーポイント（Web API）/ Entry points (doGet, doPost, onEdit)
├── InitHeats.ts           # ヒート生成ロジック / Heat generation logic
├── Race1.ts               # 予選レース処理 / Race 1 (qualifying) logic
├── Race2.ts               # 決勝レース処理 / Race 2 (tournament) logic
├── KVS.ts                 # 設定値管理 / Key-value storage
├── Constants.ts           # 定数定義 / Configuration constants
├── DataModels.ts          # TypeScript型定義 / TypeScript interfaces
├── SheetService.ts        # シートアクセスサービス / Sheet access service
├── HeatGenerator.ts       # ヒート生成アルゴリズム / Heat generation algorithms
├── BatchUpdater.ts        # バッチ更新処理 / Batch sheet operations
├── RaceResultProcessor.ts # レース結果処理 / Race result processing
├── RoundRecord.ts         # ラウンド記録クラス / Round record model
└── appsscript.json        # GAS設定 / GAS configuration
```

**重要**: TypeScriptは`bundle.js`という単一ファイルにコンパイルされ、Google Apps Scriptのファイル読み込み順序問題を回避します。
**Important**: TypeScript compiles into a single `bundle.js` file to avoid Google Apps Script file loading order issues.

## セットアップ

### 前提条件

- Node.js (LTS版)
- pnpm
- Googleアカウント
- clasp CLI

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/Saqoosha/UDGP-GAS.git
cd UDGP-GAS
```

2. 依存関係をインストール
```bash
pnpm install
```

3. claspでログイン
```bash
npm install -g @google/clasp
clasp login
```

4. Google Apps Scriptプロジェクトを作成
```bash
clasp create --type webapp --title "UDGP Race Management"
```

5. ビルドとデプロイ
```bash
npm run deploy
```

## 使い方

### 1. 大会準備

1. **参加パイロット**シートにパイロット名を入力（C列）
2. **data**シートで設定値を調整：
   - `num channels`: チャンネル数（3 or 4）
   - `num rounds of race 1`: 予選ラウンド数
   - `current heat`: 現在のヒート番号（通常1）
   - `race mode`: 現在のレースモード（"Race 1" or "Race 2"）

3. GASエディタで`InitHeats()`関数を実行してヒートを生成

### 2. レース運営

#### API経由でのデータ送信

レース計測システムから以下の形式でPOSTリクエストを送信：

```json
{
  "mode": "udgp-race",
  "class": "Race 1-1",
  "heat": "Heat 1",
  "start": 1234567890000,
  "action": "save",
  "results": [
    {
      "pilot": "パイロット名",
      "position": 0,
      "time": 240.5,
      "laps": [1.5, 15.2, 15.1, 15.3, ...]
    }
  ]
}
```

#### 手動でのデータ入力

**Race 1 Results**シートに直接入力も可能：
- A列: ラウンド番号
- B列: ヒート番号
- C列: 開始時刻
- D列: パイロット名
- E列: 順位
- F列: ラップ数
- G列: 総時間
- J列以降: 各ラップタイム

### 3. チャンネル設定

#### 3チャンネル
- E1 5705
- F1 5740
- F4 5800

#### 4チャンネル
- R2 5695
- A8 5725
- B4 5790
- F5 5820

## 開発

### ビルドコマンド / Build Commands

```bash
# TypeScriptをビルド / Build TypeScript
npm run build

# ビルドしてGASにプッシュ / Build and push to GAS
npm run push

# ビルド、プッシュ、デプロイ / Build, push, and deploy
npm run deploy

# 手動コマンド / Manual commands
clasp push              # dist/をGASにプッシュ / Push dist/ files to GAS
clasp open              # GASエディタを開く / Open in Apps Script editor
clasp tail              # リアルタイムログ表示 / View real-time logs
clasp deployments       # デプロイメント一覧 / List all deployments
```

### コーディング規約 / Coding Standards

- TypeScript使用 / Using TypeScript
- Biomeでフォーマット（4スペース、120文字幅）/ Format with Biome (4 spaces, 120 line width)
- Google Sheetsの行・列インデックスは1始まり / Sheet row/column indices are 1-based
- エラーハンドリングとロギングを適切に実装 / Proper error handling and logging

### デプロイメント管理 / Deployment Management

**重要**: 既存のデプロイメントIDを更新し、新しいデプロイメントを作成しないでください。
**IMPORTANT**: Update the existing deployment ID and never create new deployments.

Production Deployment ID: `AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b`

## API仕様

### GET /exec

ヒートリストを取得

**レスポンス:**
```json
{
  "data": [
    {
      "round": "Race 1-1",
      "heat": "1",
      "pilots": ["パイロット1", "パイロット2", "パイロット3", ""]
    }
  ]
}
```

### POST /exec

レース結果を送信

**リクエスト:**
上記「API経由でのデータ送信」参照

**レスポンス:**
```json
{
  "success": true
}
```

## テスト / Testing

テストスクリプトでAPIを検証できます / Use test scripts to verify the API:

```bash
# 特定のヒートのデータを送信 / Send data for a specific heat
node test/send-heat.js 1

# TSVファイルから全ヒートを送信 / Send all heats from TSV file
./test/send-all-heats.sh
```

## トラブルシューティング / Troubleshooting

### ヒートが生成されない / Heats not generated
- **data**シートの設定値を確認 / Check configuration in data sheet
- 参加パイロットシートにパイロット名が入力されているか確認 / Verify pilot names in pilots sheet

### 結果が反映されない / Results not updated
- シートの列構成が変更されていないか確認 / Check sheet column structure
- `onEdit`トリガーが設定されているか確認 / Verify onEdit trigger is set
- ログを確認: `clasp logs --tail` / Check logs: `clasp logs --tail`

### APIアクセスできない / API not accessible
- デプロイメントが作成されているか確認 / Verify deployment exists
- アクセス権限が「全員（匿名）」になっているか確認 / Check access is set to "Anyone, even anonymous"

### TypeScriptエラー / TypeScript errors
- `SheetService is not defined`エラーの場合、`npm run build`でバンドルを再生成 / For "SheetService is not defined", rebuild bundle with `npm run build`

## 最近の更新 / Recent Updates

- **パフォーマンス改善**: ボーダー追加をデータ挿入時にインライン化 / Border addition optimized to inline during data insertion
- **時刻表示**: 完全な日時から時刻のみ（h:mm:ss）に変更 / Time display changed from full datetime to time only
- **0ラップ対応**: ラップ数0のパイロットを正しく処理 / Fixed handling of pilots with 0 laps
- **TypeScriptバンドル**: ファイル読み込み順序問題を解決 / TypeScript bundle resolves file loading order issues

## ライセンス / License

ISC License

## 作者 / Author

Saqoosha