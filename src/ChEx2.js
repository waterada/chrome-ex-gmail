const ChEx = {};

/** エラーを出す。consoleだけだと見落とすのでalertも。 */
ChEx.error = function (msg) {
    console.error(msg);
    alert(msg);
};

/** きっかり１個ヒットしない場合にエラー出す。selector だけだと動かなくなった際に何が欲しかったのかわからなくなるので label も書くこと */
ChEx.findOne = function (selector, label) {
    let $item = $(selector);
    if ($item.length !== 1) {
        ChEx.error(`${selector} (${label}) が ${$item.size()} 個あります。`);
    }
    return $item;
};

/**  findOne(selector) 後、`${selector} ${subSelector}` で再検索する */
ChEx.findOneThen = function (selector, subSelector, label) {
    ChEx.findOne(selector, `${label} のTop`);
    return $(`${selector} ${subSelector}`);
};

/** html escape */
ChEx.h = function (str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#039;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
};

/**
 * ３桁区切り＆パッディング＆左右寄せ
 * @param num     - 数値なら３桁区切り。文字列でもいい
 * @param length  - (省略可)この桁数までパディングする。マイナスなら右寄せ
 * @param char    - (省略可)パディングで埋める文字。デフォルトは空白
 * @param decimal - (省略可)表示させたい小数桁
 */
ChEx.padding = function (num, length, char, decimal) {
    if (!num.replace) { //文字列か
        if (decimal) {
            num = num.toLocaleString('ja-JP', { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
        } else {
            num = num.toLocaleString();
        }
    }
    if (length) {
        char = char || ' ';
        if (length > 0) {
            num = num + char.repeat(length);
            num = num.slice(0, length);
        } else {
            num = char.repeat(-length) + num;
            num = num.slice(length);
        }
    }
    return num;
};

/** 日付フォーマット。'yyyy-mm-dd HH:MM:SS' の形式で指定 */
ChEx.dateFormat = function (date, format) {
    let str = format;
    str = str.replace(/MS/g, () => `00${date.getMilliseconds()}`.slice(-3));
    str = str.replace(/Y/g, () => date.getFullYear());
    str = str.replace(/M/g, () => `0${date.getMonth() + 1}`.slice(-2));
    str = str.replace(/D/g, () => `0${date.getDate()}`.slice(-2));
    str = str.replace(/H/g, () => `0${date.getHours()}`.slice(-2));
    str = str.replace(/I/g, () => `0${date.getMinutes()}`.slice(-2));
    str = str.replace(/S/g, () => `0${date.getSeconds()}`.slice(-2));
    return str;
};

/** DOMの出現を待つ。１秒ずつmax回試行。見つかったらnextを実行 */
ChEx.waitDom = function(selector, label, max, next) {
    let $item = $(selector); //毎回取り直す必要あり
    if ($item.length) {
        next($item);
    } else if (max) {
        setTimeout(function () {
            ChEx.waitDom(selector, label, max - 1, next);
        }, 1000);
    } else {
        ChEx.error(`${max} 秒待ちましたが ${selector} (${label}) が見つかりませんでした。`);
    }
};

/** リンクが一致したらcallbackを実行。* は .*? として扱われ、(*) は callback の引数に中味が渡る */
ChEx.matchLink = function(condition, callback) {
    let url = location.href;
    condition = condition.replace(/([.?+\/])/g, '\\$1').replace(/\*/g, '.*?');
    condition = new RegExp(condition);
    url.replace(condition, (hit, a, b, c, d) => {
        callback(a, b, c, d);
    });
};

/**
 * @param {jQuery} opt.$targets - 書き換え可能にする対象
 * @param {string} opt.storageKey - 保存につかうキー
 * @param {function} opt.getId - 保存につかうID
 * @param {function} opt.rewritableIf - (省略可) 書き換え可能にする条件
 */
ChEx.rewritableComments = function (opt) {
    //設定済みコメント読み込み
    ChEx.storage.loadLocal(opt.storageKey, {}, texts => {
        opt.$targets.each((i, target) => {
            let $target = $(target);
            let id = opt.getId($target);
            let orig = $target.text().trim();
            $target.attr('data-chrome-ex-orig', orig);
            if (texts[id]) {
                $target.text(texts[id]);
            }
        });
    });
    //クリックイベント設定
    opt.$targets.click(event => {
        let $target = $(event.currentTarget);
        if (opt.rewritableIf && !opt.rewritableIf($target)) { return; }
        //確認
        let text = prompt("", $target.text().trim());
        if (text === null) {
            return;
        }
        //入力値に書き換え or 空欄なら元の値に戻す
        if (text) {
            $target.text(text);
        } else {
            let orig = $target.attr('data-chrome-ex-orig');
            $target.text(orig);
        }
        //保存
        let id = opt.getId($target);
        if (text) {
            ChEx.storage.saveLocal(opt.storageKey, {}, function (texts) {
                texts[id] = text;
            });
        } else {
            ChEx.storage.saveLocal(opt.storageKey, {}, function (texts) {
                delete texts[id];
            });
        }
    });
};

ChEx.storage = {};
ChEx.storage.loadLocal = function (key, defaultValue, callback) {
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    __local.get(key, (data) => {
        if (!data[key]) {
            data[key] = defaultValue;
        }
        callback(data[key]);
    });
};
ChEx.storage.__saveLocal = function (base, afterSave) {
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    if (afterSave) {
        __local.set(base, afterSave);
    } else {
        __local.set(base);
    }
};
ChEx.storage.saveLocal = function (key, defaultValue, callback, afterSave) {
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    __local.get(key, (base) => {
        if (!base[key]) {
            base[key] = defaultValue;
        }
        let save = callback(base[key]);
        if (save !== false) {
            ChEx.storage.__saveLocal(base, afterSave);
        } else {
            if (afterSave) afterSave();
        }
    });
};
ChEx.storage.saveLocalDirectly = function (key, data, afterSave) {
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    __local.get(key, (base) => {
        base[key] = data;
        ChEx.storage.__saveLocal(base, afterSave);
    });
};
ChEx.storage.removeLocal = function (key, afterSave) {
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    if (afterSave) {
        __local.remove(key, afterSave)
    } else {
        __local.remove(key)
    }
};

/**
 * @param opt.storageKey
 * @param opt.$parent
 * @param opt.cssSelect
 * @param opt.inputs
 * @param opt.onAdd
 * @param opt.onApply
 */
ChEx.templateStorage = function (opt) {
    ChEx.storage.loadLocal(opt.storageKey, [], templates => {
        const $select = $('<select></select>');
        const __addOption = (text, value) => {
            let $option = $('<option></option>').text(text).appendTo($select);
            if (value !== undefined) {
                $option.attr('value', value);
            }
        };
        //noinspection JSUnresolvedFunction
        opt.$parent.append(
            $('<div></div>').append(
                $select.css(opt.cssSelect || {}).change(function () {
                    let selected = $select.val();
                    if (selected === 'BLANK') return;
                    if (selected === 'ADD') {
                        let title = prompt('title');
                        if (title) {
                            let values = opt.inputs.map(selector => ChEx.findOne(selector).val());
                            let value = `${title}\t${opt.onAdd(values).join("\t")}`;
                            ChEx.storage.saveLocal(opt.storageKey, [], templates => {
                                templates.push(value);
                            });
                            __addOption(value, value);
                        }
                        $select.val('BLANK');
                    } else {
                        let values = selected.split("\t");
                        values.shift(); //タイトル撤去
                        for (let selector of opt.inputs) {
                            let val = values.shift();
                            ChEx.findOne(selector).val(val);
                        }
                        opt.onApply(values); //余った values を渡す
                    }
                }),
                $('<a href="javascript:void(0)">del</a>').css('margin-left', '10px').click(() => {
                    let selected = $select.val();
                    if (selected === 'ADD' || selected === 'BLANK') return;
                    let $selected = $select.find('option:selected');
                    $selected.remove();
                    $select.val('BLANK');
                    ChEx.storage.saveLocal(opt.storageKey, [], function (templates) {
                        let idx = templates.indexOf(selected);
                        if (idx === -1) return ChEx.error('No value in the template. value: ' + selected);
                        templates.splice(idx, 1);
                    });
                })
            )
        );
        __addOption('', 'BLANK');
        __addOption('add to templates', 'ADD');
        for (let value of templates) {
            //let title = value.replace(/\t.*$/, '');
            __addOption(value, value);
        }
    });
};

/**
 * 下位のDOMが変更されたら
 */
ChEx.onChangeDom__timeoutId = 0;
ChEx.onChangeDom = function ($root, callback) {
    $root.on("DOMNodeInserted DOMSubtreeModified", function () {
        if (ChEx.onChangeDom__timeoutId) return true; //動いていたらやらない
        ChEx.onChangeDom__timeoutId = setTimeout(function () {
            try {
                callback();
            } finally {
                ChEx.onChangeDom__timeoutId = 0;
            }
            return true;
        }, 100);
    });
};

ChEx.__toggle = {};
ChEx.toggle = function(key, a, b) {
    ChEx.__toggle[key] = !ChEx.__toggle[key];
    if (ChEx.__toggle[key]) {
        a(true);
    } else if (b) {
        b();
    } else {
        a(false);
    }
};

ChEx.scrollX = function ($dom, calcX) {
    $dom.each(function () {
        let $each = $(this);
        //noinspection JSValidateTypes
        $each.stop(true, true).animate({ scrollLeft: calcX($each.scrollLeft()) }, 200);
    });
};

ChEx.scrollY = function ($dom, calcY) {
    $dom.each(function () {
        let $each = $(this);
        //noinspection JSValidateTypes
        $each.stop(true, true).animate({ scrollTop: calcY($each.scrollTop()) }, 200);
    });
};

ChEx.__keydown_KEYS = {
    BS: 8,
    '<': 188,
    '>': 190,
    '?': 191,
    '/': 191,
};
ChEx.__keydown_handlers = null;
ChEx.__keydown_helps = null;
ChEx.keydown = function (key, label, callback) {
    //初回のみ行う
    if (!ChEx.__keydown_handlers) {
        ChEx.__keydown_handlers = {};
        ChEx.__keydown_helps = [];
        //イベント設置
        $(document).keydown(function (e) {
            let code = e.which;
            let handler = ChEx.__keydown_handlers[code];
            if (handler) {
                handler(e);
            }
            //console.log(`${code}:${String.fromCharCode(code)}`);
        });
    }
    //設定
    ChEx.__keydown_handlers[ChEx.__keydown_KEYS[key] || key.charCodeAt(0)] = callback;
    if (label) {
        ChEx.__keydown_helps.push({ key, label });
    }
};
ChEx.keydownHelp = function (key, parentPosition) {
    ChEx.keydown(key || 'H', '', function () {
        const $body = $('body');
        ChEx.toggle('keydown-help', () => {
            let p = parentPosition || $body.position();
            $body.append(
                $(`<pre id='chex-keydown-help' style="position: fixed; left: ${p.left + 20}px; top: ${p.top + 20}px; padding: 10px; background-color: white; border: 3px solid black; z-index: ${Number.MAX_SAFE_INTEGER};"></pre>`).append(
                    ChEx.__keydown_helps.map(h => `<b>${ChEx.h(h.key)}</b> : ${ChEx.h(h.label)}<br/>`)
                )
            );
        }, () => {
            $('#chex-keydown-help').remove();
        });
    });
};

ChEx.__dialog_opened = false;
/**
 * @param opt.$html
 * @param opt.css
 * @param opt.title
 * @param opt.open
 * @param opt.close
 */
ChEx.dialog = function (opt) {
    if (ChEx.__dialog_opened) return;
    ChEx.__dialog_opened = true;
    let $dialog = $('<div></div>');
    let $back = $('<div></div>');
    $('body').append(
        $dialog.css(Object.assign({
            position: 'absolute',
            height: 'auto',
            width: '600px',
            top: 0,
            left: 0,
            zIndex: 2147483647,
            borderRadius: '3px',
            border: '1px solid #ddd',
            background: '#fff',
            color: '#333',
            fontFamily: 'Arial,Helvetica,sans-serif',
            fontSize: '1em',
            overflow: 'hidden',
            padding: '.2em',
            outline: 0,
        }, opt.css)).append(
            (opt.title ? $('<div></div>').text(opt.title).css({
                cursor: 'move',
                padding: '.4em 1em',
                borderRadius: '3px',
                border: '1px solid #ddd',
                background: '#e9e9e9',
                color: '#333',
                fontWeight: 'bold',
            }) : null),
            $('<div></div>').css({
                padding: '.5em 1em',
                color: '#333',
            }).append(
                opt.$html,
                $('<div class="chex-dialog-buttons"></div>')
            )
        ),
        $back.css({
            zIndex: 2147483646,
            background: '#aaa',
            opacity: '.3',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
        })
    );
    const dialog = {
        open: () => {
            if (opt.open) opt.open();
            $dialog.show();
            opt.$html.scrollTop(0); //スクロールが出る場合、ボタン(末尾)にフォーカスが行ってしまうので、これで先頭に戻す
            let $window = $(window);
            let wh = $window.height();
            let ww = $window.width();
            let dw = $dialog.width();
            let dh = $dialog.height();
            $dialog.css({
                left: (ww - dw) / 2,
                top: Math.max(20, (wh - dh) / 2),
            })
        },
        close: () => {
            $dialog.remove();
            $back.remove();
            $(document).off('.chex-dialog');
            if (opt.close) opt.close();
            ChEx.__dialog_opened = false;
        },
        addButton: (label, onClick, bgColor) => {
            $dialog.find('.chex-dialog-buttons').append(
                $('<button></button>').text(label).click(onClick).css({
                    border: '1px solid #c5c5c5',
                    borderRadius: '3px',
                    padding: '.4em 1em',
                    color: '#454545',
                    background: bgColor || '#f6f6f6',
                    fontSize: '1em',
                    cursor: 'pointer',
                    marginRight: '10px',
                })
            );
        },
    };
    $(document).on('keydown.chex-dialog', function (e) {
        if (e.which === 27) dialog.close();
    });
    dialog.addButton('Cancel', () => dialog.close());
    return dialog;
    //スクロールの一番下にボタンを出したいので、$dialog.buttons は使わずに自前で用意する。また、初登場のボタンがデフォルトボタンになるので注意。
    // $dialog.dialog({
    //     //autoOpen: false,
    //     //modal: true,
    //     //resizable: true,
    //     //draggable: true,
    //     position: { my: "center", at: "center", of: window },
    //     //title: ChEx.msg('dialogTitle'),
    //     minWidth: 600,
    //     height: "auto",
    //     maxHeight: parseInt($(window).height()),
    //     // open: function() {
    //     //     //noinspection JSValidateTypes
    //     //     //$dialog.scrollTop(0); //スクロールが出る場合、ボタン(末尾)にフォーカスが行ってしまうので、これで先頭に戻す
    //     // },
    //     // close: function () {
    //     //     $dialog.remove();
    //     //     ChEx.__dialog_opened = false;
    //     // }
    // });
    // //todo: esc でダイアログ閉じる
    // //ボタンのデザイン
    // addEvent($dialog);
    // //xアイコンが表示されるように（imagesの画像をgoogle.comから探してしまうので差し替える）
    // //$dialog.dialog("widget").find("button.ui-dialog-titlebar-close").hide();
    // setTimeout(function () { $dialog.dialog("open"); }, 100); //なんでおくらせる？
};