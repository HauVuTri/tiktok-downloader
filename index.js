/*  by Naufal Taufiq Ridwan
    Github : https://github.com/n0l3r
    Don't remove credit.
*/

const fetch = require("node-fetch");
const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { exit } = require("process");
const { resolve } = require("path");
const { reject } = require("lodash");
const { Headers } = require('node-fetch');
const readline = require('readline');
const { time, log } = require("console");
var usernameGB = "";


//adding useragent to avoid ip bans
const headers = new Headers();
headers.append('User-Agent', 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet');
const headersWm = new Headers();
const descriptions = [];  // Array to store video descriptions
headersWm.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36');

const getChoice = () => new Promise((resolve, reject) => {
    inquirer.prompt([
        {
            type: "list",
            name: "choice",
            message: "Choose a option",
            choices: ["Mass Download (Username)", "Mass Download with (txt)", "Single Download (URL)"]
        }
    ])
        .then(res => resolve(res))
        .catch(err => reject(err));
});

const getInput = (message) => new Promise((resolve, reject) => {
    inquirer.prompt([
        {
            type: "input",
            name: "input",
            message: message
        }
    ])
        .then(res => resolve(res))
        .catch(err => reject(err));
});

const generateUrlProfile = (username) => {
    var baseUrl = "https://www.tiktok.com/";
    if (username.includes("@")) {
        baseUrl = `${baseUrl}${username}`;
    } else {
        baseUrl = `${baseUrl}@${username}`;
    }
    return baseUrl;
};

// const downloadMediaFromList = async (list) => {
//     const folder = "downloads/" + usernameGB + "/";
//     list.forEach((item) => {
//         const fileName = `${item.id}.mp4`
//         const downloadFile = fetch(item.url)
//         const file = fs.createWriteStream(folder + fileName)

//         downloadFile.then(res => {
//             res.body.pipe(file)
//             file.on("finish", () => {
//                 file.close()
//                 resolve()
//             });
//             file.on("error", (err) => reject(err));
//         });
//     });
// }


// const downloadMediaFromList = async (list) => {
//     console.log(`usernameGB= `);
//     console.log(usernameGB);
//     const folder = "downloads/" + usernameGB + "/";

//     // Check if directory exists, if not then create it
//     if (!fs.existsSync(folder)) {
//         fs.mkdirSync(folder, { recursive: true }); // The `recursive` option ensures all directories in the path are created
//     }

//     const downloadPromises = list.map((item) => {
//         return new Promise((resolve, reject) => {
//             const fileName = `${item.id}.mp4`;
//             const downloadFile = fetch(item.url);
//             const file = fs.createWriteStream(folder + fileName);

//             downloadFile.then(res => {
//                 res.body.pipe(file);
//                 file.on("finish", () => {
//                     file.close();
//                     resolve();
//                 });
//                 file.on("error", (err) => reject(err));
//             }).catch(err => reject(err));
//         });
//     });

//     // Wait for all downloads to complete
//     await Promise.all(downloadPromises);
// };
const chunkArray = (array, size) => {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunkedArr.push(chunk);
    }
    return chunkedArr;
};
// const downloadMediaFromList = async (list, descriptions) => {
//     const folder = "downloads/" + usernameGB + "/";

//     // Ensure folder exists
//     if (!fs.existsSync(folder)) {
//         fs.mkdirSync(folder, { recursive: true });
//     }

//     for (let i = 0; i < list.length; i++) {
//         const item = list[i];
//         // let sanitizedDescription = descriptions[i]?.replace(/[^a-zA-Z0-9]/g, '_')?.substring(0, 50);  // Sanitize and limit length
//         let sanitizedDescription = descriptions[i]?.replace(/[^a-zA-Z0-9 #]/g, ' ')  // Remove non-alphanumeric characters except spaces and #
//             .trim();
//         const fileName = `${item.id}_${sanitizedDescription}.mp4`;  // Include description in filename
//         const filePath = folder + fileName;

//         // Check if file already exists, if so, skip downloading
//         if (fs.existsSync(filePath)) {
//             console.log(`File ${fileName} already exists. Skipping download.`);
//             continue;
//         }
//         const downloadFile = fetch(item.url);
//         const file = fs.createWriteStream(folder + fileName);

//         downloadFile.then(res => {
//             res.body.pipe(file);
//             file.on("finish", () => {
//                 file.close();
//             });
//             file.on("error", (err) => {
//                 console.error("Error downloading file:", err);
//             });
//         });
//     }
// };
//đã thêm download theo batch
const downloadMediaFromList = async (list, descriptions, batchSize = 10) => {
    const folder = "downloads/" + usernameGB + "/";

    // Ensure folder exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    const batches = chunkArray(list, batchSize);

    for (let batch of batches) {
        const downloadPromises = batch.map((item, index) => {
            let sanitizedDescription = descriptions[index]?.replace(/[^a-zA-Z0-9 #]/g, ' ')  // Remove non-alphanumeric characters except spaces and #
                .trim();
            const fileName = `${item.id}_${sanitizedDescription}.mp4`;  // Include description in filename
            const filePath = folder + fileName;

            // Check if file already exists, if so, skip downloading
            if (fs.existsSync(filePath)) {
                console.log(`File ${fileName} already exists. Skipping download.`);
                return Promise.resolve();
            }

            const downloadFile = fetch(item.url);
            return new Promise((resolve, reject) => {
                downloadFile.then(res => {
                    const file = fs.createWriteStream(folder + fileName);
                    res.body.pipe(file);
                    file.on("finish", () => {
                        file.close();
                        resolve();
                    });
                    file.on("error", (err) => {
                        console.error("Error downloading file:", err);
                        reject(err);
                    });
                });
            });
        });

        await Promise.all(downloadPromises);

        // Optional: Introduce a delay between batches
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
};






const getVideoWM = async (url) => {
    const idVideo = await getIdVideo(url)
    const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
    const request = await fetch(API_URL, {
        method: "GET",
        headers: headers
    });
    const body = await request.text();
    try {
        var res = JSON.parse(body);
    } catch (err) {
        console.error("Error:", err);
        console.error("Response body:", body);
    }
    const urlMedia = res.aweme_list[0].video.download_addr.url_list[0]
    const data = {
        url: urlMedia,
        id: idVideo
    }
    return data
}

const getVideoNoWM = async (url) => {
    const idVideo = await getIdVideo(url)
    const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
    const request = await fetch(API_URL, {
        method: "GET",
        headers: headers
    });
    const body = await request.text();
    try {
        var res = JSON.parse(body);
    } catch (err) {
        console.error("Error:", err);
        console.error("Response body:", body);
    }
    const urlMedia = res.aweme_list[0].video.play_addr.url_list[0]
    const data = {
        url: urlMedia,
        id: idVideo
    }
    return data
}
async function getDescription(page) {
    return await page.evaluate(() => {
        const descriptionDiv = document.querySelector('div[data-e2e="browse-video-desc"]');
        if (descriptionDiv) {
            const texts = Array.from(descriptionDiv.querySelectorAll('span, a'), el => el.textContent);
            return texts.join('').trim();
        }
        return null;
    });
}

const getListVideoByUsername = async (username) => {
    var baseUrl = await generateUrlProfile(username)
    const browser = await puppeteer.launch({
        headless: false,
    })
    const page = await browser.newPage()
    page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36"
    );
    await page.goto(baseUrl)
    var listVideo = []
    console.log(chalk.green("[*] Getting list video from: " + username))
    var loop = true
    // await page.waitForFunction(() => {
    //     return new Promise((resolve) => {
    //         const scrollStep = window.innerHeight / 60;
    //         let scrollInterval = setInterval(function() {
    //             if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    //                 clearInterval(scrollInterval);
    //                 resolve(true);
    //             }
    //             window.scrollBy(0, scrollStep);
    //         }, 100);
    //     });
    // }, {timeout: 6000000}); // waits for 60 seconds

    // while(loop) {
    //     listVideo = await page.evaluate(() => {
    //         const listVideo = Array.from(document.querySelectorAll(".tiktok-1as5cen-DivWrapper > a"));
    //         return listVideo.map(item => item.getAttribute('href'));
    //     });
    //     console.log(chalk.green(`[*] ${listVideo.length} video found`))
    //     previousHeight = await page.evaluate("document.body.scrollHeight");
    //     await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    //     await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, {timeout: 10000})
    //     .catch(() => {
    //         console.log(chalk.red("[X] No more video found"));
    //         console.log(chalk.green(`[*] Total video found: ${listVideo.length}`))
    //         loop = false
    //     });
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
    // Check if CAPTCHA exists and wait until it disappears
    await page.waitForTimeout(4000);
    if (await page.$('#tiktok-verify-ele > div > div.captcha_verify_bar')) {
        console.log("CAPTCHA detected. Waiting until it disappears...");
        await page.waitForSelector('#tiktok-verify-ele > div > div.captcha_verify_bar', { hidden: true, timeout: 600000 });
        console.log("CAPTCHA is gone. Continuing the process...");
    }
    await page.waitForTimeout(1000);

    const links = await page.$$(".tiktok-1as5cen-DivWrapper > a");

    if (links.length > 0) {
        await links[0].click(); // Click the first link
        await page.waitForTimeout(2000); // Wait 2 seconds
        listVideo.push(await page.url());
        const description = await getDescription(page);
        if (description) {
            descriptions.push(description);
        }
        // Check if CAPTCHA exists and wait until it disappears
        if (await page.$('#tiktok-verify-ele > div > div.captcha_verify_bar')) {
            console.log("CAPTCHA detected. Waiting until it disappears...");
            await page.waitForSelector('#tiktok-verify-ele > div > div.captcha_verify_bar', { hidden: true, timeout: 600000 });
            console.log("CAPTCHA is gone. Continuing the process...");
        }
        while (await page.$('button[data-e2e="arrow-right"]')) {
            try {
                // Check if CAPTCHA exists and wait until it disappears
                if (await page.$('#tiktok-verify-ele > div > div.captcha_verify_bar')) {
                    console.log("CAPTCHA detected. Waiting until it disappears...");
                    await page.waitForSelector('#tiktok-verify-ele > div > div.captcha_verify_bar', { hidden: true, timeout: 600000 });
                    console.log("CAPTCHA is gone. Continuing the process...");
                }
                const button = await page.$('button[data-e2e="arrow-right"]');
                await button.click(); // Click the button
                await page.waitForTimeout(500); // Wait 0.5 seconds
                listVideo.push(await page.url());
                const description = await getDescription(page);
                if (description) {
                    descriptions.push(description);
                }
            } catch (error) {
                console.error("Hết video trong trang");
                // Depending on your use case, you can decide to break out of the loop if an error occurs
                break;
            }
        }
    } else {
        console.error("Could not find the desired links using the provided selector.");
    }
    await browser.close()
    console.log(listVideo)
    return listVideo
}
const getRedirectUrl = async (url) => {
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
        url = await fetch(url, {
            redirect: "follow",
            follow: 10,
        });
        url = url.url;
        console.log(chalk.green("[*] Redirecting to: " + url));
    }
    return url;
}

const getIdVideo = (url) => {
    const matching = url.includes("/video/")
    if (!matching) {
        console.log(chalk.red("[X] Error: URL not found"));
        exit();
    }
    const idVideo = url.substring(url.indexOf("/video/") + 7, url.length);
    return (idVideo.length > 19) ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
}

(async () => {
    const header = "\r\n \/$$$$$$$$ \/$$$$$$ \/$$   \/$$ \/$$$$$$$$ \/$$$$$$  \/$$   \/$$       \/$$$$$$$   \/$$$$$$  \/$$      \/$$ \/$$   \/$$ \/$$        \/$$$$$$   \/$$$$$$  \/$$$$$$$  \/$$$$$$$$ \/$$$$$$$ \r\n|__  $$__\/|_  $$_\/| $$  \/$$\/|__  $$__\/\/$$__  $$| $$  \/$$\/      | $$__  $$ \/$$__  $$| $$  \/$ | $$| $$$ | $$| $$       \/$$__  $$ \/$$__  $$| $$__  $$| $$_____\/| $$__  $$\r\n   | $$     | $$  | $$ \/$$\/    | $$  | $$  \\ $$| $$ \/$$\/       | $$  \\ $$| $$  \\ $$| $$ \/$$$| $$| $$$$| $$| $$      | $$  \\ $$| $$  \\ $$| $$  \\ $$| $$      | $$  \\ $$\r\n   | $$     | $$  | $$$$$\/     | $$  | $$  | $$| $$$$$\/        | $$  | $$| $$  | $$| $$\/$$ $$ $$| $$ $$ $$| $$      | $$  | $$| $$$$$$$$| $$  | $$| $$$$$   | $$$$$$$\/\r\n   | $$     | $$  | $$  $$     | $$  | $$  | $$| $$  $$        | $$  | $$| $$  | $$| $$$$_  $$$$| $$  $$$$| $$      | $$  | $$| $$__  $$| $$  | $$| $$__\/   | $$__  $$\r\n   | $$     | $$  | $$\\  $$    | $$  | $$  | $$| $$\\  $$       | $$  | $$| $$  | $$| $$$\/ \\  $$$| $$\\  $$$| $$      | $$  | $$| $$  | $$| $$  | $$| $$      | $$  \\ $$\r\n   | $$    \/$$$$$$| $$ \\  $$   | $$  |  $$$$$$\/| $$ \\  $$      | $$$$$$$\/|  $$$$$$\/| $$\/   \\  $$| $$ \\  $$| $$$$$$$$|  $$$$$$\/| $$  | $$| $$$$$$$\/| $$$$$$$$| $$  | $$\r\n   |__\/   |______\/|__\/  \\__\/   |__\/   \\______\/ |__\/  \\__\/      |_______\/  \\______\/ |__\/     \\__\/|__\/  \\__\/|________\/ \\______\/ |__\/  |__\/|_______\/ |________\/|__\/  |__\/\r\n\n by n0l3r (https://github.com/n0l3r)\n"
    console.log(chalk.blue(header))
    const choice = await getChoice();
    var listVideo = [];
    var listMedia = [];
    if (choice.choice === "Mass Download (Username)") {
        const usernameInput = await getInput("Enter the username with @ (e.g. @username) : ");
        const username = usernameInput.input;
        usernameGB = username;
        listVideo = await getListVideoByUsername(username);
        if (listVideo.length === 0) {
            console.log(chalk.yellow("[!] Error: No video found"));
            exit();
        }
    } else if (choice.choice === "Mass Download with (txt)") {
        var urls = [];
        // Get URL from file
        const fileInput = await getInput("Enter the file path : ");
        const file = fileInput.input;

        if (!fs.existsSync(file)) {
            console.log(chalk.red("[X] Error: File not found"));
            exit();
        }

        // read file line by line
        const rl = readline.createInterface({
            input: fs.createReadStream(file),
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            urls.push(line);
            console.log(chalk.green(`[*] Found URL: ${line}`));
        }


        for (var i = 0; i < urls.length; i++) {
            const url = await getRedirectUrl(urls[i]);
            listVideo.push(url);
        }
    } else {
        const urlInput = await getInput("Enter the URL : ");
        const url = await getRedirectUrl(urlInput.input);
        listVideo.push(url);
    }

    console.log(chalk.green(`[!] Found ${listVideo.length} video`));


    for (var i = 0; i < listVideo.length; i++) {
        console.log(chalk.green(`[*] Downloading video ${i + 1} of ${listVideo.length}`));
        console.log(chalk.green(`[*] URL: ${listVideo[i]}`));
        var data = await getVideoNoWM(listVideo[i]);

        listMedia.push(data);
    }

    downloadMediaFromList(listMedia, descriptions)
        .then(() => {
            console.log(chalk.green("[+] Downloaded successfully"));
        })
        .catch(err => {
            console.log(chalk.red("[X] Error: " + err));
        });


})();
