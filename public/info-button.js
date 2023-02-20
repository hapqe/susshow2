const infoWrapper = document.querySelector('.info-wrapper');

function showInfoButton() {
    infoWrapper.style.display = 'block';
}

function hideInfoButton() {
    infoWrapper.style.display = 'none';
}

function cycleInfo() {
    hideInfoButton();
    showParagraphs('text/' + fileName + '.txt');
}

let fileName;

function setInfoButtonContent(file) {
    if(playerRunning) return;
    showInfoButton();
    fileName = file;
}