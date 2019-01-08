const axios = require('../../utils/axios');
const cheerio = require('cheerio');
const moment = require("moment")
module.exports = async (ctx) => {
    var result = await axios({
        url: "https://macflow.net/",
        method: "get"
    })
    var $ = cheerio.load(result.data)
    var list = $(".article-list .item");
    const count = [];
    for (let i = 0; i < list.length; i++) {
        count.push(i);
    }
    const resultItem = await Promise.all(
        count.map(async (i) => {
            var a = $(list[i]).find(".item-title a")

            // const date = new Date($(list[i]).find('time').text().match(/\d{4}-\d{2}-\d{2}/));
            // const timeZone = 8;
            // const serverOffset = date.getTimezoneOffset() / 60;
            var date = $(list[i]).find(".date").text();
            var pubDate;
            if (date.endsWith("天前")) {
                pubDate = moment().subtract(date.slice(0, 1), "days").hours(8).minutes(0).seconds(0).milliseconds(0);
            } else {
                pubDate = moment(date, 'YYYY年MM月DD日').add("8", "hours").minutes(0).seconds(0).milliseconds(0);
            }
            const item = {
                title: a.text(),
                link: a.attr("href"),
                pubDate: pubDate
            };
            const key = 'macflow_' + item.link;
            const value = await ctx.cache.get(key);

            if (value) {
                item.description = value;
            } else {
                const detail = await axios({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detail.data);
                item.description = content('.entry-content').html();
                ctx.cache.set(key, item.description, 12 * 60 * 60);
            }
            return Promise.resolve(item);
        })
    );


    ctx.state.data = {
        title: 'MacFlow',
        link: 'https://macflow.net/',
        item: resultItem,
    };
};
