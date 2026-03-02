import sys
import fitz

doc = fitz.open("Informe pedagógico - VECA - RBD 7404 - Colegio René Soriano.pdf")
text = ""
for page in doc:
    text += page.get_text()

with open("agencia_report_extracted.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Text extracted successfully.")
