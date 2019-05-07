const axios = require('../../utils/axios');
const cheerio = require('cheerio');
const dateUtil = require('../../utils/date');
var iconv = require("iconv-lite");

module.exports = async (ctx) => {
    // filter=heat&orderby=heats 最热
    // filter=hot 热帖
    var orderby = ctx.params.orderBy || 'lastpost';
    var filter = ctx.params.filter || 'lastpost'
    var result = await axios({
        url: `https://www.52pojie.cn/forum.php?mod=forumdisplay&fid=66&orderby=${orderby}&filter=${filter}&page=1`,
        method: "get",
        headers: {
            "Cookie": "_uab_collina=154476639456556606267881; Hm_lvt_46d556462595ed05e05f009cdafff31a=1545724179,1545724502,1546418799,1546832718; htVD_2132_pc_size_c=0; htVD_2132_atarget=1; htVD_2132_saltkey=PFk9zNm8; htVD_2132_lastvisit=1547001587; htVD_2132_ulastactivity=1547005876%7C0; htVD_2132_auth=9bf7fz%2FC2CkKGLUNpXNwXfVcG3H6qEG7Z%2Fdbp5DOPCXm3MoKgr3QWK1wmG8i6spVP5EIDtMLQKz%2FJtT7H5G7hxJtwAs; htVD_2132_lastcheckfeed=827605%7C1547005876; htVD_2132_checkfollow=1; htVD_2132_lip=101.95.172.74%2C1547005876; htVD_2132_connect_is_bind=1; htVD_2132_ttask=827605%7C20190109; htVD_2132_visitedfid=66; htVD_2132_checkpm=1; Hm_lpvt_46d556462595ed05e05f009cdafff31a=1547005893; htVD_2132_lastact=1547005892%09forum.php%09forumdisplay; htVD_2132_st_t=827605%7C1547005892%7C85774013a21a4b5dd8a53638bd369665; htVD_2132_forum_lastvisit=D_66_1547005892",
            "Host": "www.52pojie.cn",
            "Referer": "https://www.52pojie.cn/forum-66-1.html",
        },
        responseType: "arraybuffer"

    })
    var $ = cheerio.load(iconv.decode(result.data, "gbk"))
    var list = $("#threadlisttableid tbody").filter((i, e) => {
        return $(e).attr("id") && $(e).attr("id").startsWith("normalthread");
    });
    const count = [];
    for (let i = 0; i < list.length; i++) {
        count.push(i);
    }
    count.map(async (i) => {
        var tr = $(list[i]);
        var category = tr.find("th>em>a").text();
        var a = tr.find(".xst");
        var link = "https://www.52pojie.cn/" + a.attr("href");
        var pubDate = tr.find(".by span").text()
        const item = {
            title: a.text(),
            pubDate: dateUtil(pubDate, 0),
            link: link,
            category: category
        };
        const key = '52pojie_fuli_' + link;
        const value = await ctx.cache.get(key);

        if (value) {
            item.description = value;
        } else {
            loadContent(item).then((data) => {
                item = data
            })
        }
        return item;

    })

    function loadContent(item) {
        return new Promise((resolve) => {
            setTimeout(() => {
                axios({
                    method: 'get',
                    url: item.link,
                    responseType: "arraybuffer"
                }).then((detail) => {
                    const content = cheerio.load(iconv.decode(detail.data, "gbk"));
                    item.description = content('.t_fsz').html();
                    ctx.cache.set(key, item.description, 12 * 60 * 60);
                    resolve(item);

                });
            }, 2000);
        })
    }


    ctx.state.data = {
        title: '52破解 - 福利专区',
        link: 'https://www.52pojie.cn/forum.php?mod=forumdisplay&fid=66&filter=lastpost&orderby=lastpost',
        item: resultItem,
    };
};
