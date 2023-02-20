const infoElement = document.getElementById('info');

function showAchievement(name) {
    showInfo(`Errungenschaft "<r>${name}</r>" freigeschaltet!`);
}

function showSecret(name) {
    showInfo(`Geheimnis "<r>${name}</r>" gefunden!`);
}

function showInfo(info) {
    if(playerRunning && !info.includes('<r>')) return;
    
    let open = !infoElement.classList.contains("up");
    if(open) {
        infoTime = 1e9;
        hideInfo();
        setTimeout(() => {
            showInfo(info);
            infoTime = defaultInfoTime;
        }, 300);
        return;
    }

    infoElement.querySelector('h5 t').innerHTML = info;
    infoElement.classList.remove("up");
    infoTime = defaultInfoTime;
}

function hideInfo() {
    document.getElementById('info').classList.add("up");
}

let infoTime;
let defaultInfoTime = 4;

// count time down, and if 0, hide info
setInterval(() => {
    if (infoTime > 0) {
        infoTime--;
    }
    else {
        hideInfo();
    }
}, 1000);

function setInfoMargin(margin) {
    infoElement.style.margin = margin;
}

function clearInfoMargin() {
    infoElement.style.margin = '';
}