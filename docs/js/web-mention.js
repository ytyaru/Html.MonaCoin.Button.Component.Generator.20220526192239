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
    constructor(per=20, target=null) {
        this.dateDiff = new DateDiff()
        this.target = (target) ? target : location.href
        this.per = (0 < per) ? per : 20
        console.log(this.target)
    }
    async make() {
        this.dateDiff.Base = new Date()
        await this.#count()
        await this.#comment()
    }
    async #count() {
        const res = await fetch(`https://webmention.io/api/count?target=${this.target}`)
        let json = await res.json()
        console.log(json)
        document.getElementById('web-mention-count').textContent = `${json['count']} mensions`
        //json = this.#getTestCount()
        //if (0 < json['count']) { document.getElementById('web-mention-count').textContent = `${json['count']} mensions` }
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
    async #comment() {
        this.#setupTippy()
        const res = await fetch(`https://webmention.io/api/mentions.jf2?target=${this.target}&sort-by=published&sort-dir=down&per-page=${this.per}&page=0`)
        const json = await res.json()
        console.log(json)
        //json.children = this.#getTestChildren()
        const comments = json.children.map(child=>this.#commentTypeA(child))
        document.getElementById('web-mention-comment').innerHTML = comments.join('')
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
    #author(author) {
        const name = author.name
        const photo = author.photo || ''
        return `<a href="" title="${name}"><img src="${photo}" alt="${name}"></a>`
    }
    #commentTypeA(child) { // コメント、日時、人（アイコン、名前）
        const content = child.content.html || child.content.text
        const diff = this.dateDiff.diff(Date.parse(child.published))
        return `<div class="mention"><div class="mention-meta"><a href="${child.author.url}"><img src="${child.author.photo}" alt="${child.author.name}" width="32" height="32"><span>${child.author.name}<span></a>　<span title="${this.dateDiff.Iso}">${diff}</span><div>${content}</div></div></div>`
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

