(async () => {
    try{
        // require
        const fs = require("fs")
        const puppeteer = require("puppeteer")

        // config
        const VIDEOS_FOLDER = "./videos"
        const PRESLEEP_TIME_YOUTUBE = 2500
        const SLEEP_TIME_YT_DOWNLOADER = 500

        // config outside (you need to prefill these files)
        const downloadUrls = fs.readFileSync("./downloadUrls.txt").toString().split("\n")

        // const (hardcoded, do not modify)
        const YT_DOWNLOADER_URL = "https://ytmp3.cc/"

        // main
        const downloadedVideosTitles = fs.readdirSync(VIDEOS_FOLDER).filter(fileName => fileName.slice(-4) === ".mp3").map(fileName => fileName.slice(0, -4))

        const browser = await puppeteer.launch()
        let numFinishedUrls = 0
        for(let url of downloadUrls) {
            const youtubePage = await browser.newPage()
            await youtubePage.goto(url)

            await new Promise(res => setTimeout(() => res(), PRESLEEP_TIME_YOUTUBE))
            try {
                const videoTitle = await youtubePage.evaluate(() => document.querySelector("#container > h1 > yt-formatted-string").innerText)
                await youtubePage.close()

                console.log(`Current song: ${videoTitle}`)
                if(!downloadedVideosTitles.includes(videoTitle)) {
                    console.log(`Saving ${videoTitle}...`)
                    const downloadPage = await browser.newPage()
                    await downloadPage.goto(YT_DOWNLOADER_URL)
                    downloadPage.on('console', msg => {
                      for (let i = 0; i < msg.args.length; ++i)
                        console.log(`${i}: ${msg.args[i]}`);
                    });
                    await downloadPage.evaluate((url) => document.getElementById("input").value = url, url)
                    await downloadPage.click("#submit")
                    await new Promise(res => setTimeout(() => res(), SLEEP_TIME_YT_DOWNLOADER))
                    const downloadUrl = await downloadPage.evaluate(() => document.getElementById("buttons").children[0].href)

                    const download = require("download")
                    console.log("...now downloading")
                    const data = await download(downloadUrl)
                    fs.writeFileSync(`${VIDEOS_FOLDER}/${videoTitle}.mp3`, data)
                    console.log("Downloaded!")
                }
                else console.log("...the song already exists")
            } 
            catch(e) { 
                console.log(e) 
            }
            finally {
                if(++numFinishedUrls === downloadUrls.length) process.exit(0)
                console.log(`${numFinishedUrls} / ${downloadUrls.length} songs finished...\n`)
            }
        }
        console.log("Reached the end!")
        process.exit(0)
    }
    catch(e) {
        console.log(e)
    }
})()