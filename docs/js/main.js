window.addEventListener('DOMContentLoaded', async(event) => {
    console.debug('DOMContentLoaded!!');
    const mention = new WebMention(30) 
    await mention.make() 
    try {
        window.mpurse.updateEmitter.removeAllListeners()
          .on('stateChanged', isUnlocked => console.log(isUnlocked))
          .on('addressChanged', address => console.log(address));
        document.getElementById('address').value = await window.mpurse.getAddress()
    } catch(e) { console.debug(e) }
    const zip = new ZipDownloader()
    const gen = new MpurseSendButtonGenerator() 
    await gen.generate()
    document.getElementById('get-address').addEventListener('click', async(event) => {
        document.getElementById('to').value = await window.mpurse.getAddress()
        await gen.generate()
    })
    document.getElementById('to').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('amount').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('asset').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('memo').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('img').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('img-src').addEventListener('change', async(event) => { await gen.generate() })
    document.getElementById('img-size').addEventListener('change', async(event) => { await gen.generate() })
    document.getElementById('title').addEventListener('change', async(event) => { await gen.generate() })
    document.getElementById('ok-msg').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('ng-msg').addEventListener('input', async(event) => { await gen.generate() })
    document.getElementById('copy-to-clipboard').addEventListener('click', async(event) => { await gen.copy() })
    document.getElementById('download-zip').addEventListener('click', async(event) => { await zip.download() })
});
window.addEventListener('load', async(event) => {
    console.debug('load!!');
});
window.addEventListener('beforeunload', async(event) => {
    console.debug('beforeunload!!');
});

