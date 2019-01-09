const axios = require('../../utils/axios');
const cheerio = require('cheerio');
const dateUtil = require('../../utils/date');

module.exports = async (ctx) => {
    var result = await axios({
        url: "http://8ym.cn/rptlist",
        method: "get"
    })
    var $ = cheerio.load(result.data)
    var list = $(".list-group-item");
    const count = [];
    for (let i = 0; i < list.length; i++) {
        count.push(i);
    }
    const resultItem = await Promise.all(
        count.map(async (i) => {
            var a = $(list[i]);
            var link = "http://8ym.cn" + a.attr("href");
            const item = {
                title: a.children()[0].next.data,
                pubDate: dateUtil(a.find(".today").text(), 0)
            };
            const key = '8ym_' + link;
            const value = await ctx.cache.get(key);

            const link_key = '8ym_link_' + item.link;
            const link_value = await ctx.cache.get(link_key);

            if (value) {
                item.description = value;
                item.link = link_value;
            } else {
                const detail = await axios({
                    method: 'get',
                    url: "http://8ym.cn" + a.attr("href"),
                });
                const content = cheerio.load(detail.data);
                item.link = content(".page-header a").attr("href")
                item.description = content('.box').html();
                ctx.cache.set(key, item.description, 1 * 60 * 60);
            }
            return Promise.resolve(item);
        })
    );


    ctx.state.data = {
        title: '8ym',
        link: 'http://8ym.cn/rptlist',
        item: resultItem,
    };
};
