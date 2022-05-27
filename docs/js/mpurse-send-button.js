class MpurseSendButton extends HTMLElement { // 投げモナボタン（Mpurse APIを使用する）
    // <mpurse-send-button 
    //   to="宛先アドレス" 
    //   asset="MONA"
    //   amount="0.11411400"
    //   memo="Good job!"
    //   title="投げモナする" 
    //   img="0,1,2,coin-mark,coin-monar,monar-mark" 
    //   img-src="https://...png" 
    //   img-size="64"
    //   ok-msg="投げモナしました！\nありがとうございます！（ ´∀｀）"
    //   ng-msg="キャンセルしました(´・ω・｀)"
    // ></mpurse-send-button> img-src="0,1,2"（coin-mark,coin-monar,monar-mark）
    constructor() {
        super();
        try {
            window.mpurse.updateEmitter.removeAllListeners()
              .on('stateChanged', isUnlocked => this.stateChanged(isUnlocked))
              .on('addressChanged', address => this.addressChanged(address));
        } catch(e) { console.debug(e) }
        this.text = '投げモナする'
        this.title = '投げモナする'
        this.img = null
        this.imgSrc = null
        this.imgSize = '64'
        this.to = null
        this.asset = 'MONA'
        this.amount = '0.11411400'
        this.memo = null
        this.okMsg = '投げモナしました！\nありがとうございます！（ ´∀｀）'
        this.ngMsg = 'キャンセルしました(´・ω・｀)'
        this.icon = new MonacoinIconBase64()
    }
    static get observedAttributes() {
        return ['to', 'asset', 'amount', 'memo', 'img', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
    }
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'closed' });
        const button = await this.#make()
        await this.#makeClickEvent()
        console.debug(button.innerHTML)
        shadow.innerHTML = `<style>a,img{cursor:pointer;text-align:center;vertical-align: middle;}</style>${button.innerHTML}` 
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        if ('img-src' === property) { this.imgSrc = newValue}
        else if ('img-size' === property) { this.imgSize = newValue}
        else if ('ok-msg' === property) { this.okMsg = newValue}
        else if ('ng-msg' === property) { this.ngMsg = newValue}
        else { this[property] = newValue; }
    }
    stateChanged(isUnlocked) {
        console.debug(`Mpurseのロック状態が変更されました：${isUnlocked}`)
    }
    addressChanged(address) {
        console.debug(`Mpurseのログイン中アドレスが変更されました：${address}`)
        this.to = address
        this.#make().then(
            result=>{this.innerHTML = ''; this.appendChild(result); }, 
            error=>{console.debug('アドレス変更に伴いボタン更新を試みましたが失敗しました。', e);})
    }
    async #make() {
        const a = await this.#makeSendButtonA()
        const img = this.#makeSendButtonImg()
        a.appendChild(img)
        return a
    }
    async #makeClickEvent() {
        const to = this.to || await window.mpurse.getAddress()
        const asset = this.asset || 'MONA'
        const amount = Number(this.amount) || 0.11411400
        const memoType = (this.memo) ? 'plain' : 'no' // 'no', 'hex', 'plain'
        const memo = this.memo
        this.addEventListener('click', async(event) => {
            console.debug(`クリックしました。\n宛先：${to}\n金額：${amount} ${asset}\nメモ：${memo}`)
            const txHash = await window.mpurse.sendAsset(to, asset, amount, memoType, memo)
            console.debug(`送金しました。\ntxHash: ${txHash}\n宛先：${to}\n金額：${amount} ${asset}\nメモ：${memo}`)
            alert(`投げモナしました！\n宛先：${to}\n金額：${amount} ${asset}\nメモ：${memo}`)
        });
    }
    #makeSendButtonA() {
        const a = document.createElement('a')
        a.setAttribute('title', this.title)
        return a
    }
    #makeSendButtonImg() {
        const img = document.createElement('img')
        const size = this.#parseImgSize()
        const [width, height] = this.#parseImgSize()
        img.setAttribute('width', `${width}`)
        img.setAttribute('height', `${height}`)
        img.setAttribute('src', `${this.#getImgSrc()}`)
        return img
    }
    #getImgWidth() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[0] : this.imgSize) }
    #getImgHeight() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[1] : this.imgSize) }
    #parseImgSize() {
        if (0 <= this.imgSize.indexOf('x')) { return this.imgSize.split('x').map(v=>(parseInt(v)) ? parseInt(v) : 64) }
        else { return (parseInt(this.imgSize)) ? [parseInt(this.imgSize), parseInt(this.imgSize)] : [64, 64] }
    }
    #getImgSrc() {
        if (this.imgSrc) { return this.imgSrc }
        if (this.img) {
            const num = parseInt(this.img)
            if (isNaN(num)) {
                const key = this.icon.getKey(this.img, this.imgSize)
                return (this.icon.Base64.has(key)) ? this.icon.Base64.get(key) : this.icon.Default }
            else {
                if (this.icon.Base64.size <= num) { return this.icon.Default }
                if (num < this.icon.Base64.size) { return [...this.icon.Base64.values()][num] }
                return this.icon.get(this.img, this.imgSize)
            }
        }
        return this.icon.Default
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('mpurse-send-button', MpurseSendButton);
});
class MonacoinIconBase64 {
    constructor() {
        this.base64 = new Map()
        this.base64.set('coin-mark-64', null)
        this.base64.set('coin-monar-64', null)
        this.base64.set('monar-mark-64', null)
        this.base64.set('coin-mark-256', null)
        this.base64.set('coin-monar-256', null)
        this.base64.set('monar-mark-256', null)
        this.#setBase64()
    }
    get Default() { return this.base64.get('coin-mark-64') }
    get Base64() { return this.base64 }
    get(name, size) { return this.base64.get(this.getKey(name, size)) }
    getKey(name, size) { return `${name}-${this.getSize(size)}` }
    getSize(size) { return (64 < size) ? 256 : 64 }
    #setBase64() {
        this.base64.set('coin-mark-64', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAUVBMVEVHcEwAAAAAAAABAQABAQABAAAAAAAAAAAAAAAAAAABAAAAAAD/zgDtvwAiGwASDgCbfQCrigA1KwBVRQDasADJogC8mABENwBqVQB8ZACMcQCK/yEVAAAAC3RSTlMA2lhCDqqL6nLGJBqD3qwAAAMPSURBVFjDpVfbgqsgDBRvYEGuopb//9BDVVADtno2T7uURGYmCaQorqwibdMhjFDXtKQqntmLdFRMs1PjOCrl5knQjrxuu5cdndzATja4iXblLXeCuetZxnrHEfn9dcQVuzTF0Xc26kZI9tWkaOpr/wqbnv2w3uDLQxAq2Q2T4oKJVlh2y6xoc/4NH9hNG3iT+f59/0+E5AxEPPD3ESAPFbXskVl60qLGkj00iY/50Bj22MyByFL0zwP0ItZWjST7D3MogCAcxJYfO6kyKG8SnJOTwKCCDH/sRMu8LIF9auOx5JDgZTc9fo8vK2+wka8sdA6svyn83nomCrVy3dL/KJRgSrZvITUUgn76JJkgvet5qUhWKNw5fWjsZBKXAgxDWIH1Ij2GOlm1YfsMECQy+Mh1UfGkc4btEYMOK5BuJqqCJGUQv0dHgCCRgRlSNO9kkQIMLi7o5GNNymGkPGLQNAF1YBGNcHHZuuaC3RHoJDs/NqICjwmzC98iYlgRqCMrewBcYJsVYVjKh8fEnPqsDDYTYBWBjQHD6ilXauZMgDEngqdbbPUnN/DrQVIICGaX3gQ3G4bg+M7J4ElMZAyVv3ERscucDF5GkEi9jUm/YpChimxOBp9IeyqP9GhmI2MKGRjIhKm8FxMMoPZ/XMxQIAOvfDkHWJYLb1vOinnvC1sfyMjQ+3IuwKWg96oz5xraU+vUUIrWxBN8bHXhfI7dOXTjjAymPTZVyMGOYTj8bpOmGjEkAUJ75sdeKSEC35ZDm+i9rZXg/zjcMCFTBLxcNNmuthHcYfzcn23K71YI2+1KDp3qPWmto9jzNE06Kuf8T9okB8jcrvdM7W+Uvz4w/O00Pw8wd8cB4zkIhU8DSCkePvMGUcKH6iMa+vSp2jyJ0Osm99ju/+Tvp5W7z+3sY30dGG5pofLjwqIFnn+PPDP+Mv29Ov7jEIp3rx9Tox6v3UeNf06OdYv1xdNZatzWN0bXmiBhFCCjV0YgUt+dnqsWUW6csnYYrFXOaIrahxP8q/TTP/ZdTGA//5eXzP0D/fmd15N2BgcAAAAASUVORK5CYII=')
        this.base64.set('coin-monar-64', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAllBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAQDwofGQAAAAAAAAAAAAAAAAADAgD/////zgACAQH6ygDyxABmUgAwJwE+MgD29vbX19exjwDXrgBpaWmggQB5eXnn5+d5YQDpvADEnwC0tLTIyMi8mAA1NTUlJSSNcgBSQgDPpwBHRkZVVVVIOgCHh4aQkI/gtACioqKYmJhHPhzyHaTkAAAADnRSTlMAlj1817DG/v1WaSgR5IduBAwAAARASURBVFjDlVfnmqowEBUEEnWBoQkWmigqqLvv/3Q3pBB0A8s9P8QPMpPMmZrFYgz6WjMtw7YNy9TW+tfiv7BZW6jNDtXO9/3XrjhkLbKWm9niKwtnhee+wSsybK1mia/ttnKVKK72+k9x3bju3FG8AmP6FF9mWLiTuEXmBJ+6nXnuX6htfdR6TLb3p8XJ5xtequWX4YusSOop+SIjP3mkqeS1iG6ewQSJPo6oT68KDUsm70YQjvMQAHgjGtYhNx4BZGPyCQA/nxd98KDjF1uzg+YCI67MMRzhIP6/+eLLFjIHeJ4Aq11xhZ8YAhEQ9jAetExaeXKO/ao3HODuOBD18WAODJC8RbB1tmdQZEOOUOo4ZxBLvVBGtdGv9+DsOI7SCGIA+bSHWx/VRp++rQx12JNV1Ai/qoNrRNAGdfJiBjjOt2CxUyly07gN7Oy2cbYXwECBEHtiQHH3JR7ws7P5AaJhpJy6ZcQIdH+U8ZZqi8tng+BJPzgQDqxiLJiJfNVxSBHzZ4+YPyWLrltZNAaQfMM4nMSARdfFXZ1cD5zOOZzCkEU3W35YwDmcwpBFt+hsQNLlO8w5nAICuaOHSAuQrL6woHoKJzSI01ZfrPoT+SE8nBkoAfU1J1svlrWMgb0zC9+y5hw0yWEF5+08BcSVInsLc2HdRHJBPFO+i3RRf6yFtRMe7A0oH49S4b/H4ymN4My9jIXFdYWQ9iSpjdkDHMX/CzDn570CUgvFTmiMDKJBnOzB47FTwEyo4bu3j8mn6cDomGtAsYjHq1Bg3ni94evLZs/kUSMVPPnWx0ZEygULEjXmRow+D3yXYZ0i9GlUw0ioTBFIv/M4hsuR4y7s+5XVJJBYKHus4n1yJvC7ShxZ9yGhzJJJpSBFUJ46XBQ5yhVEpD/Z1BikKEVPFlslNCqX7ng682QIkTJiY/qb/v52pyRWXXdiJASqTCg7wx4y/gZgbgzWfVFVF7M7lAoX9oXNw7TBml1U5goWqSub3y6kHHaGJ6y/6rSxtMps3oOy0G8RPXbL26tV0HrSKFcqy+yTVpS+u7LeFoGiCDg/KrWEF192tu4ICW0qF1UWp0puO9oqQ073dBzIlEYo8ICW1sDBlKQFjMdZZfkHcN7t9zbpGQlrDPvtDHnaFgrjbeje4O5lHsI9/aMgHwHfaBcbjnlE14oey7/CpZxsrWegE7UfrkZG1RqgSSe2h6Bb5kdL1bCe0yoXAeyVLSY9IsA0dZXy3XWBFegkJPH7/NCRft/JxFXTnvgKRy4MK8T7ZNKSMnZpHuUpTtP4VD73F/IiPLCWWuHRe9PGCPi0kR+uCIZoa94CvcyYukBqWI4fr6rOAoKsTuQdpMLa9CV2Y0XVxI2ntfQZ99booBz3vSQy5t1ddRMFSf5xW0oCZOqzb89fK9MOyYxd7AiKpA5C21z95wV+sVktyf2fwNSWq3Hi/wFgNtTuiIirFAAAAABJRU5ErkJggg==')
        this.base64.set('monar-mark-64', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAV1BMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/zgAlHgAUEAA6LgCrigDtwADGoABfTADitgB0XgCMcQBPQAC2kwDWrQD5ygCcfgAXTbavAAAADHRSTlMA3YUTVyQ68L+hC2r0x6o7AAADZklEQVRYw5VX2YKDIAysJ2qDeOL5/9+5HIIEpbp52bWQwEwmAT4fx7Ls88KyJDiUFm8CFGlwKIb42f/XpAIgf/LPAcL7JABR9du/igBIkB0ABuUTAAYQ4jqFun0AIQC0NaTB6DMdIEp+AhjoHGSxgIl2P0GUwDo6BVkk0FO6QHCHAiMslPYhFgWHHaUCBAmASCQASrsQi4JDKsfrEAgFQFiIxVjFNyCq/BuXhbIy/uaJAaD2WAY5PCaQUugFW1SSY4Egi4pDBYJJD9YMfNrbdp/40OhfOj0eYPHgUFrLhn2kyMZ9YPvx/3bP4sHhG7tnsTQQn+2eRcvhs92zaDl8tlsW85PDR9tuajYj0NDX1gDJL/71mbi2kbY5Hov6xW5xrIFkXpk4/pQr7bWId2knSSIC6hsFsBXtUJqT1U0pEXZHWMzNxBdwBvR0dmJYdD1wlAn4OgS4Q7LglS0eAtHxkBgsDSXUG04zYAwHAqz1zfaNzF1L2n4EYB4CTymLqanSVwA383v/h9VTg9pCRVDChM1mPkek4jRIuQCpVBmzza9WQJh78CPawOldGXdnH+sxApwGOSAxRD6CVc1tzhVr++21nBYioWIAr3upJNS7ddAIdCYw2BEgkWVMb5LQdJZ2/xuRkN+0wllvXu15Mgh2nYr22hyvAQ6HSS1sKOnOgE8BtoP/Uf0dbaDBq9BgALOiWdKsbAL5ARwSt1Gaop+N46Y9zEaOgriS6KSxR4dhr7fCzcI2EpJc4grJC3BKWnPHcI9Q9RghKY+zNDWvnufVkfBqG910lXJq637rpOmyExwcdFoFX9Ogz8iEmH35ECwGfvQwLw2LosBpKJcAHPWRFnUpJdnSHGq6bFdLAZslByZi7Qnk5Dz/XHsaQspQG/EOl8aeDKKtT/hQmVAz7HGR2LZ+3lNip06XVpiRyyg/bAX28mM9FR+7R1s90n+ZOBzdS4ZIZd39x7/zj2d8vD/7Xy8IuYiwvvVf64u/isDad/4tu/EXKMTtdnhBRCeUEt1e16tSSHDfHu5XuxBXGXqZ5ZE8ELZf7kJM0Y9XVRWLlx/jATZXLlYn8e+HYSJDQM0Xj41u4VLJJE4en7ZVWuganPnULouQ9sRn3RmKtPq8suRbEv/BQYpv9vmPZal88UTSxJsnDTr/AXeFlPu9mpqjAAAAAElFTkSuQmCC')
        this.base64.set('coin-mark-256', 'data:image/png;base64,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')
        this.base64.set('coin-monar-256', 'data:image/png;base64,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')
        this.base64.set('monar-mark-256', 'data:image/png;base64,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')
    }
}
