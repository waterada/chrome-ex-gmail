mail送信前チェッカー
=====================

Gmail の誤送信対策の拡張です。
Gmail でメールを送る際、TO/CC/BCC に間違ったお客様のアドレスを追加してしまわないように、ポップアップで TO/CC/BCC の内容を判りやすく確認することができるようになります。 


インストール
------------

1. Google Chrome を開く。
2. [Chrome ストア | Gmail送信前チェッカー](https://chrome.google.com/webstore/detail/amfjacgcdefoiliginkjnebdamdomeig) にアクセスして追加する。


拡張機能の更新手順(開発側)
--------------------------

1. `src/manifest.json` の `version` をインクリメントする(たとえば `1.4`)。
2. `src/` の中を更新する。
3. 拡張機能( `chrome://extensions` )の画面で『デベロッパーモード』をONにする。
4. 対象の拡張機能の `有効にする` を OFF にする。
5. 拡張機能の `パッケージ化されていない拡張機能を読み込む...` ボタンで `src` のディレクトリを選択する。
6. これで拡張機能が読み込まれるので画面でテストする。ソースを修正したら `リロード (Ctrl + R)` のリンクをクリックすることで、拡張機能が最新に更新される。
7. 問題なければ commit して github に push。
8. `src` のディレクトリを zip する。
9. google chrome の デベロッパー・ダッシュボードを表示: https://chrome.google.com/webstore/developer/dashboard
10. 「編集する」をクリックし、「更新パッケージをアップロード」ボタンでアップロード画面に進み、zipファイルをアップロードし、公開する。
11. 拡張機能の画面で、開発用の拡張機能は削除(or オフに)して、元の拡張機能の `有効にする` をONに戻す。
12. 拡張機能の画面で `拡張機能を今すぐ更新` ボタンをクリックする。