const Crawler = require('./crawler');
const Scraper = require('./scraper');
const ScrapeRule = require('./scrape-rule');
const parsers = require('./parsers');
const extractors = require('./extractors');
const urlMatchers = require('./url-matchers');

module.exports = {
    Crawler: Crawler,
    Scraper: Scraper,
    ScrapeRule: ScrapeRule,
    parsers: parsers,
    extractors: extractors,
    urlMatchers: urlMatchers
};
