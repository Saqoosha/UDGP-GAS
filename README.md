# UDGP-GAS

UDGPドローンレース大会運営のためのGoogle Apps Scriptシステム

## 概要

このプロジェクトは、UDGPドローンレース大会の運営を自動化するGoogle Apps Script (GAS)システムです。ヒートの自動生成、リアルタイムでのレース結果の収集・集計、トーナメント管理などの機能を提供します。

## 主な機能

- **ヒート自動生成**: パイロットを最適に配分してヒートを生成
- **リアルタイム結果収集**: Web APIでレース結果を受信・記録
- **自動順位計算**: ラップ数とタイムに基づく順位計算
- **ラウンド管理**: 複数ラウンドの予選とヒート再配置
- **トーナメント管理**: ダブルエリミネーション形式の決勝トーナメント
- **チャンネル管理**: 3チャンネル/4チャンネルの自動割り当て

## システム構成

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

### ソースコード構成

```
src/
├── Main.ts           # エントリーポイント（Web API）
├── InitHeats.ts      # ヒート生成ロジック
├── Race1.ts          # 予選レース処理
├── Race2.ts          # 決勝レース処理
├── KVS.ts            # 設定値管理
├── RaceRecord.ts     # レース記録データ型
├── RoundRecord.ts    # ラウンド記録クラス
└── appsscript.json   # GAS設定
```

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

### ビルドコマンド

```bash
# TypeScriptをビルド
npm run build

# ビルドしてGASにプッシュ
npm run push

# ビルド、プッシュ、デプロイ
npm run deploy
```

### コーディング規約

- TypeScript使用
- Biomeでフォーマット（4スペース、120文字幅）
- Google Sheetsの行・列インデックスは1始まり

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

## トラブルシューティング

### ヒートが生成されない
- **data**シートの設定値を確認
- 参加パイロットシートにパイロット名が入力されているか確認

### 結果が反映されない
- シートの列構成が変更されていないか確認
- `onEdit`トリガーが設定されているか確認

### APIアクセスできない
- デプロイメントが作成されているか確認
- アクセス権限が「全員（匿名）」になっているか確認

## ライセンス

ISC License

## 作者

Saqoosha