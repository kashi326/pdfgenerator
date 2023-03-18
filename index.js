const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const multer  = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/convert', upload.single('html'), async (req, res) => {
  try {
    const htmlFile = req.file;
    console.log(htmlFile,"htmlFile");
    const html = fs.readFileSync(htmlFile.path, 'utf-8');

    // Compile the HTML template using Handlebars
    const template = handlebars.compile(html);
    const compiledHtml = template({});

    // Launch a headless browser using Puppeteer
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();

    // Set the page content to the compiled HTML
    await page.setContent(compiledHtml);

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

    // Save the PDF to disk
    const pdfPath = path.join(__dirname, 'public', 'output.pdf');
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