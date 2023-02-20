const text = document.querySelector('#text');

function showText(str, props = {}) {
    const after = props.after ?? 500;
    const color = props.color ?? 'white';
    const position = props.position ?? 'center';

    const wordCount = str.split(' ').length;
    text.innerHTML = str;
    text.style.color = color;

    let d = wordCount * 300;
    requestAnimationFrame(() => {
        text.classList.add('fade-in');
    });

    setTimeout(() => {
        text.classList.remove('fade-in');
    }, d);

    let a = 'center';
    switch (position) {
        case 'top':
        a = "start";
        break;
        case 'bottom':
        a = "end";
        break;
    }
    text.parentElement.style.alignItems = a;
        
    return Promise.any([
        new Promise((resolve) => setTimeout(resolve, d + 100)),
        new Promise((resolve) => {
            function disable() {
                text.classList.remove('fade-in');
                setTimeout(() => {
                    resolve();
                }, 100);
            }
            window.addEventListener('pointerdown', () => {
                disable();
            });
            frame.contentDocument.addEventListener('pointerdown', (event) => {
                disable();
            });
        })
    ]);
}