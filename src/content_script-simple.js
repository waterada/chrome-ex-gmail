$(function () {
    ChEx.onChangeDom($('body'), function () {
        //既存のボタン検索
        $(`div[id][role='button']:contains('送信')`).each(function () {
            let $sendButton = $(this);
            let $parent = $sendButton.parent();
            if ($parent.children('.chex-gmail-btn-confirm').length) return; //確認ボタンがまだ無い場合のみ
            //送信ボタン非表示
            $sendButton.hide();
            //確認ボタン作成
            let $confirmButton = $(`<div class="T-I J-J5-Ji aoO T-I-KE L3 chex-gmail-btn-confirm" role="button" tabindex="1" style="-webkit-user-select: none;">確認</div>`);
            $confirmButton.on("click", function () {
                //メール書き込みエリアを探す
                let $dialogMail = $confirmButton.closest(`div[role='dialog'][aria-labelledby]`); //とりあえずダイアログ形式のみ
                //確認ダイアログ表示
                let dialog = ChEx.dialog({
                    title: '宛先を確認してください。',
                    css: { width: '600px' },
                    makeBody: function() {
                        let sender_map = {};
                        for (let key of ['to', 'cc', 'bcc']) {
                            //情報収集
                            let addrAry = $dialogMail.find(`input[name="${key}"]`).get().map(input => $(input).val());
                            //アドレスをドメインごとに振り分ける
                            for (let addr of addrAry) {
                                let domain = addr;
                                domain = domain.replace( /\s/g , "" ); //空欄は撤去
                                domain = domain.replace( /("|&quot;).*?("|&quot;)/g , "" ); //"～" は撤去
                                domain = domain.replace( /^.*(?:<|&lt;)(.*?)(?:>|&gt;).*$/ , '$1' );   //<～> ならその中身がメアド
                                if (!domain) return false;
                                domain = domain.replace( /^.*?@/ , "@" );
                                domain = domain.toLowerCase();
                                //マップに登録
                                if ( ! sender_map[domain] ) {
                                    sender_map[domain] = [];
                                }
                                sender_map[domain].push( ChEx.h(addr) );
                            }
                        }
                        return $(`
                            <div>
                                ${Object.keys(sender_map).sort().map(domain => `
                                    <div class="chex-gmail-checkable" style="padding: 2px; margin: 20px 0; background-color: #DDDDDD; font-family: monospace;">
                                    <div style="margin: 0; padding: 2px; font-weight: bold; font-size: large;">${domain}</div>
                                    <div style="margin: 0; padding: 2px; background-color: white; line-height: 1.2;">${sender_map[domain].sort().join("<br/>\n")}</div>
                                    </div>
                                `).join('')}
                            </div>
                        `);
                    },
                });
                dialog.open();
                dialog.addButton('送信', () => {
                    dialog.close();
                    $sendButton.click();
                });
            });
            $sendButton.before($confirmButton);
        });
    });
});
