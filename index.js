const cors = require('cors')({ origin: true});
const cheerio = require('cheerio');
const getUrls = require('get-urls');
const fetch = require('node-fetch');

const scrapeMetatags = async (url, maxPages = 10) => {
        console.log("Procesando pagina " + maxPages);
        const res = await fetch(url);

        const html = await res.text();
        const $ = cheerio.load(html);

        const listHtml = $('.listing__item');

        const houses = listHtml.toArray().map((house) => {
            const $house = $(house);
            const $contactButton = $house.find('.btn-secondary');
            const $commonData = $house.find('.card__common-data');
            const $titleData = $house.find('.card__title');
            const $addressData = $house.find('.card__address');
            const $infoData = $house.find('.card__info');
            const $expensesData = $house.find('.card__expenses');
            const photos = $house.find('.card__photos img').toArray().map(img => {
                const $img = $(img);
                return $img.data('src');
            });


            return {
                refId: $contactButton.data('aviso-id'),
                price: $contactButton.data('precio'),
                currency: $contactButton.data('moneda'),
                expenses: $expensesData.attr('title'),
                photos: photos,
                title: $titleData.attr('title'),
                description: $infoData.text().replace(/\n/g,"").trim(),
                surface: $($commonData.children().get(0)).text(),
                pieces: $($commonData.children().get(1)).text(),
                age: $($commonData.children().get(2)).text(),
                address: $addressData.text().replace(/\n/g,"").trim(),
            };
        });

        const nextButton = $('.pagination__page-next a').get(0);


        if (nextButton && maxPages > 0) {
            const newHouses = await scrapeMetatags("https://www.argenprop.com" + $(nextButton).attr('href'), maxPages - 1);

            houses.push(...newHouses);
        } else {
            return houses
        }


        return houses;
};

(async () => {
    const propertyType = process.argv[2] ? process.argv[2] : 'inmuebles';
    const contractType = process.argv[3] ? process.argv[3] : 'venta';
    const metatags = await scrapeMetatags(`https://www.argenprop.com/${process.argv[2]}-${process.argv[3]}`);
    console.log(metatags);
})();

