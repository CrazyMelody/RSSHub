const axios = require('../../utils/axios');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    var result = await axios({
        url: "http://share.weimo.info/",
        method: "get"
    })
    var $ = cheerio.load(result.data)
    var list = $("article");
    const count = [];
    for (let i = 0; i < list.length; i++) {
        count.push(i);
    }
    const resultItem = await Promise.all(
        count.map(async (i) => {
            var a = $(list[i]).find(".post-title a")

            const date = new Date(
                $(list[i]).find('.post-date')
                .text()
                .match(/\d{4}-\d{2}-\d{2}/)
            );
            const timeZone = 8;
            const serverOffset = date.getTimezoneOffset() / 60;
            const pubDate = new Date(date.getTime() - 60 * 60 * 1000 * (timeZone + serverOffset)).toUTCString();

            const item = {
                title: decode(a.text()),
                link: a.attr("href"),
                pubDate: pubDate
            };
            const key = 'share_weimo_' + item.link;
            const value = await ctx.cache.get(key);

            if (value) {
                item.description = value;
            } else {
                const detail = await axios({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detail.data);
                item.description = decode(content('.content-post-body').html());
                ctx.cache.set(key, item.description, 24 * 60 * 60);
            }
            return Promise.resolve(item);
        })
    );

    function decode(str) {
        return unescape(str.replace(/&#x/g, '%u').replace(/;/g, ''))
    }


    ctx.state.data = {
        title: '微末分享',
        link: 'http://share.weimo.info/',
        item: resultItem,
    };
};
