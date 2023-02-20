"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_fingerprint_1 = __importDefault(require("express-fingerprint"));
const fs_1 = __importDefault(require("fs"));
const bad_words_1 = __importDefault(require("bad-words"));
const port = 8000;
const app = (0, express_1.default)();
app.use(express_1.default.static('public'));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use((0, express_fingerprint_1.default)());
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
app.post('/playedthrough', (req, res, next) => {
    userData(req, { playedThrough: true });
});
app.post('/madedesign', (req, res, next) => {
    userData(req, { madeDesign: true });
});
app.post('/secret', (req, res, next) => {
    if (req.body.secret && typeof req.body.secret === 'string' && req.body.secret.length < 100)
        userData(req, { secrets: { [req.body.secret]: true } });
});
app.get('/usersecrets', (req, res, next) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        let data = yield userData(req);
        res.send(data.secrets);
    }))();
});
app.get('/userData', (req, res, next) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        let data = yield userData(req);
        res.send(data);
    }))();
});
app.post('/submitdesign', (req, res, next) => {
    if (req.body.design) {
        saveDesign(req);
    }
});
function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object)
            Object.assign(source[key], deepMerge(target[key], source[key]));
    }
    Object.assign(target || {}, source);
    return target;
}
function userData(req, data) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let hash = (_a = req.fingerprint) === null || _a === void 0 ? void 0 : _a.hash;
        let path = `./users/${hash}.json`;
        let json;
        try {
            json = JSON.parse(yield fs_1.default.promises.readFile(path, 'utf8'));
        }
        catch (_b) {
            json = {};
        }
        if (data) {
            json = deepMerge(json, data);
            // check if json is larger than 10kb
            if (JSON.stringify(json).length > 10000) {
                console.log('User data too large');
                return;
            }
            yield fs_1.default.promises.writeFile(path, JSON.stringify(json));
        }
        return Object.assign({ isUserData: true }, json);
    });
}
// async function deleteUserData(req: Request) {
//     let hash = req.fingerprint?.hash;
//     let path = `./users/${hash}.json`;
//     try {
//         await fs.promises.unlink(path);
//     }
//     catch {
//         console.log('User data not found');
//     }
// }
function incrementDesignCount(req, id = "buyCount") {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let path = `./users/${req.body.id}.json`;
        let name = req.body.date;
        let json;
        try {
            json = JSON.parse(yield fs_1.default.promises.readFile(path, 'utf8'));
        }
        catch (_b) {
        }
        const design = (_a = json === null || json === void 0 ? void 0 : json.designs) === null || _a === void 0 ? void 0 : _a[name];
        if (typeof design === 'undefined')
            return;
        const count = (design === null || design === void 0 ? void 0 : design[id]) || 0;
        json.designs[name][id] = count + 1;
        yield fs_1.default.promises.writeFile(path, JSON.stringify(json));
    });
}
function saveDesign(req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let hash = (_a = req.fingerprint) === null || _a === void 0 ? void 0 : _a.hash;
        let time = Date.now();
        let name = `${hash}_${time}`;
        let path = `./designs/${name}.png`;
        let data = req.body.design;
        try {
            let buffer = Buffer.from(data.split(',')[1], 'base64');
            const isBase64png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
            if (!isBase64png) {
                console.log('Not a valid base64 png');
                return;
            }
            yield fs_1.default.promises.writeFile(path, buffer);
            userData(req, { designs: { [time]: {} } });
        }
        catch (_b) {
            console.log('Error saving design');
        }
    });
}
function getDesign(req, { notFromUser = false, savedDesign = false }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const designs = yield fs_1.default.promises.readdir('./designs');
        const count = designs.length;
        const i = () => Math.floor(Math.random() * count);
        let index = i();
        let hash = (_a = req.fingerprint) === null || _a === void 0 ? void 0 : _a.hash;
        let maxTries = 10;
        if (notFromUser && hash) {
            while (designs[index].startsWith(hash)) {
                index = i();
                maxTries--;
                if (maxTries == 0)
                    break;
            }
        }
        if (savedDesign && hash) {
            while (!designs[index].startsWith(hash)) {
                index = i();
                maxTries--;
                if (maxTries == 0)
                    break;
            }
        }
        if (!designs[index])
            return;
        let path = `./designs/${designs[index]}`;
        let data = yield fs_1.default.promises.readFile(path, 'base64');
        return {
            isDesign: true,
            design: `data:image/png;base64,${data}`,
            stamp: designs[index]
        };
    });
}
// async function getDesignFromUser(user: string, not = false) {
//     const designs = await fs.promises.readdir('./designs');
//     const count = designs.length;
//     let index = Math.floor(Math.random() * count);
//     while(!designs[index].startsWith(user) == not) {
//         index = Math.floor(Math.random() * count);
//     }
//     let path = `./designs/${designs[index]}`;
//     let data = await fs.promises.readFile(path, 'base64');
//     return {
//         isDesign: true,
//         design: `data:image/png;base64,${data}`,
//         stamp: designs[index]
//     };
// }
function getNamedDesign(req, name) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let hash = (_a = req.fingerprint) === null || _a === void 0 ? void 0 : _a.hash;
        const filename = `${hash}_${name}`;
        const path = `./designs/${filename}.png`;
        let data;
        try {
            data = yield fs_1.default.promises.readFile(path, 'base64');
        }
        catch (_b) {
        }
        return {
            isDesign: true,
            design: `data:image/png;base64,${data}`,
            stamp: filename
        };
    });
}
function deleteNamedDesign(req, name) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let hash = (_a = req.fingerprint) === null || _a === void 0 ? void 0 : _a.hash;
        const filename = `${hash}_${name}`;
        const path = `./designs/${filename}.png`;
        try {
            yield fs_1.default.promises.unlink(path);
        }
        catch (_b) {
        }
        let userPath = `./users/${hash}.json`;
        let json;
        try {
            json = JSON.parse(yield fs_1.default.promises.readFile(userPath, 'utf8'));
            delete json.designs[name];
            yield fs_1.default.promises.writeFile(userPath, JSON.stringify(json));
        }
        catch (_c) {
        }
    });
}
app.post('/design', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    getDesign(req, Object.assign({}, req.body)).then(d => res.send(d));
}));
app.post('/getdesign', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    getNamedDesign(req, req.body.designName).then(d => res.send(d));
}));
app.post('/deletedesign', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    deleteNamedDesign(req, req.body.designName).then(d => res.send(d));
}));
app.post('/inctrades', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    incrementDesignCount(req, "tradeCount").then(d => res.send(d));
}));
app.post('/incsells', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    incrementDesignCount(req, "buyCount").then(d => res.send(d));
}));
app.post('/submittime', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    userTime(req, res);
}));
function userTime(req, res) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const time = req.body.time;
        if (typeof time !== 'number')
            return;
        if (time < 0)
            return;
        const hash = (_a = req.fingerprint) === null || _a === void 0 ? void 0 : _a.hash;
        if (!hash)
            return;
        const userPath = `./users/${hash}.json`;
        let json = {};
        try {
            const file = yield fs_1.default.promises.readFile(userPath, 'utf8');
            json = JSON.parse(file);
        }
        catch (_c) {
        }
        const current = (_b = json === null || json === void 0 ? void 0 : json.time) !== null && _b !== void 0 ? _b : Number.MAX_VALUE;
        let send = {};
        if (time < current) {
            send = yield uploadTime(req, res, './total.json');
            send = Object.assign(Object.assign({}, send), yield uploadTime(req, res, './weekly.json'));
            if (send.error) {
                res.send(send);
                return;
            }
            send.newRecord = true;
            json.time = time;
            yield fs_1.default.promises.writeFile(userPath, JSON.stringify(json));
        }
        res.send(send);
    });
}
function uploadTime(req, res, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, time } = req.body;
        if (typeof time !== 'number' || typeof name !== 'string') {
            return { error: 'Name oder Zeit ist inkorrekt' };
        }
        if (name.length < 3) {
            return { error: 'Name zu kurz' };
        }
        if (name.length > 20) {
            return { error: 'Name zu lang' };
        }
        const filter = new bad_words_1.default();
        if (filter.isProfane(name)) {
            return { error: 'Name ist unangebracht' };
        }
        const hash = req.fingerprint.hash;
        let json = {};
        try {
            const file = yield fs_1.default.promises.readFile(path, 'utf8');
            json = JSON.parse(file);
        }
        catch (_a) {
        }
        json[hash] = {
            name,
            time
        };
        yield fs_1.default.promises.writeFile(path, JSON.stringify(json));
    });
}
function getTop10(req, path) {
    return __awaiter(this, void 0, void 0, function* () {
        let json = {};
        try {
            const file = yield fs_1.default.promises.readFile(path, 'utf8');
            json = JSON.parse(file);
        }
        catch (_a) {
        }
        const entries = Object.entries(json);
        // @ts-ignore 
        entries.sort((a, b) => a[1].time - b[1].time);
        // @ts-ignore
        const ret = entries.slice(0, 10).map(e => ({ hash: e[0], name: e[1].name, time: e[1].time }));
        const hash = req.fingerprint.hash;
        const user = json[hash];
        const inRet = ret.find(e => e.hash === hash);
        const inEntries = entries.find(e => e[0] === hash);
        if (!inEntries)
            return ret;
        if (!inRet) {
            return [...ret, { hash, name: user.name, time: user.time, you: true, rank: entries.indexOf(inEntries) + 1 }];
        }
        else {
            // @ts-ignore
            inRet.you = true;
            return ret;
        }
    });
}
app.post('/total', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    getTop10(req, './total.json').then(d => res.send(d));
}));
app.post('/weekly', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    getTop10(req, './weekly.json').then(d => res.send(d));
}));
