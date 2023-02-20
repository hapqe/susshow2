window.addEventListener('message', (e) => {
    const k = Object.keys(e.data)[0];
    playSound(k);
    
    if(e.data.woosh) {
        woosh();
    }

    if(e.data.blink) {
        blink();
    }

    if(e.data.clouds) {
        clouds();
    }

    if(e.data.transition) {
        transition();
    }

    if(e.data.flash) {
        flash();
    }

    if(e.data.rainbow || e.data.playcollect) {
        rainbow();
    }

    if(e.data.darken) {
        darken();
    }
});

let playing = new Map();

function playSound(k) {
    if(!k) return;
    
    if(k.startsWith('stop')) {
        const s = slice(k);
        playing.get(s)?.pause();
        playing.get('c_' + s)?.pause();
        playing.delete(s);
        playing.delete('c_' + s);
    }
    if(k.startsWith('loop')) {
        const s = slice(k);
        play(s);
    }
    if(k.startsWith('play')) {
            const s = slice(k);
        play(s);
    }
    if(k.startsWith('fade')) {
        const s = slice(k);
        const a = play(s, true);
        const on = () => {
            setTimeout(() => {
                play('c_' + s, true);
            }, a.duration * 500);
            a.removeEventListener('canplaythrough', on);
        };
        
        a.addEventListener('canplaythrough', on);
    }

    function slice(k) {
        return k.slice(4).toLocaleLowerCase();
    }

    function play(k, l = false) {
        let a = new Audio();
        a.loop = l;
        a.src = `./sounds/${k}.mp3`;
        a.load();
        a.addEventListener('canplaythrough', () => {
            a.play();
        });
        playing.set(k, a);
        return a;
    }
}

function test() {
    frame.contentWindow.postMessage({test: true}, '*');
}

async function blink() {
    const c = document.querySelector('#blink').classList;
    c.add('blink');
    c.remove('flash');
    c.remove('rainbow-flash');
    c.remove('darken');
    
    await new Promise((resolve) => setTimeout(resolve, 1400));
}

async function darken() {
    const c = document.querySelector('#blink').classList;
    c.add('darken');
    c.remove('flash');
    c.remove('rainbow-flash');
    c.remove('blink');
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
}

async function flash() {
    const c = document.querySelector('#blink').classList;
    c.add('flash');
    c.remove('darken');
    c.remove('rainbow-flash');
    c.remove('blink');
    
    await new Promise((resolve) => setTimeout(resolve, 500));
}

async function rainbow() {
    const c = document.querySelector('#blink').classList;
    c.add('rainbow-flash');
    c.remove('flash');
    c.remove('darken');
    c.remove('blink');

    await new Promise((resolve) => setTimeout(resolve, 500));
}

function woosh() {
    let woosh = document.getElementById('woosh');
    let translation = woosh.style.transform;
    if(translation == 'translateX(-100%)') {
        woosh.style.transform = 'translateX(100%)';
    }
    else {
        woosh.style.transform = 'translateX(-100%)';
    }

    playSound('playwoosh');
}

async function transition() {
    playSound('playcomplete')
    
    let s = document.getElementById('star')
    s.style.animation = 'star 1s forwards';

    await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function hideTransition() {
    let s = document.getElementById('star')
    s.style.animation = 'fade 1s forwards';
    await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function clouds() {
    document.querySelector('#info h5').classList.add('invert');
    playSound('playtornado')
    let c = document.getElementById('clouds');
    c.classList.add('show');
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function hideClouds() {
    document.querySelector('#info h5').classList.remove('invert');
    let c = document.getElementById('clouds');
    c.classList.remove('show');

    await new Promise((resolve) => setTimeout(resolve, 1000));
}