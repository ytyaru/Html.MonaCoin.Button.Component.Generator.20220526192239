class DateDiff { // 〜時間前のような表記を生成する
    constructor() { this.base = Date.now(); this.elapsed = null; this.iso = null; this.target = null;}
    get Base() { return this.base }
    set Base(d) { if (d instanceof Date) { this.base = d } }
    get Elapsed() { return this.elapsed }
    get Iso() { return this.iso }
    diff (target) { // target: epochTime(Date.parse(`ISO8601`)の返り値)
        this.target = new Date(target)
        this.target.setHours(this.target.getHours() + 9)
        const diff = this.base.getTime() - this.target.getTime() // UTCから日本時間に合わせる
        this.elapsed = new Date(diff);
        this.iso = `${this.target.getFullYear()}-${(this.target.getMonth()+1).toString().padStart(2, '0')}-${this.target.getDate().toString().padStart(2, '0')} ${this.target.getHours().toString().padStart(2, '0')}:${this.target.getMinutes().toString().padStart(2, '0')}:${this.target.getSeconds().toString().padStart(2, '0')}`
        if (this.elapsed.getUTCFullYear() - 1970) { return this.elapsed.getUTCFullYear() - 1970 + '年前' }
        else if (this.elapsed.getUTCMonth()) { return this.elapsed.getUTCMonth() + 'ヶ月前' }
        else if (this.elapsed.getUTCDate() - 1) { return this.elapsed.getUTCDate() - 1 + '日前' }
        else if (this.elapsed.getUTCHours()) { return this.elapsed.getUTCHours() + '時間前' }
        else if (this.elapsed.getUTCMinutes()) { return this.elapsed.getUTCMinutes() + '分前' }
        else { return this.elapsed.getUTCSeconds() + '秒前' }
    }
}
class WebMention {
    constructor(per=30) {
        this.dateDiff = new DateDiff()
        this.target = location.href
        this.count = null
        this.mentions = null
        this.per = per
    }
    async make() {
        this.dateDiff.Base = new Date()
        await this.#count()
        await this.#mentions()
    }
    async #count() {
        const res = await fetch(`https://webmention.io/api/count?target=${this.target}`)
        //this.count = this.#getTestCount()
        this.count = await res.json()
        console.debug(this.count)
        document.getElementById('web-mention-count').textContent = `${this.count['count']} mensions`
        this.#setupTippy()
    }
    #setupTippy() {
        tippy('#web-mention-count', {
            theme: 'custom',
            allowHTML: true,
            interactive: true,
            trigger: 'click',
            arrow: false, // 吹き出し矢印の色は変えられなかったので消した
            placement: 'right',
            content: `<a href="https://ytyaru.github.io/">ここのURL</a>を書いて<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-text="いいね！" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>すると↓に表示されます。<a href="https://mstdn.jp/">mstdn.jp</a>か<a href="https://pawoo.net/">pawoo</a>でTootしても同じです。`,
        });
    }
    #getTestCount() { return {
        "count": 6,
        "type": {
            "bookmark": 1,
            "mention": 2,
            "rsvp-maybe": 1,
            "rsvp-no": 1,
            "rsvp-yes": 1
        }
    }}
    async #mentions() {
        const res = await fetch(`https://webmention.io/api/mentions.jf2?target=${this.target}&sort-by=published&sort-dir=down&per-page=${this.per}&page=0`)
        const mentions = await res.json()
        this.mentions = mentions
        console.debug(mentions)
        await this.#comment()
        await this.#like()
        await this.#bookmark()
    }
    async #comment() {
        //mentions.children = this.#getTestChildren()
        const comments = this.mentions.children.filter(child=>child.hasOwnProperty('content')).map(child=>this.#commentTypeA(child))
        document.getElementById('web-mention-comment').innerHTML = comments.join('')
    }
    async #like() { // ツイートでいう♥いいね！
        const htmls = this.mentions.children.filter(child=>child.hasOwnProperty('like-of')).map(child=>this.#author(child.author))
        const count = (this.count.type.hasOwnProperty('like')) ? this.count.type.like : 0
        document.getElementById('web-mention-hart').innerHTML = `<span title="いいね！">♥${count}</span>${htmls.slice(0,10).join('')}`
    }
    async #bookmark() {
        const htmls = this.mentions.children.filter(child=>child.hasOwnProperty('bookmark-of')).map(child=>this.#author(child.author))
        const count = (this.count.type.hasOwnProperty('bookmark')) ? this.count.type.bookmark : 0
        document.getElementById('web-mention-bookmark').innerHTML = `<span title="ブックマーク">🔖${count}</span>${htmls.slice(0,5).join('')}`
    }
    #author(author, size=32) {
        const name = author.name
        const photo = author.photo || ''
        return `<a href="${author.url}" title="${author.name}"><img src="${author.photo}" alt="${author.name}" width="${size}" height="${size}"></a>`
    }
    #commentTypeA(child) { // 人、日時、コメント（サーバが返すpublished日時テキストが不統一で正しくISO8601でないからバグる！）
        const content = child.content.html || child.content.text
        const diff = this.dateDiff.diff(Date.parse(child.published))
        return `<div class="mention"><div class="mention-meta">${this.#author(child.author)}　<span title="${this.dateDiff.Iso}">${diff}</span></div><div>${content}</div></div>`
    }
    #getTestChildren() {
        return [
            {
              "type": "entry",
              "author": {
                "type": "card",
                "name": "Tantek Çelik",
                "url": "http://tantek.com/",
                "photo": "http://tantek.com/logo.jpg"
              },
              "url": "http://tantek.com/2013/112/t2/milestone-show-indieweb-comments-h-entry-pingback",
              "published": "2013-04-22T15:03:00-07:00",
              "wm-received": "2013-04-25T17:09:33-07:00",
              "wm-id": 900,
              "content": {
                "text": "Another milestone: @eschnou automatically shows #indieweb comments with h-entry sent via pingback http://eschnou.com/entry/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html",
                "html": "Another milestone: <a href=\"https:\/\/twitter.com\/eschnou\">@eschnou<\/a> automatically shows #indieweb comments with h-entry sent via pingback <a href=\"http:\/\/eschnou.com\/entry\/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html\">http:\/\/eschnou.com\/entry\/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html<\/a>"
              },
              "mention-of": "https://indieweb.org/",
              "wm-property": "mention-of",
              "wm-private": false
            },
        ]
    }
}
