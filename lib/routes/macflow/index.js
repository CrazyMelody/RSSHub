const axios = require('../../utils/axios');
const cheerio = require('cheerio');
const dateUtil = require('../../utils/date');

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

            const item = {
                title: a.text(),
                link: a.attr("href"),
                pubDate: dateUtil($(list[i]).find(".date").text(), 0)
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
