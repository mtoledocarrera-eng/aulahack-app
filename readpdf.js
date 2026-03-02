const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('Informe pedagógico - VECA - RBD 7404 - Colegio René Soriano.pdf');

pdf(dataBuffer).then(function (data) {
    fs.writeFileSync('agencia_report_extracted.txt', data.text);
    console.log('Successfully extracted the text from the PDF report.');
}).catch(function (error) {
    console.error('Error extracting text:', error);
});
