const fs = require('fs');
const url = require('url');
const request = require('request');
const cheerio = require('cheerio');

const valueExtractors = require('./extractors');
const valueParsers = require('./parsers');

function getPage(url){
    return new Promise(function(resolve, reject){
        request(url, function(error, response, body){
            if(error){
                return reject(error);
            }

            resolve(body);
        });
    });
}

let cheerioLoad = cheerio.load.bind(cheerio);

function getHtml (url) {
    return getPage(url).then(cheerioLoad);
}

function collectLinks($, baseUrl){
    let allLinks = $('a[href]')
        .map(function(index, linkNode){
            try {
                return url
                    .resolve(baseUrl, linkNode.attribs.href)
                    .split('?')[0]
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
}

function getDefaultUrlMatcher(baseUrl){
    let urlObject = url.parse(baseUrl);
    return new RegExp(urlObject.hostname.replace('.', '\\.'), 'g');
}

function Scraper (baseUrl, scrapeRules, options = {}) {
    this.baseUrl = baseUrl;
    this.scrapeRules = scrapeRules;
    this.crawlUrlMatcher = options.crawlUrlMatcher = getDefaultUrlMatcher(baseUrl);
    this.scrapeUrlMatcher = options.scrapeUrlMatcher || getDefaultUrlMatcher(baseUrl);

    this.queue = [baseUrl];
    this.crawled = [];
    this.scrapedData = [];
}

Scraper.prototype.shouldCrawl = function(url){
    return this.crawlUrlMatcher.test(url) &&
        -1 === this.queue.indexOf(url) &&
        -1 === this.crawled.indexOf(url);
};

Scraper.prototype.shouldScrape = function(url){
    return this.scrapeUrlMatcher.test(url);
};

Scraper.prototype.crawl = function(){
    let self = this;
    let currentURL = this.queue.shift();

    if(!currentURL){
        return this.scrapedData;
    }

    this.crawled.push(currentURL);

    return getHtml(currentURL).then(function($){
        for(let link of collectLinks($, currentURL)){
            if(self.shouldCrawl(link)){
                if(self.shouldScrape(link)){
                    self.queue.unshift(link);
                } else {
                    self.queue.push(link);
                }
            }
        }

        if(self.scrapeUrlMatcher.test(currentURL)){
            self.scrapedData.push({
                url: currentURL,
                data: self.scrapeHtml($)
            });
        }

        return self.crawl();
    }, function(){
        return self.crawl();
    });
};

Scraper.prototype.scrapeHtml = function($){
    let scrapeRules = this.scrapeRules;
    let data = {};

    for (let key of Object.keys(scrapeRules)) {
        let selector = scrapeRules[key].selector;
        let extractValue = scrapeRules[key].extract || valueExtractors.text;
        let transformers = [].concat(scrapeRules[key].transformers || []);
        let value = extractValue($(selector));

        for (let transform of transformers) {
            value = transform(value)
        }

        data[key] = value;
    }

    return data;
};

// static members
Scraper.valueExtractors = valueExtractors;
Scraper.valueParsers = valueParsers;

module.exports = Scraper;
