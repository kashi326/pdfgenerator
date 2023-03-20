const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '50mb' }));
const navigationTimeout = 60 * 1000
app.post('/convert-html', async (req, res) => {
  try {
    const html = req.body.html;
    // console.log(req.body,"req.body");

    // Compile the HTML template using Handlebars
    const template = handlebars.compile(html,{ strict: true });
    const compiledHtml = template({});

    // Launch a headless browser using Puppeteer
    const browser = await puppeteer.launch({ headless: true , devtools: true, });
    const page = await browser.newPage();

    // Set the page content to the compiled HTML
    await page.setContent(compiledHtml, { timeout: 0 })
    // const setContentPromise = new Promise((resolve, reject) => {
    //   page.on('error', reject);
    //   page.on('pageerror', reject);
    //   page.on('load', resolve);
    //   page.setContent(compiledHtml, { timeout: navigationTimeout })
    // });

    // await Promise.race([setContentPromise, new Promise((resolve, reject) => {
    //   setTimeout(() => reject(new Error('Navigation timeout')), navigationTimeout);
    // })]);

    // Generate a PDF with the same dimensions as the browser viewport
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm',
      },
    });
    await page.close()

    // Save the PDF to disk
    const pdfPath = path.join(__dirname, 'uploads', 'output.pdf');
    fs.writeFileSync(pdfPath, pdf);

    const url = `http://localhost:5000/output.pdf`;
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

app.listen(5000, () => {
  console.log('Server listening on port 5000');
});
