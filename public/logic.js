let frame = document.querySelector('iframe');

window.addEventListener('message', (e) => {
    if(e.data.secret) {
        showSecret(e.data.secret)
        post({
            secret: e.data.secret,
        }, '/secret');
    }
    if(e.data.fetchData) {
        userData();
    }
    if(e.data.fetchDesign) {
        delete e.data.fetchDesign;
        getDesign(e.data);
    }
    if(e.data.design) {
        (async () => {
            const content = await fetch('/lib/publish.html')
            const text = await content.text();
            
            const info = setInfoPage({
                hideTitle: true,
                content: text,
            });
            info.querySelector('#show').src = e.data.design;
            window.design = e.data.design;
            savedDesign = e.data.design;
            showInfoPage();
        })();
    }
    if(e.data.showPanel) {
        const name = e.data.showPanel;
        (async () => {
            const content = await fetch('/lib/' + name + '.html');
            const text = await content.text();
            setInfoPage({
                content: text,
                ...e.data,
            });
            showInfoPage();
        })();
    }
    if(e.data.collectCloth) {
        post({
            id: e.data.id,
            date: e.data.date,
        }, 'incsells');
    }
    if(e.data.tradeCloth) {
        post({
            id: e.data.id,
            date: e.data.date,
        }, 'inctrades');
    }
    if(e.data.tip) {
        showInfo(e.data.tip);
    }
    if(e.data.toHub) {
        setScene('scenes/hub');
    }
    if(e.data.stopTimer) {
        stopTimer();
    }
    if(e.data.publishTime) {
        (async () => {
            const res = await post(e.data, '/submittime');
            const body = await res.json();
            if(body.error) {
                showInfo(body.error);
            }
            else {
                setScene('scenes/hub');
            }
        })();
    }
    if(e.data.makeDesign) {
        hideInfoPage();
        window.onlyDesign = true;
        setScene('scenes/design');
    }
});

window.post = function (data, url = "/") {
    return fetch(url, { method: "post", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)});
}

const userData = async () => {
    if(!window.userData) {
        let data = await fetch('/userData', { method: "get", headers: { 'Content-Type': 'application/json' } });
        data = await data.json()
        window.userData = data;
        frame.src = data.playedThrough ? 'scenes/hub' : 'scenes/earth';
    }
    frame.contentWindow.postMessage({ ...window.userData, ...window.userData.secrets }, '*');
};

userData();

const getDesign = async (additional) => {
    let data;
    if(additional.savedDesign && typeof savedDesign !== 'undefined') {
        data = 
        {
            design: savedDesign,
            isDesign: true,
        }
    }
    else {
        data = await fetch('/design', { method: "post", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...additional }) });
        data = await data.json()
    }
    frame.contentWindow.postMessage({...data, time: additional.time}, '*');
};

function deleteUser() {
    post({ delete: true });
}

function setScreenSize() {
    let s = document.querySelector(':root').style;
    s.setProperty('--screen-width', window.innerWidth + 'px');
    s.setProperty('--screen-height', window.innerHeight + 'px');
}

setScreenSize();

window.addEventListener('resize', setScreenSize);

function setInfoPage(params) {
    let content = document.getElementById('info-page-content');
    if(params.title) {
        document.getElementById('info-page-title-text').innerText = params.title;
    }
    if(params.hideTitle) {
        document.getElementById('info-page-title').style.display = 'none';
    }
    else {
        document.getElementById('info-page-title').style.display = 'block';
    }
    if(params.content) {
        content.innerHTML = params.content;
    }
    if(params.icon) {
        document.getElementById('info-page-icon-left').src = 'svgs/' + params.icon + '.svg';
        document.getElementById('info-page-icon-right').src = 'svgs/' + params.icon + '.svg';
    }
    if(params.left) {
        document.getElementById('info-page-icon-left').src = 'svgs/' + params.left + '.svg';
    }
    if(params.right) {  
        document.getElementById('info-page-icon-right').src = 'svgs/' + params.right + '.svg';
    }
    if(params.padding) {
        document.getElementById('info-page-content').style.padding = params.padding;
    }
    return content;
}

function showInfoPage() {
    let info = document.getElementById('info-page');
    info.style.display = 'block';
    info.style.opacity = '1';
}

function hideInfoPage() {
    document.getElementById('info-page').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('info-page').style.display = 'none';
    }, 500);
}