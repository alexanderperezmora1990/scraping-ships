/* eslint-disable no-unused-vars */
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {

    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    await page.goto('https://www.carnival.com/cruise-ships.aspx', {
        waitUntil: 'load',
        timeout: 0
    });
    await page.waitForSelector('.ship-result');

    let listShips = await page.evaluate(() => {
        const listId = Array.from(document.querySelectorAll('.ship-result')).map(d => d.getAttribute("data-id"));
        let shipsList = [];
        for (const id of listId) {
            try {
                let ship = {
                    name: document.querySelector(`[data-id=${id}] .mbl-title .title`).innerText,
                    imageShip: document.querySelector(`[data-id=${id}] .upper .image > img`).src,
                    principalUrl: document.querySelector(`[data-id=${id}] .upper`).href,
                    sailTo: Array.from(document.querySelectorAll(`[data-id=${id}] .text ul li:nth-child(1) a`)).map(element => { return { name: element.innerText, url: element.href } }),
                    sailFrom: Array.from(document.querySelectorAll(`[data-id=${id}] .text ul li:nth-child(2) a`)).map(element => { return { name: element.innerText, url: element.href } }),
                    duration: Array.from(document.querySelectorAll(`[data-id=${id}] .text ul li:nth-child(3) a`)).map(element => { return { name: element.innerText, url: element.href } }),
                };
                shipsList = [...shipsList, ship];
            } catch (error) {
                console.log(error);
            }
        }
        return shipsList;
    });
 
    for (let index = 0; index < listShips.length - 1; index++) {
        if (!listShips[index].principalUrl.includes('mardi-gras') && !listShips[index].principalUrl.includes('carnival-panorama')) {
            await page.goto(listShips[index].principalUrl, {
                waitUntil: 'load',
                timeout: 0
            });
            
            await page.waitForSelector('#overview');
            await page.click('.ccl-btn-read-more');
            listShips[index]['overview'] = await page.evaluate(() => {
                try {
                    const obj = {
                        description: Array.from(document.querySelectorAll('#overview blockquote p')).map(p => p.innerText),
                        grossTonnage: document.querySelectorAll('#overview > .blurb > .info > li:nth-child(1) > strong')[0].innerText,
                        guestCapacity: document.querySelectorAll('#overview > .blurb > .info > li:nth-child(2) > strong')[0].innerText,
                        lengthFeet: document.querySelectorAll('#overview > .blurb > .info > li:nth-child(3) > strong')[0].innerText,
                        onBoardCrew: document.querySelectorAll('#overview > .blurb > .info > li:nth-child(4) > strong')[0].innerText,
                    }
            
                    return obj;
                } catch (error) {
                    console.log(error);
                    return {}
                }  
            });
            
            await page.waitForSelector('#dining-activities');
            listShips[index]['onBoardActivities'] = await page.evaluate(() => {
                let activities = [];
                const list = document.querySelectorAll('[data-oba-carousel=ship_related_onboard] .oba-car-item').length;      
                try {
                    for (let index = 0; index < list-1; index++) {
                        const activitie = {
                         name: document.querySelector(`[data-oba-carousel=ship_related_onboard] [data-slick-index="${index}"] .oba-car-item-desc-title`).innerText,
                         image: 'https://www.carnival.com' + document.querySelector(`[data-oba-carousel=ship_related_onboard] [data-slick-index="${index}"] .oba-car-item-img`).style.backgroundImage.slice(4, -1).replace(/["']/g, ""),
                         additional:( document.querySelector(`[data-oba-carousel=ship_related_onboard] [data-slick-index="${index}"] .oba-car-item-desc-incl`).innerText == 'Additional') ? true : false
                        }
                        activities = [...activities, activitie]
                    }
                } catch (error) {
                    console.log(error);
                }
                return activities;
            });
            
            listShips[index]['onBoardDinning'] = await page.evaluate(() => {
                let activities = [];
                const list = document.querySelectorAll('[data-oba-carousel=ship_related_dining] .oba-car-item').length;      
                try {
                    for (let index = 0; index < list-1; index++) {
                        const activitie = {
                         name: document.querySelector(`[data-oba-carousel=ship_related_dining] [data-slick-index="${index}"] .oba-car-item-desc-title`).innerText,
                         image: 'https://www.carnival.com'+ document.querySelector(`[data-oba-carousel=ship_related_dining] [data-slick-index="${index}"] .oba-car-item-img`).style.backgroundImage.slice(4, -1).replace(/["']/g, ""),
                         additional:( document.querySelector(`[data-oba-carousel=ship_related_dining] [data-slick-index="${index}"] .oba-car-item-desc-incl`).innerText == 'Additional') ? true : false
                        }
                        activities = [...activities, activitie]
                    }
                } catch (error) {
                    console.log(error);
                }
                return activities;
            });
            
            
            await page.waitForSelector('#itinerary');
            listShips[index]['itinerary'] = await page.evaluate(() => {
                let activities = [];
                const list =   document.querySelectorAll('#itinerary .itin-car-item').length;
                try {
                    for (let index = 1; index < list; index++) {
                        const activitie = {
                            title: document.querySelector(`#itinerary .itin-car-item:nth-child(${index}) .ici-cgc__title-main`).innerText,
                            days: document.querySelector(`#itinerary .itin-car-item:nth-child(${index}) .ici-cgc__duration-content-days`).innerText,
                            price: document.querySelector(`#itinerary .itin-car-item:nth-child(${index}) .ici-info__desc-price__amount`).innerText,
                            image: 'https://www.carnival.com' + document.querySelector(`#itinerary .itin-car-item:nth-child(${index}) .itin-car-item__image`).style.backgroundImage.slice(4, -1).replace(/["']/g, ""),
                        };
                        activities = [...activities, activitie];
                    }
                } catch (error) {
                   console.log(error); 
                }
                return activities;
            });  
        }
    }
    fs.writeFileSync('./files/ships.json', JSON.stringify(listShips));
    await browser.close();
})();
