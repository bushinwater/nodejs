const puppeteer = require('puppeteer');
const fs = require('fs');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const cron = require('node-cron');
const twilio = require('twilio');

//twilio podaci
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const wabroj = process.env.WHATSAPP_BROJ;
const twilioKlijent = twilio(accountSid, authToken);

//provera promena i slanje whatsappa
async function proveri_PromeneI_SaljiObavestenje() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const url = 'https://finance.yahoo.com/';
    await page.goto(url);


    //custom visina i duzina
    await page.setViewport({ width: 1000, height: 1000 });

    //png1
    await page.screenshot({ path: 'snimak1.png' });

    //png2
    await page.screenshot({ path: 'snimak2.png' });

    await browser.close();

    //Uporedjuje slike
    const img1 = PNG.sync.read(fs.readFileSync('snimak1.png'));
    const img2 = PNG.sync.read(fs.readFileSync('snimak2.png'));

    const { width, height } = img1;
    const razlika = new PNG({ width, height });

    const razlicitiPikseli = pixelmatch(img1.data, img2.data, razlika.data, width, height, { threshold: 0.1 });

    //slika sa razlikama
    fs.writeFileSync('razlika.png', PNG.sync.write(razlika));

    //pošalji WhatsApp obaveštenje ako dođe do promena na sajtu
    if (razlicitiPikseli > 0) {
        console.log(`Sajt se promenio! Detektovano ${razlicitiPikseli} različitih piksela.`);
        posalji_WhatsApp();
    } else {
        console.log('Sajt se nije promenio.');
    }
}

//funkcija za slanje WhatsApp obaveštenja
function posalji_WhatsApp() {
    twilioKlijent.messages
        .create({
            body: 'Promena na oglasnoj tabli!',
            from: 'whatsapp:+14155238886', // twilio broj
            to: wabroj
        })
        .then(message => console.log('WhatsApp obaveštenje poslato:', message.sid))
        .catch(error => console.error('Greška prilikom slanja WhatsApp obaveštenja:', error));
}

//da se pokreće svakih 10 minuta
cron.schedule('*/1 * * * *', () => {
    proveri_PromeneI_SaljiObavestenje();
});
