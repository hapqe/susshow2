import express, { Express, Request } from "express";
import bodyParser from "body-parser";
import FingerPrint from "express-fingerprint"
import fs from "fs";
import BadWordsFilter from "bad-words";

const port = 8000;

const app: Express = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(FingerPrint())

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    }
);

app.post('/playedthrough', (req, res, next) => {
    userData(req, { playedThrough: true });
});

app.post('/madedesign', (req, res, next) => {
    userData(req, { madeDesign: true });
});

app.post('/secret', (req, res, next) => {
    if(req.body.secret && typeof req.body.secret === 'string' && req.body.secret.length < 100)
    userData(req, { secrets: {[req.body.secret]: true} });
});

app.get('/usersecrets', (req, res, next) => {
    (async () => {
        let data = await userData(req);
        res.send(data.secrets);
    })();
});

app.get('/userData', (req, res, next) => {
    (async () => {
        let data = await userData(req);
        res.send(data);
    })();
});

app.post('/submitdesign', (req, res, next) => {
    if(req.body.design) {
        saveDesign(req);
    }
});

function deepMerge(target: any, source: any) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object) Object.assign(source[key], deepMerge(target[key], source[key]))
    }

    Object.assign(target || {}, source)
    return target
}

async function userData(req: Request, data?: any) {
    let hash = req.fingerprint?.hash;

    let path = `./users/${hash}.json`;

    let json;
    
    try {
        json = JSON.parse(await fs.promises.readFile(path, 'utf8'));
    }
    catch {
        json = {};
    }

    if(data) {
        json = deepMerge(json, data);
        // check if json is larger than 10kb
        if(JSON.stringify(json).length > 10000) {
            console.log('User data too large');
            return;
        }
        
        await fs.promises.writeFile(path, JSON.stringify(json));
    }

    return { isUserData: true, ...json };
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

async function incrementDesignCount(req: Request, id = "buyCount") {
    let path = `./users/${req.body.id}.json`;
    let name = req.body.date;

    let json;
    
    try {
        json = JSON.parse(await fs.promises.readFile(path, 'utf8'));
    }
    catch {
    }

    const design = json?.designs?.[name];
    if(typeof design === 'undefined') return;
    
    const count = design?.[id] || 0;
    
    json.designs[name][id] = count + 1;
    await fs.promises.writeFile(path, JSON.stringify(json));
}

async function saveDesign(req: Request) {
    let hash = req.fingerprint?.hash;
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
        await fs.promises.writeFile(path, buffer);
        userData(req, { designs: {[time]: {}}});
    } catch {
        console.log('Error saving design');
    }
}

async function getDesign(req: Request, {notFromUser = false, savedDesign = false}) {
    const designs = await fs.promises.readdir('./designs');
    const count = designs.length;

    const i = () => Math.floor(Math.random() * count);
    
    let index = i();
    let hash = req.fingerprint?.hash;

    let maxTries = 10;
    if(notFromUser && hash) {
        while(designs[index].startsWith(hash)) {
            index = i();
            maxTries--;
            if(maxTries == 0) break;
        }
    }
    if(savedDesign && hash) {
        while(!designs[index].startsWith(hash)) {
            index = i();
            maxTries--;
            if(maxTries == 0) break;
        }
    }

    if(!designs[index]) return;
    
    let path = `./designs/${designs[index]}`;

    let data = await fs.promises.readFile(path, 'base64');

    return {
        isDesign: true,
        design: `data:image/png;base64,${data}`,
        stamp: designs[index]
    };
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

async function getNamedDesign(req: Request, name: string) {
    let hash = req.fingerprint?.hash;
    
    const filename = `${hash}_${name}`;
    const path = `./designs/${filename}.png`;

    let data: any;
    try {
        data = await fs.promises.readFile(path, 'base64');
    } catch {
        
    }

    return {
        isDesign: true,
        design: `data:image/png;base64,${data}`,
        stamp: filename
    };
}

async function deleteNamedDesign(req: Request, name: string) {
    let hash = req.fingerprint?.hash;

    const filename = `${hash}_${name}`;
    const path = `./designs/${filename}.png`;

    try {
        await fs.promises.unlink(path);
    }
    catch {

    }

    let userPath = `./users/${hash}.json`;

    let json;
    
    try {
        json = JSON.parse(await fs.promises.readFile(userPath, 'utf8'));
        delete json.designs[name];
        await fs.promises.writeFile(userPath, JSON.stringify(json));
    }
    catch {
    }
}

app.post('/design', async (req, res, next) => {
    getDesign(req, {...req.body}).then(d => res.send(d));
});

app.post('/getdesign', async (req, res, next) => {
    getNamedDesign(req, req.body.designName).then(d => res.send(d));
});

app.post('/deletedesign', async (req, res, next) => {
    deleteNamedDesign(req, req.body.designName).then(d => res.send(d));
});

app.post('/inctrades', async (req, res, next) => {
    incrementDesignCount(req, "tradeCount").then(d => res.send(d));
});

app.post('/incsells', async (req, res, next) => {
    incrementDesignCount(req, "buyCount").then(d => res.send(d));
});

app.post('/submittime', async (req, res, next) => {
    userTime(req, res);
});

async function userTime(req: Request, res: any) {
    const time = req.body.time;
    if(typeof time !== 'number') return;
    if(time < 0) return;

    const hash = req.fingerprint?.hash;
    if(!hash) return;

    const userPath = `./users/${hash}.json`;

    let json: any = {};

    try {
        const file = await fs.promises.readFile(userPath, 'utf8');
        json = JSON.parse(file);
    }
    catch {
    }

    const current = json?.time ?? Number.MAX_VALUE;
    
    let send: any = {};
    
    if(time < current) {
        send = await uploadTime(req, res, './total.json');
        send = {...send, ...await uploadTime(req, res, './weekly.json')};
        
        if(send.error) {
            res.send(send);
            return;
        }

        send.newRecord = true;
        json.time = time;
    
        await fs.promises.writeFile(userPath, JSON.stringify(json));
    }
    
    res.send(send);
}

async function uploadTime(req: Request, res: any, path: string) {
    const {name, time} = req.body;

    if(typeof time !== 'number' || typeof name !== 'string') {
        return {error: 'Name oder Zeit ist inkorrekt'}
    }

    if(name.length < 3) {
        return {error: 'Name zu kurz'}
    }
    
    if(name.length > 20) {
        return {error: 'Name zu lang'}
    }

    const filter = new BadWordsFilter();

    if(filter.isProfane(name)) {
        return {error: 'Name ist unangebracht'}
    }

    const hash = req.fingerprint!.hash;
    
    let json: any = {};

    try {
        const file = await fs.promises.readFile(path, 'utf8');
        json = JSON.parse(file);
    }
    catch {
    }

    json[hash] = {
        name,
        time
    };

    await fs.promises.writeFile(path, JSON.stringify(json));
}

async function getTop10(req: Request, path: string) {
    let json: any = {};

    try {
        const file = await fs.promises.readFile(path, 'utf8');
        json = JSON.parse(file);
    }
    catch {
    }

    const entries = Object.entries(json);

    // @ts-ignore 
    entries.sort((a, b) => a[1].time - b[1].time);

    // @ts-ignore
    const ret = entries.slice(0, 10).map(e => ({hash: e[0], name: e[1].name, time: e[1].time}));

    const hash = req.fingerprint!.hash;

    const user = json[hash];

    const inRet = ret.find(e => e.hash === hash);
    const inEntries = entries.find(e => e[0] === hash);

    if(!inEntries) return ret;
    if(!inRet) {
        return [...ret, {hash, name: user.name, time: user.time, you: true, rank: entries.indexOf(inEntries) + 1}];
    }
    else {
        // @ts-ignore
        inRet.you = true;
        return ret;
    }
}

app.post('/total', async (req, res, next) => {
    getTop10(req, './total.json').then(d => res.send(d));
});

app.post('/weekly', async (req, res, next) => {
    getTop10(req, './weekly.json').then(d => res.send(d));
});