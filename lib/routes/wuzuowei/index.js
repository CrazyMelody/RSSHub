const axios = require('../../utils/axios');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    var result = await axios({
        url: "https://www.wuzuowei.net/",
        method: "get"
    })
    var $ = cheerio.load(result.data)
    var list = $(".excerpt");
    const count = [];
    for (let i = 0; i < list.length; i++) {
        count.push(i);
    }
    const resultItem = await Promise.all(
        count.map(async (i) => {
            var a = $(list[i]).find("h2 a")

            const date = new Date($(list[i]).find('time').text().match(/\d{4}-\d{2}-\d{2}/));
            const timeZone = 8;
            const serverOffset = date.getTimezoneOffset() / 60;
            const pubDate = new Date(date.getTime() - 60 * 60 * 1000 * (timeZone + serverOffset)).toUTCString();

            const item = {
                title: a.text(),
                link: a.attr("href"),
                pubDate: pubDate
            };
            const key = 'wuzuowei_' + item.link;
            const value = await ctx.cache.get(key);

            if (value) {
                item.description = value;
            } else {
                const detail = await axios({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detail.data);
                content(".asb").remove();
                item.description = content('article').html();
                ctx.cache.set(key, item.description, 12 * 60 * 60);
            }
            return Promise.resolve(item);
        })
    );


    ctx.state.data = {
        title: '无作为资源',
        link: 'https://www.wuzuowei.net/',
        item: resultItem,
    };
};
