# zh-HK UI translation: review sheet

Draft Traditional Chinese (Hong Kong) translation of the app's UI text (`chrome` namespace) for the Cantonese (yue) release. Tracked in issue #55.

- **Source:** `locales/en.json` → **draft:** `locales/zh-HK.json`
- **Keys:** 132. **Flagged for decision (⚠):** 18.
- **Keys:** 133. **Flagged for decision (⚠):** 19.
- **Locale selection:** the yue build always shows zh-HK UI text, whatever the phone's language. Any key missing from zh-HK falls back to English.
- **Scope:** UI text only. Game content (tiles, words, instructions audio) comes from the language pack and is not covered here.

## How to review

1. Read each row's zh-HK draft. Rows marked ⚠ need a decision. The note gives the alternatives considered.
2. Write corrections in a new column or as comments; do not change the `key` column.
3. Keep everything inside `{{…}}` exactly as-is (e.g. `{{points}}`). The app replaces it with a number or name.
4. Keep labels short; most appear on buttons or tabs on small phone screens.

## Conventions used

- Standard written Hong Kong Chinese (書面語) and HK terms: 應用程式, 電郵, 私隱, 計劃. Colloquial Cantonese characters (冇, 喺, 啱) were avoided. See the `celebrate` row for one place where they might fit.
- One term per concept across the app: tile = 字塊, word = 詞語, door = 門, player = 玩家, resources = 資源.
- A half-width space separates Chinese from `{{placeholders}}` and Latin text (e.g. `版本 {{version}}`). Full-width punctuation (：，！。) throughout.
- The `a11y` keys are screen-reader labels. Users never see them, but they hear them.
- Keys `/`-separated show nesting in the file; keys with `.` (e.g. `about.title`) are flat keys whose names contain a dot.

## Strings

| key | English | zh-HK draft | notes |
|---|---|---|---|
| `chrome/back` | Back | 返回 |  |
| `chrome/home` | Home | 主頁 |  |
| `chrome/score` | Score | 分數 |  |
| `chrome/choose_player` | Choose Player | 選擇玩家 |  |
| `chrome/set_player_name` | Set Player Name | 設定玩家名稱 |  |
| `chrome/tracker_of_total` | Tracker {{current}} of {{total}} | 進度：第 {{current}} 個，共 {{total}} 個 | ⚠ "Tracker" = progress counter of correct answers. Chose 進度 (progress) rather than a literal word. Alternative: 第 {{current}}／{{total}} 題. |
| `chrome/replay` | Replay | 重播 | Replays the word audio. 重播 = replay (audio). |
| `chrome/retry` | Retry | 再試一次 |  |
| `chrome/loading_short` | Loading… | 載入中… |  |
| `chrome/taiwan/progress` | Character {{current}} of {{total}} | 第 {{current}} 個字，共 {{total}} 個字 | Stroke-order game; "Character" = Chinese character, hence 字. |
| `chrome/taiwan/no_content` | No stroke data available. | 沒有筆順資料。 | Standard written 沒有 used, not colloquial 冇. |
| `chrome/taiwan/clear` | Clear | 清除 |  |
| `chrome/taiwan/well_done` | ✓ | ✓ | Symbol kept as-is. |
| `chrome/next` | Next | 下一個 | ⚠ Generic "next" in games. 下一個 (next one); could be 下一題 (next question) if always question-based. |
| `chrome/game_door_level` | Door {{door}} · Level {{level}} | 門 {{door}} · 第 {{level}} 級 | ⚠ "Door" is the app's menu metaphor (each game is a door). Literal 門 kept for consistency with a11y/door; reviewers may prefer 遊戲 or 關 (stage). |
| `chrome/game_unavailable` | Game not yet implemented | 此遊戲尚未推出 | Shown for games not built yet; 尚未推出 = "not yet launched". |
| `chrome/instructions` | Instructions | 說明 | Button label; 說明 kept short. Alternative: 玩法. |
| `chrome/play_again` | Play Again | 再玩一次 |  |
| `chrome/celebrate` | Great job! You found correct answers to 12 questions on this game! | 做得好！你在這個遊戲中答對了 12 題！ | ⚠ Written-standard tone. For children a colloquial version could feel warmer, e.g. 好叻呀！你喺呢個遊戲答啱咗 12 題！ The number 12 is fixed in English source too. |
| `chrome/about` | About This App | 關於本應用程式 | HK term 應用程式 for "app". |
| `chrome/about.title` | About | 關於 |  |
| `chrome/about.version` | Version {{version}} | 版本 {{version}} |  |
| `chrome/about.credits` | Credits | 鳴謝 | 鳴謝 = acknowledgements/credits. |
| `chrome/about.email` | Email us | 電郵聯絡我們 | HK uses 電郵 (not 郵件/電子郵箱). |
| `chrome/about.privacy` | Privacy Policy | 私隱政策 | HK uses 私隱 (not Mainland/TW 隱私). |
| `chrome/about.website` | Project website | 計劃網站 | ⚠ "Project" rendered 計劃 (HK usage). Alternatives: 項目網站, 官方網站. |
| `chrome/about.reportIssue` | Report an issue | 報告問題 | Alternative: 回報問題. |
| `chrome/about.thirdParty` | Open-source licences | 開放源碼授權 | HK term 開放源碼 (not 開源/開放原始碼). Heading for stroke-data licence (APL). |
| `chrome/about.showLicence` | Show licence text | 顯示授權條款 |  |
| `chrome/about.hideLicence` | Hide licence text | 隱藏授權條款 |  |
| `chrome/share` | Share | 分享 |  |
| `chrome/share.title` | Share | 分享 |  |
| `chrome/share.instructions` | Scan this QR code to share this app | 掃描此 QR 碼即可分享本應用程式 | ⚠ "QR code" rendered QR 碼 (common in HK). Alternative: 二維碼 (more Mainland-flavoured). |
| `chrome/share.button` | Share via... | 分享至… |  |
| `chrome/share.copied` | Link copied! | 已複製連結！ |  |
| `chrome/share.qrAlt` | QR code linking to the Play Store | 連往 Play 商店的 QR 碼 | ⚠ Store name: Play 商店 is Google's HK localisation; some reviewers may prefer "Google Play". |
| `chrome/share.unavailable` | Sharing not configured for this pack | 此語言包未設定分享功能 | ⚠ "Pack" rendered 語言包 (language pack); a developer-facing message, rarely seen by users. |
| `chrome/resources` | Other Resources In This Language | 此語言的其他資源 |  |
| `chrome/resources.title` | Resources | 資源 |  |
| `chrome/resources.empty` | No resources available | 暫無資源 |  |
| `chrome/resource_item` | A Resource In This Language | 此語言的一項資源 |  |
| `chrome/build_word_here` | Build Word Here | 在此拼出詞語 | ⚠ In the Cantonese pack, "word" may be a single character or a multi-character word. 詞語 used throughout; reviewers may prefer 字詞. |
| `chrome/go_backward` | Go To Previous | 上一個 |  |
| `chrome/go_forward` | Go To Next | 下一個 |  |
| `chrome/see_more_of_tile` | See More Words Starting With This Game Tile | 查看更多以此字塊開頭的詞語 | ⚠ Key term: "tile" rendered 字塊 everywhere (a11y/tile, game_tile, empty_tile, join_tiles). Alternatives: 字卡, 方塊. Please confirm one term app-wide. |
| `chrome/expired_title` | Expired | 已過期 |  |
| `chrome/expired_message` | This app has expired. | 此應用程式已過期。 |  |
| `chrome/loading/title` | Loading AlphaTiles | 正在載入 AlphaTiles | Brand name AlphaTiles left in Latin script. |
| `chrome/loading/progress` | Loading {{percent}}% | 載入中 {{percent}}% |  |
| `chrome/loading/tap_to_begin` | Tap to begin | 輕按開始 | ⚠ "Tap": 輕按 (Android HK) vs 點按 (Apple HK). Alternative: 按此開始. |
| `chrome/loading/error` | Something went wrong. Please restart. | 發生錯誤，請重新啟動。 |  |
| `chrome/players/heading` | {{localName}} | {{localName}} | Placeholder only; filled with pack's local name. No translation needed. |
| `chrome/players/add` | Add new | 新增 |  |
| `chrome/players/delete_confirm` | Tap again to delete | 再按一次即可刪除 |  |
| `chrome/players/name_placeholder` | Your name | 你的名字 | Uses 你 (informal "you"), suited to children. |
| `chrome/players/name_submit` | Done | 完成 |  |
| `chrome/players/a11y/avatar` | Avatar {{index}} | 頭像 {{index}} |  |
| `chrome/players/a11y/delete` | Delete player | 刪除玩家 |  |
| `chrome/players/a11y/keyboard_delete` | Delete last character | 刪除最後一個字 | "Character" = typed character; 字 is natural for Chinese input. |
| `chrome/players/a11y/keyboard_next` | Next keyboard page | 鍵盤下一頁 |  |
| `chrome/players/a11y/keyboard_prev` | Previous keyboard page | 鍵盤上一頁 |  |
| `chrome/players/validation/too_short` | Enter a name | 請輸入名字 |  |
| `chrome/players/validation/too_long` | Max 20 characters | 最多 20 個字 | ⚠ "characters" rendered 字. For Latin-script input, 字元 is more precise. |
| `chrome/players/validation/duplicate` | Name already used | 此名字已被使用 |  |
| `chrome/menu/score` | Score: {{points}} | 分數：{{points}} |  |
| `chrome/menu/level` | Level {{n}} | 第 {{n}} 階 | ⚠ New (#52). Difficulty badge on each door, {{n}} = 0–6. 階 (step) chosen so it is not confused with `game_door_level` 第 N 級, which is a game's own challenge level. Alternative: 程度 {{n}}. |
| `chrome/menu/a11y/door` | Game {{index}}, {{state}} | 遊戲 {{index}}，{{state}} | {{state}} is one of the three `door_state` labels below. |
| `chrome/menu/a11y/door_named` | Game {{index}}, {{name}}, {{state}} | 遊戲 {{index}}：{{name}}，{{state}} | New (#37). Screen-reader label for a door with a game name; {{name}} is the pack's Cantonese game name, read as-is. |
| `chrome/menu/a11y/door_state/not_started` | not started | 未開始 | Door state read after the game number. |
| `chrome/menu/a11y/door_state/in_process` | in progress | 進行中 | Started, not yet mastered. Also used for games with no right/wrong answers. |
| `chrome/menu/a11y/door_state/mastery` | mastered | 已掌握 | ⚠ All 12 trackers earned. Alternative: 已完成 (completed). |
| `chrome/menu/a11y/prev` | Previous page | 上一頁 |  |
| `chrome/menu/a11y/next` | Next page | 下一頁 |  |
| `chrome/menu/a11y/back_to_players` | Back to player selection | 返回選擇玩家 |  |
| `chrome/menu/a11y/about` | About | 關於 |  |
| `chrome/menu/a11y/share` | Share | 分享 |  |
| `chrome/menu/a11y/resources` | Resources | 資源 |  |
| `chrome/menu/a11y/audio_instructions` | Play audio instructions | 播放語音說明 |  |
| `chrome/menu/a11y/settings` | Settings | 設定 | New (#44). Screen-reader label for the Settings tab. |
| `chrome/menu/a11y/toggle_layout` | Toggle layout | 切換版面 |  |
| `chrome/menu/a11y/door_with_level` | {{door}}, {{level}} | {{door}}，{{level}} | New (#52). Screen-reader door label plus its level badge, e.g. 遊戲 3，未開始，第 2 階. |
| `chrome/menu/a11y/how_levels_work` | How levels work | 各階說明 | New (#52). Screen-reader label for the "?" button on the menu that opens the "Where to start" sheet. |
| `chrome/menu/tabs/about` | About | 關於 |  |
| `chrome/menu/tabs/share` | Share | 分享 |  |
| `chrome/menu/tabs/resources` | Library | 資源庫 | ⚠ English is "Library"; 資源庫 (resource library) chosen to match the Resources screen. Alternative: 圖書館 (literal library) seems wrong here. |
| `chrome/menu/tabs/audio` | Listen | 聆聽 | Tab plays audio instructions. Alternative: 收聽. |
| `chrome/menu/tabs/settings` | Settings | 設定 | New (#44). Tab opening the Settings screen. |
| `chrome/menu/self_test` | Check yourself | 自我測驗 | ⚠ New (#42). Button below the doors that opens the self-test (10 questions, own score at the end, nothing saved). Alternative: 考考自己 (friendlier, more colloquial). |
| `chrome/menu/a11y/self_test` | Check yourself: {{n}} questions, score not saved | 自我測驗：{{n}} 條題目，分數不會儲存 | New (#42). Screen-reader label for that button; {{n}} = 10. |
| `chrome/settings/title` | Settings | 設定 | New (#44). Settings screen heading. |
| `chrome/settings/show_game_names` | Show game names on doors | 在門上顯示遊戲名稱 | ⚠ New (#44). First settings toggle. "Door" = 門 as elsewhere; reviewers may prefer 遊戲門. |
| `chrome/settings/show_game_names_hint` | Turn off to show only coloured, numbered doors (for children who find games by colour). | 關閉後，門上只顯示顏色和號碼（適合靠顏色找遊戲的兒童）。 | New (#44). Explains the toggle to parents/teachers. |
| `chrome/settings/feedback` | Send feedback | 傳送意見 | New (#41). Settings row opening the feedback screen; only shown when the pack has a real contact email. |
| `chrome/settings/feedback_hint` | Opens your email app to write to us. | 開啟電郵應用程式，寫信給我們。 | New (#41). |
| `chrome/feedback/title` | Send feedback | 傳送意見 | New (#41). Feedback screen heading. |
| `chrome/feedback/intro` | Tell us what you like, what is confusing, or what went wrong. This opens your email app with a message ready to send. | 告訴我們你喜歡甚麼、哪裡不清楚，或遇到甚麼問題。按下按鈕會開啟電郵應用程式，並預先填好郵件。 | New (#41). |
| `chrome/feedback/button` | Write an email | 撰寫電郵 | New (#41). |
| `chrome/feedback/address_label` | Our email address | 我們的電郵地址 | New (#41). Label above the address shown for copying. |
| `chrome/feedback/no_mail_app` | Could not open an email app. Please copy the address below and write to us from your email. | 無法開啟電郵應用程式。請複製下方地址，用你的電郵寫信給我們。 | New (#41). Shown when the device has no mail app. |
| `chrome/feedback/subject_label` | Feedback | 意見 | New (#41). Word in the email subject, e.g. `學廣話 意見 \| Cantonese \| v1.0.0 \| android`. |
| `chrome/feedback/mail_body` | Hello, (blank line) My feedback: | 你好，(blank line) 我的意見： | New (#41). Starter text of the email body; contains line breaks. |
| `chrome/placementGuidance/title` | Where to start | 從哪一階開始？ | New (#52). Heading of the sheet opened by the menu "?" button. For parents/teachers choosing where a learner starts. |
| `chrome/placementGuidance/intro` | Games are grouped by step, from Step {{min}} (easiest) to Step {{max}}. Each door shows its step. | 遊戲按難度分階，由第 {{min}} 階（最容易）至第 {{max}} 階。每扇門都會顯示它的階數。 | New (#52). ⚠ Changed (review 2, U10): now shows the pack's real lowest/highest step instead of a fixed 0–6. |
| `chrome/placementGuidance/band_0_1_title` | Levels 0–1 · Listen and explore | 第 0–1 階 · 聆聽和探索 | New (#52). Band heading. |
| `chrome/placementGuidance/band_0_1` | Tap tiles and words to hear them. Start here with a new reader. | 點按字塊和詞語，聆聽讀音。剛開始學習閱讀的學習者由這裏開始。 | ⚠ New (#52). Must not mention age (no 兒童/成人): reading level only. Alternative for "new reader": 初學者. |
| `chrome/placementGuidance/band_2_3_title` | Levels 2–3 · Match and recognise | 第 2–3 階 · 配對和認字 | New (#52). |
| `chrome/placementGuidance/band_2_3` | Match sounds, pictures and written words. Start here if the learner already knows some words. | 把讀音、圖片和文字配對。已認識一些詞語的學習者由這裏開始。 | New (#52). |
| `chrome/placementGuidance/band_4_6_title` | Levels 4–6 · Build and solve | 第 4–6 階 · 組字和解謎 | New (#52). |
| `chrome/placementGuidance/band_4_6` | Spell words, take them apart and solve word puzzles. For confident readers. | 拼出詞語、拆解詞語和解答文字謎題。適合有信心的讀者。 | New (#52). In yue, "spell" = build a word from its characters. |
| `chrome/placementGuidance/tip` | Move up a level when the learner gets most answers right. A tick on a door means it is mastered. | 學習者答對大部分題目時，便可升上一階。門上有剔號，表示已掌握該遊戲。 | New (#52). 剔號 = tick (HK usage); matches `door_state/mastery` 已掌握. |
| `chrome/placementGuidance/close` | Close | 關閉 | New (#52). |
| `chrome/selfTest/title` | Check yourself | 自我測驗 | New (#42). Self-test screen heading; same term as `menu/self_test`. |
| `chrome/selfTest/progress` | Question {{current}} of {{total}} | 第 {{current}} 題，共 {{total}} 題 | New (#42). Shown at the top during the test. |
| `chrome/selfTest/end_title` | End of test | 測驗完成 | New (#42). Heading of the score screen. Literal 測驗結束 also possible; 完成 sounds less abrupt. |
| `chrome/selfTest/score` | {{correct}} / {{total}} | {{correct}} / {{total}} | New (#42). Large score, e.g. 8 / 10. Not translated. |
| `chrome/selfTest/a11y/score` | {{correct}} correct out of {{total}} | 共 {{total}} 題，答對 {{correct}} 題 | New (#42). Screen-reader reading of the score. |
| `chrome/selfTest/try_again` | Try again | 再試一次 | New (#42). Starts a new set of questions. Same wording as `retry`. |
| `chrome/selfTest/back_to_menu` | Back to menu | 返回主選單 | New (#42). |
| `chrome/selfTest/empty` | No questions are available for this language yet. | 這個語言暫時沒有題目。 | New (#42). Only seen if the language pack has no question games. |
| `chrome/a11y/tile` | Tile {{letter}} | 字塊 {{letter}} |  |
| `chrome/a11y/word` | Word {{word}} | 詞語 {{word}} |  |
| `chrome/a11y/active_word_picture` | Picture of Active Word | 目前詞語的圖片 |  |
| `chrome/a11y/keyboard_key` | Key {{key}} | 按鍵 {{key}} |  |
| `chrome/a11y/backspace` | Backspace | 退格 | Screen-reader label. Alternative: 刪除鍵. |
| `chrome/a11y/alpha_tiles_logo` | Alpha Tiles Logo | AlphaTiles 標誌 |  |
| `chrome/a11y/tracker` | Tracker {{current}} of {{total}} | 進度：第 {{current}} 個，共 {{total}} 個 | Same as tracker_of_total; avoids "/" which screen readers read awkwardly. |
| `chrome/a11y/points_background` | Points Background | 分數背景 |  |
| `chrome/a11y/player_avatar` | Change Players | 更換玩家 |  |
| `chrome/a11y/memory_card` | Memory Card {{number}} | 配對卡 {{number}} | ⚠ 記憶卡 avoided: in Chinese it means a memory (SD) card. 配對卡 = matching card. Alternative: 卡牌. |
| `chrome/a11y/word_choice` | Word Choice {{number}} | 詞語選項 {{number}} |  |
| `chrome/a11y/word_image` | Word Image {{number}} | 詞語圖片 {{number}} |  |
| `chrome/a11y/choice` | Choice {{number}} | 選項 {{number}} |  |
| `chrome/a11y/avatar_icon` | Player {{number}} Avatar Icon | 玩家 {{number}} 頭像 |  |
| `chrome/a11y/door` | Door {{number}} | 門 {{number}} |  |
| `chrome/a11y/game_tile` | Game Tile {{id}} | 字塊 {{id}} |  |
| `chrome/a11y/active_word` | Word In Focus | 目前詞語 |  |
| `chrome/a11y/play_audio_instructions` | Play Audio Instructions | 播放語音說明 |  |
| `chrome/a11y/empty_tile` | Empty tile | 空白字塊 |  |
| `chrome/a11y/join_tiles` | Join tiles | 合併字塊 |  |
| `chrome/a11y/previous_page` | Previous page | 上一頁 |  |
| `chrome/a11y/next_page` | Next page | 下一頁 |  |
| `chrome/a11y/submit_guess` | Submit guess | 提交答案 |  |
| `chrome/a11y/advance` | Advance | 繼續 | Moves to next item; 繼續 = continue. |
| `chrome/a11y/delete` | Delete | 刪除 |  |
| `chrome/a11y/play_again` | Play again | 再玩一次 |  |

> **Note (difficulty ladder, #52):** the menu tier uses 階 / English "Step" (`chrome.menu.level`, `chrome.placementGuidance.*`); each game's own challenge level keeps 級 / English "Level" (`chrome.game_door_level`). Please confirm 階 reads naturally for learners.

## Added in UX review 2 (fix/review2-ux)

Screen-reader labels (`a11y`) are heard, not seen. Please check they sound natural when read aloud.

| key | English | zh-HK draft | notes |
|---|---|---|---|
| `chrome/a11y/trackers_summary` | {{done}} of {{total}} trackers complete | 已完成 {{done}}／{{total}} | ⚠ One label for the 12-dot progress bar (was 12 English labels). Alternative: 進度：{{done}}／{{total}}. |
| `chrome/a11y/play_word` | Play {{word}} | 播放：{{word}} | Word-browser rows (Malaysia). {{word}} is the Cantonese word. |
| `chrome/a11y/listen_again` | Listen again | 再聽一次 | Speaker button in the self-test (was 再玩一次 "play again"). |
| `chrome/a11y/hidden_card` | Face-down card | 未翻開的卡 | Memory game, card not yet turned over. |
| `chrome/a11y/guess_cell` | Row {{row}}, column {{col}}: {{text}} | 第 {{row}} 行，第 {{col}} 格：{{text}} | Word-guess grid (not used by yue yet). |
| `chrome/a11y/guess_cell_empty` | Row {{row}}, column {{col}}: empty | 第 {{row}} 行，第 {{col}} 格：空白 | As above, empty cell. |
| `chrome/a11y/replay_item` | Replay: {{item}} | 重播：{{item}} | Lotería caller (Italy). Full-width colon. |
| `chrome/menu/a11y/door_state/free_explore` | free play | 自由探索 | ⚠ Doors with no score (word browser etc.). Alternative: 自由玩. |
| `chrome/settings/empty` | No settings to change for this language. | 這個語言暫時沒有可調整的設定。 | Shown when the pack has no game names and no feedback email. |
| `chrome/selfTest/suggestion_high` | Excellent reading! Try the games from Step {{step}}. | 讀得非常好！試試第 {{step}} 階的遊戲。 | Self-test result, 8–10 correct. |
| `chrome/selfTest/suggestion_mid` | Good work! Start with the games from Step {{step}}. | 做得好！可以由第 {{step}} 階的遊戲開始。 | 5–7 correct. |
| `chrome/selfTest/suggestion_low` | Keep going! Start with the games from Step {{step}}. | 繼續加油！可以由第 {{step}} 階的遊戲開始。 | 0–4 correct. ⚠ Tone for young learners: 加油 OK? |
| `chrome/pack_error/title` | Language pack failed to load | 語言包載入失敗 | Developer-facing error screen; rarely seen. |
| `chrome/pack_error/hint` | Restart the app after fixing the language pack. If this is a production build, contact the app maintainer. | 修正語言包後請重新啟動應用程式。如果這是正式版本，請聯絡應用程式維護人員。 | As above. |
| `chrome/about.thirdPartySummary` | The stroke-order data for the writing game is used under the Arphic Public License. The licence text is in English. | 寫字遊戲的筆順資料按 Arphic Public License 授權使用。授權條款原文為英文。 | Lead-in above the English legal text on the About page. Licence name stays in English. |
