const fs = require('fs');
const url = require('url');
const request = require('request');
const cheerio = require('cheerio');

const urlMatchers = require('./url-matchers');
const DEFAULT_MAX_THREAD_COUNT = 10;

function Crawler (baseUrl, scraper, options = {}) {
    var self = this;

    this.baseUrl = baseUrl;
    this.scraper = scraper;
    this.urlMatcher = options.urlMatcher || urlMatchers.getDefaultUrlMatcher(baseUrl);

    this._currentThreadCount = 0;
    this.maxThreadCount = options.maxThreadCount || DEFAULT_MAX_THREAD_COUNT;

    this.promise = new Promise(function(resolve, reject){
        self._resolve = resolve;
        self._reject = reject;
    });

    this.queue = [baseUrl];
    this.crawled = [];
    this.scrapedData = [];
}

Crawler.prototype._currentThreadCount = null;

Crawler.prototype._resolve = null;

Crawler.prototype._reject = null;

Crawler.prototype.promise = null;

Crawler.prototype.baseUrl = null;

Crawler.prototype.scraper = null;

Crawler.prototype.urlMatcher = null;

Crawler.prototype.maxThreadCount = null;

Crawler.prototype.queue = null;

Crawler.prototype.crawled = null;

Crawler.prototype.scrapedData = null;

Crawler.prototype.shouldCrawl = function(url){
    return this.urlMatcher.test(url) &&
        -1 === this.queue.indexOf(url) &&
        -1 === this.crawled.indexOf(url);
};

Crawler.prototype.getPage = function (url){
    return new Promise(function(resolve, reject){
        request(url, function(error, response, body){
            if(error){
                return reject(error);
            }

            resolve({
                url: url,
                response: response,
                $: cheerio.load(body)
            });
        });
    });
};

Crawler.prototype.collectLinks = function (page){
    let allLinks = page.$('a[href]')
        .map(function(index, linkNode){
            try {
                return url
                    .resolve(baseUrl, linkNode.attribs.href)
                    .split('#')[0];
            } catch (e){
                return '';
            }
        })
        .toArray();

    // return all unique links after stripping search params and hash
    return allLinks.filter(function(link, index){
        return link && index === allLinks.indexOf(link);
    });
};

Crawler.prototype.crawl = function(){
    if(!this.queue.length){
        this._resolve(self.scrapedData);
        return this.promise;
    }

    let self = this;
    let currentURL = this.queue.shift();

    this._currentThreadCount++;
    this.crawled.push(currentURL);

    self.getPage(currentURL).then(function(page){
        // collect links on page for further crawling
        let allUniquePageLinks = self.collectLinks(page);

        for(let link of allUniquePageLinks){
            if(self.shouldCrawl(link)){
                if(self.scraper.shouldScrape(link)){
                    self.queue.unshift(link);
                } else {
                    self.queue.push(link);
                }
            }
        }

        // scrape data from current page
        if(self.scraper.shouldScrape(currentURL)){
            self.scrapedData.push({
                url: currentURL,
                data: self.scraper.scrape(page)
            });
        }
    }).finally(function(){
        self._currentThreadCount--;

        if(!self.queue.length){
            self._resolve(self.scrapedData);
        } else if(self._currentThreadCount < self.maxThreadCount){
            self.crawl();
        }
    });

    return this.promise;
};

module.exports = Crawler;
