const fs = require('fs')
const Insta = require('@androz2091/insta.js');
const {IgApiClient} = require('instagram-private-api')
const util = require('util')
const client = new Insta.Client();
const path = require('path')
const Canvas = require('canvas');
const { type } = require('os');
const { promisify } = require('util');
const { readFile } = require('fs');
const canvas = Canvas.createCanvas(1500, 1500)
const ctx = canvas.getContext('2d')
const readFileAsync = promisify(readFile)

const ig = new IgApiClient()

function fontFile (name) {
    return path.join(__dirname, '/fonts/', name)
}
  
Canvas.registerFont(fontFile('GmarketSansTTFBold.ttf'), {family: 'GmarketSansTTFBold'})

require('dotenv').config();


//get ID, PW, Admin ID from .env
const {prefix, ID, PW, adminList, adminChatId} = process.env;


//Set administrator
const admin = adminList.split('/')


//Login to Instagram Private API
async function login() {
    ig.state.generateDevice(ID);
    await ig.account.login(ID, PW);
};


//Function to upload img with Instagram Private API
function upload(count) {
    const postImage = async () => {
        await login();

        try {
            ig.state.generateDevice(ID);
            await ig.simulate.preLoginFlow();
            const user = await ig.account.login(ID, PW);
            const path = `./output/worker-${count}.png`;
            const published = await ig.publish.photo({
                file: await readFileAsync(String(path)),
                caption: `${String(count)}번째 포스트!`
            });
            consoleWriter(`${String(count)}번째 포스트 개시를 성공하였습니다.`);
        }catch(err){
            console.error(err);
        };
    };
    postImage();
}

//set Welcome Message
const welcomeMsg = "님 환영해요!\nwww.google.com 로 들어가\n이용 방법을 확인해 주세요!";


//Function to write log
function consoleWriter(text){
    let today = new Date();   
    let year = today.getFullYear(); // 년도
    let month = today.getMonth() + 1;  // 월
    let date = today.getDate();  // 날짜
    let day = today.getDay();  // 요일
    let hours = today.getHours(); // 시
    let minutes = today.getMinutes();  // 분
    let seconds = today.getSeconds();  // 초

    console.log(`[${year}/${month}/${date} // ${day}:${hours}:${minutes}:${seconds}] ${text}`);
    fs.readFile('./data/Logger.txt', 'utf8', function(err, data) {
        if (err) throw err;
        fs.writeFile('./data/Logger.txt', `[${year}/${month}/${date} // ${day}:${hours}:${minutes}:${seconds}] ${text}\n${data}`, err => {
            if (err) {
                console.error(err);
            }
        });
    });
};

//Draw image with text, and upload it!
function drawImage(text){
    const Image = Canvas.Image;
    let img = new Image();
    img.src = './assets/empty.png';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    if (text.length <= 5){
        ctx.font = '130pt GmarketSansTTFBold';
    } else if (text.length <= 10){
        ctx.font = '84pt GmarketSansTTFBold';
    } else {
        ctx.font = '36pt GmarketSansTTFBold';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#282828';
    if (text.length <= 5){
        ctx.fillText(text , 732, 755);
    } else if (text.length <= 10){
        ctx.fillText(text , 732, 740);
    } else if (text.length <= 20){
        ctx.fillText(text , 732, 725);
    } else if (text.length <= 40){
        ctx.fillText(`${String(text).slice(0, 20)}\n${String(text).slice(20)}`, 732, 703);
    } else if (text.length <= 60){
        ctx.fillText(`${String(text).slice(0, 20)}\n${String(text).slice(20, 40)}\n${String(text).slice(40)}`, 732, 682);
    } else {
        ctx.fillText(`${String(text).slice(0, 20)}\n${String(text).slice(20, 40)}\n${String(text).slice(40, 60)}\n${String(text).slice(60)}`, 732, 660);
    };
    fs.readFile('./data/daejeonCount.txt', 'utf8', function(err, data) {
        canvas.createJPEGStream().pipe(fs.createWriteStream(path.join(__dirname, `./output/worker-${Number(data) + 1}.png`)));
        upload(Number(data) + 1);
        fs.writeFile('./data/daejeonCount.txt', String(Number(data) + 1), err => {
            if (err) {
                console.error(err);
            }
        });
    });
};

//uptime
function uptime(seconds){
    function pad(s){
        return (s < 10 ? '0' : '') + s;
    }
    let hours = Math.floor(seconds / (60*60));
    let minutes = Math.floor(seconds % (60*60) / 60);
    let second = Math.floor(seconds % 60);
  
    return String('Uptime is.. \n' + pad(hours) + '시간 ' + pad(minutes) + '분 ' + pad(second) + '초');
}

//log message in console when login successed
client.on('connected', () => {
    console.clear()
    consoleWriter(`${client.user.username}에 로그인을 성공했습니다.`);
});

//set commands
client.on('messageCreate', (message) => {    
    if(message.content.startsWith(prefix + '익명')){
        if (message.content.substring(4).length <= 80){
            try {
                let numberOfMessage = message.content.length;
                drawImage(message.content.substring(4));
                message.chat.sendMessage(`업로드를 하고 있어요!\n잠시 후에 업로드가 완료될 거에요..`);
            }catch(err){
                console.error(err);
            };
        } else {
            message.chat.sendMessage('익명 서비스는 80자까지만 지원해요..:(');
        }
        fs.readFile('./data/daejeonHistory.txt', 'utf8', function(err, data) {
            if (err) throw err;
            fs.writeFile('./data/daejeonHistory.txt', `${message.authorID}\n${message.content.substring(4)}\n\n${data}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        });
        consoleWriter(`${message.authorID} wrote ${message.content.substring(4)}.`);
    };

    if (message.content.endsWith(' 익명이요')){
        if (message.content.substring(0, numberOfMessage-5).length <= 80){
            try {
                let numberOfMessage = message.content.length;
                drawImage(message.content.substring(0, numberOfMessage-5));
                message.chat.sendMessage(`업로드를 하고 있어요!\n잠시 후에 업로드가 완료될 거에요..`);
            }catch(err){
                console.error(err);
            };
        } else {
            message.chat.sendMessage('익명 서비스는 80자까지만 지원해요..:(');
        }
        fs.readFile('./data/daejeonHistory.txt', 'utf8', function(err, data) {
            if (err) throw err;
            fs.writeFile('./data/daejeonHistory.txt', `${message.authorID}\n${message.content.substring(0, numberOfMessage-5)}\n\n${data}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        });
        consoleWriter(`${message.authorID} wrote ${message.content.substring(0, numberOfMessage-5)}.`);
    }

    if(message.content.startsWith(prefix + '건의')){
        client.fetchChat(String(adminChatId)).then((chat) => {
            chat.sendMessage(`새로운 건의 사항이에요!\n${message.content.substring(4)}`);
          });
        fs.readFile('./data/suggestions.txt', 'utf8', function(err, data) {
            if (err) throw err;
            fs.writeFile('./data/suggestions.txt', `${message.authorID} - ${message.content.substring(4)}\n${data}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        });
        message.chat.sendMessage('건의 사항을 성공적으로 전송하였어요! 하나하나 확인 후 검토해 볼게요!');
        consoleWriter(`${message.authorID} uploaded new suggestions.`);
    }
    
    if(message.content === prefix + 'dev'){
        message.chat.sendMessage('http://damie.kr\n위 사이트에서 개발자 정보를 확인하세요!');
        consoleWriter(`${message.authorID} read developer info.`);
    };

    if(message.content.startsWith('client.')){
        if(admin.includes(String(message.authorID))){
            if(message.content.substring(7) === 'welcomeMsg'){
                message.chat.sendMessage(message.chat.name + welcomeMsg);
                consoleWriter(`${message.authorID} request Welcome Message.`)
            } else if (message.content.substring(7) === 'thisChatId') {
                message.chat.sendMessage(String(message.chat.id));
            } else if(message.content.substring(7).startsWith('chatTo')){
                let msgContent = message.content.split(' ');
                let usernameCount = msgContent[1].length;
                try {
                    client.fetchUser(msgContent[1]).then((user) => {
                        user.send(message.content.substring(11 + usernameCount));
                    });
                    message.chat.sendMessage('메시지를 성공적으로 전송하였습니다.')
                } catch(err){
                    message.chat.sendMessage('메시지 전송에 실패하였습니다. 콘솔을 확인해 주세요.')
                    console.log(err);
                };
            } else if(message.content.substring(7).startsWith('script')){
                /*해당 명령어는 위험한 기능이니 관리자 전용으로만 사용해 주세요!*/
                /*에러가 발생할 시 코드가 정지될 위험이 있습니다. 주의해 주세요! */
                try {
                    eval(message.content.substring(14));
                    console.log(message.author + ' used ' + message.content.substring(14))
                    consoleWriter(`${message.authorID} used unknown script.`);
                } catch (err) {
                    message.chat.sendMessage(String(err));
                    console.log(message.author + ' used ' + message.content.substring(14) + ', but error occured.')
                    consoleWriter(`${message.authorID} used unknown script, but there was an error.`);
                };
            } else if(message.content.substring(7).startsWith('findUserID')){
                client.fetchUser(String(message.content.substring(13))).then((user) => {
                    message.chat.sendMessage("해당 유저의 ID입니다.\n" + user.id);
                    consoleWriter(`${message.authorID} found ID of ${user.id}`);
                });
            } else if (message.content.substring(7).startsWith('block')) {
                client.fetchUser(String(message.content.substring(13))).then((user) => {
                    user.block();
                    message.chat.sendMessage(`${user.id} 님을 차단하였습니다.`);
                    consoleWriter(`${message.authorID} blocked ${user.id}`);
                });
            }  else if (message.content.substring(7).startsWith('unblock')) {
                client.fetchUser(String(message.content.substring(15))).then((user) => {
                    user.unblock();
                    message.chat.sendMessage(`${user.id} 님의 차단을 해제하였습니다.`);
                    consoleWriter(`${message.authorID} unblocked ${user.id}`)
                });
            } else if (message.content.substring(7) === 'uptime'){
                message.chat.sendMessage(uptime(Math.floor(process.uptime())))
                consoleWriter(`${message.authorID} called uptime.`)
            } else {
                message.chat.sendMessage('잘못된 명령어를 입력하신 것 같아요!');
            }
        } else {
            message.chat.sendMessage('해당 명령어는 관리자만 이용할 수 있는 기능이에요 o(TヘTo)');
            consoleWriter(`${message.authorID} tried to use admin command but failed.`)
        };
    };
});

//Reply to chat requests
client.on('pendingRequest', (chat) => {
    chat.approve;
    chat.sendMessage(chat.name + welcomeMsg);
    consoleWriter(`Chat-${chat.id} started.`)
});

//login to Instagram
client.login(ID, PW);  