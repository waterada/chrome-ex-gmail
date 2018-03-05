ChEx.__msg = {};
ChEx.msg = function (key) {
    if (ChEx.__msg[key]) return ChEx.__msg[key];
    //noinspection JSUnresolvedFunction,JSUnresolvedVariable
    return ChEx.__msg[key] = chrome.i18n.getMessage(key);
};
let Checker = {
    onClickConfirm: function (event) {
        try {
            let $confirmButton = $(event.target);
            //メール書き込みエリアを探す
            let $dialogMail = null;
            $.each([
                "div[role='dialog'][aria-labelledby]", //ポップアップダイアログ
                "div.gA.gt", //スレッドの中に埋まっている返信画面
                "div.xr[style]" //使ってない？念のために残す
            ], function() {
                let $dialog = $confirmButton.closest(this + ""); //thisはString型(配列っぽい)になるので、キャストする
                if ($dialog.length) {
                    $dialogMail = $dialog;
                    return false;
                }
            });
            if (! $dialogMail || $dialogMail.length === 0) { return false; }
            //添付中なら終了
            if ($dialogMail.find('div[role="progressbar"]').length > 0) {
                return false;
            }
            //情報収集
            //console.log('new: %o', this);
            let info = {
                to:       $dialogMail.find('input[name="to"]' ).get().map(input => $(input).val()),
                cc:       $dialogMail.find('input[name="cc"]' ).get().map(input => $(input).val()),
                bcc:      $dialogMail.find('input[name="bcc"]').get().map(input => $(input).val()),
                subject:  $dialogMail.find('input[name="subjectbox"]').val(), //subjectboxに入力中の標題が入っている(標題から出ずにすかさず確認押すとsubjectに反映されないので)
                attached: $dialogMail.find('div.dL div.vI').get().map(input => `${$(input).text()}${$(input).next().text()}`)
            };
            //送信ボタン取得
            let $sendButton = $dialogMail.find(`div[id][role='button']:contains('${ChEx.msg('sendButton')}')`);
            //ダイアログ表示
            let $dialog = Checker.makeConfirmHtml(info);
            let dialog = ChEx.dialog({
                makeBody: () => $dialog,
                title: ChEx.msg('dialogTitle'),
                css: {
                    width: '600px',
                },
            });
            dialog.open();
            $dialog.on('click', '.chex-gmail-checkable', function () {
                let $box = $(this);
                $box.css('background-color', 'lightgreen');
                $box.removeClass('chex-gmail-checkable');
                if ($dialog.find('.chex-gmail-checkable').length === 0) {
                    dialog.addButton(ChEx.msg('sendButton'), () => {
                        dialog.close();
                        if ($sendButton.length) $sendButton.click();
                    });
                }
            });
            $dialog.on({
                mouseenter: function () {
                    $(this).css('background-color', 'pink');
                },
                mouseleave: function () {
                    $(this).css('background-color', '#DDDDDD');
                },
            }, '.chex-gmail-checkable');
            //標題とtoが空欄ならチェックできないように
            if (! info.subject || info.to.length === 0) {
                $dialog.find('.chex-gmail-checkable').removeClass('chex-gmail-checkable');
            }
            return false;
        } catch (e) {
            alert(e.message);
            throw e;
        }
    },
    makeConfirmHtml: function(info) {
        let sender_map = {};
        const __readSenders = function(sender_map, sortNum, toAry, typeName, typeColor ) {
            if (!toAry) return;
            //メアドを１つずつドメインごとに振り分ける
            $.each(toAry, function(i, addr) {
                let domain = addr;
                domain = domain.replace( /\s/g , "" ); //空欄は撤去
                domain = domain.replace( /("|&quot;).*?("|&quot;)/g , "" ); //"～" は撤去
                domain = domain.replace( /^.*(?:<|&lt;)(.*?)(?:>|&gt;).*$/ , '$1' );   //<～> ならその中身がメアド
                if (!domain) {
                    return false;
                }
                domain = domain.replace( /^.*?@/ , "@" );
                domain = domain.toLowerCase();
                //マップに登録
                if ( ! sender_map[domain] ) {
                    sender_map[domain] = [];
                }
                //見やすいようにアドレス部分の色を変える
                addr = ChEx.h(addr);
                addr = addr.replace( /([.a-zA-Z0-9_+-]+@[.a-zA-Z0-9_+-]+)/g , `<span style="color: ${typeColor}; opacity: 1.0;">$1</span>` );
                addr = `<span style="color: black;">${addr}</span>`; //アドレス以外は薄く
                addr = `<span style="color: ${typeColor}; opacity: 0.5;">[${typeName}]</span> ${addr}`; //先頭に [cc] などを足す
                addr = `<!-- ${sortNum} -->${addr}`;
                sender_map[domain].push( addr );
            });
        };
        __readSenders(sender_map, 1, info.to, "to", "red");
        __readSenders(sender_map, 2, info.cc, "cc", "green");
        __readSenders(sender_map, 3, info.bcc, "bcc", "#6666FF");
        const __confirm = (title, contents) => `
            <div class="chex-gmail-checkable" style="padding: 2px; margin: 20px 0; background-color: #DDDDDD; font-family: monospace;">
            <div style="margin: 0; padding: 2px; font-weight: bold; font-size: large;">${title}</div>
            ${contents ? `<div style="margin: 0; padding: 2px; background-color: white; line-height: 1.2;">${contents.join("<br/>\n")}</div>` : ''}
            </div>
        `;
        const __warning = (msg) => `
           <div style="padding: 2px; font-weight: bold; font-size: large; margin: 20px 0; border: 2px solid red; background-color: pink;">(${msg})</div>
        `;
        return $(`
            <div>
            ${info.subject ? __confirm(ChEx.msg('subject'), [ChEx.h(info.subject)]) : __warning(ChEx.msg('noSubject'))}
            ${info.to.length ? Object.keys(sender_map).sort().map(domain => __confirm(domain, sender_map[domain].sort())).join('') : __warning(ChEx.msg('noTo'))}
            ${info.attached.length ? __confirm(ChEx.msg('attached'), info.attached.map(a => ChEx.h(a))) : ''}
            </div>
        `);
    },
};
$(function () {
    try {
        ChEx.onChangeDom($('body'), function () {
            //既存のボタン検索
            $(`div[id][role='button']:contains('${ChEx.msg('sendButton')}')`).each(function () {
                let $sendButton = $(this);
                /** @var object $parent 警告消す用 */
                let $parent = $sendButton.parent();
                if ($parent.children('.chex-gmail-btn-confirm').length === 0) { //確認ボタンがまだ無い場合のみ
                    //送信ボタン非表示
                    $sendButton.hide();
                    //確認ボタン作成
                    let $confirmButton = $(`<div class="T-I J-J5-Ji aoO T-I-KE L3 chex-gmail-btn-confirm" role="button" tabindex="1" style="-webkit-user-select: none;">${ChEx.msg('confirmButton')}</div>`);
                    $confirmButton.on("click", Checker.onClickConfirm);
                    $sendButton.before($confirmButton);
                }
            });
        });
    } catch (e) {
        ChEx.error(e.message);
        throw e;
    }
});
